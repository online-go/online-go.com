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
 * A harassment or inappropriate-content report blocks the reported user as a
 * side effect. The reporter is told about that block with a toast, and only
 * when the report is what applied the block: re-reporting someone who is
 * already blocked must not claim to have blocked them again.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, TestInfo, expect } from "@playwright/test";

import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";
import {
    goToUsersProfile,
    newTestUsername,
    openPlayerDetailsPopover,
    prepareNewUser,
    reportUser,
} from "@helpers/user-utils";

export const reportBlockToastTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const reporterName = newTestUsername("RBTReporter");
    const accusedName = newTestUsername("RBTAccused");

    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedName, "test");
    await accusedPage.close();

    const { userPage: reporterPage } = await prepareNewUser(createContext, reporterName, "test");

    const blockToast = reporterPage.locator(".toast-container", {
        hasText: `We've blocked ${accusedName} for you.`,
    });

    await withReportCountTracking(reporterPage, testInfo, async (tracker) => {
        await goToUsersProfile(reporterPage, accusedName);

        // First report: the accused is not blocked yet, so this report blocks
        // them and the reporter is told about it.
        await reportUser(
            reporterPage,
            accusedName,
            "harassment",
            "E2E test: harassment report that blocks the accused",
        );
        await tracker.assertCountIncreasedBy(reporterPage, 1);

        await expect(blockToast).toBeVisible();
        await expect(blockToast).toContainText("You can undo this from their player card.");

        // Clicking the toast body dismisses it.
        await blockToast.click();
        await expect(blockToast).toBeHidden();

        // The toast's claim must match the block controls on the player card.
        const playerLink = reporterPage
            .locator(`a.Player[data-ready="true"]:not(.nodetails):has-text("${accusedName}")`)
            .first();
        await openPlayerDetailsPopover(reporterPage, playerLink);
        const blockButton = await expectOGSClickableByName(reporterPage, /Block$/);
        await blockButton.click();
        const chatBlockCheckbox = reporterPage.locator(
            ".BlockPlayerModal input[id^='block-chat-']",
        );
        await expect(chatBlockCheckbox).toBeChecked();

        // Popovers close on a backdrop click, not on Escape. Closing the block
        // popover also closes the player card behind it.
        await reporterPage
            .locator(".popover-backdrop")
            .last()
            .click({ position: { x: 5, y: 5 } });
        await expect(chatBlockCheckbox).toBeHidden();

        // Second report: the accused is already blocked, so no block toast.
        await reportUser(
            reporterPage,
            accusedName,
            "inappropriate_content",
            "E2E test: second report of an already blocked user",
        );
        await tracker.assertCountIncreasedBy(reporterPage, 2);

        // The toast would be rendered as soon as the "Thanks for the report!"
        // alert is dismissed, which reportUser has already done. A short settle
        // guards against asserting before that render could have happened.
        await reporterPage.waitForTimeout(1000);
        await expect(blockToast).toHaveCount(0);
    });
};
