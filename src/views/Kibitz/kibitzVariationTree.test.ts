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

import { GobanController } from "@/lib/GobanController";
import type { KibitzVariationSummary } from "@/models/kibitz";
import type { MoveTree } from "goban";
import {
    applyKibitzVariationToController,
    isVariationOfficialAnchorReady,
} from "./kibitzVariationTree";

type TestMove = {
    x: number;
    y: number;
    color: number;
    edited?: boolean;
};

type TestNode = {
    id: number;
    move_number: number;
    x: number;
    y: number;
    player: number;
    edited: boolean;
    parent: TestNode | null;
    trunk_next?: TestNode;
    branches: TestNode[];
    state: Record<string, never>;
    line_color: number;
};

function makeNode(
    id: number,
    moveNumber: number,
    x: number,
    y: number,
    parent: TestNode | null,
): TestNode {
    return {
        id,
        move_number: moveNumber,
        x,
        y,
        player: moveNumber % 2 === 0 ? 2 : 1,
        edited: false,
        parent,
        trunk_next: undefined,
        branches: [],
        state: {},
        line_color: -1,
    };
}

function makeVariation(id: string, moves: TestMove[]): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: 4321,
        creator: {
            id: 1,
            username: "creator",
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        created_at: 1,
        viewer_count: 0,
        current_viewers: [],
        analysis_from: 1,
        analysis_moves: JSON.stringify(moves),
    } as KibitzVariationSummary;
}

function makeController() {
    const root = makeNode(1, 0, -1, -1, null);
    const trunk1 = makeNode(2, 1, 1, 1, root);
    const trunk2 = makeNode(3, 2, 2, 2, trunk1);
    root.trunk_next = trunk1;
    trunk1.trunk_next = trunk2;

    let nextNodeId = 4;
    const engine = {
        move_tree: root as unknown as MoveTree,
        cur_move: root as unknown as MoveTree,
        last_official_move: trunk2 as unknown as MoveTree,
        move_tree_layout_dirty: false,
        prettyCoordinates: (x: number, y: number) => `${x},${y}`,
        decodeMoves: (moveObj: unknown) =>
            typeof moveObj === "string"
                ? (JSON.parse(moveObj) as TestMove[])
                : (moveObj as TestMove[]),
        playerByColor: (color: number) => color,
        jumpTo: (node: MoveTree) => {
            engine.cur_move = node;
        },
        place: (x: number, y: number) => {
            const parent = engine.cur_move as unknown as TestNode;
            const player = (parent.move_number + 1) % 2 === 0 ? 2 : 1;
            const existing = parent.branches.find(
                (branch) =>
                    branch.x === x && branch.y === y && branch.player === player && !branch.edited,
            );

            if (existing) {
                engine.cur_move = existing as unknown as MoveTree;
                return;
            }

            const node = makeNode(nextNodeId, parent.move_number + 1, x, y, parent);
            nextNodeId += 1;
            parent.branches.push(node);
            engine.cur_move = node as unknown as MoveTree;
        },
        editPlace: (x: number, y: number) => {
            engine.place(x, y);
        },
    };

    return {
        goban: {
            engine,
        },
    } as unknown as GobanController;
}

describe("applyKibitzVariationToController", () => {
    it("creates separate branches for variations that share the same prefix", () => {
        const controller = makeController();
        const root = controller.goban.engine.move_tree as unknown as TestNode;
        const anchor = root.trunk_next as TestNode;

        const sharedPrefix: TestMove[] = [
            { x: 10, y: 10, color: 1 },
            { x: 11, y: 10, color: 2 },
            { x: 12, y: 10, color: 1 },
            { x: 13, y: 10, color: 2 },
        ];
        const variationOne = makeVariation("variation-one", [
            ...sharedPrefix,
            { x: 14, y: 10, color: 1 },
        ]);
        const variationTwo = makeVariation("variation-two", [
            ...sharedPrefix,
            { x: 14, y: 11, color: 1 },
        ]);

        expect(
            applyKibitzVariationToController(controller, variationOne, 0, false).endpoint,
        ).toBeDefined();
        expect(anchor.branches).toHaveLength(1);

        expect(
            applyKibitzVariationToController(controller, variationTwo, 1, false).endpoint,
        ).toBeDefined();
        expect(anchor.branches).toHaveLength(2);
        expect(anchor.branches[0]).not.toBe(anchor.branches[1]);
        expect(anchor.branches[0].x).toBe(sharedPrefix[0].x);
        expect(anchor.branches[1].x).toBe(sharedPrefix[0].x);
        expect(anchor.branches[0].line_color).toBe(0);
        expect(anchor.branches[1].line_color).toBe(1);
    });

    it("creates separate branches for variations that share a non-official prefix", () => {
        const controller = makeController();
        const root = controller.goban.engine.move_tree as unknown as TestNode;
        const anchor = root.trunk_next as TestNode;

        const sharedVariationPrefix: TestMove[] = [
            { x: 10, y: 10, color: 1 },
            { x: 11, y: 10, color: 2 },
        ];
        const variationOne = makeVariation("variation-one", [
            ...sharedVariationPrefix,
            { x: 12, y: 10, color: 1 },
        ]);
        const variationTwo = makeVariation("variation-two", [
            ...sharedVariationPrefix,
            { x: 12, y: 11, color: 1 },
        ]);

        expect(
            applyKibitzVariationToController(controller, variationOne, 0, false).endpoint,
        ).toBeDefined();
        expect(
            applyKibitzVariationToController(controller, variationTwo, 1, false).endpoint,
        ).toBeDefined();

        expect(anchor.branches).toHaveLength(2);
        expect(anchor.branches[0]).not.toBe(anchor.branches[1]);
        expect(anchor.branches[0].x).toBe(sharedVariationPrefix[0].x);
        expect(anchor.branches[1].x).toBe(sharedVariationPrefix[0].x);
        expect(anchor.branches[0].line_color).toBe(0);
        expect(anchor.branches[1].line_color).toBe(1);
    });

    it("accepts a variation that branches from official move 2 with one decoded move", () => {
        const controller = makeController();
        const variation = {
            ...makeVariation("variation-from-two", [{ x: 12, y: 10, color: 1 }]),
            analysis_from: 2,
        };

        const applied = applyKibitzVariationToController(controller, variation, 0, false);

        expect(applied.endpoint).toBeDefined();
        expect(applied.endpoint?.move_number).toBe(3);
        expect(variation.analysis_from).toBe(2);
        expect(JSON.parse(variation.analysis_moves ?? "[]")).toHaveLength(1);
    });

    it("refuses malformed variations with missing or empty decoded moves", () => {
        const controller = makeController();
        const malformed = {
            ...makeVariation("variation-empty", []),
            analysis_from: 2,
            analysis_moves: JSON.stringify([]),
        };

        expect(applyKibitzVariationToController(controller, malformed, 0, false).endpoint).toBe(
            null,
        );
    });

    it("refuses to report readiness when the official anchor is missing", () => {
        const controller = makeController();
        const readyVariation = makeVariation("variation-ready", [{ x: 10, y: 10, color: 1 }]);
        const missingAnchorVariation = {
            ...readyVariation,
            analysis_from: 99,
        };

        expect(isVariationOfficialAnchorReady(controller, readyVariation)).toBe(true);
        expect(isVariationOfficialAnchorReady(controller, missingAnchorVariation)).toBe(false);
    });
});

describe("annotation-only variations on a real board", () => {
    function board() {
        return new GobanController({
            width: 9,
            height: 9,
            players: { black: { id: 1, username: "b" }, white: { id: 2, username: "w" } },
            move_tree: { x: -1, y: -1, trunk_next: { x: 1, y: 1, trunk_next: { x: 2, y: 2 } } },
        });
    }

    test.each([0, 1, 2])(
        "round trips marks at official position %i without adding a move",
        (from) => {
            const source = board();
            const target = board();
            try {
                source.goban.engine.followPath(from, "");
                source.goban.setMarks({ triangle: "dd", A: "ee" }, true);
                const snapshot = source.buildAnalysisSnapshot();
                expect(snapshot.analysis.moves).toBe("");
                expect(snapshot.analysis.from).toBe(from);
                expect(snapshot.analysis.line_tree).toBeUndefined();
                const variation = {
                    ...makeVariation("annotations", []),
                    analysis_from: snapshot.analysis.from,
                    analysis_moves: snapshot.analysis.moves,
                    analysis_marks: snapshot.analysis.marks,
                };
                const anchor = target.goban.engine.cur_move;
                const result = applyKibitzVariationToController(target, variation, 2, true);
                expect(result.endpoint?.move_number).toBe(from);
                expect(result.endpoint?.getMarks(3, 3).triangle).toBe(true);
                expect(result.endpoint?.getMarks(4, 4).letter).toBe("A");
                expect(target.buildAnalysisSnapshot().analysis.moves).toBe("");
                expect(target.goban.engine.move_tree.branches).toHaveLength(0);
                expect(target.goban.engine.move_tree.trunk_next?.branches).toHaveLength(0);
                expect(anchor.line_color).not.toBe(2);
            } finally {
                source.destroy();
                target.destroy();
            }
        },
    );

    test("suppresses duplicate annotations but allows changed annotations", () => {
        const controller = board();
        try {
            controller.goban.setMarks({ triangle: "dd" }, true);
            const first = controller.buildAnalysisSnapshot();
            controller.recordAnalysisSent(first.analysis);
            expect(controller.buildAnalysisSnapshot().is_duplicate).toBe(true);
            controller.goban.setMarks({ A: "ee" }, true);
            expect(controller.buildAnalysisSnapshot().is_duplicate).toBe(false);
        } finally {
            controller.destroy();
        }
    });

    test("keeps selected annotations separate and ignores hidden annotations", () => {
        const controller = board();
        try {
            const first = {
                ...makeVariation("first", []),
                analysis_moves: "",
                analysis_marks: { A: "dd" },
            };
            const second = { ...first, id: "second", analysis_marks: { triangle: "ee" } };
            const selected = applyKibitzVariationToController(controller, first, 0, true).endpoint!;
            applyKibitzVariationToController(controller, second, 1, false);
            expect(selected.getMarks(3, 3).letter).toBe("A");
            expect(selected.getMarks(4, 4).triangle).toBeUndefined();
            applyKibitzVariationToController(controller, second, 1, true);
            expect(selected.getMarks(3, 3).letter).toBeUndefined();
            expect(selected.getMarks(4, 4).triangle).toBe(true);
            controller.goban.engine.place(5, 5, false, false, true, true);
            expect(controller.buildAnalysisSnapshot().analysis.moves).not.toBe("");
        } finally {
            controller.destroy();
        }
    });

    test("loads pen-only posts and rejects empty or unavailable positions", () => {
        const controller = board();
        try {
            const pen = [{ color: "#000000", points: [100, 100, 20, 20] }];
            const variation = {
                ...makeVariation("pen", []),
                analysis_moves: "",
                analysis_pen_marks: pen,
            };
            const result = applyKibitzVariationToController(controller, variation, 0, true);
            expect(result.endpoint?.pen_marks).toEqual(pen);
            expect(controller.goban.pen_marks).toEqual(pen);
            expect(result.endpoint?.pen_marks).not.toBe(pen);
            expect(
                applyKibitzVariationToController(
                    controller,
                    { ...variation, analysis_from: 99 },
                    0,
                    true,
                ).endpoint,
            ).toBeNull();
            expect(
                applyKibitzVariationToController(
                    controller,
                    { ...variation, analysis_pen_marks: [] },
                    0,
                    true,
                ).endpoint,
            ).toBeNull();
        } finally {
            controller.destroy();
        }
    });
});
