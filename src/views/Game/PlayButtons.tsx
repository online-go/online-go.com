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
import { _ } from "@/lib/translate";
import { isLiveGame } from "@/components/TimeControl";
import * as preferences from "@/lib/preferences";
import { alert } from "@/lib/swal_config";
import {
    generateGobanHook,
    useCanAnswerUndoRequest,
    useCurrentMoveNumber,
    useMode,
    usePhase,
    usePlayerToMove,
    hasStagedMove,
    useResignMode,
    useShowSubmitButton,
    useSubmittingMove,
    useUserIsParticipant,
} from "./GameHooks";
import { cancelOrResignGame } from "./game_actions";
import * as DynamicHelp from "react-dynamic-help";
import { useGobanController } from "./goban_context";
import { useUser } from "@/lib/hooks";
import { sfx } from "@/lib/sfx";
import { decodeMoves } from "goban";
import "./PlayButtons.css";

const useOfficialMoveNumber = generateGobanHook(
    (goban) => goban!.engine.last_official_move?.move_number ?? -1,
    ["last_official_move"],
);

function KeyboardCoordinateInput(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const [coordinate_input, setCoordinateInput] = React.useState("");
    const [has_error, setHasError] = React.useState(false);
    const input_ref = React.useRef<HTMLInputElement>(null);
    const [keyboard_coordinates_enabled] = preferences.usePreference(
        "accessibility.keyboard-coordinate-input",
    );

    const player_to_move = usePlayerToMove(goban);
    const user_id = useUser().id;
    const is_my_move = player_to_move === user_id;
    const official_move_number = useOfficialMoveNumber(goban);
    const cur_move_number = useCurrentMoveNumber(goban);

    const can_place =
        is_my_move &&
        cur_move_number === official_move_number &&
        engine.phase === "play" &&
        engine.handicapMovesLeft() === 0;

    // Mirrors the hover behavior from goban's onMouseMove handler
    // Note: last_hover_square is a protected property, so we use 'as any' to access it
    const clearHover = React.useCallback(() => {
        const gobanWithHover = goban as any;
        const last_hover = gobanWithHover.last_hover_square;
        if (last_hover) {
            delete gobanWithHover.last_hover_square;
            goban.drawSquare(last_hover.x, last_hover.y);
        }
    }, [goban]);

    const parseCoordinates = React.useCallback(
        (input: string): { x: number; y: number } | null => {
            if (!/^[A-Z]\d{1,2}$/.test(input)) {
                return null;
            }
            try {
                const moves = decodeMoves(input, engine.width, engine.height);
                if (moves.length > 0 && moves[0].x >= 0 && moves[0].y >= 0) {
                    return moves[0];
                }
            } catch {
                return null;
            }
            return null;
        },
        [engine.width, engine.height],
    );

    const setHover = React.useCallback(
        (x: number, y: number) => {
            (goban as any).last_hover_square = { x, y };
            goban.drawSquare(x, y);
        },
        [goban],
    );

    const refocusInput = React.useCallback(() => {
        setTimeout(() => input_ref.current?.focus(), 0);
    }, []);

    React.useEffect(() => {
        if (keyboard_coordinates_enabled && can_place && input_ref.current) {
            input_ref.current.focus();
        }
    }, [keyboard_coordinates_enabled, can_place, cur_move_number]);

    React.useEffect(() => {
        return () => clearHover();
    }, [clearHover]);

    if (!keyboard_coordinates_enabled) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCoordinateInput(value);

        if (has_error) {
            setHasError(false);
        }

        const input = value.trim().toUpperCase();
        clearHover();

        if (input) {
            const coords = parseCoordinates(input);
            if (coords) {
                setHover(coords.x, coords.y);
            }
        }
    };

    const handleBlur = () => {
        clearHover();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const input = coordinate_input.trim();
        if (!input) {
            return;
        }

        const coords = parseCoordinates(input.toUpperCase());
        if (!coords) {
            setHasError(true);
            sfx.play("tutorial-fail");
            refocusInput();
            return;
        }

        try {
            goban.tapByPrettyCoordinates(input.toUpperCase());
            setCoordinateInput("");
            setHasError(false);
            clearHover();
            refocusInput();
        } catch {
            // Handle illegal moves (occupied spot, ko violation, etc.)
            setHasError(true);
            sfx.play("tutorial-fail");
            refocusInput();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="keyboard-coordinate-input">
            <label htmlFor="coordinate-input" className="sr-only">
                {_("Enter stone coordinates")}
            </label>
            <input
                ref={input_ref}
                id="coordinate-input"
                type="text"
                value={coordinate_input}
                onChange={handleChange}
                onBlur={handleBlur}
                className={has_error ? "reject" : ""}
                placeholder={_("e.g., D4")}
                disabled={!can_place}
                maxLength={3}
                autoComplete="off"
                aria-label={_("Enter stone coordinates (e.g., D4, Q16)")}
                aria-describedby="coordinate-input-help"
                aria-invalid={has_error}
            />
            <span id="coordinate-input-help" className="sr-only">
                {_("Enter coordinates in format like D4 or Q16, then press Enter to place a stone")}
            </span>
        </form>
    );
}

export function PlayButtons(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const user_id = useUser().id;
    const [keyboard_coordinates_enabled] = preferences.usePreference(
        "accessibility.keyboard-coordinate-input",
    );

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: accept_button, used: signalUndoAcceptUsed } =
        registerTargetItem("accept-undo-button");

    const official_move_number = useOfficialMoveNumber(goban);
    const cur_move_number = useCurrentMoveNumber(goban);
    const player_to_move = usePlayerToMove(goban);
    const is_my_move = player_to_move === user_id;

    const show_submit = useShowSubmitButton(goban);
    // Re-read at render time; the hooks above re-render on every event that
    // can change it.
    const has_staged_move = hasStagedMove(goban);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (goban.unstagePendingMove()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [goban]);

    // Only the receiving side of an undo request is answered here. The
    // requesting side withdraws from the action bar's undo button, which
    // toggles off while their own request is pending.
    const show_undo_response = useCanAnswerUndoRequest(goban);

    // Resign (or cancel, while the game is young enough) sits at the right
    // edge of this strip. It only applies to a player in a game that is
    // still in progress.
    const resign_mode = useResignMode(goban);
    const user_is_player = useUserIsParticipant(goban);
    const mode = useMode(goban);
    const phase = usePhase(goban);
    const show_resign = user_is_player && mode === "play" && phase === "play";
    const resign_label = resign_mode === "cancel" ? _("Cancel game") : _("Resign");

    const pass = () => {
        if (
            !isLiveGame(goban.engine.time_control, goban.engine.width, goban.engine.height) ||
            !preferences.get("one-click-submit-live")
        ) {
            void alert
                .fire({ text: _("Are you sure you want to pass?"), showCancelButton: true })
                .then(({ value: accept }) => {
                    if (accept) {
                        goban.pass();
                    }
                });
        } else {
            goban.pass();
        }
    };

    const acceptUndo = () => {
        goban.acceptUndo();
        signalUndoAcceptUsed();
    };

    const cancelUndo = () => {
        goban.cancelUndo();
    };

    const submitting_move = useSubmittingMove(goban);

    const show_pass =
        !has_staged_move &&
        is_my_move &&
        engine.handicapMovesLeft() === 0 &&
        cur_move_number === official_move_number;
    const show_submit_button = show_submit;

    // Undo moved to the action bar; what is left here is the response to
    // the opponent's undo request, the move controls, and resign.
    // Collapse the strip entirely when none of them apply so it takes up
    // no space.
    if (
        !show_undo_response &&
        !show_pass &&
        !show_submit_button &&
        !keyboard_coordinates_enabled &&
        !show_resign
    ) {
        return null;
    }

    return (
        <span className="play-buttons">
            <span>
                {show_undo_response && (
                    <button
                        className="sm primary bold accept-undo-button"
                        onClick={() => acceptUndo()}
                        ref={accept_button}
                    >
                        {_("Accept Undo")}
                    </button>
                )}
            </span>
            <span>
                <KeyboardCoordinateInput />
                {show_pass && (
                    <button className="sm primary bold pass-button" onClick={pass}>
                        {_("Pass")}
                    </button>
                )}
                {show_submit_button && (
                    <button
                        className={
                            "sm primary bold submit-button " +
                            (preferences.get("autofocus-submit-button")
                                ? "autofocus-submit-button"
                                : "")
                        }
                        id="game-submit-move"
                        autoFocus={preferences.get("autofocus-submit-button")}
                        disabled={submitting_move || !goban.submit_move}
                        onClick={() => {
                            if (goban.submit_move) {
                                goban.submit_move();
                            }
                        }}
                    >
                        {_("Submit Move")}
                    </button>
                )}
            </span>
            <span>
                {show_undo_response && (
                    <button className="bold reject-undo-button xs" onClick={() => cancelUndo()}>
                        {_("Reject Undo")}
                    </button>
                )}
                {show_resign && (
                    <button
                        className="sm resign-button"
                        onClick={() => cancelOrResignGame(goban, resign_mode)}
                        title={resign_label}
                    >
                        <i className="fa fa-flag" />
                        <span>{resign_label}</span>
                    </button>
                )}
            </span>
        </span>
    );
}
