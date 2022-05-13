/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";
import { Goban, GobanCore, JGOFNumericPlayerColor } from "goban";
import { isLiveGame } from "TimeControl";
import * as preferences from "preferences";
import * as data from "data";
import { game_control } from "./game_control";
import swal from "sweetalert2";
import { useUndoRequested } from "./GameHooks";

interface PlayButtonsProps {
    cur_move_number: number;
    goban: Goban;
    player_to_move: number;

    // This option exists because Cancel Button is placed below
    // chat on mobile layouts.
    show_cancel: boolean;
}

export function PlayButtons({
    cur_move_number,
    goban,
    player_to_move,
    show_cancel,
}: PlayButtonsProps): JSX.Element {
    const engine = goban.engine;
    const phase = engine.phase;

    const real_player_to_move =
        engine.last_official_move?.player === JGOFNumericPlayerColor.BLACK
            ? engine.players.white.id
            : engine.players.black.id;
    const is_my_move = real_player_to_move === data.get("user").id;

    const [show_submit, setShowSubmit] = React.useState(false);
    React.useEffect(() => {
        const syncShowSubmit = () => {
            setShowSubmit(
                !!goban.submit_move &&
                    goban.engine.cur_move &&
                    goban.engine.cur_move.parent &&
                    goban.engine.last_official_move &&
                    goban.engine.cur_move.parent.id === goban.engine.last_official_move.id,
            );
        };
        syncShowSubmit();

        goban.on("submit_move", syncShowSubmit);
        goban.on("last_official_move", syncShowSubmit);
        goban.on("cur_move", syncShowSubmit);
    }, [goban]);

    const [show_accept_undo, setShowAcceptUndo] = React.useState<boolean>(false);
    React.useEffect(() => {
        const syncShowAcceptUndo = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            setShowAcceptUndo(
                goban.engine.playerToMove() === data.get("user").id ||
                    (goban.submit_move != null &&
                        goban.engine.playerNotToMove() === data.get("user").id) ||
                    null,
            );
        };
        syncShowAcceptUndo();

        goban.on("cur_move", syncShowAcceptUndo);
        goban.on("submit_move", syncShowAcceptUndo);
    }, [goban]);
    const show_undo_requested = useUndoRequested(goban);

    const onUndo = () => {
        if (
            data.get("user").id === goban.engine.playerNotToMove() &&
            goban.engine.undo_requested !== goban.engine.getMoveNumber()
        ) {
            goban.requestUndo();
        }
    };

    const pass = () => {
        if (!isLiveGame(goban.engine.time_control) || !preferences.get("one-click-submit-live")) {
            swal({ text: _("Are you sure you want to pass?"), showCancelButton: true })
                .then(() => goban.pass())
                .catch(() => 0);
        } else {
            goban.pass();
        }
    };

    const [submitting_move, setSubmittingMove] = React.useState(false);
    React.useEffect(() => {
        goban.on("submitting-move", setSubmittingMove);
    }, [goban]);

    return (
        <span className="play-buttons">
            <span>
                {((cur_move_number >= 1 &&
                    !engine.rengo &&
                    player_to_move !== data.get("user").id &&
                    !(engine.undo_requested >= engine.getMoveNumber()) &&
                    goban.submit_move == null) ||
                    null) && (
                    <button className="bold undo-button xs" onClick={onUndo}>
                        {_("Undo")}
                    </button>
                )}
                {show_undo_requested && (
                    <span>
                        {show_accept_undo && (
                            <button
                                className="sm primary bold accept-undo-button"
                                onClick={() => goban.acceptUndo()}
                            >
                                {_("Accept Undo")}
                            </button>
                        )}
                    </span>
                )}
            </span>
            <span>
                {((!show_submit && is_my_move && engine.handicapMovesLeft() === 0) || null) && (
                    <button className="sm primary bold pass-button" onClick={pass}>
                        {_("Pass")}
                    </button>
                )}
                {((show_submit && engine.undo_requested !== engine.getMoveNumber()) || null) && (
                    <button
                        className="sm primary bold submit-button"
                        id="game-submit-move"
                        disabled={submitting_move}
                        onClick={() => goban.submit_move()}
                    >
                        {_("Submit Move")}
                    </button>
                )}
            </span>
            <span>
                {show_cancel && phase !== "finished" && (
                    <CancelButton goban={goban} className={"bold xs"} />
                )}
            </span>
        </span>
    );
}

interface CancelButtonProps {
    className: string;
    goban: GobanCore;
}
export function CancelButton({ className, goban }: CancelButtonProps) {
    const [resign_mode, set_resign_mode] = React.useState<"cancel" | "resign">();
    React.useEffect(() => {
        const sync_resign_mode = () => {
            if (goban.engine.gameCanBeCanceled()) {
                set_resign_mode("cancel");
            } else {
                set_resign_mode("resign");
            }
        };
        sync_resign_mode();
        goban.on("load", sync_resign_mode);
        goban.on("mode", sync_resign_mode);
    }, [goban]);

    const cancelOrResign = () => {
        let dropping_from_casual_rengo = false;

        if (goban.engine.rengo && goban.engine.rengo_casual_mode) {
            const team = goban.engine.rengo_teams.black.find((p) => p.id === data.get("user").id)
                ? "black"
                : "white";
            dropping_from_casual_rengo = goban.engine.rengo_teams[team].length > 1;
        }

        const text =
            resign_mode === "cancel"
                ? _("Are you sure you wish to cancel this game?")
                : dropping_from_casual_rengo
                ? _("Are you sure you want to abandon your team?")
                : _("Are you sure you wish to resign this game?");
        const cb = resign_mode === "cancel" ? () => goban.cancelGame() : () => goban.resign();

        swal({
            text: text,
            confirmButtonText: _("Yes"),
            cancelButtonText: _("No"),
            showCancelButton: true,
            focusCancel: true,
        })
            .then(cb)
            .catch(swal.noop);
    };

    return (
        <button className={`cancel-button ${className}`} onClick={cancelOrResign}>
            {resign_mode === "cancel" ? _("Cancel Game") : _("Resign")}
        </button>
    );
}
