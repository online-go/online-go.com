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

jest.mock("goban", () => ({
    ...jest.requireActual("goban"),
    ScoreEstimator: jest.fn(() => ({ when_ready: Promise.resolve(), estimated_hard_score: -6.5 })),
}));
const mockSelect = jest.fn();
const mockReview = { moves: { 1: { score: 8 } }, scores: [], analyzed_variations: {} };
jest.mock("@/components/AIReview/hooks", () => ({
    useAIReviewData: () => ({ reviewData: mockReview, setSelectedAIReview: mockSelect }),
}));
jest.mock("@/lib/requests", () => ({ get: () => Promise.resolve([]) }));

function setup(allowed = true) {
    const trunk = {
        move_number: 1,
        getMoveStringToThisPoint: () => "aa",
        getBranchPoint: () => trunk,
    };
    const goban = Object.assign(new EventEmitter(), {
        engine: { cur_move: trunk, move_tree: trunk },
        width: 19,
        height: 19,
        evaluation: 0.5,
    });
    const controller = { goban, canEstimateScore: () => allowed } as unknown as GobanController;
    return { goban, controller, trunk };
}

test("keeps the previous bar value while an unreviewed variation is estimated", async () => {
    const { goban, controller, trunk } = setup();
    render(<KibitzEvaluation controller={controller} source={controller} gameId={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Black +8.0");
    expect(goban.evaluation).toBeGreaterThan(0.5);
    const previousEvaluation = goban.evaluation;
    act(() => {
        goban.engine.cur_move = { ...trunk, getMoveStringToThisPoint: () => "aabb" };
        goban.emit("update");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Score unavailable");
    expect(goban.evaluation).toBe(previousEvaluation);
    await act(async () => {});
});

test("withholds review data when score analysis is restricted", async () => {
    const { goban, controller } = setup(false);
    render(<KibitzEvaluation controller={controller} source={controller} gameId={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Score unavailable");
    expect(goban.evaluation).toBe(0.5);
    await act(async () => {});
});

test("automatically estimates an unreviewed variation locally after navigation settles", async () => {
    jest.useFakeTimers();
    const { goban, controller, trunk } = setup();
    goban.engine.cur_move = { ...trunk, getMoveStringToThisPoint: () => "aabb" };
    const view = render(
        <KibitzEvaluation controller={controller} source={controller} gameId={0} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Score unavailable");
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(screen.getByRole("status")).toHaveTextContent("White +6.5");
    expect(screen.getByRole("status")).toHaveTextContent("Estimate");
    expect(goban.evaluation).toBeLessThan(0.5);
    view.unmount();
    jest.useRealTimers();
});
