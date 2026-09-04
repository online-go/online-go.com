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
import { alert } from "@/lib/swal_config";
import { Clock } from "@/components/Clock";
import { useUser } from "@/lib/hooks";
import { PlayButtons } from "./PlayButtons";
import { EstimateScore } from "./fragments";
import { useGobanController } from "./goban_context";
import {
    useAutoScoring,
    useMode,
    useNeedsSealing,
    usePhase,
    useStoneRemovalAccepted,
    useUserIsParticipant,
} from "./GameHooks";
import "./GameActionArea.css";

/**
 * The controls a player must be able to reach without scrolling: pass and
 * resign, the score estimate with its exit button, and the stone removal
 * controls.
 *
 * On portrait the Game view renders this in GobanView's below-board slot,
 * so whatever it holds pushes the board up instead of sitting below the
 * fold. On wider layouts PlayControls renders it at the top of the sidebar.
 * Renders nothing when the current state has no such controls.
 */
export function GameActionArea(): React.ReactElement | null {
    const user = useUser();
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const mode = useMode(goban);
    const phase = usePhase(goban);
    const user_is_player = useUserIsParticipant(goban);
    const needs_sealing = useNeedsSealing(goban);
    const autoscoring = useAutoScoring(goban);
    const black_accepted = useStoneRemovalAccepted(goban, "black");
    const white_accepted = useStoneRemovalAccepted(goban, "white");

    const show_play_buttons = mode === "play" && phase === "play" && user_is_player;
    const show_score_estimate = mode === "score estimation";

    const user_is_active_player = [engine.players.black.id, engine.players.white.id].includes(
        user.id,
    );
    const show_accept = user_is_active_player || user.is_moderator;
    const show_stone_removal = phase === "stone removal" && (show_accept || user_is_player);

    if (!show_play_buttons && !show_score_estimate && !show_stone_removal) {
        return null;
    }

    const need_to_seal = !!needs_sealing && needs_sealing.length > 0;
    const user_accepted = engine.playerColor(user.id) === "black" ? black_accepted : white_accepted;
    // Moderators see the accept button, with its timer, but can't press it.
    const moderator_only = user.is_moderator && !user_is_active_player;
    const accept_is_primary = !moderator_only && !need_to_seal && !autoscoring.in_progress;
    const accept_disabled =
        moderator_only ||
        !!user_accepted ||
        (autoscoring.in_progress && !autoscoring.taking_too_long);

    const onStoneRemovalCancel = () => {
        void alert
            .fire({
                text: _("Are you sure you want to resume the game?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    goban.rejectRemovedStones();
                }
            });
    };

    return (
        <div className="GameActionArea">
            {show_play_buttons && <PlayButtons />}

            {show_score_estimate && (
                <div className="score-estimate-buttons">
                    <div className="score-estimate">
                        <EstimateScore />
                    </div>
                    <button
                        className="sm primary bold"
                        onClick={goban_controller.stopEstimatingScore}
                    >
                        {_("Back to Board")}
                    </button>
                </div>
            )}

            {show_stone_removal && (
                <div className="stone-removal-buttons">
                    {show_accept && (
                        <button
                            className={accept_is_primary ? "primary" : ""}
                            disabled={accept_disabled}
                            onClick={() => goban.acceptRemovedStones()}
                        >
                            {_("Accept removed stones")}
                            <Clock goban={goban} color="stone-removal" />
                        </button>
                    )}
                    {autoscoring.in_progress && (
                        <div className="autoscoring-in-progress">
                            <i className="fa fa-circle-o-notch rotating" /> {_("Scoring game")}
                        </div>
                    )}
                    {user_is_player && (
                        <div className="secondary-buttons">
                            <button
                                id="game-stone-removal-auto-score"
                                onClick={() => goban.performStoneRemovalAutoScoring()}
                            >
                                {_("Auto-score")}
                            </button>
                            <button
                                id="game-stone-removal-cancel"
                                className={need_to_seal ? "primary" : ""}
                                onClick={onStoneRemovalCancel}
                            >
                                {_("Cancel and resume game")}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
