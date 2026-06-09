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
import { act, render, screen } from "@testing-library/react";
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzMainGameStats } from "./KibitzMainGameStats";

const clockSpy = jest.fn(({ color, goban }: { color: "black" | "white"; goban: unknown }) => (
    <span data-testid={`clock-${color}`}>{goban ? color : "missing"}</span>
));

jest.mock("@/components/Clock/Clock", () => ({
    __esModule: true,
    Clock: (props: { color: "black" | "white"; goban: unknown }) => clockSpy(props),
}));

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: KibitzRoomUser }) => (
        <span className="Player">
            <span className="Player-username">{user.username}</span>
        </span>
    ),
}));

jest.mock("@/components/Player/PlayerDetails", () => ({
    __esModule: true,
    PlayerDetails: () => null,
}));

jest.mock("@/components/GobanView/hooks", () => {
    return {
        __esModule: true,
        generateGobanHook:
            <
                T,
                G extends {
                    on?: (event: string, cb: () => void) => void;
                    off?: (event: string, cb: () => void) => void;
                },
            >(
                deriveProp: (goban: G) => T,
                events: Array<string> = [],
            ) =>
            (goban: G) => {
                const [prop, setProp] = React.useState(() => deriveProp(goban));

                React.useEffect(() => {
                    const syncProp = () => {
                        setProp(deriveProp(goban));
                    };

                    syncProp();

                    if (!goban) {
                        return undefined;
                    }

                    const eventNames = ["load", ...events];
                    for (const eventName of eventNames) {
                        goban.on?.(eventName, syncProp);
                    }

                    return () => {
                        for (const eventName of eventNames) {
                            goban.off?.(eventName, syncProp);
                        }
                    };
                }, [goban]);

                return prop;
            },
    };
});

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: ({ user }: { user: KibitzRoomUser }) => (
        <span className="KibitzUserAvatar">{user.username}</span>
    ),
}));

jest.mock("@/lib/popover", () => ({
    __esModule: true,
    popover: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    pgettext: (_context: string, text: string) => text,
}));

type MockEngine = {
    phase: string;
    mode: string;
    outcome: string;
    time_control: object | null;
    winner?: number | "black" | "white";
    paused_since?: number | null;
    playerToMove: () => number;
    computeScore: (only_prisoners?: boolean) => {
        black: { prisoners: number };
        white: { prisoners: number };
    };
};

type MockControllerBundle = {
    controller: GobanController;
    emitter: EventEmitter;
};

function makeGame(): KibitzWatchedGame {
    const player = (id: number, username: string): KibitzRoomUser => ({
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    });

    return {
        game_id: 42,
        board_size: "19x19",
        title: "Test game",
        black: player(1, "Black"),
        white: player(2, "White"),
        live: true,
        move_number: 12,
    };
}

function makeController(engine: MockEngine): MockControllerBundle {
    const emitter = new EventEmitter();
    const goban = {
        engine,
        mode: "play",
        paused_since: engine.paused_since ?? undefined,
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        emit: emitter.emit.bind(emitter),
    };

    return {
        controller: {
            goban,
        } as unknown as GobanController,
        emitter,
    };
}

describe("KibitzMainGameStats", () => {
    beforeEach(() => {
        clockSpy.mockClear();
    });

    it("renders fallback names before the controller exists", () => {
        render(<KibitzMainGameStats controller={null} game={makeGame()} variant="desktop" />);

        expect(screen.getAllByText("Black", { selector: ".Player-username" })).toHaveLength(1);
        expect(screen.getAllByText("White", { selector: ".Player-username" })).toHaveLength(1);
        expect(screen.queryByTestId("clock-black")).toBeNull();
    });

    it("renders captures and clocks from the live controller", () => {
        const { controller } = makeController({
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: {},
            winner: "black",
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 24 },
                white: { prisoners: 26 },
            }),
        });

        render(<KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />);

        expect(screen.getByText("24")).toBeInTheDocument();
        expect(screen.getByText("26")).toBeInTheDocument();
        expect(screen.getByTestId("clock-black")).toHaveTextContent("black");
        expect(screen.getByTestId("clock-white")).toHaveTextContent("white");
        expect(screen.getByText("VS")).toBeInTheDocument();
        expect(clockSpy).toHaveBeenCalledWith(
            expect.objectContaining({ color: "black", goban: controller.goban }),
        );
        expect(clockSpy).toHaveBeenCalledWith(
            expect.objectContaining({ color: "white", goban: controller.goban }),
        );
    });

    it("updates the active player class and desktop state label when the engine changes", () => {
        const engine: MockEngine = {
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: {},
            playerToMove: () => 1,
            winner: "black",
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        };
        const { controller, emitter } = makeController(engine);

        const { container } = render(
            <KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />,
        );

        expect(container.querySelector(".KibitzMainGameStats-side-black")).toHaveClass(
            "their-turn",
        );
        expect(container.querySelector(".KibitzMainGameStats-chip-state")).toBeNull();

        act(() => {
            engine.playerToMove = () => 2;
            engine.phase = "stone removal";
            emitter.emit("cur_move");
            emitter.emit("phase");
        });

        expect(container.querySelector(".KibitzMainGameStats-side-white")).toHaveClass(
            "their-turn",
        );
        expect(screen.getByText("Score")).toBeInTheDocument();
        expect(screen.getByText("Stone removal")).toBeInTheDocument();
    });

    it("renders a paused center chip when the game is paused", () => {
        const engine: MockEngine = {
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: {},
            paused_since: Date.now(),
            playerToMove: () => 1,
            winner: "black",
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        };
        const { controller, emitter } = makeController(engine);

        const { container } = render(
            <KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />,
        );

        act(() => {
            emitter.emit("paused", true);
        });

        expect(container.querySelector(".KibitzMainGameStats-chip-center")).toHaveTextContent(
            "Paused",
        );
    });

    it("renders a compact result token and finished status", () => {
        const { controller } = makeController({
            phase: "finished",
            mode: "play",
            outcome: "2.5",
            time_control: {},
            winner: "white",
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        render(<KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />);

        expect(screen.getByText("W+2.5")).toBeInTheDocument();
        expect(screen.getByText("Game finished")).toBeInTheDocument();
    });

    it("renders finished state and omits game state on mobile", () => {
        const { controller } = makeController({
            phase: "finished",
            mode: "play",
            outcome: "Resignation",
            time_control: {},
            winner: "black",
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        const { rerender } = render(
            <KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />,
        );

        expect(screen.getByText("Game finished")).toBeInTheDocument();
        expect(screen.getByText("B+R")).toBeInTheDocument();

        rerender(
            <KibitzMainGameStats controller={controller} game={makeGame()} variant="mobile" />,
        );

        expect(screen.queryByText("Game finished")).toBeNull();
        expect(screen.queryByText("B+R")).toBeNull();
    });

    it("omits clock elements when the game has no time control", () => {
        const { controller } = makeController({
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: null,
            playerToMove: () => 1,
            winner: "black",
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        render(<KibitzMainGameStats controller={controller} game={makeGame()} variant="desktop" />);

        expect(screen.queryByTestId("clock-black")).toBeNull();
        expect(screen.queryByTestId("clock-white")).toBeNull();
    });
});
