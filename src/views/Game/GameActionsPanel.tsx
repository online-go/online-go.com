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
import { Link } from "react-router-dom";
import { _ } from "@/lib/translate";
import { api1 } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { toast } from "@/lib/toast";
import { openReport } from "@/components/Report";
import { openSGFCollectionModal } from "@/components/SGFCollectionModal";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import { GobanEngine, GobanRenderer } from "goban";
import { usePhase } from "./GameHooks";
import { useGobanController } from "./goban_context";
import { openGameInfoModal } from "./GameInfoModal";
import { openGameLinkModal } from "./GameLinkModal";
import "./GameSidebarPanels.css";

const handleForkGameClick = (
    showModal: (type: ModalTypes, props?: any) => void,
    user: rest_api.UserConfig,
    engine: GobanEngine,
    goban: GobanRenderer,
) => {
    if (!user.anonymous && !engine.rengo && !goban.isAnalysisDisabled()) {
        showModal(ModalTypes.Fork, { goban });
    }
};

interface GameActionsPanelProps {
    tournament_id?: number;
    tournament_name?: string;
    ladder_id?: number;
    historical_black: rest_api.games.Player | null;
    historical_white: rest_api.games.Player | null;
    /** When the panel is presented as a popover, GobanView's container click
     *  handler doesn't reach into our content (target check is on the
     *  container element only), so each interactive item dismisses itself by
     *  invoking this callback after firing its action. */
    onClose?: () => void;
}

export function GameActionsPanel({
    tournament_id,
    tournament_name,
    ladder_id,
    historical_black,
    historical_white,
    onClose,
}: GameActionsPanelProps): React.ReactElement {
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
    const game = !!game_id;

    let sgf_download_enabled = false;
    try {
        sgf_download_enabled = !goban.isAnalysisDisabled(true);
    } catch {
        // ignore error
    }

    const sgf_url = review_id
        ? api1(`reviews/${review_id}/sgf?without-comments=1`)
        : api1(`games/${game_id}/sgf`);
    const sgf_with_comments_url: string | null = review_id
        ? api1(`reviews/${review_id}/sgf`)
        : null;

    // Wrap a handler so the popover dismisses after the action fires. Pure
    // navigation links are handled inline with onClick={onClose}.
    const wrap = (fn: () => void) => () => {
        fn();
        onClose?.();
    };

    const showLinkModal = wrap(() => openGameLinkModal(goban));

    const showGameInfo = wrap(() => {
        const ec = goban.engine.config;
        Object.assign(goban.config, {
            komi: ec.komi,
            rules: ec.rules,
            handicap: ec.handicap,
            handicap_rank_difference: ec.handicap_rank_difference,
            rengo: ec.rengo,
            rengo_teams: ec.rengo_teams,
            disable_vacation: ec.disable_vacation,
        });
        openGameInfoModal(
            goban.config,
            historical_black || goban.engine.players.black,
            historical_white || goban.engine.players.white,
            annulled,
            goban_controller.creator_id || goban.review_owner_id || 0,
        );
    });

    const alertModerator = wrap(() => {
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
    });

    const addSGFToLibrary = wrap(() => {
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
    });

    const onFork = wrap(() => handleForkGameClick(showModal, user, engine, goban));
    const onEstimateScore = wrap(goban_controller.estimateScore);

    const sgf_disabled =
        !sgf_download_enabled ||
        (phase !== "finished" &&
            (user.anonymous ||
                user.id === engine.config.black_player_id ||
                user.id === engine.config.white_player_id));

    const add_to_library_disabled =
        user.anonymous ||
        (phase !== "finished" &&
            (user.id === engine.config.black_player_id ||
                user.id === engine.config.white_player_id));

    return (
        <div className="GameSidebarPanel GameActionsPanel">
            {!!tournament_id && (
                <Link
                    className="GameSidebarPanel-item"
                    to={`/tournament/${tournament_id}`}
                    onClick={onClose}
                >
                    <i className="fa fa-trophy" />
                    <span>{tournament_name || _("Tournament")}</span>
                </Link>
            )}
            {!!ladder_id && (
                <Link
                    className="GameSidebarPanel-item"
                    to={`/ladder/${ladder_id}`}
                    onClick={onClose}
                >
                    <i className="fa fa-list-ol" />
                    <span>{_("Ladder")}</span>
                </Link>
            )}

            <button className="GameSidebarPanel-item" onClick={showGameInfo}>
                <i className="fa fa-info" />
                <span>{_("Game information")}</span>
            </button>

            <button
                className={
                    "GameSidebarPanel-item" + (goban.isAnalysisDisabled() ? " disabled" : "")
                }
                disabled={goban.isAnalysisDisabled()}
                onClick={onEstimateScore}
            >
                <i className="fa fa-tachometer" />
                <span>{_("Estimate score")}</span>
            </button>

            <button
                className={
                    "GameSidebarPanel-item" +
                    (user.anonymous || engine.rengo || goban.isAnalysisDisabled()
                        ? " disabled"
                        : "")
                }
                disabled={user.anonymous || engine.rengo || goban.isAnalysisDisabled()}
                onClick={onFork}
            >
                <i className="fa fa-code-fork" />
                <span>{_("Fork game")}</span>
            </button>

            <button
                className={"GameSidebarPanel-item" + (user.anonymous ? " disabled" : "")}
                disabled={user.anonymous}
                onClick={alertModerator}
            >
                <i className="fa fa-exclamation-triangle" />
                <span>{_("Call moderator")}</span>
            </button>

            {review && !!game_id && (
                <Link className="GameSidebarPanel-item" to={`/game/${game_id}`} onClick={onClose}>
                    <i className="ogs-goban" />
                    <span>{_("Original game")}</span>
                </Link>
            )}

            <button className="GameSidebarPanel-item" onClick={showLinkModal}>
                <i className="fa fa-share-alt" />
                <span>{review ? _("Link to review") : _("Link to game")}</span>
            </button>

            <a
                className={"GameSidebarPanel-item" + (sgf_disabled ? " disabled" : "")}
                href={sgf_url}
                target="_blank"
                onClick={(ev) => {
                    if (sgf_disabled) {
                        ev.preventDefault();
                        return;
                    }
                    onClose?.();
                }}
                rel="noreferrer"
            >
                <i className="fa fa-download" />
                <span>{_("Download SGF")}</span>
            </a>

            {sgf_download_enabled && game && (
                <button
                    className={
                        "GameSidebarPanel-item" + (add_to_library_disabled ? " disabled" : "")
                    }
                    disabled={add_to_library_disabled}
                    onClick={addSGFToLibrary}
                >
                    <i className="fa fa-plus" />
                    <span>{_("Add to library")}</span>
                </button>
            )}

            {sgf_download_enabled && sgf_with_comments_url && (
                <a
                    className="GameSidebarPanel-item"
                    href={sgf_with_comments_url}
                    target="_blank"
                    onClick={onClose}
                    rel="noreferrer"
                >
                    <i className="fa fa-download" />
                    <span>{_("SGF with comments")}</span>
                </a>
            )}
        </div>
    );
}
