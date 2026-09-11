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
import { render, screen } from "@testing-library/react";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "./GobanViewContext";
import { PlayerBar } from "./PlayerBar";

jest.mock("@/components/Clock", () => ({
    __esModule: true,
    Clock: ({ color }: { color: string }) => <div data-testid={`clock-${color}`} />,
}));
jest.mock("@/components/PlayerIcon", () => ({
    __esModule: true,
    PlayerIcon: ({ id }: { id: number }) => <div data-testid={`icon-${id}`} />,
}));
jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: number }) => <span>{`player-${user}`}</span>,
}));

function fakeController(opts: {
    phase: "play" | "stone removal" | "finished";
    outcome?: string;
    mode?: string;
    to_move?: number;
}): GobanController {
    const goban = {
        mode: opts.mode ?? "play",
        engine: {
            phase: opts.phase,
            outcome: opts.outcome ?? "",
            players: {
                black: { id: 11, username: "blackie" },
                white: { id: 22, username: "whitey" },
            },
            playerToMoveOnOfficialBranch: () => opts.to_move ?? 11,
            computeScore: () => ({
                black: { prisoners: 3, total: 40.5 },
                white: { prisoners: 1, total: 38 },
            }),
        },
        on: jest.fn(),
        off: jest.fn(),
    };
    return { goban } as unknown as GobanController;
}

function renderBar(controller: GobanController, color: "black" | "white") {
    return render(
        <GobanControllerContext.Provider value={controller}>
            <PlayerBar color={color} />
        </GobanControllerContext.Provider>,
    );
}

describe("PlayerBar", () => {
    test("shows captures during play", () => {
        renderBar(fakeController({ phase: "play" }), "black");
        expect(screen.getByText("3 captures")).toBeInTheDocument();
        expect(screen.getByTestId("clock-black")).toBeInTheDocument();
        expect(screen.getByTestId("icon-11")).toBeInTheDocument();
        expect(screen.getByText("player-11")).toBeInTheDocument();
    });

    test("shows points when finished by score", () => {
        renderBar(fakeController({ phase: "finished", outcome: "2.5 points" }), "black");
        expect(screen.getByText("40.5 points")).toBeInTheDocument();
    });

    test("keeps captures when finished by resignation", () => {
        renderBar(fakeController({ phase: "finished", outcome: "Resignation" }), "white");
        expect(screen.getByText("1 capture")).toBeInTheDocument();
    });

    test("marks the side to move", () => {
        const { container } = renderBar(fakeController({ phase: "play", to_move: 22 }), "white");
        expect(container.querySelector(".PlayerBar")).toHaveClass("their-turn");
    });

    test("reads the controller prop instead of the context controller", () => {
        const context = fakeController({ phase: "play" });
        const other = fakeController({ phase: "finished", outcome: "2.5 points" });
        render(
            <GobanControllerContext.Provider value={context}>
                <PlayerBar color="black" controller={other} />
            </GobanControllerContext.Provider>,
        );
        expect(screen.getByText("40.5 points")).toBeInTheDocument();
        expect(screen.queryByText("3 captures")).toBeNull();
    });
});
