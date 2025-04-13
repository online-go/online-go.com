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

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import { fillOutChallengeForm, loadChallengeModal } from "@helpers/challenge-utils";

import { testChallengePOSTPayload } from "@helpers/challenge-utils";

export const chBasicCreationTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChBasic"), // cspell:disable-line
        "test",
    );

    await loadChallengeModal(challengerPage);

    await fillOutChallengeForm(challengerPage, {
        gameName: "E2E Test game",
        boardSize: "19x19",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
    });

    await testChallengePOSTPayload(challengerPage, {
        game: {
            name: "E2E Test game",
            rules: "japanese",
            ranked: true,
            width: 19,
            height: 19,
            handicap: 0,
            komi_auto: "automatic",
            komi: null,
            disable_analysis: false,
            initial_state: null,
            private: false,
            rengo: false,
            rengo_casual_mode: true,
            time_control: "byoyomi",
            time_control_parameters: {
                main_time: 2,
                period_time: 2,
                periods: 1,
                periods_min: 1,
                periods_max: 10,
                pause_on_weekends: false,
                speed: "blitz",
                system: "byoyomi",
                time_control: "byoyomi",
            },
            pause_on_weekends: false,
        },
    });
};
