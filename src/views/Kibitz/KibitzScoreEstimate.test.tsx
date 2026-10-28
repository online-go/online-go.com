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
import { act, fireEvent, render, screen } from "@testing-library/react";
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import { KibitzScoreEstimate } from "./KibitzScoreEstimate";

test("shows the estimate, refreshes a changed result and exits through the controller", () => {
    const estimate = { winner: "Black", amount: 3.5 };
    const goban = Object.assign(new EventEmitter(), {
        score_estimator: null as typeof estimate | null,
    });
    const stopEstimatingScore = jest.fn();
    const controller = { goban, stopEstimatingScore } as unknown as GobanController;
    render(<KibitzScoreEstimate controller={controller} />);
    expect(screen.getByRole("status")).toHaveTextContent("Estimating...");
    act(() => {
        goban.score_estimator = estimate;
        goban.emit("score_estimate", estimate);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Black by 3.5");
    act(() => {
        estimate.winner = "White";
        estimate.amount = 1.5;
        goban.emit("score_estimate", estimate);
    });
    expect(screen.getByRole("status")).toHaveTextContent("White by 1.5");
    fireEvent.click(screen.getByRole("button", { name: "Back to Board" }));
    expect(stopEstimatingScore).toHaveBeenCalledTimes(1);
});

test("reads an estimate that completed before the controls mounted", () => {
    const goban = Object.assign(new EventEmitter(), {
        score_estimator: { winner: "White", amount: 0 },
    });
    const controller = { goban, stopEstimatingScore: jest.fn() } as unknown as GobanController;
    render(<KibitzScoreEstimate controller={controller} />);
    expect(screen.getByRole("status")).toHaveTextContent("White by 0.0");
});
