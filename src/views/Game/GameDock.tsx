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
import { MAX_DOCK_DELAY } from "@/lib/SettingsCommon";
import { useUser } from "@/lib/hooks";
import { api1, post, del } from "@/lib/requests";
import { Dock } from "@/components/Dock";
import { Link } from "react-router-dom";
import { toast } from "@/lib/toast";
import { _, pgettext } from "@/lib/translate";
import { openACLModal } from "@/components/ACLModal";
import { openGameLinkModal } from "./GameLinkModal";
import { sfx } from "@/lib/sfx";
import { alert } from "@/lib/swal_config";
import { errorAlerter } from "@/lib/misc";
import { doAnnul, MODERATOR_POWERS } from "@/lib/moderation";
import { openReport } from "@/components/Report";
import { openGameInfoModal } from "./GameInfoModal";
import {
    useUserIsParticipant,
    useCurrentMoveNumber,
    usePhase,
    useMode,
    usePlayerToMove,
} from "./GameHooks";
import { useGobanController } from "./goban_context";
import { Tooltip } from "../../components/Tooltip";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import { GobanEngine, GobanRenderer } from "goban";
import { openSGFCollectionModal } from "@/components/SGFCollectionModal";

const handleForkGameClick = (
    showModal: (type: ModalTypes, props?: any) => void,
    user: rest_api.UserConfig,
    engine: GobanEngine,
    goban: GobanRenderer,
) => {
    if (!user.anonymous && !engine.rengo && !goban.isAnalysisDisabled()) {
        if (!goban) {
            return;
        }

        showModal(ModalTypes.Fork, { goban });
    }
};

interface DockProps {
    tournament_id?: number;
    tournament_name?: string;
    ladder_id?: number;
    historical_black: rest_api.games.Player | null;
    historical_white: rest_api.games.Player | null;
    ai_suspected: boolean;
    className?: string;
}

export function GameDock({
    tournament_id,
    tournament_name,
    ladder_id,
    historical_black,
    historical_white,
    ai_suspected,
    className,
}: DockProps): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const phase = usePhase(goban);
    const mode = useMode(goban);
    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        goban_controller.ai_review_enabled,
    );
    const [annulled, set_annulled] = React.useState(goban_controller.annulled);
    /*
    const [selected_ai_review_uuid, set_selected_ai_review_uuid] = React.useState<string | null>(
        goban_controller.selected_ai_review_uuid,
    );
    */

    const user = useUser();
    const { showModal } = React.useContext(ModalContext);

    React.useEffect(() => {
        set_ai_review_enabled(goban_controller.ai_review_enabled);
        //set_selected_ai_review_uuid(goban_controller.selected_ai_review_uuid);
        goban_controller.on("ai_review_enabled", set_ai_review_enabled);
        goban_controller.on("annulled", set_annulled);
        //goban_controller.on("selected_ai_review_uuid", set_selected_ai_review_uuid);
        return () => {
            goban_controller.off("ai_review_enabled", set_ai_review_enabled);
            goban_controller.off("annulled", set_annulled);
            //goban_controller.off("selected_ai_review_uuid", set_selected_ai_review_uuid);
        };
    }, [goban_controller]);

    const tooltipRequired = preferences.get("dock-delay") === MAX_DOCK_DELAY;

    let superuser_ai_review_ready = user?.is_superuser && phase === "finished";
    let user_can_intervene = user?.is_moderator && phase !== "finished";
    let user_can_annul = user?.is_moderator && phase === "finished";
    let user_detects_ai = ((user?.moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0;

    const annulable = !annulled && engine.config.ranked;
    const unannulable = annulled && engine.config.ranked;
    const user_is_player = useUserIsParticipant(goban);
    const current_move_number = useCurrentMoveNumber(goban);
    const player_to_move = usePlayerToMove(goban);

    const review_id: number | undefined = goban.config.review_id;
    const game_id: number | undefined = Number(goban.config.game_id);

    const review = !!review_id;
    const game = !!game_id;
    if (review) {
        superuser_ai_review_ready = false;
        user_can_intervene = false;
        user_can_annul = false;
        user_detects_ai = false;
    }

    let sgf_download_enabled = false;
    try {
        sgf_download_enabled = !goban.isAnalysisDisabled(true);
    } catch {
        // ignore error
    }

    const sgf_url = review_id
        ? api1(`reviews/${review_id}/sgf?without-comments=1`)
        : api1(`games/${game_id}/sgf`);
    /*
    const sgf_with_ai_review_url: string | null =
        game_id && selected_ai_review_uuid
            ? api1(`games/${game_id}/sgf?ai_review=${selected_ai_review_uuid}`)
            : null;
    */
    const sgf_with_comments_url: string | null = review_id
        ? api1(`reviews/${review_id}/sgf`)
        : null;

    const openACL = () => {
        if (game_id) {
            openACLModal({ game_id: game_id });
        } else if (review_id) {
            openACLModal({ review_id: review_id });
        }
    };

    const showLinkModal = () => {
        openGameLinkModal(goban);
    };

    const showGameInfo = () => {
        for (const k of [
            "komi",
            "rules",
            "handicap",
            "handicap_rank_difference",
            "rengo",
            "rengo_teams",
        ] as const) {
            (goban.config as any)[k] = goban.engine.config[k];
        }
        openGameInfoModal(
            goban.config,
            historical_black || goban.engine.players.black,
            historical_white || goban.engine.players.white,
            annulled,
            goban_controller.creator_id || goban.review_owner_id || 0,
        );
    };

    const [volume, set_volume] = React.useState(sfx.getVolume("master"));
    const volume_sound_debounce = React.useRef<any | null>(null);

    const toggleVolume = () => {
        _setVolume(volume > 0 ? 0 : 0.5);
    };
    const setVolume = (ev: { target: { value: string } }) => {
        const new_volume = parseFloat(ev.target.value);
        _setVolume(new_volume);
    };
    const _setVolume = (volume: number) => {
        sfx.setVolume("master", volume);
        set_volume(volume);

        if (volume_sound_debounce.current) {
            clearTimeout(volume_sound_debounce.current);
        }

        volume_sound_debounce.current = setTimeout(
            () => sfx.playStonePlacementSound(5, 5, 9, 9, "white"),
            250,
        );
    };

    const alertModerator = () => {
        if (!user || user.anonymous) {
            return;
        }
        const obj: any = game_id
            ? { reported_game_id: game_id }
            : { reported_review_id: review_id };

        if (user.id === engine.config?.white_player_id) {
            obj.reported_user_id = engine.config.black_player_id;
        }
        if (user.id === engine.config?.black_player_id) {
            obj.reported_user_id = engine.config.white_player_id;
        }

        if (!obj.reported_user_id) {
            void alert.fire(
                _(
                    'Please report the player that is a problem by clicking on their name and selecting "Report".',
                ),
            );
        } else {
            openReport(obj);
        }
    };

    // Mod Functions
    const decide = (winner: string): void => {
        if (!game_id) {
            void alert.fire(_("Game ID missing"));
            return;
        }

        let moderation_note: string | null = null;
        do {
            moderation_note = prompt("Deciding for " + winner.toUpperCase() + " - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post(`games/${game_id}/moderate`, {
            decide: winner,
            moderation_note: moderation_note,
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
            moderation_note: moderation_note,
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

    const addSGFToLibrary = () => {
        if (!game_id || user.anonymous) {
            return;
        }

        let gameName = `Game ${game_id}`;
        if (engine.config.game_name) {
            gameName = engine.config.game_name;
        } else if (historical_black && historical_white) {
            gameName = `${historical_black.username} vs ${historical_white.username}`;
        } else if (engine.players?.black && engine.players?.white) {
            gameName = `${engine.players.black.username} vs ${engine.players.white.username}`;
        }

        openSGFCollectionModal(game_id, gameName, () => {
            toast(<div>{_("SGF added to library successfully")}</div>, 3000);
        });
    };

    // Not the same as engine.playerToMove(), which changes when you place a
    // provisional stone on the board (in submit-move or double-click mode).
    const currentPlayer =
        engine.getMoveNumber() === current_move_number ? player_to_move : engine.playerNotToMove();

    return (
        <Dock className={className}>
            {(tournament_id || null) && (
                <Link className="plain" to={`/tournament/${tournament_id}`}>
                    <i className="fa fa-trophy" title={tournament_name ?? _("Tournament")} />{" "}
                    {_("Tournament")}
                </Link>
            )}
            {(ladder_id || null) && (
                <Link className="plain" to={`/ladder/${ladder_id}`}>
                    <i className="fa fa-list-ol" title={_("This is a ladder game")} /> {_("Ladder")}
                </Link>
            )}
            {((engine.config as any)["private"] || null) && (
                <a onClick={openACL}>
                    <i className="fa fa-lock" />{" "}
                    {pgettext("Control who can access the game or review", "Access settings")}
                </a>
            )}
            <Tooltip tooltipRequired={tooltipRequired} title={_("Toggle volume")}>
                <a>
                    <i
                        className={
                            "fa volume-icon " +
                            (volume === 0
                                ? "fa-volume-off"
                                : volume > 0.5
                                  ? "fa-volume-up"
                                  : "fa-volume-down")
                        }
                        onClick={toggleVolume}
                    />{" "}
                    <input
                        type="range"
                        className="volume-slider"
                        onChange={setVolume}
                        value={volume}
                        min={0}
                        max={1.0}
                        step={0.01}
                    />
                </a>
            </Tooltip>
            <Tooltip tooltipRequired={tooltipRequired} title={_("Zen mode")}>
                <a onClick={goban_controller.toggleZenMode}>
                    <i className="ogs-zen-mode"></i> {_("Zen mode")}
                </a>
            </Tooltip>

            <Tooltip tooltipRequired={tooltipRequired} title={_("Toggle coordinates")}>
                <a onClick={goban_controller.toggleCoordinates}>
                    <i className="ogs-coordinates"></i> {_("Toggle coordinates")}
                </a>
            </Tooltip>

            <Tooltip
                tooltipRequired={tooltipRequired}
                title={ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}
            >
                <a onClick={goban_controller.toggleAIReview}>
                    <i className="fa fa-desktop"></i>{" "}
                    {ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}
                </a>
            </Tooltip>
            <Tooltip tooltipRequired={tooltipRequired} title={_("Game information")}>
                <a onClick={showGameInfo}>
                    <i className="fa fa-info"></i> {_("Game information")}
                </a>
            </Tooltip>
            {game && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Analyze game")}>
                    <a
                        onClick={goban_controller.gameAnalyze}
                        className={goban.isAnalysisDisabled() ? "disabled" : ""}
                    >
                        <i className="fa fa-sitemap"></i> {_("Analyze game")}
                    </a>
                </Tooltip>
            )}
            {((!review_id && user_is_player && phase !== "finished" && !engine.rengo) || null) && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Plan conditional moves")}>
                    <a
                        style={{
                            visibility:
                                mode === "play" && currentPlayer !== user?.id
                                    ? "visible"
                                    : "hidden",
                        }}
                        className={goban.isAnalysisDisabled() ? "disabled" : ""}
                        onClick={goban_controller.enterConditionalMovePlanner}
                    >
                        <i className="fa fa-exchange"></i> {_("Plan conditional moves")}
                    </a>
                </Tooltip>
            )}
            {((!review_id && (user_is_player || user_can_intervene) && phase !== "finished") ||
                null) && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Pause game")}>
                    <a onClick={goban_controller.pauseGame}>
                        <i className="fa fa-pause"></i> {_("Pause game")}
                    </a>
                </Tooltip>
            )}
            {game && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Review this game")}>
                    <a
                        onClick={(ev) => {
                            if (ev.currentTarget.className.indexOf("disabled") === -1) {
                                return goban_controller.startReview();
                            }
                        }}
                        className={
                            goban.isAnalysisDisabled() ||
                            user.anonymous ||
                            (user_is_player && phase !== "finished")
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-refresh"></i> {_("Review this game")}
                    </a>
                </Tooltip>
            )}
            <Tooltip tooltipRequired={tooltipRequired} title={_("Estimate score")}>
                <a
                    onClick={goban_controller.estimateScore}
                    className={goban.isAnalysisDisabled() ? "disabled" : ""}
                >
                    <i className="fa fa-tachometer"></i> {_("Estimate score")}
                </a>
            </Tooltip>
            <Tooltip tooltipRequired={tooltipRequired} title={_("Fork game")}>
                <a
                    onClick={() => handleForkGameClick(showModal, user, engine, goban)}
                    className={
                        user.anonymous || engine.rengo || goban.isAnalysisDisabled()
                            ? "disabled"
                            : ""
                    }
                >
                    <i className="fa fa-code-fork"></i> {_("Fork game")}
                </a>
            </Tooltip>
            <Tooltip tooltipRequired={tooltipRequired} title={_("Call moderator")}>
                <a onClick={alertModerator} className={user.anonymous ? "disabled" : ""}>
                    <i className="fa fa-exclamation-triangle"></i> {_("Call moderator")}
                </a>
            </Tooltip>
            {((review && game_id) || null) && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Original game")}>
                    <Link to={`/game/${game_id}`}>
                        <i className="ogs-goban" /> {_("Original game")}
                    </Link>
                </Tooltip>
            )}
            <Tooltip
                tooltipRequired={tooltipRequired}
                title={review ? _("Link to review") : _("Link to game")}
            >
                <a onClick={showLinkModal}>
                    <i className="fa fa-share-alt"></i>{" "}
                    {review ? _("Link to review") : _("Link to game")}
                </a>
            </Tooltip>
            <Tooltip tooltipRequired={tooltipRequired} title={_("Download SGF")}>
                <a
                    href={sgf_url}
                    target="_blank"
                    onClick={(ev) => {
                        if (ev.currentTarget.className.indexOf("disabled") !== -1) {
                            ev.preventDefault();
                        }
                    }}
                    className={
                        !sgf_download_enabled ||
                        (phase !== "finished" &&
                            (user.anonymous ||
                                user.id === engine.config.black_player_id ||
                                user.id === engine.config.white_player_id))
                            ? "disabled"
                            : ""
                    }
                >
                    <i className="fa fa-download"></i> {_("Download SGF")}
                </a>
            </Tooltip>
            {sgf_download_enabled && game && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Add SGF to my library")}>
                    <a
                        onClick={(ev) => {
                            if (ev.currentTarget.className.indexOf("disabled") === -1) {
                                addSGFToLibrary();
                            }
                        }}
                        className={
                            user.anonymous ||
                            (phase !== "finished" &&
                                (user.id === engine.config.black_player_id ||
                                    user.id === engine.config.white_player_id))
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-plus"></i> {_("Add to library")}
                    </a>
                </Tooltip>
            )}
            {/*
            {sgf_download_enabled && sgf_with_ai_review_url && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("SGF with AI Review")}>
                    <a href={sgf_with_ai_review_url} target="_blank">
                        <i className="fa fa-download"></i> {_("SGF with AI Review")}
                    </a>
                </Tooltip>
            )}
            */}
            {sgf_download_enabled && sgf_with_comments_url && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("SGF with comments")}>
                    <a href={sgf_with_comments_url} target="_blank">
                        <i className="fa fa-download"></i> {_("SGF with comments")}
                    </a>
                </Tooltip>
            )}
            {(user_can_intervene || user_can_annul) && <hr />}
            {user_can_intervene && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Black Wins")}>
                    <a onClick={decide_black}>
                        <i className="fa fa-gavel"></i> {_("Black Wins")}
                    </a>
                </Tooltip>
            )}
            {user_can_intervene && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("White Wins")}>
                    <a onClick={decide_white}>
                        <i className="fa fa-gavel"></i> {_("White Wins")}
                    </a>
                </Tooltip>
            )}
            {user_can_intervene && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Tie")}>
                    <a onClick={decide_tie}>
                        <i className="fa fa-gavel"></i> {_("Tie")}
                    </a>
                </Tooltip>
            )}
            {user_can_intervene && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Auto-score")}>
                    <a onClick={force_autoscore}>
                        <i className="fa fa-gavel"></i> {_("Auto-score")}
                    </a>
                </Tooltip>
            )}

            {user_can_annul && annulable && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Annul")}>
                    <a onClick={() => do_annul(true)}>
                        <i className="fa fa-gavel"></i> {_("Annul")}
                    </a>
                </Tooltip>
            )}
            {user_can_annul && unannulable && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Remove annulment"}>
                    <a onClick={() => do_annul(false)}>
                        <i className="fa fa-gavel unannulable"></i> {"Remove annulment"}
                    </a>
                </Tooltip>
            )}
            {
                user_can_annul && !annulable && !unannulable && (
                    <div>
                        <i className="fa fa-gavel greyed"></i> {_("Annul")}
                    </div>
                ) /* This is a "do nothing" icon for when the game is unranked */
            }

            {(user_can_intervene || user_can_annul || user_detects_ai) && <hr />}
            {(user_can_intervene || user_can_annul || user_detects_ai) && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Timing")}>
                    <a onClick={goban_controller.toggleShowTiming}>
                        <i className="fa fa-clock-o"></i> {_("Timing")}
                    </a>
                </Tooltip>
            )}
            {(user_can_intervene || user_can_annul || user_detects_ai) && ai_suspected && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Bot Detection Results")}>
                    <a onClick={goban_controller.toggleShowBotDetectionResults}>
                        <i className="fa fa-exclamation"></i> {_("Bot Detection Results")}
                    </a>
                </Tooltip>
            )}
            {(user_can_intervene || user_can_annul) && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Log"}>
                    <a onClick={showLogModal}>
                        <i className="fa fa-list-alt"></i> {"Log"}
                    </a>
                </Tooltip>
            )}
            {(user_can_intervene || user_can_annul) && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Move Metadata"}>
                    <a onClick={showMoveMetadataModal}>
                        <i className="fa fa-list"></i> {"Move Metadata"}
                    </a>
                </Tooltip>
            )}
            {(user_can_intervene || user_can_annul) && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Cloak of Invisibility"}>
                    <a onClick={toggleAnonymousModerator}>
                        <i className="fa fa-user-secret"></i> {"Cloak of Invisibility"}
                    </a>
                </Tooltip>
            )}

            {superuser_ai_review_ready && <hr />}
            {superuser_ai_review_ready && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Fast AI Review"}>
                    <a onClick={() => force_ai_review("fast")}>
                        <i className="fa fa-line-chart"></i> {"Fast AI Review"}
                    </a>
                </Tooltip>
            )}
            {superuser_ai_review_ready && (
                <Tooltip tooltipRequired={tooltipRequired} title={_("Full AI Review")}>
                    <a onClick={() => force_ai_review("full")}>
                        <i className="fa fa-area-chart"></i> {_("Full AI Review")}
                    </a>
                </Tooltip>
            )}
            {superuser_ai_review_ready && (
                <Tooltip tooltipRequired={tooltipRequired} title={"Delete AI reviews"}>
                    <a onClick={delete_ai_reviews}>
                        <i className="fa fa-trash"></i> {"Delete AI reviews"}
                    </a>
                </Tooltip>
            )}
        </Dock>
    );
}
