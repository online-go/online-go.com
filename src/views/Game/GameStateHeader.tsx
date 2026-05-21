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
import { _, interpolate, pgettext } from "@/lib/translate";
import { getOutcomeTranslation } from "@/lib/misc";
import { useGobanController } from "./goban_context";
import {
    useAnnulled,
    useMode,
    usePhase,
    useShowTitle,
    useShowUndoRequested,
    useTitle,
    useWinner,
} from "./GameHooks";
import { EstimateScore } from "./fragments";

/**
 * The game's current high-level status — rendered into GobanView's
 * `sidebarHeader` slot so it sits as a pinned banner above the scrollable
 * sidebar content. Returns `null` (and the wrapper's `:empty { display: none }`
 * collapses) when there's nothing relevant to show. Mirrors the conditional
 * structure of the `.game-state` div that used to live in PlayControls.
 */
export function GameStateHeader(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;

    const mode = useMode(goban);
    const phase = usePhase(goban);
    const show_title = useShowTitle(goban);
    const title = useTitle(goban);
    const show_undo_requested = useShowUndoRequested(goban);
    const winner = useWinner(goban);
    const annulled = useAnnulled(goban_controller);

    const undo_requester_name = React.useMemo(() => {
        if (!show_undo_requested || !engine.undo_requested_by) {
            return "";
        }
        const player =
            engine.undo_requested_by === engine.players.black?.id
                ? engine.players.black
                : engine.players.white;
        return player?.username ?? "";
    }, [show_undo_requested, engine.undo_requested_by, engine.players]);

    const sse = engine.stalling_score_estimate;

    const isPlayPlay = mode === "play" && phase === "play";
    const isStoneRemoval = mode === "play" && phase === "stone removal";
    const isAnalyze = mode === "analyze";
    const isConditional = mode === "conditional";
    const isScoreEstimation = mode === "score estimation";
    const isFinished = mode === "play" && phase === "finished";

    const has_play_content = isPlayPlay && ((show_title && !engine.rengo) || show_undo_requested);
    const has_any_content =
        has_play_content ||
        isStoneRemoval ||
        isAnalyze ||
        isConditional ||
        isScoreEstimation ||
        isFinished;

    if (!has_any_content) {
        return null;
    }

    return (
        <>
            {isPlayPlay && (
                <span>
                    {show_title && !engine.rengo && <span>{title}</span>}
                    {show_undo_requested && (
                        <span className="undo-requested-message">
                            {interpolate(
                                pgettext(
                                    "Notification that a player has requested to undo their last move",
                                    "{{player_name}} has requested an undo",
                                ),
                                { player_name: undo_requester_name },
                            )}
                        </span>
                    )}
                </span>
            )}

            {isStoneRemoval && <span>{_("Stone Removal Phase")}</span>}

            {isAnalyze && (
                <span>
                    {show_undo_requested ? (
                        <span>
                            {interpolate(
                                pgettext(
                                    "Notification that a player has requested to undo their last move",
                                    "{{player_name}} has requested an undo",
                                ),
                                { player_name: undo_requester_name },
                            )}
                        </span>
                    ) : (
                        <span>{_("Analyze Mode")}</span>
                    )}
                </span>
            )}

            {isConditional && <span>{_("Conditional Move Planner")}</span>}

            {isScoreEstimation && <EstimateScore />}

            {isFinished && (
                <>
                    <span style={{ textDecoration: annulled ? "line-through" : "none" }}>
                        {winner
                            ? interpolate(
                                  pgettext("Game winner", "{{color}} wins by {{outcome}}"),
                                  {
                                      color:
                                          (winner as unknown) === engine.players.black?.id ||
                                          winner === "black"
                                              ? _("Black")
                                              : _("White"),
                                      outcome: getOutcomeTranslation(engine.outcome),
                                  },
                              )
                            : interpolate(pgettext("Game winner", "Tie by {{outcome}}"), {
                                  outcome: pgettext("Game outcome", engine.outcome),
                              })}
                    </span>
                    {engine.stalling_score_estimate && sse && (
                        <div className="stalling-score-estimate">
                            <span>
                                {interpolate(
                                    _(
                                        "The AI has concluded {{color}} will win with {{certainty}}% certainty. This result has been accepted by one or more players",
                                    ),
                                    {
                                        color:
                                            sse.predicted_winner === "black"
                                                ? _("Black")
                                                : _("White"),
                                        certainty: (
                                            (sse.predicted_winner === "black"
                                                ? sse.win_rate
                                                : 1.0 - sse.win_rate) * 100.0
                                        ).toFixed(2),
                                    },
                                )}
                            </span>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
