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
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import { KibitzEvaluation } from "./KibitzEvaluation";

const mockLocalScore = { value: -6.5, winRate: undefined as number | undefined, fail: false };
jest.mock("goban", () => ({
    ...jest.requireActual("goban"),
    ScoreEstimator: jest.fn(() => ({
        when_ready: mockLocalScore.fail
            ? Promise.reject(new Error("AI server down"))
            : Promise.resolve(),
        amount: Math.abs(mockLocalScore.value),
        winner: mockLocalScore.value > 0 ? "Black" : "White",
        win_rate: mockLocalScore.winRate,
    })),
}));
import { ScoreEstimator } from "goban";
const mockSelect = jest.fn();
const mockReview = {
    moves: { 1: { score: 8, win_rate: 0.7 } },
    scores: [],
    win_rates: [],
    analyzed_variations: {},
};
jest.mock("@/components/AIReview/hooks", () => ({
    useAIReviewData: () => ({ reviewData: mockReview, setSelectedAIReview: mockSelect }),
}));
jest.mock("@/lib/requests", () => ({ get: () => Promise.resolve([]) }));

function setup({ allowed = true, estimating = false } = {}) {
    const trunk = {
        move_number: 1,
        getMoveStringToThisPoint: () => "aa",
        getBranchPoint: () => trunk,
    };
    const unreviewed = { ...trunk, getMoveStringToThisPoint: () => "aabb" };
    const bar = document.createElement("div");
    const goban = Object.assign(new EventEmitter(), {
        engine: { cur_move: trunk, move_tree: trunk },
        width: 19,
        height: 19,
        destroyed: false,
        evaluation: 0.5,
        evaluation_bar_container: undefined as HTMLDivElement | undefined,
        setEvaluationBar: jest.fn((enabled: boolean) => {
            goban.evaluation_bar_container = enabled ? bar : undefined;
        }),
        score_estimator: null as null | { amount: number; winner: string },
    });
    const controller = Object.assign(new EventEmitter(), {
        goban,
        estimating_score: estimating,
        canEstimateScore: jest.fn(() => allowed),
        prefersRemoteScoreEstimate: jest.fn(() => true),
    });
    return {
        goban,
        bar,
        trunk,
        unreviewed,
        controller,
        asController: controller as unknown as GobanController,
    };
}

const onLabel = jest.fn();
const label = (): string | null => onLabel.mock.calls[onLabel.mock.calls.length - 1]?.[0] ?? null;

function barElement(asController: GobanController, enabled: boolean) {
    return (
        <KibitzEvaluation
            controller={asController}
            source={asController}
            gameId={0}
            enabled={enabled}
            onLabelChange={onLabel}
        />
    );
}

function renderBar(asController: GobanController, enabled = true) {
    return render(barElement(asController, enabled));
}

beforeEach(() => {
    mockLocalScore.value = -6.5;
    mockLocalScore.winRate = undefined;
    mockLocalScore.fail = false;
    preferences.set("kibitz-score-bar-mode", "score");
    jest.mocked(ScoreEstimator).mockClear();
    onLabel.mockClear();
});

test("has no label and no bar until the score bar is enabled", async () => {
    const { goban, asController } = setup();
    const view = renderBar(asController, false);
    expect(label()).toBeNull();
    expect(goban.evaluation_bar_container).toBeUndefined();
    expect(goban.evaluation).toBe(0.5);
    view.rerender(barElement(asController, true));
    expect(label()).toContain("Black by 8.0 · AI review");
    expect(goban.evaluation_bar_container).toBeDefined();
    expect(goban.evaluation).toBeGreaterThan(0.5);
    view.rerender(barElement(asController, false));
    expect(label()).toBeNull();
    expect(goban.evaluation_bar_container).toBeUndefined();
    await act(async () => {});
});

test("asks the AI server once per position", async () => {
    jest.useFakeTimers();
    const { goban, unreviewed, asController } = setup();
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(ScoreEstimator).toHaveBeenCalledTimes(1);
    expect(jest.mocked(ScoreEstimator).mock.calls[0][4]).toBe(true);
    const next = { ...unreviewed, getMoveStringToThisPoint: () => "aabbcc" };
    act(() => {
        goban.engine.cur_move = next;
        goban.emit("update");
    });
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    act(() => {
        goban.engine.cur_move = unreviewed;
        goban.emit("update");
    });
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(ScoreEstimator).toHaveBeenCalledTimes(2);
    expect(label()).toContain("White by 6.5");
    view.unmount();
    jest.useRealTimers();
});

test("estimates an unreviewed position without score estimation mode", async () => {
    jest.useFakeTimers();
    const { goban, unreviewed, asController } = setup();
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    expect(label()).toBe("Estimating...");
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toContain("White by 6.5");
    expect(goban.evaluation).toBeLessThan(0.5);
    mockLocalScore.value = 3;
    act(() => {
        goban.engine.cur_move = { ...unreviewed, getMoveStringToThisPoint: () => "aabbcc" };
        goban.emit("update");
    });
    expect(label()).toContain("White by 6.5");
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toContain("Black by 3.0");
    view.unmount();
    jest.useRealTimers();
});

test("uses the score estimation result while score estimation is on", async () => {
    const { goban, unreviewed, asController } = setup({ estimating: true });
    goban.engine.cur_move = unreviewed;
    renderBar(asController);
    expect(label()).toBe("Estimating...");
    act(() => {
        goban.score_estimator = { amount: 3, winner: "Black" };
        goban.emit("score_estimate");
    });
    expect(label()).toContain("Black by 3.0");
    act(() => {
        goban.score_estimator = { amount: NaN, winner: "" };
        goban.emit("score_estimate");
    });
    expect(label()).toContain("Black by 3.0");
    await act(async () => {});
});

test("shows a failed estimate and drops the previous score", async () => {
    jest.useFakeTimers();
    const { goban, unreviewed, asController } = setup();
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toContain("White by 6.5");
    mockLocalScore.fail = true;
    act(() => {
        goban.engine.cur_move = { ...unreviewed, getMoveStringToThisPoint: () => "aabbcc" };
        goban.emit("update");
    });
    expect(label()).toContain("White by 6.5");
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toBe("Estimate failed");
    expect(goban.evaluation).toBe(0.5);
    view.unmount();
    jest.useRealTimers();
});

test("clicking the bar switches between the score and the win rate", async () => {
    const { goban, bar, asController } = setup();
    const board = document.createElement("div");
    const boardClick = jest.fn();
    board.addEventListener("click", boardClick);
    board.appendChild(bar);
    renderBar(asController);
    expect(label()).toBe("Black by 8.0 · AI review");
    act(() => bar.click());
    expect(label()).toBe("Black 70% · AI review");
    expect(goban.evaluation).toBe(0.7);
    expect([...bar.querySelectorAll("span")].map((span) => span.textContent)).toEqual([
        "75%",
        "50%",
        "75%",
    ]);
    expect(preferences.get("kibitz-score-bar-mode")).toBe("win-rate");
    expect(boardClick).not.toHaveBeenCalled();
    act(() => bar.click());
    expect(label()).toBe("Black by 8.0 · AI review");
    await act(async () => {});
});

test("shows the AI server's win rate for an estimated position", async () => {
    jest.useFakeTimers();
    preferences.set("kibitz-score-bar-mode", "win-rate");
    mockLocalScore.winRate = 0.42;
    const { goban, unreviewed, asController } = setup();
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    expect(label()).toBe("Estimating...");
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toBe("White 58%");
    expect(goban.evaluation).toBe(0.42);
    view.unmount();
    jest.useRealTimers();
});

test("says the win rate is unavailable for a local estimate", async () => {
    jest.useFakeTimers();
    preferences.set("kibitz-score-bar-mode", "win-rate");
    const { goban, unreviewed, controller, asController } = setup();
    controller.prefersRemoteScoreEstimate.mockReturnValue(false);
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(label()).toBe("Win rate unavailable");
    expect(goban.evaluation).toBe(0.5);
    view.unmount();
    jest.useRealTimers();
});

test("withholds scores when score analysis is restricted", async () => {
    const { goban, asController } = setup({ allowed: false, estimating: true });
    goban.score_estimator = { amount: 6.5, winner: "White" };
    renderBar(asController);
    expect(label()).toContain("Score unavailable");
    expect(label()).not.toContain("·");
    expect(goban.evaluation).toBe(0.5);
    await act(async () => {});
});

test("marks +10 and -10 on the bar alongside the scale ends", async () => {
    const { bar: container, asController } = setup();
    renderBar(asController);
    expect([...container.querySelectorAll("span")].map((span) => span.textContent)).toEqual([
        "+60",
        "+30",
        "+10",
        "0",
        "-10",
        "-30",
        "-60",
    ]);
    await act(async () => {});
});

test("drops the signs and shrinks the labels on a narrow bar", async () => {
    const { bar: container, asController } = setup();
    Object.defineProperty(container, "clientWidth", { value: 11 });
    const scrollWidth = jest
        .spyOn(HTMLElement.prototype, "scrollWidth", "get")
        .mockImplementation(function (this: HTMLElement) {
            return (this.textContent?.length ?? 0) * parseInt(this.style.fontSize || "9") * 0.7;
        });
    renderBar(asController);
    const spans = [...container.querySelectorAll("span")];
    expect(spans.map((span) => span.textContent)).toEqual([
        "60",
        "30",
        "10",
        "0",
        "10",
        "30",
        "60",
    ]);
    expect(spans.every((span) => span.scrollWidth <= 11)).toBe(true);
    scrollWidth.mockRestore();
    await act(async () => {});
});

test("returns the bar to even when the score is no longer allowed", async () => {
    const { goban, controller, asController } = setup();
    const view = renderBar(asController);
    expect(goban.evaluation).toBeGreaterThan(0.5);
    controller.canEstimateScore.mockReturnValue(false);
    view.rerender(barElement(asController, true));
    expect(label()).toBe("Score unavailable");
    expect(goban.evaluation).toBe(0.5);
    await act(async () => {});
});

test("does not reuse local estimates once AI estimates apply", async () => {
    jest.useFakeTimers();
    const { goban, unreviewed, controller, asController } = setup();
    controller.prefersRemoteScoreEstimate.mockReturnValue(false);
    goban.engine.cur_move = unreviewed;
    const view = renderBar(asController);
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(ScoreEstimator).toHaveBeenCalledTimes(1);
    controller.prefersRemoteScoreEstimate.mockReturnValue(true);
    view.rerender(barElement(asController, true));
    await act(async () => {
        jest.advanceTimersByTime(250);
    });
    expect(ScoreEstimator).toHaveBeenCalledTimes(2);
    expect(jest.mocked(ScoreEstimator).mock.calls[1][4]).toBe(true);
    view.unmount();
    jest.useRealTimers();
});
