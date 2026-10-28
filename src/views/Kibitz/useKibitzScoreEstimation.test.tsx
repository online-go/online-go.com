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

import { act, renderHook } from "@testing-library/react";
import EventEmitter from "eventemitter3";
import type { GobanController } from "@/lib/GobanController";
import { useKibitzScoreEstimation } from "./useKibitzScoreEstimation";

function fakeController() {
    const events = new EventEmitter();
    const goban = Object.assign(new EventEmitter(), { mode: "play" });
    const fake = {
        goban,
        estimating_score: false,
        destroyed: false,
        on: events.on.bind(events),
        off: events.off.bind(events),
        canEstimateScore: jest.fn(() => true),
        estimateScore: jest.fn((_source: GobanController) => {
            fake.estimating_score = true;
            events.emit("estimating_score", true);
            goban.mode = "score estimation";
            goban.emit("mode");
            return true;
        }),
        stopEstimatingScore: jest.fn(() => {
            fake.estimating_score = false;
            events.emit("estimating_score", false);
            goban.mode = "play";
            goban.emit("mode");
        }),
    };
    return { fake, controller: fake as unknown as GobanController };
}

test("toggles the visible board using the connected source for permission checks", () => {
    const { fake, controller } = fakeController();
    const { controller: source } = fakeController();
    const { result } = renderHook(() => useKibitzScoreEstimation(controller, source, "room"));
    act(() => result.current.toggle());
    expect(fake.estimateScore).toHaveBeenCalledWith({ source, preserveAnnotations: true });
    expect(result.current.estimating).toBe(true);
    act(() => result.current.toggle());
    expect(fake.stopEstimatingScore).toHaveBeenCalledTimes(1);
    expect(result.current.estimating).toBe(false);
});

test.each(["board", "room", "source"] as const)("stops estimation when changing %s", (change) => {
    const { fake, controller } = fakeController();
    const next = fakeController();
    const { result, rerender } = renderHook(
        ({ board, source, room }) => useKibitzScoreEstimation(board, source, room),
        { initialProps: { board: controller, source: controller, room: "room-1" } },
    );
    act(() => result.current.toggle());
    rerender({
        board: change === "board" ? next.controller : controller,
        source: change === "source" ? next.controller : controller,
        room: change === "room" ? "room-2" : "room-1",
    });
    expect(fake.stopEstimatingScore).toHaveBeenCalledTimes(1);
    expect(result.current.estimating).toBe(false);
});

test("clears estimator state when board navigation leaves scoring mode", () => {
    const { fake, controller } = fakeController();
    const { result } = renderHook(() => useKibitzScoreEstimation(controller, controller, "room"));
    act(() => result.current.toggle());
    act(() => {
        fake.goban.mode = "analyze";
        fake.goban.emit("mode");
    });
    expect(result.current.estimating).toBe(false);
});

test("stops and disables estimation when the source no longer permits it", () => {
    const { fake, controller } = fakeController();
    const { fake: sourceFake, controller: source } = fakeController();
    const { result } = renderHook(() => useKibitzScoreEstimation(controller, source, "room"));
    act(() => result.current.toggle());
    act(() => {
        fake.canEstimateScore.mockReturnValue(false);
        sourceFake.goban.emit("phase");
    });
    expect(result.current.estimating).toBe(false);
    expect(result.current.disabled).toBe(true);
});

test("stops a remaining estimate on unmount", () => {
    const { fake, controller } = fakeController();
    const { result, unmount } = renderHook(() =>
        useKibitzScoreEstimation(controller, controller, "room"),
    );
    act(() => result.current.toggle());
    unmount();
    expect(fake.stopEstimatingScore).toHaveBeenCalledTimes(1);
});

test("does not touch an already destroyed board during cleanup", () => {
    const { fake, controller } = fakeController();
    const { result, unmount } = renderHook(() =>
        useKibitzScoreEstimation(controller, controller, "room"),
    );
    act(() => result.current.toggle());
    fake.destroyed = true;
    unmount();
    expect(fake.stopEstimatingScore).not.toHaveBeenCalled();
});

test("disables the action while no board is available", () => {
    const { result } = renderHook(() => useKibitzScoreEstimation(null, null, "room"));
    expect(result.current.disabled).toBe(true);
    expect(result.current.estimating).toBe(false);
    act(() => result.current.toggle());
});
