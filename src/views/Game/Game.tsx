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
import { _, interpolate, current_language } from "@/lib/translate";
import { popover } from "@/lib/popover";
import { get, abort_requests_in_flight } from "@/lib/requests";
import { UIPush } from "@/components/UIPush";
import {
    GobanRenderer,
    GobanRendererConfig,
    GobanEnginePhase,
    GobanModes,
    JGOFNumericPlayerColor,
    JGOFSealingIntersection,
    createGoban,
} from "goban";
import { isLiveGame } from "@/components/TimeControl";
import { setExtraActionCallback, PlayerDetails } from "@/components/Player";
import * as player_cache from "@/lib/player_cache";
import { notification_manager } from "@/components/Notifications";
import { Resizable } from "@/components/Resizable";
import { chat_manager, ChatChannelProxy } from "@/lib/chat_manager";
import { sfx } from "@/lib/sfx";
import { GameChat } from "./GameChat";
import { JGOFClock } from "goban";
import { goban_view_mode, goban_view_squashed, ViewMode } from "./util";
import { PlayerCards } from "./PlayerCards";
import { PlayControls, ReviewControls } from "./PlayControls";
import { CancelButton } from "./PlayButtons";
import { GameDock } from "./GameDock";
import { alert } from "@/lib/swal_config";
import { useShowTitle, useTitle, useUserIsParticipant } from "./GameHooks";
import { GobanContainer } from "@/components/GobanContainer";
import { GameControllerContext } from "./goban_context";
import { is_valid_url } from "@/lib/url_validation";
import { BotDetectionResults } from "./BotDetectionResults";
import { ActiveTournament } from "@/lib/types";
import { GameController } from "./GameController";
import {
    FragAIReview,
    FragBelowBoardControls,
    FragTimings,
    GameInformation,
    GameKeyboardShortcuts,
    RengoHeader,
} from "./fragments";
import { toast } from "@/lib/toast";
import { ignore } from "@/lib/misc";

export function Game(): React.ReactElement | null {
    const params = useParams<"game_id" | "review_id" | "move_number">();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const game_id = params.game_id ? parseInt(params.game_id) : 0;
    const review_id = params.review_id ? parseInt(params.review_id) : 0;
    const return_param = searchParams.get("return");
    const return_url = return_param && is_valid_url(return_param) ? return_param : null;

    /* Refs */
    const ref_move_tree_container = React.useRef<HTMLElement | undefined>(undefined);
    const ladder_id = React.useRef<number | undefined>(undefined);
    const tournament_id = React.useRef<number | undefined>(undefined);
    const goban_div = React.useRef<HTMLDivElement | undefined>(undefined);
    const resize_debounce = React.useRef<any | undefined>(undefined);
    const chat_proxy = React.useRef<ChatChannelProxy | undefined>(undefined);
    const on_refocus_title = React.useRef<string>("OGS");
    const last_move_viewed = React.useRef<number>(0);
    const white_username = React.useRef<string>("White");
    const black_username = React.useRef<string>("Black");
    const game_controller = React.useRef<GameController | null>(null);
    const return_url_debounce = React.useRef<boolean>(false);
    const last_phase = React.useRef<string>("");
    const page_loaded_time = React.useRef<number>(Date.now()); // when we first created this view

    let goban = game_controller.current?.goban ?? null;

    /* State */
    const [view_mode, set_view_mode] = React.useState<ViewMode>(goban_view_mode());
    const [squashed, set_squashed] = React.useState<boolean>(goban_view_squashed());
    const [estimating_score, _set_estimating_score] = React.useState<boolean>(false);
    const estimating_score_ref = React.useRef(estimating_score);
    const user_is_player = useUserIsParticipant(goban);
    const [zen_mode, set_zen_mode] = React.useState(preferences.get("start-in-zen-mode"));
    const [review_list, set_review_list] = React.useState<any[]>([]);
    const [variation_name, set_variation_name] = React.useState("");
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
    const [scroll_to_navigate, _setScrollToNavigate] = React.useState(
        preferences.get("scroll-to-navigate"),
    );
    const [phase, set_phase] = React.useState<GobanEnginePhase>();
    const [show_game_timing, set_show_game_timing] = React.useState(false);

    const title = useTitle(goban);
    const [tournament, set_tournament] = React.useState<ActiveTournament>();

    const [mode, set_mode] = React.useState<GobanModes>("play");
    const show_title = useShowTitle(goban);
    const [, set_undo_requested] = React.useState<number | undefined>();
    const [bot_detection_results, set_bot_detection_results] = React.useState<any>(null);
    const [show_bot_detection_results, set_show_bot_detection_results] = React.useState(false);

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

    const onFocus = () => {
        if (goban?.engine) {
            last_move_viewed.current = goban.engine.getMoveNumber();
        }
        window.document.title = on_refocus_title.current;
    };

    /*** Common stuff ***/
    const onResize = React.useCallback(
        (_no_debounce: boolean = false, skip_state_update: boolean = false) => {
            if (!skip_state_update) {
                if (goban_view_mode() !== view_mode || goban_view_squashed() !== squashed) {
                    set_squashed(goban_view_squashed());
                    set_view_mode(goban_view_mode());
                }
            }
        },
        [set_squashed, set_view_mode, squashed, view_mode],
    );

    React.useEffect(() => {
        if (!game_controller.current) {
            return;
        }
        const controller = game_controller.current;

        controller.on("set_variation_name", set_variation_name);
        controller.on("set_show_game_timing", set_show_game_timing);
        controller.on("set_show_bot_detection_results", set_show_bot_detection_results);
        controller.on("zen_mode", set_zen_mode);
        controller.on("view_mode", set_view_mode);
        controller.on("resize", onResize);
        controller.on("set_estimating_score", set_estimating_score);

        return () => {
            controller.off("set_variation_name", set_variation_name);
            controller.off("set_show_game_timing", set_show_game_timing);
            controller.off("set_show_bot_detection_results", set_show_bot_detection_results);
            controller.off("zen_mode", set_zen_mode);
            controller.off("view_mode", set_view_mode);
            controller.off("resize", onResize);
            controller.off("set_estimating_score", set_estimating_score);
        };
    }, [
        game_controller.current,
        set_variation_name,
        set_show_game_timing,
        set_show_bot_detection_results,
        set_zen_mode,
        set_view_mode,
        onResize,
    ]);

    const nav_prev = game_controller.current?.nav_prev ?? (() => {});
    const nav_next = game_controller.current?.nav_next ?? (() => {});
    const nav_goto_move = game_controller.current?.nav_goto_move ?? (() => {});
    const setLabelHandler = game_controller.current?.setLabelHandler ?? (() => {});
    const updateVariationName = game_controller.current?.updateVariationName ?? (() => {});
    const shareAnalysis = game_controller.current?.shareAnalysis ?? (() => {});
    const stopEstimatingScore = game_controller.current?.stopEstimatingScore ?? (() => {});

    const reviewAdded = (review: any) => {
        console.log("Review added: " + JSON.stringify(review));
        const new_review_list: any[] = [];
        for (const r of this.review_list) {
            new_review_list.push(r);
        }
        new_review_list.push(review);
        new_review_list.sort((a, b) => {
            if (a.owner.ranking === b.owner.ranking) {
                return a.owner.username < b.owner.username ? -1 : 1;
            }
            return a.owner.ranking - b.owner.ranking;
        });
        set_review_list(new_review_list);
        if (goban?.engine?.phase === "finished") {
            sfx.play("review_started");
        }
    };

    const onWheel: React.WheelEventHandler<HTMLDivElement> = React.useCallback(
        (event) => {
            if (!scroll_to_navigate) {
                return;
            }

            if (event.deltaY > 0) {
                nav_next();
            } else if (event.deltaY < 0) {
                nav_prev();
            }
        },
        [scroll_to_navigate],
    );

    /* Review stuff */

    const variationKeyPress = (ev: React.KeyboardEvent): boolean | void => {
        if (ev.keyCode === 13) {
            shareAnalysis();
            return false;
        }
    };

    const setMoveTreeContainer = (resizable: Resizable): void => {
        ref_move_tree_container.current = resizable ? resizable.div ?? undefined : undefined;
        if (goban && ref_move_tree_container.current) {
            (goban as GobanRenderer).setMoveTreeContainer(ref_move_tree_container.current);
        }
    };

    /* Constructor */
    React.useEffect(() => {
        goban_div.current = document.createElement("div");
        goban_div.current.className = "Goban";
        /* end constructor */

        set_estimating_score(false);
        game_controller.current?.stopAutoplay();
        set_review_list([]);
        set_historical_black(null);
        set_historical_white(null);
        set_black_flags(null);
        set_white_flags(null);

        window.addEventListener("focus", onFocus);

        /*** BEGIN initialize ***/
        chat_proxy.current = game_id
            ? chat_manager.join(`game-${game_id}`)
            : chat_manager.join(`review-${review_id}`);
        document.addEventListener("keypress", setLabelHandler);

        const label_position = preferences.get("label-positioning");
        const opts: GobanRendererConfig = {
            board_div: goban_div.current,
            move_tree_container: ref_move_tree_container.current,
            interactive: true,
            connect_to_chat: true,
            isInPushedAnalysis: () => game_controller.current?.in_pushed_analysis ?? false,
            leavePushedAnalysis: () => {
                if (game_controller.current?.onPushAnalysisLeft) {
                    game_controller.current.onPushAnalysisLeft();
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
                goban?.redraw(true);
            },
        };

        if (game_id) {
            opts.game_id = game_id;
        }
        if (review_id) {
            opts.review_id = review_id;
            opts.isPlayerOwner = () => goban?.review_owner_id === data.get("user").id;
            opts.isPlayerController = () => goban?.review_controller_id === data.get("user").id;
        }

        goban = createGoban(opts);
        game_controller.current = new GameController(goban);

        game_controller.current.last_variation_number = 0;
        game_controller.current.on("stopEstimatingScore", stopEstimatingScore);
        game_controller.current.on("branch_copied", (copied_node) => {
            if (copied_node) {
                toast(<div>{_("Branch copied")}</div>);
            }
        });

        onResize(true);
        window.global_goban = goban;
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
            /* Title Updates { */
            const last_title = window.document.title;
            last_move_viewed.current = 0;
            on_refocus_title.current = last_title;
            goban.on("state_text", (state) => {
                on_refocus_title.current = state.title;
                if (state.show_moves_made_count) {
                    if (!goban) {
                        window.document.title = state.title;
                        return;
                    }
                    if (document.hasFocus()) {
                        last_move_viewed.current = goban!.engine.getMoveNumber();
                        window.document.title = state.title;
                    } else {
                        const diff = goban!.engine.getMoveNumber() - last_move_viewed.current;
                        if (diff > 0) {
                            window.document.title = interpolate(_("(%s) moves made"), [diff]);
                        }
                    }
                } else {
                    window.document.title = state.title;
                }
            });
            /* } */
        }

        goban.on("submitting-move", () => {
            // clear any pending "your move" notifications
            notification_manager.clearTimecopNotification(game_id);
        });

        goban.on("clock", (clock: JGOFClock | null) => {
            /* This is the code that draws the count down number on the "hover
             * stone" for the current player if they are running low on time */

            const user = data.get("user");

            if (!clock) {
                return;
            }

            if (user.anonymous) {
                return;
            }

            if (!goban) {
                return;
            }

            if (user.id.toString() !== clock.current_player_id) {
                goban.setByoYomiLabel("");
                return;
            }

            let ms_left = 0;
            const player_clock =
                clock.current_player === "black" ? clock.black_clock : clock.white_clock;
            if (player_clock.main_time > 0) {
                ms_left = player_clock.main_time;
                if (
                    goban.engine.time_control.system === "byoyomi" ||
                    goban.engine.time_control.system === "canadian"
                ) {
                    ms_left = 0;
                }
            } else {
                ms_left = player_clock.period_time_left || player_clock.block_time_left || 0;
            }

            const seconds = Math.ceil((ms_left - 1) / 1000);

            const every_second_start = preferences.get(
                "sound.countdown.every-second.start",
            ) as number;

            if (seconds > 0 && seconds < Math.max(10, every_second_start)) {
                const count_direction = preferences.get(
                    "sound.countdown.byoyomi-direction",
                ) as string;
                let count_direction_auto = "down";
                if (count_direction === "auto") {
                    count_direction_auto =
                        current_language === "ja" || current_language === "ko" ? "up" : "down";
                }

                const count_direction_computed =
                    count_direction !== "auto" ? count_direction : count_direction_auto;

                if (count_direction_computed === "up") {
                    if (seconds < every_second_start) {
                        goban.setByoYomiLabel((every_second_start - seconds).toString());
                    }
                } else {
                    goban.setByoYomiLabel(seconds.toString());
                }
            } else {
                goban.setByoYomiLabel("");
            }
        });

        /* Ensure our state is kept up to date */

        const sync_stone_removal = () => {
            const engine = goban!.engine;

            if (
                (engine.phase === "stone removal" || engine.phase === "finished") &&
                engine.outcome !== "Timeout" &&
                engine.outcome !== "Disconnection" &&
                engine.outcome !== "Resignation" &&
                engine.outcome !== "Abandonment" &&
                engine.outcome !== "Cancellation" &&
                goban!.mode === "play"
            ) {
                if (
                    engine.phase === "finished" &&
                    engine.outcome.indexOf("Server Decision") === 0
                ) {
                    if (engine.stalling_score_estimate) {
                        goban!.showStallingScoreEstimate(engine.stalling_score_estimate);
                    }
                } else {
                    const s = engine.computeScore(false);
                    goban!.showScores(s);
                }
            }
        };

        const sync_needs_sealing = (positions: undefined | JGOFSealingIntersection[]) => {
            console.log("sync_needs_sealing", positions);
            //const cur = goban as GobanRenderer;
            const engine = goban!.engine;

            const cur_move = engine.cur_move;
            for (const pos of positions || []) {
                const { x, y } = pos;
                const marks = cur_move.getMarks(x, y);
                marks.needs_sealing = true;
                goban!.drawSquare(x, y);
            }
        };

        const onLoad = () => {
            const engine = goban!.engine;
            set_mode(goban!.mode);
            set_phase(engine.phase);

            set_undo_requested(engine.undo_requested);

            sync_stone_removal();

            const review_list: any[] = [];
            for (const k in engine.config.reviews) {
                review_list.push({
                    id: k,
                    owner: (engine.config.reviews as any)[k],
                });
            }
            review_list.sort((a, b) => {
                if (a.owner.ranking === b.owner.ranking) {
                    return a.owner.username < b.owner.username ? -1 : 1;
                }
                return a.owner.ranking - b.owner.ranking;
            });

            set_review_list(review_list);
        };

        goban.on("load", onLoad);
        onLoad();

        goban.on("mode", set_mode);
        goban.on("phase", set_phase);
        goban.on("phase", () => goban!.engine.cur_move.clearMarks());
        goban.on("undo_requested", set_undo_requested);

        goban.on("phase", sync_stone_removal);
        goban.on("mode", sync_stone_removal);
        goban.on("outcome", sync_stone_removal);
        goban.on("stone-removal.accepted", sync_stone_removal);
        goban.on("stone-removal.updated", sync_stone_removal);
        goban.on("stone-removal.needs-sealing", sync_needs_sealing);

        /* END sync_state port */

        goban.on("move-made", auto_advance);
        goban.on("gamedata", onResize);

        goban.on("gamedata", (gamedata) => {
            if (!goban) {
                throw new Error("goban is null");
            }

            try {
                if (isLiveGame(gamedata.time_control, gamedata.width, gamedata.height)) {
                    goban.one_click_submit = preferences.get("one-click-submit-live");
                    goban.double_click_submit = preferences.get("double-click-submit-live");
                } else {
                    goban.one_click_submit = preferences.get("one-click-submit-correspondence");
                    goban.double_click_submit = preferences.get(
                        "double-click-submit-correspondence",
                    );
                }
                /*
                goban.visual_undo_request_indicator = preferences.get(
                    "visual-undo-request-indicator",
                );
                */
            } catch (e) {
                console.error(e.stack);
            }
        });

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

        if (params.move_number) {
            goban.once(review_id ? "review.load-end" : "gamedata", () => {
                nav_goto_move(parseInt(params.move_number as string));
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

        if (game_id) {
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
                        on_refocus_title.current =
                            black_username.current + " vs " + white_username.current;
                        window.document.title = on_refocus_title.current;
                    }
                    if (game_controller.current) {
                        game_controller.current.creator_id = game.creator;
                        game_controller.current.setAnnulled(game.annulled);
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

                    const live = isLiveGame(
                        JSON.parse(game.time_control_parameters),
                        game.width,
                        game.height,
                    );

                    if (!live) {
                        set_zen_mode(false);
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

        /*** END initialize ***/

        return () => {
            if (game_id) {
                abort_requests_in_flight(`games/${game_id}`);
            }
            if (review_id) {
                abort_requests_in_flight(`reviews/${review_id}`);
            }
            console.log("unmounting, going to destroy", goban);
            chat_proxy.current?.part();
            if (game_controller.current) {
                //game_controller.current.setSelectedChatLog(defaultChatMode);
                //delete game_controller.current.creator_id;
                game_controller.current.stopAutoplay();
                game_controller.current.off("stopEstimatingScore", stopEstimatingScore);
            }
            ladder_id.current = undefined;
            tournament_id.current = undefined;
            document.removeEventListener("keypress", setLabelHandler);
            try {
                if (goban) {
                    goban.destroy();
                }
            } catch (e) {
                console.error(e.stack);
            }
            goban?.removeAllListeners();
            game_controller.current = null;
            goban = null;
            if (resize_debounce.current) {
                clearTimeout(resize_debounce.current);
                resize_debounce.current = null;
            }

            window.Game = null;
            window.global_goban = null;

            setExtraActionCallback(null as any);
            window.removeEventListener("focus", onFocus);
            window.document.title = "OGS";
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class

            goban_div.current?.childNodes.forEach((node) => node.remove());
        };
    }, [game_id, review_id]);

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

    if (goban === null) {
        return null;
    }

    const review = !!review_id;
    const experimental: boolean = data.get("experiments.v6") === "enabled";

    const CHAT = zen_mode ? null : (
        <GameChat
            channel={game_id ? `game-${game_id}` : `review-${review_id}`}
            game_id={game_id}
            review_id={review_id}
        />
    );

    const CONTROLS = review ? (
        <ReviewControls
            mode={mode}
            review_id={review_id}
            setMoveTreeContainer={setMoveTreeContainer}
            onShareAnalysis={shareAnalysis}
            variation_name={variation_name}
            updateVariationName={updateVariationName}
            variationKeyPress={variationKeyPress}
            stopEstimatingScore={stopEstimatingScore}
        />
    ) : (
        <PlayControls
            show_cancel={view_mode !== "portrait" && !zen_mode}
            review_list={review_list}
            stashed_conditional_moves={
                game_controller.current?.stashed_conditional_moves ?? undefined
            }
            mode={mode}
            phase={phase as any}
            title={title as string}
            show_title={show_title as boolean}
            setMoveTreeContainer={setMoveTreeContainer}
            onShareAnalysis={shareAnalysis}
            variation_name={variation_name}
            updateVariationName={updateVariationName}
            variationKeyPress={variationKeyPress}
            annulment_reason={annulment_reason}
            zen_mode={zen_mode}
            stopEstimatingScore={stopEstimatingScore}
        />
    );

    const GAME_DOCK = (
        <GameDock
            tournament_id={tournament_id.current}
            tournament_name={tournament?.name}
            ladder_id={ladder_id.current}
            historical_black={historical_black}
            historical_white={historical_white}
            ai_suspected={bot_detection_results?.ai_suspected.length > 0}
        />
    );

    return (
        <div>
            <div
                className={
                    "Game MainGobanView " +
                    (zen_mode ? "zen " : "") +
                    view_mode +
                    " " +
                    (squashed ? "squashed" : "")
                }
            >
                <GameControllerContext.Provider value={game_controller.current}>
                    {game_id > 0 && (
                        <UIPush
                            event="review-added"
                            channel={`game-${game_id}`}
                            action={reviewAdded}
                        />
                    )}
                    <GameKeyboardShortcuts />
                    <i
                        onClick={game_controller.current?.toggleZenMode}
                        className="leave-zen-mode-button ogs-zen-mode"
                    ></i>

                    <div className="align-row-start"></div>
                    <div className="left-col"></div>

                    <div className="center-col">
                        {view_mode === "portrait" && (
                            <div>
                                <PlayerCards
                                    historical_black={historical_black}
                                    historical_white={historical_white}
                                    estimating_score={estimating_score}
                                    zen_mode={zen_mode}
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
                            </div>
                        )}
                        <GobanContainer goban={goban} onResize={onResize} onWheel={onWheel} />

                        <FragBelowBoardControls />

                        {view_mode === "square" && !squashed && CHAT}

                        {view_mode === "portrait" && !zen_mode && <FragAIReview />}

                        {view_mode === "portrait" && CONTROLS}

                        {view_mode === "portrait" && !zen_mode && CHAT}

                        {view_mode === "portrait" &&
                            !zen_mode &&
                            user_is_player &&
                            mode === "play" &&
                            phase === "play" && <CancelButton className="bold reject" />}

                        {view_mode === "portrait" && !zen_mode && GAME_DOCK}
                    </div>

                    {view_mode !== "portrait" && (
                        <div className={"right-col" + (experimental ? " experimental" : "")}>
                            {zen_mode && <div className="align-col-start"></div>}
                            {(view_mode === "square" || view_mode === "wide") && (
                                <div>
                                    <PlayerCards
                                        historical_black={historical_black}
                                        historical_white={historical_white}
                                        estimating_score={estimating_score}
                                        zen_mode={zen_mode}
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
                                </div>
                            )}

                            {(view_mode === "square" || view_mode === "wide") && !zen_mode && (
                                <FragAIReview />
                            )}

                            {(view_mode === "square" || view_mode === "wide") &&
                                show_game_timing && <FragTimings />}

                            {(view_mode === "square" || view_mode === "wide") &&
                                show_bot_detection_results &&
                                bot_detection_results?.ai_suspected.length > 0 && (
                                    <BotDetectionResults
                                        bot_detection_results={bot_detection_results}
                                        game_id={game_id}
                                        updateBotDetectionResults={set_bot_detection_results}
                                    />
                                )}

                            {CONTROLS}

                            {view_mode === "wide" && CHAT}
                            {view_mode === "square" && squashed && CHAT}
                            {view_mode === "square" && squashed && CHAT}

                            {GAME_DOCK}
                            {zen_mode && <div className="align-col-end"></div>}
                        </div>
                    )}

                    <div className="align-row-end"></div>
                </GameControllerContext.Provider>
            </div>
        </div>
    );
}
