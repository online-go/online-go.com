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
 * Test that a round robin tournament can be created, joined, and started.
 *
 * This test verifies the tournament creation -> join -> start -> games created pipeline:
 * 1. A director creates a group (required for tournament creation)
 * 2. The director creates a round robin tournament in that group
 * 3. Two players join the tournament
 * 4. The director starts the tournament
 * 5. The tournament transitions to the started state
 * 6. Games are created and visible in the round display
 *
 * Round Robin is used because it has the lowest player requirement (2 players)
 * and creates all games in round 1, making it easy to verify.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { log } from "@helpers/logger";

export const tournamentRoundRobinStartTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Round Robin Tournament Start Test ===");

    // 1. Create three users: one director and two players
    const directorUsername = newTestUsername("TrnDir");
    log(`Creating director: ${directorUsername}`);
    const { userPage: directorPage } = await prepareNewUser(
        createContext,
        directorUsername,
        "test",
    );

    const player1Username = newTestUsername("TrnP1");
    log(`Creating player 1: ${player1Username}`);
    const { userPage: player1Page } = await prepareNewUser(createContext, player1Username, "test");

    const player2Username = newTestUsername("TrnP2");
    log(`Creating player 2: ${player2Username}`);
    const { userPage: player2Page } = await prepareNewUser(createContext, player2Username, "test");

    // 2. Director creates a group (required for tournament creation)
    log("Director creating a group for the tournament...");
    await directorPage.goto("/group/create");

    const groupName = `E2E Group ${directorUsername}`;
    const groupNameInput = directorPage.locator("#group-create-name");
    await expect(groupNameInput).toBeVisible();
    await groupNameInput.fill(groupName);
    await expect(groupNameInput).toHaveValue(groupName);

    const createGroupButton = await expectOGSClickableByName(directorPage, /Create your group!/);
    await createGroupButton.click();

    await directorPage.waitForURL(/\/group\/\d+/, { timeout: 30000 });
    const groupUrl = directorPage.url();
    const groupId = groupUrl.match(/\/group\/(\d+)/)?.[1];
    log(`Group created at: ${groupUrl}`);

    // 3. Director creates a round robin tournament in the group
    log("Director navigating to tournament creation page...");
    await directorPage.goto(`/tournament/new/${groupId}`);

    // Fill in tournament name
    const nameInput = directorPage.locator('input[placeholder="Tournament Name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("E2E Round Robin Test");
    await expect(nameInput).toHaveValue("E2E Round Robin Test");

    // Fill in description
    const descInput = directorPage.locator('textarea[placeholder="Description"]');
    await expect(descInput).toBeVisible();
    await descInput.fill("E2E test tournament for round robin start");
    await expect(descInput).toHaveValue("E2E test tournament for round robin start");

    // Set tournament type to Round Robin
    await directorPage.selectOption("#tournament-type", "roundrobin");
    await expect(directorPage.locator("#tournament-type")).toHaveValue("roundrobin");

    // Set exclusivity to "Anyone can join" (open)
    const exclusivitySelect = directorPage.locator('tr:has(th:text("Exclusivity")) select');
    await exclusivitySelect.selectOption("open");
    await expect(exclusivitySelect).toHaveValue("open");

    // Set board size to 9x9
    const boardSizeSelect = directorPage.locator('tr:has(th:text("Board Size")) select');
    await boardSizeSelect.selectOption("9");
    await expect(boardSizeSelect).toHaveValue("9");

    // Set time control to blitz byoyomi so it's a live tournament.
    // Must wait for React re-render between speed and system changes to avoid stale
    // closure state in TimeControlPicker (the system change handler reads tc.speed from
    // props, which is stale if React hasn't re-rendered after the speed change).
    await directorPage.selectOption("#challenge-speed", "blitz");
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("blitz");
    await directorPage.selectOption("#challenge-time-control", "byoyomi");
    await expect(directorPage.locator("#challenge-time-control")).toHaveValue("byoyomi");
    // Verify speed didn't revert (would indicate the race condition occurred)
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("blitz");

    // Allow provisional players to join (test users are newly registered and provisional)
    const provisionalCheckbox = directorPage.locator("#provisional");
    if (!(await provisionalCheckbox.isChecked())) {
        await provisionalCheckbox.check();
    }
    await expect(provisionalCheckbox).toBeChecked();

    // Set max players to 10 (round robin limit)
    // The players inputs are two number inputs in the Players row.
    // First is players_start (min), second is maximum_players (max).
    const maxPlayersInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .last();
    await expect(maxPlayersInput).toBeVisible();
    await maxPlayersInput.fill("10");

    // Set players_start to 2 so tournament can start with just our two test players
    const playersStartInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .first();
    await playersStartInput.fill("2");
    await expect(playersStartInput).toHaveValue("2");

    log("Creating tournament...");
    const createButton = await expectOGSClickableByName(directorPage, /Create Tournament/);
    await createButton.click();

    // Wait for redirect to the tournament page, or detect an error dialog
    await directorPage.waitForURL(/\/tournament\/\d+/, { timeout: 30000 });
    const tournamentUrl = directorPage.url();
    log(`Tournament created at: ${tournamentUrl}`);

    // Verify we're on the tournament page and it shows the tournament name
    await expect(directorPage.getByText("E2E Round Robin Test").first()).toBeVisible();

    // Verify the "Start Tournament Now" button is visible for the director
    await expectOGSClickableByName(directorPage, /Start Tournament Now/);
    log("Start Tournament Now button is visible");

    // 4. Players join the tournament
    log(`Player 1 (${player1Username}) joining tournament...`);
    await player1Page.goto(tournamentUrl);
    await expect(player1Page.getByText("E2E Round Robin Test").first()).toBeVisible();

    const joinButton1 = await expectOGSClickableByName(player1Page, /Join this tournament!/);
    await joinButton1.click();

    // Verify player 1 joined - the "Drop out" button should now be visible
    await expect(player1Page.getByRole("button", { name: /Drop out from tournament/ })).toBeVisible(
        { timeout: 10000 },
    );
    log("Player 1 joined successfully");

    log(`Player 2 (${player2Username}) joining tournament...`);
    await player2Page.goto(tournamentUrl);
    await expect(player2Page.getByText("E2E Round Robin Test").first()).toBeVisible();

    const joinButton2 = await expectOGSClickableByName(player2Page, /Join this tournament!/);
    await joinButton2.click();

    // Verify player 2 joined
    await expect(player2Page.getByRole("button", { name: /Drop out from tournament/ })).toBeVisible(
        { timeout: 10000 },
    );
    log("Player 2 joined successfully");

    // 5. Director starts the tournament
    // Refresh the director's page to see updated player list
    await directorPage.reload();
    await expect(directorPage.getByText("E2E Round Robin Test").first()).toBeVisible();

    log("Director starting tournament...");
    const startBtn = await expectOGSClickableByName(directorPage, /Start Tournament Now/);
    await startBtn.click();

    // Handle the SweetAlert confirmation dialog
    const confirmDialog = directorPage.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText("Start this tournament now?")).toBeVisible();

    const okButton = confirmDialog.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await okButton.click();

    // 6. Verify the tournament has started
    // The sign-up area should disappear and be replaced by results
    // Wait for the results section to appear (indicates tournament started and rounds loaded)
    await expect(directorPage.locator(".results")).toBeVisible({ timeout: 30000 });
    log("Tournament started - results section is visible");

    // Verify the "Start Tournament Now" button is gone
    await expect(
        directorPage.getByRole("button", { name: /Start Tournament Now/ }),
    ).not.toBeVisible();

    // Verify games were created - the Player column header should be visible in the round table
    await expect(directorPage.getByText("Player").first()).toBeVisible();
    log("Round table with Player column is visible - games were created");

    // Verify player names appear in the results
    // Use .first() because each player appears twice in a round robin (as Player and Opponent)
    await expect(directorPage.locator(".results").getByText(player1Username).first()).toBeVisible({
        timeout: 10000,
    });
    await expect(directorPage.locator(".results").getByText(player2Username).first()).toBeVisible({
        timeout: 10000,
    });
    log("Both players visible in tournament results");

    log("=== Round Robin Tournament Start Test Complete ===");
};
