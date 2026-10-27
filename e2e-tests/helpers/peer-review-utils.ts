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

import { BrowserContext, Page, expect } from "@playwright/test";
import type { CreateContextOptions } from "@helpers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves, resignActiveGame } from "@helpers/game-utils";

/** Two fresh users play an unranked 13x13 to resignation; returns the requester (black) on the finished game page.
 *
 * 13x13 because fresh accounts are weaker than the 9x9 requester floor. */
export async function playFinishedGame(
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
    role: string,
): Promise<{ requesterPage: Page; requesterName: string; opponentPage: Page; gameId: string }> {
    const requesterName = newTestUsername(`${role}Rq`);
    const { userPage: requesterPage } = await prepareNewUser(createContext, requesterName, "test");
    const opponentName = newTestUsername(`${role}Op`);
    const { userPage: opponentPage } = await prepareNewUser(createContext, opponentName, "test");

    await createDirectChallenge(requesterPage, opponentName, {
        ...defaultChallengeSettings,
        gameName: "E2E Peer Review Game",
        boardSize: "13x13",
        ranked: false,
    });
    await acceptDirectChallenge(opponentPage, requesterPage);
    await playMoves(
        requesterPage,
        opponentPage,
        ["D5", "E5", "D4", "E4", "D6", "E6", "C5", "F5"],
        "13x13",
    );
    await resignActiveGame(opponentPage);
    await expect(requesterPage.getByText("by Resignation")).toBeVisible();
    const gameId = new URL(requesterPage.url()).pathname.match(/^\/game\/(\d+)/)?.[1] ?? "";
    expect(gameId).not.toBe("");
    return { requesterPage, requesterName, opponentPage, gameId };
}

export async function requestPeerReview(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Request peer review" }).click();
    await page.locator('[role="dialog"]').getByRole("button", { name: "OK", exact: true }).click();
    await expect(page.getByText("Peer review requested")).toBeVisible();
}
