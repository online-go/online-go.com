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
import { useParams, useLocation, useSearchParams } from "react-router-dom";

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { usePreference } from "@/lib/preferences";
import { _, interpolate, pgettext } from "@/lib/translate";
import { popover, PopOver } from "@/lib/popover";
import { get, abort_requests_in_flight } from "@/lib/requests";
import { UIPush } from "@/components/UIPush";
import { GobanRendererConfig, JGOFNumericPlayerColor, LabelPosition } from "goban";
import { isLiveGame } from "@/components/TimeControl";
import { setExtraActionCallback, PlayerDetails } from "@/components/Player";
import * as player_cache from "@/lib/player_cache";
import { notification_manager } from "@/components/Notifications";
import { GameChat } from "./GameChat";
import { goban_view_mode, user_color } from "./util";
import { PlayerCard, PlayerCards } from "./PlayerCards";
import { PlayControls, ReviewControls } from "./PlayControls";
import { alert } from "@/lib/swal_config";
import {
    useCanRequestUndo,
    useMode,
    usePauseControl,
    usePhase,
    useScorePopup,
    useUndoRequestIsMine,
    useUserIsLivePlayerToMove,
    useUserIsParticipant,
    useViewMode,
    useZenMode,
} from "./GameHooks";
import { requestUndo } from "./game_actions";
import { UndoIcon } from "./UndoIcon";
import {
    GobanControllerContext,
    GobanView,
    GobanViewRef,
    GobanViewTabProps,
} from "@/components/GobanView";
import { ModalContext } from "@/components/ModalProvider";
import { useUser } from "@/lib/hooks";
import { MODERATOR_POWERS } from "@/lib/moderation";
import { is_valid_url } from "@/lib/url_validation";
import { BotDetectionResults } from "./BotDetectionResults";
import { ActiveTournament } from "@/lib/types";
import { GobanController } from "@/lib/GobanController";
import { FragAIReview, GameInformation, GameKeyboardShortcuts, RengoHeader } from "./fragments";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { GameThemeSettingsPanel } from "./GameThemeSettingsPanel";
import { GameActionsPanel } from "./GameActionsPanel";
import { GameModToolsPanel } from "./GameModToolsPanel";
import { GameModeratorAreaPanel } from "./GameModeratorAreaPanel";
import { GameStateHeader } from "./GameStateHeader";
import { toast } from "@/lib/toast";
import { ignore } from "@/lib/misc";
import { updateAntiGriefGameState } from "./AntiGrief";
import "./Game.css";
import "./Players.css";
import "./MoveTree.css";

export function Game(): React.ReactElement | null {
    const params = useParams<"game_id" | "review_id" | "move_number">();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const game_id = params.game_id ? parseInt(params.game_id) : 0;
    const review_id = params.review_id ? parseInt(params.review_id) : 0;

    /* Return url state */
    const return_param = searchParams.get("return");
    const return_url = return_param && is_valid_url(return_param) ? return_param : null;
    const return_url_debounce = React.useRef<boolean>(false);

    /* Refs */
    const ref_move_tree_container = React.useRef<HTMLElement | undefined>(undefined);
    const ladder_id = React.useRef<number | undefined>(undefined);
    const tournament_id = React.useRef<number | undefined>(undefined);
    const goban_div = React.useRef<HTMLDivElement | undefined>(undefined);
    const resize_debounce = React.useRef<any | undefined>(undefined);
    const on_refocus_title = React.useRef<string>("OGS");
    const last_move_viewed = React.useRef<number>(0);
    const white_username = React.useRef<string>("White");
    const black_username = React.useRef<string>("Black");
    const goban_controller = React.useRef<GobanController | null>(null);
    const last_phase = React.useRef<string>("");
    const page_loaded_time = React.useRef<number>(Date.now()); // when we first created this view
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    let goban = goban_controller.current?.goban ?? null;

    /* State */
    const [estimating_score, _set_estimating_score] = React.useState<boolean>(false);
    const estimating_score_ref = React.useRef(estimating_score);
    const [historical_black, set_historical_black] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [historical_white, set_historical_white] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [black_flags, set_black_flags] = React.useState<null | rest_api.GamePlayerFlags>(null);
    const [white_flags, set_white_flags] = React.useState<null | rest_api.GamePlayerFlags>(null);
    const [annulment_reason, set_annulment_reason] =
        React.useState<rest_api.AnnulmentReason | null>(null);
    const [scroll_to_navigate] = React.useState(preferences.get("scroll-to-navigate"));
    const phase = usePhase(goban);
    const [show_game_timing, set_show_game_timing] = React.useState(false);
    const [tournament, set_tournament] = React.useState<ActiveTournament>();
    const [, set_undo_requested] = React.useState<number | undefined>();
    const [bot_detection_results, set_bot_detection_results] = React.useState<any>(null);
    const [show_bot_detection_results, set_show_bot_detection_results] = React.useState(false);
    const [simul_black, set_simul_black] = React.useState<boolean | null>(null);
    const [simul_white, set_simul_white] = React.useState<boolean | null>(null);
    const zen_mode = useZenMode(goban_controller.current);
    // Score-details popup for the mobile player cards (the desktop
    // layout's PlayerCards wrapper manages its own instance).
    const { show_score_breakdown, toggleScorePopup } = useScorePopup(goban);
    const user = useUser();
    const user_is_player = useUserIsParticipant(goban);
    const mode = useMode(goban);
    const user_is_live_player_to_move = useUserIsLivePlayerToMove(goban);
    const can_request_undo = useCanRequestUndo(goban);
    const undo_request_is_mine = useUndoRequestIsMine(goban);
    const pause_control = usePauseControl(goban);
    const modal_context = React.useContext(ModalContext);
    const more_actions_popover_ref = React.useRef<PopOver | null>(null);
    const settings_popover_ref = React.useRef<PopOver | null>(null);
    const goban_view_ref = React.useRef<GobanViewRef>(null);
    const [moderator_tab_visible, set_moderator_tab_visible] = usePreference(
        "moderator.game-moderator-tab-visible",
    );
    // Mobile (portrait) gets a dedicated, non-configurable layout: the
    // player cards straddle the board, chat hidden behind a toggle in the
    // action bar.
    const view_mode = useViewMode(goban_controller.current);
    const is_mobile = view_mode === "portrait";
    // Two-level chat gating:
    //   • `chat_enabled` (preference, Settings toggle, default true) —
    //     master switch for the chat feature. When false, no chat
    //     renders anywhere and the mobile action-bar tab is hidden.
    //   • `mobile_chat_visible` (local state, default false) — session-
    //     level show/hide for the mobile chat. Toggled via the mobile
    //     action-bar tab. Has no effect when `chat_enabled` is false or
    //     on desktop (chat is always visible there if the feature is on).
    const [chat_enabled] = usePreference("game.chat-enabled");
    const [mobile_chat_visible, set_mobile_chat_visible] = React.useState(false);
    // Whether the Themes & Visuals takeover is showing. Synced from the
    // takeover tab's onToggle (the authoritative open/close signal), and
    // used to light up the settings gear while it's open.
    const [theme_settings_open, set_theme_settings_open] = React.useState(false);
    // Bumped when the goban must be rebuilt from scratch (switching
    // between the SVG and canvas renderers); the constructor effect below
    // lists it as a dependency.
    const [goban_generation, bump_goban_generation] = React.useReducer((x: number) => x + 1, 0);
    // Unread marker for the mobile chat tab: the chat is hidden by default
    // there, so without this a message from the opponent would arrive
    // invisibly. Set on chat lines that arrive after page load (the
    // initial backlog replayed on connect carries older timestamps) from
    // someone other than the user; cleared when the chat is opened.
    const [chat_unread, set_chat_unread] = React.useState(false);
    React.useEffect(() => {
        const chat_goban = goban;
        if (!chat_goban || !is_mobile || !chat_enabled || mobile_chat_visible) {
            set_chat_unread(false);
            return undefined;
        }
        const onChat = (line: { player_id?: number; date?: number }) => {
            if (line.player_id === user.id) {
                return;
            }
            if (line.date && line.date * 1000 < page_loaded_time.current) {
                return;
            }
            set_chat_unread(true);
        };
        chat_goban.on("chat", onChat);
        return () => {
            chat_goban.off("chat", onChat);
        };
    }, [goban, is_mobile, chat_enabled, mobile_chat_visible, user.id]);

    // Entering zen mode while a takeover (e.g. Settings) is open leaves the
    // user stuck: the tab bar that would normally toggle the takeover off
    // is hidden by zen styling, so the only way out is Esc — which exits
    // zen instead of the takeover. Close any active takeover when zen
    // activates so the in-zen view stays clean.
    React.useEffect(() => {
        if (zen_mode) {
            goban_view_ref.current?.setActiveTakeover(null);
        }
    }, [zen_mode]);

    // The mobile chat renders at the bottom of the scroll area, usually well
    // below the fold, so toggling it on would otherwise appear to do
    // nothing. Bring it into view when it appears.
    React.useEffect(() => {
        if (!is_mobile || !mobile_chat_visible || !chat_enabled) {
            return undefined;
        }
        const raf = requestAnimationFrame(() => {
            goban_view_ref.current
                ?.getRootElement()
                ?.querySelector(".GameChat")
                ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        return () => cancelAnimationFrame(raf);
    }, [is_mobile, mobile_chat_visible, chat_enabled]);

    // popover() appends its container + backdrop to document.body, outside
    // the React tree, so they survive Game unmounting. Close any open
    // popovers on unmount to keep them from leaking as orphaned nodes.
    React.useEffect(() => {
        return () => {
            more_actions_popover_ref.current?.close();
            settings_popover_ref.current?.close();
        };
    }, []);

    /* Functions */
    const getLocation = (): string => {
        return location.pathname;
    };

    function set_estimating_score(value: boolean) {
        estimating_score_ref.current = value;
        _set_estimating_score(value);
    }

    const auto_advance = () => {
        const user = data.get("user");

        if (!user.anonymous && /^\/game\//.test(getLocation())) {
            /* if we just moved */
            if (goban?.engine && goban.engine.playerNotToMove() === user.id) {
                const engine = goban.engine;
                if (
                    !isLiveGame(engine.time_control, engine.width, engine.height) &&
                    preferences.get("auto-advance-after-submit")
                ) {
                    if (notification_manager.anyYourMove()) {
                        notification_manager.advanceToNextBoard();
                    }
                }
            }
        }
    };

    const applyReviewFallback = React.useCallback((title: string) => {
        if (window.location.pathname.startsWith("/review/")) {
            return _("Review");
        }
        if (window.location.pathname.startsWith("/demo/")) {
            return _("Demo");
        }
        return title || _("OGS");
    }, []);

    const setTabTitle = React.useCallback(
        (title: string) => {
            const finalTitle = applyReviewFallback(title);
            window.document.title = finalTitle;
            on_refocus_title.current = finalTitle;
        },
        [applyReviewFallback],
    );

    const onFocus = () => {
        if (goban?.engine) {
            last_move_viewed.current = goban.engine.getMoveNumber();
        }
        window.document.title = on_refocus_title.current;
    };

    /* Keep goban_controller.view_mode in sync on viewport changes for any
     * downstream consumer that still subscribes via useViewMode. GobanView
     * tracks its own layout independently. */
    React.useEffect(() => {
        const onResize = () => {
            const controller = goban_controller.current;
            if (!controller) {
                return;
            }
            const new_mode = goban_view_mode();
            if (new_mode !== controller.view_mode) {
                controller.setViewMode(new_mode);
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    React.useEffect(() => {
        if (!goban_controller.current) {
            return;
        }
        const controller = goban_controller.current;

        controller.on("show_game_timing", set_show_game_timing);
        controller.on("show_bot_detection_results", set_show_bot_detection_results);
        controller.on("estimating_score", set_estimating_score);

        return () => {
            controller.off("show_game_timing", set_show_game_timing);
            controller.off("show_bot_detection_results", set_show_bot_detection_results);
            controller.off("estimating_score", set_estimating_score);
        };
    }, [goban_controller.current, set_show_game_timing, set_show_bot_detection_results]);

    const onWheel: React.WheelEventHandler<HTMLDivElement> = React.useCallback(
        (event) => {
            if (!scroll_to_navigate) {
                return;
            }

            if (event.deltaY > 0) {
                goban_controller.current?.nextMove();
            } else if (event.deltaY < 0) {
                goban_controller.current?.previousMove();
            }
        },
        [scroll_to_navigate],
    );

    /* Constructor */
    React.useEffect(() => {
        goban_div.current = document.createElement("div");
        goban_div.current.className = "Goban";

        set_estimating_score(false);
        set_historical_black(null);
        set_historical_white(null);
        set_black_flags(null);
        set_white_flags(null);

        window.addEventListener("focus", onFocus);

        /*** initialize ***/
        const label_position = preferences.get("label-positioning");
        const opts: GobanRendererConfig = {
            board_div: goban_div.current,
            move_tree_container: ref_move_tree_container.current,
            interactive: true,
            connect_to_chat: true,
            isInPushedAnalysis: () => goban_controller.current?.in_pushed_analysis ?? false,
            leavePushedAnalysis: () => {
                if (goban_controller.current?.onPushAnalysisLeft) {
                    goban_controller.current.onPushAnalysisLeft();
                }
            },
            game_id: undefined,
            review_id: undefined,
            draw_top_labels: label_position === "all" || label_position.indexOf("top") >= 0,
            draw_left_labels: label_position === "all" || label_position.indexOf("left") >= 0,
            draw_right_labels: label_position === "all" || label_position.indexOf("right") >= 0,
            draw_bottom_labels: label_position === "all" || label_position.indexOf("bottom") >= 0,
            variation_stone_opacity: preferences.get("variation-stone-opacity"),
            stone_font_scale: preferences.get("stone-font-scale"),
            onScoreEstimationUpdated: () => {
                goban_controller.current?.goban?.redraw(true);
            },
        };

        if (game_id) {
            opts.game_id = game_id;
        }
        if (review_id) {
            opts.review_id = review_id;
            opts.isPlayerOwner = () =>
                goban_controller.current?.goban?.review_owner_id === data.get("user").id;
            opts.isPlayerController = () =>
                goban_controller.current?.goban?.review_controller_id === data.get("user").id;
        }
        if (review_id) {
            setTabTitle("");
        }

        goban_controller.current?.destroy();
        goban_controller.current = new GobanController(opts);
        goban = goban_controller.current.goban;
        window.global_goban = goban;
        forceUpdate();

        // Update AntiGrief state with the new goban
        updateAntiGriefGameState(goban);

        goban_controller.current.last_variation_number = 0;
        goban_controller.current.on("branch_copied", (copied_node) => {
            if (copied_node) {
                toast(<div>{_("Branch copied")}</div>);
            }
        });
        const setLabelHandler = goban_controller.current.setLabelHandler;
        document.addEventListener("keypress", setLabelHandler);

        // Seed goban_controller.view_mode now that the controller exists.
        goban_controller.current.setViewMode(goban_view_mode());
        if (review_id) {
            goban.setMode("analyze");
        }

        goban.on("gamedata", () => {
            const user = data.get("user");
            try {
                if (
                    user.is_moderator &&
                    (user.id in (goban!.engine.player_pool || {}) ||
                        user.id === goban!.engine.config.white_player_id ||
                        user.id === goban!.engine.config.black_player_id)
                ) {
                    const channel = `game-${game_id}`;
                    if (!data.get(`moderator.join-game-publicly.${channel}`)) {
                        data.set(`moderator.join-game-publicly.${channel}`, true);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });

        if (preferences.get("dynamic-title")) {
            const last_title = window.document.title;
            last_move_viewed.current = 0;
            on_refocus_title.current = last_title;
            goban.on("state_text", (state) => {
                const title = applyReviewFallback(state.title);

                on_refocus_title.current = title;
                if (state.show_moves_made_count) {
                    if (!goban) {
                        window.document.title = title;
                        return;
                    }
                    if (document.hasFocus()) {
                        last_move_viewed.current = goban!.engine.getMoveNumber();
                        window.document.title = title;
                    } else {
                        const diff = goban!.engine.getMoveNumber() - last_move_viewed.current;
                        if (diff > 0) {
                            window.document.title = interpolate(_("(%s) moves made"), [diff]);
                        }
                    }
                } else {
                    window.document.title = title;
                }
            });
        }

        goban.on("submitting-move", () => {
            // clear any pending "your move" notifications
            notification_manager.clearTimecopNotification(game_id);
        });

        /* Ensure our state is kept up to date */
        const onLoad = () => {
            const engine = goban!.engine;
            set_undo_requested(engine.undo_requested);

            // Update AntiGrief state when game data loads
            updateAntiGriefGameState(goban);
        };

        goban.on("phase", (phase) => {
            if (phase !== "stone removal") {
                goban!.engine.cur_move.clearMarks();
            }
            // Update AntiGrief state when phase changes
            updateAntiGriefGameState(goban);
        });
        goban.on("undo_requested", set_undo_requested);
        goban.on("load", onLoad);
        onLoad();

        goban.on("move-made", auto_advance);

        goban.on("played-by-click", (event) => {
            const target = ref_move_tree_container.current?.getBoundingClientRect();
            if (target) {
                popover({
                    elt: <PlayerDetails playerId={event.player_id} />,
                    at: { x: event.x + target.x, y: event.y + target.y },
                    minWidth: 240,
                    minHeight: 250,
                });
            }
        });

        /* Handle ?move_number=10 query parameter */
        if (params.move_number) {
            goban.once(review_id ? "review.load-end" : "gamedata", () => {
                goban_controller.current?.gotoMove(parseInt(params.move_number as string));
            });
        }

        if (review_id) {
            let stashed_move_string: string | null = null;
            let stashed_review_id: number | null = null;
            /* If we lose connection, save our place when we reconnect so we can jump to it. */
            goban.on("review.load-start", () => {
                if (!goban) {
                    return;
                }

                if (goban.review_controller_id !== data.get("user").id) {
                    return;
                }

                stashed_review_id = goban.review_id;
                stashed_move_string = goban.engine.cur_move.getMoveStringToThisPoint();
                if (stashed_move_string.length === 0) {
                    stashed_review_id = null;
                    stashed_move_string = null;
                }
            });
            goban.on("review.load-end", () => {
                if (goban?.review_controller_id !== data.get("user").id) {
                    return;
                }

                if (stashed_move_string && stashed_review_id === goban.review_id) {
                    const prev_last_review_message = goban.getLastReviewMessage();
                    const moves = goban.decodeMoves(stashed_move_string);

                    goban.engine.jumpTo(goban.engine.move_tree);
                    for (const move of moves) {
                        if (move.edited) {
                            goban.engine.editPlace(
                                move.x,
                                move.y,
                                move.color as JGOFNumericPlayerColor,
                                false,
                            );
                        } else {
                            goban.engine.place(move.x, move.y, false, false, true, false, false);
                        }
                    }
                    /* This is designed to kinda work around race conditions
                     * where we start sending out review moves before we have
                     * authenticated */
                    setTimeout(() => {
                        goban?.setLastReviewMessage(prev_last_review_message);
                        goban?.syncReviewMove();
                    }, 100);
                }
            });
        }

        // negative (temporary) games only exist in Cassandra and are loaded via WebSocket
        if (game_id && game_id > 0) {
            get(`games/${game_id}`)
                .then((game: rest_api.GameDetails) => {
                    if (game.players.white.id) {
                        player_cache.update(game.players.white, true);
                        white_username.current = game.players.white.username;
                    }
                    if (game.players.black.id) {
                        player_cache.update(game.players.black, true);
                        black_username.current = game.players.black.username;
                    }
                    if (
                        white_username.current &&
                        black_username.current &&
                        !preferences.get("dynamic-title")
                    ) {
                        setTabTitle(black_username.current + " vs " + white_username.current);
                    }
                    if (goban_controller.current) {
                        goban_controller.current.creator_id = game.creator;
                        goban_controller.current.setAnnulled(game.annulled);
                    }
                    ladder_id.current = game.ladder;
                    tournament_id.current = game.tournament ?? undefined;

                    if (game.tournament) {
                        get(`tournaments/${game.tournament}`)
                            .then((t: ActiveTournament) => {
                                console.log(t);
                                set_tournament(t);
                            })
                            .catch((e) => {
                                console.warn(`Could not get tournament information`);
                                console.warn(e.name, e);
                            });
                    }

                    set_annulment_reason(game.annulment_reason);
                    set_historical_black(game.historical_ratings.black);
                    set_historical_white(game.historical_ratings.white);
                    set_bot_detection_results(game.bot_detection_results);
                    set_simul_black(game.simul_black ?? null);
                    set_simul_white(game.simul_white ?? null);

                    goban_div.current?.setAttribute("data-game-id", game_id.toString());

                    if (game.flags) {
                        if (game.players.black.id && game.players.black.id in game.flags) {
                            set_black_flags(game.flags[game.players.black.id]);
                        }
                        if (game.players.white.id && game.players.white.id in game.flags) {
                            set_white_flags(game.flags[game.players.white.id]);
                        }
                    }

                    // folk think auto-zen-mode makes no sense for correspondence...
                    if (game.source === "sgf") {
                        if (!game.time_control_parameters) {
                            game.time_control_parameters = "0";
                        }
                    }

                    const live =
                        game.time_control_parameters &&
                        isLiveGame(
                            JSON.parse(game.time_control_parameters),
                            game.width,
                            game.height,
                        );

                    if (!live) {
                        goban_controller.current?.setZenMode(false);
                    }

                    if (ladder_id.current) {
                        goban_div.current?.setAttribute(
                            "data-ladder-id",
                            ladder_id.current.toString(),
                        );
                    } else {
                        goban_div.current?.removeAttribute("data-ladder-id");
                    }
                    if (tournament_id.current) {
                        goban_div.current?.setAttribute(
                            "data-tournament-id",
                            tournament_id.current.toString(),
                        );
                    } else {
                        goban_div.current?.removeAttribute("data-tournament-id");
                    }
                })
                .catch((e) => {
                    if (e.name === "AbortError") {
                        //console.error("Error: abort", e);
                        return;
                    }
                    if (e.status === 404 || e.statusText === "Not Found") {
                        console.error("Error: not found, handled 10s later by socket.ts", e);
                        return;
                    }
                    console.error(e.name, e);
                    void alert.fire({
                        title: "Failed to load game data: " + e.statusText,
                        icon: "error",
                    });
                });
        }
        if (game_id < 0) {
            // Temporary game - data will load via WebSocket
            console.log(
                `[${game_id}] Temporary game detected - skipping Django API, loading via WebSocket only`,
            );
        }

        if (review_id) {
            get(`reviews/${review_id}`)
                .then((review) => {
                    if (review.game && review.game.historical_ratings) {
                        set_historical_black(review.game.historical_ratings.black);
                        set_historical_white(review.game.historical_ratings.white);
                    }
                })
                .catch(ignore);
        }

        return () => {
            if (game_id) {
                abort_requests_in_flight(`games/${game_id}`);
            }
            if (review_id) {
                abort_requests_in_flight(`reviews/${review_id}`);
            }
            console.log("unmounting, going to destroy", goban);
            ladder_id.current = undefined;
            tournament_id.current = undefined;
            document.removeEventListener("keypress", setLabelHandler);
            try {
                goban_controller.current?.destroy();
            } catch (e) {
                console.error(e);
            }
            goban_controller.current = null;
            goban = null;
            if (resize_debounce.current) {
                clearTimeout(resize_debounce.current);
                resize_debounce.current = null;
            }

            window.Game = null;
            window.global_goban = null;

            // Clear AntiGrief state when unmounting
            updateAntiGriefGameState(null);

            setExtraActionCallback(null as any);
            window.removeEventListener("focus", onFocus);
            window.document.title = "OGS";
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class

            goban_div.current?.childNodes.forEach((node) => node.remove());
        };
    }, [game_id, review_id, goban_generation]);

    // Keep the live goban in sync with visual preferences set from the
    // Themes & Visuals panel that the goban's own theme watcher doesn't
    // cover: values it caches or reads imperatively need an explicit poke,
    // and switching renderers needs a full rebuild (goban_generation).
    React.useEffect(() => {
        const current_goban = () => goban_controller.current?.goban;

        // Covers values cached at construction (variation move numbers,
        // stone font scale) and values read live at draw time (fuzzy
        // placement, undo request indicator, A1/1-1 labeling).
        const refresh = () => current_goban()?.refreshVisualPreferences();
        const refresh_keys = [
            "fuzzy-stone-placement",
            "visual-undo-request-indicator",
            "board-labeling",
            "show-variation-move-numbers",
            "stone-font-scale",
        ] as const;

        const onVariationStoneOpacity = (v: number) => {
            const g = current_goban();
            if (g) {
                g.variation_stone_opacity = v;
                g.redraw(true);
            }
        };
        const onLastMoveOpacity = (v: number) => {
            const g = current_goban();
            if (g) {
                g.setLastMoveOpacity(v);
                g.redraw(true);
            }
        };
        const onLabelPosition = (v: LabelPosition) => current_goban()?.setLabelPosition(v);
        // useData() re-emits its key with an unchanged value whenever a
        // component using it mounts (e.g. opening the Settings popover),
        // so only rebuild when the renderer selection actually changed.
        let last_renderer = data.get("experiments.canvas");
        const onRendererChange = (v?: string) => {
            if (v !== last_renderer) {
                last_renderer = v;
                bump_goban_generation();
            }
        };

        for (const key of refresh_keys) {
            preferences.watch(key, refresh, false, true);
        }
        preferences.watch("variation-stone-opacity", onVariationStoneOpacity, false, true);
        preferences.watch("last-move-opacity", onLastMoveOpacity, false, true);
        preferences.watch("label-positioning", onLabelPosition, false, true);
        data.watch("experiments.canvas", onRendererChange, false, true);
        return () => {
            for (const key of refresh_keys) {
                preferences.unwatch(key, refresh);
            }
            preferences.unwatch("variation-stone-opacity", onVariationStoneOpacity);
            preferences.unwatch("last-move-opacity", onLastMoveOpacity);
            preferences.unwatch("label-positioning", onLabelPosition);
            data.unwatch("experiments.canvas", onRendererChange);
        };
    }, []);

    /* Handle return urls */
    React.useEffect(() => {
        const elapsed = Date.now() - page_loaded_time.current;
        if (
            last_phase.current &&
            last_phase.current !== phase && // only trigger as we transition to finished
            phase === "finished" &&
            elapsed > 2000 // on first load there will always be a play->finished transition, so ignore that
        ) {
            console.log(last_phase.current, " -> ", phase);
            if (return_url && !return_url_debounce.current) {
                return_url_debounce.current = true;
                console.log("Transition from ", phase, " to ", phase);
                setTimeout(() => {
                    if (
                        confirm(
                            interpolate(_("Would you like to return to {{url}}?"), {
                                url: return_url,
                            }),
                        )
                    ) {
                        window.location.href = return_url;
                    }
                }, 1500);
            }
        }
        last_phase.current = phase as string;
    }, [phase, return_url]);

    /**********/
    /* RENDER */
    /**********/

    if (goban === null || goban_controller.current === null) {
        return null;
    }

    const review = !!review_id;
    const game = !!game_id;

    const ai_suspected = (bot_detection_results?.ai_suspected?.length ?? 0) > 0;
    const user_detects_ai = ((user?.moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0;
    // Superusers only get content in the gavel tab once the game is finished
    // (GameModToolsPanel's AI-review tools); gate the tab the same way so a
    // non-moderator superuser doesn't see an empty panel on live games.
    const show_mod_tab =
        !review &&
        (!!user?.is_moderator || user_detects_ai || (!!user?.is_superuser && phase === "finished"));

    const analysis_disabled = goban.isAnalysisDisabled();
    const is_analyzing = mode === "analyze";

    // Undo applies only while the user is actually playing a game that is
    // still in progress.
    const show_play_action_tabs = user_is_player && mode === "play" && phase === "play";

    // Toggle behavior: if the mode is already on, clicking exits back to play.
    // Reading the live `mode`/`estimating_score` for the `active` prop also
    // means anything else that exits the mode (Escape key, navigation,
    // estimator finishing, etc.) flips the button off automatically.
    const onAnalyzeClick = () => {
        const controller = goban_controller.current;
        if (!controller) {
            return;
        }
        if (is_analyzing) {
            controller.goban.setMode("play");
        } else {
            controller.gameAnalyze();
        }
    };

    // The analyze / chat / review / conditional tabs are defined once here
    // and rendered twice: as icons in the action bar and as labeled items at
    // the top of the More-actions menu.
    const analyze_tab: GobanViewTabProps | null = game
        ? {
              id: "game-analyze",
              type: "action",
              align: "left",
              icon: "sitemap",
              title: _("Analyze game"),
              disabled: analysis_disabled,
              active: is_analyzing,
              onClick: onAnalyzeClick,
          }
        : null;

    // "Review this game" is for spectators reviewing a live game and for
    // anyone (including the players) once it's finished — never for an
    // active player mid-game.
    const show_review_tab =
        game && !analysis_disabled && !user.anonymous && (phase === "finished" || !user_is_player);

    // "Plan conditional moves" is for an active player on a live game while
    // it's the opponent's turn — non-rengo, non-review. The tab stays
    // visible across analyze / score-estimation / conditional modes (same
    // UX shape as the Analyze tab) so clicking it always switches *into*
    // the planner; clicking it again while in the planner exits to play.
    //
    // useUserIsLivePlayerToMove treats a staged (not yet submitted) stone in
    // submit-move / double-click mode as still the user's turn, so the tab
    // hides until the move is submitted — entering the planner would
    // silently discard the staged move. It derives a boolean so this
    // component doesn't re-render on every move navigation event.
    const is_planning_conditional = mode === "conditional";
    const show_conditional_tab =
        !review &&
        user_is_player &&
        phase !== "finished" &&
        !goban.engine.rengo &&
        (is_planning_conditional || !user_is_live_player_to_move);
    const onConditionalClick = () => {
        const controller = goban_controller.current;
        if (!controller) {
            return;
        }
        if (is_planning_conditional) {
            controller.goban.setMode("play");
        } else {
            controller.enterConditionalMovePlanner();
        }
    };

    // Mobile-only chat toggle. The tab itself is hidden when the chat
    // feature is disabled in Settings (chat_enabled false) — re-enable from
    // Settings to bring it back. Otherwise it toggles the chat's session
    // visibility.
    const chat_tab: GobanViewTabProps | null =
        is_mobile && chat_enabled
            ? {
                  id: "game-chat-toggle",
                  type: "action",
                  align: "left",
                  icon: (
                      <span className="game-chat-tab-icon">
                          <i className="fa fa-comment" />
                          {chat_unread && <span className="game-chat-unread-dot" />}
                      </span>
                  ),
                  title: _("Chat"),
                  active: mobile_chat_visible,
                  onClick: () => set_mobile_chat_visible((v) => !v),
              }
            : null;

    const review_tab: GobanViewTabProps | null = show_review_tab
        ? {
              id: "game-review",
              type: "action",
              align: "center",
              icon: "refresh",
              title: _("Review this game"),
              onClick: goban_controller.current.startReview,
          }
        : null;

    const conditional_tab: GobanViewTabProps | null = show_conditional_tab
        ? {
              id: "game-conditional",
              type: "action",
              align: "center",
              icon: "exchange",
              title: _("Plan conditional moves"),
              disabled: analysis_disabled,
              active: is_planning_conditional,
              onClick: onConditionalClick,
          }
        : null;

    const menu_action_tabs = [analyze_tab, chat_tab, review_tab, conditional_tab].filter(
        (tab): tab is GobanViewTabProps => tab !== null,
    );

    const CONTROLS = review ? (
        <ReviewControls review_id={review_id} />
    ) : (
        <PlayControls annulment_reason={annulment_reason} />
    );

    const openSettings = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (!event || !goban_controller.current) {
            return;
        }
        const controller = goban_controller.current;
        const close = () => {
            settings_popover_ref.current?.close();
            settings_popover_ref.current = null;
        };
        const button = event.currentTarget;
        const instance = popover({
            elt: (
                <GobanControllerContext.Provider value={controller}>
                    <ModalContext.Provider value={modal_context}>
                        <div className="GamePopover GameSettingsPopover">
                            <GameSettingsPanel
                                onClose={close}
                                compact={is_mobile}
                                onShowThemeSettings={() =>
                                    goban_view_ref.current?.setActiveTakeover("game-theme-settings")
                                }
                            />
                        </div>
                    </ModalContext.Provider>
                </GobanControllerContext.Provider>
            ),
            below: button,
            // Wide enough for the 7-column board theme grid (7 * 38px swatch
            // + padding) plus the white / black stone rows. The popover
            // library will flip above the button when there's no room below.
            minWidth: 320,
        });
        instance.on("close", () => {
            if (settings_popover_ref.current === instance) {
                settings_popover_ref.current = null;
            }
        });
        settings_popover_ref.current = instance;
    };

    const openMoreActions = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (!event || !goban_controller.current) {
            return;
        }
        const controller = goban_controller.current;
        const close = () => {
            more_actions_popover_ref.current?.close();
            more_actions_popover_ref.current = null;
        };
        // popover() spins up a fresh React root, so the providers from the
        // main tree (goban controller, modal manager) don't reach the panel.
        // Re-establish them inline.
        const button = event.currentTarget;
        const instance = popover({
            elt: (
                <GobanControllerContext.Provider value={controller}>
                    <ModalContext.Provider value={modal_context}>
                        <div className="GamePopover GameMoreActionsPopover">
                            <GameActionsPanel
                                tournament_id={tournament_id.current}
                                tournament_name={tournament?.name}
                                ladder_id={ladder_id.current}
                                historical_black={historical_black}
                                historical_white={historical_white}
                                action_tabs={menu_action_tabs}
                                onClose={close}
                            />
                        </div>
                    </ModalContext.Provider>
                </GobanControllerContext.Provider>
            ),
            below: button,
            minWidth: 220,
        });
        instance.on("close", () => {
            if (more_actions_popover_ref.current === instance) {
                more_actions_popover_ref.current = null;
            }
        });
        more_actions_popover_ref.current = instance;
    };

    (window as any)["goban_controller"] = goban_controller.current;

    const renderPlayerCard = (color: "black" | "white") => (
        <PlayerCard
            color={color}
            goban={goban!}
            historical={color === "black" ? historical_black : historical_white}
            estimating_score={estimating_score}
            show_score_breakdown={show_score_breakdown}
            onScoreClick={toggleScorePopup}
            zen_mode={zen_mode}
        />
    );

    /* Mobile straddles the board with the two cards: the opponent above it
     * and the user below it, so each player sits on the side of the board
     * they face. Spectators, reviews and game records have no "user"
     * colour, so they fall back to black above and white below. */
    const bottom_color = user_color(goban!, user.id) ?? "white";
    const top_color: "black" | "white" = bottom_color === "black" ? "white" : "black";
    const renderMobilePlayerCard = (color: "black" | "white") => (
        <div className="GameMobilePlayers">
            <div className="player-icons">{renderPlayerCard(color)}</div>
        </div>
    );

    return (
        <GobanView
            ref={goban_view_ref}
            controller={goban_controller.current}
            className={
                "Game MainGobanView" +
                (is_mobile ? " mobile" : "") +
                /* Mobile reserves room under the board stage for the play
                 * buttons at the top of PlayControls, so the board shrinks
                 * to keep them on screen along with both player cards. */
                (is_mobile && show_play_action_tabs ? " has-play-buttons" : "") +
                (zen_mode ? " zen" : "")
            }
            onWheel={onWheel}
            header={<GameStateHeader />}
            aboveBoard={is_mobile && renderMobilePlayerCard(top_color)}
            belowBoard={is_mobile && renderMobilePlayerCard(bottom_color)}
            /* On mobile the move slider only earns its row while analyzing;
             * during play it is dropped to leave the board and the controls
             * more room. */
            hideSlider={is_mobile && !is_analyzing}
        >
            {game_id > 0 && (
                <UIPush
                    event="review-added"
                    channel={`game-${game_id}`}
                    action={goban_controller.current.addReview}
                />
            )}
            <GameKeyboardShortcuts />

            <GobanView.Tab id="game-main" type="always">
                {/* Mobile renders the two player cards in GobanView's
                    aboveBoard / belowBoard slots, not here. */}
                {!is_mobile && (
                    <PlayerCards
                        historical_black={historical_black}
                        historical_white={historical_white}
                        estimating_score={estimating_score}
                    />
                )}
                {!is_mobile && <GameInformation />}
                <RengoHeader />

                {!zen_mode && (
                    <FragAIReview
                        simul_black={simul_black}
                        simul_white={simul_white}
                        showGameTimings={show_game_timing}
                    />
                )}

                {show_bot_detection_results && ai_suspected && (
                    <>
                        {(simul_black || simul_white) && (
                            <div className="simul-warning">
                                {pgettext(
                                    "A label that means the game is played at the same time as another game",
                                    "Simul",
                                )}{" "}
                                {simul_black && simul_white
                                    ? pgettext(
                                          "Both players played simultaneous games",
                                          "(both players)",
                                      )
                                    : simul_black
                                      ? pgettext("Black played simultaneous games", "(black)")
                                      : pgettext("White played simultaneous games", "(white)")}
                            </div>
                        )}
                        <BotDetectionResults
                            bot_detection_results={bot_detection_results}
                            game_id={game_id}
                            updateBotDetectionResults={set_bot_detection_results}
                        />
                    </>
                )}

                {CONTROLS}

                {!zen_mode && chat_enabled && (!is_mobile || mobile_chat_visible) && (
                    <GameChat
                        channel={game_id ? `game-${game_id}` : `review-${review_id}`}
                        game_id={game_id}
                        review_id={review_id}
                    />
                )}
            </GobanView.Tab>

            {/* Left: settings + the two analysis tools that used to live in
             *  the More-actions takeover. Move navigation comes from
             *  GobanView's built-in MoveNumberControl above the tab bar. */}
            <GobanView.Tab
                id="game-settings"
                type="action"
                align="left"
                icon="gear"
                title={_("Settings")}
                active={theme_settings_open}
                onClick={(event) => {
                    if (theme_settings_open) {
                        goban_view_ref.current?.setActiveTakeover(null);
                    } else {
                        openSettings(event);
                    }
                }}
            />

            {/* Full Themes & Visuals settings, opened from the Settings
             *  popover's "More options" item. Hidden from the tab bar —
             *  the gear icon doubles as its lit-up toggle, and the panel
             *  has a Done button, so it needs no close button. */}
            <GobanView.Tab
                id="game-theme-settings"
                type="takeover"
                hideFromBar
                hideCloseButton
                title={_("Themes & Visuals")}
                onToggle={set_theme_settings_open}
            >
                <GameThemeSettingsPanel
                    onClose={() => goban_view_ref.current?.setActiveTakeover(null)}
                />
            </GobanView.Tab>

            {analyze_tab && <GobanView.Tab {...analyze_tab} />}

            {chat_tab && <GobanView.Tab {...chat_tab} />}

            {/* Center: contextual single-purpose actions. Review here is
             *  for spectators or once the game is finished. */}
            {review_tab && <GobanView.Tab {...review_tab} />}

            {conditional_tab && <GobanView.Tab {...conditional_tab} />}

            {/* Ask the opponent to take back the last move. The button stays
             *  lit while your own request is pending, and pressing it again
             *  withdraws that request. It greys out when an undo can't be
             *  asked for right now (rengo, the opening move, the opponent's
             *  request pending, a staged move). */}
            {show_play_action_tabs && (
                <GobanView.Tab
                    id="game-undo"
                    type="action"
                    align="center"
                    icon={<UndoIcon badge="question" />}
                    title={
                        undo_request_is_mine
                            ? pgettext("Withdraw your own undo request", "Cancel undo request")
                            : pgettext("Ask the opponent to undo the last move", "Request undo")
                    }
                    active={undo_request_is_mine}
                    disabled={!undo_request_is_mine && !can_request_undo}
                    onClick={() =>
                        undo_request_is_mine ? goban!.cancelUndo() : requestUndo(goban!, user.id)
                    }
                />
            )}

            {/* Pause / resume the game clock. Rendered only for users
             *  allowed to change the pause state right now (participants
             *  in vacation-eligible games, moderators — see
             *  usePauseControl). */}
            {pause_control.action !== null && (
                <GobanView.Tab
                    id="game-pause"
                    type="action"
                    align="center"
                    icon={pause_control.paused ? "play" : "pause"}
                    title={pause_control.paused ? _("Resume game") : _("Pause game")}
                    onClick={pause_control.togglePause}
                />
            )}

            {/* Right group, in source order (visually left → right):
             *  1. Moderator toggle (gavel) — per-player controls + decide /
             *     annul / inspect / AI-review tools. Sticky between
             *     reloads via the `moderator.game-moderator-tab-visible`
             *     preference, gated on user role.
             *  2. More actions (ellipsis) — popover with the
             *     non-moderator game actions. */}
            {show_mod_tab && (
                <GobanView.Tab
                    id="game-moderator"
                    type="toggle"
                    align="right"
                    icon="gavel"
                    title={_("Moderator")}
                    defaultVisible={moderator_tab_visible}
                    onToggle={set_moderator_tab_visible}
                >
                    <GameModeratorAreaPanel
                        historical_black={historical_black}
                        historical_white={historical_white}
                        black_flags={black_flags}
                        white_flags={white_flags}
                        bot_detection_results={bot_detection_results}
                    />
                    <GameModToolsPanel
                        historical_black={historical_black}
                        historical_white={historical_white}
                        ai_suspected={ai_suspected}
                    />
                </GobanView.Tab>
            )}
            <GobanView.Tab
                id="game-actions"
                type="action"
                align="right"
                icon="ellipsis-h"
                title={_("More actions")}
                onClick={openMoreActions}
            />
        </GobanView>
    );
}
