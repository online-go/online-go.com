/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of the
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
import type { Goban } from "goban";
import { ChatBodyText } from "./ChatBodyText";

jest.mock("./chat_markup", () => ({
    chat_markup: (text: string) => [<span key={text}>{text}</span>],
}));

function board(width = 19, height = 19) {
    const marks = new Map<string, { chat_triangle?: boolean }>();
    const fake = Object.assign(new EventEmitter(), {
        width,
        height,
        destroyed: false,
        getMarks: jest.fn((i: number, j: number) => {
            const key = `${i},${j}`;
            if (!marks.has(key)) {
                marks.set(key, {});
            }
            return marks.get(key)!;
        }),
        drawSquare: jest.fn(),
    });
    return { fake, goban: fake as unknown as Goban };
}

test("shares game chat coordinate parsing, punctuation and triangle markers", () => {
    const { fake, goban } = board();
    const { container } = render(<ChatBodyText text="Try A19, or S7!" goban={goban} />);
    expect(container.querySelectorAll(".position")).toHaveLength(2);
    fireEvent.mouseEnter(screen.getByText("A19"));
    expect(fake.getMarks(0, 0).chat_triangle).toBe(true);
    expect(fake.drawSquare).toHaveBeenLastCalledWith(0, 0);
    fireEvent.mouseLeave(screen.getByText("A19"));
    expect(fake.getMarks(0, 0).chat_triangle).toBe(false);
    fireEvent.mouseEnter(screen.getByText("S7"));
    expect(fake.getMarks(17, 12).chat_triangle).toBe(true);
    expect(container.textContent).toBe("Try A19, or S7!");
});

test("validates board bounds and the skipped I column", () => {
    const { goban } = board(9, 9);
    const { container } = render(<ChatBodyText text="A9 J1 I7 A0 A19 T1" goban={goban} />);
    expect([...container.querySelectorAll(".position")].map((node) => node.textContent)).toEqual([
        "A9",
        "J1",
    ]);
});

test("uses board height for rectangular boards", () => {
    const { fake, goban } = board(9, 13);
    render(<ChatBodyText text="J1" goban={goban} />);
    fireEvent.mouseEnter(screen.getByText("J1"));
    expect(fake.getMarks(8, 12).chat_triangle).toBe(true);
});

test("does not link coordinates without a board or inside words and URLs", () => {
    const { goban } = board();
    const { container, rerender } = render(<ChatBodyText text="A19" />);
    expect(container.querySelector(".position")).toBeNull();
    rerender(<ChatBodyText text="https://example.com/A19 longA19word" goban={goban} />);
    expect(container.querySelector(".position")).toBeNull();
});

test("removes a marker when navigating the board", () => {
    const { fake, goban } = board();
    render(<ChatBodyText text="A19" goban={goban} />);
    fireEvent.mouseEnter(screen.getByText("A19"));
    const marks = fake.getMarks(0, 0);
    act(() => {
        fake.emit("cur_move");
    });
    expect(marks.chat_triangle).toBe(false);
});

test("cleans up markers and listeners when switching boards or unmounting", () => {
    const first = board();
    const next = board();
    const { rerender, unmount } = render(<ChatBodyText text="A19" goban={first.goban} />);
    fireEvent.mouseEnter(screen.getByText("A19"));
    rerender(<ChatBodyText text="A19" goban={next.goban} />);
    expect(first.fake.getMarks(0, 0).chat_triangle).toBe(false);
    expect(first.fake.listenerCount("cur_move")).toBe(0);
    fireEvent.mouseEnter(screen.getByText("A19"));
    unmount();
    expect(next.fake.getMarks(0, 0).chat_triangle).toBe(false);
    expect(next.fake.listenerCount("cur_move")).toBe(0);
});

test("clears the marker when a coordinate becomes plain text after a game switch", () => {
    const { fake, goban } = board();
    const { rerender, container } = render(<ChatBodyText text="A19" goban={goban} />);
    fireEvent.mouseEnter(screen.getByText("A19"));
    rerender(<ChatBodyText text="A19" goban={null} />);
    expect(fake.getMarks(0, 0).chat_triangle).toBe(false);
    expect(container.querySelector(".position")).toBeNull();
});
