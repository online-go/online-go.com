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
    parseKibitzBoardDimensions,
    useKibitzGobans,
    UseKibitzGobansOptions,
    KibitzGobans,
} from "./useKibitzGobans";

const instances = (
    jest.requireMock("@/lib/GobanController") as { __instances: Array<Record<string, unknown>> }
).__instances;

const { captureCurrentGameBaseSnapshotFromController, restoreMainBoardToOfficialTail } =
    jest.requireMock("./kibitzCurrentGameBaseSnapshot") as {
        captureCurrentGameBaseSnapshotFromController: jest.Mock;
        restoreMainBoardToOfficialTail: jest.Mock;
    };
const { applyKibitzVariationToController } = jest.requireMock("./kibitzVariationTree") as {
    applyKibitzVariationToController: jest.Mock;
};

const game: KibitzWatchedGame = {
    game_id: 100,
    board_size: "9x9",
    title: "g",
    black: { id: 1, username: "b", ranking: 0, professional: false, ui_class: "" },
    white: { id: 2, username: "w", ranking: 0, professional: false, ui_class: "" },
};

const collapsed: KibitzSecondaryPaneState = { collapsed: true };

function makeUser(id: number, username: string) {
    return { id, username, ranking: 0, professional: false, ui_class: "" };
}

function makeVariation(id: string, overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id,
        room_id: "room-1",
        game_id: 100,
        creator: makeUser(1, "b"),
        created_at: 0,
        viewer_count: 0,
        current_viewers: [],
        ...overrides,
    };
}

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

function emit(instance: Record<string, unknown>, event: string) {
    act(() => {
        (instance as { emitGoban: (e: string) => void }).emitGoban(event);
    });
}

beforeEach(() => {
    instances.length = 0;
    jest.clearAllMocks();
    // clearAllMocks() only wipes call history; re-apply the defaults so a
    // custom mockImplementation set inside one test never bleeds into the
    // next one.
    captureCurrentGameBaseSnapshotFromController.mockImplementation(() => null);
    restoreMainBoardToOfficialTail.mockImplementation(() => null);
    applyKibitzVariationToController.mockImplementation(() => ({
        variationId: "v1",
        endpoint: null,
    }));
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

describe("parseKibitzBoardDimensions", () => {
    test("parses a board_size string", () => {
        expect(parseKibitzBoardDimensions({ ...game, board_size: "9x9" })).toEqual({
            width: 9,
            height: 9,
        });
    });
    test("defaults to 19x19 when no game is given", () => {
        expect(parseKibitzBoardDimensions(undefined)).toEqual({ width: 19, height: 19 });
    });
    test("defaults to 19x19 for a malformed board_size", () => {
        const malformed = { ...game, board_size: "abc" } as unknown as KibitzWatchedGame;
        expect(parseKibitzBoardDimensions(malformed)).toEqual({ width: 19, height: 19 });
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

    test("does not build a secondary controller until the main trunk snapshot is ready", () => {
        let latest: KibitzGobans | null = null;
        const { rerender } = render(
            <Harness options={baseOptions()} onResult={(r) => (latest = r)} />,
        );
        const variation = makeVariation("v1");
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
        // captureCurrentGameBaseSnapshotFromController defaults to null, so
        // the main board's trunk isn't ready yet -- no secondary is built.
        expect(instances).toHaveLength(1);
        expect(latest!.center).toBe(latest!.main);
        expect(latest!.secondary).toBeNull();

        captureCurrentGameBaseSnapshotFromController.mockImplementation(() => ({
            gameId: 100,
            trunkTailMoveNumber: 3,
            config: { move_tree: { x: 1 } },
        }));
        emit(instances[0], "load");

        expect(instances).toHaveLength(2);
        expect(latest!.center).toBe(latest!.secondary);
    });

    test("opening a same-game variation composes onto the main trunk once ready", () => {
        captureCurrentGameBaseSnapshotFromController.mockImplementation(() => ({
            gameId: 100,
            trunkTailMoveNumber: 3,
            config: { move_tree: { x: 1 } },
        }));
        let latest: KibitzGobans | null = null;
        const { rerender } = render(
            <Harness options={baseOptions()} onResult={(r) => (latest = r)} />,
        );
        emit(instances[0], "load");

        const selected = makeVariation("v1");
        const otherVisible = makeVariation("v2", { creator: makeUser(3, "c") });
        rerender(
            <Harness
                options={baseOptions({
                    secondaryPane: { collapsed: false, variation_id: "v1" },
                    variations: [otherVisible, selected],
                    visibleVariationIds: ["v1", "v2"],
                })}
                onResult={(r) => (latest = r)}
            />,
        );

        expect(instances).toHaveLength(2);
        expect(instances[1].config).toMatchObject({
            game_id: undefined,
            interactive: false,
            move_tree: { x: 1 },
        });
        expect(latest!.centerMode).toBe("variation");
        expect(latest!.center).toBe(latest!.secondary);
        expect(restoreMainBoardToOfficialTail).toHaveBeenCalledWith(latest!.main);
        expect(applyKibitzVariationToController).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            otherVisible,
            0,
            false,
        );
        expect(applyKibitzVariationToController).toHaveBeenLastCalledWith(
            expect.anything(),
            selected,
            0,
            true,
        );
    });

    test("a draft controller is interactive and enters analyze mode", () => {
        captureCurrentGameBaseSnapshotFromController.mockImplementation(() => ({
            gameId: 100,
            trunkTailMoveNumber: 3,
            config: { move_tree: { x: 1 } },
        }));
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        emit(instances[0], "load");
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
        expect(instances[1].config).toMatchObject({ interactive: true, game_id: undefined });
        expect((instances[1] as { setAnalyzeTool: jest.Mock }).setAnalyzeTool).toHaveBeenCalledWith(
            "stone",
            "alternate",
        );
    });

    test("previewing another game connects and defers composition until load", () => {
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        rerender(
            <Harness
                options={baseOptions({ secondaryPane: { collapsed: false, preview_game_id: 7 } })}
                onResult={() => undefined}
            />,
        );
        expect(instances).toHaveLength(2);
        expect(instances[1].config).toMatchObject({ game_id: 7 });
        const secondaryGoban = (instances[1] as { goban: { redraw: jest.Mock } }).goban;
        expect(secondaryGoban.redraw).not.toHaveBeenCalled();
        expect(applyKibitzVariationToController).not.toHaveBeenCalled();

        emit(instances[1], "load");

        expect(secondaryGoban.redraw).toHaveBeenCalledWith(true);
        expect(applyKibitzVariationToController).not.toHaveBeenCalled();
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
        const { rerender, unmount } = render(
            <Harness options={baseOptions()} onResult={() => undefined} />,
        );
        rerender(
            <Harness
                options={baseOptions({ secondaryPane: { collapsed: false, preview_game_id: 7 } })}
                onResult={() => undefined}
            />,
        );
        expect(instances).toHaveLength(2);
        unmount();
        expect((instances[0] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
        expect((instances[1] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
    });

    test("main snapshots are reported on goban load", () => {
        const snapshot = { gameId: 100, trunkTailMoveNumber: 3 };
        captureCurrentGameBaseSnapshotFromController.mockReturnValueOnce(snapshot);
        const onMainSnapshot = jest.fn();
        render(<Harness options={baseOptions({ onMainSnapshot })} onResult={() => undefined} />);
        emit(instances[0], "load");
        expect(onMainSnapshot).toHaveBeenCalledWith(snapshot);
    });
});
