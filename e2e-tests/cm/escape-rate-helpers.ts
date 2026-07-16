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

import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { log } from "@helpers/logger";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves, waitForGameViewReady } from "@helpers/game-utils";
import { captureReportNumber, navigateToReport, reportPlayerByColor } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

/**
 * Play a 9x9 game between reporter (black) and accused (white),
 * ending by pass+accept. Returns the game URL.
 */
export async function playAndFinishGame(
    reporterPage: Page,
    accusedPage: Page,
    accusedUsername: string,
    gameIndex: number,
): Promise<void> {
    // Override defaultChallengeSettings' 2s/2s blitz timing — under a loaded
    // dev stack the 4-move play sequence can exhaust either player's time
    // and end the game by timeout rather than pass+accept, leaving the test
    // waiting forever on the "Pass"/"Accept" buttons. 60s main + 1×10s
    // byoyomi gives ample headroom while still being "live" speed.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName: `E2E ERH Game ${gameIndex}`,
        boardSize: "9x9",
        speed: "live",
        mainTime: "60",
        timePerPeriod: "10",
        periods: "1",
        color: "black",
    });

    await acceptDirectChallenge(accusedPage);

    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Play a few moves (need >= 2 for escaping report applicability)
    await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

    // End the game: both pass, both accept scoring
    await reporterPage.getByText("Pass", { exact: true }).click();
    await accusedPage.getByText("Pass", { exact: true }).click();

    const accusedAccept = accusedPage.getByText("Accept");
    await expect(accusedAccept).toBeVisible();
    await accusedAccept.click();

    const reporterAccept = reporterPage.getByText("Accept");
    await expect(reporterAccept).toBeVisible();
    await reporterAccept.click();

    await expect(reporterPage.getByText("wins by")).toBeVisible();

    // Five sequential games + reports overload the dev stack: the server's
    // Game.ended write trails behind the WS phase-finished event the goban
    // already rendered, so the next escaping report on this game gets
    // rejected by moderate.py:714-725 (HTTP 400). A deliberate 30 s pause
    // lets the post-game pipeline (WS → DB write, queue drain) quiesce
    // before we move on. Heavy but reliable; see e2e-tests/AGENTS.md.
    log(`[cm-escape-rate-display] Game ${gameIndex} ended — pausing 30 s to quiesce`);
    await reporterPage.waitForTimeout(30000);
}

/**
 * File an escaping report on the current game page, then have 3 CMs
 * vote the specified action to resolve it. Returns the report number so
 * the caller can navigate back to verify resolved-report behaviour.
 */
export async function reportAndVote(
    reporterPage: Page,
    cmPages: Page[],
    voteAction: string,
): Promise<string> {
    // Wait for the post-game view to settle (PlayerCard avatars, AIReview)
    // before opening PlayerDetails.
    await waitForGameViewReady(reporterPage);

    // Report the accused (white) for escaping
    await reportPlayerByColor(
        reporterPage,
        ".white",
        "escaping",
        "E2E test: player escaped this game",
    );

    const reportNumber = await captureReportNumber(reporterPage);

    // 3 CMs vote to reach consensus
    for (const cmPage of cmPages) {
        await navigateToReport(cmPage, reportNumber);
        await cmPage.locator(`input[value="${voteAction}"]`).click();
        const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
        await voteButton.click();
    }

    return reportNumber;
}
