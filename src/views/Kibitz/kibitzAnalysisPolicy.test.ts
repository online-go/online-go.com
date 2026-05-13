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

import * as data from "@/lib/data";
import {
    getCurrentKibitzUser,
    getKibitzAccessPolicyForUser,
    isActiveAnalysisDisabledGame,
    isCurrentUserGamePlayer,
    isKibitzAccessBlockedForUser,
    type KibitzAnalysisGameLike,
    type KibitzAnalysisUser,
} from "./kibitzAnalysisPolicy";

jest.mock("@/lib/data", () => ({
    __esModule: true,
    default: {},
    get: jest.fn(),
}));

const mockedData = data as jest.Mocked<typeof data>;

function makeUser(
    id: number | string,
    overrides?: Partial<KibitzAnalysisUser>,
): KibitzAnalysisUser {
    return {
        id,
        anonymous: false,
        ...overrides,
    };
}

function makeGame(overrides?: Partial<KibitzAnalysisGameLike>): KibitzAnalysisGameLike {
    return {
        live: true,
        ended: null,
        ...overrides,
    };
}

describe("kibitzAnalysisPolicy", () => {
    beforeEach(() => {
        mockedData.get.mockReset();
    });

    it("reads the current user from config.user first", () => {
        const user = makeUser(12);
        mockedData.get.mockImplementation((key: string) => {
            if (key === "config.user") {
                return user;
            }
            if (key === "user") {
                return makeUser(34);
            }
            return null;
        });

        expect(getCurrentKibitzUser()).toBe(user);
    });

    it("falls back to user when config.user is absent", () => {
        const user = makeUser(34);
        mockedData.get.mockImplementation((key: string) => {
            if (key === "config.user") {
                return null;
            }
            if (key === "user") {
                return user;
            }
            return null;
        });

        expect(getCurrentKibitzUser()).toBe(user);
    });

    it("allows anonymous users, missing users, and missing games", () => {
        expect(getKibitzAccessPolicyForUser(null, null)).toEqual({ allowed: true });
        expect(getKibitzAccessPolicyForUser({ anonymous: true }, makeGame())).toEqual({
            allowed: true,
        });
        expect(getKibitzAccessPolicyForUser(makeUser(1), null)).toEqual({ allowed: true });
    });

    it("allows finished analysis-disabled games", () => {
        const game = makeGame({
            live: false,
            ended: "2026-04-01T10:00:00Z",
            analysis_disabled: true,
            players: {
                black: { id: 1 },
                white: { id: 2 },
            },
        });

        expect(isActiveAnalysisDisabledGame(game)).toBe(false);
        expect(getKibitzAccessPolicyForUser(makeUser(1), game)).toEqual({ allowed: true });
    });

    it("blocks the current black player of an active analysis-disabled game", () => {
        const game = makeGame({
            analysis_disabled: true,
            players: {
                black: { id: 7 },
                white: { id: 8 },
            },
        });

        const user = makeUser(7);
        expect(isCurrentUserGamePlayer(user, game)).toBe(true);
        expect(getKibitzAccessPolicyForUser(user, game)).toEqual({
            allowed: false,
            reason: "own-active-analysis-disabled-game",
        });
        expect(isKibitzAccessBlockedForUser(user, game)).toBe(true);
    });

    it("blocks the current white player of an active analysis-disabled game", () => {
        const game = makeGame({
            disable_analysis: true,
            players: {
                black: { id: 7 },
                white: { id: 8 },
            },
        });

        expect(getKibitzAccessPolicyForUser(makeUser(8), game)).toEqual({
            allowed: false,
            reason: "own-active-analysis-disabled-game",
        });
    });

    it("treats player identifiers as strings or nested objects", () => {
        const game = makeGame({
            gamedata: {
                analysis_disabled: true,
            },
            players: {
                black: { id: "9", user_id: "9" },
                white: { user: { id: 10 } },
            },
        });

        expect(getKibitzAccessPolicyForUser(makeUser("9"), game)).toEqual({
            allowed: false,
            reason: "own-active-analysis-disabled-game",
        });
        expect(getKibitzAccessPolicyForUser(makeUser(10), game)).toEqual({
            allowed: false,
            reason: "own-active-analysis-disabled-game",
        });
    });

    it("allows spectators in active analysis-disabled games", () => {
        const game = makeGame({
            disable_analysis: true,
            players: {
                black: { id: 1 },
                white: { id: 2 },
            },
        });

        expect(getKibitzAccessPolicyForUser(makeUser(3), game)).toEqual({
            allowed: true,
            reason: "analysis-disabled-spectator",
        });
    });

    it("treats disable_analysis=true as analysis-disabled even when analysis_disabled=false", () => {
        const game = makeGame({
            analysis_disabled: false,
            disable_analysis: true,
            players: {
                black: { id: 1 },
                white: { id: 2 },
            },
        });

        expect(isActiveAnalysisDisabledGame(game)).toBe(true);
        expect(getKibitzAccessPolicyForUser(makeUser(3), game)).toEqual({
            allowed: true,
            reason: "analysis-disabled-spectator",
        });
    });
});
