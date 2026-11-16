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
import { alert } from "@/lib/swal_config";
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
