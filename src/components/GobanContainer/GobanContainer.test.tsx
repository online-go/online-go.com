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
import { act, cleanup, render } from "@testing-library/react";
import { EventEmitter } from "eventemitter3";
import { GobanRenderer } from "goban";
import { GobanContainer } from "./GobanContainer";

const CONTAINER_WIDTH = 1249;
const CONTAINER_HEIGHT = 797;

/**
 * The parts of a goban that GobanContainer touches. Like the real goban, it
 * starts out as a 19x19 board and recomputes its square size from the last
 * display width when its game data loads.
 */
class FakeGoban extends EventEmitter {
    board_size = 19;
    square_size = 0;
    display_width = 0;
    config: { board_div: HTMLDivElement };

    constructor() {
        super();
        this.config = { board_div: document.createElement("div") };
        this.on("load", () => this.setSquareSizeBasedOnDisplayWidth(this.display_width));
    }

    setSquareSizeBasedOnDisplayWidth(display_width: number): void {
        this.display_width = display_width;
        this.square_size = Math.floor(display_width / (this.board_size + 2));
    }

    computeMetrics(): { width: number; height: number } {
        const side = this.square_size * (this.board_size + 2);
        return { width: side, height: side };
    }

    setLastMoveOpacity(): void {}
}

let offset_width: PropertyDescriptor | undefined;
let offset_height: PropertyDescriptor | undefined;

beforeEach(() => {
    offset_width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    offset_height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        get: () => CONTAINER_WIDTH,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        get: () => CONTAINER_HEIGHT,
    });
});

afterEach(() => {
    cleanup();
    if (offset_width) {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", offset_width);
    }
    if (offset_height) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", offset_height);
    }
});

function expectCentered(goban: FakeGoban): void {
    const side = goban.computeMetrics().width;
    expect(goban.config.board_div.style.left).toBe(`${Math.ceil((CONTAINER_WIDTH - side) / 2)}px`);
    expect(goban.config.board_div.style.top).toBe(`${Math.ceil((CONTAINER_HEIGHT - side) / 2)}px`);
}

test("recenters the board when the loaded game changes the board size", () => {
    const goban = new FakeGoban();
    render(<GobanContainer goban={goban as unknown as GobanRenderer} respectContainerBounds />);

    expect(goban.square_size).toBe(37);
    expectCentered(goban);

    act(() => {
        goban.board_size = 9;
        goban.emit("load", {});
    });

    expect(goban.square_size).toBe(72);
    expectCentered(goban);
});
