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

test("Renders play controls", () => {
    const goban = new Goban({ game_id: 1234 });
    data.set("user", TEST_USER);
    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} />);

    // TODO: figure out how to play moves on Goban wihtout socket connection so
    // that we can test existence of undo button
    expect(screen.getByText("Resign")).toBeDefined();
});

test("Renders play controls", () => {
    const goban = new Goban({ game_id: 1234 });
    data.set("user", TEST_USER);
    render(<PlayControls goban={goban} {...PLAY_CONTROLS_DEFAULTS} user_is_player={false} />);

    // TODO: figure out how to play moves on Goban wihtout socket connection so
    // that we can test existence of undo button
    expect(screen.queryByText("Resign")).toBeNull();
});
