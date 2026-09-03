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

function renderPanel(
    gameController: GobanController,
    extra_props: Partial<React.ComponentProps<typeof GameActionsPanel>> = {},
) {
    return render(
        <Router>
            <GobanControllerContext.Provider value={gameController}>
                <GameActionsPanel {...BASE_PROPS} {...extra_props} />
            </GobanControllerContext.Provider>
        </Router>,
    );
}

test("action-bar tabs are listed by name at the top of the menu", () => {
    data.set("user", TEST_USER);
    const gameController = new GobanController({ game_id: 123456 });
    const onAnalyze = jest.fn();
    const onConditional = jest.fn();
    const onClose = jest.fn();

    const { container } = renderPanel(gameController, {
        onClose,
        action_tabs: [
            {
                id: "game-analyze",
                type: "action",
                icon: "sitemap",
                title: "Analyze game",
                active: true,
                onClick: onAnalyze,
            },
            {
                id: "game-conditional",
                type: "action",
                icon: "exchange",
                title: "Plan conditional moves",
                disabled: true,
                onClick: onConditional,
            },
        ],
    });

    const items = container.querySelectorAll(".GameSidebarPanel-item");
    expect(items[0].textContent).toBe("Analyze game");
    expect(items[0].classList.contains("active")).toBe(true);
    expect(items[0].querySelector("i.fa-sitemap")).not.toBeNull();
    expect(items[1].textContent).toBe("Plan conditional moves");
    expect((items[1] as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByText("Analyze game"));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Plan conditional moves"));
    expect(onConditional).not.toHaveBeenCalled();
});

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

const OPPONENT = { id: 456, username: "test_user2" };
const ME = { id: TEST_USER.id, username: TEST_USER.username };

/** Four moves played, white went last, so it is black's (my) turn. */
function playerController() {
    return new GobanController({
        game_id: 456789,
        moves: [
            [16, 3, 9136.12], // B
            [3, 2, 1897.853], // W
            [15, 16, 4274.0], // B
            [14, 2, 3816], // W
        ],
        players: { black: ME, white: OPPONENT },
    });
}

describe("in-game actions", () => {
    beforeEach(() => {
        data.set("user", TEST_USER);
    });

    test("are absent for a spectator", () => {
        renderPanel(new GobanController({ game_id: 456789 }));

        expect(screen.queryByText("Request undo")).toBeNull();
        expect(screen.queryByText("Cancel game")).toBeNull();
        expect(screen.queryByText("Resign")).toBeNull();
    });

    test("offer undo and cancel game to a player", () => {
        renderPanel(playerController());

        expect(screen.getByText("Request undo").closest("button")).not.toBeDisabled();
        expect(screen.getByText("Cancel game")).toBeInTheDocument();

        // Only the requester's side is offered until the opponent asks.
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Reject Undo")).toBeNull();
    });

    test("say 'Resign' once the game is too old to cancel", () => {
        renderPanel(
            new GobanController({
                game_id: 456789,
                moves: [
                    [16, 3, 9136],
                    [3, 2, 18978.5],
                    [15, 16, 4274.5],
                    [14, 2, 3816],
                    [2, 15, 6869],
                    [16, 14, 6241.5],
                    [15, 4, 4485],
                ],
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(screen.getByText("Resign")).toBeInTheDocument();
        expect(screen.queryByText("Cancel game")).toBeNull();
    });

    test("turn the undo item into a withdrawal while my request is pending", () => {
        const controller = playerController();
        controller.goban.engine.undo_requested_by = ME.id;
        controller.goban.engine.undo_requested = 4;
        const cancel_undo = jest.spyOn(controller.goban, "cancelUndo").mockImplementation(() => {
            return;
        });

        renderPanel(controller);

        expect(screen.queryByText("Request undo")).toBeNull();
        fireEvent.click(screen.getByText("Cancel undo request"));
        expect(cancel_undo).toHaveBeenCalledTimes(1);
    });

    test("offer accept and reject when the opponent requested an undo", () => {
        const controller = playerController();
        controller.goban.engine.undo_requested_by = OPPONENT.id;
        controller.goban.engine.undo_requested = 4;
        const accept_undo = jest.spyOn(controller.goban, "acceptUndo").mockImplementation(() => {
            return;
        });

        renderPanel(controller);

        expect(screen.getByText("Reject Undo")).toBeInTheDocument();
        // Asking again is not on the table while their request is open.
        expect(screen.getByText("Request undo").closest("button")).toBeDisabled();

        fireEvent.click(screen.getByText("Accept Undo"));
        expect(accept_undo).toHaveBeenCalledTimes(1);
    });
});
