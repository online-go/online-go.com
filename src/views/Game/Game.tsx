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
import { _, interpolate, pgettext } from "@/lib/translate";
import { popover, PopOver } from "@/lib/popover";
import { get, abort_requests_in_flight } from "@/lib/requests";
import { UIPush } from "@/components/UIPush";
import { GobanRendererConfig, JGOFNumericPlayerColor } from "goban";
import { isLiveGame } from "@/components/TimeControl";
import { setExtraActionCallback, PlayerDetails } from "@/components/Player";
import * as player_cache from "@/lib/player_cache";
import { notification_manager } from "@/components/Notifications";
import { GameChat } from "./GameChat";
import { goban_view_mode } from "./util";
import { PlayerCards } from "./PlayerCards";
import { PlayControls, ReviewControls } from "./PlayControls";
import { alert } from "@/lib/swal_config";
import { useMode, usePhase, useUserIsParticipant, useZenMode } from "./GameHooks";
import { GobanControllerContext, GobanView } from "@/components/GobanView";
import { ModalContext } from "@/components/ModalProvider";
import { useUser } from "@/lib/hooks";
import { MODERATOR_POWERS } from "@/lib/moderation";
import { is_valid_url } from "@/lib/url_validation";
import { BotDetectionResults } from "./BotDetectionResults";
import { ActiveTournament } from "@/lib/types";
import { GobanController } from "@/lib/GobanController";
import { FragAIReview, GameInformation, GameKeyboardShortcuts, RengoHeader } from "./fragments";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { GameActionsPanel } from "./GameActionsPanel";
import { GameModToolsPanel } from "./GameModToolsPanel";
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
    const user = useUser();
    const user_is_player = useUserIsParticipant(goban);
    const mode = useMode(goban);
    const modal_context = React.useContext(ModalContext);
    const more_actions_popover_ref = React.useRef<PopOver | null>(null);

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
                console.error(e.stack);
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
    }, [game_id, review_id]);

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
    const show_mod_tab =
        !review && (!!user?.is_moderator || !!user?.is_superuser || user_detects_ai);

    const analysis_disabled = goban.isAnalysisDisabled();
    const is_analyzing = mode === "analyze";

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

    // "Review this game" is for spectators reviewing a live game and for
    // anyone (including the players) once it's finished — never for an
    // active player mid-game.
    const show_review_tab =
        game && !analysis_disabled && !user.anonymous && (phase === "finished" || !user_is_player);

    const CONTROLS = review ? (
        <ReviewControls review_id={review_id} />
    ) : (
        <PlayControls annulment_reason={annulment_reason} />
    );

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
                        <div className="GameMoreActionsPopover">
                            <GameActionsPanel
                                tournament_id={tournament_id.current}
                                tournament_name={tournament?.name}
                                ladder_id={ladder_id.current}
                                historical_black={historical_black}
                                historical_white={historical_white}
                                onClose={close}
                            />
                            {show_mod_tab && (
                                <GameModToolsPanel
                                    historical_black={historical_black}
                                    historical_white={historical_white}
                                    ai_suspected={ai_suspected}
                                    onClose={close}
                                />
                            )}
                        </div>
                    </ModalContext.Provider>
                </GobanControllerContext.Provider>
            ),
            below: button,
            minWidth: 220,
        });
        // The popover utility anchors the LEFT edge of the popover to the
        // button. The More-actions button lives at the right edge of the
        // tab bar, and (especially in the two-column moderator layout) the
        // popover would extend off-screen to the right. Re-anchor the RIGHT
        // edge to the button's right edge so the popover grows leftward.
        const button_rect = button.getBoundingClientRect();
        const offset_from_right = Math.max(0, window.innerWidth - button_rect.right);
        instance.container.style.left = "auto";
        instance.container.style.right = `${offset_from_right}px`;
        instance.on("close", () => {
            if (more_actions_popover_ref.current === instance) {
                more_actions_popover_ref.current = null;
            }
        });
        more_actions_popover_ref.current = instance;
    };

    (window as any)["goban_controller"] = goban_controller.current;

    return (
        <GobanView
            controller={goban_controller.current}
            className="Game MainGobanView"
            onWheel={onWheel}
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
                <PlayerCards
                    historical_black={historical_black}
                    historical_white={historical_white}
                    estimating_score={estimating_score}
                    black_flags={black_flags}
                    white_flags={white_flags}
                    black_ai_suspected={bot_detection_results?.ai_suspected.includes(
                        historical_black?.id,
                    )}
                    white_ai_suspected={bot_detection_results?.ai_suspected.includes(
                        historical_white?.id,
                    )}
                />
                <GameInformation />
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
                                )}
                                {simul_black && simul_white
                                    ? " (both players)"
                                    : simul_black
                                      ? " (black)"
                                      : " (white)"}
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

                {!zen_mode && (
                    <GameChat
                        channel={game_id ? `game-${game_id}` : `review-${review_id}`}
                        game_id={game_id}
                        review_id={review_id}
                    />
                )}
            </GobanView.Tab>

            {/* Left: settings + the two analysis tools that used to live in
             *  the More-actions takeover. Move navigation comes from
             *  GobanView's built-in MoveNumberSlider above the tab bar. */}
            <GobanView.Tab
                id="game-settings"
                type="takeover"
                align="left"
                icon="gear"
                title={_("Settings")}
            >
                <GameSettingsPanel />
            </GobanView.Tab>

            {game && (
                <GobanView.Tab
                    id="game-analyze"
                    type="action"
                    align="left"
                    icon="sitemap"
                    title={_("Analyze game")}
                    disabled={analysis_disabled}
                    active={is_analyzing}
                    onClick={onAnalyzeClick}
                />
            )}

            {/* Center: contextual single-purpose actions. Pausing is offered
             *  via an overlay on the player clocks; Review here is for
             *  spectators or once the game is finished. */}
            {show_review_tab && (
                <GobanView.Tab
                    id="game-review"
                    type="action"
                    align="center"
                    icon="refresh"
                    title={_("Review this game")}
                    onClick={goban_controller.current.startReview}
                />
            )}

            {/* Right: More actions on the far right. Moderator tools are
             *  consolidated into the popover when the user has them. */}
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
