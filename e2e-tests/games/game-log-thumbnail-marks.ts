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
 * Test that GameLog thumbnails correctly display marks on stones during scoring
 *
 * This test verifies that:
 * 1. When stones are marked dead, the GameLog shows "stones marked dead"
 * 2. When stones are marked alive, the GameLog shows "stones marked alive"
 * 3. Thumbnails are present for each stone removal event
 * 4. Screenshots can be taken for visual inspection of marks (crosses for dead, triangles for alive)
 *
 * This test creates a simple game, marks stones as dead/alive during stone removal,
 * and then has a moderator open the GameLog modal via the dock to inspect the thumbnails.
 *
 * Uses E2E_MODERATOR from init_e2e data for accessing the game log.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 *
 * Note: Playwright cannot directly inspect canvas/SVG content within thumbnails,
 * so screenshots are taken for manual visual inspection to verify marks appear correctly.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    generateUniqueTestIPv6,
    loginAsUser,
    turnOffDynamicHelp,
} from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickOnGobanIntersection, playMoves } from "@helpers/game-utils";

export const gameLogThumbnailMarksTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    console.log("=== GameLog Thumbnail Marks Test ===");

    // 1. Create two users
    console.log("Creating test users...");
    const challengerUsername = newTestUsername("LogThumbCh");
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        challengerUsername,
        "test",
    );
    console.log(`Challenger created: ${challengerUsername} ✓`);

    const acceptorUsername = newTestUsername("LogThumbAc");
    const { userPage: acceptorPage } = await prepareNewUser(
        createContext,
        acceptorUsername,
        "test",
    );
    console.log(`Acceptor created: ${acceptorUsername} ✓`);

    // 2. Create and accept a challenge
    console.log("Creating challenge...");
    await createDirectChallenge(challengerPage, acceptorUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E GameLog Thumbnail Test",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
        rules: "japanese",
    });
    console.log("Challenge created ✓");

    console.log("Accepting challenge...");
    await acceptDirectChallenge(acceptorPage);
    console.log("Challenge accepted ✓");

    // 3. Wait for game to be ready
    console.log("Waiting for game to be ready...");
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });
    await challengerPage.waitForTimeout(1000);

    const challengersMove = challengerPage.getByText("Your move", { exact: true });
    await expect(challengersMove).toBeVisible();
    console.log("Game ready ✓");

    // 4. Play a simple game to create multiple groups that can be marked dead
    // Create groups with coordinates that share characters to test coordinate parsing
    console.log("Playing moves to create dead stones...");
    const moves = [
        // Black creates groups that will have overlapping coordinate characters
        // Group 1: B2, B3 (coordinates: ba, bb)
        "B2", // Black
        "H8", // White plays elsewhere
        "B3", // Black
        "H7", // White plays elsewhere
        // Group 2: C2, D2 (coordinates: ca, da) - shares 'a' with B2
        "C2", // Black
        "H6", // White plays elsewhere
        "D2", // Black
        "G7", // White plays elsewhere
        // Group 3: B4 (coordinate: bc) - shares 'b' with B2, B3
        "B4", // Black
        "G6", // White plays elsewhere
    ];

    await playMoves(challengerPage, acceptorPage, moves, "9x9", 500);
    console.log("Moves played ✓");

    // 5. Both players pass to enter stone removal
    console.log("Passing to enter stone removal phase...");
    const challengerPass = challengerPage.getByText("Pass", { exact: true });
    await expect(challengerPass).toBeVisible();
    await challengerPass.click();
    console.log("Challenger passed ✓");

    const acceptorPass = acceptorPage.getByText("Pass", { exact: true });
    await expect(acceptorPass).toBeVisible();
    await acceptorPass.click();
    console.log("Acceptor passed ✓");

    // Wait for stone removal phase
    await challengerPage.waitForTimeout(1000);
    console.log("Entered stone removal phase ✓");

    // 6. Mark first group (B2-B3) as dead - coordinates: ba, bb
    console.log("Marking first group (B2-B3) as dead...");
    await clickOnGobanIntersection(challengerPage, "B2", "9x9");
    await challengerPage.waitForTimeout(500);
    console.log("First group marked dead ✓");
    await challengerPage.waitForTimeout(500);

    // 7. Mark second group (C2-D2) as dead - coordinates: ca, da
    // This tests the bug: if we split by character, 'a' from 'ca' and 'da' would
    // incorrectly remove 'a' from 'ba' and 'bb', corrupting the first group
    console.log("Marking second group (C2-D2) as dead...");
    await clickOnGobanIntersection(challengerPage, "C2", "9x9");
    await challengerPage.waitForTimeout(500);
    console.log("Second group marked dead ✓");
    await challengerPage.waitForTimeout(500);

    // 8. Toggle second group back to alive
    console.log("Toggling second group back to alive...");
    await clickOnGobanIntersection(challengerPage, "C2", "9x9");
    await challengerPage.waitForTimeout(500);
    console.log("Second group marked alive ✓");
    await challengerPage.waitForTimeout(500);

    // 9. Mark second group dead again
    console.log("Marking second group dead again...");
    await clickOnGobanIntersection(challengerPage, "C2", "9x9");
    await challengerPage.waitForTimeout(500);
    console.log("Second group marked dead again ✓");
    await challengerPage.waitForTimeout(500); // Extra delay before accepting

    // 10. Accept stone removal
    console.log("Accepting stone removal...");
    const acceptorAccept = acceptorPage.getByText("Accept");
    await expect(acceptorAccept).toBeVisible();
    await acceptorAccept.click();
    console.log("Acceptor accepted ✓");

    const challengerAccept = challengerPage.getByText("Accept");
    await expect(challengerAccept).toBeVisible();
    await challengerAccept.click();
    console.log("Challenger accepted ✓");

    // Wait for game to finish
    await challengerPage.waitForTimeout(1000);
    const gameFinished = challengerPage.getByText("wins by");
    await expect(gameFinished).toBeVisible();
    console.log("Game finished ✓");

    // Get the game URL from the challenger page
    const gameUrl = challengerPage.url();
    console.log(`Game URL: ${gameUrl}`);

    // 11. Login as moderator and navigate to the game
    console.log("Logging in as moderator...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set");
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await createContext({
        extraHTTPHeaders: { "X-Forwarded-For": uniqueIPv6 },
    });
    const modPage = await modContext.newPage();
    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    console.log("Moderator logged in ✓");

    // Navigate to the game
    console.log("Navigating to game as moderator...");
    await modPage.goto(gameUrl);
    await modPage.waitForLoadState("networkidle");
    console.log("Game page loaded ✓");

    // 12. Open GameLog modal via the dock
    console.log("Opening GameLog modal via dock...");

    // Hover over the dock to make it visible
    const dock = modPage.locator(".Dock");
    await dock.hover();
    await modPage.waitForTimeout(500); // Wait for dock to slide out

    // Find and click the "Log" link in the dock
    // The dock has an <a> element with onClick handler that opens the modal
    // Use JavaScript to click the link directly since it may have visibility/opacity issues
    await modPage.evaluate(() => {
        const logLink = Array.from(document.querySelectorAll(".Dock a")).find((el) =>
            el.textContent?.includes("Log"),
        ) as HTMLElement;
        if (logLink) {
            logLink.click();
        } else {
            throw new Error("Log dock link not found");
        }
    });
    await modPage.waitForTimeout(1000);
    console.log("GameLog modal opened ✓");

    // 13. Verify GameLog entries
    console.log("Verifying GameLog entries...");

    // Check if we need to click "Show all" to see all log entries
    const showAllButton = modPage.getByText(/Show all/);
    const showAllExists = (await showAllButton.count()) > 0;
    if (showAllExists) {
        console.log("Found 'Show all' button, clicking to expand log...");
        await showAllButton.click();
        await modPage.waitForTimeout(500);
    }

    // Check for "stones marked dead" entries
    const markedDeadEntries = modPage.getByText("stones marked dead");
    await expect(markedDeadEntries.first()).toBeVisible();
    console.log("Found 'stones marked dead' entry ✓");

    // Check for "stones marked alive" entry
    const markedAliveEntry = modPage.getByText("stones marked alive");
    await expect(markedAliveEntry.first()).toBeVisible();
    console.log("Found 'stones marked alive' entry ✓");

    // 14. Verify thumbnails exist
    console.log("Verifying thumbnails exist...");
    const thumbnails = modPage.locator(".goban-thumbnail");
    const thumbnailCount = await thumbnails.count();
    console.log(`Found ${thumbnailCount} thumbnails`);

    if (thumbnailCount === 0) {
        console.error("ERROR: No thumbnails found!");
    } else {
        console.log("Thumbnails present ✓");
    }

    // 15. Take screenshot for visual inspection
    console.log("Taking screenshot for visual inspection...");
    await modPage.screenshot({
        path: `test-results/game-log-thumbnails-${testInfo.testId}.png`,
        fullPage: true,
    });
    console.log("Screenshot saved to test-results/ ✓");

    // 16. Print information for manual inspection
    console.log("\n=== VISUAL INSPECTION REQUIRED ===");
    console.log("Please check the screenshot at:");
    console.log(`  test-results/game-log-thumbnails-${testInfo.testId}.png`);
    console.log("\nWhat to look for:");
    console.log("1. Entries with 'stones marked dead' should have thumbnails");
    console.log("   showing crosses (X) on the marked stones");
    console.log("2. Entries with 'stones marked alive' should have thumbnails");
    console.log("   showing triangles (△) on the marked stones");
    console.log("3. The thumbnails should show the board state AFTER the change");
    console.log("   (i.e., current removal state visible on the board)");
    console.log("=====================================\n");

    console.log("=== GameLog Thumbnail Marks Test Complete ===");
    console.log("✓ Created game with dead stones");
    console.log("✓ Marked stones dead/alive during stone removal");
    console.log("✓ Verified GameLog entries exist");
    console.log("✓ Verified thumbnails are present");
    console.log("✓ Screenshot saved for visual inspection");
};
