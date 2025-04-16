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

    // First test interactions without submitting

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
        ranked: false, // set false by private
    });

    const auto_start_input = challengerPage.locator("#rengo-auto-start");
    await expect(auto_start_input).not.toBeVisible();

    const ranked_checkbox = challengerPage.locator("#challenge-ranked");
    await expect(ranked_checkbox).toBeDisabled();

    const rengo_checkbox = challengerPage.locator("#rengo-option");
    await expect(rengo_checkbox).toBeDisabled();

    // Toggle invite only
    await fillOutStandardChallengeForm(
        challengerPage,
        {
            invite_only: true,
        },
        { fillWithDefaults: false }, // don't set any other values
    );

    await checkChallengeForm(challengerPage, {
        rengo: false,
        private: true,
        ranked: false,
        invite_only: true,
    });

    await expect(ranked_checkbox).toBeDisabled();
    await expect(rengo_checkbox).toBeDisabled();

    // Turn off private
    await fillOutStandardChallengeForm(
        challengerPage,
        {
            private: false,
        },
        { fillWithDefaults: false }, // don't set any other values
    );

    await checkChallengeForm(challengerPage, {
        rengo: false,
        private: false,
        ranked: false,
        invite_only: true,
    });

    await expect(ranked_checkbox).toBeEnabled();
    await expect(rengo_checkbox).toBeEnabled();
    await expect(auto_start_input).not.toBeVisible();

    // Now test POST payloads for the flags
    await testChallengePOSTPayload(challengerPage, {
        invite_only: true,
        game: {
            name: "Private Match 1",
            private: false,
            rengo: false,
            ranked: false,
        },
    });

    await reloadChallengeModal(challengerPage);

    await fillOutStandardChallengeForm(challengerPage, {
        gameName: "Private Match 2",
        private: true,
        rengo: false,
        ranked: false,
        invite_only: true,
    });

    await checkChallengeForm(challengerPage, {
        rengo: false,
        private: true,
        ranked: false,
        invite_only: true,
    });

    await testChallengePOSTPayload(challengerPage, {
        invite_only: true,
        game: {
            name: "Private Match 2",
            private: true,
            rengo: false,
            ranked: false,
        },
    });

    await reloadChallengeModal(challengerPage);

    await fillOutStandardChallengeForm(challengerPage, {
        gameName: "Private Match 3",
        private: true,
        rengo: false,
        ranked: false,
        invite_only: false,
    });

    await checkChallengeForm(challengerPage, {
        gameName: "Private Match 3",
        rengo: false,
        private: true,
        ranked: false,
        invite_only: false,
    });

    await testChallengePOSTPayload(challengerPage, {
        invite_only: false,
        game: {
            name: "Private Match 3",
            private: true,
            rengo: false,
            ranked: false,
        },
    });
};
