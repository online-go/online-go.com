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
import { pgettext } from "@/lib/translate";
import { useGobanController } from "./GobanViewContext";
import { generateGobanHook } from "./hooks";
import "./MoveNumberSlider.css";

interface MoveBounds {
    current: number;
    max: number;
}

const useMoveBounds = generateGobanHook<MoveBounds, GobanRenderer | null>(
    (goban) => {
        if (!goban) {
            return { current: 0, max: 0 };
        }
        const cur = goban.engine.cur_move;
        const current = cur.move_number;
        // Walk forward from the current node, following trunk_next first then
        // the remembered branch, to find the deepest reachable position. The
        // slider's max is that depth, so the user can drag forward as far as
        // the current line goes.
        let node = cur;
        let next = node.next(false);
        while (next) {
            node = next;
            next = node.next(false);
        }
        return { current, max: Math.max(current, node.move_number) };
    },
    // Don't subscribe to "update" — it fires on every repaint (hover marks,
    // score estimation, etc.) and would re-render the slider for visual
    // changes that don't shift the move position.
    ["cur_move", "last_official_move"],
);

export function MoveNumberSlider(): React.ReactElement {
    const controller = useGobanController();
    const goban = controller.goban;
    const { current, max } = useMoveBounds(goban);

    const at_start = current <= 0;
    const at_end = current >= max;

    const handlePrev = React.useCallback(() => {
        controller.previousMove();
    }, [controller]);

    const handleNext = React.useCallback(() => {
        controller.nextMove();
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
            // whole drag.
            const goban = controller.goban;
            const cur = goban.engine.cur_move.move_number;
            const delta = target - cur;
            if (delta === 0) {
                return;
            }
            controller.checkAndEnterAnalysis();
            // Defer the display redraw until the last hop, mirroring the
            // pattern used by PuzzleNavigation.nav_prev_10 / nav_next_10.
            if (delta > 0) {
                for (let i = 0; i < delta; i++) {
                    goban.showNext(i < delta - 1);
                }
            } else {
                for (let i = 0; i < -delta; i++) {
                    goban.showPrevious(i < -delta - 1);
                }
            }
        },
        [controller],
    );

    // The CSS lays out our custom knob using `--move-frac` (0..1) so it
    // tracks the (invisible) native slider thumb across the track — see the
    // calc() in the accompanying CSS for the formula.
    const knob_frac = max > 0 ? current / max : 0;

    return (
        <div className="MoveNumberSlider">
            <button
                className="MoveNumberSlider-button"
                onClick={handlePrev}
                disabled={at_start}
                title={pgettext("Move navigation: previous move", "Previous move")}
            >
                <i className="fa fa-step-backward" />
            </button>
            <div
                className="MoveNumberSlider-track"
                style={{ "--move-frac": knob_frac } as React.CSSProperties}
            >
                <input
                    className="MoveNumberSlider-input"
                    type="range"
                    min={0}
                    max={max}
                    step={1}
                    value={current}
                    onChange={handleSliderChange}
                    aria-label={pgettext("Move navigation slider", "Move number")}
                />
                <div className="MoveNumberSlider-knob" aria-hidden="true">
                    <span className="MoveNumberSlider-knob-text">{current}</span>
                </div>
            </div>
            <button
                className="MoveNumberSlider-button"
                onClick={handleNext}
                disabled={at_end}
                title={pgettext("Move navigation: next move", "Next move")}
            >
                <i className="fa fa-step-forward" />
            </button>
        </div>
    );
}
