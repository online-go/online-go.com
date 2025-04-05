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

import { Browser, expect } from "@playwright/test";
import { goToProfile, newTestUsername, prepareNewUser } from "@helpers/user-utils";
import { load } from "@helpers";
import path from "path";

const currentDir = new URL(".", import.meta.url).pathname;

export const smokeCssSanityTest = async ({ browser }: { browser: Browser }) => {
    const userContext = await browser.newContext();
    const page = await userContext.newPage();
    await load(page, "/");

    await await expect(page).toHaveScreenshot("logged-out-initial-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "basic_screenshot_mask.css"), // get rid of the "ObserveGames"
    });

    await load(page, "/sign-in");

    await await expect(page).toHaveScreenshot("sign-in-page.png", {
        fullPage: true,
    });

    // Now look at some logged in views, masking as needed...

    const { userPage } = await prepareNewUser(browser, newTestUsername("SmokeCss"), "test");

    await expect(userPage).toHaveScreenshot("initial-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "basic_screenshot_mask.css"),
    });

    await goToProfile(userPage);

    await expect(userPage).toHaveScreenshot("profile-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "profile_screenshot_mask.css"),
    });

    await load(userPage, "/ladders");
    await expect(userPage).toHaveScreenshot("ladders-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "ladders_screenshot_mask.css"),
    });

    await load(userPage, "/tournaments");
    await expect(userPage).toHaveScreenshot("tournaments-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "basic_screenshot_mask.css"),
    });

    await load(userPage, "/groups");
    await expect(userPage).toHaveScreenshot("groups-page.png", {
        fullPage: true,
        stylePath: path.join(currentDir, "groups_screenshot_mask.css"),
    });

    await userPage.close();
};
