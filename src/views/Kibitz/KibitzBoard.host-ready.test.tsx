/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { getBoardHostReadiness, KibitzBoard } from "./KibitzBoard";

const logKibitzVariationDebug = jest.fn();
let lastResizeObserver: MockResizeObserver | null = null;
let requestAnimationFrameSpy: jest.SpiedFunction<typeof window.requestAnimationFrame>;
let cancelAnimationFrameSpy: jest.SpiedFunction<typeof window.cancelAnimationFrame>;

type MockResizeObserverCallback = (
    entries: ResizeObserverEntry[],
    observer: ResizeObserver,
) => void;

class MockResizeObserver {
    public readonly observe = jest.fn();
    public readonly unobserve = jest.fn();
    public readonly disconnect = jest.fn(() => {
        this.disconnected = true;
    });
    public disconnected = false;

    constructor(private readonly callback: MockResizeObserverCallback) {
        lastResizeObserver = this;
    }

    trigger(): void {
        if (this.disconnected) {
            return;
        }

        this.callback([] as ResizeObserverEntry[], this as unknown as ResizeObserver);
    }
}

jest.mock("@/components/OgsResizeDetector", () => ({
    OgsResizeDetector: () => React.createElement("div", { "data-testid": "resize-detector" }),
}));

jest.mock("./kibitzVariationDebug", () => ({
    logKibitzVariationDebug: (...args: unknown[]) => logKibitzVariationDebug(...args),
    summarizeKibitzMoveTreeNode: () => null,
}));

jest.mock("@/lib/GobanController", () => ({
    GobanController: jest.fn().mockImplementation((config: unknown) => {
        return {
            destroy: jest.fn(),
            goban: {
                parent: {
                    isConnected: true,
                },
                config,
                engine: {
                    move_tree: null,
                    cur_move: {
                        id: 0,
                        move_number: 0,
                        getMoveStringToThisPoint: () => "",
                    },
                    last_official_move: null,
                },
                on: jest.fn(),
                off: jest.fn(),
                redraw: jest.fn(),
                move_tree_redraw: jest.fn(),
                setLastMoveOpacity: jest.fn(),
                setSquareSizeBasedOnDisplayWidth: jest.fn(),
            },
            computeMetrics: jest.fn(() => ({
                width: 100,
                height: 100,
            })),
        };
    }),
    getMoveTreeTrunkTail: jest.fn(() => null),
}));

const mockedGobanController = jest.mocked(
    jest.requireMock("@/lib/GobanController").GobanController,
);

const RAF_FRAME_MS = 16;

function defineElementDimension(
    element: HTMLElement,
    property: "clientWidth" | "clientHeight",
    value: number,
): void {
    Object.defineProperty(element, property, {
        configurable: true,
        get: () => value,
    });
}

function setHostDimensions(host: HTMLElement, width: number, height: number): void {
    defineElementDimension(host, "clientWidth", width);
    defineElementDimension(host, "clientHeight", height);
}

function advanceFrames(frameCount: number): void {
    act(() => {
        jest.advanceTimersByTime(frameCount * RAF_FRAME_MS);
    });
}

describe("getBoardHostReadiness", () => {
    it("reports a missing host", () => {
        expect(getBoardHostReadiness(null)).toEqual({
            ready: false,
            reason: "missing-host",
            width: 0,
            height: 0,
            connected: false,
        });
    });

    it("reports a detached host", () => {
        const host = {
            isConnected: false,
            clientWidth: 100,
            clientHeight: 100,
        } as HTMLElement;

        expect(getBoardHostReadiness(host)).toEqual({
            ready: false,
            reason: "detached",
            width: 100,
            height: 100,
            connected: false,
        });
    });

    it("reports a zero-size host", () => {
        const host = {
            isConnected: true,
            clientWidth: 0,
            clientHeight: 300,
        } as HTMLElement;

        expect(getBoardHostReadiness(host)).toEqual({
            ready: false,
            reason: "zero-size",
            width: 0,
            height: 300,
            connected: true,
        });
    });

    it("reports a ready host", () => {
        const host = {
            isConnected: true,
            clientWidth: 200,
            clientHeight: 200,
        } as HTMLElement;

        expect(getBoardHostReadiness(host)).toEqual({
            ready: true,
            reason: "ready",
            width: 200,
            height: 200,
            connected: true,
        });
    });
});

describe("KibitzBoard host readiness polling", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        logKibitzVariationDebug.mockClear();
        mockedGobanController.mockClear();
        lastResizeObserver = null;
        requestAnimationFrameSpy = jest.spyOn(window, "requestAnimationFrame");
        cancelAnimationFrameSpy = jest.spyOn(window, "cancelAnimationFrame");

        Object.defineProperty(window, "ResizeObserver", {
            configurable: true,
            writable: true,
            value: MockResizeObserver,
        });

        requestAnimationFrameSpy.mockImplementation((callback) => {
            return window.setTimeout(
                () => callback(performance.now()),
                RAF_FRAME_MS,
            ) as unknown as number;
        });
        cancelAnimationFrameSpy.mockImplementation((handle) => window.clearTimeout(handle));
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it("caps RAF polling and logs a timeout when the host stays zero-sized", () => {
        const { container } = render(
            <KibitzBoard
                gameId={1}
                currentRoomGameId={1}
                connectToGame={false}
                interactive={false}
                isMobile={false}
                width={19}
                height={19}
                role="secondary"
            />,
        );
        const host = container.querySelector(".KibitzBoard") as HTMLElement;
        setHostDimensions(host, 0, 0);

        advanceFrames(120);

        expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(120);
        expect(mockedGobanController).not.toHaveBeenCalled();
        expect(logKibitzVariationDebug).toHaveBeenCalledWith(
            "kibitz-board:host-ready-raf-timeout",
            expect.objectContaining({
                gameId: 1,
                currentRoomGameId: 1,
                reason: "zero-size",
                attempts: 120,
            }),
        );
    });

    it("logs abandonment after RAF and slow retries are exhausted", () => {
        const { container } = render(
            <KibitzBoard
                gameId={1}
                currentRoomGameId={1}
                connectToGame={false}
                interactive={false}
                isMobile={false}
                width={19}
                height={19}
                role="secondary"
            />,
        );
        const host = container.querySelector(".KibitzBoard") as HTMLElement;
        setHostDimensions(host, 0, 0);

        advanceFrames(120);
        act(() => {
            jest.advanceTimersByTime(5_000);
        });

        expect(mockedGobanController).not.toHaveBeenCalled();
        expect(logKibitzVariationDebug).toHaveBeenCalledWith(
            "kibitz-board:host-ready-abandoned",
            expect.objectContaining({
                gameId: 1,
                currentRoomGameId: 1,
                lastReason: "zero-size",
                rafAttempts: 120,
                slowRetries: 20,
            }),
        );
    });

    it("creates the controller when the host becomes ready before the RAF cap", () => {
        const { container } = render(
            <KibitzBoard
                gameId={1}
                currentRoomGameId={1}
                connectToGame={false}
                interactive={false}
                isMobile={false}
                width={19}
                height={19}
                role="secondary"
            />,
        );
        const host = container.querySelector(".KibitzBoard") as HTMLElement;
        const dimensions = { width: 0, height: 0 };
        setHostDimensions(host, dimensions.width, dimensions.height);

        advanceFrames(5);

        dimensions.width = 240;
        dimensions.height = 240;
        setHostDimensions(host, dimensions.width, dimensions.height);

        advanceFrames(1);

        expect(mockedGobanController).toHaveBeenCalledTimes(1);
        expect(logKibitzVariationDebug).not.toHaveBeenCalledWith(
            "kibitz-board:host-ready-raf-timeout",
            expect.anything(),
        );
    });

    it("recovers through slow retry after the RAF cap and cleans up the observer", () => {
        const { container, unmount } = render(
            <KibitzBoard
                gameId={1}
                currentRoomGameId={1}
                connectToGame={false}
                interactive={false}
                isMobile={false}
                width={19}
                height={19}
                role="secondary"
            />,
        );
        const host = container.querySelector(".KibitzBoard") as HTMLElement;
        const dimensions = { width: 0, height: 0 };
        setHostDimensions(host, dimensions.width, dimensions.height);

        advanceFrames(120);

        expect(lastResizeObserver).not.toBeNull();
        expect(logKibitzVariationDebug).toHaveBeenCalledWith(
            "kibitz-board:host-ready-raf-timeout",
            expect.objectContaining({
                attempts: 120,
            }),
        );

        dimensions.width = 256;
        dimensions.height = 256;
        setHostDimensions(host, dimensions.width, dimensions.height);

        act(() => {
            lastResizeObserver?.trigger();
        });

        expect(mockedGobanController).toHaveBeenCalledTimes(1);
        expect(logKibitzVariationDebug).toHaveBeenCalledWith(
            "kibitz-board:host-ready-slow-recovered",
            expect.objectContaining({
                reason: "resize-observer",
                width: 256,
                height: 256,
            }),
        );
        expect(lastResizeObserver?.disconnect).toHaveBeenCalledTimes(1);

        unmount();
        act(() => {
            jest.advanceTimersByTime(5_000);
        });

        expect(mockedGobanController).toHaveBeenCalledTimes(1);
    });

    it("cancels pending work on unmount before the host ever becomes ready", () => {
        const { container, unmount } = render(
            <KibitzBoard
                gameId={1}
                currentRoomGameId={1}
                connectToGame={false}
                interactive={false}
                isMobile={false}
                width={19}
                height={19}
                role="secondary"
            />,
        );
        const host = container.querySelector(".KibitzBoard") as HTMLElement;
        setHostDimensions(host, 0, 0);

        advanceFrames(20);
        unmount();

        act(() => {
            jest.advanceTimersByTime(5_000);
        });

        expect(mockedGobanController).not.toHaveBeenCalled();
        expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
});
