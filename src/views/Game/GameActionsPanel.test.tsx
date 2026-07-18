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

import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { GameActionsPanel } from "./GameActionsPanel";
import { GobanControllerContext } from "./goban_context";
import { BrowserRouter as Router } from "react-router-dom";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { openSGFCollectionModal } from "@/components/SGFCollectionModal";

// Mock the SGF Collection Modal
jest.mock("@/components/SGFCollectionModal", () => ({
    openSGFCollectionModal: jest.fn(),
}));

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
    historical_black: null,
    historical_white: null,
};

function renderPanel(gameController: GobanController) {
    return render(
        <Router>
            <GobanControllerContext.Provider value={gameController}>
                <GameActionsPanel {...BASE_PROPS} />
            </GobanControllerContext.Provider>
        </Router>,
    );
}

test("providing both Game ID and Review ID cause SGF buttons to link to review SGFs", () => {
    data.set("user", TEST_USER);
    const gameController = new GobanController({ game_id: 123456, review_id: 123 });

    renderPanel(gameController);

    const sgf_button = screen.getByText("Download SGF").closest("a");
    expect(sgf_button).toBeDefined();
    expect(sgf_button?.getAttribute("href")).toBe("/api/v1/reviews/123/sgf?without-comments=1");

    const sgf_button_with_comments = screen.getByText("SGF with comments").closest("a");
    expect(sgf_button_with_comments).toBeDefined();
    expect(sgf_button_with_comments?.getAttribute("href")).toBe("/api/v1/reviews/123/sgf");
});

test("clicking 'Add to library' button opens SGF Collection Modal", () => {
    const mockOpenSGFCollectionModal = openSGFCollectionModal as jest.MockedFunction<
        typeof openSGFCollectionModal
    >;

    data.set("user", TEST_USER);
    const gameController = new GobanController({ game_id: 456789 });

    // Mock engine data for game name generation
    gameController.goban.engine.config.game_name = "Test Game Name";

    renderPanel(gameController);

    const addToLibraryButton = screen.getByText("Add to library");
    expect(addToLibraryButton).toBeInTheDocument();

    fireEvent.click(addToLibraryButton);

    expect(mockOpenSGFCollectionModal).toHaveBeenCalledWith(
        456789,
        "Test Game Name",
        expect.any(Function),
    );
});

test("'Add to library' button is disabled for anonymous users", () => {
    const anonymousUser = { ...TEST_USER, anonymous: true };
    data.set("user", anonymousUser);

    const gameController = new GobanController({ game_id: 456789 });

    renderPanel(gameController);

    const addToLibraryButton = screen.getByText("Add to library").closest("button");
    expect(addToLibraryButton).toBeInTheDocument();
    expect(addToLibraryButton).toBeDisabled();
    expect(addToLibraryButton).toHaveClass("disabled");
});
