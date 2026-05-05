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
import "./GameSidebarPanels.css";

interface GameModToolsPanelProps {
    historical_black: rest_api.games.Player | null;
    historical_white: rest_api.games.Player | null;
    ai_suspected: boolean;
    /** When rendered inside a popover, GobanView's container click handler
     *  doesn't reach into our content, so each interactive item dismisses
     *  itself via this callback. */
    onClose?: () => void;
}

export function GameModToolsPanel({
    historical_black,
    historical_white,
    ai_suspected,
    onClose,
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
    const decide_white = () => decide("white");
    const decide_black = () => decide("black");
    const decide_tie = () => decide("tie");

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

    // Wrap a handler so the popover dismisses after the action fires.
    const wrap = <T extends unknown[]>(fn: (...args: T) => void) => {
        return (...args: T) => {
            fn(...args);
            onClose?.();
        };
    };

    return (
        <div className="GameSidebarPanel GameModToolsPanel">
            <h3 className="GameSidebarPanel-title">{_("Moderator tools")}</h3>

            {user_can_intervene && (
                <>
                    <div className="GameSidebarPanel-section-header">{_("Decide outcome")}</div>
                    <button className="GameSidebarPanel-item" onClick={wrap(decide_black)}>
                        <i className="fa fa-gavel" />
                        <span>{_("Black Wins")}</span>
                    </button>
                    <button className="GameSidebarPanel-item" onClick={wrap(decide_white)}>
                        <i className="fa fa-gavel" />
                        <span>{_("White Wins")}</span>
                    </button>
                    <button className="GameSidebarPanel-item" onClick={wrap(decide_tie)}>
                        <i className="fa fa-gavel" />
                        <span>{_("Tie")}</span>
                    </button>
                    <button className="GameSidebarPanel-item" onClick={wrap(force_autoscore)}>
                        <i className="fa fa-gavel" />
                        <span>{_("Auto-score")}</span>
                    </button>
                </>
            )}

            {user_can_annul && (
                <>
                    <div className="GameSidebarPanel-section-header">{_("Annulment")}</div>
                    {annulable && (
                        <button
                            className="GameSidebarPanel-item"
                            onClick={wrap(() => do_annul(true))}
                        >
                            <i className="fa fa-gavel" />
                            <span>{_("Annul")}</span>
                        </button>
                    )}
                    {unannulable && (
                        <button
                            className="GameSidebarPanel-item"
                            onClick={wrap(() => do_annul(false))}
                        >
                            <i className="fa fa-gavel unannulable" />
                            <span>{"Remove annulment"}</span>
                        </button>
                    )}
                    {!annulable && !unannulable && (
                        <div className="GameSidebarPanel-item disabled">
                            <i className="fa fa-gavel" />
                            <span>{_("Annul")}</span>
                        </div>
                    )}
                </>
            )}

            {(user_can_intervene || user_can_annul || user_detects_ai) && (
                <>
                    <div className="GameSidebarPanel-section-header">{_("Inspect")}</div>
                    <button
                        className="GameSidebarPanel-item"
                        onClick={wrap(goban_controller.toggleShowTiming)}
                    >
                        <i className="fa fa-clock-o" />
                        <span>{_("Timing")}</span>
                    </button>
                    {ai_suspected && (
                        <button
                            className="GameSidebarPanel-item"
                            onClick={wrap(goban_controller.toggleShowBotDetectionResults)}
                        >
                            <i className="fa fa-exclamation" />
                            <span>{_("Bot Detection Results")}</span>
                        </button>
                    )}
                </>
            )}

            {(user_can_intervene || user_can_annul) && (
                <>
                    <button className="GameSidebarPanel-item" onClick={wrap(showLogModal)}>
                        <i className="fa fa-list-alt" />
                        <span>{"Log"}</span>
                    </button>
                    <button className="GameSidebarPanel-item" onClick={wrap(showMoveMetadataModal)}>
                        <i className="fa fa-list" />
                        <span>{"Move Metadata"}</span>
                    </button>
                    <button
                        className="GameSidebarPanel-item"
                        onClick={wrap(toggleAnonymousModerator)}
                    >
                        <i className="fa fa-user-secret" />
                        <span>{"Cloak of Invisibility"}</span>
                    </button>
                </>
            )}

            {superuser_ai_review_ready && (
                <>
                    <div className="GameSidebarPanel-section-header">{_("AI Review")}</div>
                    <button
                        className="GameSidebarPanel-item"
                        onClick={wrap(() => force_ai_review("fast"))}
                    >
                        <i className="fa fa-line-chart" />
                        <span>{"Fast AI Review"}</span>
                    </button>
                    <button
                        className="GameSidebarPanel-item"
                        onClick={wrap(() => force_ai_review("full"))}
                    >
                        <i className="fa fa-area-chart" />
                        <span>{_("Full AI Review")}</span>
                    </button>
                    <button className="GameSidebarPanel-item" onClick={wrap(delete_ai_reviews)}>
                        <i className="fa fa-trash" />
                        <span>{"Delete AI reviews"}</span>
                    </button>
                </>
            )}
        </div>
    );
}
