/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
    miniGobanSnapshotOverrides?: unknown;
};

type TestSnapshotMiniGobanProps = TestMiniGobanProps & {
    snapshot?: TestMiniGobanProps["json"] | null;
};

jest.mock("@/components/MiniGoban", () => ({
    __esModule: true,
    MiniGoban: (props: TestMiniGobanProps) => {
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
