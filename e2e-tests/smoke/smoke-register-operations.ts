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

// (No seeded data in use - must not use seeded data for smoke tests!)

import { Browser } from "@playwright/test";

import { logoutUser, registerNewUser, loginAsUser, newTestUsername } from "@helpers/user-utils";

export const smokeRegisterLogoutLogin = async ({ browser }: { browser: Browser }) => {
    const testInfo = {
        newUsername: newTestUsername("SmokeReg"),
    };

    const { userPage } = await registerNewUser(browser, testInfo.newUsername, "test");

    await logoutUser(userPage);

    await loginAsUser(userPage, testInfo.newUsername, "test");
};
