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

import {
    enableThreeGoban,
    preloadThreeGoban,
    setGobanRenderer,
    SVGRenderer,
    type MoveTree,
    type ThreeRenderer,
} from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { alert } from "@/lib/swal_config";
import { TEST_USER } from "@/views/Game/test_user";
import { shared_ip_with_player_map } from "@/views/Game/util";
import {
    GobanController,
    getMoveTreeTrunkTail,
    preloadThreeBoardIfEnabled,
} from "./GobanController";

jest.mock("goban", () => ({
    ...jest.requireActual("goban"),
    enableThreeGoban: jest.fn(),
    preloadThreeGoban: jest.fn().mockResolvedValue(undefined),
}));

function mockPlainStoneTheme() {
    const setTheme = SVGRenderer.prototype.setTheme;
    return jest.spyOn(SVGRenderer.prototype, "setTheme").mockImplementation(function (
        this: SVGRenderer,
        themes,
        dontRedraw,
    ) {
        setTheme.call(this, { ...themes, white: "Plain", black: "Plain" }, dontRedraw);
    });
}

function makeMoveNode(move_number: number, trunk_next?: MoveTree): MoveTree {
    return {
        move_number,
        trunk_next,
    } as unknown as MoveTree;
}

describe("GobanController", () => {
    it("can retry 3D after the renderer rejects", async () => {
        const enable = jest.mocked(enableThreeGoban);
        const error = new Error("3D chunk unavailable");
        const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const previous = preferences.get("board-renderer-3d");
        const theme = mockPlainStoneTheme();
        let controller: GobanController | undefined;
        try {
            preferences.set("board-renderer-3d", true);
            enable.mockRejectedValueOnce(error);
            controller = new GobanController({
                width: 9,
                height: 9,
                board_div: document.createElement("div"),
                allow_3d: true,
                enable_sounds: false,
            });
            expect(enable).toHaveBeenCalledTimes(1);
            // Let the rejection and the finally handler finish before changing the preference.
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            expect(log).toHaveBeenCalledWith("Unable to enable the 3D board", error);
            enable.mockResolvedValueOnce({
                goban: enable.mock.calls[0][0],
                active: true,
                enable: jest.fn(),
                disable: jest.fn(),
                configure: jest.fn(),
            });
            preferences.set("board-renderer-3d", false);
            preferences.set("board-renderer-3d", true);
            expect(enable).toHaveBeenCalledTimes(2);
            await Promise.resolve();
        } finally {
            controller?.goban.destroy();
            preferences.set("board-renderer-3d", previous);
            theme.mockRestore();
            enable.mockReset();
            log.mockRestore();
        }
    });

    it.each([false, true])(
        "configures only changed options after 3D starts (preference changed: %s)",
        async (changePreference) => {
            const enable = jest.mocked(enableThreeGoban);
            const previousEnabled = preferences.get("board-renderer-3d");
            const previousRoom = preferences.get("board-renderer-3d-room");
            const theme = mockPlainStoneTheme();
            const configure = jest.fn();
            let resolve!: (handle: ThreeRenderer) => void;
            const promise = new Promise<ThreeRenderer>((resolveHandle) => {
                resolve = resolveHandle;
            });
            let controller: GobanController | undefined;
            try {
                preferences.set("board-renderer-3d", true);
                enable.mockReturnValueOnce(promise);
                controller = new GobanController({
                    width: 9,
                    height: 9,
                    board_div: document.createElement("div"),
                    allow_3d: true,
                    enable_sounds: false,
                });
                expect(enable).toHaveBeenCalledWith(
                    controller.goban,
                    expect.objectContaining({ room: previousRoom }),
                );
                if (changePreference) {
                    preferences.set("board-renderer-3d-room", !previousRoom);
                }
                resolve({
                    goban: enable.mock.calls[0][0],
                    active: true,
                    enable: jest.fn(),
                    disable: jest.fn(),
                    configure,
                });
                await promise;
                expect(configure).toHaveBeenCalledTimes(changePreference ? 1 : 0);
                if (changePreference) {
                    expect(configure).toHaveBeenCalledWith(
                        expect.objectContaining({ room: !previousRoom }),
                    );
                }
            } finally {
                controller?.goban.destroy();
                preferences.set("board-renderer-3d", previousEnabled);
                preferences.set("board-renderer-3d-room", previousRoom);
                theme.mockRestore();
                enable.mockReset();
            }
        },
    );

    describe("initial 3D board visibility", () => {
        const enable = jest.mocked(enableThreeGoban);
        let previousEnabled: boolean;
        let theme: ReturnType<typeof mockPlainStoneTheme>;
        let controller: GobanController | undefined;
        let board_div: HTMLDivElement;

        beforeEach(() => {
            jest.useFakeTimers();
            setGobanRenderer("svg");
            previousEnabled = preferences.get("board-renderer-3d");
            theme = mockPlainStoneTheme();
            board_div = document.createElement("div");
            board_div.style.visibility = "visible";
            board_div.style.opacity = "0.8";
            board_div.style.transition = "color 100ms";
            enable.mockReturnValue(new Promise<ThreeRenderer>(() => undefined));
        });

        afterEach(() => {
            controller?.goban.destroy();
            controller = undefined;
            preferences.set("board-renderer-3d", previousEnabled);
            theme.mockRestore();
            enable.mockReset();
            setGobanRenderer("canvas");
            jest.useRealTimers();
        });

        function createBoard(enabled: boolean) {
            preferences.set("board-renderer-3d", enabled);
            controller = new GobanController({
                width: 9,
                height: 9,
                board_div,
                allow_3d: true,
                enable_sounds: false,
            });
            return controller;
        }

        it("hides the board until the first 3D frame, then fades it in", () => {
            createBoard(true);
            expect(board_div.style.visibility).toBe("hidden");

            enable.mock.calls[0][1]?.onFirstFrame?.();
            expect(board_div.style.visibility).toBe("visible");
            expect(board_div.style.opacity).toBe("0");

            jest.advanceTimersByTime(16);
            expect(board_div.style.opacity).toBe("0.8");
            expect(board_div.style.transition).toBe("opacity 150ms ease-out");
            jest.advanceTimersByTime(200);
            expect(board_div.style.transition).toBe("color 100ms");
        });

        it("reveals the board when the renderer is inactive", async () => {
            enable.mockImplementationOnce(async (goban) => ({
                goban,
                active: false,
                enable: jest.fn(),
                disable: jest.fn(),
                configure: jest.fn(),
            }));
            createBoard(true);
            expect(board_div.style.visibility).toBe("hidden");

            await enable.mock.results[0].value;
            expect(board_div.style.visibility).toBe("visible");
        });

        it("reveals the board after 3 seconds without a 3D frame", () => {
            createBoard(true);
            jest.advanceTimersByTime(2999);
            expect(board_div.style.visibility).toBe("hidden");
            jest.advanceTimersByTime(1);
            expect(board_div.style.visibility).toBe("visible");
            expect(board_div.style.opacity).toBe("0.8");
        });

        it("keeps the board visible when 3D is enabled after construction", () => {
            createBoard(false);
            expect(board_div.style.visibility).toBe("visible");
            expect(enable).not.toHaveBeenCalled();
            preferences.set("board-renderer-3d", true);
            expect(board_div.style.visibility).toBe("visible");
            enable.mock.calls[0][1]?.onFirstFrame?.();
            expect(board_div.style.visibility).toBe("visible");
            expect(board_div.style.opacity).toBe("0.8");
        });

        it("clears the first-frame timer when the board is destroyed", () => {
            const board = createBoard(true);
            expect(board_div.style.visibility).toBe("hidden");
            board.goban.destroy();
            controller = undefined;
            expect(board_div.style.visibility).toBe("visible");
            expect(jest.getTimerCount()).toBe(0);
        });
    });

    it("preloads the 3D board only when the preference is on", () => {
        const preload = jest.mocked(preloadThreeGoban);
        const previous = preferences.get("board-renderer-3d");
        try {
            preferences.set("board-renderer-3d", false);
            preload.mockClear();
            preloadThreeBoardIfEnabled();
            expect(preload).not.toHaveBeenCalled();

            preferences.set("board-renderer-3d", true);
            expect(preload).toHaveBeenCalledTimes(1);
            preload.mockClear();
            preloadThreeBoardIfEnabled();
            expect(preload).toHaveBeenCalledTimes(1);
        } finally {
            preferences.set("board-renderer-3d", previous);
            preload.mockClear();
        }
    });

    it("finds the actual trunk tail even when a variation exists", () => {
        const tail = makeMoveNode(7);
        const trunk = makeMoveNode(6, tail);
        const variation = makeMoveNode(6);
        variation.branches = [makeMoveNode(6, makeMoveNode(7))] as unknown as MoveTree["branches"];
        const root = makeMoveNode(0, trunk);
        trunk.branches = [variation] as unknown as MoveTree["branches"];

        expect(getMoveTreeTrunkTail(root)).toBe(tail);
        expect(getMoveTreeTrunkTail(trunk)).toBe(tail);
    });

    it("uses the maintained last_official_move pointer when jumping to the last move", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            players: {
                black: { id: 1, username: "black" },
                white: { id: 2, username: "white" },
            },
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                    branches: [
                        {
                            x: 3,
                            y: 4,
                        },
                    ],
                },
            },
        });

        const trunkTail = controller.goban.engine.move_tree.trunk_next?.trunk_next;
        const variation = controller.goban.engine.move_tree.trunk_next?.branches[0];

        if (!trunkTail || !variation) {
            throw new Error("Expected test move tree to contain both trunk and variation nodes");
        }

        controller.goban.engine.jumpTo(variation);
        controller.goban.engine.last_official_move = variation;

        controller.gotoLastMove();

        expect(controller.goban.engine.cur_move).toBe(variation);
        expect(controller.goban.engine.last_official_move).toBe(variation);
        expect(trunkTail).not.toBe(variation);
    });

    it("stays in puzzle mode when navigating backward", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                },
            },
        });
        const goban = controller.goban;
        goban.setMode("puzzle");

        const second_move = goban.engine.move_tree.trunk_next?.trunk_next;
        if (!second_move) {
            throw new Error("Expected test move tree to contain two trunk moves");
        }
        goban.engine.jumpTo(second_move);
        expect(goban.engine.cur_move.move_number).toBe(2);

        controller.previousMove();

        expect(goban.engine.cur_move.move_number).toBe(1);
        expect(goban.mode).toBe("puzzle");
    });
    it("navigates by engine move number", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                        trunk_next: {
                            x: 5,
                            y: 3,
                        },
                    },
                },
            },
        });
        const goban = controller.goban;
        goban.setMode("analyze");

        controller.gotoMove(2);
        expect(goban.engine.cur_move.move_number).toBe(2);

        controller.nextMove();
        expect(goban.engine.cur_move.move_number).toBe(3);

        controller.nextMove();
        expect(goban.engine.cur_move.move_number).toBe(3);

        controller.gotoFirstMove();
        expect(goban.engine.cur_move.move_number).toBe(0);

        controller.gotoLastMove();
        expect(goban.engine.cur_move.move_number).toBe(3);
    });

    describe("shared analysis line", () => {
        function makeAnalysisController(game_id?: number): GobanController {
            const controller = new GobanController({
                game_id,
                width: 19,
                height: 19,
                players: {
                    black: { id: 1, username: "black" },
                    white: { id: 2, username: "white" },
                },
                phase: "finished",
            });
            controller.goban.setMode("analyze");
            return controller;
        }

        /** Places a variation of `count` stones without captures, and returns their positions. */
        function placeMoves(controller: GobanController, count: number): Array<[number, number]> {
            const placed: Array<[number, number]> = [];
            let black = 0;
            let white = 0;
            for (let i = 0; i < count; ++i) {
                const is_black = controller.goban.engine.colorToMove() === "black";
                const k = is_black ? black++ : white++;
                const x = k % 19;
                const y = is_black ? Math.floor(k / 19) : 18 - Math.floor(k / 19);
                controller.goban.engine.place(x, y);
                placed.push([x, y]);
            }
            return placed;
        }

        function oversizedController(game_id?: number) {
            data.set("user", { ...TEST_USER, anonymous: false });
            const controller = makeAnalysisController(game_id);
            placeMoves(controller, 3);
            controller.goban.engine.cur_move.text = "x".repeat(20000);
            const sendChat = jest.spyOn(controller.goban, "sendChat").mockImplementation(() => {});
            jest.spyOn(alert, "fire").mockResolvedValue(
                undefined as unknown as Awaited<ReturnType<typeof alert.fire>>,
            );
            return { controller, sendChat };
        }

        it("sends only the user marks of each node, so a long line stays small", () => {
            const controller = makeAnalysisController();
            const placed = placeMoves(controller, 50);

            // Each node has a user triangle on its stone, plus display marks for every
            // earlier stone, as older goban versions wrote onto each node.
            let node: MoveTree | null = controller.goban.engine.cur_move;
            for (let i = placed.length - 1; node && i >= 0; --i, node = node.parent) {
                node.getMarks(placed[i][0], placed[i][1]).triangle = true;
                for (let j = 0; j <= i; ++j) {
                    node.getMarks(placed[j][0], placed[j][1]).transient_letter = String(j + 1);
                }
            }

            const analysis = controller.buildAnalysisSnapshot().analysis;
            let line = analysis.line_tree;
            let count = 0;
            while (line) {
                expect(line.marks).toEqual([{ x: line.x, y: line.y, marks: { triangle: true } }]);
                line = line.trunk_next;
                ++count;
            }
            expect(count).toBe(50);
            expect(JSON.stringify(analysis).length).toBeLessThan(8000);
        });

        it("keeps the user mark types and leaves out cleared and other marks", () => {
            const controller = makeAnalysisController();
            placeMoves(controller, 1);
            const node = controller.goban.engine.cur_move;
            node.getMarks(5, 5).triangle = true;
            node.getMarks(6, 6).letter = "A";
            node.getMarks(6, 6).subscript = "53%";
            node.getMarks(7, 7).circle = false;
            node.getMarks(8, 8).letter = "";
            node.getMarks(9, 9).ai_quality = "mistake";

            expect(controller.buildAnalysisSnapshot().analysis.line_tree?.marks).toEqual([
                { x: 5, y: 5, marks: { triangle: true } },
                { x: 6, y: 6, marks: { letter: "A" } },
            ]);
        });

        it("does not send a game line that is larger than the server accepts", () => {
            const { controller, sendChat } = oversizedController(4242);

            controller.shareAnalysis();

            expect(sendChat).not.toHaveBeenCalled();
            expect(alert.fire).toHaveBeenCalled();
            expect(controller.last_variation_number).toBe(0);
        });

        it("sends a large review line, because review chat has no size limit", () => {
            const { controller, sendChat } = oversizedController();

            controller.shareAnalysis();

            expect(sendChat).toHaveBeenCalled();
            expect(controller.last_variation_number).toBe(1);
        });
    });

    describe("estimateScore", () => {
        const GAME_ID = 4242;

        function makeLiveGameController(): GobanController {
            return new GobanController({
                game_id: GAME_ID,
                width: 9,
                height: 9,
                players: {
                    black: { id: 1, username: "black" },
                    white: { id: 2, username: "white" },
                },
            });
        }

        beforeEach(() => {
            data.set("user", { ...TEST_USER, id: 0, anonymous: true });
        });

        afterEach(() => {
            delete shared_ip_with_player_map[GAME_ID];
        });

        it("uses the AI estimator for a spectator of a live game", () => {
            shared_ip_with_player_map[GAME_ID] = false;
            const controller = makeLiveGameController();
            const setScoringMode = jest
                .spyOn(controller.goban, "setScoringMode")
                .mockImplementation(() => controller.goban.engine.cur_move);

            expect(controller.estimateScore()).toBe(true);
            expect(setScoringMode).toHaveBeenCalledWith(true, true);
        });

        it("does not use the AI estimator for a spectator that shares an IP with a player", () => {
            shared_ip_with_player_map[GAME_ID] = true;
            const controller = makeLiveGameController();
            const setScoringMode = jest
                .spyOn(controller.goban, "setScoringMode")
                .mockImplementation(() => controller.goban.engine.cur_move);

            expect(controller.estimateScore()).toBe(true);
            expect(setScoringMode).toHaveBeenCalledWith(true, false);
        });

        function makeDetachedController() {
            const source = makeLiveGameController();
            const variation = new GobanController({
                width: 9,
                height: 9,
                players: source.goban.engine.players,
                phase: "play",
            });
            const setScoringMode = jest
                .spyOn(variation.goban, "setScoringMode")
                .mockImplementation(() => variation.goban.engine.cur_move);
            return { source, variation, setScoringMode };
        }

        it("uses the source game's shared-IP restriction for a detached variation", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            shared_ip_with_player_map[GAME_ID] = true;
            expect(variation.estimateScore({ source })).toBe(true);
            expect(setScoringMode).toHaveBeenCalledWith(true, false);
            expect(variation.goban.game_id).toBeFalsy();
        });

        it("uses the source game's participant status for a detached variation", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            data.set("user", { ...TEST_USER, id: 1 });
            expect(variation.estimateScore({ source })).toBe(true);
            expect(setScoringMode).toHaveBeenCalledWith(true, false);
        });

        it("honors disabled analysis on the source game", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            data.set("user", { ...TEST_USER, id: 1 });
            jest.spyOn(source.goban, "isAnalysisDisabled").mockReturnValue(true);
            expect(variation.canEstimateScore(source)).toBe(false);
            expect(variation.estimateScore({ source })).toBe(false);
            expect(setScoringMode).not.toHaveBeenCalled();
        });

        it("refuses estimation while the source game is in stone removal", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            jest.spyOn(source.goban.engine, "phase", "get").mockReturnValue("stone removal");
            expect(variation.canEstimateScore(source)).toBe(false);
            expect(variation.estimateScore({ source })).toBe(false);
            expect(setScoringMode).not.toHaveBeenCalled();
        });

        it("allows AI estimates of finished source games even on a play-mode copy", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            shared_ip_with_player_map[GAME_ID] = true;
            jest.spyOn(source.goban.engine, "phase", "get").mockReturnValue("finished");
            expect(variation.goban.engine.phase).toBe("play");
            expect(variation.estimateScore({ source })).toBe(true);
            expect(setScoringMode).toHaveBeenCalledWith(true, true);
        });

        it("preserves variation position, labels, shapes and drawings across estimation", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            variation.goban.engine.place(3, 3);
            const node = variation.goban.engine.cur_move;
            node.getMarks(2, 2).triangle = true;
            node.getMarks(4, 4).letter = "A";
            const penMarks = [{ color: "#ff0000", points: [10, 10, 20, 20] }];
            variation.goban.pen_marks = penMarks;
            const drawPenMarks = jest
                .spyOn(variation.goban, "drawPenMarks")
                .mockImplementation(() => {});
            // Play-mode scoring exits clear the node's marks and visible pen drawing.
            setScoringMode.mockImplementation(() => {
                node.clearMarks();
                variation.goban.pen_marks = [];
                return node;
            });
            expect(variation.estimateScore({ source, preserveAnnotations: true })).toBe(true);
            variation.stopEstimatingScore();
            expect(variation.goban.engine.cur_move).toBe(node);
            expect(node.move_number).toBe(1);
            expect(node.getMarks(2, 2).triangle).toBe(true);
            expect(node.getMarks(4, 4).letter).toBe("A");
            expect(drawPenMarks).toHaveBeenCalledWith(penMarks);
        });

        it("does not activate an estimator on a destroyed board or source", () => {
            const { source, variation, setScoringMode } = makeDetachedController();
            source.destroy();
            expect(variation.estimateScore({ source })).toBe(false);
            variation.destroy();
            expect(variation.canEstimateScore()).toBe(false);
            expect(setScoringMode).not.toHaveBeenCalled();
        });
    });
});
