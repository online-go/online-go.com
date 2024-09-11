/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { PlayerCard } from "./PlayerCards";
import { createGoban } from "goban";
import { GobanContext } from "./goban_context";
import { BrowserRouter as Router } from "react-router-dom";
import * as data from "@/lib/data";

const TEST_USER = {
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
    icon: "https://secure.gravatar.com/avatar/8d809ecc50408afc399a4cb7c8fd4510?s=32&d=retro",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

const BASE_PROPS = {
    color: "white" as const,
    historical: null,
    estimating_score: false,
    show_score_breakdown: false,
    zen_mode: false,
    flags: null,
    ai_suspected: false,
    onScoreClick: jest.fn(),
};

test("make sure komi is displayed for white", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);

    const goban = createGoban({ game_id: 123456, komi: 5 });

    const props = { goban: goban, ...BASE_PROPS };

    const { container } = render(
        <Router>
            <GobanContext.Provider value={goban}>
                <PlayerCard {...props} />
            </GobanContext.Provider>
        </Router>,
    );
    const divElement = container.querySelector(".komi");

    expect(divElement).toHaveTextContent("5.0");
});

test("make sure komi is not displayed for black", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);

    const goban = createGoban({ game_id: 123456, komi: 5 });

    const props = { goban: goban, ...BASE_PROPS, color: "black" as const };

    const { container } = render(
        <Router>
            <GobanContext.Provider value={goban}>
                <PlayerCard {...props} />
            </GobanContext.Provider>
        </Router>,
    );
    const divElement = container.querySelector(".komi");

    if (divElement) {
        expect(divElement).toBeEmptyDOMElement();
    }
});
