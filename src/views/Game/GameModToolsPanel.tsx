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
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { _ } from "@/lib/translate";
import { post, del } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { errorAlerter } from "@/lib/misc";
import { doAnnul, MODERATOR_POWERS } from "@/lib/moderation";
import { toast } from "@/lib/toast";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import { usePhase } from "./GameHooks";
import { useGobanController } from "./goban_context";
import "./GameModToolsPanel.css";

interface GameModToolsPanelProps {
    historical_black: rest_api.games.Player | null;
    historical_white: rest_api.games.Player | null;
    ai_suspected: boolean;
}

export function GameModToolsPanel({
    historical_black,
    historical_white,
    ai_suspected,
}: GameModToolsPanelProps): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const phase = usePhase(goban);
    const user = useUser();
    const { showModal } = React.useContext(ModalContext);

    const [annulled, set_annulled] = React.useState(goban_controller.annulled);
    React.useEffect(() => {
        goban_controller.on("annulled", set_annulled);
        return () => {
            goban_controller.off("annulled", set_annulled);
        };
    }, [goban_controller]);

    const review_id: number | undefined = goban.config.review_id;
    const game_id: number | undefined = Number(goban.config.game_id);
    const review = !!review_id;

    let superuser_ai_review_ready = user?.is_superuser && phase === "finished";
    let user_can_intervene = user?.is_moderator && phase !== "finished";
    let user_can_annul = user?.is_moderator && phase === "finished";
    let user_detects_ai = ((user?.moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0;
    if (review) {
        superuser_ai_review_ready = false;
        user_can_intervene = false;
        user_can_annul = false;
        user_detects_ai = false;
    }

    const annulable = !annulled && engine.config.ranked;
    const unannulable = annulled && engine.config.ranked;
    const can_inspect_full = user_can_intervene || user_can_annul;
    const show_icons = user_can_intervene || user_can_annul || user_detects_ai;

    const decide = (winner: string): void => {
        if (!game_id) {
            void alert.fire(_("Game ID missing"));
            return;
        }
        let moderation_note: string | null = null;
        do {
            moderation_note = prompt(`Deciding for ${winner.toUpperCase()} - Moderator note:`);
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post(`games/${game_id}/moderate`, {
            decide: winner,
            moderation_note,
        }).catch(errorAlerter);
    };

    const force_autoscore = () => {
        if (!game_id) {
            void alert.fire(_("Game ID missing"));
            return;
        }
        let moderation_note: string | null = null;
        do {
            moderation_note = prompt("Autoscoring game - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post(`games/${game_id}/moderate`, {
            autoscore: true,
            moderation_note,
        }).catch(errorAlerter);
    };

    const do_annul = (tf: boolean): void => {
        if (!game_id) {
            void alert.fire(_("Game ID missing"));
            return;
        }
        doAnnul(engine.config, tf, goban_controller.setAnnulled);
    };

    const showLogModal = () => {
        showModal(ModalTypes.GameLog, {
            config: goban.config,
            markCoords: goban_controller.gameLogModalMarkCoords,
            black: historical_black || engine.players.black,
            white: historical_white || engine.players.white,
        });
    };

    const showMoveMetadataModal = () => {
        if (!goban || !goban.config) {
            console.error("Goban or goban.config is not available");
            return;
        }
        showModal(ModalTypes.GameMoveMetadata, {
            config: goban.config,
            black: historical_black || engine.players.black,
            white: historical_white || engine.players.white,
        });
    };

    const toggleAnonymousModerator = () => {
        const channel = `game-${game_id}`;
        data.set(
            `moderator.join-game-publicly.${channel}`,
            !data.get(
                `moderator.join-game-publicly.${channel}`,
                !preferences.get("moderator.join-games-anonymously"),
            ),
        );
    };

    const delete_ai_reviews = () => {
        void alert
            .fire({
                text: _("Really clear ALL AI reviews for this game?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    console.info(`Clearing AI reviews for ${game_id}`);
                    del(`games/${game_id}/ai_reviews`, {})
                        .then(() => console.info("AI Reviews cleared"))
                        .catch(errorAlerter);
                }
            });
    };

    const force_ai_review = (analysis_type: "fast" | "full") => {
        post(`games/${game_id}/ai_reviews`, {
            engine: "katago",
            type: analysis_type,
        })
            .then(() => toast(<div>{_("Analysis started")}</div>, 2000))
            .catch(errorAlerter);
    };

    if (!user_can_intervene && !user_can_annul && !user_detects_ai && !superuser_ai_review_ready) {
        return null;
    }

    return (
        <div className="GameModToolsPanel">
            {user_can_intervene && (
                <div
                    className="GameModToolsPanel-decide"
                    role="group"
                    aria-label={_("Decide outcome")}
                >
                    <button
                        type="button"
                        className="GameModToolsPanel-decide-btn black"
                        onClick={() => decide("black")}
                        title={_("Decide: Black wins")}
                    >
                        {_("Black")}
                    </button>
                    <button
                        type="button"
                        className="GameModToolsPanel-decide-btn tie"
                        onClick={() => decide("tie")}
                        title={_("Decide: Tie")}
                    >
                        {_("Tie")}
                    </button>
                    <button
                        type="button"
                        className="GameModToolsPanel-decide-btn auto"
                        onClick={force_autoscore}
                        title={_("Force auto-score")}
                    >
                        {_("Auto")}
                    </button>
                    <button
                        type="button"
                        className="GameModToolsPanel-decide-btn white"
                        onClick={() => decide("white")}
                        title={_("Decide: White wins")}
                    >
                        {_("White")}
                    </button>
                </div>
            )}

            {user_can_annul && annulable && (
                <button
                    type="button"
                    className="GameModToolsPanel-action annul"
                    onClick={() => do_annul(true)}
                >
                    <i className="fa fa-gavel" />
                    <span>{_("Annul this game")}</span>
                </button>
            )}
            {user_can_annul && unannulable && (
                <button
                    type="button"
                    className="GameModToolsPanel-action restore"
                    onClick={() => do_annul(false)}
                >
                    <i className="fa fa-undo" />
                    <span>{_("Restore (un-annul)")}</span>
                </button>
            )}
            {user_can_annul && !annulable && !unannulable && (
                <div
                    className="GameModToolsPanel-action disabled"
                    title={_("This game is not ranked")}
                >
                    <i className="fa fa-gavel" />
                    <span>{_("Annul (unranked)")}</span>
                </div>
            )}

            {show_icons && (
                <div className="GameModToolsPanel-icons" role="group" aria-label={_("Inspect")}>
                    <button
                        type="button"
                        className="GameModToolsPanel-icon"
                        onClick={goban_controller.toggleShowTiming}
                        title={_("Timing")}
                        aria-label={_("Timing")}
                    >
                        <i className="fa fa-clock-o" />
                    </button>
                    {can_inspect_full && (
                        <>
                            <button
                                type="button"
                                className="GameModToolsPanel-icon"
                                onClick={showLogModal}
                                title={_("Game log")}
                                aria-label={_("Game log")}
                            >
                                <i className="fa fa-list-alt" />
                            </button>
                            <button
                                type="button"
                                className="GameModToolsPanel-icon"
                                onClick={showMoveMetadataModal}
                                title={_("Move metadata")}
                                aria-label={_("Move metadata")}
                            >
                                <i className="fa fa-list" />
                            </button>
                        </>
                    )}
                    {ai_suspected && (
                        <button
                            type="button"
                            className="GameModToolsPanel-icon"
                            onClick={goban_controller.toggleShowBotDetectionResults}
                            title={_("Bot detection results")}
                            aria-label={_("Bot detection results")}
                        >
                            <i className="fa fa-exclamation-triangle" />
                        </button>
                    )}
                    {can_inspect_full && (
                        <button
                            type="button"
                            className="GameModToolsPanel-icon"
                            onClick={toggleAnonymousModerator}
                            title={_("Cloak of invisibility")}
                            aria-label={_("Cloak of invisibility")}
                        >
                            <i className="fa fa-user-secret" />
                        </button>
                    )}
                </div>
            )}

            {superuser_ai_review_ready && (
                <div className="GameModToolsPanel-ai" role="group" aria-label={_("AI Review")}>
                    <button
                        type="button"
                        className="GameModToolsPanel-ai-btn"
                        onClick={() => force_ai_review("fast")}
                        title={_("Fast AI review")}
                    >
                        <i className="fa fa-bolt" />
                        <span>{_("Fast")}</span>
                    </button>
                    <button
                        type="button"
                        className="GameModToolsPanel-ai-btn"
                        onClick={() => force_ai_review("full")}
                        title={_("Full AI review")}
                    >
                        <i className="fa fa-area-chart" />
                        <span>{_("Full")}</span>
                    </button>
                    <button
                        type="button"
                        className="GameModToolsPanel-ai-btn danger"
                        onClick={delete_ai_reviews}
                        title={_("Delete all AI reviews")}
                        aria-label={_("Delete all AI reviews")}
                    >
                        <i className="fa fa-trash" />
                    </button>
                </div>
            )}
        </div>
    );
}
