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

import { loginAsUser, newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickInTheMiddle } from "@helpers/game-utils";

import { ogsTest } from "@helpers";

export const modWarnFirstTurnDisconnectorTest = async ({ browser }: { browser: Browser }) => {
    ogsTest.setTimeout(6 * 60 * 1000); // Set timeout to 6 minutes, to let disconnect happen

    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("CmFTDChall"), // cspell:disable-line
        "test",
    );

    const escaperUsername = newTestUsername("CmFTDis"); // cspell:disable-line
    const { userPage: escaperPage } = await prepareNewUser(browser, escaperUsername, "test");

    // Challenger challenges the escaper
    await createDirectChallenge(challengerPage, escaperUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E First Turn Disconnector Game",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "360", // longer than the disconnect timer (which is 5 mins)
        timePerPeriod: "360",
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

    console.log(
        "Note: cmWarnFirstTurnDisconnectorTest waiting for disconnect timer (approximately 5 minutes)...",
    );
    await escaperPage.close(); // escaper disconnects

    // ... eventually challenger gets the ack that we are looking for
    await challengerPage
        .locator(
            '.AccountWarningAck .canned-message:has-text("We\'ve noticed that the other player left game")',
        )
        .waitFor();
    await challengerPage.locator(".AccountWarningAck button.primary").click();

    // And escaper should have warning when they log in again
    const newEscaperContext = await browser.newContext();
    const newEscaperPage = await newEscaperContext.newPage();

    await loginAsUser(newEscaperPage, escaperUsername, "test");

    await newEscaperPage
        .locator('.AccountWarning .canned-message:has-text("We\'ve noticed that you joined game")')
        .waitFor();

    await newEscaperPage.locator("#AccountWarning-accept:not([disabled])").waitFor();
    await newEscaperPage.locator("#AccountWarning-accept").check();
    await newEscaperPage.locator(".AccountWarning button.primary:not([disabled])").waitFor();
    await newEscaperPage.locator(".AccountWarning button.primary").click();
};
