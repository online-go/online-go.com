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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser, tickReportAttestations } from "@helpers/user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { passAndScoreGame, playMoves } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

export const modBlockEscapeReportDuringGameTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("modREscDur"), // cspell:disable-line
        "test",
    );

    const reportedUsername = newTestUsername("modREscRep"); // cspell:disable-line
    const { userPage: reportedPage } = await prepareNewUser(
        createContext,
        reportedUsername,
        "test",
    );

    // Reporter challenges the reported user, taking white deliberately: ranked
    // challenges (the default here) disable custom komi entirely, so automatic
    // komi's default advantage to white is unavoidable. With only a handful of
    // symmetric center stones and no captures, that advantage decides the game —
    // putting the reported user on black instead of white means they lose on komi
    // rather than winning, which escaping.not_winner now requires for the after-game
    // report below to succeed.
    await createDirectChallenge(reporterPage, reportedUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Mod Escape Report Test Game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
        color: "white",
    });

    // Reported user accepts
    await acceptDirectChallenge(reportedPage, reporterPage);

    // Reporter is white; the reported user is black and moves first.
    // Wait for the Goban to be visible & definitely ready
    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Wait for the game state to indicate it's the reported user's (black's) move
    const reportedUsersMove = reportedPage.getByText("Your move", { exact: true });
    await expect(reportedUsersMove).toBeVisible();

    // Play a few moves to establish the game is underway (>= 2 are needed for
    // escaping report applicability). playMoves takes (black, white)
    // positionally — the reported user is black here, reporter is white.
    const moves = ["D5", "E5", "D6", "E6", "D7", "E7"];

    await playMoves(reportedPage, reporterPage, moves, "9x9");

    // Try to report escaping during the game - this should be blocked
    const playerLink = reporterPage.locator(`.black.player-name-container a.Player`);
    await expect(playerLink).toBeVisible();
    await playerLink.hover(); // Stabilize popover before clicking
    await playerLink.click();

    const reportButtonInitial = await expectOGSClickableByName(reporterPage, /Report$/);
    await reportButtonInitial.click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    // The client now blocks this before any request is sent, so there is no server
    // error to dismiss. The backend rule at moderate.py:758-769 still stands as
    // defence in depth; nothing in the browser suite exercises it any more.
    const blocker = reporterPage.locator('[data-checklist-blocker="escaping.game_ended"]');
    await expect(blocker).toBeVisible();
    await expect(blocker).toContainText("has not ended yet");

    await expect(reporterPage.locator("textarea.notes")).toHaveCount(0);
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();

    // Close the dialog before playing the game out.
    const closeButton = await expectOGSClickableByName(reporterPage, /^Close$/);
    await closeButton.click();

    // Finish the game by passing and scoring; the reported user is black.
    await passAndScoreGame(reportedPage, reporterPage);

    // Now try to report escaping after the game - this should be allowed
    const playerLinkAfterGame = reporterPage.locator(`.black.player-name-container a.Player`);
    await expect(playerLinkAfterGame).toBeVisible();
    await playerLinkAfterGame.hover(); // Stabilize popover before clicking
    await playerLinkAfterGame.click();

    const reportButton = await expectOGSClickableByName(reporterPage, /Report$/);
    await reportButton.click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    const notesBoxAfterGame = reporterPage.locator(".notes");

    // Fill in the notes
    await expect(notesBoxAfterGame).toBeVisible();
    await notesBoxAfterGame.fill("E2E test - reporting after game ended");

    await tickReportAttestations(reporterPage);

    // Try to submit the report after the game - this should succeed
    const reportButtonAfterGame = await expectOGSClickableByName(reporterPage, /Report User$/);
    await reportButtonAfterGame.click();

    // Should get success message
    await expect(reporterPage.getByText("Thanks for the report!")).toBeVisible();

    // Close the success alert
    const okButtonAfterGame = await expectOGSClickableByName(reporterPage, "OK");
    await okButtonAfterGame.click();
};
