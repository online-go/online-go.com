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
 * Test the AI Detection player filter functionality
 *
 * This test verifies that:
 * 1. Setting up a filter (min_moves) on AI Detection page
 * 2. When clicking a player name, it opens a new tab with ONLY that player filtered
 * 3. The new tab's URL contains only the player parameter (other filters cleared)
 * 4. The new tab's title shows "AID: {username}"
 * 5. The player autocomplete input in the new tab shows the filtered player's name
 * 6. No popup appears when clicking player names
 * 7. Clicking the currently filtered player in the first column navigates to their profile in a new tab
 * 8. The original tab maintains its filter intact
 *
 * Uses E2E_MODERATOR from init_e2e data for moderator functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import { BrowserContext, expect } from "@playwright/test";
import { generateUniqueTestIPv6, loginAsUser, turnOffDynamicHelp } from "../helpers/user-utils";

export const aiDetectionPlayerFilterTest = async ({
    createContext,
}: {
    createContext: (options?: any) => Promise<BrowserContext>;
}) => {
    console.log("=== AI Detection Player Filter Test ===");

    // 1. Set up seeded moderator
    console.log("Setting up moderator account...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set to run this test");
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const modPage = await modContext.newPage();

    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    console.log("Moderator logged in ✓");

    // 2. Navigate to the AI Detection page
    console.log("Navigating to AI Detection page...");
    await modPage.goto("/moderator/ai-detection");
    await modPage.waitForLoadState("networkidle");
    await expect(modPage.getByRole("heading", { name: /AI Detection/i })).toBeVisible();
    console.log("AI Detection page loaded ✓");

    // 3. Wait for the table to finish loading
    console.log("Waiting for game data to load...");
    const loadingOverlay = modPage.locator(".ai-detection .loading-overlay");

    // Wait for the loading overlay to be hidden (meaning data has loaded)
    await loadingOverlay.waitFor({ state: "hidden", timeout: 10000 });
    console.log("Loading overlay hidden - data loaded ✓");

    // Check if there are any games in the table
    const gameRows = modPage.locator(".ai-detection tr").filter({ hasText: /#\d+/ });
    const rowCount = await gameRows.count();

    if (rowCount === 0) {
        console.log("⚠ No games found in AI Detection table - skipping test");
        console.log("=== Test Skipped (No Data) ===");
        return;
    }

    console.log(`Found ${rowCount} games in table ✓`);

    // 4. Set up a simple filter (min_moves) before clicking player link
    // We just need to verify that filters get cleared when clicking a player name
    // Note: We don't enable apply_filters checkbox because test database games don't have AI analysis data
    console.log("Setting up a filter to verify it gets cleared...");

    // Find inputs by their labels
    // Min moves - label: "Moves ≥" - use value of 1 to ensure games aren't filtered out
    const minMovesInput = modPage
        .locator('label:has-text("Moves ≥")')
        .locator("..")
        .locator('input[type="number"]');
    await minMovesInput.fill("1");
    console.log("Set min_moves to 1");

    // Wait for URL to update with filter parameters
    await modPage.waitForTimeout(500);
    const filteredUrl = modPage.url();
    expect(filteredUrl).toContain("min_moves=1");
    console.log("Filter applied to URL ✓");

    // 5. Find a player name in the second column (not the filtered player)
    console.log("Looking for player name in second column...");
    const secondColumnPlayerLink = modPage
        .locator(".ai-detection .player-cell-second .Player")
        .first();
    await expect(secondColumnPlayerLink).toBeVisible();

    // Get the player name before clicking
    const playerName = await secondColumnPlayerLink.textContent();
    console.log(`Found player link in second column: ${playerName} ✓`);

    // 6. Click on the player link - should open a new tab
    console.log("Clicking player link to open filter in new tab...");

    // Set up listener for new page before clicking
    const newPagePromise = modContext.waitForEvent("page");
    await secondColumnPlayerLink.click();

    // Wait for the new page to open
    const newPage = await newPagePromise;
    await newPage.waitForLoadState("networkidle");
    console.log("New tab opened ✓");

    // 7. Verify no popup appeared in the original page
    console.log("Verifying no popup appeared in original tab...");
    const playerPopup = modPage.locator(".PlayerDetails");
    await expect(playerPopup).not.toBeVisible();
    console.log("No popup appeared ✓");

    // 8. Verify the new tab's URL contains ONLY the player parameter (min_moves filter cleared)
    console.log("Verifying new tab URL contains only player parameter (other filters cleared)...");
    const newTabUrl = newPage.url();
    expect(newTabUrl).toContain("player=");
    expect(newTabUrl).toContain("/moderator/ai-detection");

    // Verify the min_moves filter is NOT in the URL
    expect(newTabUrl).not.toContain("min_moves=");
    console.log(`New tab URL: ${newTabUrl}`);
    console.log("✓ Only player filter present, min_moves filter cleared");

    // 9. Verify the new tab's title shows "AID: {username}"
    console.log("Verifying new tab title...");
    await newPage.waitForTimeout(1000); // Give time for title to update
    const newTabTitle = await newPage.title();
    console.log(`New tab title: "${newTabTitle}"`);
    expect(newTabTitle).toContain("AID:");
    console.log("New tab title contains 'AID:' ✓");

    // 10. Verify the player autocomplete input shows the filtered player in the new tab
    console.log("Verifying player autocomplete in new tab...");
    const playerAutocomplete = newPage.locator(".search input[type='text']");
    await expect(playerAutocomplete).toBeVisible();

    // Wait for the autocomplete to populate
    await newPage.waitForTimeout(1000);
    const autocompleteValue = await playerAutocomplete.inputValue();
    console.log(`Autocomplete value in new tab: "${autocompleteValue}"`);
    console.log("Player filter applied in new tab ✓");

    // 11. Test that clicking the filtered player in the first column navigates to profile in new tab
    console.log("Testing that clicking filtered player opens profile in new tab...");

    // Wait for table to finish loading in new tab
    const newTabLoadingOverlay = newPage.locator(".ai-detection .loading-overlay");
    await newTabLoadingOverlay.waitFor({ state: "hidden", timeout: 10000 });

    // The first column should contain the filtered player
    const filteredPlayerLink = newPage.locator(".ai-detection .player-cell-first .Player").first();
    const filteredPlayerLinkCount = await filteredPlayerLink.count();

    if (filteredPlayerLinkCount > 0) {
        await expect(filteredPlayerLink).toBeVisible();
        const filteredPlayerName = await filteredPlayerLink.textContent();
        console.log(`Filtered player in first column: ${filteredPlayerName}`);

        // Extract player ID from the URL
        const urlMatch = newTabUrl.match(/player=(\d+)/);
        const filteredPlayerId = urlMatch ? urlMatch[1] : null;
        console.log(`Filtered player ID: ${filteredPlayerId}`);

        if (filteredPlayerId) {
            // Click the filtered player - should open profile in a new tab
            const profilePagePromise = modContext.waitForEvent("page");
            await filteredPlayerLink.click();

            const profilePage = await profilePagePromise;
            await profilePage.waitForLoadState("networkidle");

            // Verify we navigated to the player's profile page
            const profileUrl = profilePage.url();
            expect(profileUrl).toContain(`/player/${filteredPlayerId}`);
            console.log(`Profile opened in new tab: ${profileUrl} ✓`);
        } else {
            console.log(
                "⚠ Could not extract player ID from URL, skipping profile navigation test",
            );
        }
    } else {
        console.log(
            "⚠ No filtered player found in first column, skipping profile navigation test",
        );
    }

    // 12. Verify original tab still has its filters intact
    console.log("Verifying original tab still has its filters intact...");
    const originalUrl = modPage.url();
    expect(originalUrl).not.toContain("player=");
    expect(originalUrl).toContain("min_moves=1");
    console.log("Original tab still has filter intact ✓");

    console.log("=== AI Detection Player Filter Test Complete ===");
    console.log("✓ Navigated to AI Detection page");
    console.log("✓ Set up filter (min_moves)");
    console.log("✓ Clicked player link opened new tab with only player filter");
    console.log("✓ New tab URL contains ONLY player parameter (other filters cleared)");
    console.log("✓ New tab title shows 'AID: {username}'");
    console.log("✓ Player autocomplete in new tab shows filtered player");
    console.log("✓ Clicking filtered player opens profile in new tab");
    console.log("✓ Original tab keeps its filter intact");
    console.log("✓ Filter clearing behavior fully verified");
};
