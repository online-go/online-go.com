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

import { submitReportVote } from "@helpers/report-utils";
import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { passAndScoreGame, playMoves, waitForGameViewReady } from "@helpers/game-utils";
import { captureReportNumber, navigateToReport, reportPlayerByColor } from "@helpers/user-utils";

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
    // This fixture tests report history; browser speed must not decide the outcome.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName: `E2E ERH Game ${gameIndex}`,
        boardSize: "9x9",
        speed: "live",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
        color: "black",
    });

    await acceptDirectChallenge(accusedPage);

    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Play a few moves (need >= 2 for escaping report applicability)
    await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

    await passAndScoreGame(reporterPage, accusedPage);

    const gameId = new URL(reporterPage.url()).pathname.match(/\/game\/(\d+)/)?.[1];
    expect(gameId).toBeDefined();
    await expect
        .poll(
            async () => {
                const response = await reporterPage.request.get(`/api/v1/games/${gameId}`);
                await expect(response).toBeOK();
                const game: { ended: string | null } = await response.json();
                return game.ended;
            },
            { message: "Game completion is persisted before reporting", timeout: 30000 },
        )
        .toBeTruthy();
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
        await submitReportVote(cmPage);
    }

    return reportNumber;
}
