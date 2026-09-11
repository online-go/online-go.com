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

import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { FragAIReview } from "./fragments";
import { GobanControllerContext } from "./goban_context";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { GobanMovesArray } from "goban";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
}));

const fair_play_props = jest.fn();

jest.mock("@moderator-ui/FairPlay", () => ({
    FairPlayGameSummary: (props: Record<string, unknown>) => {
        fair_play_props(props);
        return <div data-testid="fair-play-summary" />;
    },
}));

const MOVES: GobanMovesArray = [
    [3, 3, 1000],
    [15, 15, 2000],
];

const MODERATOR = {
    anonymous: false,
    id: 123,
    username: "mod_user",
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
    is_moderator: true,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

function makeController(phase: "play" | "finished"): GobanController {
    return new GobanController({
        game_id: 1234,
        phase,
        black_player_id: 987,
        white_player_id: 456,
        start_time: 1000,
        end_time: 5000,
        moves: MOVES,
        players: {
            black: { id: 987, username: "someone" },
            white: { id: 456, username: "someone_else" },
        },
    });
}

function renderFragment(controller: GobanController, showFairPlay: boolean) {
    return render(
        <GobanControllerContext.Provider value={controller}>
            <FragAIReview showFairPlay={showFairPlay} />
        </GobanControllerContext.Provider>,
    );
}

beforeEach(() => {
    data.set("user", MODERATOR);
    fair_play_props.mockClear();
});

describe("fair play summary follows the moderator tools", () => {
    test("ongoing game: hidden while the moderator tools are off", () => {
        renderFragment(makeController("play"), false);
        expect(screen.queryByTestId("fair-play-summary")).toBeNull();
    });

    test("ongoing game: shown with the move timings while the moderator tools are on", () => {
        renderFragment(makeController("play"), true);
        expect(screen.getByTestId("fair-play-summary")).toBeDefined();
        const props = fair_play_props.mock.calls[0][0];
        expect(props.moves).toBe(MOVES);
        expect(props.start_time).toBe(1000);
        expect(props.end_time).toBe(5000);
    });

    test("finished game: hidden while the moderator tools are off", async () => {
        const controller = makeController("finished");
        renderFragment(controller, false);
        await waitFor(() => expect(document.querySelector(".AIReview")).not.toBeNull());
        expect(screen.queryByTestId("fair-play-summary")).toBeNull();
    });

    test("finished game: shown with the move timings while the moderator tools are on", async () => {
        const controller = makeController("finished");
        renderFragment(controller, true);
        await screen.findByTestId("fair-play-summary");
        const props = fair_play_props.mock.calls[0][0];
        expect(props.moves).toBe(MOVES);
        expect(props.start_time).toBe(1000);
        expect(props.end_time).toBe(5000);
    });
});
