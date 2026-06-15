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

// cspell:words VWNAI

// Covers the AccountWarning dialog suppression rule
// (src/components/AccountWarning/AccountWarning.tsx:41-89):
// dialog appears on a /game/ page for correspondence-in-progress,
// is suppressed for live-in-progress, and reappears once the live game ends.

/*
 * Uses init_e2e data (reused from cm-ack-warning.ts):
 * - E2E_CM_VWNAI_ACCUSED : user supposedly used AI
 * - "E2E CM VWNAI Game" : game in which the AI use supposedly occurred
 * - E2E_CM_VWNAI_AI_V1 : AI assessor (community moderator) who votes
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import {
    captureReportNumber,
    goToUsersFinishedGame,
    loginAsUser,
    navigateToReport,
    newTestUsername,
    prepareNewUser,
    reportUser,
    setupSeededCM,
} from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { navigateToActiveGame, playMoves, resignActiveGame } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";
import { createTestLogger } from "@helpers/logger";

const REPORT_MESSAGE = "E2E test reporting AI use: I just have this feeling.";
const AI_ASSESSOR = "E2E_CM_VWNAI_AI_V1";

export const warningDialogDuringGamesTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const log = createTestLogger(testInfo);
    log("warning-dialog-during-games: starting");

    // Set up the CM once; both scenarios reuse this page.
    const { seededCMPage: aiCMPage } = await setupSeededCM(createContext, AI_ASSESSOR);

    // -----------------------------------------------------------------
    // Scenario A: correspondence game in progress -> dialog APPEARS
    // -----------------------------------------------------------------
    log("Scenario A (correspondence): starting");

    const corrReporterName = newTestUsername("WarnCorrRep"); // cspell:disable-line
    const corrOpponentName = newTestUsername("WarnCorrOpp"); // cspell:disable-line
    const { userPage: corrReporterPage } = await prepareNewUser(
        createContext,
        corrReporterName,
        "test",
    );
    const { userPage: corrOpponentPage } = await prepareNewUser(
        createContext,
        corrOpponentName,
        "test",
    );

    await withReportCountTracking(corrReporterPage, testInfo, async (tracker) => {
        await goToUsersFinishedGame(corrReporterPage, "E2E_CM_VWNAI_ACCUSED", "E2E CM VWNAI Game");
        await reportUser(corrReporterPage, "E2E_CM_VWNAI_ACCUSED", "ai_use", REPORT_MESSAGE);
        log("Scenario A: report filed");

        await tracker.assertCountIncreasedBy(corrReporterPage, 1);
        const corrReportNumber = await captureReportNumber(corrReporterPage);

        // Option values for correspondence-byoyomi match those in
        // e2e-tests/challenge-modal/ch-handicap-prefs.ts:51-55.
        await createDirectChallenge(corrReporterPage, corrOpponentName, {
            ...defaultChallengeSettings,
            gameName: "E2E Warn Dialog Corr Game",
            boardSize: "9x9",
            speed: "correspondence",
            timeControl: "byoyomi",
            mainTime: "604800",
            timePerPeriod: "86400",
            periods: "5",
        });
        await acceptDirectChallenge(corrOpponentPage);
        log("Scenario A: correspondence challenge accepted");

        // For correspondence games neither player auto-navigates to the
        // new game (ChallengesList.tsx:89-94). The reporter must explicitly
        // open the game from their active-games list so the AccountWarning
        // suppression check can apply on a /game/ URL.
        await navigateToActiveGame(corrReporterPage);
        log("Scenario A: reporter on correspondence game page");

        await navigateToReport(aiCMPage, corrReportNumber);
        await expect(aiCMPage.getByText(REPORT_MESSAGE)).toBeVisible();
        await aiCMPage.locator('input[value="no_ai_use_bad_report"]').click();
        const corrVote = await expectOGSClickableByName(aiCMPage, /Vote$/);
        await corrVote.click();
        log("Scenario A: CM vote cast");

        // Correspondence games are NOT suppressed
        // (AccountWarning.tsx:45 -> speed === "correspondence" passes through).
        // 15 s mirrors cm-ack-warning.ts:103.
        await expect(corrReporterPage.locator("div.AccountWarning")).toBeVisible({
            timeout: 15000,
        });
        log("Scenario A: dialog visible on correspondence game page");
        await expect(
            corrReporterPage
                .locator("div.AccountWarning")
                .locator("div.canned-message.no_ai_use_bad_report"),
        ).toBeVisible();

        await corrReporterPage
            .locator("div.AccountWarning")
            .locator("input[type='checkbox']")
            .click();
        const corrOk = corrReporterPage.locator("div.AccountWarning").locator("button.primary");
        await expect(corrOk).toBeEnabled({ timeout: 15000 });
        await corrOk.click();
        await expect(corrReporterPage.locator("div.AccountWarning")).not.toBeVisible();
        log("Scenario A: dialog acknowledged");

        await tracker.assertCountReturnedToInitial(corrReporterPage);
    });

    log("Scenario A: complete");

    // -----------------------------------------------------------------
    // Scenario B: live game in progress -> dialog SUPPRESSED,
    // then reappears after the game ends via resignation.
    // -----------------------------------------------------------------
    log("Scenario B (live): starting");

    const liveReporterName = newTestUsername("WarnLiveRep"); // cspell:disable-line
    const liveOpponentName = newTestUsername("WarnLiveOpp"); // cspell:disable-line
    const { userPage: liveReporterPage } = await prepareNewUser(
        createContext,
        liveReporterName,
        "test",
    );
    const { userPage: liveOpponentPage } = await prepareNewUser(
        createContext,
        liveOpponentName,
        "test",
    );

    await withReportCountTracking(liveReporterPage, testInfo, async (tracker) => {
        await goToUsersFinishedGame(liveReporterPage, "E2E_CM_VWNAI_ACCUSED", "E2E CM VWNAI Game");
        await reportUser(liveReporterPage, "E2E_CM_VWNAI_ACCUSED", "ai_use", REPORT_MESSAGE);
        log("Scenario B: report filed");

        await tracker.assertCountIncreasedBy(liveReporterPage, 1);
        const liveReportNumber = await captureReportNumber(liveReporterPage);

        // Live byoyomi: 45 s main, 10 s/period, 1 period. Mirrors basic-scoring.ts:54-58.
        await createDirectChallenge(liveReporterPage, liveOpponentName, {
            ...defaultChallengeSettings,
            gameName: "E2E Warn Dialog Live Game",
            boardSize: "9x9",
            speed: "live",
            timeControl: "byoyomi",
            mainTime: "45",
            timePerPeriod: "10",
            periods: "1",
        });
        await acceptDirectChallenge(liveOpponentPage);
        log("Scenario B: live game started");

        // Play 6 moves so resign is past goban.engine.gameCanBeCancelled()
        // (PlayButtons.tsx:460-464 selects "Resign" vs "Cancel game").
        await playMoves(
            liveReporterPage,
            liveOpponentPage,
            ["E5", "E6", "D5", "D6", "F5", "F6"],
            "9x9",
        );
        log("Scenario B: 6 moves played");

        // CM votes warn -> warning queued for the live reporter.
        await navigateToReport(aiCMPage, liveReportNumber);
        await expect(aiCMPage.getByText(REPORT_MESSAGE)).toBeVisible();
        await aiCMPage.locator('input[value="no_ai_use_bad_report"]').click();
        const liveVote = await expectOGSClickableByName(aiCMPage, /Vote$/);
        await liveVote.click();
        log("Scenario B: CM vote cast");

        // The dialog should NOT appear on the reporter's game page,
        // because AccountWarning.tsx:87-89 returns null when the URL
        // includes "game/" AND the game is live-in-progress. 15 s mirrors
        // the positive timeout used in cm-ack-warning.ts:103 -- a slow
        // load that would have shown the dialog in that window would
        // have been caught.
        log("Scenario B: entering 15s wait to assert dialog hidden");
        await expect(liveReporterPage.locator("div.AccountWarning")).toBeHidden({
            timeout: 15000,
        });
        log("Scenario B: dialog correctly hidden during live game");

        // Sanity check: confirm the warning DID arrive (else the previous
        // assertion could have passed for the wrong reason). Open a second
        // context as the same reporter, visit /, expect the dialog to
        // appear, then close the context WITHOUT acking. (Acking would
        // consume the warning; viewing does not.)
        log("Scenario B: opening sanity tab to confirm warning arrived");
        const sanityContext = await createContext();
        const sanityPage = await sanityContext.newPage();
        await loginAsUser(sanityPage, liveReporterName, "test");
        await sanityPage.goto("/");
        await expect(sanityPage.locator("div.AccountWarning")).toBeVisible({
            timeout: 15000,
        });
        log("Scenario B: warning confirmed present on home page (sanity tab)");
        await sanityContext.close();

        // Reporter resigns the live game. The PlayButtons.tsx:509 button
        // now reads "Resign" (not "Cancel game") because we played 6 moves.
        await resignActiveGame(liveReporterPage);
        log("Scenario B: resign complete");

        // With phase === "finished", AccountWarning.tsx's 1Hz poll
        // (lines 74-79) clears displayPending and the dialog mounts.
        await expect(liveReporterPage.locator("div.AccountWarning")).toBeVisible({
            timeout: 5000,
        });
        log("Scenario B: dialog visible after resign");

        // Ack the dialog so the report-count tracker can assert clean state.
        await liveReporterPage
            .locator("div.AccountWarning")
            .locator("input[type='checkbox']")
            .click();
        const liveOk = liveReporterPage.locator("div.AccountWarning").locator("button.primary");
        await expect(liveOk).toBeEnabled({ timeout: 15000 });
        await liveOk.click();
        await expect(liveReporterPage.locator("div.AccountWarning")).not.toBeVisible();
        log("Scenario B: dialog acknowledged");

        await tracker.assertCountReturnedToInitial(liveReporterPage);
    });

    log("Scenario B: complete");
    log("warning-dialog-during-games: done");
};
