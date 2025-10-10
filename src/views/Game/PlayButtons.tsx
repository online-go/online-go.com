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
import { _, pgettext } from "@/lib/translate";
import { isLiveGame } from "@/components/TimeControl";
import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";
import { alert } from "@/lib/swal_config";
import {
    generateGobanHook,
    useCurrentMoveNumber,
    usePlayerToMove,
    useShowUndoRequested,
} from "./GameHooks";
import * as DynamicHelp from "react-dynamic-help";
import { useGobanController } from "./goban_context";

const useOfficialMoveNumber = generateGobanHook(
    (goban) => goban!.engine.last_official_move?.move_number || -1,
    ["last_official_move"],
);

interface PlayButtonsProps {
    // This option exists because Cancel Button is placed below
    // chat on mobile layouts.
    show_cancel?: boolean;
}

export function PlayButtons({ show_cancel = true }: PlayButtonsProps): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const phase = engine.phase;

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: accept_button, used: signalUndoAcceptUsed } =
        registerTargetItem("accept-undo-button");

    const official_move_number = useOfficialMoveNumber(goban);
    const cur_move_number = useCurrentMoveNumber(goban);
    const player_to_move = usePlayerToMove(goban);
    const is_my_move = player_to_move === data.get("user").id;
    const [in_pushed_analysis, set_in_pushed_analysis] = React.useState(
        goban_controller.in_pushed_analysis,
    );

    const [show_submit, setShowSubmit] = React.useState(false);
    React.useEffect(() => {
        const syncShowSubmit = () => {
            setShowSubmit(
                !!(
                    goban.submit_move &&
                    goban.engine.cur_move &&
                    goban.engine.cur_move.parent &&
                    goban.engine.last_official_move &&
                    goban.engine.cur_move.parent.id === goban.engine.last_official_move.id
                ),
            );
        };
        syncShowSubmit();

        goban.on("submit_move", syncShowSubmit);
        goban.on("last_official_move", syncShowSubmit);
        goban.on("cur_move", syncShowSubmit);
        goban_controller.on("in_pushed_analysis", set_in_pushed_analysis);
        return () => {
            goban.off("submit_move", syncShowSubmit);
            goban.off("last_official_move", syncShowSubmit);
            goban.off("cur_move", syncShowSubmit);
            goban_controller.off("in_pushed_analysis", set_in_pushed_analysis);
        };
    }, [goban_controller, goban, set_in_pushed_analysis]);

    const [show_accept_undo, setShowAcceptUndo] = React.useState<boolean>(false);
    React.useEffect(() => {
        const syncShowAcceptUndo = () => {
            if (in_pushed_analysis) {
                return;
            }

            setShowAcceptUndo(
                goban.engine.playerToMove() === data.get("user").id ||
                    (goban.submit_move != null &&
                        goban.engine.playerNotToMove() === data.get("user").id),
            );
        };
        syncShowAcceptUndo();

        goban.on("cur_move", syncShowAcceptUndo);
        goban.on("submit_move", syncShowAcceptUndo);
        return () => {
            goban.off("cur_move", syncShowAcceptUndo);
            goban.off("submit_move", syncShowAcceptUndo);
        };
    }, [goban, in_pushed_analysis]);
    const show_undo_requested = useShowUndoRequested(goban);

    const onUndo = () => {
        if (
            data.get("user").id === goban.engine.playerNotToMove() &&
            goban.engine.undo_requested !== goban.engine.getMoveNumber()
        ) {
            goban.requestUndo();
        }
    };

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

    const [submitting_move, setSubmittingMove] = React.useState(false);
    React.useEffect(() => {
        goban.on("submitting-move", setSubmittingMove);
        return () => {
            goban.off("submitting-move", setSubmittingMove);
        };
    }, [goban]);

    return (
        <span className="play-buttons">
            <span>
                {cur_move_number === goban.engine.last_official_move.move_number && (
                    <>
                        {cur_move_number >= 1 &&
                            !engine.rengo &&
                            (player_to_move !== data.get("user").id || engine.is_game_record) &&
                            !((engine.undo_requested ?? -1) >= engine.getMoveNumber()) &&
                            goban.submit_move == null && (
                                <button className="bold undo-button xs" onClick={onUndo}>
                                    {_("Undo")}
                                </button>
                            )}
                        {show_undo_requested && (
                            <span>
                                {show_accept_undo && (
                                    <button
                                        className="sm primary bold accept-undo-button"
                                        onClick={() => acceptUndo()}
                                        ref={accept_button}
                                    >
                                        {_("Accept Undo")}
                                    </button>
                                )}
                            </span>
                        )}
                    </>
                )}
            </span>
            <span>
                {!show_submit &&
                    is_my_move &&
                    engine.handicapMovesLeft() === 0 &&
                    cur_move_number === official_move_number && (
                        <button className="sm primary bold pass-button" onClick={pass}>
                            {_("Pass")}
                        </button>
                    )}
                {show_submit && engine.undo_requested !== engine.getMoveNumber() && (
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
                        {pgettext("A button to send a move", "Submit Move")}
                    </button>
                )}
            </span>
            <span>
                {show_cancel && phase !== "finished" && <CancelButton className={"bold xs"} />}
            </span>
        </span>
    );
}

interface CancelButtonProps {
    className?: string;
}
export function CancelButton({ className = "" }: CancelButtonProps) {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const [resign_mode, set_resign_mode] = React.useState<"cancel" | "resign">();
    React.useEffect(() => {
        const sync_resign_mode = () => {
            if (goban.engine.gameCanBeCancelled()) {
                set_resign_mode("cancel");
            } else {
                set_resign_mode("resign");
            }
        };
        sync_resign_mode();
        goban.on("load", sync_resign_mode);
        goban.on("cur_move", sync_resign_mode);
        return () => {
            goban.off("load", sync_resign_mode);
            goban.off("cur_move", sync_resign_mode);
        };
    }, [goban]);

    const cancelOrResign = () => {
        let dropping_from_casual_rengo = false;

        if (goban.engine.rengo && goban.engine.rengo_casual_mode) {
            const team = goban.engine.rengo_teams!.black.find((p) => p.id === data.get("user").id)
                ? "black"
                : "white";
            dropping_from_casual_rengo = goban.engine.rengo_teams![team].length > 1;
        }

        const text =
            resign_mode === "cancel"
                ? _("Are you sure you wish to cancel this game?")
                : dropping_from_casual_rengo
                  ? _("Are you sure you want to abandon your team?")
                  : _("Are you sure you wish to resign this game?");
        const cb = resign_mode === "cancel" ? () => goban.cancelGame() : () => goban.resign();

        void alert
            .fire({
                text: text,
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    cb();
                }
            });
    };

    return (
        <button className={`cancel-button ${className}`} onClick={cancelOrResign}>
            {resign_mode === "cancel" ? _("Cancel game") : _("Resign")}
        </button>
    );
}
