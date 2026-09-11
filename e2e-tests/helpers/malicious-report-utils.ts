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

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

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

/** Each parallel worker owns a seeded filer, including its warning queue. */
export function maliciousReportFilerUsername(): string {
    const index = test.info().parallelIndex;
    if (index >= 32) {
        throw new Error("init_e2e provides 32 malicious-report filers; use at most 32 workers");
    }
    return `E2E_CM_MR_FILER_${index}`;
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
): Promise<string> {
    const submitted = cmPage.waitForResponse(
        (response) =>
            new URL(response.url()).pathname === "/api/v1/moderation/incident" &&
            response.request().method() === "POST",
    );
    const [response] = await Promise.all([
        submitted,
        reportUser(cmPage, sourceReporterUsername, "malicious_report", note),
    ]);
    expect(response.ok(), `Malicious report response: ${response.status()}`).toBe(true);
    const result: { report: number } = await response.json();
    expect(result.report).toBeGreaterThan(0);
    return `R${result.report}`;
}

/**
 * Play a short 9x9 game between `victimPage` and `opponentPage`. Opponent
 * resigns, so the victim wins.
 *
 * Returns the game URL (read from victimPage after the game ends).
 *
 * Note: this helper deliberately does not have either player file the
 * subsequent source report. Doing so from a player's page after resignation
 * is flaky — post-game state (AI processing, dialogs) re-renders the side
 * panel and closes the PlayerDetails popover before the Report button is
 * clicked. The source report should be filed by a third-party user from a
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
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "120",
        timePerPeriod: "30",
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
 * the game — and have them file a score_cheating report against the victim.
 * The malicious-report gate requires the source report to be score_cheating.
 *
 * Using a fresh user (rather than one of the game players) sidesteps post-game
 * render churn that closes the PlayerDetails popover. See note on
 * `setupEscapingSourceGame`.
 *
 * The caller is expected to have set up the game already and have its URL.
 */
export interface SourceScoreCheatingReportSetup {
    sourceReporterUsername: string;
    sourceReporterPage: Page;
    sourceReporterContext: BrowserContext;
    sourceReportNumber: string;
}

export async function createSourceScoreCheatingReport(
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    gameUrl: string,
    victimUsername: string,
    rolePrefix: string,
    reporterNote: string,
): Promise<SourceScoreCheatingReportSetup> {
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

    log(`[MR] Source reporter filing score-cheating report against ${victimUsername}`);
    await reportUser(sourceReporterPage, victimUsername, "score_cheating", reporterNote);

    const sourceReportNumber = await captureReportNumber(sourceReporterPage);
    log(`[MR] Source score-cheating report filed: ${sourceReportNumber}`);

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
 *  3. Source reporter (third party) files a score_cheating report against the victim.
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
    const { userPage: victimPage, userContext: victimContext } = await prepareNewUser(
        createContext,
        victimUsername,
        "test",
    );

    const opponentUsername = newTestUsername(opponentRolePrefix);
    const { userPage: opponentPage, userContext: opponentContext } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    const gameUrl = await setupEscapingSourceGame(victimPage, opponentPage, opponentUsername);
    await Promise.all([victimContext.close(), opponentContext.close()]);

    // Third-party source reporter files a score_cheating report against the victim
    const {
        sourceReporterUsername,
        sourceReporterPage,
        sourceReporterContext,
        sourceReportNumber,
    } = await createSourceScoreCheatingReport(
        createContext,
        gameUrl,
        victimUsername,
        sourceReporterRolePrefix,
        "E2E test: filing a bogus score-cheating report so a CM can mark it malicious.",
    );

    const { seededCMPage: filerPage, seededCMContext: filerContext } = await setupSeededCM(
        createContext,
        maliciousReportFilerUsername(),
    );
    await navigateToReport(filerPage, sourceReportNumber);
    const maliciousReportNumber = await fileMaliciousReport(
        filerPage,
        sourceReporterUsername,
        filerNote,
    );
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
