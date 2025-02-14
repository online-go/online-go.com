/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import { createGoban, GobanRenderer, ConditionalMoveTree } from "goban";
import { PlayControls } from "./PlayControls";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import * as data from "@/lib/data";
import { MemoryRouter as Router } from "react-router-dom";
import { GobanContext } from "./goban_context";
import { act } from "react";
import { OgsHelpProvider } from "@/components/OgsHelpProvider";
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

const PLAY_CONTROLS_DEFAULTS = {
    show_cancel: true,
    player_to_move: 1,
    onCancel: () => {
        return;
    },
    review_list: [] as any,
    stashed_conditional_moves: undefined,
    mode: "play",
    phase: "play",
    title: "",
    show_title: false,
    renderEstimateScore: () => {
        return <React.Fragment />;
    },
    renderAnalyzeButtonBar: () => {
        return <React.Fragment />;
    },
    setMoveTreeContainer: () => {
        return;
    },
    onShareAnalysis: () => {
        return;
    },
    variation_name: "",
    updateVariationName: () => {
        return;
    },
    variationKeyPress: () => {
        return;
    },
    annulled: false,
    annulment_reason: null,
    zen_mode: false,
    selected_chat_log: "main",
    stopEstimatingScore: () => {
        return;
    },
} as const;

function WrapTest(props: { goban: GobanRenderer; children: any }): React.ReactElement {
    return (
        <OgsHelpProvider>
            <Router>
                <GobanContext.Provider value={props.goban}>{props.children}</GobanContext.Provider>
            </Router>
        </OgsHelpProvider>
    );
}

test("No moves have been played", () => {
    const goban = createGoban({
        game_id: 1234,
        // TEST_USER must be a member of the game in order for cancel to show up.
        players: {
            black: { id: 123, username: "test_user" },
            white: { id: 456, username: "test_user2" },
        },
    });
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );

    expect(screen.getByText("Cancel game")).toBeDefined();
    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.queryByText("Accept Undo")).toBeNull();
    expect(screen.queryByText("Submit")).toBeNull();
    expect(screen.getByText("Pass")).toBeDefined();
});

test("Don't render play buttons if user is not a player", () => {
    const goban = createGoban({ game_id: 1234 });
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );

    expect(screen.queryByText("Resign")).toBeNull();
    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.queryByText("Accept Undo")).toBeNull();
    expect(screen.queryByText("Submit")).toBeNull();
    expect(screen.queryByText("Pass")).toBeNull();
});

test("Renders undo if it is not the players turn", () => {
    const goban = createGoban({
        game_id: 1234,
        // Need to play at least one move before Undo button shows up
        moves: [
            [15, 15, 5241],
            [2, 2, 68110],
            [16, 2, 53287],
        ],
        // Since three moves have been played, black must have had the last move
        // That is one of the requirements for "undo" to show up.
        players: {
            black: { id: 123, username: "test_user" },
            white: { id: 456, username: "test_user2" },
        },
    });
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );

    expect(screen.getByText("Undo")).toBeDefined();
    expect(screen.queryByText("Accept Undo")).toBeNull();
});

test("Renders accept undo if undo requested", () => {
    const goban = createGoban({
        game_id: 1234,
        // Need to play at least one move before Undo button shows up
        moves: [
            [15, 15, 5241],
            [2, 2, 68110],
            [16, 2, 53287],
        ],
        players: {
            // Since three moves have been played, it's white's turn
            // That is one of the requirements for "accept undo" showing up.
            white: { id: 123, username: "test_user" },
            black: { id: 456, username: "test_user2" },
        },
    });
    goban.engine.undo_requested = 3;
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );

    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.getByText("Accept Undo")).toBeDefined();
    expect(screen.getByText("Undo Requested")).toBeDefined();
});

test("Renders Pass if it is the user's turn", () => {
    const goban = createGoban({
        game_id: 1234,
        moves: [
            [15, 15, 5241],
            [2, 2, 68110],
            [16, 2, 53287],
        ],
        players: {
            // Since three moves have been played, it's white's turn
            white: { id: 123, username: "test_user" },
            black: { id: 456, username: "test_user2" },
        },
    });
    goban.engine.undo_requested = 3;
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );

    expect(screen.getByText("Pass")).toBeDefined();
});

/**
 * ```
 * A19 B18
 * ├── cc
 * ├── dd ee
 * │   └── ff gg
 * └── hh ii
 * jj kk
 * ```
 */
function makeConditionalMoveTree() {
    return ConditionalMoveTree.decode([
        null,
        {
            aa: ["bb", { cc: [null, {}], dd: ["ee", { ff: ["gg", {}] }], hh: ["ii", {}] }],
            jj: ["kk", {}],
        },
    ]);
}

test("Renders conditional moves", () => {
    const goban = createGoban({
        game_id: 1234,
        moves: [],
        players: {
            // Since three moves have been played, it's white's turn
            white: { id: 123, username: "test_user" },
            black: { id: 456, username: "test_user2" },
        },
    });
    goban.setMode("conditional");
    goban.setConditionalTree(makeConditionalMoveTree());

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} mode="conditional" />
        </WrapTest>,
    );

    expect(screen.getByText("Conditional Move Planner")).toBeDefined();
    expect(screen.getByText("A19")).toBeDefined();
});

test("Unsubscribe from all events on unmount", () => {
    const goban = createGoban({ game_id: 1234 });
    data.set("user", TEST_USER);

    const getListenerCounts = (emitter: GobanRenderer) =>
        Object.fromEntries(emitter.eventNames().map((key) => [key, emitter.listenerCount(key)]));

    // Goban may set up listeners on itself
    const listeners_before = getListenerCounts(goban);

    const { unmount } = render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );
    unmount();

    expect(getListenerCounts(goban)).toEqual(listeners_before);
});

test("Pause buttons show up", () => {
    const goban = createGoban({
        game_id: 1234,
        // TEST_USER must be a member of the game in order for cancel to show up.
        players: {
            black: TEST_USER,
            white: { id: 456, username: "test_user2" },
        },
    });
    data.set("user", TEST_USER);

    render(
        <WrapTest goban={goban}>
            <PlayControls {...PLAY_CONTROLS_DEFAULTS} />
        </WrapTest>,
    );
    act(() => {
        // It would be more realistic to mock the "game/${id}/clock" socket event,
        // but AdHocClock is a complicated object and I'm not sure what params
        // to use to get the goban to actually pause.
        goban.pause_control = {
            paused: {
                pausing_player_id: 123,
                pauses_left: 4,
            },
        };
        goban.emit("paused", true);
    });

    expect(screen.getByText("Resume")).toBeDefined();
    expect(screen.getByText("Game Paused")).toBeDefined();
    expect(screen.getByText("4 pauses left for Black")).toBeDefined();
});
