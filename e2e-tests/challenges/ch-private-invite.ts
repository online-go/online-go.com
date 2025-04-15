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

export const chPrivateInviteTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChPriInv"), // cspell:disable-line
        "test",
    );

    await loadChallengeModal(challengerPage);

    // We expect the defaults to be "ranked, not private or rengo"
    await checkChallengeForm(challengerPage, {
        rengo: false,
        private: false,
        ranked: true,
    });

    // Turn on private
    await fillOutStandardChallengeForm(
        challengerPage,
        {
            gameName: "Private Match 1",
            ranked: false,
            private: true,
        },
        { fillWithDefaults: false }, // don't set any other values
    );

    await checkChallengeForm(challengerPage, {
        gameName: "Private Match 1",
        rengo: false,
        private: true,
        ranked: false,
    });

    const auto_start_input = challengerPage.locator("#rengo-auto-start");
    await expect(auto_start_input).not.toBeVisible();

    const ranked_checkbox = challengerPage.locator("#challenge-ranked");
    await expect(ranked_checkbox).toBeDisabled();

    const rengo_checkbox = challengerPage.locator("#rengo-option");
    await expect(rengo_checkbox).toBeDisabled();

    await testChallengePOSTPayload(challengerPage, {
        rengo_auto_start: 0,
        game: {
            name: "Private Match 1",
            rules: "japanese",
            ranked: false,
            width: 19,
            height: 19,
            handicap: -1,
            komi_auto: "automatic",
            komi: null,
            disable_analysis: false,
            initial_state: null,
            private: true,
            rengo: false,
            time_control: "byoyomi",
            time_control_parameters: {
                main_time: 604800,
                period_time: 86400,
                periods: 5,
                periods_min: 1,
                periods_max: 300,
                pause_on_weekends: true,
                speed: "correspondence",
                system: "byoyomi",
                time_control: "byoyomi",
            },
            pause_on_weekends: true,
        },
        },

    );

    await reloadChallengeModal(challengerPage);

    // Turn on invite only
    await fillOutStandardChallengeForm(
        challengerPage,
    {
        gameName: "Private Match 2",
        invite_only: true,
    },
    { fillWithDefaults: false }, // don't set any other values
    );

    await checkChallengeForm(challengerPage, {
        gameName: "Private Match 2",
        rengo: false,
        private: true,
        ranked: false,
        invite_only: true,
    });

    await testChallengePOSTPayload(challengerPage, {
        invite_only: true,        
        game: {
            name: "Private Match 2",
            rules: "japanese",
            ranked: false,
            width: 19,
            height: 19,
            handicap: -1,
            komi_auto: "automatic",
            komi: null,
            disable_analysis: false,
            initial_state: null,
            private: true,
            rengo: false,
            time_control: "byoyomi",
            time_control_parameters: {
                main_time: 604800,
                period_time: 86400,
                periods: 5,
                periods_min: 1,
                periods_max: 300,
                pause_on_weekends: true,
                speed: "correspondence",
                system: "byoyomi",
                time_control: "byoyomi",
            },
            pause_on_weekends: true,
        },
        },
        { logRequestBody: true },
    );
};
