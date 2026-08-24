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

import { configure_goban } from "./configure-goban";
import * as data from "@/lib/data";
import { callbacks, GobanEngine } from "goban";
import type { GobanBase, GobanEngineConfig } from "goban";

const BLACK_ID = 111;
const WHITE_ID = 222;
const SPECTATOR_ID = 999;

const BASE_USER = {
    anonymous: false,
    id: BLACK_ID,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: false,
    supporter_level: 0,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

function setUser(id: number, anonymous: boolean = false) {
    data.set("user", { ...BASE_USER, id, anonymous });
}

function makeGoban(config: GobanEngineConfig = {}): GobanBase {
    const engine = new GobanEngine({
        width: 9,
        height: 9,
        players: {
            black: { id: BLACK_ID, username: "black-player" },
            white: { id: WHITE_ID, username: "white-player" },
        },
        disable_analysis: true,
        phase: "play",
        ...config,
    });
    return { engine } as unknown as GobanBase;
}

function isAnalysisDisabled(goban: GobanBase, perGameSettingAppliesToNonPlayers = false): boolean {
    if (!callbacks.isAnalysisDisabled) {
        throw new Error("isAnalysisDisabled callback was not configured");
    }
    return callbacks.isAnalysisDisabled(goban, perGameSettingAppliesToNonPlayers);
}

beforeAll(() => {
    configure_goban();
});

describe("isAnalysisDisabled", () => {
    test("disables analysis for a participant in a no-analysis game", () => {
        setUser(BLACK_ID);
        const goban = makeGoban();

        expect(isAnalysisDisabled(goban)).toBe(true);
    });

    test("allows analysis for a spectator in a no-analysis game", () => {
        setUser(SPECTATOR_ID);
        const goban = makeGoban();

        expect(isAnalysisDisabled(goban)).toBe(false);
    });

    test("disables analysis for a participant even when the engine was constructed before the user was loaded", () => {
        setUser(0, true);
        const goban = makeGoban();

        setUser(BLACK_ID);

        expect(isAnalysisDisabled(goban)).toBe(true);
    });

    test("allows analysis for a participant once the game is finished", () => {
        setUser(BLACK_ID);
        const goban = makeGoban({ phase: "finished" });

        expect(isAnalysisDisabled(goban)).toBe(false);
    });

    test("allows analysis for a participant when the game does not disable it", () => {
        setUser(BLACK_ID);
        const goban = makeGoban({ disable_analysis: false });

        expect(isAnalysisDisabled(goban)).toBe(false);
    });

    test("per-game setting applies to spectators when requested (SGF download)", () => {
        setUser(SPECTATOR_ID);
        const goban = makeGoban();

        expect(isAnalysisDisabled(goban, true)).toBe(true);
    });
});
