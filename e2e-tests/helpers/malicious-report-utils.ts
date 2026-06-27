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
import { playMoves, resignActiveGame, waitForGameViewReady } from "./game-utils";
import { log } from "./logger";
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
    options: { stableForMs?: number; timeoutMs?: number; intervalMs?: number } = {},
): Promise<Set<string>> {
    const stableForMs = options.stableForMs ?? 1500;
    const timeoutMs = options.timeoutMs ?? 20000;
    const intervalMs = options.intervalMs ?? 300;
    const requiredStableSamples = Math.max(2, Math.ceil(stableForMs / intervalMs));

    // Navigate directly to the my_reports route — clicking the sidebar
    // "My Own Reports" tab is unreliable when the page is mid-transition
    // out of a report-detail view (the click can match the wrong element
    // or fail to update the active category).
    await page.goto("/reports-center/my_reports");

    let lastSnapshot = "";
    let stableSamples = 0;
    let lastIds: string[] = [];

    // Poll until the visible set has been the same for `requiredStableSamples`
    // consecutive reads (i.e. has not mutated for ~`stableForMs`). expect.poll
    // gives us proper Playwright timeout diagnostics; the polling cadence is
    // controlled by `intervals`.
    await expect
        .poll(
            async () => {
                lastIds = await page
                    .locator("button[data-report-id]")
                    .evaluateAll((nodes) =>
                        nodes
                            .map((n) => (n as HTMLElement).getAttribute("data-report-id"))
                            .filter((id): id is string => !!id),
                    );
                const snapshot = lastIds.slice().sort().join(",");
                if (snapshot === lastSnapshot) {
                    stableSamples++;
                } else {
                    lastSnapshot = snapshot;
                    stableSamples = 1;
                }
                return stableSamples;
            },
            { timeout: timeoutMs, intervals: [intervalMs] },
        )
        .toBeGreaterThanOrEqual(requiredStableSamples);

    return new Set(lastIds);
}

/**
 * After filing a new report, poll the user's "My Own Reports" list until an
 * id appears that's greater than every id in `previous`, then return it as
 * `R<id>`. Report ids are sequential integers, so "highest id greater than
 * max(previous)" pins the just-filed report regardless of the order older
 * reports trickle in via websocket sync.
 *
 * Don't delegate the wait to readOwnReportIds: its stability check returns
 * "empty for stableForMs" as a positive result, but for the post-filing
 * read an empty list might just mean the new report hasn't synced yet. We
 * poll until we positively see a matching id, or time out.
 */
export async function waitForNewOwnReport(
    page: Page,
    previous: Set<string>,
    timeoutMs = 30000,
): Promise<string> {
    const previousMax = Math.max(0, ...Array.from(previous, (id) => Number(id)));

    // Navigate straight to /reports-center/my_reports rather than clicking the
    // sidebar tab. The tab click can fail to switch the active view when the
    // URL was previously /reports-center/all/<id> (a report-detail view) —
    // depending on which element matches "My Own Reports", the click may not
    // fire the category-route change. The /my_reports URL is unambiguous.
    await page.goto("/reports-center/my_reports");

    let newestId = -1;
    await expect
        .poll(
            async () => {
                // evaluateAll callback runs in the browser context, so we
                // can't reference previousMax there. Pull all ids and
                // filter in Node.
                const allIds = await page
                    .locator("button[data-report-id]")
                    .evaluateAll((nodes) =>
                        nodes.map((n) =>
                            Number((n as HTMLElement).getAttribute("data-report-id") ?? -1),
                        ),
                    );
                const newer = allIds.filter((n) => n > previousMax);
                if (newer.length > 0) {
                    newestId = Math.max(...newer);
                }
                return newestId;
            },
            { timeout: timeoutMs, intervals: [300] },
        )
        .toBeGreaterThan(0);

    return `R${newestId}`;
}

/**
 * Cancel an own report from the user's "My Own Reports" page. Uses the FULL
 * report id via the `data-report-id` attribute — the displayed report number
 * is truncated to its three least-significant digits, so matching by text
 * would mis-target older reports that share those digits.
 *
 * Idempotent: returns silently if no row with that report id is present
 * (e.g. the report was already resolved by voting).
 */
export async function cancelOwnReport(page: Page, reportNumber: string): Promise<void> {
    const reportId = reportNumber.replace(/^R/, "");

    await page.goto("/reports-center/my_reports");

    // Wait for the specific row we want to cancel to appear. If it never
    // does within a short bound, the report has already been resolved (or
    // was never present) — nothing to cancel.
    const reportButton = page.locator(`button[data-report-id="${reportId}"]`);
    const present = await reportButton
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => true)
        .catch(() => false);
    if (!present) {
        log(`[MR] cancelOwnReport(${reportNumber}): already gone (resolved or never present)`);
        return;
    }

    const reportContainer = page.locator("div.incident").filter({ has: reportButton });
    const cancelButton = reportContainer.locator("button.reject.xs", { hasText: "Cancel" });
    if ((await cancelButton.count()) === 0) {
        log(`[MR] cancelOwnReport(${reportNumber}): no Cancel button (already resolved)`);
        return;
    }
    await cancelButton.click();
    // Wait for the row to disappear so the next nav sees a stable list.
    await expect(reportButton).toHaveCount(0, { timeout: 10000 });
    log(`[MR] Cancelled own report ${reportNumber}`);
}

/**
 * Cancel every pending own-report visible to `page`'s logged-in user. Used
 * at the start of MR tests on the seeded CM filer to defend against
 * dangling reports left behind by crashes or flakes — without cleanup
 * they accumulate, scroll off-screen, eventually get paged, and slow every
 * subsequent test's baseline.
 *
 * Optimised for the clean case: reads the "My Own Reports (N)" tab title
 * — which encodes the count and updates reactively as the report_manager
 * syncs — and returns once that title has been stable for ~600ms with
 * no count. In the steady state this is ~800ms total. The dirty path
 * (count > 0) clicks in, enumerates row ids via readOwnReportIds, and
 * cancels each row inline.
 */
export async function cancelAllOwnReports(
    page: Page,
    options: { maxIterations?: number } = {},
): Promise<number> {
    const maxIterations = options.maxIterations ?? 10;

    await page.goto("/reports-center");

    // Wait for the My-Own-Reports tab title to settle. The title encodes
    // the count: "My Own Reports" (zero) or "My Own Reports (N)". Polling
    // a single text node is far cheaper than waiting for the report-list
    // DOM to stabilize.
    const titleEl = page
        .locator("#ReportsCenterCategoryList .Category .title")
        .filter({ hasText: /^My Own Reports/ });
    let lastText = "";
    let stableSamples = 0;
    await expect
        .poll(
            async () => {
                const t = (await titleEl.textContent()) ?? "";
                if (t === lastText) {
                    stableSamples++;
                } else {
                    lastText = t;
                    stableSamples = 1;
                }
                return stableSamples;
            },
            { timeout: 5000, intervals: [150] },
        )
        .toBeGreaterThanOrEqual(4); // 4 × 150ms = ~600ms stable

    const match = lastText.match(/My Own Reports \((\d+)\)/);
    if (!match) {
        log(`[MR] cancelAllOwnReports: clean state (title="${lastText}")`);
        return 0;
    }

    // Dirty path: enumerate and cancel. readOwnReportIds navigates to the
    // /reports-center/my_reports route itself; no tab click needed here.
    let totalCancelled = 0;
    for (let i = 0; i < maxIterations; i++) {
        const ids = await readOwnReportIds(page);
        if (ids.size === 0) {
            log(`[MR] cancelAllOwnReports: cancelled ${totalCancelled} report(s) total`);
            return totalCancelled;
        }
        log(`[MR] cancelAllOwnReports: pass ${i + 1}, cancelling ${ids.size} report(s)`);
        for (const id of ids) {
            const button = page.locator(`button[data-report-id="${id}"]`);
            const container = page.locator("div.incident").filter({ has: button });
            const cancelBtn = container.locator("button.reject.xs", { hasText: "Cancel" });
            if ((await cancelBtn.count()) === 0) {
                continue;
            }
            await cancelBtn.click();
            await expect(button).toHaveCount(0, { timeout: 10000 });
            totalCancelled++;
        }
    }

    throw new Error(
        `cancelAllOwnReports exceeded ${maxIterations} passes; pending reports won't drain`,
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
    log(`[MR] Filing malicious_report against ${sourceReporterUsername}`);
    await reportUser(cmPage, sourceReporterUsername, "malicious_report", note);
    log(`[MR] Malicious_report submit completed`);
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
    log(`[MR] Source game: victim challenges ${opponentUsername}`);
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

    log(`[MR] Source game ended; victim won, opponent resigned`);
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
    log(`[MR] Creating third-party source reporter ${sourceReporterUsername}`);
    const { userPage: sourceReporterPage, userContext: sourceReporterContext } =
        await prepareNewUser(createContext, sourceReporterUsername, "test");

    await sourceReporterPage.goto(gameUrl);
    // Wait for the full game-view to be painted and settled. Without this,
    // late-arriving renders (.player-icon-container content, .AIReview)
    // can shift the layout while the PlayerDetails popover is opening,
    // dismissing it before reportUser can click the Report button.
    await waitForGameViewReady(sourceReporterPage);

    log(`[MR] Source reporter filing escaping report against ${victimUsername}`);
    await reportUser(sourceReporterPage, victimUsername, "escaping", reporterNote);

    const sourceReportNumber = await captureReportNumber(sourceReporterPage);
    log(`[MR] Source escaping report filed: ${sourceReportNumber}`);

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
    log(`[MR] Logging in seeded CM filer E2E_CM_MR_FILER`);
    const { seededCMPage: filerPage, seededCMContext: filerContext } = await setupSeededCM(
        createContext,
        "E2E_CM_MR_FILER",
    );

    // Drain any pending own-reports from earlier crashed/flaked runs. Cheap
    // (~800ms) when the filer is already clean. Without this, accumulated
    // reports slow the baseline read and risk pagination artifacts.
    await cancelAllOwnReports(filerPage);

    // Snapshot the filer's baseline own-report IDs. After the cancel-all
    // above this is normally empty in steady state, which makes
    // waitForNewOwnReport's "id > max(previous)" trivially correct.
    const previousOwnReportIds = await readOwnReportIds(filerPage);
    log(`[MR] Filer baseline: ${previousOwnReportIds.size} pre-existing own report(s)`);

    await navigateToReport(filerPage, sourceReportNumber);
    await fileMaliciousReport(filerPage, sourceReporterUsername, filerNote);

    const maliciousReportNumber = await waitForNewOwnReport(filerPage, previousOwnReportIds);
    log(`[MR] Malicious report captured: ${maliciousReportNumber}`);
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
