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

/* Helpers for tests that render a GobanView. */

import type { GobanController } from "@/lib/GobanController";

/** A GobanController with a board in play, enough for GobanView to render. */
export function fakeController(): GobanController {
    return {
        goban: {
            config: { game_id: 100 },
            mode: "play",
            engine: {
                phase: "play",
                outcome: "",
                players: {
                    black: { id: 1, username: "black" },
                    white: { id: 2, username: "white" },
                },
                playerColor: () => "invalid",
                playerToMoveOnOfficialBranch: () => 1,
                computeScore: () => ({
                    black: { prisoners: 0, total: 0 },
                    white: { prisoners: 0, total: 0 },
                }),
                rengo: false,
                cur_move: { move_number: 5 },
                last_official_move: { move_number: 5 },
            },
            on: jest.fn(),
            off: jest.fn(),
        },
        on: jest.fn(),
        off: jest.fn(),
    } as unknown as GobanController;
}

const original_descriptors = {
    innerWidth: Object.getOwnPropertyDescriptor(window, "innerWidth"),
    innerHeight: Object.getOwnPropertyDescriptor(window, "innerHeight"),
};

/** Set the window size and send a resize event. Call `restoreWindowSize`
 *  after each test. */
export function setWindow(width: number, height: number): void {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    window.dispatchEvent(new Event("resize"));
}

/** Put back the window size that was there before `setWindow`. */
export function restoreWindowSize(): void {
    for (const [property, descriptor] of Object.entries(original_descriptors)) {
        if (descriptor) {
            Object.defineProperty(window, property, descriptor);
        } else {
            delete (window as unknown as Record<string, unknown>)[property];
        }
    }
}
