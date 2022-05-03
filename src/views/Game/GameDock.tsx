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
import * as data from "data";
import * as preferences from "preferences";
import { Goban, GoEnginePlayerEntry } from "goban";
import { api1, post, del } from "requests";
import { Dock } from "Dock";
import { Link } from "react-router-dom";
import { _, pgettext } from "translate";
import { openACLModal } from "ACLModal";
import { openGameLinkModal } from "./GameLinkModal";
import { openGameLogModal } from "./GameLogModal";
import { sfx } from "sfx";
import swal from "sweetalert2";
import { challengeFromBoardPosition } from "ChallengeModal";
import { errorAlerter, ignore } from "misc";
import { openReport } from "Report";
import { game_control } from "./game_control";
import { openGameInfoModal } from "./GameInfoModal";

interface DockProps {
    goban: Goban;
    annulled: boolean;
    review_id?: number;
    game_id?: number;
    selected_ai_review_uuid: number;
    tournament_id?: number;
    ladder_id?: number;
    ai_review_enabled: boolean;
    historical_black?: GoEnginePlayerEntry;
    historical_white?: GoEnginePlayerEntry;
    onZenClicked: () => void;
    onCoordinatesClicked: () => void;
    onAIReviewClicked: () => void;
    onAnalyzeClicked: () => void;
    onConditionalMovesClicked: () => void;
    onPauseClicked: () => void;
    onEstimateClicked: () => void;
    onGameAnnulled: (tf: boolean) => void;
    onTimingClicked: () => void;
    onCoordinatesMarked: (stones: string) => void;
    onReviewClicked: () => void;
}
export function GameDock({
    goban,
    annulled,
    review_id,
    game_id,
    selected_ai_review_uuid,
    tournament_id,
    ladder_id,
    historical_black,
    historical_white,
    onZenClicked,
    onCoordinatesClicked,
    ai_review_enabled,
    onAIReviewClicked,
    onAnalyzeClicked,
    onConditionalMovesClicked,
    onPauseClicked,
    onEstimateClicked,
    onGameAnnulled,
    onTimingClicked,
    onCoordinatesMarked,
    onReviewClicked,
}: DockProps): JSX.Element {
    const engine = goban.engine;
    const phase = engine.phase;

    const user = data.get("user");
    if (!user) {
        return <React.Fragment />;
    }
    let superuser_ai_review_ready = user.is_superuser && phase === "finished";
    let mod = user.is_moderator && phase !== "finished";
    let annul = user.is_moderator && phase === "finished";
    const annulable = !annulled && engine.config.ranked;
    const unannulable = annulled && engine.config.ranked;
    const user_is_player = engine.isParticipant(user.id);

    const review = !!review_id || null;
    const game = !!game_id || null;
    if (review) {
        superuser_ai_review_ready = false;
        mod = false;
        annul = false;
    }

    let sgf_download_enabled = false;
    try {
        sgf_download_enabled = phase === "finished" || !goban.isAnalysisDisabled(true);
    } catch (e) {
        // ignore error
    }

    let sgf_url = null;
    let sgf_with_comments_url = null;
    let sgf_with_ai_review_url = null;
    if (game_id) {
        sgf_url = api1(`games/${game_id}/sgf`);
        if (selected_ai_review_uuid) {
            sgf_with_ai_review_url = api1(
                `games/${game_id}/sgf?ai_review=${selected_ai_review_uuid}`,
            );
        }
    } else {
        sgf_url = api1(`reviews/${review_id}/sgf?without-comments=1`);
        sgf_with_comments_url = api1(`reviews/${review_id}/sgf`);
    }

    const openACL = () => {
        if (game_id) {
            openACLModal({ game_id: game_id });
        } else if (review_id) {
            openACLModal({ review_id: review_id });
        }
    };

    const fork = () => {
        if (!engine.rengo && (!goban.isAnalysisDisabled() || phase === "finished")) {
            challengeFromBoardPosition(goban);
        }
    };
    const showLinkModal = () => {
        openGameLinkModal(goban);
    };

    const showGameInfo = () => {
        for (const k of ["komi", "rules", "handicap", "rengo", "rengo_teams"] as const) {
            (goban.config as any)[k] = goban.engine.config[k];
        }
        openGameInfoModal(
            goban.config,
            historical_black || goban.engine.players.black,
            historical_white || goban.engine.players.white,
            annulled,
            game_control.creator_id || goban.review_owner_id || 0,
        );
    };

    const [volume, set_volume] = React.useState(sfx.getVolume("master"));
    const volume_sound_debounce = React.useRef<any>();

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
        const user = data.get("user");
        if (!user) {
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
            swal(
                _(
                    'Please report the player that is a problem by clicking on their name and selecting "Report".',
                ),
            )
                .then(() => 0)
                .catch(ignore);
        } else {
            openReport(obj);
        }
    };

    // Mod Functions
    const decide = (winner: string): void => {
        if (!game_id) {
            swal("Game ID missing", "You cannot make a decision without a game ID!").catch(
                swal.noop,
            );
            return;
        }

        let moderation_note = null;
        do {
            moderation_note = prompt("Deciding for " + winner.toUpperCase() + " - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/moderate", game_id, {
            decide: winner,
            moderation_note: moderation_note,
        }).catch(errorAlerter);
    };
    const decide_white = () => decide("white");
    const decide_black = () => decide("black");
    const decide_tie = () => decide("tie");
    const force_autoscore = () => {
        if (!game_id) {
            swal("Game ID missing", "You cannot autoscore without a game ID!").catch(swal.noop);
            return;
        }

        let moderation_note = null;
        do {
            moderation_note = prompt("Autoscoring game - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/moderate", game_id, {
            autoscore: true,
            moderation_note: moderation_note,
        }).catch(errorAlerter);
    };
    const do_annul = (tf: boolean): void => {
        if (!game_id) {
            swal("Game ID missing", "You cannot annul without a game ID!").catch(swal.noop);
            return;
        }

        let moderation_note = null;
        do {
            moderation_note = tf
                ? prompt(_("ANNULMENT - Moderator note:"))
                : prompt(_("Un-annulment - Moderator note:"));
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note
                .trim()
                .replace(/(black)\b/g, `player ${engine.players.black.id}`)
                .replace(/(white)\b/g, `player ${engine.players.white.id}`);
        } while (moderation_note === "");

        post("games/%%/annul", game_id, {
            annul: tf ? 1 : 0,
            moderation_note: moderation_note,
        })
            .then(() => {
                if (tf) {
                    swal({ text: _("Game has been annulled") }).catch(swal.noop);
                } else {
                    swal({ text: _("Game ranking has been restored") }).catch(swal.noop);
                }
                onGameAnnulled(tf);
            })
            .catch(errorAlerter);
    };
    const showLogModal = () => {
        openGameLogModal(
            goban.config,
            onCoordinatesMarked,
            historical_black || engine.players.black,
            historical_white || engine.players.white,
        );
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
        swal({
            text: _("Really clear ALL AI reviews for this game?"),
            showCancelButton: true,
        })
            .then(() => {
                console.info(`Clearing AI reviews for ${game_id}`);
                del(`games/${game_id}/ai_reviews`, {})
                    .then(() => console.info("AI Reviews cleared"))
                    .catch(errorAlerter);
            })
            .catch(ignore);
    };
    const force_ai_review = (analysis_type: "fast" | "full") => {
        post(`games/${game_id}/ai_reviews`, {
            engine: "katago",
            type: analysis_type,
        })
            .then(() => swal(_("Analysis started")))
            .catch(errorAlerter);
    };

    return (
        <Dock>
            {(tournament_id || null) && (
                <Link className="plain" to={`/tournament/${tournament_id}`}>
                    <i className="fa fa-trophy" title={_("This is a tournament game")} />{" "}
                    {_("Tournament")}
                </Link>
            )}
            {(ladder_id || null) && (
                <Link className="plain" to={`/ladder/${ladder_id}`}>
                    <i className="fa fa-trophy" title={_("This is a ladder game")} /> {_("Ladder")}
                </Link>
            )}
            {((engine.config as any)["private"] || null) && (
                <a onClick={openACL}>
                    <i className="fa fa-lock" />{" "}
                    {pgettext("Control who can access the game or review", "Access settings")}
                </a>
            )}

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

            <a onClick={onZenClicked}>
                <i className="ogs-zen-mode"></i> {_("Zen mode")}
            </a>
            <a onClick={onCoordinatesClicked}>
                <i className="ogs-coordinates"></i> {_("Toggle coordinates")}
            </a>
            {game && (
                <a onClick={onAIReviewClicked}>
                    <i className="fa fa-desktop"></i>{" "}
                    {ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}
                </a>
            )}
            <a onClick={showGameInfo}>
                <i className="fa fa-info"></i> {_("Game information")}
            </a>
            {game && (
                <a
                    onClick={onAnalyzeClicked}
                    className={phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""}
                >
                    <i className="fa fa-sitemap"></i> {_("Analyze game")}
                </a>
            )}
            {((!review_id && user_is_player && phase !== "finished") || null) && (
                <a
                    style={{
                        visibility:
                            goban.mode === "play" && engine.playerToMove() !== user.id
                                ? "visible"
                                : "hidden",
                    }}
                    className={
                        phase !== "finished" && (goban.isAnalysisDisabled() || engine.rengo)
                            ? "disabled"
                            : ""
                    }
                    onClick={onConditionalMovesClicked}
                >
                    <i className="fa fa-exchange"></i> {_("Plan conditional moves")}
                </a>
            )}
            {((!review_id && (user_is_player || mod) && phase !== "finished") || null) && (
                <a onClick={onPauseClicked}>
                    <i className="fa fa-pause"></i> {_("Pause game")}
                </a>
            )}
            {game && (
                <a
                    onClick={onReviewClicked}
                    className={phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""}
                >
                    <i className="fa fa-refresh"></i> {_("Review this game")}
                </a>
            )}
            <a
                onClick={onEstimateClicked}
                className={phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""}
            >
                <i className="fa fa-tachometer"></i> {_("Estimate score")}
            </a>
            <a onClick={fork} className={engine.rengo ? "disabled" : ""}>
                <i className="fa fa-code-fork"></i> {_("Fork game")}
            </a>
            <a onClick={alertModerator}>
                <i className="fa fa-exclamation-triangle"></i> {_("Call moderator")}
            </a>
            {((review && game_id) || null) && (
                <Link to={`/game/${game_id}`}>
                    <i className="ogs-goban" /> {_("Original game")}
                </Link>
            )}
            <a onClick={showLinkModal}>
                <i className="fa fa-share-alt"></i>{" "}
                {review ? _("Link to review") : _("Link to game")}
            </a>
            {sgf_download_enabled ? (
                <a href={sgf_url} target="_blank">
                    <i className="fa fa-download"></i> {_("Download SGF")}
                </a>
            ) : (
                <a
                    className="disabled"
                    onClick={() =>
                        swal(
                            _(
                                "SGF downloading for this game is disabled until the game is complete.",
                            ),
                        )
                    }
                >
                    <i className="fa fa-download"></i> {_("Download SGF")}
                </a>
            )}
            {sgf_download_enabled && sgf_with_ai_review_url && (
                <a href={sgf_with_ai_review_url} target="_blank">
                    <i className="fa fa-download"></i> {_("SGF with AI Review")}
                </a>
            )}
            {sgf_download_enabled && sgf_with_comments_url && (
                <a href={sgf_with_comments_url} target="_blank">
                    <i className="fa fa-download"></i> {_("SGF with comments")}
                </a>
            )}
            {(mod || annul) && <hr />}
            {mod && (
                <a onClick={decide_black}>
                    <i className="fa fa-gavel"></i> {_("Black Wins")}
                </a>
            )}
            {mod && (
                <a onClick={decide_white}>
                    <i className="fa fa-gavel"></i> {_("White Wins")}
                </a>
            )}
            {mod && (
                <a onClick={decide_tie}>
                    <i className="fa fa-gavel"></i> {_("Tie")}
                </a>
            )}
            {mod && (
                <a onClick={force_autoscore}>
                    <i className="fa fa-gavel"></i> {_("Auto-score")}
                </a>
            )}

            {
                annul && annulable && (
                    <a onClick={() => do_annul(true)}>
                        <i className="fa fa-gavel"></i> {_("Annul")}
                    </a>
                ) /* mod can annul this game */
            }
            {
                annul &&
                    unannulable && (
                        <a onClick={() => do_annul(false)}>
                            <i className="fa fa-gavel unannulable"></i> {"Remove annulment"}
                        </a>
                    ) /* mod can't annul, presumably because it's already annulled */
            }
            {
                annul && !annulable && !unannulable && (
                    <div>
                        <i className="fa fa-gavel greyed"></i> {_("Annul")}
                    </div>
                ) /* What is this case?! */
            }

            {(mod || annul) && <hr />}
            {(mod || annul) && (
                <a onClick={onTimingClicked}>
                    <i className="fa fa-clock-o"></i> {_("Timing")}
                </a>
            )}
            {(mod || annul) && (
                <a onClick={showLogModal}>
                    <i className="fa fa-list-alt"></i> {"Log"}
                </a>
            )}
            {(mod || annul) && (
                <a onClick={toggleAnonymousModerator}>
                    <i className="fa fa-user-secret"></i> {"Cloak of Invisibility"}
                </a>
            )}

            {superuser_ai_review_ready && <hr />}
            {superuser_ai_review_ready && (
                <a onClick={() => force_ai_review("fast")}>
                    <i className="fa fa-line-chart"></i> {"Fast AI Review"}
                </a>
            )}
            {superuser_ai_review_ready && (
                <a onClick={() => force_ai_review("full")}>
                    <i className="fa fa-area-chart"></i> {_("Full AI Review")}
                </a>
            )}
            {superuser_ai_review_ready && (
                <a onClick={delete_ai_reviews}>
                    <i className="fa fa-trash"></i> {"Delete AI reviews"}
                </a>
            )}
        </Dock>
    );
}
