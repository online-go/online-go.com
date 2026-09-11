/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { restoreGobanToOfficialTail } from "@/lib/GobanController";
import type { GobanController } from "@/lib/GobanController";
import { SnapshotMiniGoban } from "./SnapshotMiniGoban";

const mockLifecycle: string[] = [];
const mockLoad = jest.fn((snapshot: unknown) => {
    mockLifecycle.push("load");
    return snapshot;
});
const mockController = {
    goban: {
        load: mockLoad,
    },
} as unknown as GobanController;

jest.mock("@/components/MiniGoban", () => ({
    __esModule: true,
    MiniGoban: (props: {
        game_id?: number;
        json?: { game_id?: number };
        onGobanCreated?: (controller: GobanController) => void;
    }) => {
        React.useEffect(() => {
            mockLifecycle.push("listener-setup");
            props.onGobanCreated?.(mockController);
        }, []);

        return (
            <div
                data-testid="mini-goban"
                data-ui-game-id={String(props.game_id)}
                data-constructor-game-id={String(props.json?.game_id)}
            />
        );
    },
}));

jest.mock("@/lib/GobanController", () => ({
    __esModule: true,
    restoreGobanToOfficialTail: jest.fn(() => {
        mockLifecycle.push("restore");
    }),
}));

describe("SnapshotMiniGoban", () => {
    beforeEach(() => {
        mockLifecycle.length = 0;
        mockLoad.mockClear();
        jest.mocked(restoreGobanToOfficialTail).mockClear();
    });

    it("hydrates only after the detached child has installed its listeners", async () => {
        const { rerender } = render(<SnapshotMiniGoban game_id={123} snapshot={null} />);

        expect(screen.getByTestId("mini-goban")).toHaveAttribute("data-ui-game-id", "123");
        expect(screen.getByTestId("mini-goban")).toHaveAttribute(
            "data-constructor-game-id",
            "undefined",
        );
        expect(mockLoad).not.toHaveBeenCalled();

        const snapshot = { game_id: undefined, move_tree: { move_number: 2 } };
        rerender(<SnapshotMiniGoban game_id={123} snapshot={snapshot} />);

        await waitFor(() => {
            expect(mockLoad).toHaveBeenCalledWith(snapshot);
        });
        expect(mockLifecycle).toEqual(["listener-setup", "load", "restore"]);
    });

    it("loads a newer snapshot without remounting the consumer", async () => {
        const firstSnapshot = { game_id: undefined, move_tree: { move_number: 1 } };
        const secondSnapshot = { game_id: undefined, move_tree: { move_number: 2 } };
        const { rerender } = render(<SnapshotMiniGoban game_id={123} snapshot={firstSnapshot} />);

        await waitFor(() => {
            expect(mockLoad).toHaveBeenCalledTimes(1);
        });
        rerender(<SnapshotMiniGoban game_id={123} snapshot={secondSnapshot} />);

        await waitFor(() => {
            expect(mockLoad).toHaveBeenCalledTimes(2);
        });
        expect(mockLoad.mock.calls.map(([snapshot]) => snapshot)).toEqual([
            firstSnapshot,
            secondSnapshot,
        ]);
        expect(mockLifecycle).toEqual(["listener-setup", "load", "restore", "load", "restore"]);
    });
});
