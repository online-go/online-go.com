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
import type { Goban } from "goban";
import { chat_markup } from "./chat_markup";
import "./ChatBodyText.css";

function parsePosition(position: string, goban: Goban | null): { i: number; j: number } {
    if (!goban || !position) {
        return {
            i: -1,
            j: -1,
        };
    }

    let i = "abcdefghjklmnopqrstuvwxyz".indexOf(position[0].toLowerCase());
    let j = goban.height - Number.parseInt(position.substring(1), 10);
    if (j < 0 || i < 0) {
        i = -1;
        j = -1;
    }
    if (i >= goban.width || j >= goban.height) {
        i = -1;
        j = -1;
    }
    return { i, j };
}

const positionTokenRegex = /(^|\s)([a-zA-Z][0-9]{1,2})([,.!?]*)(?=\s|$)/gm;

export function ChatBodyText({
    text: bodyText,
    goban = null,
}: {
    text: string;
    goban?: Goban | null;
}): React.ReactElement {
    const highlight = React.useRef<{
        marks: ReturnType<Goban["getMarks"]>;
        i: number;
        j: number;
    } | null>(null);
    const clearHighlight = React.useCallback(() => {
        const current = highlight.current;
        if (current) {
            current.marks.chat_triangle = false;
            highlight.current = null;
            if (goban && !goban.destroyed) {
                goban.drawSquare(current.i, current.j);
            }
        }
    }, [goban]);
    React.useEffect(() => {
        goban?.on("cur_move", clearHighlight);
        return () => {
            goban?.off("cur_move", clearHighlight);
            clearHighlight();
        };
    }, [goban, bodyText, clearHighlight]);
    if (!goban) {
        return <>{chat_markup(bodyText)}</>;
    }

    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let tokenIndex = 0;

    positionTokenRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = positionTokenRegex.exec(bodyText)) !== null) {
        const start = match.index;
        const prefix = match[1] ?? "";
        const position = match[2];
        const punctuation = match[3] ?? "";

        if (start > cursor) {
            nodes.push(...chat_markup(bodyText.slice(cursor, start)));
        }

        const parsed = parsePosition(position, goban);
        nodes.push(
            <React.Fragment key={`position-${tokenIndex++}`}>
                {prefix}
                {parsed.i < 0 ? (
                    `${position}${punctuation}`
                ) : (
                    <>
                        <span
                            className={punctuation ? "position tight-right" : "position"}
                            data-position={position}
                            onMouseEnter={() => {
                                clearHighlight();
                                const point = parsePosition(position, goban);
                                if (point.i >= 0 && !goban.destroyed) {
                                    const marks = goban.getMarks(point.i, point.j);
                                    marks.chat_triangle = true;
                                    highlight.current = { marks, ...point };
                                    goban.drawSquare(point.i, point.j);
                                }
                            }}
                            onMouseLeave={clearHighlight}
                        >
                            {position}
                        </span>
                        {punctuation ? (
                            <span className="position-trailing">{punctuation}</span>
                        ) : null}
                    </>
                )}
            </React.Fragment>,
        );

        cursor = start + match[0].length;
    }

    if (cursor < bodyText.length) {
        nodes.push(...chat_markup(bodyText.slice(cursor)));
    }

    return <>{nodes}</>;
}
