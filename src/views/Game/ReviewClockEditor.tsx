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
import { clockTimeLeft, findClock, Goban, JGOFPlayerClock, MoveTree } from "goban";
import { _, pgettext } from "@/lib/translate";
import { clockTimeSystem } from "@/components/Clock";
import "./ReviewClockEditor.css";

/**
 * Lets a review's controller set or clear each player's clock on the current
 * node. The fields start from the node's own clock, or else from the last
 * clock set earlier in the line. An edit is set on the node on Enter or when
 * the field loses focus. Demo boards also get the running clock's controls.
 * Nothing is shown while the review has no time control.
 */
export function ReviewClockEditor({ goban }: { goban: Goban }): React.ReactElement | null {
    const [node, setNode] = React.useState<MoveTree>(goban.engine.cur_move);
    // Clocks and the time control change in place; this re-renders so the rows see it.
    const [, setVersion] = React.useState(0);

    React.useEffect(() => {
        const onCurMove = (move: MoveTree) => setNode(move);
        const refresh = () => setVersion((v) => v + 1);
        goban.on("cur_move", onCurMove);
        goban.on("review.updated", refresh);
        goban.on("load", refresh);
        return () => {
            goban.off("cur_move", onCurMove);
            goban.off("review.updated", refresh);
            goban.off("load", refresh);
        };
    }, [goban]);

    const system = clockTimeSystem(goban);
    if (!system) {
        return null;
    }
    const overtime = system === "byoyomi" || system === "canadian" ? system : undefined;

    return (
        <div className="ReviewClockEditor">
            {(["black", "white"] as const).map((color) => (
                <ClockRow
                    key={`${color}-${node.id}`}
                    goban={goban}
                    color={color}
                    clock={node[`${color}_clock`]}
                    lastClock={findClock(node.parent, color)}
                    overtime={overtime}
                />
            ))}
            {goban.isDemoBoard() && <DemoClockControls goban={goban} />}
        </div>
    );
}

interface ClockRowProps {
    goban: Goban;
    color: "black" | "white";
    /** The clock set on the current node */
    clock: JGOFPlayerClock | undefined;
    /** The last clock set earlier in the line, shown when the node has none */
    lastClock: JGOFPlayerClock | undefined;
    overtime: "byoyomi" | "canadian" | undefined;
}

interface ClockFields {
    time: string;
    count: string;
}

function ClockRow({ goban, color, clock, lastClock, overtime }: ClockRowProps): React.ReactElement {
    const shown = clock ?? lastClock;
    const [fields, setFields] = React.useState<ClockFields>(() => clockFields(shown));
    // The clock this row set last, so it can tell its own change from one made elsewhere
    const sent = React.useRef<string | null>(null);
    // Set by typing; only a changed field is sent (see commit)
    const dirty = React.useRef(false);
    const clock_json = JSON.stringify(clock ?? null);
    const shown_json = JSON.stringify(shown ?? null);

    React.useEffect(() => {
        if (clock_json !== sent.current) {
            sent.current = null;
            dirty.current = false;
            setFields(clockFields(shown));
        }
    }, [clock_json, shown_json]);

    // Only a field the controller has changed is sent: the fields start from a
    // rounded or inherited clock, and on a running demo clock every value sent
    // restarts the countdown for everyone watching. Sent on Enter or blur.
    const edit = (next: ClockFields) => {
        dirty.current = true;
        setFields(next);
    };
    const commit = () => {
        if (!dirty.current) {
            return;
        }
        dirty.current = false;
        const new_clock = buildClock(fields, overtime);
        if (new_clock && JSON.stringify(new_clock) !== clock_json) {
            sent.current = JSON.stringify(new_clock);
            goban.setReviewNodeClock(color, new_clock);
        }
    };
    const onKeyDown = (ev: React.KeyboardEvent) => {
        if (ev.key === "Enter") {
            commit();
        }
    };

    const invalid = fields.time.trim() !== "" && !buildClock(fields, overtime);

    return (
        <div
            className={"ReviewClockEditor-row" + (clock ? "" : " inherited")}
            data-testid={`review-clock-${color}`}
        >
            <span className="ReviewClockEditor-color">
                {color === "black" ? _("Black") : _("White")}
            </span>
            <input
                className={"ReviewClockEditor-time" + (invalid ? " invalid" : "")}
                value={fields.time}
                placeholder={pgettext("Review clock editor: time left, e.g. 1:30", "Time left")}
                onChange={(ev) => edit({ ...fields, time: ev.target.value })}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />
            {overtime && (
                <input
                    className="ReviewClockEditor-count"
                    type="number"
                    min={0}
                    value={fields.count}
                    placeholder={
                        overtime === "byoyomi"
                            ? pgettext("Review clock editor: byo-yomi periods left", "Periods")
                            : pgettext(
                                  "Review clock editor: canadian stones left in the period",
                                  "Stones",
                              )
                    }
                    onChange={(ev) => edit({ ...fields, count: ev.target.value })}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                />
            )}
            <button
                className="xs ReviewClockEditor-clear"
                disabled={!clock}
                onClick={() => goban.setReviewNodeClock(color, null)}
            >
                {pgettext("Remove the clock from this move", "Clear")}
            </button>
        </div>
    );
}

/**
 * A demo board's clock controls: pause or resume the running clock, record
 * stones played at the live move as game moves, and take the last one back.
 * The goban's state comes back with the review log, so this reads it on each
 * render (ReviewClockEditor re-renders on every review update).
 */
function DemoClockControls({ goban }: { goban: Goban }): React.ReactElement {
    const [record, setRecord] = React.useState(goban.review_record_moves);
    const running = goban.reviewClockRunning();
    const toggleRecord = () => {
        goban.review_record_moves = !record;
        setRecord(!record);
    };

    return (
        <div className="ReviewClockEditor-controls">
            <button className="xs" onClick={() => goban.setReviewClockRunning(!running)}>
                {running
                    ? pgettext("Stop the demo board clock", "Pause")
                    : pgettext("Start the demo board clock", "Resume")}
            </button>
            <label className="ReviewClockEditor-record">
                <input type="checkbox" checked={record} onChange={toggleRecord} />
                {pgettext("Record stones played at the last game move as game moves", "Record")}
            </label>
            {record && goban.engine.last_official_move.parent && (
                <button className="xs" onClick={() => goban.undoOfficialMove()}>
                    {pgettext("Take back the last recorded game move", "Undo game move")}
                </button>
            )}
        </div>
    );
}

function clockFields(clock: JGOFPlayerClock | undefined): ClockFields {
    return {
        time: clock ? formatDuration(clockTimeLeft(clock)) : "",
        count: clock && !clock.main_time ? `${clock.periods_left ?? clock.moves_left ?? ""}` : "",
    };
}

/** The clock the fields describe, or null if they don't describe a valid one */
function buildClock(
    fields: ClockFields,
    overtime: "byoyomi" | "canadian" | undefined,
): JGOFPlayerClock | null {
    const time_left = parseDuration(fields.time);
    const count = fields.count.trim();
    const periods = count === "" ? undefined : Number(count);
    if (
        time_left === null ||
        (periods !== undefined && (!Number.isInteger(periods) || periods < 0))
    ) {
        return null;
    }

    if (overtime === "byoyomi" && periods !== undefined) {
        return { main_time: 0, period_time_left: time_left, periods_left: periods };
    }
    if (overtime === "canadian" && periods !== undefined) {
        return { main_time: 0, block_time_left: time_left, moves_left: periods };
    }
    return { main_time: time_left };
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
