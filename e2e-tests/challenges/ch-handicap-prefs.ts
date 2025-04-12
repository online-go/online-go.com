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

import {
    checkChallengeForm,
    fillOutChallengeForm,
    loadChallengeModal,
    reloadChallengeModal,
    testChallengePOSTPayload,
} from "@helpers/challenge-utils";

export const chHandicapPrefsTest = async ({ browser }: { browser: Browser }) => {
    const { userPage: challengerPage } = await prepareNewUser(
        browser,
        newTestUsername("ChHandicapPr"), // cspell:disable-line
        "test",
    );

    await loadChallengeModal(challengerPage);

    // Lets see if the default OGS new account values appear as expected
    await checkChallengeForm(challengerPage, {
        gameName: "",
        boardSize: "19x19",
        speed: "correspondence",
        timeControl: "byoyomi",
        mainTime: "604800",
        timePerPeriod: "86400",
        periods: "5",
        handicap: "-1",
        komi: "automatic",
        ranked: true,
        private: false,
        rules: "japanese",
        width: 19,
        height: 19,
        komi_auto: "automatic",
        disable_analysis: false,
        rengo: false,
        rengo_casual_mode: true,
        pause_on_weekends: true,
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
    });

    await testChallengePOSTPayload(challengerPage, {
        initialized: false,
        min_ranking: -1000,
        max_ranking: 1000,
        challenger_color: "automatic",
        rengo_auto_start: 0,
        game: {
            name: "Friendly Match",
            rules: "japanese",
            ranked: true,
            width: 19,
            height: 19,
            handicap: -1,
            komi_auto: "automatic",
            komi: null,
            disable_analysis: false,
            initial_state: null,
            private: false,
            rengo: false,
            rengo_casual_mode: true,
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
    });

    // Load a fresh challenge page
    await reloadChallengeModal(challengerPage);

    // Lets see if the default OGS new account values appear again as expected
    await checkChallengeForm(challengerPage, {
        gameName: "",
        boardSize: "19x19",
        speed: "correspondence",
        timeControl: "byoyomi",
        mainTime: "604800",
        timePerPeriod: "86400",
        periods: "5",
        handicap: "-1",
        komi: "automatic",
        ranked: true,
        private: false,
        rules: "japanese",
        width: 19,
        height: 19,
        komi_auto: "automatic",
        disable_analysis: false,
        rengo: false,
        rengo_casual_mode: true,
        pause_on_weekends: true,
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
    });

    // Change handicap
    // (Note that this also changes everything else to the default e2e test values)
    await fillOutChallengeForm(challengerPage, {
        gameName: "Handicap 2 Match",
        handicap: "2",
    });

    await testChallengePOSTPayload(challengerPage, {
        game: {
            name: "Handicap 2 Match",
            rules: "japanese",
            ranked: true,
            width: 19,
            height: 19,
            handicap: 2,
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
                speed: "blitz",
                system: "byoyomi",
                time_control: "byoyomi",
                pause_on_weekends: false,
            },
            pause_on_weekends: false,
        },
    });

    // Load a fresh challenge page
    await reloadChallengeModal(challengerPage);

    // Now see if Handicap in particular is remembered
    await checkChallengeForm(challengerPage, {
        gameName: "Handicap 2 Match",
        boardSize: "19x19",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
        handicap: "2",
        komi: "automatic",
        ranked: true,
        private: false,
        rules: "japanese",
        width: 19,
        height: 19,
        komi_auto: "automatic",
        disable_analysis: false,
        rengo: false,
        rengo_casual_mode: true,
        time_control_parameters: {
            main_time: 2,
            period_time: 2,
            periods: 1,
            periods_min: 1,
            periods_max: 10,
            speed: "blitz",
            system: "byoyomi",
            time_control: "byoyomi",
        },
    });

    // Try none handicap, which is the  meaning of 0
    await fillOutChallengeForm(challengerPage, {
        gameName: "Handicap 2 Match",
        handicap: "0",
    });

    await testChallengePOSTPayload(challengerPage, {
        game: {
            name: "Handicap 2 Match",
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
                speed: "blitz",
                system: "byoyomi",
                time_control: "byoyomi",
                pause_on_weekends: false,
            },
            pause_on_weekends: false,
        },
    });

    // Load a fresh challenge page
    await reloadChallengeModal(challengerPage);

    // see if Handicap in particular is remembered
    await checkChallengeForm(challengerPage, {
        gameName: "Handicap 2 Match",
        boardSize: "19x19",
        speed: "blitz",
        timeControl: "byoyomi",
        mainTime: "2",
        timePerPeriod: "2",
        periods: "1",
        handicap: "0",
        komi: "automatic",
        ranked: true,
        private: false,
        rules: "japanese",
        width: 19,
        height: 19,
        komi_auto: "automatic",
        disable_analysis: false,
        rengo: false,
        rengo_casual_mode: true,
        time_control_parameters: {
            main_time: 2,
            period_time: 2,
            periods: 1,
            periods_min: 1,
            periods_max: 10,
            speed: "blitz",
            system: "byoyomi",
            time_control: "byoyomi",
        },
    });

    // double check that it not only looks right, but also that the payload is correct
    await testChallengePOSTPayload(challengerPage, {
        game: {
            name: "Handicap 2 Match",
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
                speed: "blitz",
                system: "byoyomi",
                time_control: "byoyomi",
                pause_on_weekends: false,
            },
            pause_on_weekends: false,
        },
    });
};
