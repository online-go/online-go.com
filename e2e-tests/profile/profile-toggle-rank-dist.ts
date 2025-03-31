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

// (No seeded data in use)

import { Browser } from "@playwright/test";
import { expect } from "@playwright/test";

import { newTestUsername, prepareNewUser, goToProfile } from "@helpers/user-utils";

export const profileRankDistributionGraphToggleTest = async ({ browser }: { browser: Browser }) => {
    const { userPage } = await prepareNewUser(
        browser,
        newTestUsername("proRDGTuser"), // cspell:disable-line
        "test",
    );

    await goToProfile(userPage);

    await expect(userPage.locator(".ratings-container .toggle-container")).toContainText("▶");

    await userPage.locator(".ratings-container .toggle-container").click();

    await expect(userPage.locator(".ratings-container .toggle-container")).toContainText("▼");

    await expect(userPage.locator(".RatingsChartDistribution")).toBeVisible();

    await userPage.locator(".ratings-container .toggle-container").click();

    await expect(userPage.locator(".RatingsChartDistribution")).toBeHidden();
};
