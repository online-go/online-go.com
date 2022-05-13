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
import { Goban, JGOFNumericPlayerColor } from "goban";
import { ViewMode } from "./util";
import { isLiveGame } from "TimeControl";
import * as preferences from "preferences";
import * as data from "data";
import { game_control } from "./game_control";
import swal from "sweetalert2";

interface PlayButtonsProps {
    cur_move_number: number;
    goban: Goban;
    player_to_move: number;
    // Is this variable any different from show_accept_undo? -BPJ
    show_undo_requested: boolean;

    // Cancel buttons are in props because the Cancel Button is placed below
    // chat on mobile.
    show_cancel: boolean;
    onCancel: () => void;

    view_mode: ViewMode;
    resign_text: string;
}

export function PlayButtons({
    cur_move_number,
    goban,
    player_to_move,
    show_undo_requested,
    show_cancel,
    onCancel,
    view_mode,
    resign_text,
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
                    <CancelButton view_mode={view_mode} onClick={onCancel}>
                        {resign_text}
                    </CancelButton>
                )}
            </span>
        </span>
    );
}

interface CancelButtonProps {
    view_mode: ViewMode;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: string;
}
export function CancelButton({ view_mode, onClick, children }: CancelButtonProps) {
    if (view_mode === "portrait") {
        return (
            <button className="bold cancel-button reject" onClick={onClick}>
                {children}
            </button>
        );
    } else {
        return (
            <button className="xs bold cancel-button" onClick={onClick}>
                {children}
            </button>
        );
    }
}
