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
import { browserHistory } from "@/lib/ogsHistory";
import { api1 } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { toast } from "@/lib/toast";
import { openReport } from "@/components/Report";
import { openSGFCollectionModal } from "@/components/SGFCollectionModal";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import { GobanViewTabProps } from "@/components/GobanView";
import { GobanEngine, GobanRenderer } from "goban";
import {
    useAnnulled,
    useCanAnswerUndoRequest,
    useCanRequestUndo,
    useMode,
    usePhase,
    useResignMode,
    useUndoRequestIsMine,
    useUserIsParticipant,
} from "./GameHooks";
import { useGobanController } from "./goban_context";
import { openGameLinkModal } from "./GameLinkModal";
import { cancelOrResignGame, openGameInfo, requestUndo } from "./game_actions";
import { UndoIcon } from "./UndoIcon";
import "./GameSidebarPanels.css";

const handleForkGameClick = (
    showModal: React.ContextType<typeof ModalContext>["showModal"],
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
    /** Action-bar tabs repeated at the top of the menu as labeled items, so
     *  someone still learning the icons can find the same actions by name.
     *  Each entry is the same props object the tab bar renders from. */
    action_tabs?: GobanViewTabProps[];
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
    action_tabs,
    onClose,
}: GameActionsPanelProps): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const phase = usePhase(goban);
    const mode = useMode(goban);
    const user = useUser();
    const { showModal } = React.useContext(ModalContext);

    const annulled = useAnnulled(goban_controller);

    // The same in-game actions the action bar offers, repeated here so the
    // menu is a complete list of what a player can do.
    const user_is_player = useUserIsParticipant(goban);
    const can_request_undo = useCanRequestUndo(goban);
    const undo_request_is_mine = useUndoRequestIsMine(goban);
    const can_answer_undo_request = useCanAnswerUndoRequest(goban);
    const resign_mode = useResignMode(goban);
    const show_play_actions = user_is_player && mode === "play" && phase === "play";

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

    // The panel is mounted in popover()'s standalone React root, which has
    // no Router context, so react-router's <Link> would throw. Plain
    // anchors keep open-in-new-tab semantics; plain left-clicks route
    // through the SPA history instead of a full page load.
    const navigateTo = (path: string) => (ev: React.MouseEvent<HTMLAnchorElement>) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) {
            onClose?.();
            return;
        }
        ev.preventDefault();
        onClose?.();
        browserHistory.push(path);
    };

    const showLinkModal = wrap(() => openGameLinkModal(goban));

    const showGameInfo = wrap(() =>
        openGameInfo(goban_controller, historical_black, historical_white, annulled),
    );

    const alertModerator = wrap(() => {
        if (!user || user.anonymous) {
            return;
        }
        const obj: {
            reported_game_id?: number;
            reported_review_id?: number;
            reported_user_id?: number;
        } = game_id ? { reported_game_id: game_id } : { reported_review_id: review_id };

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

    const onUndo = wrap(() =>
        undo_request_is_mine ? goban.cancelUndo() : requestUndo(goban, user.id),
    );
    const onAcceptUndo = wrap(() => goban.acceptUndo());
    const onRejectUndo = wrap(() => goban.cancelUndo());
    const onCancelOrResign = wrap(() => cancelOrResignGame(goban, resign_mode));

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
            {!!action_tabs?.length && (
                <>
                    {action_tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={
                                "GameSidebarPanel-item" +
                                (tab.active ? " active" : "") +
                                (tab.disabled ? " disabled" : "")
                            }
                            disabled={tab.disabled}
                            onClick={wrap(() => tab.onClick?.())}
                        >
                            {typeof tab.icon === "string" ? (
                                <i className={`fa fa-${tab.icon}`} />
                            ) : (
                                tab.icon
                            )}
                            <span>{tab.title}</span>
                        </button>
                    ))}
                    <hr />
                </>
            )}

            {!!tournament_id && (
                <a
                    className="GameSidebarPanel-item"
                    href={`/tournament/${tournament_id}`}
                    onClick={navigateTo(`/tournament/${tournament_id}`)}
                >
                    <i className="fa fa-trophy" />
                    <span>{tournament_name || _("Tournament")}</span>
                </a>
            )}
            {!!ladder_id && (
                <a
                    className="GameSidebarPanel-item"
                    href={`/ladder/${ladder_id}`}
                    onClick={navigateTo(`/ladder/${ladder_id}`)}
                >
                    <i className="fa fa-list-ol" />
                    <span>{_("Ladder")}</span>
                </a>
            )}

            {show_play_actions && (
                <>
                    <button
                        className={
                            "GameSidebarPanel-item" +
                            (!undo_request_is_mine && !can_request_undo ? " disabled" : "")
                        }
                        disabled={!undo_request_is_mine && !can_request_undo}
                        onClick={onUndo}
                    >
                        <UndoIcon badge="question" />
                        <span>
                            {undo_request_is_mine
                                ? pgettext("Withdraw your own undo request", "Cancel undo request")
                                : pgettext(
                                      "Ask the opponent to undo the last move",
                                      "Request undo",
                                  )}
                        </span>
                    </button>

                    {can_answer_undo_request && (
                        <button className="GameSidebarPanel-item" onClick={onAcceptUndo}>
                            <UndoIcon badge="check" />
                            <span>{_("Accept Undo")}</span>
                        </button>
                    )}

                    {can_answer_undo_request && (
                        <button className="GameSidebarPanel-item" onClick={onRejectUndo}>
                            <UndoIcon badge="times" />
                            <span>{_("Reject Undo")}</span>
                        </button>
                    )}

                    <button className="GameSidebarPanel-item" onClick={onCancelOrResign}>
                        <i className="fa fa-flag" />
                        <span>{resign_mode === "cancel" ? _("Cancel game") : _("Resign")}</span>
                    </button>

                    <hr />
                </>
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
                <a
                    className="GameSidebarPanel-item"
                    href={`/game/${game_id}`}
                    onClick={navigateTo(`/game/${game_id}`)}
                >
                    <i className="ogs-goban" />
                    <span>{_("Original game")}</span>
                </a>
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
