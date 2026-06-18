/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect, type BrowserContext, type Page } from "@playwright/test";

import {
    captureReportNumber,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "./user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "./challenge-utils";
import { playMoves, resignActiveGame } from "./game-utils";
import type { CreateContextOptions } from "../helpers";

/**
 * Helpers for the malicious-report e2e flow.
 *
 * A malicious_report is filed by a moderator against the reporting_user of an
 * existing source report. These helpers handle the boilerplate of setting up a
 * source report and marking it malicious, so individual tests can focus on the
 * specific vote/visibility behavior they're exercising.
 */

/**
 * Dismiss any leftover AccountWarning / AccountWarningAck / AccountWarningInfo
 * messages on the given page. Seeded users (the CM filer in particular)
 * accumulate acks across test runs; a stale ack's backdrop intercepts clicks
 * on the underlying page. Call this after logging a seeded user in and before
 * driving UI that needs the foreground.
 *
 * Defensive: handles formal warnings too (require checkbox + timer) even
 * though the filer in practice only ever receives acks.
 */
export async function dismissPendingAcks(page: Page): Promise<void> {
    await page.goto("/");
    // Warnings are rendered based on user-data fetched from the API; that can
    // take a few seconds after navigation. Wait for the page to settle before
    // deciding there's nothing to dismiss.
    await page.waitForLoadState("networkidle").catch(() => undefined);

    for (let i = 0; i < 20; i++) {
        const dialog = page
            .locator(".AccountWarningAck, .AccountWarningInfo, .AccountWarning")
            .first();
        // First iteration: wait up to 5s for an ack to materialize. Subsequent
        // iterations: only 1s, since if there is another queued ack it should
        // render almost immediately after we dismissed the previous one.
        const waitMs = i === 0 ? 5000 : 1000;
        try {
            await dialog.waitFor({ state: "visible", timeout: waitMs });
        } catch {
            return;
        }

        // Formal AccountWarning needs the checkbox ticked and waits for a timer
        // before its OK enables. Ack and Info OK buttons are enabled immediately.
        const checkbox = dialog.locator("input[type='checkbox']");
        if ((await checkbox.count()) > 0) {
            await checkbox.click();
        }

        const okButton = dialog.locator("button.primary");
        await expect(okButton).toBeEnabled({ timeout: 20000 });
        await okButton.click();
        await dialog.waitFor({ state: "hidden", timeout: 5000 });
    }
}

/**
 * Read the set of report IDs visible on the current user's "My Own Reports"
 * page. Each report is rendered with a `<button data-report-id="...">`.
 *
 * The client's report_manager populates this list incrementally as websocket
 * messages arrive — so a naive "wait for the first one, then read .last()" can
 * miss reports that haven't synced yet. This helper polls until the visible
 * set is stable for `stableForMs`, then returns the result.
 *
 * Used to diff before/after filing so we can pick out the just-created report
 * reliably, regardless of sync order.
 */
export async function readOwnReportIds(
    page: Page,
    options: { stableForMs?: number; timeoutMs?: number } = {},
): Promise<Set<string>> {
    const stableForMs = options.stableForMs ?? 2500;
    const timeoutMs = options.timeoutMs ?? 20000;

    await page.goto("/reports-center");
    await expect(page.getByText("My Own Reports")).toBeVisible();
    await page.getByText("My Own Reports").click();

    const deadline = Date.now() + timeoutMs;
    let previousSnapshot = "";
    let stableSince = Date.now();
    let lastIds: string[] = [];

    while (Date.now() < deadline) {
        lastIds = await page
            .locator("button[data-report-id]")
            .evaluateAll((nodes) =>
                nodes
                    .map((n) => (n as HTMLElement).getAttribute("data-report-id"))
                    .filter((id): id is string => !!id),
            );
        const snapshot = lastIds.slice().sort().join(",");
        if (snapshot !== previousSnapshot) {
            previousSnapshot = snapshot;
            stableSince = Date.now();
        } else if (Date.now() - stableSince >= stableForMs) {
            return new Set(lastIds);
        }
        await page.waitForTimeout(500);
    }
    // Timed out; return what we have. The caller (e.g. waitForNewOwnReport)
    // will re-check and may still succeed.
    return new Set(lastIds);
}

/**
 * After filing a new report, poll the user's "My Own Reports" page until an
 * ID appears that's higher than every id in `previous`. Returns the new id
 * as `R<id>`.
 *
 * Report ids are sequential integers, so "higher than all previous" is a
 * stronger and more robust check than "not in the previous set". The latter
 * race-fails when readOwnReportIds saw an incomplete snapshot before filing
 * (websocket sync of older reports trailing in afterward), causing an old
 * id to look "new".
 */
export async function waitForNewOwnReport(
    page: Page,
    previous: Set<string>,
    timeoutMs = 30000,
): Promise<string> {
    const previousMax = Math.max(0, ...Array.from(previous, (id) => Number(id)));
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const ids = await readOwnReportIds(page);
        let newestId = -1;
        for (const id of ids) {
            const n = Number(id);
            if (n > previousMax && n > newestId) {
                newestId = n;
            }
        }
        if (newestId > 0) {
            return `R${newestId}`;
        }
        await page.waitForTimeout(1000);
    }
    throw new Error(
        `Timed out after ${timeoutMs}ms waiting for a new own-report (id > ${previousMax}) to appear in My Own Reports`,
    );
}

/**
 * File a malicious_report against the reporter of the source report the CM
 * is currently viewing. Driven through the standard PlayerDetails -> Report
 * dialog flow (the dedicated modal was removed in the 2026-06-18 redesign).
 *
 * Caller must have `cmPage` already navigated to the source report's detail
 * view; the URL must match /reports-center/all/<id> so the
 * checkMaliciousReportApplicability gate passes.
 */
export async function fileMaliciousReport(
    cmPage: Page,
    sourceReporterUsername: string,
    note: string,
): Promise<void> {
    await reportUser(cmPage, sourceReporterUsername, "malicious_report", note);
}

/**
 * Play a short 9x9 game between `victimPage` and `opponentPage`. Opponent
 * resigns, so the victim wins. The victim did NOT resign, which is what the
 * escaping report applicability check requires (it rejects reports against
 * players who resigned).
 *
 * Returns the game URL (read from victimPage after the game ends).
 *
 * Note: this helper deliberately does not have either player file the
 * subsequent escaping report. Doing so from a player's page after resignation
 * is flaky — post-game state (AI processing, dialogs) re-renders the side
 * panel and closes the PlayerDetails popover before the Report button is
 * clicked. The escaping report should be filed by a third-party user from a
 * fresh navigation to this URL.
 */
export async function setupEscapingSourceGame(
    victimPage: Page,
    opponentPage: Page,
    opponentUsername: string,
): Promise<string> {
    await createDirectChallenge(victimPage, opponentUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E MR Source Game",
        boardSize: "9x9",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
    });
    await acceptDirectChallenge(opponentPage);

    const goban = victimPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // >=2 moves so the escaping report applicability check passes
    await playMoves(victimPage, opponentPage, ["D5", "E5", "D6", "E6", "D7", "E7"], "9x9", 0);

    // Opponent resigns. Victim wins. Escaping report against the victim is
    // then applicable (it would be rejected if the victim had resigned).
    await resignActiveGame(opponentPage);

    return victimPage.url();
}

/**
 * Create a fresh "source reporter" — a third-party user who is not a player in
 * the game — and have them file an escaping report against the victim.
 *
 * Using a fresh user (rather than one of the game players) sidesteps post-game
 * render churn that closes the PlayerDetails popover. See note on
 * `setupEscapingSourceGame`.
 *
 * The caller is expected to have set up the game already and have its URL.
 */
export interface SourceEscapingReportSetup {
    sourceReporterUsername: string;
    sourceReporterPage: Page;
    sourceReporterContext: BrowserContext;
    sourceReportNumber: string;
}

export async function createSourceEscapingReport(
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    gameUrl: string,
    victimUsername: string,
    rolePrefix: string,
    reporterNote: string,
): Promise<SourceEscapingReportSetup> {
    const sourceReporterUsername = newTestUsername(rolePrefix);
    const { userPage: sourceReporterPage, userContext: sourceReporterContext } =
        await prepareNewUser(createContext, sourceReporterUsername, "test");

    await sourceReporterPage.goto(gameUrl);
    await sourceReporterPage.locator(".Goban[data-pointers-bound]").waitFor({ state: "visible" });

    await reportUser(sourceReporterPage, victimUsername, "escaping", reporterNote);

    const sourceReportNumber = await captureReportNumber(sourceReporterPage);

    return {
        sourceReporterUsername,
        sourceReporterPage,
        sourceReporterContext,
        sourceReportNumber,
    };
}

/**
 * Full setup of a malicious_report:
 *  1. Create fresh victim, opponent, and source reporter users.
 *  2. Victim and opponent play a short game; opponent resigns (victim wins).
 *  3. Source reporter (third party) files an escaping report against the victim.
 *  4. CM filer marks that source report as malicious.
 *
 * Returns both report numbers and the source-reporter / filer pages and
 * contexts so tests can verify warnings/acks delivered to them.
 */
export interface MaliciousReportSetup {
    sourceReporterUsername: string;
    sourceReporterPage: Page;
    sourceReporterContext: BrowserContext;
    victimUsername: string;
    sourceReportNumber: string;
    maliciousReportNumber: string;
    filerPage: Page;
    filerContext: BrowserContext;
}

export async function setupMaliciousReport(
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    options: {
        filerNote?: string;
        sourceReporterRolePrefix?: string;
        victimRolePrefix?: string;
        opponentRolePrefix?: string;
    } = {},
): Promise<MaliciousReportSetup> {
    const sourceReporterRolePrefix = options.sourceReporterRolePrefix ?? "MRsRep";
    const victimRolePrefix = options.victimRolePrefix ?? "MRsVic";
    const opponentRolePrefix = options.opponentRolePrefix ?? "MRsOpp";
    const filerNote =
        options.filerNote ??
        "E2E test: this looks like a malicious report - the reporter is targeting someone in bad faith.";

    // Victim plays a game (and wins by opponent's resignation)
    const victimUsername = newTestUsername(victimRolePrefix);
    const { userPage: victimPage } = await prepareNewUser(createContext, victimUsername, "test");

    const opponentUsername = newTestUsername(opponentRolePrefix);
    const { userPage: opponentPage } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    const gameUrl = await setupEscapingSourceGame(victimPage, opponentPage, opponentUsername);

    // Third-party source reporter files an escaping report against the victim
    const {
        sourceReporterUsername,
        sourceReporterPage,
        sourceReporterContext,
        sourceReportNumber,
    } = await createSourceEscapingReport(
        createContext,
        gameUrl,
        victimUsername,
        sourceReporterRolePrefix,
        "E2E test: filing a bogus escaping report so a CM can mark it malicious.",
    );

    // CM filer marks the source report as malicious
    const { seededCMPage: filerPage, seededCMContext: filerContext } = await setupSeededCM(
        createContext,
        "E2E_CM_MR_FILER",
    );

    // Clear any leftover acks from previous runs — their backdrop would
    // intercept clicks on the "Mark as malicious report" button below.
    await dismissPendingAcks(filerPage);

    // Snapshot the filer's existing own-report IDs. The filer is a seeded user
    // and may have accumulated MRs filed across earlier test runs. We will
    // identify our just-filed MR as whichever ID appears after the modal
    // submit that wasn't there before — relying on captureReportNumber alone
    // would race against the websocket sync that populates My Own Reports.
    const previousOwnReportIds = await readOwnReportIds(filerPage);

    await navigateToReport(filerPage, sourceReportNumber);
    await fileMaliciousReport(filerPage, sourceReporterUsername, filerNote);

    const maliciousReportNumber = await waitForNewOwnReport(filerPage, previousOwnReportIds);
    if (maliciousReportNumber === sourceReportNumber) {
        throw new Error(
            "Captured malicious-report number equals the source report number; the malicious_report was not created",
        );
    }

    return {
        sourceReporterUsername,
        sourceReporterPage,
        sourceReporterContext,
        victimUsername,
        sourceReportNumber,
        maliciousReportNumber,
        filerPage,
        filerContext,
    };
}
