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
import { clockTimeLeft, Goban, JGOFPlayerClock, MoveTree } from "goban";
import { _, pgettext } from "@/lib/translate";
import { clockTimeSettings } from "@/components/Clock";
import "./ReviewClockEditor.css";

interface ReviewClockEditorProps {
    goban: Goban;
    /** Only the review's controller may set clocks */
    editable: boolean;
}

/** Lets a review's controller set or clear each player's clock on the current node */
export function ReviewClockEditor({
    goban,
    editable,
}: ReviewClockEditorProps): React.ReactElement | null {
    const [node, setNode] = React.useState<MoveTree>(goban.engine.cur_move);
    // Clocks change on the node in place; this re-renders so a row whose
    // clock changed starts over from the new value (rows are keyed on it).
    const [, setVersion] = React.useState(0);

    React.useEffect(() => {
        const onCurMove = (move: MoveTree) => setNode(move);
        const onReviewUpdated = () => setVersion((v) => v + 1);
        goban.on("cur_move", onCurMove);
        goban.on("review.updated", onReviewUpdated);
        return () => {
            goban.off("cur_move", onCurMove);
            goban.off("review.updated", onReviewUpdated);
        };
    }, [goban]);

    if (!editable) {
        return null;
    }

    const system = clockTimeSettings(goban)?.system;
    const overtime = system === "byoyomi" || system === "canadian" ? system : undefined;

    return (
        <div className="ReviewClockEditor">
            {(["black", "white"] as const).map((color) => (
                <ClockRow
                    key={`${color}-${node.id}-${JSON.stringify(node[`${color}_clock`] ?? null)}`}
                    goban={goban}
                    color={color}
                    clock={node[`${color}_clock`]}
                    overtime={overtime}
                />
            ))}
        </div>
    );
}

interface ClockRowProps {
    goban: Goban;
    color: "black" | "white";
    clock: JGOFPlayerClock | undefined;
    overtime: "byoyomi" | "canadian" | undefined;
}

function ClockRow({ goban, color, clock, overtime }: ClockRowProps): React.ReactElement {
    const [time, setTime] = React.useState(clock ? formatDuration(clockTimeLeft(clock)) : "");
    const [count, setCount] = React.useState(
        clock && !clock.main_time ? `${clock.periods_left ?? clock.moves_left ?? ""}` : "",
    );
    const [invalid, setInvalid] = React.useState(false);

    const save = () => {
        const time_left = parseDuration(time);
        const periods = count.trim() === "" ? undefined : parseInt(count);
        if (time_left === null || (periods !== undefined && (isNaN(periods) || periods < 0))) {
            setInvalid(true);
            return;
        }
        setInvalid(false);

        if (overtime === "byoyomi" && periods !== undefined) {
            goban.setReviewNodeClock(color, {
                main_time: 0,
                period_time_left: time_left,
                periods_left: periods,
            });
        } else if (overtime === "canadian" && periods !== undefined) {
            goban.setReviewNodeClock(color, {
                main_time: 0,
                block_time_left: time_left,
                moves_left: periods,
            });
        } else {
            goban.setReviewNodeClock(color, { main_time: time_left });
        }
    };

    return (
        <div className="ReviewClockEditor-row" data-testid={`review-clock-${color}`}>
            <span className="ReviewClockEditor-color">
                {color === "black" ? _("Black") : _("White")}
            </span>
            <input
                className={"ReviewClockEditor-time" + (invalid ? " invalid" : "")}
                value={time}
                placeholder={pgettext("Review clock editor: time left, e.g. 1:30", "Time left")}
                onChange={(ev) => setTime(ev.target.value)}
            />
            {overtime && (
                <input
                    className="ReviewClockEditor-count"
                    type="number"
                    min={0}
                    value={count}
                    placeholder={
                        overtime === "byoyomi"
                            ? pgettext("Review clock editor: byo-yomi periods left", "Periods")
                            : pgettext(
                                  "Review clock editor: canadian stones left in the period",
                                  "Stones",
                              )
                    }
                    onChange={(ev) => setCount(ev.target.value)}
                />
            )}
            <button className="xs ReviewClockEditor-set" onClick={save}>
                {pgettext("Set the clock on this move", "Set")}
            </button>
            <button
                className="xs ReviewClockEditor-clear"
                onClick={() => goban.setReviewNodeClock(color, null)}
            >
                {pgettext("Remove the clock from this move", "Clear")}
            </button>
        </div>
    );
}

/** Reads `h:mm:ss`, `m:ss` or plain seconds into milliseconds */
function parseDuration(text: string): number | null {
    const parts = text.trim().split(":");
    if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) {
        return null;
    }
    const seconds = parts.reduce((total, part) => total * 60 + parseFloat(part), 0);
    return Math.round(seconds * 1000);
}

/** Milliseconds as `h:mm:ss` or `m:ss` */
function formatDuration(ms: number): string {
    const total = Math.round(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = `${s}`.padStart(2, "0");
    return h > 0 ? `${h}:${`${m}`.padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
