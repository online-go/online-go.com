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

/*
 * No seeded data in use
 */

import { Browser, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";

export const modRejectEscapeReportDuringGameTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: reporterPage } = await prepareNewUser(
        browser,
        newTestUsername("modREscDur"), // cspell:disable-line
        "test",
    );

    const reportedUsername = newTestUsername("modREscRep"); // cspell:disable-line
    const { userPage: reportedPage } = await prepareNewUser(browser, reportedUsername, "test");

    // Reporter challenges the reported user
    await createDirectChallenge(reporterPage, reportedUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Mod Escape Report Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
    });

    // Reported user accepts
    await acceptDirectChallenge(reportedPage);

    // Reporter is black
    // Wait for the Goban to be visible & definitely ready
    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await reporterPage.waitForTimeout(1000);

    // Wait for the game state to indicate it's the reporter's move
    const reportersMove = reporterPage.getByText("Your move", { exact: true });
    await expect(reportersMove).toBeVisible();

    // Play a few moves to establish the game is underway
    // Need at least 6 moves to allow resignation
    const moves = ["D5", "E5", "D6", "E6", "D7", "E7"];

    await playMoves(reporterPage, reportedPage, moves, "9x9");

    // Try to report escaping during the game - this should be blocked
    const playerLink = reporterPage.locator(`.white.player-name-container a.Player`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Ensure the dropdown stays open
    await playerLink.click();

    await expect(reporterPage.getByRole("button", { name: /Report$/ })).toBeVisible();
    await reporterPage.getByRole("button", { name: /Report$/ }).click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    const notesBoxDuringGame = reporterPage.locator(".notes");

    // Fill in the notes
    await expect(notesBoxDuringGame).toBeVisible();
    await notesBoxDuringGame.fill("E2E test - attempting to report during active game");

    // Try to submit the report during the game - this should fail
    const reportButtonDuringGame = reporterPage.getByRole("button", { name: /Report User$/ });
    await expect(reportButtonDuringGame).toBeEnabled();
    await reportButtonDuringGame.click();

    // Should get an error message (backend blocks the report)
    await expect(reporterPage.getByText(/There was an error submitting your report/)).toBeVisible();

    // Close the error alert
    await reporterPage.getByRole("button", { name: "OK" }).click();

    // Now finish the game by passing and scoring
    // Both players pass
    const reporterPass = reporterPage.getByText("Pass", { exact: true });
    await expect(reporterPass).toBeVisible();
    await reporterPass.click();

    const reportedPass = reportedPage.getByText("Pass", { exact: true });
    await expect(reportedPass).toBeVisible();
    await reportedPass.click();

    // Both players accept the score
    const reportedAccept = reportedPage.getByText("Accept");
    await expect(reportedAccept).toBeVisible();
    await reportedAccept.click();

    const reporterAccept = reporterPage.getByText("Accept");
    await expect(reporterAccept).toBeVisible();
    await reporterAccept.click();

    // Verify game is finished
    const reporterFinished = reporterPage.getByText("wins by");
    await expect(reporterFinished).toBeVisible();

    // Now try to report escaping after the game - this should be allowed
    const playerLinkAfterGame = reporterPage.locator(`.white.player-name-container a.Player`);
    await expect(playerLinkAfterGame).toBeVisible();
    await playerLinkAfterGame.hover(); // Ensure the dropdown stays open
    await playerLinkAfterGame.click();

    await expect(reporterPage.getByRole("button", { name: /Report$/ })).toBeVisible();
    await reporterPage.getByRole("button", { name: /Report$/ }).click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    const notesBoxAfterGame = reporterPage.locator(".notes");

    // Fill in the notes
    await expect(notesBoxAfterGame).toBeVisible();
    await notesBoxAfterGame.fill("E2E test - reporting after game ended");

    // Try to submit the report after the game - this should succeed
    const reportButtonAfterGame = reporterPage.getByRole("button", { name: /Report User$/ });
    await expect(reportButtonAfterGame).toBeEnabled();
    await reportButtonAfterGame.click();

    // Should get success message
    await expect(reporterPage.getByText("Thanks for the report!")).toBeVisible();

    // Close the success alert
    await reporterPage.getByRole("button", { name: "OK" }).click();
};
