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
 * Tests that newly registered users start with zero vacation balance.
 *
 * Creates dynamically:
 * - A fresh user via prepareNewUser
 *
 * Flow:
 * 1. Register a new user
 * 2. Navigate to vacation settings
 * 3. Verify the vacation balance shows "0 seconds"
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import { expect } from "@playwright/test";

export const newUserVacationBalanceTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const username = newTestUsername("VacBal");
    const { userPage } = await prepareNewUser(createContext, username, "test");

    await userPage.goto("/user/settings");

    const vacationTab = userPage.getByText("Vacation", { exact: true });
    await expect(vacationTab).toBeVisible({ timeout: 10000 });
    await vacationTab.click();

    await expect(userPage.getByText("Vacation Control")).toBeVisible({ timeout: 10000 });

    // New users start with 0 vacation pool, but a small amount accrues
    // immediately (earn rate is ~10800s/day). Verify it shows seconds,
    // not minutes/hours/days — confirming the pool started near zero.
    await expect(userPage.getByText(/\d+ seconds? of vacation available/)).toBeVisible();
};
