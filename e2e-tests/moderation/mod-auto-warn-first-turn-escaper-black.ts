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

// Tests that black timing out on move 0 (before any move is played) triggers auto-warning.
// This complements mod-auto-warn-first-turn-escaper.ts which tests white timing out on move 1.

import type { CreateContextOptions } from "@helpers";

import { BrowserContext } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { log } from "@helpers/logger";
import { ogsTest } from "@helpers";

export const modWarnFirstTurnEscaperBlackTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    ogsTest.setTimeout(360 * 1000); // 6 minutes - waits 5mins for player timeout
    const { userPage: challengerPage } = await prepareNewUser(
        createContext,
        newTestUsername("CmFTEBChall"), // cspell:disable-line
        "test",
    );

    const escaperUsername = newTestUsername("CmFTEBEscaper"); // cspell:disable-line
    const { userPage: escaperPage } = await prepareNewUser(createContext, escaperUsername, "test");

    // Challenger challenges the escaper, but challenger chooses WHITE
    // This means escaper will be BLACK and must play the first move
    await createDirectChallenge(challengerPage, escaperUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E First Turn Escape Black Game",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "45",
        timePerPeriod: "10",
        periods: "1",
        color: "white", // Challenger is white, so escaper is black
    });

    // Escaper accepts - they are now black and must play first
    await acceptDirectChallenge(escaperPage);

    // Wait for the game to be visible on challenger's page
    const goban = challengerPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Escaper (black) does nothing - eventually times out on move 0
    // Challenger (white) waits and gets the warning ack

    log("modWarnFirstTurnEscaperBlackTest waiting for escaper (black) timeout (about 5 minutes...");
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
