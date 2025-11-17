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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { clickInTheMiddle } from "@helpers/game-utils";
import { log } from "@helpers/logger";

export const modWarnFirstTurnEscapersTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("CmFTEChall"), // cspell:disable-line
        "test",
    );

    const escaperUsername = newTestUsername("CmFTEEscaper"); // cspell:disable-line
    const { userPage: escaperPage } = await prepareNewUser(createContext, escaperUsername, "test");

    // Challenger challenges the escaper
    await createDirectChallenge(challengerPage, escaperUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E First Turn Escape Game",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
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

    log("cmWarnFirstTurnEscaper waiting escaper timeout (about a minute)...");
    await challengerPage
        .locator(
            '.AccountWarningAck .canned-message:has-text("We\'ve noticed that the other player left game")',
        )
        .waitFor();
    await challengerPage.locator(".AccountWarningAck button.primary").click();

    // And escaper should have warning...
    await escaperPage
        .locator(
            '.AccountWarningInfo .canned-message:has-text("We\'ve noticed that you joined game")',
        )
        .waitFor();

    await escaperPage.locator(".AccountWarningInfo button.primary:not([disabled])").waitFor();
    await escaperPage.locator(".AccountWarningInfo button.primary").click();
};
