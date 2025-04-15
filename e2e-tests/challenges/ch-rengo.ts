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

import { Browser, expect } from "@playwright/test";

import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    checkChallengeForm,
    fillOutChallengeForm as fillOutStandardChallengeForm,
    loadChallengeModal,
    reloadChallengeModal,
    testChallengePOSTPayload,
} from "@helpers/challenge-utils";

export const chRengoTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChRengo"), // cspell:disable-line
        "test",
    );

    await loadChallengeModal(challengerPage);

    await checkChallengeForm(challengerPage, {
        rengo: false,
        private: false,
        ranked: true,
    });

    await fillOutStandardChallengeForm(
        challengerPage,
        {
            gameName: "Rengo Match 1",
            ranked: false,
            rengo: true,
            rengo_casual_mode: true,
        },
        { fillWithDefaults: false }, // don't set any other values (because rengo forces some)
    );

    await checkChallengeForm(challengerPage, {
        gameName: "Rengo Match 1",
        rengo: true,
        rengo_casual_mode: true,
        private: false,
        ranked: false,
        timeControl: "simple", // rengo forces this.
    });

    await testChallengePOSTPayload(
        challengerPage,
        {
            rengo_auto_start: 0,
            game: {
                name: "Rengo Match 1",
                rules: "japanese",
                ranked: false,
                width: 19,
                height: 19,
                handicap: 0,
                komi_auto: "automatic",
                komi: null,
                disable_analysis: false,
                initial_state: null,
                private: false,
                rengo: true,
                rengo_casual_mode: true,
                time_control: "simple", // rengo forces this.
                time_control_parameters: {
                    per_move: 172800, // These are the default values for simple time control.
                    speed: "correspondence",
                    system: "simple",
                    time_control: "simple",
                    pause_on_weekends: true,
                },
                pause_on_weekends: true,
            },
        },
    );

    await reloadChallengeModal(challengerPage);

    await fillOutStandardChallengeForm(
        challengerPage,
        {
            gameName: "Rengo Match none",
            ranked: false,
            rengo: true,
            rengo_casual_mode: true,
            rengo_auto_start: "1", // this value disables create button
        },
        { fillWithDefaults: false },
    );

    const create_button = challengerPage.locator('button:has-text("Create Game")');
    await expect(create_button).toBeDisabled();

    await fillOutStandardChallengeForm(
        challengerPage,
        {
            rengo: true,
            rengo_casual_mode: true,
            rengo_auto_start: "2", // this value disables create button
        },
        { fillWithDefaults: false },
    );

    await expect(create_button).toBeDisabled();

    await fillOutStandardChallengeForm(
        challengerPage,
        {
            rengo: true,
            rengo_casual_mode: true,
            rengo_auto_start: "3", // lowest nonzero valid value
        },
        { fillWithDefaults: false },
    );

    await expect(create_button).toBeEnabled();
};
