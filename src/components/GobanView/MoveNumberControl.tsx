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
import { GobanRenderer } from "goban";
import { interpolate, pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { useGobanController } from "./GobanViewContext";
import { generateGobanHook } from "./hooks";
import "./MoveNumberControl.css";

interface MoveBounds {
    current: number;
    /** Deepest move reachable from `cur` along the trunk_next/hint_next chain.
     *  Includes the puzzle's saved solution branches when the goban is in
     *  puzzle mode, so consumers must clamp this against a high-water mark
     *  before exposing it to the user. */
    reachable: number;
}

const useMoveBounds = generateGobanHook<MoveBounds, GobanRenderer | null>(
    (goban) => {
        if (!goban) {
            return { current: 0, reachable: 0 };
        }
        const cur = goban.engine.cur_move;
        const current = cur.move_number;
        let node = cur;
        let next = node.next(false);
        while (next) {
            node = next;
            next = node.next(false);
        }
        return { current, reachable: Math.max(current, node.move_number) };
    },
    // Don't subscribe to "update" — it fires on every repaint (hover marks,
    // score estimation, etc.) and would re-render the slider for visual
    // changes that don't shift the move position.
    ["cur_move", "last_official_move"],
);

/**
 * Move navigation strip rendered below the goban. Two layouts share the
 * same navigation state: a draggable slider with prev/next/autoplay
 * buttons, or a row of first / back 10 / back / autoplay / forward /
 * forward 10 / last buttons around the move number. The layout is chosen
 * by the "move-number-control-mode" preference.
 */
export function MoveNumberControl(): React.ReactElement {
    const controller = useGobanController();
    const goban = controller.goban;
    const { current, reachable } = useMoveBounds(goban);
    const [mode] = usePreference("move-number-control-mode");

    // Puzzles save their solution as the move tree's trunk_next chain. Walking
    // it forward via `next()` would let the slider drag through unplayed
    // solution moves, spoiling the puzzle. Detect puzzle mode at mount time
    // (other navigation paths, e.g. the puzzle editor's keyboard shortcuts,
    // may switch the goban to "analyze", so `goban.mode` isn't reliable
    // later) and constrain the slider's max to a session high-water mark of
    // the user's actual position. Reset whenever the goban changes so
    // loading a new puzzle starts from move 0.
    //
    // Both the mode and the hwm need to be reset *synchronously* on goban
    // change, before the first render with the new goban — otherwise that
    // render uses stale values and briefly exposes the saved solution.
    // Using the ref/`set during render` pattern from the React docs.
    const last_goban_ref = React.useRef(goban);
    const initial_mode_ref = React.useRef<string | null>(goban?.mode ?? null);
    const [hwm, setHwm] = React.useState(goban?.engine.cur_move.move_number ?? 0);
    if (last_goban_ref.current !== goban) {
        last_goban_ref.current = goban;
        initial_mode_ref.current = goban?.mode ?? null;
        setHwm(goban?.engine.cur_move.move_number ?? 0);
    }
    React.useEffect(() => {
        setHwm((prev) => (prev < current ? current : prev));
    }, [current]);

    const restrict_forward = initial_mode_ref.current === "puzzle";
    const max = restrict_forward ? Math.max(current, hwm) : reachable;

    const at_start = current <= 0;
    const at_end = current >= max;

    // On-screen autoplay toggle — the only autoplay control reachable on
    // touch devices (the keyboard shortcut is the space bar). Hidden in puzzle
    // mode, where auto-advancing would walk into the saved solution the
    // forward-restriction above exists to protect.
    const [autoplaying, set_autoplaying] = React.useState(controller.autoplaying);
    React.useEffect(() => {
        set_autoplaying(controller.autoplaying);
        controller.on("autoplaying", set_autoplaying);
        return () => {
            controller.off("autoplaying", set_autoplaying);
        };
    }, [controller]);

    const handlePlayPause = React.useCallback(() => {
        controller.togglePlayPause();
    }, [controller]);

    const handlePrev = React.useCallback(() => {
        controller.previousMove();
    }, [controller]);

    const handleNext = React.useCallback(() => {
        controller.nextMove();
    }, [controller]);

    const handleFirst = React.useCallback(() => {
        controller.gotoFirstMove();
    }, [controller]);

    const handlePrev10 = React.useCallback(() => {
        controller.previous10Moves();
    }, [controller]);

    const handleNext10 = React.useCallback(() => {
        controller.forwardTenMoves();
    }, [controller]);

    const handleLast = React.useCallback(() => {
        controller.gotoLastMove();
    }, [controller]);

    const handleSliderChange = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const target = parseInt(ev.target.value, 10);
            if (isNaN(target)) {
                return;
            }
            // Walk by the delta from the current move rather than calling
            // controller.gotoMove(), which always restarts from move 0. For
            // continuous drag events that's O(N²) total work on a long game;
            // delta-based navigation is O(|delta|) per event, O(N) for the
            // whole drag. Mirror the side-effects every other navigation
            // method on GobanController performs (stop estimate/autoplay,
            // sync review move) so the slider behaves the same way in
            // collaborative reviews and during autoplay/score estimation.
            const goban = controller.goban;
            const last_estimate_move = controller.stopEstimatingScore();
            controller.stopAutoplay();
            controller.checkAndEnterAnalysis(last_estimate_move);
            // Read cur AFTER checkAndEnterAnalysis: in puzzle mode it may
            // jumpTo(last_estimate_move) and shift cur_move out from under
            // us. Mirrors the previousMove / nextMove pattern.
            const cur = goban.engine.cur_move.move_number;
            const delta = target - cur;
            if (delta === 0) {
                return;
            }
            // Defer the display redraw until the last hop, mirroring the
            // pattern used by PuzzleNavigation.nav_prev_10 / nav_next_10.
            if (delta > 0) {
                for (let i = 0; i < delta; i++) {
                    goban.showNext(i < delta - 1);
                }
            } else {
                // Mirror GobanController.previousMove: when analysis is
                // disabled (live game), each backward step must clear branches
                // off the node we just left so they don't accumulate.
                for (let i = 0; i < -delta; i++) {
                    const prev_node = goban.engine.cur_move;
                    goban.showPrevious(i < -delta - 1);
                    if (goban.isAnalysisDisabled()) {
                        goban.engine.cur_move.clearBranchesExceptFor(prev_node);
                    }
                }
            }
            goban.syncReviewMove();
        },
        [controller],
    );

    const play_pause_button = !restrict_forward && (
        <button
            className="MoveNumberControl-button"
            onClick={handlePlayPause}
            disabled={at_end && !autoplaying}
            title={
                autoplaying
                    ? pgettext("Move navigation: stop autoplay", "Pause autoplay")
                    : pgettext("Move navigation: play through the moves", "Autoplay")
            }
        >
            <i className={"fa " + (autoplaying ? "fa-pause" : "fa-play")} />
        </button>
    );

    const prev_button = (
        <button
            className="MoveNumberControl-button"
            onClick={handlePrev}
            disabled={at_start}
            title={pgettext("Move navigation: previous move", "Previous move")}
        >
            <i className="fa fa-step-backward" />
        </button>
    );

    const next_button = (
        <button
            className="MoveNumberControl-button"
            onClick={handleNext}
            disabled={at_end}
            title={pgettext("Move navigation: next move", "Next move")}
        >
            <i className="fa fa-step-forward" />
        </button>
    );

    if (mode === "buttons") {
        // In puzzle mode the forward-jumping buttons would walk into the
        // saved solution, so only single-step forward navigation is offered.
        return (
            <div className="MoveNumberControl MoveNumberControl-buttons">
                <button
                    className="MoveNumberControl-button"
                    onClick={handleFirst}
                    disabled={at_start}
                    title={pgettext("Move navigation: first move", "First move")}
                >
                    <i className="fa fa-fast-backward" />
                </button>
                <button
                    className="MoveNumberControl-button"
                    onClick={handlePrev10}
                    disabled={at_start}
                    title={pgettext("Move navigation: back 10 moves", "Back 10 moves")}
                >
                    <i className="fa fa-backward" />
                </button>
                {prev_button}
                {play_pause_button}
                {next_button}
                {!restrict_forward && (
                    <button
                        className="MoveNumberControl-button"
                        onClick={handleNext10}
                        disabled={at_end}
                        title={pgettext("Move navigation: forward 10 moves", "Forward 10 moves")}
                    >
                        <i className="fa fa-forward" />
                    </button>
                )}
                {!restrict_forward && (
                    <button
                        className="MoveNumberControl-button"
                        onClick={handleLast}
                        disabled={at_end}
                        title={pgettext("Move navigation: last move", "Last move")}
                    >
                        <i className="fa fa-fast-forward" />
                    </button>
                )}
                <span className="MoveNumberControl-move-number">
                    {interpolate(pgettext("Current move number", "Move {{move_number}}"), {
                        move_number: current,
                    })}
                </span>
            </div>
        );
    }

    // The CSS lays out our custom knob using `--move-frac` (0..1) so it
    // tracks the (invisible) native slider thumb across the track — see the
    // calc() in the accompanying CSS for the formula.
    const knob_frac = max > 0 ? Math.min(1, current / max) : 0;

    return (
        <div className="MoveNumberControl MoveNumberControl-slider">
            {prev_button}
            {play_pause_button}
            <div
                className="MoveNumberControl-track"
                style={{ "--move-frac": knob_frac } as React.CSSProperties}
            >
                <input
                    className="MoveNumberControl-input"
                    type="range"
                    min={0}
                    max={max}
                    step={1}
                    value={current}
                    onChange={handleSliderChange}
                    aria-label={pgettext("Move navigation slider", "Move number")}
                />
                <div className="MoveNumberControl-knob" aria-hidden="true">
                    <span className="MoveNumberControl-knob-text">{current}</span>
                </div>
            </div>
            {next_button}
        </div>
    );
}
