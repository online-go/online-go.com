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

import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import type { GobanConfig } from "goban";
import { Modal } from "@/components/Modal";
import { get } from "@/lib/requests";
import { GameInfoModal } from "./GameInfoModal";

jest.mock("@/lib/requests", () => ({ get: jest.fn() }));
jest.mock("@/lib/data", () => ({ get: () => ({ id: 77, is_moderator: false }) }));
jest.mock("@/components/Player", () => ({
    Player: ({ user }: { user: number | { id: number; name?: string } }) => (
        <span data-player-id={typeof user === "number" ? user : user.id}>
            {typeof user === "number" ? `Player ${user}` : user.name}
        </span>
    ),
}));
jest.mock("@/components/TimeControl", () => ({ timeControlDescription: () => "" }));
jest.mock("@/components/GameAcceptModal", () => ({ handicapText: () => "None" }));

jest.mock("@/lib/misc", () => ({
    errorAlerter: jest.fn(),
    rulesText: () => "Japanese",
    yesno: () => "No",
    getGameResultText: () => "",
    navigateTo: jest.fn(),
    shouldOpenNewTab: () => false,
}));
jest.mock("@/lib/rank_utils", () => ({ rankString: () => "Rank" }));
jest.mock("@/lib/ogsHistory", () => ({ browserHistory: {} }));
jest.mock("@/lib/swal_config", () => ({ alert: jest.fn() }));

const mockGet = jest.mocked(get);

beforeEach(() => {
    mockGet.mockReset();
    jest.spyOn(Modal.prototype, "componentDidMount").mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

function modalProps(config: GobanConfig = {}) {
    return {
        config: {
            game_id: 123,
            komi: 6.5,
            width: 19,
            height: 19,
            players: {
                black: { id: 11, username: "Black player" },
                white: { id: 12, username: "White player" },
            },
            ...config,
        },
        black: { id: 11, username: "Black player" },
        white: { id: 12, username: "White player" },
        annulled: false,
        creatorId: 0,
    };
}

function creatorField() {
    return screen.getByText("Creator", { selector: "dt" }).nextElementSibling;
}

test("loads a missing creator from the game record and shows the public player header", async () => {
    let resolveGame!: (game: { creator: number }) => void;
    mockGet.mockReturnValue(
        new Promise((resolve) => {
            resolveGame = resolve;
        }),
    );
    const { container } = render(<GameInfoModal {...modalProps()} />);
    expect(creatorField()).toBeEmptyDOMElement();

    await act(async () => {
        resolveGame({ creator: 42 });
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("games/123");
    expect(creatorField()).toHaveTextContent("Player 42");
    expect(container.querySelector(".header h3 [data-player-id='11']")).not.toBeNull();
    expect(container.querySelector(".header h3 [data-player-id='12']")).not.toBeNull();
    expect(screen.queryByText("Save")).toBeNull();
});

test("keeps a creator already supplied by the game page", async () => {
    mockGet.mockResolvedValue({ creator: 42 });
    await act(async () => {
        render(<GameInfoModal {...modalProps()} creatorId={43} />);
    });
    expect(creatorField()).toHaveTextContent("Player 43");
});

test("keeps the review owner instead of replacing it with the source game creator", async () => {
    mockGet.mockResolvedValue({ creator: 42 });
    await act(async () => {
        render(<GameInfoModal {...modalProps({ review_id: 456 })} creatorId={77} />);
    });
    expect(creatorField()).toHaveTextContent("Player 77");
    expect(screen.getByText("Save")).toBeInTheDocument();
});

test("does not use a source game creator as an unknown review owner", async () => {
    mockGet.mockResolvedValue({ creator: 77 });
    await act(async () => {
        render(<GameInfoModal {...modalProps({ review_id: 456 })} />);
    });
    expect(creatorField()).toBeEmptyDOMElement();
    expect(screen.queryByText("Save")).toBeNull();
});

test("leaves the creator empty when the game request fails", async () => {
    mockGet.mockRejectedValue(new Error("Forbidden"));
    await act(async () => {
        render(<GameInfoModal {...modalProps()} />);
    });
    expect(creatorField()).toBeEmptyDOMElement();
});

test("does not fetch a game record for a standalone review", async () => {
    await act(async () => {
        render(
            <GameInfoModal
                {...modalProps({ game_id: undefined, review_id: 456 })}
                creatorId={77}
            />,
        );
    });
    expect(mockGet).not.toHaveBeenCalled();
    expect(creatorField()).toHaveTextContent("Player 77");
});
