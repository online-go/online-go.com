/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { render, screen } from "@testing-library/react";
import type { KibitzRoomUser, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzVariationList } from "./KibitzVariationList";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user?: { username?: string } }) => (
        <span data-testid="Player">{user?.username ?? ""}</span>
    ),
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => <span data-testid="KibitzUserAvatar" />,
}));

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    pgettext: (_context: string, text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
}));

function makeUser(id: number, username: string): KibitzRoomUser {
    return {
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    };
}

function makeVariation(id: string, gameId: number, title: string): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: gameId,
        creator: makeUser(gameId, `${title}-creator`),
        created_at: gameId,
        viewer_count: 0,
        current_viewers: [],
        title,
        analysis_from: 87,
        move_count: 5,
    };
}

function makeGame(gameId: number, title: string, black: string, white: string): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: "19x19",
        title,
        black: makeUser(gameId * 10 + 1, black),
        white: makeUser(gameId * 10 + 2, white),
    };
}

describe("KibitzVariationList", () => {
    it("renders the active variations quick-list", () => {
        const onRecallVariation = jest.fn();
        const onHideVariation = jest.fn();
        const gameById = new Map<number, KibitzWatchedGame>([
            [10, makeGame(10, "Current board", "Alpha", "Beta")],
            [20, makeGame(20, "Older board", "Gamma", "Delta")],
            [30, makeGame(30, "Newest old board", "Epsilon", "Zeta")],
        ]);

        render(
            <KibitzVariationList
                variations={[
                    makeVariation("b1", 30, "B1"),
                    makeVariation("a2", 10, "A2"),
                    makeVariation("a1", 10, "A1"),
                    makeVariation("c1", 20, "C1"),
                ]}
                currentGameId={10}
                gameById={gameById}
                selectedVariationId="a2"
                variationColorIndexes={{ a1: 0, a2: 1, b1: 2, c1: 3 }}
                onRecallVariation={onRecallVariation}
                onHideVariation={onHideVariation}
            />,
        );

        expect(screen.getByText("Active variations")).toBeInTheDocument();
        expect(screen.getByText("A1")).toBeInTheDocument();
        expect(screen.getByText("A2")).toBeInTheDocument();
        expect(screen.getByText("B1")).toBeInTheDocument();
        expect(screen.getByText("C1")).toBeInTheDocument();
        expect(screen.getByText("Current Game")).toBeInTheDocument();
        expect(screen.getAllByRole("link", { name: "Open original game" })).toHaveLength(2);
        expect(screen.getByText("Previous game: Older board")).toBeInTheDocument();
        expect(screen.getByText("Previous game: Newest old board")).toBeInTheDocument();
        expect(screen.getByText("Gamma")).toBeInTheDocument();
        expect(screen.getByText("Delta")).toBeInTheDocument();
        expect(screen.getByText("Epsilon")).toBeInTheDocument();
        expect(screen.getByText("Zeta")).toBeInTheDocument();
        expect(screen.getAllByText("M87")).toHaveLength(4);
        expect(screen.getAllByText("+5")).toHaveLength(4);
        expect(screen.getAllByLabelText("Hide from board")).toHaveLength(4);
        expect(screen.getAllByTestId("Player")).toHaveLength(4);
    });

    it("shows previous game separators without a current game separator when only older games are visible", () => {
        const onRecallVariation = jest.fn();
        const onHideVariation = jest.fn();
        const gameById = new Map<number, KibitzWatchedGame>([
            [20, makeGame(20, "Older board", "Gamma", "Delta")],
        ]);

        render(
            <KibitzVariationList
                variations={[makeVariation("c1", 20, "C1"), makeVariation("c2", 20, "C2")]}
                currentGameId={10}
                gameById={gameById}
                selectedVariationId={null}
                variationColorIndexes={{ c1: 0, c2: 1 }}
                onRecallVariation={onRecallVariation}
                onHideVariation={onHideVariation}
            />,
        );

        expect(screen.queryByText("Current Game")).toBeNull();
        expect(screen.getByText("Previous game: Older board")).toBeInTheDocument();
        expect(screen.getByText("Gamma")).toBeInTheDocument();
        expect(screen.getByText("Delta")).toBeInTheDocument();
        expect(screen.getAllByLabelText("Hide from board")).toHaveLength(2);
    });
});
