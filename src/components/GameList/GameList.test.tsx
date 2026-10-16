/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { GameList } from "./GameList";

type TestMiniGobanProps = {
    game_id?: number;
    width?: number;
    json?: {
        game_id?: number;
        moves?: unknown[];
        move_tree?: { id?: number | string };
    };
    onSelectGameId?: (gameId: number) => void;
    onGobanCreated?: (controller: { goban: FakeGoban }) => void;
    miniGobanSnapshotOverrides?: unknown;
};

class FakeGoban {
    config = { time_control: { system: "fischer", speed: "correspondence" } };
    engine = { phase: "play", getMoveNumber: () => 0 };
    last_emitted_clock: unknown = undefined;
    private listeners: Record<string, Array<(arg: unknown) => void>> = {};

    on(event: string, cb: (arg: unknown) => void) {
        (this.listeners[event] ??= []).push(cb);
    }
    once(event: string, cb: (arg: unknown) => void) {
        const wrapped = (arg: unknown) => {
            this.listeners[event] = this.listeners[event].filter((l) => l !== wrapped);
            cb(arg);
        };
        this.on(event, wrapped);
    }
    emit(event: string, arg: unknown) {
        if (event === "clock") {
            this.last_emitted_clock = arg;
        }
        for (const cb of [...(this.listeners[event] ?? [])]) {
            cb(arg);
        }
    }
}

const mockGobans = new Map<number, FakeGoban>();

type TestSnapshotMiniGobanProps = TestMiniGobanProps & {
    snapshot?: TestMiniGobanProps["json"] | null;
};

jest.mock("@/components/MiniGoban", () => ({
    __esModule: true,
    MiniGoban: (props: TestMiniGobanProps) => {
        React.useEffect(() => {
            const goban = mockGobans.get(props.game_id as number);
            if (goban) {
                props.onGobanCreated?.({ goban });
            }
        }, []);
        const gobanConfig = { game_id: props.game_id, ...props.json };
        return (
            <button
                type="button"
                data-testid={`mini-goban-${props.game_id}`}
                data-game-id={String(props.game_id)}
                data-width={String(props.width)}
                data-snapshot-game-id={String(props.json?.game_id)}
                data-controller-game-id={String(gobanConfig.game_id)}
                data-move-count={String(props.json?.moves?.length || 0)}
                data-snapshot-move-tree-id={String(props.json?.move_tree?.id)}
                data-has-snapshot-override-prop={String(
                    props.miniGobanSnapshotOverrides !== undefined,
                )}
                onClick={() => props.onSelectGameId?.(props.game_id as number)}
            >
                {props.game_id}
            </button>
        );
    },
}));

jest.mock("./SnapshotMiniGoban", () => ({
    __esModule: true,
    SnapshotMiniGoban: (props: TestSnapshotMiniGobanProps) => (
        <button
            type="button"
            data-testid={`mini-goban-${props.game_id}`}
            data-game-id={String(props.game_id)}
            data-snapshot-game-id={String(props.snapshot?.game_id)}
            data-controller-game-id="undefined"
            data-move-count={String(props.snapshot?.moves?.length || 0)}
            data-snapshot-move-tree-id={String(props.snapshot?.move_tree?.id)}
            data-has-snapshot-override-prop={String(props.miniGobanSnapshotOverrides !== undefined)}
            onClick={() => props.onSelectGameId?.(props.game_id as number)}
        >
            {props.game_id}
        </button>
    ),
}));

function makeGame(id: number) {
    return {
        id,
        name: `Game ${id}`,
        black: { id: 10, username: "black" },
        white: { id: 11, username: "white" },
        width: 19,
        height: 19,
    };
}

describe("GameList thumbnail snapshots", () => {
    it("keeps ordinary gamelist entries on the existing live path", () => {
        render(
            <GameList
                list={[makeGame(456)]}
                miniGobanProps={{ noText: true }}
                lineSummaryMode="both-players"
            />,
        );

        const ordinaryGame = screen.getByTestId("mini-goban-456");
        expect(ordinaryGame).toHaveAttribute("data-game-id", "456");
        expect(ordinaryGame).toHaveAttribute("data-snapshot-game-id", "undefined");
        expect(ordinaryGame).toHaveAttribute("data-controller-game-id", "456");
        expect(ordinaryGame).toHaveAttribute("data-move-count", "0");
        expect(ordinaryGame).toHaveAttribute("data-snapshot-move-tree-id", "undefined");
    });

    it("lets per-game props win over shared miniGobanProps for ordinary MiniGobans", () => {
        const miniGobanOnSelect = jest.fn();
        const outerOnSelect = jest.fn();

        render(
            <GameList
                list={[makeGame(456)]}
                miniGobanProps={{
                    game_id: 999,
                    width: 13,
                    onSelectGameId: miniGobanOnSelect,
                }}
                onSelectGameId={outerOnSelect}
                lineSummaryMode="both-players"
            />,
        );

        const ordinaryGame = screen.getByTestId("mini-goban-456");
        expect(ordinaryGame).toHaveAttribute("data-game-id", "456");
        expect(ordinaryGame).toHaveAttribute("data-width", "19");

        fireEvent.click(ordinaryGame);
        expect(outerOnSelect).toHaveBeenCalledWith(456);
        expect(miniGobanOnSelect).not.toHaveBeenCalled();
    });

    it("keeps the targeted current game disconnected while its snapshot is pending", () => {
        render(
            <GameList
                list={[makeGame(123)]}
                miniGobanProps={{
                    miniGobanSnapshotOverrides: new Map([[123, null]]),
                }}
                lineSummaryMode="both-players"
            />,
        );

        const currentGame = screen.getByTestId("mini-goban-123");
        expect(currentGame).toHaveAttribute("data-game-id", "123");
        expect(currentGame).toHaveAttribute("data-controller-game-id", "undefined");
        expect(currentGame).toHaveAttribute("data-snapshot-move-tree-id", "undefined");
    });

    it("applies a detached snapshot only to the matching game", () => {
        const onSelectGameId = jest.fn();
        const snapshotConfig = {
            game_id: undefined,
            move_tree: { id: "official-tree" },
            moves: [[3, 3]],
        };

        render(
            <GameList
                list={[makeGame(123), makeGame(456)]}
                miniGobanProps={{
                    miniGobanSnapshotOverrides: new Map([[123, snapshotConfig]]),
                }}
                onSelectGameId={onSelectGameId}
                lineSummaryMode="both-players"
            />,
        );

        const currentGame = screen.getByTestId("mini-goban-123");
        expect(currentGame).toHaveAttribute("data-game-id", "123");
        expect(currentGame).toHaveAttribute("data-snapshot-game-id", "undefined");
        expect(currentGame).toHaveAttribute("data-controller-game-id", "undefined");
        expect(currentGame).toHaveAttribute("data-move-count", "1");
        expect(currentGame).toHaveAttribute("data-snapshot-move-tree-id", "official-tree");

        fireEvent.click(currentGame);
        expect(onSelectGameId).toHaveBeenCalledWith(123);

        const ordinaryGame = screen.getByTestId("mini-goban-456");
        expect(ordinaryGame).toHaveAttribute("data-game-id", "456");
        expect(ordinaryGame).toHaveAttribute("data-controller-game-id", "456");
        expect(ordinaryGame).toHaveAttribute("data-snapshot-move-tree-id", "undefined");
    });

    it("does not leak the snapshot map control to MiniGoban", () => {
        render(
            <GameList
                list={[makeGame(123)]}
                miniGobanProps={{
                    miniGobanSnapshotOverrides: new Map([[123, { move_tree: { id: "tree" } }]]),
                }}
                lineSummaryMode="both-players"
            />,
        );

        expect(screen.getByTestId("mini-goban-123")).toHaveAttribute(
            "data-has-snapshot-override-prop",
            "false",
        );
    });

    it("does not mutate the supplied snapshot config", () => {
        const snapshotConfig = {
            game_id: undefined,
            move_tree: { id: "official-tree" },
        };

        render(
            <GameList
                list={[makeGame(123)]}
                miniGobanProps={{
                    miniGobanSnapshotOverrides: new Map([[123, snapshotConfig]]),
                }}
                lineSummaryMode="both-players"
            />,
        );

        expect(snapshotConfig).toEqual({
            game_id: undefined,
            move_tree: { id: "official-tree" },
        });
    });
});

describe("GameList clock sort", () => {
    afterEach(() => {
        mockGobans.clear();
        jest.restoreAllMocks();
    });

    function emitClock(goban: FakeGoban, at: number, main_time: number) {
        jest.spyOn(Date, "now").mockReturnValue(at);
        act(() => {
            goban.emit("clock", {
                current_player: "black",
                current_player_id: "10",
                time_of_last_move: 0,
                black_clock: { main_time },
                white_clock: { main_time: 100000 },
            });
        });
    }

    it.each([false, true])(
        "keeps finished clocks fixed as time passes (stone removal: %s)",
        (stoneRemoval) => {
            const live = new FakeGoban();
            const finished = new FakeGoban();
            const otherLive = new FakeGoban();
            mockGobans.set(1, live);
            mockGobans.set(2, finished);
            mockGobans.set(3, otherLive);

            render(
                <GameList
                    list={[makeGame(2), makeGame(3), makeGame(1)]}
                    player={{ id: 10 }}
                    lineSummaryMode="both-players"
                />,
            );

            emitClock(finished, 1000, 60000);
            if (stoneRemoval) {
                act(() => {
                    finished.emit("clock", {
                        current_player: "black",
                        current_player_id: "10",
                        time_of_last_move: 0,
                        black_clock: { main_time: 60000 },
                        white_clock: { main_time: 100000 },
                        stone_removal_time_left: 60000,
                    });
                });
            }
            finished.engine.phase = "finished";
            emitClock(live, 11000, 25000);
            emitClock(otherLive, 11000, 20000);

            const order = () =>
                screen.getAllByRole("button").map((el) => el.getAttribute("data-game-id"));
            expect(order()).toEqual(["3", "1", "2"]);

            emitClock(live, 71000, 25000);
            emitClock(otherLive, 71000, 20000);
            act(() => {
                live.emit("move-made", undefined);
            });
            expect(order()).toEqual(["3", "1", "2"]);
        },
    );

    it("compares running clocks at the same instant, not when each was emitted", () => {
        const a = new FakeGoban();
        const b = new FakeGoban();
        mockGobans.set(1, a);
        mockGobans.set(2, b);

        render(
            <GameList
                list={[makeGame(2), makeGame(1)]}
                player={{ id: 10 }}
                lineSummaryMode="both-players"
            />,
        );

        // Game 1 runs out at 11000, game 2 at 11010. Game 2's clock was
        // emitted later, so its raw main_time is the smaller of the two.
        emitClock(a, 1000, 10000);
        emitClock(b, 1050, 9960);

        const order = screen.getAllByRole("button").map((el) => el.getAttribute("data-game-id"));
        expect(order).toEqual(["1", "2"]);
    });
});
