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
 * Test that a McMahon tournament can be created, joined, and started.
 *
 * This test verifies the tournament creation -> join -> start -> games created pipeline:
 * 1. A director creates a group (required for tournament creation)
 * 2. The director creates a McMahon tournament in that group
 * 3. Five players join the tournament (McMahon requires >4 players)
 * 4. The director starts the tournament
 * 5. The tournament transitions to the started state
 * 6. Games are created and visible in the round display
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { log } from "@helpers/logger";

export const tournamentMcMahonStartTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== McMahon Tournament Start Test ===");

    // 1. Create six users: one director and five players
    const directorUsername = newTestUsername("McDir");
    log(`Creating director: ${directorUsername}`);
    const { userPage: directorPage } = await prepareNewUser(
        createContext,
        directorUsername,
        "test",
    );

    const playerUsernames: string[] = [];
    const playerPages: Awaited<ReturnType<typeof prepareNewUser>>["userPage"][] = [];
    for (let i = 1; i <= 5; i++) {
        const username = newTestUsername(`McP${i}`);
        log(`Creating player ${i}: ${username}`);
        const { userPage } = await prepareNewUser(createContext, username, "test");
        playerUsernames.push(username);
        playerPages.push(userPage);
    }

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

    // 3. Director creates a McMahon tournament in the group
    log("Director navigating to tournament creation page...");
    await directorPage.goto(`/tournament/new/${groupId}`);

    // Fill in tournament name
    const nameInput = directorPage.locator('input[placeholder="Tournament Name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("E2E McMahon Test");
    await expect(nameInput).toHaveValue("E2E McMahon Test");

    // Fill in description
    const descInput = directorPage.locator('textarea[placeholder="Description"]');
    await expect(descInput).toBeVisible();
    await descInput.fill("E2E test tournament for McMahon start");
    await expect(descInput).toHaveValue("E2E test tournament for McMahon start");

    // Set tournament type to McMahon
    await directorPage.selectOption("#tournament-type", "mcmahon");
    await expect(directorPage.locator("#tournament-type")).toHaveValue("mcmahon");

    // Set exclusivity to "Anyone can join" (open)
    const exclusivitySelect = directorPage.locator('tr:has(th:text("Exclusivity")) select');
    await exclusivitySelect.selectOption("open");
    await expect(exclusivitySelect).toHaveValue("open");

    // Set board size to 9x9
    const boardSizeSelect = directorPage.locator('tr:has(th:text("Board Size")) select');
    await boardSizeSelect.selectOption("9");
    await expect(boardSizeSelect).toHaveValue("9");

    // Set time control to blitz byoyomi so it's a live tournament.
    // A delay between speed and system changes avoids a race condition in TimeControlPicker
    // where the system change handler reads tc.speed from stale closure state if React
    // hasn't re-rendered after the speed change.
    await directorPage.selectOption("#challenge-speed", "blitz");
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("blitz");
    await directorPage.waitForTimeout(100); // let React re-render before changing time control system
    await directorPage.selectOption("#challenge-time-control", "byoyomi");
    await expect(directorPage.locator("#challenge-time-control")).toHaveValue("byoyomi");
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("blitz");

    // Allow provisional players to join (test users are newly registered and provisional)
    const provisionalCheckbox = directorPage.locator("#provisional");
    if (!(await provisionalCheckbox.isChecked())) {
        await provisionalCheckbox.check();
    }
    await expect(provisionalCheckbox).toBeChecked();

    // Set max players to 100
    const maxPlayersInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .last();
    await expect(maxPlayersInput).toBeVisible();
    await maxPlayersInput.fill("100");

    // Set players_start to 5 so tournament can start with our five test players
    const playersStartInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .first();
    await playersStartInput.fill("5");
    await expect(playersStartInput).toHaveValue("5");

    // McMahon Bars, Number of Rounds, and Pairing Methods use sensible defaults

    log("Creating tournament...");
    const createButton = await expectOGSClickableByName(directorPage, /Create Tournament/);
    await createButton.click();

    // Wait for redirect to the tournament page
    await directorPage.waitForURL(/\/tournament\/\d+/, { timeout: 30000 });
    const tournamentUrl = directorPage.url();
    log(`Tournament created at: ${tournamentUrl}`);

    // Verify we're on the tournament page and it shows the tournament name
    await expect(directorPage.getByText("E2E McMahon Test").first()).toBeVisible();

    // Verify the "Start Tournament Now" button is visible for the director
    await expectOGSClickableByName(directorPage, /Start Tournament Now/);
    log("Start Tournament Now button is visible");

    // 4. Players join the tournament
    for (let i = 0; i < 5; i++) {
        log(`Player ${i + 1} (${playerUsernames[i]}) joining tournament...`);
        await playerPages[i].goto(tournamentUrl);
        await expect(playerPages[i].getByText("E2E McMahon Test").first()).toBeVisible();

        const joinButton = await expectOGSClickableByName(playerPages[i], /Join this tournament!/);
        await joinButton.click();

        // Verify player joined - the "Drop out" button should now be visible
        await expect(
            playerPages[i].getByRole("button", { name: /Drop out from tournament/ }),
        ).toBeVisible({ timeout: 10000 });
        log(`Player ${i + 1} joined successfully`);
    }

    // 5. Director starts the tournament
    // Refresh the director's page to see updated player list
    await directorPage.reload();
    await expect(directorPage.getByText("E2E McMahon Test").first()).toBeVisible();

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
    // Use .first() because players may appear multiple times in the results table
    await expect(
        directorPage.locator(".results").getByText(playerUsernames[0]).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
        directorPage.locator(".results").getByText(playerUsernames[1]).first(),
    ).toBeVisible({ timeout: 10000 });
    log("Players visible in tournament results");

    log("=== McMahon Tournament Start Test Complete ===");
};
