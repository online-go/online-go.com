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

import { render } from "@testing-library/react";
import * as React from "react";
import { GameModeratorAreaPanel } from "./GameModeratorAreaPanel";
import { GobanControllerContext } from "./goban_context";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { MODERATOR_POWERS } from "@/lib/moderation";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
}));

jest.mock("@/components/Player", () => ({
    Player: () => <span data-testid="player" />,
}));

const BASE_USER = {
    anonymous: false,
    id: 123,
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

const BLACK = { id: 987, username: "someone" };
const WHITE = { id: 456, username: "someone_else" };

function makeController(): GobanController {
    return new GobanController({
        game_id: 1234,
        phase: "play",
        black_player_id: BLACK.id,
        white_player_id: WHITE.id,
        players: { black: BLACK, white: WHITE },
    });
}

function renderPanel(bot_detection_results: rest_api.BotDetectionResults | null) {
    return render(
        <GobanControllerContext.Provider value={makeController()}>
            <GameModeratorAreaPanel
                historical_black={BLACK as unknown as rest_api.games.Player}
                historical_white={WHITE as unknown as rest_api.games.Player}
                black_flags={null}
                white_flags={null}
                bot_detection_results={bot_detection_results}
            />
        </GobanControllerContext.Provider>,
    );
}

describe("GameModeratorAreaPanel for community moderators", () => {
    beforeEach(() => {
        data.set("user", { ...BASE_USER, moderator_powers: MODERATOR_POWERS.AI_DETECTOR });
    });

    test("renders nothing when there is no flag to show", () => {
        const { container } = renderPanel(null);
        expect(container.querySelector(".GameModeratorAreaPanel")).toBeNull();
    });

    test("shows the AI suspected flag without the moderator controls", () => {
        const { container, getByText } = renderPanel({
            ai_suspected: [BLACK.id],
        } as unknown as rest_api.BotDetectionResults);
        expect(getByText("AI Suspected")).toBeDefined();
        expect(container.querySelector(".PlayerModSection-controls")).toBeNull();
    });
});

describe("GameModeratorAreaPanel for full moderators", () => {
    test("always shows the per-player controls", () => {
        data.set("user", { ...BASE_USER, is_moderator: true });
        const { container } = renderPanel(null);
        expect(container.querySelectorAll(".PlayerModSection-controls").length).toBe(2);
    });
});
