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

import type { MoveTree } from "goban";
import * as data from "@/lib/data";
import { TEST_USER } from "@/views/Game/test_user";
import { shared_ip_with_player_map } from "@/views/Game/util";
import { GobanController, getMoveTreeTrunkTail } from "./GobanController";

function makeMoveNode(move_number: number, trunk_next?: MoveTree): MoveTree {
    return {
        move_number,
        trunk_next,
    } as unknown as MoveTree;
}

describe("GobanController", () => {
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
        type Tapper = {
            tapAtImpl(
                x: number,
                y: number,
                double_tap: boolean,
                right_click: boolean,
                shift_key: boolean,
                press_duration_ms: number,
            ): void;
        };

        function makeAnalysisController(): GobanController {
            const controller = new GobanController({
                width: 19,
                height: 19,
                players: {
                    black: { id: 1, username: "black" },
                    white: { id: 2, username: "white" },
                },
                phase: "finished",
            });
            controller.goban.setMode("analyze");
            controller.goban.setAnalyzeTool("stone", "alternate");
            return controller;
        }

        function tapMoves(controller: GobanController, count: number): void {
            const tapper = controller.goban as unknown as Tapper;
            // Black fills rows from the top and white rows from the bottom, so nothing is captured.
            let black = 0;
            let white = 0;
            for (let i = 0; i < count; ++i) {
                const is_black = controller.goban.engine.colorToMove() === "black";
                const k = is_black ? black++ : white++;
                const y = is_black ? Math.floor(k / 19) : 18 - Math.floor(k / 19);
                tapper.tapAtImpl(k % 19, y, false, false, false, 0);
            }
        }

        function lineTreeMarkKeys(controller: GobanController): string[] {
            const keys: string[] = [];
            let node = controller.buildAnalysisSnapshot().analysis.line_tree;
            while (node) {
                for (const entry of node.marks ?? []) {
                    keys.push(...Object.keys(entry.marks));
                }
                node = node.trunk_next;
            }
            return keys;
        }

        it("leaves out the variation move numbers that goban writes onto each node", () => {
            const controller = makeAnalysisController();
            tapMoves(controller, 50);

            expect(controller.goban.engine.cur_move.getMarks(0, 0).transient_letter).toBe("1");
            const snapshot = controller.buildAnalysisSnapshot();
            expect(snapshot.analysis.moves.length).toBe(100);
            expect(lineTreeMarkKeys(controller).length).toBe(0);
            expect(JSON.stringify(snapshot.analysis).length).toBeLessThan(4000);
        });

        it("keeps marks that the user placed, without cleared marks", () => {
            const controller = makeAnalysisController();
            tapMoves(controller, 3);
            const node = controller.goban.engine.cur_move;
            node.getMarks(5, 5).triangle = true;
            node.getMarks(6, 6).letter = "A";
            node.getMarks(7, 7).circle = false;
            node.getMarks(8, 8).letter = "";

            const tail =
                controller.buildAnalysisSnapshot().analysis.line_tree?.trunk_next?.trunk_next;
            expect(tail?.marks).toEqual([
                { x: 5, y: 5, marks: { triangle: true } },
                { x: 6, y: 6, marks: { letter: "A" } },
            ]);
        });

        it("does not send a line that is larger than the server accepts", () => {
            data.set("user", { ...TEST_USER, anonymous: false });
            const controller = makeAnalysisController();
            tapMoves(controller, 3);
            controller.goban.engine.cur_move.text = "x".repeat(20000);
            const sendChat = jest.spyOn(controller.goban, "sendChat").mockImplementation(() => {});

            controller.shareAnalysis();

            expect(sendChat).not.toHaveBeenCalled();
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
