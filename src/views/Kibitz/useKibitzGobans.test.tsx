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
import { act, render } from "@testing-library/react";
import type { KibitzSecondaryPaneState, KibitzWatchedGame } from "@/models/kibitz";

jest.mock("@/lib/GobanController", () => {
    const instances: Array<Record<string, unknown>> = [];
    const GobanControllerMock = jest.fn().mockImplementation((config: Record<string, unknown>) => {
        const listeners = new Map<string, Array<() => void>>();
        const instance = {
            config,
            destroy: jest.fn(),
            setAnalyzeTool: jest.fn(),
            goban: {
                mode: "play",
                parent: { isConnected: true },
                config,
                engine: {
                    move_tree: null,
                    cur_move: { id: 1, move_number: 0, getMoveStringToThisPoint: () => "" },
                    jumpTo: jest.fn(),
                    followPath: jest.fn(),
                    setLastOfficialMove: jest.fn(),
                },
                on: (event: string, cb: () => void) => {
                    listeners.set(event, [...(listeners.get(event) ?? []), cb]);
                },
                off: jest.fn(),
                redraw: jest.fn(),
                setMode: jest.fn(),
            },
            emitGoban: (event: string) => {
                for (const cb of listeners.get(event) ?? []) {
                    cb();
                }
            },
        };
        instances.push(instance);
        return instance;
    });
    return {
        GobanController: GobanControllerMock,
        getMoveTreeTrunkTail: jest.fn(() => null),
        __instances: instances,
    };
});
jest.mock("./kibitzVariationTree", () => ({
    applyKibitzVariationToController: jest.fn(() => ({ variationId: "v1", endpoint: null })),
}));
jest.mock("./kibitzCurrentGameBaseSnapshot", () => ({
    captureCurrentGameBaseSnapshotFromController: jest.fn(() => null),
    restoreMainBoardToOfficialTail: jest.fn(() => null),
}));
jest.mock("@/lib/preferences", () => ({
    get: jest.fn((key: string) => (key === "label-positioning" ? "all" : 1)),
}));

import {
    deriveKibitzCenterMode,
    useKibitzGobans,
    UseKibitzGobansOptions,
    KibitzGobans,
} from "./useKibitzGobans";

const instances = (
    jest.requireMock("@/lib/GobanController") as { __instances: Array<Record<string, unknown>> }
).__instances;

const game: KibitzWatchedGame = {
    game_id: 100,
    board_size: "9x9",
    title: "g",
    black: { id: 1, username: "b", ranking: 0, professional: false, ui_class: "" },
    white: { id: 2, username: "w", ranking: 0, professional: false, ui_class: "" },
};

const collapsed: KibitzSecondaryPaneState = { collapsed: true };

function Harness(props: { options: UseKibitzGobansOptions; onResult: (r: KibitzGobans) => void }) {
    const result = useKibitzGobans(props.options);
    React.useEffect(() => {
        props.onResult(result);
    });
    return null;
}

function baseOptions(overrides: Partial<UseKibitzGobansOptions> = {}): UseKibitzGobansOptions {
    return {
        roomId: "room-1",
        currentGame: game,
        secondaryPane: collapsed,
        variations: [],
        visibleVariationIds: [],
        variationColorIndexes: {},
        variationGameById: new Map([[100, game]]),
        ...overrides,
    };
}

beforeEach(() => {
    instances.length = 0;
});

describe("deriveKibitzCenterMode", () => {
    test("collapsed is main", () => {
        expect(deriveKibitzCenterMode({ collapsed: true })).toBe("main");
    });
    test("draft when a source game is set", () => {
        expect(
            deriveKibitzCenterMode({
                collapsed: false,
                variation_source_game_id: 100,
                preview_game_id: 100,
            }),
        ).toBe("draft");
    });
    test("variation when a variation id is set", () => {
        expect(deriveKibitzCenterMode({ collapsed: false, variation_id: "v1" })).toBe("variation");
    });
    test("preview when only a preview game is set", () => {
        expect(deriveKibitzCenterMode({ collapsed: false, preview_game_id: 7 })).toBe("preview");
    });
});

describe("useKibitzGobans", () => {
    test("creates a connected main controller and shows it in the center", () => {
        let latest: KibitzGobans | null = null;
        render(<Harness options={baseOptions()} onResult={(r) => (latest = r)} />);
        expect(instances).toHaveLength(1);
        expect(instances[0].config).toMatchObject({
            game_id: 100,
            width: 9,
            height: 9,
            interactive: false,
        });
        expect(latest!.centerMode).toBe("main");
        expect(latest!.center).toBe(latest!.main);
        expect(latest!.secondary).toBeNull();
    });

    test("opening a variation creates a secondary controller and restores main to the tail", () => {
        const { restoreMainBoardToOfficialTail } = jest.requireMock(
            "./kibitzCurrentGameBaseSnapshot",
        );
        let latest: KibitzGobans | null = null;
        const { rerender } = render(
            <Harness options={baseOptions()} onResult={(r) => (latest = r)} />,
        );
        const variation = {
            id: "v1",
            room_id: "room-1",
            game_id: 100,
            creator: { id: 1, username: "b", ranking: 0, professional: false, ui_class: "" },
            created_at: 0,
            viewer_count: 0,
            current_viewers: [],
        };
        rerender(
            <Harness
                options={baseOptions({
                    secondaryPane: { collapsed: false, variation_id: "v1" },
                    variations: [variation],
                    visibleVariationIds: ["v1"],
                })}
                onResult={(r) => (latest = r)}
            />,
        );
        expect(instances).toHaveLength(2);
        expect(instances[1].config).toMatchObject({ interactive: false });
        expect(latest!.centerMode).toBe("variation");
        expect(latest!.center).toBe(latest!.secondary);
        expect(restoreMainBoardToOfficialTail).toHaveBeenCalledWith(latest!.main);
    });

    test("a draft controller is interactive and enters analyze mode", () => {
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        rerender(
            <Harness
                options={baseOptions({
                    secondaryPane: {
                        collapsed: false,
                        preview_game_id: 100,
                        variation_source_game_id: 100,
                        variation_source_move_path: "aa",
                    },
                })}
                onResult={() => undefined}
            />,
        );
        expect(instances[1].config).toMatchObject({ interactive: true });
        expect((instances[1] as { setAnalyzeTool: jest.Mock }).setAnalyzeTool).toHaveBeenCalledWith(
            "stone",
            "alternate",
        );
    });

    test("closing the pane destroys the secondary controller", () => {
        const { rerender } = render(
            <Harness
                options={baseOptions({ secondaryPane: { collapsed: false, preview_game_id: 7 } })}
                onResult={() => undefined}
            />,
        );
        expect(instances).toHaveLength(2);
        rerender(<Harness options={baseOptions()} onResult={() => undefined} />);
        expect((instances[1] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
    });

    test("changing the game destroys and recreates the main controller", () => {
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        rerender(
            <Harness
                options={baseOptions({ currentGame: { ...game, game_id: 200 } })}
                onResult={() => undefined}
            />,
        );
        expect((instances[0] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
        expect(instances[1].config).toMatchObject({ game_id: 200 });
    });

    test("unmount destroys everything", () => {
        const { unmount } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        unmount();
        expect((instances[0] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
    });

    test("main snapshots are reported on goban load", () => {
        const { captureCurrentGameBaseSnapshotFromController } = jest.requireMock(
            "./kibitzCurrentGameBaseSnapshot",
        );
        const snapshot = { gameId: 100, trunkTailMoveNumber: 3 };
        captureCurrentGameBaseSnapshotFromController.mockReturnValueOnce(snapshot);
        const onMainSnapshot = jest.fn();
        render(<Harness options={baseOptions({ onMainSnapshot })} onResult={() => undefined} />);
        act(() => {
            (instances[0] as { emitGoban: (e: string) => void }).emitGoban("load");
        });
        expect(onMainSnapshot).toHaveBeenCalledWith(snapshot);
    });
});
