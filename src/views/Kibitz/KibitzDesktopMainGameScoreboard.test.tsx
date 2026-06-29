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
import { readFileSync } from "node:fs";
import path from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import type { JGOFTimeControl } from "goban";
import {
    getDesktopMainGameMetadataRowText,
    KibitzDesktopMainGameScoreboard,
} from "./KibitzDesktopMainGameScoreboard";

const clockSpy = jest.fn(({ color, goban }: { color: "black" | "white"; goban: unknown }) => (
    <span data-testid={`clock-${color}`}>{goban ? color : "missing"}</span>
));

jest.mock("@/components/Clock/Clock", () => ({
    __esModule: true,
    Clock: (props: { color: "black" | "white"; goban: unknown }) => clockSpy(props),
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

jest.mock("@/components/Flag/Flag", () => ({
    __esModule: true,
    Flag: ({ country }: { country: string }) => <span className="flag">{country}</span>,
}));

jest.mock("@/components/Player/PlayerDetails", () => ({
    __esModule: true,
    PlayerDetails: ({ playerId }: { playerId: number }) => (
        <div data-testid="player-details">{playerId}</div>
    ),
}));

const popoverSpy = jest.fn();

jest.mock("@/lib/popover", () => ({
    __esModule: true,
    popover: (...args: unknown[]) => popoverSpy(...args),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    pgettext: (_context: string, text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        template.replace(/{{(\w+)}}/g, (_match, key) => String(values[key] ?? "")),
    ngettext: (singular: string, plural: string, count: number) =>
        count === 1 ? singular : plural,
}));

type MockClock = {
    current_player: "black" | "white";
    current_player_id: string;
    time_of_last_move: number;
    black_clock: { main_time: number };
    white_clock: { main_time: number };
    black_move_transmitting: number;
    white_move_transmitting: number;
};

type MockEngine = {
    phase: string;
    mode: string;
    outcome: string;
    time_control: JGOFTimeControl | null;
    config?: {
        handicap?: number | null;
    };
    winner?: number | "black" | "white";
    playerToMove: () => number;
    computeScore: (only_prisoners?: boolean) => {
        black: { prisoners: number };
        white: { prisoners: number };
    };
};

type MockControllerBundle = {
    controller: GobanController;
    emitter: EventEmitter;
    goban: {
        engine: MockEngine;
        mode: string;
        paused_since?: number;
        last_emitted_clock?: MockClock | null;
        on: (event: string, cb: () => void) => void;
        off: (event: string, cb: () => void) => void;
        emit: (event: string) => void;
    };
};

function makeGame(): KibitzWatchedGame {
    const player = (id: number, username: string, country = "us"): KibitzRoomUser => ({
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
        country,
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

function makeClock(): MockClock {
    return {
        current_player: "black",
        current_player_id: "1",
        time_of_last_move: Date.now(),
        black_clock: { main_time: 44000 },
        white_clock: { main_time: 159000 },
        black_move_transmitting: 0,
        white_move_transmitting: 0,
    };
}

function makeTimeControl(system: JGOFTimeControl["system"] = "fischer"): JGOFTimeControl {
    switch (system) {
        case "simple":
            return {
                system,
                per_move: 30000,
            } as JGOFTimeControl;
        case "byoyomi":
            return {
                system,
                main_time: 30000,
                periods: 3,
                period_time: 10000,
            } as JGOFTimeControl;
        case "canadian":
            return {
                system,
                main_time: 30000,
                period_time: 60000,
                stones_per_period: 25,
            } as JGOFTimeControl;
        case "absolute":
            return {
                system,
                total_time: 30000,
            } as JGOFTimeControl;
        case "none":
            return {
                system,
            } as JGOFTimeControl;
        case "fischer":
        default:
            return {
                system: "fischer",
                initial_time: 30000,
                time_increment: 5000,
                max_time: 90000,
            } as JGOFTimeControl;
    }
}

function makeController(
    engine: MockEngine,
    clock: MockClock | null = makeClock(),
): MockControllerBundle {
    const emitter = new EventEmitter();
    const goban = {
        engine,
        mode: "play",
        last_emitted_clock: clock,
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        emit: emitter.emit.bind(emitter),
    };

    return {
        controller: {
            goban,
        } as unknown as GobanController,
        emitter,
        goban,
    };
}

describe("KibitzDesktopMainGameScoreboard", () => {
    beforeEach(() => {
        clockSpy.mockClear();
        popoverSpy.mockClear();
    });

    it("renders a single outer scoreboard container", () => {
        render(<KibitzDesktopMainGameScoreboard controller={null} game={makeGame()} />);

        expect(document.querySelectorAll(".KibitzDesktopMainGameScoreboard")).toHaveLength(1);
        expect(document.querySelectorAll(".KibitzDesktopMainGameScoreboard-inner")).toHaveLength(1);
        expect(document.querySelectorAll(".KibitzDesktopMainGameScoreboard-row")).toHaveLength(2);
        expect(
            document.querySelectorAll(".KibitzDesktopMainGameScoreboard-avatarCell"),
        ).toHaveLength(2);
    });

    it("shows a two-row scoreboard for a normal game", () => {
        render(<KibitzDesktopMainGameScoreboard controller={null} game={makeGame()} />);

        expect(screen.queryByText("VS")).toBeNull();
    });

    it("keeps the two-row layout during stone removal", () => {
        const { controller } = makeController({
            phase: "stone removal",
            mode: "play",
            outcome: "",
            time_control: makeTimeControl(),
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        render(<KibitzDesktopMainGameScoreboard controller={controller} game={makeGame()} />);

        expect(screen.queryByText("VS")).toBeNull();
    });

    it("keeps the two-row layout when the game is finished", () => {
        const { controller } = makeController({
            phase: "finished",
            mode: "play",
            outcome: "2.5",
            time_control: makeTimeControl(),
            winner: "white",
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        render(<KibitzDesktopMainGameScoreboard controller={controller} game={makeGame()} />);

        expect(screen.queryByText("VS")).toBeNull();
    });

    it("renders both clocks and both capture values when the controller is present", () => {
        const { controller } = makeController({
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: makeTimeControl(),
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 24 },
                white: { prisoners: 26 },
            }),
        });

        render(<KibitzDesktopMainGameScoreboard controller={controller} game={makeGame()} />);

        expect(screen.getByTestId("clock-black")).toHaveTextContent("black");
        expect(screen.getByTestId("clock-white")).toHaveTextContent("white");
        expect(screen.getByText("24")).toBeInTheDocument();
        expect(screen.getByText("26")).toBeInTheDocument();
    });

    it("formats the metadata lines for reuse under the board subtitle", () => {
        const metadata = getDesktopMainGameMetadataRowText(makeTimeControl("fischer"), {
            handicap: 6,
        });

        expect(metadata.timeText).toContain("Time");
        expect(metadata.handicapText).toContain("Handicap H6");
    });

    it("omits clocks and captures when the controller is null", () => {
        render(<KibitzDesktopMainGameScoreboard controller={null} game={makeGame()} />);

        expect(screen.queryByTestId("clock-black")).toBeNull();
        expect(screen.queryByTestId("clock-white")).toBeNull();
        expect(screen.queryByText("24")).toBeNull();
        expect(screen.queryByText("26")).toBeNull();
    });

    it("applies active side class to the player to move", () => {
        const { controller, emitter, goban } = makeController({
            phase: "play",
            mode: "play",
            outcome: "",
            time_control: makeTimeControl(),
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 1 },
                white: { prisoners: 2 },
            }),
        });

        const { container } = render(
            <KibitzDesktopMainGameScoreboard controller={controller} game={makeGame()} />,
        );

        expect(container.querySelector(".KibitzDesktopMainGameScoreboard-row--black")).toHaveClass(
            "is-active",
        );

        act(() => {
            goban.engine.playerToMove = () => 2;
            emitter.emit("cur_move");
        });

        expect(container.querySelector(".KibitzDesktopMainGameScoreboard-row--white")).toHaveClass(
            "is-active",
        );
    });

    it("labels the black and white lanes for screen readers without visible labels", () => {
        const game = makeGame();
        game.black.username = "alice";
        game.white.username = "bob";

        render(<KibitzDesktopMainGameScoreboard controller={null} game={game} />);

        expect(screen.getByLabelText("Black player")).toHaveClass(
            "KibitzDesktopMainGameScoreboard-row--black",
        );
        expect(screen.getByLabelText("White player")).toHaveClass(
            "KibitzDesktopMainGameScoreboard-row--white",
        );
        expect(screen.queryByText("Black")).toBeNull();
        expect(screen.queryByText("White")).toBeNull();
    });

    it("opens the player popover from each identity", () => {
        render(<KibitzDesktopMainGameScoreboard controller={null} game={makeGame()} />);

        fireEvent.click(screen.getByRole("button", { name: /Black/ }));
        expect(popoverSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                below: expect.any(HTMLElement),
                minWidth: 240,
                minHeight: 250,
            }),
        );

        fireEvent.click(screen.getByRole("button", { name: /White/ }));
        expect(popoverSpy).toHaveBeenCalledTimes(2);
    });

    it("keeps player names in truncation-ready markup", () => {
        const game = makeGame();
        game.black.username = "AveryLongBlackPlayerNameThatShouldTruncate";
        game.white.username = "AveryLongWhitePlayerNameThatShouldTruncate";

        render(<KibitzDesktopMainGameScoreboard controller={null} game={game} />);

        expect(
            document.querySelectorAll(".KibitzDesktopMainGameScoreboard-playerName")[0],
        ).toHaveTextContent(game.black.username);
        expect(
            document.querySelectorAll(".KibitzDesktopMainGameScoreboard-playerName")[1],
        ).toHaveTextContent(game.white.username);
    });

    it("does not render chip or button-like stat structures", () => {
        render(<KibitzDesktopMainGameScoreboard controller={null} game={makeGame()} />);

        expect(document.querySelector(".KibitzMainGameStats-chip")).toBeNull();
        expect(document.querySelectorAll("button")).toHaveLength(2);
    });

    it("uses theme-aware scoreboard colors and lane accents in the stylesheet", () => {
        const css = readFileSync(
            path.join(__dirname, "KibitzDesktopMainGameScoreboard.css"),
            "utf8",
        );

        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard\s*{[^}]*--kibitz-scoreboard-text:\s*var\(--text-color\)[^}]*--kibitz-scoreboard-muted-text:\s*color-mix\(in srgb, var\(--text-color\) 70%, transparent\)[^}]*--kibitz-scoreboard-strong-text:\s*var\(--text-color\)[^}]*--kibitz-scoreboard-turn-highlight:\s*color-mix\(in srgb, var\(--text-color\) 20%, transparent\);/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-inner\s*{[^}]*display:\s*grid;[^}]*max-width:\s*min\(1600px, 100%\);[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--black\s*{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1 \/ span 2;[^}]*justify-self:\s*start;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--white\s*{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1 \/ span 2;[^}]*justify-self:\s*end;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-row--black\s*{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1;[^}]*justify-content:\s*space-between;[^}]*text-align:\s*left;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-row--white\s*{[^}]*grid-column:\s*2;[^}]*grid-row:\s*2;[^}]*justify-content:\s*space-between;[^}]*text-align:\s*right;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-row\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto 0\.5rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarButton\s*{[^}]*width:\s*2\.5rem;[^}]*height:\s*2\.5rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatar\s*{[^}]*width:\s*2\.5rem;[^}]*height:\s*2\.5rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarImage\s*{[^}]*width:\s*2\.5rem !important;[^}]*height:\s*2\.5rem !important;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell::before\s*{[^}]*z-index:\s*1;[^}]*top:\s*0\.18rem;[^}]*width:\s*2px;[^}]*border-radius:\s*999px;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell::after,\s*\.KibitzDesktopMainGameScoreboard-row::after\s*{[^}]*pointer-events:\s*none;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell::after,\s*\.KibitzDesktopMainGameScoreboard-row::after\s*{[^}]*inset:\s*0;[^}]*border-radius:\s*8px;[^}]*background:\s*var\(--kibitz-scoreboard-turn-highlight\);[^}]*opacity:\s*0;[^}]*transition:\s*opacity 160ms ease;[^}]*z-index:\s*0;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--black::before\s*{[^}]*left:\s*-0\.3rem;[^}]*background:\s*linear-gradient\(180deg, rgba\(0, 0, 0, 0\.95\), rgba\(35, 35, 35, 0\.95\)\);/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--white::before\s*{[^}]*right:\s*-0\.3rem;[^}]*background:\s*linear-gradient\(180deg, rgba\(255, 255, 255, 0\.95\), rgba\(215, 215, 215, 0\.95\)\);/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell.is-active::after,\s*\.KibitzDesktopMainGameScoreboard-row.is-active::after\s*{[^}]*opacity:\s*1;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--black.is-active::after\s*{[^}]*inset:\s*0 -0\.25rem 0 -0\.5rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-avatarCell--white.is-active::after\s*{[^}]*inset:\s*0 -0\.5rem 0 -0\.25rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-row--black.is-active::after\s*{[^}]*inset:\s*-0\.1rem -0\.1rem -0\.1rem -0\.95rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-row--white.is-active::after\s*{[^}]*inset:\s*-0\.1rem -0\.95rem -0\.1rem -0\.1rem;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-playerFlag\s*{[^}]*display:\s*contents;/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-playerFlag \.flag\s*{[^}]*margin-left:\s*0\.1rem;[^}]*margin-right:\s*0\.3rem;/s,
        );
        expect(css).toMatch(
            /\[data-theme="light"] \.KibitzDesktopMainGameScoreboard-inner\s*{[^}]*background:\s*linear-gradient\(/s,
        );
        expect(css).toMatch(
            /\[data-theme="light"] \.KibitzDesktopMainGameScoreboard\s*{[^}]*--kibitz-scoreboard-turn-highlight:\s*color-mix\(in srgb, var\(--text-color\) 18%, transparent\);/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-clock\s*{[^}]*color:\s*var\(--kibitz-scoreboard-strong-text\)/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-captures\s*{[^}]*color:\s*var\(--kibitz-scoreboard-muted-text\)/s,
        );
        expect(css).toMatch(
            /\.KibitzDesktopMainGameScoreboard-playerRank\s*{[^}]*color:\s*var\(--kibitz-scoreboard-muted-text\)/s,
        );
        expect(css).not.toContain("color: rgba(255, 255, 255, 0.92);");
        expect(css).not.toContain("color: rgba(255, 255, 255, 0.7);");
        expect(css).not.toContain("color: rgba(255, 255, 255, 0.75);");
        expect(css).not.toContain("KibitzDesktopMainGameScoreboard-playerSide");
    });
});
