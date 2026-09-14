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

/*
 * No seeded data in use
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";

import {
    prepareNewUser,
    newTestUsername,
    openPlayerDetailsPopover,
    tickReportAttestations,
} from "@helpers/user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { passAndScoreGame, playMoves, waitForGameViewReady } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

/*
 * The escaping checklist's one attestation, escaping.waited_reasonable_time, is the only
 * thing gating submission once every data check passes. No other test proves that: the
 * during-game test ticks attestations through the shared helper and submits, so it would
 * still pass if the attestation stopped gating altogether.
 *
 * The game is played out and scored so that game_ended, not_resigned and enough_moves all
 * pass — leaving the attestation alone holding the button.
 *
 * This test deliberately does not submit, so no report is filed and no incident-indicator
 * lock is needed.
 */
export const escapingAttestationRequiredTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("EAttRep"),
        "test",
    );

    const accusedUsername = newTestUsername("EAttAcc");
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // Generous clocks: this test is about the checklist, so browser speed must not
    // decide the game's outcome.
    //
    // Reporter plays white deliberately: ranked challenges (the default here) disable
    // custom komi entirely, so automatic komi's default advantage to white is
    // unavoidable. With only a handful of symmetric center stones and no captures,
    // that advantage decides the game — putting the accused on black instead of white
    // means the accused loses on komi rather than winning, which escaping.not_winner
    // now requires. Otherwise the checklist collapses to that single blocker instead
    // of leaving the attestation this test means to exercise.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E escaping attestation",
        boardSize: "9x9",
        speed: "live",
        mainTime: "300",
        timePerPeriod: "30",
        periods: "5",
        color: "white",
    });

    await acceptDirectChallenge(accusedPage, reporterPage);

    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // At least two moves, so escaping.enough_moves passes. playMoves takes
    // (black, white) positionally — accused is black here, reporter is white.
    await playMoves(accusedPage, reporterPage, ["D5", "E5", "D6", "E6"], "9x9");

    // End by passing and scoring: escaping.game_ended passes and nobody resigned.
    // The accused is black, so their page passes first.
    await passAndScoreGame(accusedPage, reporterPage);

    await waitForGameViewReady(reporterPage);

    const playerLink = reporterPage.locator(
        `.black.player-name-container a.Player[data-ready="true"]`,
    );
    await openPlayerDetailsPopover(reporterPage, playerLink);

    const reportButton = await expectOGSClickableByName(reporterPage, /Report$/);
    await reportButton.click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    // Every data check should pass, leaving only the attestation outstanding. A
    // satisfied data check is not rendered at all (see ReportChecklist.tsx), so its
    // absence alone would not distinguish "passed" from "never resolved" or "excluded
    // for some other reason". Instead: wait out the shared pending row so evaluation
    // has definitely finished, then confirm none of the four escaping data checks
    // rendered a row of their own. `blocked` and `actionable` both render a row and
    // `unavailable` does too, so ruling those out - plus the textarea being present at
    // all, which rules out `blocked` collapsing the form - leaves `satisfied` as the
    // only state each of the four checks could be in.
    await expect(reporterPage.locator('li[data-state="pending"]')).toHaveCount(0);

    await expect(reporterPage.locator('[data-checklist-item="escaping.game_ended"]')).toHaveCount(
        0,
    );
    await expect(reporterPage.locator('[data-checklist-item="escaping.not_winner"]')).toHaveCount(
        0,
    );
    await expect(reporterPage.locator('[data-checklist-item="escaping.not_resigned"]')).toHaveCount(
        0,
    );
    await expect(reporterPage.locator('[data-checklist-item="escaping.enough_moves"]')).toHaveCount(
        0,
    );

    const attestation = reporterPage.locator(
        '[data-checklist-item="escaping.waited_reasonable_time"]',
    );
    await expect(attestation).toBeVisible();
    await expect(attestation).toHaveAttribute("data-state", "actionable");

    // The attestation is the only checklist row left at all.
    await expect(reporterPage.locator("[data-checklist-item]")).toHaveCount(1);

    await reporterPage.locator("textarea.notes").fill("E2E test - checking the attestation gate");

    // The button is held by the unticked attestation alone.
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();

    await tickReportAttestations(reporterPage);

    await expect(attestation).toHaveAttribute("data-state", "satisfied");
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).toBeEnabled();
};
