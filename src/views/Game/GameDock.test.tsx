import { render, screen } from "@testing-library/react";
import * as React from "react";
import { GameDock } from "./GameDock";
import { Goban } from "goban";
import { GobanContext } from "./goban_context";
import { BrowserRouter as Router } from "react-router-dom";

const BASE_PROPS = {
    annulled: false,
    selected_ai_review_uuid: "",
    ai_review_enabled: false,
    historical_black: undefined,
    historical_white: undefined,
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
};

test("providing both Game ID and Review ID cause SGF buttons to link to review SGFs", () => {
    const goban = new Goban({ game_id: 123456, review_id: 123 });

    render(
        <Router>
            <GobanContext.Provider value={goban}>
                <GameDock {...BASE_PROPS} />
            </GobanContext.Provider>
        </Router>,
    );
    const sgf_button = screen.getByText("Download SGF");
    expect(sgf_button).toBeDefined();
    expect(sgf_button.getAttribute("href")).toBe("/api/v1/reviews/123/sgf?without-comments=1");

    const sgf_button_with_comments = screen.getByText("SGF with comments");
    expect(sgf_button_with_comments).toBeDefined();
    expect(sgf_button_with_comments.getAttribute("href")).toBe("/api/v1/reviews/123/sgf");
});
