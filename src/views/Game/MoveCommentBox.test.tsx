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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Goban } from "goban";
import { MoveCommentBox } from "./PlayControls";

function fakeGoban(): {
    goban: Goban;
    drawn: Array<{ i: number; j: number }>;
    marks: Record<string, { chat_triangle?: boolean }>;
    emit: (event: string) => void;
} {
    const drawn: Array<{ i: number; j: number }> = [];
    const marks: Record<string, { chat_triangle?: boolean }> = {};
    const listeners: Record<string, Array<() => void>> = {};
    const move = {
        getMarks: (i: number, j: number) => {
            const key = `${i},${j}`;
            if (!marks[key]) {
                marks[key] = {};
            }
            return marks[key];
        },
    };
    const goban = {
        width: 19,
        height: 19,
        engine: { cur_move: move },
        getMarks: (i: number, j: number) => move.getMarks(i, j),
        drawSquare: (i: number, j: number) => {
            drawn.push({ i, j });
        },
        on: (event: string, cb: () => void) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(cb);
        },
        off: (event: string, cb: () => void) => {
            listeners[event] = (listeners[event] || []).filter((item) => item !== cb);
        },
    } as unknown as Goban;
    return {
        goban,
        drawn,
        marks,
        emit: (event: string) => {
            for (const cb of listeners[event] || []) {
                cb();
            }
        },
    };
}

describe("MoveCommentBox", () => {
    test("links a board coordinate the way chat does", async () => {
        const user = userEvent.setup();
        const { goban, drawn } = fakeGoban();

        render(
            <MoveCommentBox
                text={"Let's try playing at K10."}
                canEdit={false}
                goban={goban}
                onChange={() => undefined}
            />,
        );

        const position = document.querySelector(".position");
        expect(position).toHaveTextContent("K10");
        expect(position).not.toHaveTextContent(".");
        expect(screen.getByRole("textbox")).toHaveTextContent("Let's try playing at");

        await user.hover(position!);
        expect(drawn).toEqual([{ i: 9, j: 9 }]);
        expect(document.querySelector("textarea")).toBeNull();
    });

    test("does not link a coordinate that is off the board", () => {
        const { goban } = fakeGoban();

        render(
            <MoveCommentBox
                text="Z99 is not a point"
                canEdit={false}
                goban={goban}
                onChange={() => undefined}
            />,
        );

        expect(document.querySelector(".position")).toBeNull();
        expect(screen.getByRole("textbox")).toHaveTextContent("Z99 is not a point");
    });

    test("keeps a text box for the controller", async () => {
        const user = userEvent.setup();
        const { goban } = fakeGoban();
        const onChange = jest.fn();

        render(<MoveCommentBox text="Play at K10 now" canEdit goban={goban} onChange={onChange} />);

        const area = document.querySelector("textarea");
        expect(area).toHaveValue("Play at K10 now");
        expect(document.querySelector(".position")).toBeNull();

        await user.type(area!, "X");
        expect(onChange).toHaveBeenCalledWith("Play at K10 nowX");
    });

    test("clears the hover triangle when the review moves on", async () => {
        const user = userEvent.setup();
        const { goban, marks, emit } = fakeGoban();

        render(
            <MoveCommentBox
                text="Play at K10 now"
                canEdit={false}
                goban={goban}
                onChange={() => undefined}
            />,
        );

        await user.hover(document.querySelector(".position")!);
        expect(marks["9,9"].chat_triangle).toBe(true);

        emit("cur_move");
        expect(marks["9,9"].chat_triangle).toBe(false);
    });

    test("does not open the editor for someone who is not the controller", async () => {
        const user = userEvent.setup();
        const { goban } = fakeGoban();

        render(
            <MoveCommentBox
                text="Play at K10 now"
                canEdit={false}
                goban={goban}
                onChange={() => undefined}
            />,
        );

        await user.click(screen.getByRole("textbox"));
        expect(document.querySelector("textarea")).toBeNull();
    });
});
