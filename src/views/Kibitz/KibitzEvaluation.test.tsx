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
import { act, render, screen } from "@testing-library/react";
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import { KibitzEvaluation } from "./KibitzEvaluation";

const mockSelect = jest.fn();
const mockReview = { moves: { 1: { score: 8 } }, scores: [], analyzed_variations: {} };
jest.mock("@/components/AIReview/hooks", () => ({
    useAIReviewData: () => ({ reviewData: mockReview, setSelectedAIReview: mockSelect }),
}));
jest.mock("@/lib/requests", () => ({ get: () => Promise.resolve([]) }));

function setup({ allowed = true, estimating = true } = {}) {
    const trunk = {
        move_number: 1,
        getMoveStringToThisPoint: () => "aa",
        getBranchPoint: () => trunk,
    };
    const bar = document.createElement("div");
    const goban = Object.assign(new EventEmitter(), {
        engine: { cur_move: trunk, move_tree: trunk },
        width: 19,
        height: 19,
        evaluation: 0.5,
        evaluation_bar_container: bar,
        score_estimator: null as null | { amount: number; winner: string },
    });
    const controller = Object.assign(new EventEmitter(), {
        goban,
        estimating_score: estimating,
        canEstimateScore: () => allowed,
    });
    return {
        goban,
        bar,
        trunk,
        controller,
        asController: controller as unknown as GobanController,
    };
}

test("shows nothing and hides the bar until score estimation is on", async () => {
    const { goban, bar, controller, asController } = setup({ estimating: false });
    render(<KibitzEvaluation controller={asController} source={asController} gameId={0} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(bar.style.visibility).toBe("hidden");
    expect(goban.evaluation).toBe(0.5);
    act(() => {
        controller.estimating_score = true;
        controller.emit("estimating_score", true);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Black +8.0 · AI review");
    expect(bar.style.visibility).toBe("");
    expect(goban.evaluation).toBeGreaterThan(0.5);
    act(() => {
        controller.estimating_score = false;
        controller.emit("estimating_score", false);
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(bar.style.visibility).toBe("hidden");
    await act(async () => {});
});

test("uses the score estimator for an unreviewed position and follows its updates", async () => {
    const { goban, trunk, asController } = setup();
    goban.engine.cur_move = { ...trunk, getMoveStringToThisPoint: () => "aabb" };
    render(<KibitzEvaluation controller={asController} source={asController} gameId={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Score unavailable");
    expect(screen.getByRole("status")).not.toHaveTextContent("Estimate");
    act(() => {
        goban.score_estimator = { amount: 6.5, winner: "White" };
        goban.emit("score_estimate");
    });
    expect(screen.getByRole("status")).toHaveTextContent("White +6.5 · Estimate");
    expect(goban.evaluation).toBeLessThan(0.5);
    act(() => {
        goban.score_estimator = { amount: 3, winner: "Black" };
        goban.emit("score_estimate");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Black +3.0 · Estimate");
    expect(goban.evaluation).toBeGreaterThan(0.5);
    act(() => {
        goban.score_estimator = { amount: NaN, winner: "" };
        goban.emit("score_estimate");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Black +3.0 · Estimate");
    await act(async () => {});
});

test("withholds scores when score analysis is restricted", async () => {
    const { goban, asController } = setup({ allowed: false });
    goban.score_estimator = { amount: 6.5, winner: "White" };
    render(<KibitzEvaluation controller={asController} source={asController} gameId={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Score unavailable");
    expect(screen.getByRole("status")).not.toHaveTextContent("·");
    expect(goban.evaluation).toBe(0.5);
    await act(async () => {});
});
