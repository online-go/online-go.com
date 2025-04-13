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

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickInTheMiddle } from "@helpers/game-utils";

export const modDontAutoWarnBlitzTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("CmDWBChall"), // cspell:disable-line
        "test",
    );

    const escaperUsername = newTestUsername("CmDWBEscaper"); // cspell:disable-line
    const { userPage: escaperPage } = await prepareNewUser(browser, escaperUsername, "test");

    // Challenger challenges the escaper
    await createDirectChallenge(challengerPage, escaperUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E First Turn Escape Game",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "1",
        timePerPeriod: "1",
        periods: "1",
    });

    // escaper accepts
    await acceptDirectChallenge(escaperPage);

    // Challenger is black, plays a turn (to get past slow first-move-timer)
    // Wait for the Goban to be visible & definitely ready
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    await challengerPage.waitForTimeout(3000);

    await clickInTheMiddle(challengerPage);

    // Now challenger is waiting for escaper ... eventually escaper times out
    // and challenger gets the ack that we are looking for

    console.log(
        "cmDontAutoWarnBlitzTest waiting escaper timeout to not have warning (about a minute)",
    );

    // Wait a minute, then verify no warning was generated
    await challengerPage.waitForTimeout(60000);
    await expect(challengerPage.locator(".AccountWarningAck")).not.toBeVisible();
};
