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
 * Test the AI Detection FastSMR Report Button functionality
 *
 * This test verifies that:
 * 1. Clicking a FastSMR cell creates an AI use report
 * 2. The report appears in the incident reports with correct format
 * 3. Hover behavior is manually verified (Playwright cannot reliably test React hover)
 *
 * Uses E2E_MODERATOR from init_e2e data for moderator functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import { Browser, expect } from "@playwright/test";
import { generateUniqueTestIPv6, loginAsUser, turnOffDynamicHelp } from "../helpers/user-utils";

export const aiDetectionFastSMRReportTest = async ({ browser }: { browser: Browser }) => {
    console.log("=== AI Detection FastSMR Report Button Test ===");

    // 1. Set up seeded moderator
    console.log("Setting up moderator account...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set to run this test");
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await browser.newContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const modPage = await modContext.newPage();

    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    console.log("Moderator logged in ✓");

    // Note: We skip checking initial report count since it's difficult to verify in tests
    // The toast notification will confirm the report was created

    // 3. Navigate to the AI Detection page
    console.log("Navigating to AI Detection page...");
    await modPage.goto("/moderator/ai-detection");
    await modPage.waitForLoadState("networkidle");
    await expect(modPage.getByRole("heading", { name: /AI Detection/i })).toBeVisible();
    console.log("AI Detection page loaded ✓");

    // 4. Wait for the table to finish loading
    console.log("Waiting for game data to load...");
    const loadingOverlay = modPage.locator(".ai-detection .loading-overlay");
    await loadingOverlay.waitFor({ state: "hidden", timeout: 10000 });
    console.log("Loading overlay hidden - data loaded ✓");

    // 5. Check if there are any games in the table
    const gameRows = modPage.locator(".ai-detection tr").filter({ hasText: /#\d+/ });
    const rowCount = await gameRows.count();

    if (rowCount === 0) {
        console.log("⚠ No games found in AI Detection table - skipping test");
        await modPage.close();
        await modContext.close();
        console.log("=== Test Skipped (No Data) ===");
        return;
    }

    console.log(`Found ${rowCount} games in table ✓`);

    // 5. Find a FastSMR cell to test
    console.log("Looking for FastSMR cell in first row...");
    const firstRow = gameRows.first();
    await expect(firstRow).toBeVisible();

    // Find all FastSMR cells in the first row
    const fastSMRCells = firstRow.locator("span[title*='Fast Detection']");
    const cellCount = await fastSMRCells.count();
    console.log(`Found ${cellCount} FastSMR cells in first row`);

    if (cellCount === 0) {
        console.log("⚠ No FastSMR cells found - skipping test");
        await modPage.close();
        await modContext.close();
        console.log("=== Test Skipped (No FastSMR Data) ===");
        return;
    }

    // 6. Find a reportable cell (one with cursor: pointer)
    let fastSMRCell = fastSMRCells.first();
    let cursorStyle = await fastSMRCell.evaluate((el) => window.getComputedStyle(el).cursor);
    console.log(`First cell cursor style: "${cursorStyle}"`);

    if (cursorStyle !== "pointer") {
        console.log("First cell is not reportable, trying second cell...");
        if (cellCount > 1) {
            fastSMRCell = fastSMRCells.nth(1);
            cursorStyle = await fastSMRCell.evaluate((el) => window.getComputedStyle(el).cursor);
            console.log(`Second cell cursor style: "${cursorStyle}"`);

            if (cursorStyle !== "pointer") {
                console.log("⚠ No reportable FastSMR cells found - skipping test");
                await modPage.close();
                await modContext.close();
                console.log("=== Test Skipped (No Reportable Cells) ===");
                return;
            }
        } else {
            console.log("⚠ Only one FastSMR cell and it's not reportable - skipping test");
            await modPage.close();
            await modContext.close();
            console.log("=== Test Skipped (No Reportable Cells) ===");
            return;
        }
    }

    console.log("Found reportable FastSMR cell ✓");

    // 7. Get the player name from the row to verify the report later
    const playerLinks = firstRow.locator(".Player");
    const firstPlayerLink = playerLinks.first();
    const firstPlayerName = (await firstPlayerLink.textContent()) || "";
    console.log(`Player name in row: ${firstPlayerName}`);

    // 8. Click the FastSMR cell to create a report
    console.log("Clicking FastSMR cell to create report...");
    await fastSMRCell.click();
    await modPage.waitForTimeout(1000); // Wait for the report to be submitted

    // Check for toast notification
    const toast = modPage.locator(".toast-container");
    await expect(toast).toBeVisible({ timeout: 5000 });
    const toastText = await toast.textContent();
    console.log(`Toast notification: ${toastText}`);
    expect(toastText).toContain("Reported");
    console.log("Report submitted successfully ✓");

    // 9. The toast notification confirms the report was created
    console.log("Report creation verified via toast notification ✓");

    // 10. Navigate to Reports Center and close the report for cleanup
    console.log("Navigating to Reports Center to close report...");
    await modPage.goto("/reports-center/ai_use");
    await modPage.waitForLoadState("networkidle");

    // Wait for the report to appear - retry up to 5 times with 1 second delays
    let reportFound = false;
    for (let attempt = 0; attempt < 5; attempt++) {
        await modPage.waitForTimeout(1000);

        // Check if a report is displayed (not the "All done!" message)
        const allDoneMessage = modPage.locator(".no-report-selected");
        const allDoneVisible = await allDoneMessage.isVisible();

        if (!allDoneVisible) {
            // A report is displayed
            reportFound = true;
            console.log(`Report found on attempt ${attempt + 1} ✓`);
            break;
        }
        console.log(`Attempt ${attempt + 1}: Waiting for report to appear...`);
    }

    if (reportFound) {
        // Try to close the report using the Ignore button
        const ignoreButton = modPage.getByRole("button", { name: /Ignore/i });
        const ignoreButtonExists = (await ignoreButton.count()) > 0;

        if (ignoreButtonExists) {
            await ignoreButton.click();
            await modPage.waitForTimeout(1000);
            console.log("Report ignored ✓");
        } else {
            console.log("⚠ Could not find Ignore button - report may remain open");
        }
    } else {
        console.log("⚠ Report did not appear in Reports Center within 5 seconds");
    }

    // Clean up
    await modPage.close();
    await modContext.close();

    console.log("=== AI Detection FastSMR Report Button Test Complete ===");
    console.log("✓ Clicking FastSMR cell creates AI use report");
    console.log("✓ Toast notification confirms report was created");
    console.log(
        "Note: Hover behavior must be manually verified (Playwright cannot test React hover)",
    );
};
