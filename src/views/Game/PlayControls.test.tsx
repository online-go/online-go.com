import { Goban } from "goban";
import { PlayControls } from "./PlayControls";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import * as data from "data";

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
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "https://secure.gravatar.com/avatar/8d809ecc50408afc399a4cb7c8fd4510?s=32&d=retro",
    email: "",
    email_validated: false,
    is_announcer: false,
} as const;

const PLAY_CONTROLS_DEFAULTS = {
    show_cancel: true,
    player_to_move: 1,
    onCancel: () => {
        return;
    },
    resign_text: "Resign",
    view_mode: "wide",
    user_is_player: true,
    review_list: [] as any,
    stashed_conditional_moves: null,
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
    zen_mode: false,
    selected_chat_log: "main",
    stopEstimatingScore: () => {
        return;
    },
} as const;

test("Show only cancel if no moves have been played", () => {
    const goban = new Goban({
        game_id: 1234,
    });
    data.set("user", TEST_USER);

    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} resign_text="Cancel Game" />);

    expect(screen.getByText("Cancel Game")).toBeDefined();
    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.queryByText("Accept Undo")).toBeNull();
    expect(screen.queryByText("Submit")).toBeNull();
    expect(screen.queryByText("Pass")).toBeNull();
});

test("Don't render play buttons if user is not a player", () => {
    const goban = new Goban({ game_id: 1234 });
    data.set("user", TEST_USER);

    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} user_is_player={false} />);

    expect(screen.queryByText("Resign")).toBeNull();
    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.queryByText("Accept Undo")).toBeNull();
    expect(screen.queryByText("Submit")).toBeNull();
    expect(screen.queryByText("Pass")).toBeNull();
});

test("Renders undo if it is not the players turn", () => {
    const goban = new Goban({
        game_id: 1234,
        // Need to play at least one move before Undo button shows up
        moves: [
            [15, 15, 5241],
            [2, 2, 68110],
            [16, 2, 53287],
        ],
    });
    data.set("user", TEST_USER);

    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} />);

    expect(screen.getByText("Undo")).toBeDefined();
    expect(screen.queryByText("Accept Undo")).toBeNull();
});

test("Renders accept undo if undo requested", () => {
    const goban = new Goban({
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

    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} />);

    expect(screen.queryByText("Undo")).toBeNull();
    expect(screen.getByText("Accept Undo")).toBeDefined();
    expect(screen.getByText("Undo Requested")).toBeDefined();
});

test("Renders Pass if it is the user's turn", () => {
    const goban = new Goban({
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

    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} />);

    expect(screen.getByText("Pass")).toBeDefined();
});
