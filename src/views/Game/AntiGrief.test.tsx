/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import { AntiGrief } from "./AntiGrief";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import * as data from "@/lib/data";
import { MemoryRouter as Router } from "react-router-dom";
import { GobanControllerContext } from "./goban_context";
import { OgsHelpProvider } from "@/components/OgsHelpProvider";
import { GobanController } from "../../lib/GobanController";

const BLACK_PLAYER_ID = 123;
const WHITE_PLAYER_ID = 456;
const SPECTATOR_ID = 789;

const TEST_USER = {
    anonymous: false,
    id: BLACK_PLAYER_ID,
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

// Mirrors the `game/:id/stalling_score_estimate` message the server sends when
// it thinks the game is over but a player keeps playing useless moves.
function stallingScoreEstimate(predicted_winner: "black" | "white") {
    return {
        move_number: 0,
        predicted_winner,
        game_id: 1234,
        removed: "",
        score: 50.5,
        win_rate: predicted_winner === "black" ? 0.98 : 0.02,
        ownership: [],
    };
}

function makeController(predicted_winner: "black" | "white"): GobanController {
    return new GobanController({
        game_id: 1234,
        // AntiStalling reads engine.config.black_player_id / white_player_id.
        // The nested `players` shape alone does not populate those, which
        // silently makes every viewer a non-player -- so set both explicitly.
        black_player_id: BLACK_PLAYER_ID,
        white_player_id: WHITE_PLAYER_ID,
        players: {
            black: { id: BLACK_PLAYER_ID, username: "black_player" },
            white: { id: WHITE_PLAYER_ID, username: "white_player" },
        },
        stalling_score_estimate: stallingScoreEstimate(predicted_winner),
    } as any);
}

function WrapTest(props: { controller: GobanController; children: any }): React.ReactElement {
    const { controller } = props;
    return (
        <OgsHelpProvider>
            <Router>
                <GobanControllerContext.Provider value={controller}>
                    {props.children}
                </GobanControllerContext.Provider>
            </Router>
        </OgsHelpProvider>
    );
}

function renderAs(user: rest_api.UserConfig, predicted_winner: "black" | "white") {
    data.set("user", user);
    render(
        <WrapTest controller={makeController(predicted_winner)}>
            <AntiGrief />
        </WrapTest>,
    );
}

const ACCEPT_BUTTON = "Accept predicted winner and end game";

test("Shows the stalling estimate to the player predicted to win", () => {
    renderAs({ ...TEST_USER, id: BLACK_PLAYER_ID }, "black");

    expect(screen.getByText(ACCEPT_BUTTON)).toBeDefined();
});

test("Does not show the stalling estimate to the player who is behind", () => {
    // White is losing here. Prompting them to end the game is just a resign
    // button by another name, which is not what this feature is for.
    renderAs({ ...TEST_USER, id: WHITE_PLAYER_ID }, "black");

    expect(screen.queryByText(ACCEPT_BUTTON)).toBeNull();
});

test("Does not show the stalling estimate to the player who is behind as black", () => {
    // Same as above with the colours swapped, so the test would fail if the
    // component hardcoded a colour rather than comparing against the estimate.
    renderAs({ ...TEST_USER, id: BLACK_PLAYER_ID }, "white");

    expect(screen.queryByText(ACCEPT_BUTTON)).toBeNull();
});

test("Shows the stalling estimate to a non-player moderator", () => {
    renderAs({ ...TEST_USER, id: SPECTATOR_ID, is_moderator: true }, "black");

    expect(screen.getByText(ACCEPT_BUTTON)).toBeDefined();
});

test("Does not show the stalling estimate to a spectator", () => {
    renderAs({ ...TEST_USER, id: SPECTATOR_ID }, "black");

    expect(screen.queryByText(ACCEPT_BUTTON)).toBeNull();
});
