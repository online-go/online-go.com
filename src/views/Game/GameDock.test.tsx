/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { GameDock } from "./GameDock";
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
    annulled: false,
    selected_ai_review_uuid: "",
    ai_review_enabled: false,
    historical_black: null,
    historical_white: null,
    ai_suspected: false,
    onZenClicked: jest.fn(),
    onCoordinatesClicked: jest.fn(),
    onAIReviewClicked: jest.fn(),
    onAnalyzeClicked: jest.fn(),
    onConditionalMovesClicked: jest.fn(),
    onPauseClicked: jest.fn(),
    onEstimateClicked: jest.fn(),
    onGameAnnulled: jest.fn(),
    onTimingClicked: jest.fn(),
    onCoordinatesMarked: jest.fn(),
    onReviewClicked: jest.fn(),
    onDetectionResultsClicked: jest.fn(),
};

test("providing both Game ID and Review ID cause SGF buttons to link to review SGFs", () => {
    data.set("user", TEST_USER);
    const goban = createGoban({ game_id: 123456, review_id: 123 });

    render(
        <Router>
            <GobanContext.Provider value={goban}>
                <GameDock {...BASE_PROPS} />
            </GobanContext.Provider>
        </Router>,
    );
    const sgf_buttons = screen.getAllByText("Download SGF");
    const sgf_button = sgf_buttons[1];
    expect(sgf_button).toBeDefined();
    expect(sgf_button.getAttribute("href")).toBe("/api/v1/reviews/123/sgf?without-comments=1");

    const sgf_buttons_with_comments = screen.getAllByText("SGF with comments");
    const sgf_button_with_comments = sgf_buttons_with_comments[1];
    expect(sgf_button_with_comments).toBeDefined();
    expect(sgf_button_with_comments.getAttribute("href")).toBe("/api/v1/reviews/123/sgf");
});
