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
 * Test that a disable-vacation tournament can be created, that the tournament page
 * prominently shows the disable-vacation banner, and that the resulting games
 * appear in each player's vacation settings pane as disable-vacation warnings.
 *
 * Flow:
 * 1. A director creates a group and a correspondence round-robin tournament
 *    with disable_vacation enabled
 * 2. Verify the tournament page shows the "Vacation disabled" banner
 * 3. Two players join the tournament
 * 4. The director starts the tournament
 * 5. Games are created
 * 6. Each player navigates to their vacation settings and verifies the
 *    disable-vacation game warning is displayed
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { log } from "@helpers/logger";

export const tournamentDisableVacationTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Disable-Vacation Tournament Test ===");

    // 1. Create three users: one director and two players
    const directorUsername = newTestUsername("DVDir");
    log(`Creating director: ${directorUsername}`);
    const { userPage: directorPage } = await prepareNewUser(
        createContext,
        directorUsername,
        "test",
    );

    const player1Username = newTestUsername("DVP1");
    log(`Creating player 1: ${player1Username}`);
    const { userPage: player1Page } = await prepareNewUser(createContext, player1Username, "test");

    const player2Username = newTestUsername("DVP2");
    log(`Creating player 2: ${player2Username}`);
    const { userPage: player2Page } = await prepareNewUser(createContext, player2Username, "test");

    // 2. Director creates a group (required for tournament creation)
    log("Director creating a group for the tournament...");
    await directorPage.goto("/group/create");

    const groupName = `E2E DVac Group ${directorUsername}`;
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

    // 3. Director creates a correspondence round-robin tournament with disable_vacation
    log("Director navigating to tournament creation page...");
    await directorPage.goto(`/tournament/new/${groupId}`);

    // Fill in tournament name
    const tournamentName = "E2E Disable Vacation Test";
    const nameInput = directorPage.locator('input[placeholder="Tournament Name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(tournamentName);
    await expect(nameInput).toHaveValue(tournamentName);

    // Fill in description
    const descInput = directorPage.locator('textarea[placeholder="Description"]');
    await expect(descInput).toBeVisible();
    await descInput.fill("E2E test tournament for disable vacation feature");
    await expect(descInput).toHaveValue("E2E test tournament for disable vacation feature");

    // Set tournament type to Round Robin (lowest player requirement)
    await directorPage.selectOption("#tournament-type", "roundrobin");
    await expect(directorPage.locator("#tournament-type")).toHaveValue("roundrobin");

    // Set exclusivity to open
    const exclusivitySelect = directorPage.locator('tr:has(th:text("Exclusivity")) select');
    await exclusivitySelect.selectOption("open");
    await expect(exclusivitySelect).toHaveValue("open");

    // Set board size to 9x9
    const boardSizeSelect = directorPage.locator('tr:has(th:text("Board Size")) select');
    await boardSizeSelect.selectOption("9");
    await expect(boardSizeSelect).toHaveValue("9");

    // Set time control to correspondence fischer so games are correspondence speed.
    // This is required for the vacation settings warning to appear (time_per_move >= 3600).
    await directorPage.selectOption("#challenge-speed", "correspondence");
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("correspondence");
    await directorPage.waitForTimeout(100); // let React re-render before changing time control system
    await directorPage.selectOption("#challenge-time-control", "fischer");
    await expect(directorPage.locator("#challenge-time-control")).toHaveValue("fischer");
    await expect(directorPage.locator("#challenge-speed")).toHaveValue("correspondence");

    // Enable disable_vacation
    const disableVacationCheckbox = directorPage.locator("#disable_vacation");
    await expect(disableVacationCheckbox).toBeVisible();
    if (!(await disableVacationCheckbox.isChecked())) {
        await disableVacationCheckbox.check();
    }
    await expect(disableVacationCheckbox).toBeChecked();
    log("Disable-vacation checkbox checked");

    // Allow provisional players to join
    const provisionalCheckbox = directorPage.locator("#provisional");
    if (!(await provisionalCheckbox.isChecked())) {
        await provisionalCheckbox.check();
    }
    await expect(provisionalCheckbox).toBeChecked();

    // Set max players to 10 and min to 2
    const maxPlayersInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .last();
    await expect(maxPlayersInput).toBeVisible();
    await maxPlayersInput.fill("10");

    const playersStartInput = directorPage
        .locator('tr:has(th:text("Players")) input[type="number"]')
        .first();
    await playersStartInput.fill("2");
    await expect(playersStartInput).toHaveValue("2");

    log("Creating tournament...");
    const createButton = await expectOGSClickableByName(directorPage, /Create Tournament/);
    await createButton.click();

    await directorPage.waitForURL(/\/tournament\/\d+/, { timeout: 30000 });
    const tournamentUrl = directorPage.url();
    log(`Tournament created at: ${tournamentUrl}`);

    // Verify the tournament page shows the tournament name
    await expect(directorPage.getByText(tournamentName).first()).toBeVisible();

    // 4. Verify the disable-vacation banner is displayed prominently on the tournament page
    await expect(directorPage.getByText("Vacation is disabled for this tournament")).toBeVisible({
        timeout: 10000,
    });
    log("Disable-vacation banner is visible on tournament page");

    // Also verify the details table shows "Vacation disabled"
    await expect(directorPage.getByText("Vacation disabled")).toBeVisible();
    log("Vacation disabled status visible in details table");

    // 5. Players join the tournament
    log(`Player 1 (${player1Username}) joining tournament...`);
    await player1Page.goto(tournamentUrl);
    await expect(player1Page.getByText(tournamentName).first()).toBeVisible();

    // Player 1 should also see the disable-vacation banner
    await expect(player1Page.getByText("Vacation is disabled for this tournament")).toBeVisible({
        timeout: 10000,
    });

    const joinButton1 = await expectOGSClickableByName(player1Page, /Join this tournament!/);
    await joinButton1.click();
    await expect(player1Page.getByRole("button", { name: /Drop out from tournament/ })).toBeVisible(
        { timeout: 10000 },
    );
    log("Player 1 joined successfully");

    log(`Player 2 (${player2Username}) joining tournament...`);
    await player2Page.goto(tournamentUrl);
    await expect(player2Page.getByText(tournamentName).first()).toBeVisible();

    const joinButton2 = await expectOGSClickableByName(player2Page, /Join this tournament!/);
    await joinButton2.click();
    await expect(player2Page.getByRole("button", { name: /Drop out from tournament/ })).toBeVisible(
        { timeout: 10000 },
    );
    log("Player 2 joined successfully");

    // 6. Director starts the tournament
    await directorPage.reload();
    await expect(directorPage.getByText(tournamentName).first()).toBeVisible();

    log("Director starting tournament...");
    const startBtn = await expectOGSClickableByName(directorPage, /Start Tournament Now/);
    await startBtn.click();

    const confirmDialog = directorPage.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText("Start this tournament now?")).toBeVisible();

    const okButton = confirmDialog.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await okButton.click();

    // Wait for tournament to start and games to be created
    await expect(directorPage.locator(".results")).toBeVisible({ timeout: 30000 });
    log("Tournament started - results section is visible");

    // Verify games were created
    await expect(directorPage.getByText("Player").first()).toBeVisible();
    await expect(directorPage.locator(".results").getByText(player1Username).first()).toBeVisible({
        timeout: 10000,
    });
    await expect(directorPage.locator(".results").getByText(player2Username).first()).toBeVisible({
        timeout: 10000,
    });
    log("Games created with both players in results");

    // 7. Verify disable-vacation warning appears on each player's vacation settings pane
    //
    // Tournament games are started asynchronously via a Celery task with a 2s delay.
    // The player-game M2M association is created inside that task, so we need to wait
    // for it to complete before the game will appear in the player's active games.
    // The TurnIndicator in the nav bar is pushed via websocket when the game server
    // creates the game, so we wait for it to become visible as a signal that the
    // async game creation pipeline has completed.
    log("Waiting for tournament game to be started (turn indicator)...");
    await expect(
        player1Page.locator(".TurnIndicator .count.active, .TurnIndicator .count.inactive"),
    ).toBeVisible({ timeout: 60000 });
    log("Turn indicator visible for player 1 - game is active");

    log("Checking player 1 vacation settings for disable-vacation warning...");
    await player1Page.goto("/user/settings");

    const vacationTab1 = player1Page.getByText("Vacation", { exact: true });
    await expect(vacationTab1).toBeVisible({ timeout: 10000 });
    await vacationTab1.click();

    await expect(player1Page.getByText("Vacation Control")).toBeVisible({ timeout: 10000 });

    // The warning should mention active correspondence games that won't be paused
    await expect(
        player1Page.getByText(/active correspondence game.*will not be paused by vacation/),
    ).toBeVisible({ timeout: 15000 });

    // The game link should contain the tournament name
    await expect(
        player1Page.locator(".disable-vacation-warning").getByText(/Tournament Game/),
    ).toBeVisible();
    log("Player 1 sees disable-vacation warning with game link");

    log("Waiting for tournament game to be started (turn indicator) for player 2...");
    await expect(
        player2Page.locator(".TurnIndicator .count.active, .TurnIndicator .count.inactive"),
    ).toBeVisible({ timeout: 60000 });
    log("Turn indicator visible for player 2 - game is active");

    log("Checking player 2 vacation settings for disable-vacation warning...");
    await player2Page.goto("/user/settings");

    const vacationTab2 = player2Page.getByText("Vacation", { exact: true });
    await expect(vacationTab2).toBeVisible({ timeout: 10000 });
    await vacationTab2.click();

    await expect(player2Page.getByText("Vacation Control")).toBeVisible({ timeout: 10000 });

    await expect(
        player2Page.getByText(/active correspondence game.*will not be paused by vacation/),
    ).toBeVisible({ timeout: 15000 });

    await expect(
        player2Page.locator(".disable-vacation-warning").getByText(/Tournament Game/),
    ).toBeVisible();
    log("Player 2 sees disable-vacation warning with game link");

    log("=== Disable-Vacation Tournament Test Complete ===");
};
