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

import { prepareNewUser, newTestUsername } from "@helpers/user-utils";
import { createDirectChallenge, acceptDirectChallenge } from "@helpers/challenge-utils";
import { clickInTheMiddle } from "@helpers/game-utils";

export const modBlockEarlyEscapeReportTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("modBEERRep"),
        "test",
    );

    const reportedUsername = newTestUsername("modBEEREsc");
    const { userPage: reportedPage } = await prepareNewUser(
        createContext,
        reportedUsername,
        "test",
    );

    await createDirectChallenge(reporterPage, reportedUsername);

    await acceptDirectChallenge(reportedPage);

    await clickInTheMiddle(reporterPage);

    // Close any existing popovers first - their backdrop would block our click
    await reporterPage.keyboard.press("Escape");

    // Wait for the Player link to be ready (data loaded) before clicking
    const playerLink = reporterPage.locator(
        `.white.player-name-container a.Player[data-ready="true"]`,
    );
    await expect(playerLink).toBeVisible({ timeout: 15000 });
    await playerLink.click();

    // Wait for PlayerDetails popover to appear AND be fully loaded
    await expect(reporterPage.locator('.PlayerDetails[data-ready="true"]')).toBeVisible({
        timeout: 15000,
    });

    await expect(reporterPage.getByRole("button", { name: /Report$/ })).toBeVisible();
    await reporterPage.getByRole("button", { name: /Report$/ }).click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    const notesBox = reporterPage.locator(".notes");

    // Wait for the placeholder to change to include the expected text
    await expect(notesBox).toHaveAttribute("placeholder", /leaves the game without playing/);

    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();
};
