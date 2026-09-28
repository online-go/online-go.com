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
import { api1 } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { toast } from "@/lib/toast";
import { MODERATOR_POWERS } from "@/lib/moderation";
import { GobanController } from "@/lib/GobanController";
import { openReport } from "@/components/Report";
import { openSGFCollectionModal } from "@/components/SGFCollectionModal";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import {
    useAnnulled,
    useCanAnswerUndoRequest,
    useCanRequestUndo,
    useCurrentMoveNumber,
    useMode,
    usePauseControl,
    usePhase,
    useResignMode,
    useUndoRequestIsMine,
    useUserIsLivePlayerToMove,
    useUserIsParticipant,
} from "./GameHooks";
import { openGameLinkModal } from "./GameLinkModal";
import { cancelOrResignGame, openGameInfo, requestUndo } from "./game_actions";
import { UndoIcon } from "./UndoIcon";
import { GameAction } from "./GameAction";

export interface GameActionsArgs {
    controller: GobanController | null;
    is_mobile: boolean;
    historical_black: rest_api.games.Player | null;
    historical_white: rest_api.games.Player | null;
    tournament_id?: number;
    tournament_name?: string;
    ladder_id?: number;
    estimating_score: boolean;
    settings: { open: boolean; onClick: (event?: React.MouseEvent<HTMLElement>) => void };
    chat: { enabled: boolean; visible: boolean; unread: boolean; toggle: () => void };
    moderator: { visible: boolean; onToggle: (visible: boolean) => void };
}

export function canSeeModeratorTab(
    user: rest_api.UserConfig,
    review: boolean,
    phase: string,
): boolean {
    const detects_ai = ((user?.moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0;
    // Superusers only get content in the gavel tab once the game is finished
    // (GameModToolsPanel's AI-review tools).
    return (
        !review &&
        (!!user?.is_moderator || detects_ai || (!!user?.is_superuser && phase === "finished"))
    );
}

/**
 * The game page's actions, defined once. The tab bar, the "..." menu, the
 * dock and the mobile list all render from this; each sorts by its own
 * order field (`bar.order`, `menuOrder`, `dockOrder`), so the order of this
 * array does not matter. See docs/goban-view-layout.md.
 */
export function useGameActions(args: GameActionsArgs): GameAction[] {
    const { controller, is_mobile, historical_black, historical_white } = args;
    const goban = controller?.goban ?? null;
    const user = useUser();
    const phase = usePhase(goban);
    const mode = useMode(goban);
    const user_is_player = useUserIsParticipant(goban);
    const user_is_live_player_to_move = useUserIsLivePlayerToMove(goban);
    const cur_move_number = useCurrentMoveNumber(goban);
    const pause_control = usePauseControl(goban);
    const annulled = useAnnulled(controller);
    const can_request_undo = useCanRequestUndo(goban);
    const undo_request_is_mine = useUndoRequestIsMine(goban);
    const can_answer_undo_request = useCanAnswerUndoRequest(goban, controller);
    const resign_mode = useResignMode(goban);
    const { showModal } = React.useContext(ModalContext);

    if (!controller || !goban) {
        return [];
    }

    const engine = goban.engine;
    const review_id: number | undefined = goban.config.review_id;
    const game_id: number | undefined = Number(goban.config.game_id);
    const review = !!review_id;
    // A review of a real game also carries its game_id, so the actions that
    // belong to the game page only check `game && !review`.
    const game = !!game_id;
    const analysis_disabled = goban.isAnalysisDisabled();

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

    const alertModerator = () => {
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

    const fork_disabled = user.anonymous || engine.rengo || analysis_disabled;
    const onFork = () => {
        if (!fork_disabled) {
            showModal(ModalTypes.Fork, { goban });
        }
    };

    const actions: GameAction[] = [];

    if (args.tournament_id) {
        actions.push({
            id: "game-tournament",
            icon: "trophy",
            label: args.tournament_name || _("Tournament"),
            bar: null,
            menuOrder: 100,
            dockOrder: 10,
            kind: "link",
            href: `/tournament/${args.tournament_id}`,
        });
    }
    if (args.ladder_id) {
        actions.push({
            id: "game-ladder",
            icon: "list-ol",
            label: _("Ladder"),
            bar: null,
            menuOrder: 110,
            dockOrder: 20,
            kind: "link",
            href: `/ladder/${args.ladder_id}`,
        });
    }

    // Only in the dock and the mobile list. The "..." menu does not have it.
    actions.push({
        id: "game-zen",
        icon: <i className="ogs-zen-mode" />,
        label: _("Zen mode"),
        bar: null,
        dockOrder: 40,
        kind: "action",
        onClick: controller.toggleZenMode,
    });

    // The in-game player actions, in their own group in the menu so it is
    // a complete list of what a player can do. Only the undo request is
    // also in the dock and the list; the play buttons already offer the
    // others.
    if (user_is_player && mode === "play" && phase === "play") {
        actions.push({
            id: "game-undo",
            icon: <UndoIcon badge="question" />,
            label: undo_request_is_mine
                ? pgettext("Withdraw your own undo request", "Cancel undo request")
                : pgettext("Ask the opponent to undo the last move", "Request undo"),
            bar: null,
            menuOrder: 200,
            menuSection: "play",
            dockOrder: 190,
            kind: "action",
            disabled: !undo_request_is_mine && !can_request_undo,
            onClick: () =>
                undo_request_is_mine ? goban.cancelUndo() : requestUndo(goban, user.id),
        });
        if (can_answer_undo_request) {
            actions.push({
                id: "game-accept-undo",
                icon: <UndoIcon badge="check" />,
                label: _("Accept Undo"),
                bar: null,
                menuOrder: 210,
                menuSection: "play",
                kind: "action",
                onClick: () => goban.acceptUndo(),
            });
            actions.push({
                id: "game-reject-undo",
                icon: <UndoIcon badge="times" />,
                label: _("Reject Undo"),
                bar: null,
                menuOrder: 220,
                menuSection: "play",
                kind: "action",
                onClick: () => goban.cancelUndo(),
            });
        }
        actions.push({
            id: "game-resign",
            icon: "flag",
            label: resign_mode === "cancel" ? _("Cancel game") : _("Resign"),
            bar: null,
            menuOrder: 230,
            menuSection: "play",
            kind: "action",
            onClick: () => cancelOrResignGame(goban, resign_mode),
        });
    }

    actions.push({
        id: "game-settings",
        icon: "gear",
        label: _("Settings"),
        bar: { align: "left", order: 10 },
        // Last in the dock and the mobile list.
        dockOrder: 230,
        kind: "action",
        active: args.settings.open,
        onClick: args.settings.onClick,
    });

    actions.push({
        id: "game-info",
        icon: "info",
        label: _("Game information"),
        bar: { align: "right", order: 20, priority: 1 },
        menuOrder: 300,
        dockOrder: 60,
        kind: "action",
        onClick: () => openGameInfo(controller, historical_black, historical_white, annulled),
    });

    // On a cramped mobile screen the move slider is hidden during play, so
    // with analysis disabled the greyed-out analyze button would leave no
    // way to look at earlier moves. Swap it for a "Previous move" button
    // that steps back and thereby brings up the slider. Desktop keeps the
    // disabled analyze button since its slider is always visible.
    if (game && !review) {
        if (is_mobile && analysis_disabled) {
            actions.push({
                id: "game-step-back",
                icon: "step-backward",
                label: pgettext("Move navigation: previous move", "Previous move"),
                bar: { align: "left", order: 20 },
                menuOrder: 10,
                menuSection: "tabs",
                kind: "action",
                disabled: cur_move_number <= 0,
                onClick: () => controller.previousMove(),
            });
        } else {
            const is_analyzing = mode === "analyze";
            actions.push({
                id: "game-analyze",
                icon: "sitemap",
                label: _("Analyze game"),
                bar: { align: "left", order: 20 },
                menuOrder: 10,
                menuSection: "tabs",
                dockOrder: 70,
                kind: "action",
                disabled: analysis_disabled,
                active: is_analyzing,
                onClick: () => {
                    if (is_analyzing) {
                        goban.setMode("play");
                    } else {
                        controller.gameAnalyze();
                    }
                },
            });
        }
    }

    // "Plan conditional moves" belongs to an active player on a non-rengo,
    // non-review game that isn't finished. It stays visible across analyze /
    // score-estimation / conditional modes so clicking it always switches
    // into the planner; clicking it again while in the planner exits to
    // play.
    //
    // The dock and the mobile list show this row, disabled, for that whole
    // span. The tab bar and the "..." menu show it only while
    // `conditional_moves_usable` is true (see `GameAction.bar`).
    //
    // useUserIsLivePlayerToMove follows the official branch, so walking
    // through the game in analyze mode does not toggle it, and a staged (not
    // yet submitted) stone still counts as the user's turn: entering the
    // planner would silently discard the staged move.
    const is_planning_conditional = mode === "conditional";
    const conditional_moves_usable = is_planning_conditional || !user_is_live_player_to_move;
    if (!review && user_is_player && phase !== "finished" && !engine.rengo) {
        actions.push({
            id: "game-conditional",
            icon: "exchange",
            label: _("Plan conditional moves"),
            bar: conditional_moves_usable ? { align: "center", order: 20 } : null,
            menuOrder: conditional_moves_usable ? 40 : undefined,
            menuSection: "tabs",
            dockOrder: 80,
            kind: "action",
            disabled: analysis_disabled || !conditional_moves_usable,
            active: is_planning_conditional,
            onClick: () => {
                if (is_planning_conditional) {
                    goban.setMode("play");
                } else {
                    controller.enterConditionalMovePlanner();
                }
            },
        });
    }

    // Only for users allowed to change the pause state right now
    // (participants in vacation-eligible games, moderators; see
    // usePauseControl).
    if (pause_control.action !== null) {
        actions.push({
            id: "game-pause",
            icon: pause_control.action === "resume" ? "play" : "pause",
            label: pause_control.action === "resume" ? _("Resume game") : _("Pause game"),
            bar: null,
            menuOrder: 50,
            menuSection: "tabs",
            dockOrder: 90,
            kind: "action",
            onClick: pause_control.togglePause,
        });
    }

    // "Review this game" is listed in the dock and mobile list on every
    // game page (`game && !review`), disabled until it's usable: analysis
    // must be on, the user must be signed in, and — while the game is still
    // in progress — the user must not be a player (spectators can review a
    // live game; players can only review once it's finished).
    // `review_usable` below is that narrower condition, which gates the tab
    // bar and the "..." menu (see `GameAction.bar`).
    const review_usable =
        !analysis_disabled && !user.anonymous && (phase === "finished" || !user_is_player);
    if (game && !review) {
        actions.push({
            id: "game-review",
            icon: "search-plus",
            label: _("Review this game"),
            bar: review_usable ? { align: "center", order: 10 } : null,
            menuOrder: review_usable ? 30 : undefined,
            menuSection: "tabs",
            dockOrder: 100,
            kind: "action",
            disabled: !review_usable,
            onClick: controller.startReview,
        });
    }

    actions.push({
        id: "game-estimate-score",
        icon: "tachometer",
        label: _("Estimate score"),
        bar: { align: "left", order: 30, priority: 3 },
        menuOrder: 310,
        dockOrder: 110,
        kind: "action",
        disabled: analysis_disabled,
        active: args.estimating_score,
        onClick: () => {
            if (args.estimating_score) {
                controller.stopEstimatingScore();
            } else {
                controller.estimateScore();
            }
        },
    });

    actions.push({
        id: "game-fork",
        icon: "code-fork",
        label: _("Fork game"),
        bar: null,
        menuOrder: 320,
        dockOrder: 120,
        kind: "action",
        disabled: fork_disabled,
        onClick: onFork,
    });

    actions.push({
        id: "game-call-moderator",
        icon: "exclamation-triangle",
        label: _("Call moderator"),
        bar: null,
        menuOrder: 330,
        dockOrder: 130,
        kind: "action",
        disabled: user.anonymous,
        onClick: alertModerator,
    });

    if (review && game_id) {
        actions.push({
            id: "game-original",
            icon: <i className="ogs-goban" />,
            label: _("Original game"),
            bar: null,
            menuOrder: 340,
            dockOrder: 140,
            kind: "link",
            href: `/game/${game_id}`,
        });
    }

    actions.push({
        id: "game-link",
        icon: "share-alt",
        label: review ? _("Link to review") : _("Link to game"),
        bar: { align: "right", order: 10, priority: 2 },
        menuOrder: 350,
        dockOrder: 150,
        kind: "action",
        onClick: () => openGameLinkModal(goban),
    });

    actions.push({
        id: "game-download-sgf",
        icon: "download",
        label: _("Download SGF"),
        bar: null,
        menuOrder: 360,
        dockOrder: 160,
        kind: "link",
        href: sgf_url,
        external: true,
        disabled: sgf_disabled,
    });

    if (sgf_download_enabled && game) {
        actions.push({
            id: "game-add-to-library",
            icon: "plus",
            label: _("Add to library"),
            bar: null,
            menuOrder: 370,
            dockOrder: 170,
            kind: "action",
            disabled: add_to_library_disabled,
            onClick: addSGFToLibrary,
        });
    }

    if (sgf_download_enabled && sgf_with_comments_url) {
        actions.push({
            id: "game-sgf-comments",
            icon: "download",
            label: _("SGF with comments"),
            bar: null,
            menuOrder: 380,
            dockOrder: 180,
            kind: "link",
            href: sgf_with_comments_url,
            external: true,
        });
    }

    // Mobile-only chat toggle. It is hidden when the chat feature is
    // disabled in Settings; otherwise it toggles the chat's remembered
    // visibility.
    if (is_mobile && args.chat.enabled) {
        actions.push({
            id: "game-chat-toggle",
            icon: (
                <span className="game-chat-tab-icon">
                    <i className="fa fa-comment" />
                    {args.chat.unread && <span className="game-chat-unread-dot" />}
                </span>
            ),
            label: _("Chat"),
            bar: { align: "left", order: 40 },
            menuOrder: 20,
            menuSection: "tabs",
            kind: "action",
            active: args.chat.visible,
            onClick: args.chat.toggle,
        });
    }

    if (canSeeModeratorTab(user, review, phase ?? "")) {
        actions.push({
            id: "game-moderator",
            icon: "gavel",
            label: _("Moderator"),
            bar: { align: "right", order: 30 },
            dockOrder: 220,
            kind: "toggle",
            defaultVisible: args.moderator.visible,
            onToggle: args.moderator.onToggle,
        });
    }

    return actions;
}
