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

import { expect } from "@playwright/test";
import { ogsTest } from "@helpers";
import { expectOGSClickableByName } from "@helpers/matchers";

ogsTest.describe("@CM Vote on own report", () => {
    ogsTest.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    ogsTest("CM should be able to vote on their own report", async ({ page }) => {
        // Go from "landing page" to the "sign in" page.
        await page.getByRole("link", { name: /Sign in/i }).click();

        // Log in as CM user
        await page.getByLabel("Username").fill("E2E_CM_ESC");
        await page.getByLabel("Password").fill("test");
        const signInButton = await expectOGSClickableByName(page, /Sign in$/);
        await signInButton.click();

        await expect(page.locator(".username").getByText("E2E_CM_ESC")).toBeVisible();

        // Find the game we want to report, on the user's profile...
        await page.fill(".OmniSearch-input", "E2E_CM_REPORTED");
        await page.waitForSelector(".results .result");
        await page.click('.results .result:has-text("E2E_CM_REPORTED")');

        await expect(page.getByText("Game History")).toBeVisible();
        const target_game = page.getByText("E2E CM Sample Game", { exact: true });
        await expect(target_game).toBeVisible();

        // Go to that page and report the user
        await target_game.click();

        // cspell:disable-next-line
        const playerLink = page.locator('a.Player:has-text("E2E_CM_REPOR")'); // The darn username is truncated!
        await playerLink.hover(); // Ensure the dropdown stays open
        await playerLink.click();

        const confirm = page.getByText("Provisional rank");
        await expect(confirm).toBeVisible();

        await expect(page.getByRole("button", { name: /Report$/ })).toBeVisible();
        await page.getByRole("button", { name: /Report$/ }).click();

        await expect(page.getByText("Request Moderator Assistance")).toBeVisible();

        await page.selectOption(".type-picker select", { value: "escaping" });

        const notes = page.locator(".notes");
        await notes.fill("E2E test reporting an escaper");

        const submitButton = await expectOGSClickableByName(page, /Report User$/);
        await submitButton.click();

        await expect(page.getByText("Thanks for the report!")).toBeVisible();

        // Go to the report page
        await page.goto("/reports-center");
        const myReports = page.getByText("My Own Reports");
        await expect(myReports).toBeVisible();
        await myReports.click();

        // We assume that the report is the first one in the list
        const reportButton = page.locator(".report-id > button");
        await reportButton.click();

        // Select an option...
        await page.locator('.action-selector input[type="radio"]').first().click();

        // ... then we should be allowed to vote.

        await expectOGSClickableByName(page, /Vote$/);

        // .. but instead, let's cancel this report, to tidy up.

        await myReports.click();
        const cancelButton = await expectOGSClickableByName(page, /Cancel$/);
        await cancelButton.click();

        await expect(reportButton).toBeHidden();
    });
});
