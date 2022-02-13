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

import * as data from "data";
import device from "device";
import * as preferences from "preferences";
import * as React from "react";
import ReactResizeDetector from "react-resize-detector";
import { Link, RouteComponentProps } from "react-router-dom";
import { browserHistory } from "ogsHistory";
import { _, ngettext, pgettext, interpolate, current_language } from "translate";
import { post, get, api1, del } from "requests";
import { KBShortcut } from "KBShortcut";
import { UIPush } from "UIPush";
import { alertModerator, errorAlerter, ignore, getOutcomeTranslation } from "misc";
import { challengeFromBoardPosition, challengeRematch } from "ChallengeModal";
import {
    Goban,
    GobanCanvas,
    GobanCanvasConfig,
    GoEngine,
    GoMath,
    MoveTree,
    AudioClockEvent,
    Score,
    GoEnginePhase,
    GobanModes,
    GoEngineRules,
    AnalysisTool,
    GoEnginePlayerEntry,
    JGOFPlayerSummary,
} from "goban";
import { isLiveGame } from "TimeControl";
import { termination_socket, get_network_latency, get_clock_drift } from "sockets";
import { Dock } from "Dock";
import { Player, setExtraActionCallback } from "Player";
import { Flag } from "Flag";
import * as player_cache from "player_cache";
import { icon_size_url } from "PlayerIcon";
import { notification_manager } from "Notifications";
import { PersistentElement } from "PersistentElement";
import { close_all_popovers } from "popover";
import { Resizable } from "Resizable";
import { ChatPresenceIndicator } from "ChatPresenceIndicator";
import { chat_manager } from "chat_manager";
import { openGameInfoModal } from "./GameInfoModal";
import { openGameLinkModal } from "./GameLinkModal";
import { openGameLogModal } from "./GameLogModal";
import { openACLModal } from "ACLModal";
import { sfx, SFXSprite, ValidSound } from "sfx";
import { AIReview } from "./AIReview";
import { GameChat } from "./Chat";
import { setActiveGameView } from "./Chat";
import { CountDown } from "./CountDown";
import { toast } from "toast";
import { Clock } from "Clock";
import { JGOFClock } from "goban";
import { GameTimings } from "./GameTimings";

import swal from "sweetalert2";

const win = $(window);

type GameProperties = RouteComponentProps<{
    game_id?: string;
    review_id?: string;
    move_number?: string;
}>;

interface GameState {
    view_mode: ViewMode;
    squashed: boolean;
    undo_requested: boolean;
    estimating_score: boolean;
    analyze_pencil_color: string;
    show_submit: boolean;
    user_is_player: boolean;
    zen_mode: boolean;
    autoplaying: boolean;
    portrait_tab: "game" | "chat" | "dock";
    review_list: any[];
    chat_log: "main" | "malkovich";
    variation_name: string;
    strict_seki_mode: boolean;
    player_icons: {};
    volume: number;
    historical_black?: GoEnginePlayerEntry;
    historical_white?: GoEnginePlayerEntry;
    annulled: boolean;
    black_auto_resign_expiration?: Date;
    white_auto_resign_expiration?: Date;
    ai_review_enabled: boolean;
    show_score_breakdown: boolean;
    selected_ai_review_uuid?: string;
    show_game_timing: boolean;
    title?: string;
    score?: Score;
    paused?: boolean;
    phase?: GoEnginePhase;
    mode?: GobanModes;
    move_text?: string;
    resign_mode?: "cancel" | "resign";
    resign_text?: string;
    cur_move_number?: number;
    game_id?: number;
    review_id?: number;
    score_estimate?: { winner?: string };
    show_undo_requested?: boolean;
    show_accept_undo?: boolean;
    show_title?: boolean;
    player_to_move?: number;
    player_not_to_move?: number;
    is_my_move?: boolean;
    winner?: "black" | "white";
    official_move_number?: number;
    rules?: GoEngineRules;
    analyze_tool?: AnalysisTool;
    analyze_subtool?: string;
    stone_removals?: string;
    black_accepted?: boolean;
    white_accepted?: boolean;
    review_owner_id?: number;
    review_controller_id?: number;
    review_out_of_sync?: boolean;
}

export type ViewMode = "portrait" | "wide" | "square";

export class Game extends React.PureComponent<GameProperties, GameState> {
    ref_goban;
    ref_goban_container: HTMLElement;
    ref_players;
    ref_action_bar;
    ref_game_action_buttons;
    ref_game_state_label;
    ref_chat;
    ref_move_tree_container: HTMLElement;

    game_id: number;
    creator_id: number;
    ladder_id: number;
    tournament_id: number;
    ai_review_selected: string | null = null;
    review_id: number;
    move_number: number | null = null;
    goban_div: HTMLDivElement;
    goban: Goban;
    resize_debounce: any = null;
    set_analyze_tool: any = {};
    score_popups: any = {};
    ad: HTMLElement;
    autoplay_timer = null;
    stone_removal_accept_timeout: any = null;
    conditional_move_list = [];
    selected_conditional_move = null;
    chat_log = [];
    chat_update_debounce: any = null;
    last_variation_number: number = 0;
    in_pushed_analysis: boolean = false;
    chat_proxy;
    last_analysis_sent = null;
    orig_marks = null;
    showing_scores = false;
    on_refocus_title: string = "OGS";
    last_move_viewed: number = 0;
    conditional_move_tree;
    leave_pushed_analysis: () => void = null;
    stashed_conditional_moves = null;
    volume_sound_debounce: any = null;
    copied_node: MoveTree = null;

    white_username: string = "White";
    black_username: string = "Black";

    decide_white: () => void;
    decide_black: () => void;
    decide_tie: () => void;

    return_url?: string; // url to return to after a game is over
    return_url_debounce: boolean = false;

    constructor(props) {
        super(props);
        window["Game"] = this;

        try {
            this.return_url =
                new URLSearchParams(window.location.search).get("return") || undefined;
            // console.log("Return url", this.return_url);
        } catch (e) {
            console.error(e);
        }

        this.game_id = this.props.match.params.game_id
            ? parseInt(this.props.match.params.game_id)
            : 0;
        this.review_id = this.props.match.params.review_id
            ? parseInt(this.props.match.params.review_id)
            : 0;
        if ("move_number" in this.props.match.params) {
            // 0 is a valid move number, and is different from a lack of move_number meaning load latest move.
            this.move_number = parseInt(this.props.match.params.move_number);
        }
        this.state = {
            view_mode: this.computeViewMode(),
            squashed: goban_view_squashed(),
            undo_requested: false,
            estimating_score: false,
            analyze_pencil_color: "#004cff",
            show_submit: false,
            user_is_player: false,
            zen_mode: false,
            autoplaying: false,
            portrait_tab: "game",
            review_list: [],
            chat_log: "main",
            variation_name: "",
            strict_seki_mode: false,
            player_icons: {},
            volume: sfx.getVolume("master"),
            historical_black: null,
            historical_white: null,
            annulled: false,
            black_auto_resign_expiration: null,
            white_auto_resign_expiration: null,
            ai_review_enabled: preferences.get("ai-review-enabled"),
            show_score_breakdown: false,
            selected_ai_review_uuid: null,
            show_game_timing: false,
        };

        this.conditional_move_tree = $("<div class='conditional-move-tree-container'/>")[0];
        this.goban_div = document.createElement("div");
        this.goban_div.className = "Goban";
        this.checkAndEnterAnalysis = this.checkAndEnterAnalysis.bind(this);
        this.nav_up = this.nav_up.bind(this);
        this.nav_down = this.nav_down.bind(this);
        this.nav_first = this.nav_first.bind(this);
        this.nav_prev = this.nav_prev.bind(this);
        this.nav_prev_10 = this.nav_prev_10.bind(this);
        this.nav_next = this.nav_next.bind(this);
        this.nav_next_10 = this.nav_next_10.bind(this);
        this.nav_last = this.nav_last.bind(this);
        this.nav_play_pause = this.nav_play_pause.bind(this);

        this.reviewAdded = this.reviewAdded.bind(this);
        this.set_analyze_tool = {
            stone_null: this.setAnalyzeTool.bind(this, "stone", null),
            stone_alternate: this.setAnalyzeTool.bind(this, "stone", "alternate"),
            stone_black: this.setAnalyzeTool.bind(this, "stone", "black"),
            stone_white: this.setAnalyzeTool.bind(this, "stone", "white"),
            label_triangle: this.setAnalyzeTool.bind(this, "label", "triangle"),
            label_square: this.setAnalyzeTool.bind(this, "label", "square"),
            label_circle: this.setAnalyzeTool.bind(this, "label", "circle"),
            label_cross: this.setAnalyzeTool.bind(this, "label", "cross"),
            label_letters: this.setAnalyzeTool.bind(this, "label", "letters"),
            label_numbers: this.setAnalyzeTool.bind(this, "label", "numbers"),
            draw: () => {
                this.setAnalyzeTool("draw", this.state.analyze_pencil_color);
            },
            clear_and_sync: () => {
                this.goban.syncReviewMove({ clearpen: true });
                this.goban.clearAnalysisDrawing();
            },
            delete_branch: () => {
                this.goban_deleteBranch();
            },
        };

        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        this.toggleZenMode = this.toggleZenMode.bind(this);
        this.toggleCoordinates = this.toggleCoordinates.bind(this);
        this.showGameInfo = this.showGameInfo.bind(this);
        this.gameAnalyze = this.gameAnalyze.bind(this);
        this.enterConditionalMovePlanner = this.enterConditionalMovePlanner.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.startReview = this.startReview.bind(this);
        this.fork = this.fork.bind(this);
        this.estimateScore = this.estimateScore.bind(this);
        this.alertModerator = this.alertModerator.bind(this);
        this.showLinkModal = this.showLinkModal.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.decide_black = this.decide.bind(this, "black");
        this.decide_white = this.decide.bind(this, "white");
        this.decide_tie = this.decide.bind(this, "tie");
        this.openACL = this.openACL.bind(this);
        this.stopAutoplay = this.stopAutoplay.bind(this);
        this.startAutoplay = this.startAutoplay.bind(this);
        this.togglePortraitTab = this.togglePortraitTab.bind(this);
        this.goban_acceptUndo = this.goban_acceptUndo.bind(this);
        this.goban_submit_move = this.goban_submit_move.bind(this);
        this.cancelOrResign = this.cancelOrResign.bind(this);
        this.pass = this.pass.bind(this);
        this.undo = this.undo.bind(this);
        this.goban_setModeDeferredPlay = this.goban_setModeDeferredPlay.bind(this);
        this.stopEstimatingScore = this.stopEstimatingScore.bind(this);
        this.setStrictSekiMode = this.setStrictSekiMode.bind(this);
        this.rematch = this.rematch.bind(this);
        this.onStoneRemovalAutoScore = this.onStoneRemovalAutoScore.bind(this);
        this.onStoneRemovalAccept = this.onStoneRemovalAccept.bind(this);
        this.onStoneRemovalCancel = this.onStoneRemovalCancel.bind(this);
        this.goban_setMode_play = this.goban_setMode_play.bind(this);
        this.acceptConditionalMoves = this.acceptConditionalMoves.bind(this);
        this.goban_jumpToLastOfficialMove = this.goban_jumpToLastOfficialMove.bind(this);
        this.shareAnalysis = this.shareAnalysis.bind(this);
        this.clearAnalysisDrawing = this.clearAnalysisDrawing.bind(this);
        this.setPencilColor = this.setPencilColor.bind(this);
        this.goban_resumeGame = this.goban_resumeGame.bind(this);
        this.updateVariationName = this.updateVariationName.bind(this);
    }
    UNSAFE_componentWillMount() {
        setActiveGameView(this);
        setExtraActionCallback(this.renderExtraPlayerActions);
        $(window).on("focus", this.onFocus);
    }
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (
            this.props.match.params.game_id !== nextProps.match.params.game_id ||
            this.props.match.params.review_id !== nextProps.match.params.review_id
        ) {
            this.deinitialize();
            while (this.goban_div.firstChild) {
                this.goban_div.removeChild(this.goban_div.firstChild);
            }

            this.setState({
                portrait_tab: "game",
                undo_requested: false,
                estimating_score: false,
                show_submit: false,
                autoplaying: false,
                review_list: [],
                historical_black: null,
                historical_white: null,
            });

            this.game_id = nextProps.match.params.game_id
                ? parseInt(nextProps.match.params.game_id)
                : 0;
            this.review_id = nextProps.match.params.review_id
                ? parseInt(nextProps.match.params.review_id)
                : 0;
            this.sync_state();
        } else {
            console.log(
                "UNSAFE_componentWillReceiveProps called with same game id: ",
                this.props,
                nextProps,
            );
        }
    }
    componentDidUpdate(prevProps) {
        if (
            this.props.match.params.game_id !== prevProps.match.params.game_id ||
            this.props.match.params.review_id !== prevProps.match.params.review_id
        ) {
            this.initialize();
            this.sync_state();
        }
        this.onResize(false, true);
    }
    componentDidMount() {
        this.initialize();
        if (this.computeViewMode() === "portrait") {
            this.ref_goban_container.style.minHeight = `${screen.width}px`;
        } else {
            this.ref_goban_container.style.minHeight = `initial`;
        }
        this.onResize();
    }
    componentWillUnmount() {
        this.deinitialize();
        setActiveGameView(null);
        setExtraActionCallback(null);
        $(window).off("focus", this.onFocus);
        window.document.title = "OGS";
        const body = document.getElementsByTagName("body")[0];
        body.classList.remove("zen"); //remove the class
    }
    getLocation(): string {
        return window.location.pathname;
    }

    autoadvance = () => {
        const user = data.get("user");

        if (!user.anonymous && /^\/game\//.test(this.getLocation())) {
            /* if we just moved */
            if (
                this.goban &&
                this.goban.engine &&
                this.goban.engine.playerNotToMove() === user.id
            ) {
                if (
                    !isLiveGame(this.goban.engine.time_control) &&
                    preferences.get("auto-advance-after-submit")
                ) {
                    if (notification_manager.anyYourMove()) {
                        notification_manager.advanceToNextBoard();
                    }
                }
            }
        }
    };

    deinitialize() {
        this.chat_proxy.part();
        this.chat_log = [];
        this.creator_id = null;
        this.ladder_id = null;
        this.tournament_id = null;
        $(document).off("keypress", this.setLabelHandler);
        try {
            this.goban.destroy();
        } catch (e) {
            console.error(e.stack);
        }
        this.goban = null;
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }
        if (this.autoplay_timer) {
            clearTimeout(this.autoplay_timer);
        }
        window["Game"] = null;
        window["global_goban"] = null;
        this.setState({
            black_auto_resign_expiration: null,
            white_auto_resign_expiration: null,
        });
    }
    onFocus = () => {
        if (this.goban && this.goban.engine) {
            this.last_move_viewed = this.goban.engine.getMoveNumber();
        }
        window.document.title = this.on_refocus_title;
    };
    initialize() {
        this.chat_proxy = this.game_id
            ? chat_manager.join(`game-${this.game_id}`)
            : chat_manager.join(`review-${this.review_id}`);
        $(document).on("keypress", this.setLabelHandler);

        const label_position = preferences.get("label-positioning");
        const opts: GobanCanvasConfig = {
            board_div: this.goban_div,
            move_tree_container: this.ref_move_tree_container,
            interactive: true,
            connect_to_chat: true,
            isInPushedAnalysis: () => this.in_pushed_analysis,
            leavePushedAnalysis: () => {
                if (this.leave_pushed_analysis) {
                    this.leave_pushed_analysis();
                }
            },
            game_id: null,
            review_id: null,
            draw_top_labels: label_position === "all" || label_position.indexOf("top") >= 0,
            draw_left_labels: label_position === "all" || label_position.indexOf("left") >= 0,
            draw_right_labels: label_position === "all" || label_position.indexOf("right") >= 0,
            draw_bottom_labels: label_position === "all" || label_position.indexOf("bottom") >= 0,
            display_width: Math.min(
                this.ref_goban_container.offsetWidth,
                this.ref_goban_container.offsetHeight,
            ),
            visual_undo_request_indicator: preferences.get("visual-undo-request-indicator"),
            onScoreEstimationUpdated: () => {
                this.sync_state();
                this.goban.redraw(true);
            },
        };

        if (opts.display_width <= 0) {
            const I = setInterval(() => {
                this.onResize(true);
                setTimeout(() => {
                    if (
                        !this.goban ||
                        (this.ref_goban_container &&
                            Math.min(
                                this.ref_goban_container.offsetWidth,
                                this.ref_goban_container.offsetHeight,
                            ) > 0)
                    ) {
                        clearInterval(I);
                    }
                }, 1);
            }, 500);
        }

        if (this.game_id) {
            opts.game_id = this.game_id;
        }
        if (this.review_id) {
            opts.review_id = this.review_id;
            opts.isPlayerOwner = () => this.goban.review_owner_id === data.get("user").id;
            opts.isPlayerController = () => this.goban.review_controller_id === data.get("user").id;
        }

        this.goban = new Goban(opts);
        this.onResize(true);
        window["global_goban"] = this.goban;
        if (this.review_id) {
            this.goban.setMode("analyze");
        }

        this.goban.on("gamedata", () => {
            const user = data.get("user");
            try {
                if (
                    user.is_moderator &&
                    (user.id in (this.goban.engine.player_pool || {}) ||
                        user.id === this.goban.engine.config.white_player_id ||
                        user.id === this.goban.engine.config.black_player_id)
                ) {
                    const channel = `game-${this.game_id}`;
                    if (!data.get(`moderator.join-game-publicly.${channel}`)) {
                        console.log("Having to set anonymous override for", channel);
                        data.set(`moderator.join-game-publicly.${channel}`, true);
                    } else {
                        console.log("Already set anonymous override for", channel);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });

        // We need an initial score for the first display rendering (which is not set in the constructor).
        // Best to get this from the engine, so we know we have the right structure...
        this.setState({ score: this.goban.engine.computeScore(true) });

        if (preferences.get("dynamic-title")) {
            /* Title Updates { */
            const last_title = window.document.title;
            this.last_move_viewed = 0;
            this.on_refocus_title = last_title;
            this.goban.on("state_text", (state) => {
                this.on_refocus_title = state.title;
                if (state.show_moves_made_count) {
                    if (!this.goban) {
                        window.document.title = state.title;
                        return;
                    }
                    if (document.hasFocus()) {
                        this.last_move_viewed = this.goban.engine.getMoveNumber();
                        window.document.title = state.title;
                    } else {
                        const diff = this.goban.engine.getMoveNumber() - this.last_move_viewed;
                        window.document.title = interpolate(_("(%s) moves made"), [diff]);
                    }
                } else {
                    window.document.title = state.title;
                }
            });
            /* } */
        }

        this.bindAudioEvents();

        this.goban.on("clock", (clock: JGOFClock) => {
            /* This is the code that draws the count down number on the "hover
             * stone" for the current player if they are running low on time */

            const user = data.get("user");

            if (!clock) {
                return;
            }

            if (user.anonymous) {
                return;
            }

            if (user.id.toString() !== clock.current_player_id) {
                this.goban.setByoYomiLabel(null);
                return;
            }

            let ms_left = 0;
            const player_clock =
                clock.current_player === "black" ? clock.black_clock : clock.white_clock;
            if (player_clock.main_time > 0) {
                ms_left = player_clock.main_time;
                if (
                    this.goban.engine.time_control.system === "byoyomi" ||
                    this.goban.engine.time_control.system === "canadian"
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
                        this.goban.setByoYomiLabel((every_second_start - seconds).toString());
                    }
                } else {
                    this.goban.setByoYomiLabel(seconds.toString());
                }
            } else {
                this.goban.setByoYomiLabel(null);
            }

            /*
        if (minutes === 0 && seconds <= 10) {
            if (seconds % 2 === 0) {
                cls += " low_time";
            }

            if (this.on_game_screen && player_id) {
                if (window["user"] && player_id === window["user"].id && window["user"].id === this.engine.playerToMove()) {
                    this.byoyomi_label = "" + seconds;
                    let last_byoyomi_label = this.byoyomi_label;
                    if (this.last_hover_square) {
                        this.__drawSquare(this.last_hover_square.x, this.last_hover_square.y);
                    }
                    setTimeout(() => {
                        if (this.byoyomi_label === last_byoyomi_label) {
                            this.byoyomi_label = null;
                            if (this.last_hover_square) {
                                this.__drawSquare(this.last_hover_square.x, this.last_hover_square.y);
                            }
                        }
                    }, 1100);
                }

                if (this.mode === "play") {
                    this.emit('audio-clock', {
                        seconds_left: seconds,
                        player_to_move: this.engine.playerToMove(),
                        clock_player: player_id,
                        time_control_system: timing_type,
                        in_overtime: in_overtime,
                    });
                }
            }
        }
        */
        });

        this.goban.on("move-made", this.autoadvance);
        this.goban.on("player-update", this.processPlayerUpdate);
        this.goban.on("title", (title) => this.setState({ title: title }));
        this.goban.on("update", () => this.sync_state());
        this.goban.on("reset", () => this.sync_state());
        this.goban.on("show-submit", (tf) => {
            this.setState({ show_submit: tf });
        });
        this.goban.on("chat", (line) => {
            this.chat_log.push(line);
            this.debouncedChatUpdate();
        });
        this.goban.on("chat-remove", (obj) => {
            for (const chat_id of obj.chat_ids) {
                for (let i = 0; i < this.chat_log.length; ++i) {
                    if (this.chat_log[i].chat_id === chat_id) {
                        this.chat_log.splice(i, 1);
                        break;
                    } else {
                        console.log(chat_id, this.chat_log[i]);
                    }
                }
            }
            this.debouncedChatUpdate();
        });
        this.goban.on("chat-reset", () => {
            this.chat_log.length = 0;
            this.debouncedChatUpdate();
        });

        this.goban.on("gamedata", (gamedata) => {
            try {
                if (isLiveGame(gamedata.time_control)) {
                    this.goban.one_click_submit = preferences.get("one-click-submit-live");
                    this.goban.double_click_submit = preferences.get("double-click-submit-live");
                } else {
                    this.goban.one_click_submit = preferences.get(
                        "one-click-submit-correspondence",
                    );
                    this.goban.double_click_submit = preferences.get(
                        "double-click-submit-correspondence",
                    );
                }
                this.goban.variation_stone_transparency = preferences.get(
                    "variation-stone-transparency",
                );
                this.goban.visual_undo_request_indicator = preferences.get(
                    "visual-undo-request-indicator",
                );
            } catch (e) {
                console.error(e.stack);
            }

            this.sync_state();
        });

        if (this.move_number !== null) {
            this.goban.once("gamedata", () => {
                this.nav_goto_move(this.move_number);
            });
        }

        this.goban.on("auto-resign", (data) => {
            if (this.goban.engine && data.player_id === this.goban.engine.players.black.id) {
                this.setState({
                    black_auto_resign_expiration: new Date(
                        data.expiration - get_network_latency() + get_clock_drift(),
                    ),
                });
            }
            if (this.goban.engine && data.player_id === this.goban.engine.players.white.id) {
                this.setState({
                    white_auto_resign_expiration: new Date(
                        data.expiration - get_network_latency() + get_clock_drift(),
                    ),
                });
            }
        });
        this.goban.on("clear-auto-resign", (data) => {
            if (this.goban.engine && data.player_id === this.goban.engine.players.black.id) {
                this.setState({ black_auto_resign_expiration: null });
            }
            if (this.goban.engine && data.player_id === this.goban.engine.players.white.id) {
                this.setState({ white_auto_resign_expiration: null });
            }
        });

        if (this.review_id) {
            this.goban.on("review.updated", () => {
                this.sync_state();
            });
            this.goban.on("review.sync-to-current-move", () => {
                this.syncToCurrentReviewMove();
            });

            let stashed_move_string = null;
            let stashed_review_id = null;
            /* If we lose connection, save our place when we reconnect so we can jump to it. */
            this.goban.on("review.load-start", () => {
                if (this.goban.review_controller_id !== data.get("user").id) {
                    return;
                }

                stashed_review_id = this.goban.review_id;
                stashed_move_string = this.goban.engine.cur_move.getMoveStringToThisPoint();
                if (stashed_move_string.length === 0) {
                    stashed_review_id = null;
                    stashed_move_string = null;
                }
            });
            this.goban.on("review.load-end", () => {
                if (this.goban.review_controller_id !== data.get("user").id) {
                    return;
                }

                if (stashed_move_string && stashed_review_id === this.goban.review_id) {
                    const prev_last_review_message = this.goban.getLastReviewMessage();
                    const moves = GoMath.decodeMoves(
                        stashed_move_string,
                        this.goban.width,
                        this.goban.height,
                    );

                    this.goban.engine.jumpTo(this.goban.engine.move_tree);
                    for (const move of moves) {
                        if (move.edited) {
                            this.goban.engine.editPlace(move.x, move.y, move.color, false);
                        } else {
                            this.goban.engine.place(
                                move.x,
                                move.y,
                                false,
                                false,
                                true,
                                false,
                                false,
                            );
                        }
                    }
                    /* This is designed to kinda work around race conditions
                     * where we start sending out review moves before we have
                     * authenticated */
                    setTimeout(() => {
                        this.goban.setLastReviewMessage(prev_last_review_message);
                        this.goban.syncReviewMove();
                    }, 100);
                }
            });
        }

        if (this.game_id) {
            get("games/%%", this.game_id)
                .then((game: rest_api.GameDetails) => {
                    if (game.players.white.id) {
                        player_cache.update(game.players.white, true);
                        this.white_username = game.players.white.username;
                    }
                    if (game.players.black.id) {
                        player_cache.update(game.players.black, true);
                        this.black_username = game.players.black.username;
                    }
                    if (
                        this.white_username &&
                        this.black_username &&
                        !preferences.get("dynamic-title")
                    ) {
                        this.on_refocus_title = this.black_username + " vs " + this.white_username;
                        window.document.title = this.on_refocus_title;
                    }
                    this.creator_id = game.creator;
                    this.ladder_id = game.ladder;
                    this.tournament_id = game.tournament;

                    const review_list = [];
                    for (const k in game.gamedata.reviews) {
                        review_list.push({
                            id: k,
                            owner: game.gamedata.reviews[k],
                        });
                    }
                    review_list.sort((a, b) => {
                        if (a.owner.ranking === b.owner.ranking) {
                            return a.owner.username < b.owner.username ? -1 : 1;
                        }
                        return a.owner.ranking - b.owner.ranking;
                    });

                    this.setState({
                        review_list: review_list,
                        annulled: game.annulled,
                        historical_black: game.historical_ratings.black,
                        historical_white: game.historical_ratings.white,
                    });

                    this.goban_div.setAttribute("data-game-id", this.game_id.toString());

                    if (this.ladder_id) {
                        this.goban_div.setAttribute("data-ladder-id", this.ladder_id.toString());
                    } else {
                        this.goban_div.removeAttribute("data-ladder-id");
                    }
                    if (this.tournament_id) {
                        this.goban_div.setAttribute(
                            "data-tournament-id",
                            this.tournament_id.toString(),
                        );
                    } else {
                        this.goban_div.removeAttribute("data-tournament-id");
                    }
                })
                .catch(ignore);
        }

        if (this.review_id) {
            get("reviews/%%", this.review_id)
                .then((review) => {
                    if (review.game) {
                        this.setState({
                            historical_black: review.game.historical_ratings.black,
                            historical_white: review.game.historical_ratings.white,
                        });
                    }
                })
                .catch(ignore);
        }
    }

    private bindAudioEvents(): void {
        // called by init
        const user = data.get("user");
        //this.goban.on('audio-game-started', (obj:{ player_id: number }) => sfx.play("game_started"));

        this.goban.on("audio-enter-stone-removal", () => {
            sfx.stop();
            sfx.play("remove_the_dead_stones");
        });
        //this.goban.on('audio-enter-stone-removal', () => sfx.play('stone_removal'));
        this.goban.on("audio-resume-game-from-stone-removal", () => {
            sfx.stop();
            sfx.play("game_resumed");
        });

        this.goban.on("audio-game-paused", () => {
            console.log(this.goban.engine.phase);
            if (this.goban.engine.phase === "play") {
                sfx.play("game_paused");
            }
        });
        this.goban.on("audio-game-resumed", () => {
            console.log(this.goban.engine.phase);
            if (this.goban.engine.phase === "play") {
                sfx.play("game_resumed");
            }
        });
        this.goban.on("audio-stone", (stone) =>
            sfx.playStonePlacementSound(stone.x, stone.y, stone.width, stone.height, stone.color),
        );
        this.goban.on("audio-pass", () => sfx.play("pass"));
        this.goban.on("audio-undo-requested", () => sfx.play("undo_requested"));
        this.goban.on("audio-undo-granted", () => sfx.play("undo_granted"));

        this.goban.on(
            "audio-capture-stones",
            (obj: { count: number; already_captured: number }) => {
                let sound: ValidSound = "error";
                if (obj.already_captured <= 2) {
                    switch (obj.count) {
                        case 1:
                            sound = "capture-1";
                            break;
                        case 2:
                            sound = "capture-2";
                            break;
                        case 3:
                            sound = "capture-3";
                            break;
                        case 4:
                            sound = "capture-4";
                            break;
                        case 5:
                            sound = "capture-5";
                            break;
                        default:
                            sound = "capture-handful";
                            break;
                    }
                } else {
                    switch (obj.count) {
                        case 1:
                            sound = "capture-1-pile";
                            break;
                        case 2:
                            sound = "capture-2-pile";
                            break;
                        case 3:
                            sound = "capture-3-pile";
                            break;
                        case 4:
                            sound = "capture-4-pile";
                            break;
                        default:
                            sound = "capture-handful";
                            break;
                    }
                }

                sfx.play(sound);
            },
        );

        {
            // Announce when *we* have disconnected / reconnected
            let disconnected = false;
            let debounce: ReturnType<typeof setTimeout> | null;
            let cur_sound: SFXSprite;
            let can_play_disconnected_sound = false;

            setTimeout(() => (can_play_disconnected_sound = true), 3000);

            this.goban.on("audio-disconnected", () => {
                if (!can_play_disconnected_sound) {
                    return;
                }
                if (cur_sound) {
                    cur_sound.stop();
                }
                if (debounce) {
                    clearTimeout(debounce);
                }
                debounce = setTimeout(() => {
                    cur_sound = sfx.play("disconnected");
                    disconnected = true;
                    debounce = null;
                }, 5000);
            });
            this.goban.on("audio-reconnected", () => {
                if (!can_play_disconnected_sound) {
                    return;
                }
                if (cur_sound) {
                    cur_sound.stop();
                }
                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                    return;
                }
                if (!disconnected) {
                    return;
                }
                disconnected = false;
                cur_sound = sfx.play("reconnected");
            });
        }

        {
            // Announce when other people disconnect / reconnect
            let can_play_disconnected_sound = false;
            let debounce: ReturnType<typeof setTimeout> | null;
            let cur_sound: SFXSprite;

            setTimeout(() => (can_play_disconnected_sound = true), 3000);

            this.goban.on("audio-other-player-disconnected", (who: { player_id: number }) => {
                console.log("Player :", who.player_id, " disconnected");
                if (!can_play_disconnected_sound) {
                    return;
                }
                if (who.player_id === user.id) {
                    // i don't *think* this should ever happen..
                    return;
                }

                if (cur_sound) {
                    cur_sound.stop();
                }
                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                    return;
                }

                debounce = setTimeout(() => {
                    if (this.goban.engine.playerColor(user?.id) === "invalid") {
                        // spectating? don't say opponent
                        cur_sound = sfx.play("player_disconnected");
                    } else {
                        cur_sound = sfx.play("your_opponent_has_disconnected");
                    }
                    debounce = null;
                }, 5000); // don't play "your opponent has disconnected" if they are just reloading the page
            });
            this.goban.on("audio-other-player-reconnected", (who: { player_id: number }) => {
                console.log("Player :", who.player_id, " reconnected");
                if (!can_play_disconnected_sound) {
                    return;
                }
                if (who.player_id === user.id) {
                    // i don't *think* this should ever happen..
                    return;
                }
                if (cur_sound) {
                    cur_sound.stop();
                }

                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                    return;
                }
                if (this.goban.engine.playerColor(user?.id) === "invalid") {
                    // spectating? don't say opponent
                    cur_sound = sfx.play("player_reconnected");
                } else {
                    cur_sound = sfx.play("your_opponent_has_reconnected");
                }
            });
        }

        this.goban.on("audio-game-ended", (winner: "black" | "white" | "tie") => {
            const user = data.get("user");
            const color = this.goban.engine.playerColor(user?.id);

            if (winner === "tie") {
                sfx.play("tie");
            } else {
                if (color === "invalid") {
                    if (winner === "black") {
                        sfx.play("black_wins");
                    }
                    if (winner === "white") {
                        sfx.play("white_wins");
                    }
                } else {
                    //console.log("winner: ", winner, " color ", color);
                    if (winner === color) {
                        sfx.play("you_have_won");
                    } else {
                        //sfx.play('you_have_lost');

                        if (winner === "black") {
                            sfx.play("black_wins");
                        }
                        if (winner === "white") {
                            sfx.play("white_wins");
                        }
                    }
                }
            }
        });

        let last_audio_played: ValidSound = "error";
        let overtime_announced = false;
        let last_period_announced = -1;
        let first_audio_event_received = false;
        // this exists to prevent some early announcements when we reconnect
        setTimeout(() => (first_audio_event_received = true), 1000);

        this.goban.on("audio-clock", (audio_clock_event: AudioClockEvent) => {
            const user = data.get("user");
            if (user.anonymous) {
                //console.log("anon");
                return;
            }

            if (this.state.paused) {
                //console.log("paused");
                return;
            }

            if (user.id.toString() !== audio_clock_event.player_id.toString()) {
                //console.log("not user");
                return;
            }

            const tick_tock_start = preferences.get("sound.countdown.tick-tock.start") as number;
            const ten_seconds_start = preferences.get(
                "sound.countdown.ten-seconds.start",
            ) as number;
            const five_seconds_start = preferences.get(
                "sound.countdown.five-seconds.start",
            ) as number;
            const every_second_start = preferences.get(
                "sound.countdown.every-second.start",
            ) as number;
            const count_direction = preferences.get("sound.countdown.byoyomi-direction") as string;
            let count_direction_auto = "down";
            if (count_direction === "auto") {
                count_direction_auto =
                    current_language === "ja" || current_language === "ko" ? "up" : "down";
            }

            const count_direction_computed =
                count_direction !== "auto" ? count_direction : count_direction_auto;
            const time_control = this.goban.engine.time_control;

            switch (time_control.system) {
                case "none":
                    return;

                case "canadian":
                case "byoyomi":
                    if (
                        !audio_clock_event.in_overtime &&
                        !(time_control.system === "byoyomi" && time_control.periods === 0)
                    ) {
                        // Don't count down main time for byoyomi and canadian clocks
                        //console.log("not doing announcement");
                        return;
                    }

                // break omitted
                case "simple":
                case "absolute":
                case "fischer":
                    break;
            }

            let audio_to_play: ValidSound;
            const seconds_left: number = audio_clock_event.countdown_seconds;
            let numeric_announcement = false;

            if (audio_clock_event.in_overtime && !overtime_announced) {
                overtime_announced = true;
                if (sfx.hasSoundSample("start_counting")) {
                    audio_to_play = "start_counting";
                } else {
                    if (time_control.system === "byoyomi") {
                        audio_to_play = "byoyomi";
                        last_period_announced = audio_clock_event.clock.periods_left;
                    } else {
                        audio_to_play = "overtime";
                    }
                }
            } else if (
                audio_clock_event.in_overtime &&
                time_control.system === "byoyomi" &&
                last_period_announced !== audio_clock_event.clock.periods_left
            ) {
                last_period_announced = audio_clock_event.clock.periods_left;
                audio_to_play = "period";
                if (audio_clock_event.clock.periods_left === 5) {
                    audio_to_play = "5_periods_left";
                }
                if (audio_clock_event.clock.periods_left === 4) {
                    audio_to_play = "4_periods_left";
                }
                if (audio_clock_event.clock.periods_left === 3) {
                    audio_to_play = "3_periods_left";
                }
                if (audio_clock_event.clock.periods_left === 2) {
                    audio_to_play = "2_periods_left";
                }
                if (audio_clock_event.clock.periods_left === 1) {
                    audio_to_play = "last_period";
                }
            } else {
                if (tick_tock_start > 0 && seconds_left <= tick_tock_start) {
                    audio_to_play = seconds_left % 2 ? "tick" : "tock";
                    if (seconds_left === 3) {
                        audio_to_play = "tock-3left";
                    }
                    if (seconds_left === 2) {
                        audio_to_play = "tick-2left";
                    }
                    if (seconds_left === 1) {
                        audio_to_play = "tock-1left";
                    }
                }

                if (
                    ten_seconds_start > 0 &&
                    seconds_left <= ten_seconds_start &&
                    seconds_left % 10 === 0
                ) {
                    audio_to_play = seconds_left.toString() as ValidSound;
                    numeric_announcement = true;
                }
                if (
                    five_seconds_start > 0 &&
                    seconds_left <= five_seconds_start &&
                    seconds_left % 5 === 0
                ) {
                    audio_to_play = seconds_left.toString() as ValidSound;
                    numeric_announcement = true;
                }
                if (every_second_start > 0 && seconds_left <= every_second_start) {
                    audio_to_play = seconds_left.toString() as ValidSound;
                    numeric_announcement = true;
                }

                if (
                    numeric_announcement &&
                    time_control.system === "byoyomi" &&
                    count_direction_computed === "up"
                ) {
                    if (seconds_left > 60) {
                        audio_to_play = undefined;
                    } else {
                        //let period_time = Math.min(60, time_control.period_time);

                        // handle counting up

                        if (seconds_left < every_second_start) {
                            audio_to_play = (
                                every_second_start - seconds_left
                            ).toString() as ValidSound;
                        } else {
                            const count_from = Math.max(ten_seconds_start, five_seconds_start);

                            if (
                                ten_seconds_start > 0 &&
                                seconds_left <= ten_seconds_start &&
                                seconds_left % 10 === 0 &&
                                seconds_left !== every_second_start
                            ) {
                                //audio_to_play = (period_time - parseInt(audio_to_play)).toString() as ValidSound;
                                audio_to_play = (
                                    count_from - parseInt(audio_to_play)
                                ).toString() as ValidSound;
                            } else if (
                                five_seconds_start > 0 &&
                                seconds_left <= five_seconds_start &&
                                seconds_left % 5 === 0 &&
                                seconds_left !== every_second_start
                            ) {
                                audio_to_play = (
                                    count_from - parseInt(audio_to_play)
                                ).toString() as ValidSound;
                            } else if (tick_tock_start > 0 && seconds_left <= tick_tock_start) {
                                audio_to_play = seconds_left % 2 ? "tick" : "tock";
                            } else {
                                audio_to_play = undefined;
                            }

                            if (audio_to_play === "0") {
                                audio_to_play = undefined;
                            }
                        }
                    }
                }
            }

            if (!first_audio_event_received) {
                if (audio_to_play) {
                    last_audio_played = audio_to_play;
                }
                first_audio_event_received = true;
                return;
            }

            if (audio_to_play && last_audio_played !== audio_to_play) {
                last_audio_played = audio_to_play;
                sfx.play(audio_to_play);
            }
        });
    }

    /*** Common stuff ***/
    nav_up() {
        this.checkAndEnterAnalysis();
        this.goban.prevSibling();
        this.goban.syncReviewMove();
    }
    nav_down() {
        this.checkAndEnterAnalysis();
        this.goban.nextSibling();
        this.goban.syncReviewMove();
    }
    nav_first() {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showFirst();
        this.goban.syncReviewMove();
    }
    nav_prev_10() {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showPrevious();
        }
        this.goban.syncReviewMove();
    }
    nav_prev() {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showPrevious();
        this.goban.syncReviewMove();
    }
    nav_next(event?: React.MouseEvent<any>, dont_stop_autoplay?: boolean) {
        const last_estimate_move = this.stopEstimatingScore();
        if (!dont_stop_autoplay) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showNext();
        this.goban.syncReviewMove();
    }
    nav_next_10() {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showNext();
        }
        this.goban.syncReviewMove();
    }
    nav_last() {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.jumpToLastOfficialMove();
        this.goban.syncReviewMove();
    }
    nav_play_pause() {
        if (this.state.autoplaying) {
            this.stopAutoplay();
        } else {
            this.startAutoplay();
        }
    }
    nav_goto_move = (move_number: number) => {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showFirst(move_number > 0);
        for (let i = 0; i < move_number; ++i) {
            this.goban.showNext(i !== move_number - 1);
        }
        this.goban.syncReviewMove();
    };

    stopAutoplay() {
        if (this.autoplay_timer) {
            clearTimeout(this.autoplay_timer);
            this.autoplay_timer = null;
        }
        if (this.state.autoplaying) {
            this.setState({ autoplaying: false });
        }
    }
    startAutoplay() {
        if (this.autoplay_timer) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis();
        const step = () => {
            if (this.goban.mode === "analyze") {
                this.nav_next(null, true);

                if (
                    this.goban.engine.last_official_move.move_number ===
                    this.goban.engine.cur_move.move_number
                ) {
                    this.stopAutoplay();
                } else {
                    this.autoplay_timer = setTimeout(step, preferences.get("autoplay-delay"));
                }
            } else {
                this.stopAutoplay();
            }
        };
        this.autoplay_timer = setTimeout(step, Math.min(1000, preferences.get("autoplay-delay")));

        this.setState({ autoplaying: true });
    }

    processPlayerUpdate = (player_update: JGOFPlayerSummary) => {
        if (player_update.dropped_players) {
            if (player_update.dropped_players.black) {
                console.log("dropping black");
                // we don't care who was dropped, we just have to clear the auto-resign-overlay!
                this.setState({ black_auto_resign_expiration: null });
            }
            if (player_update.dropped_players.white) {
                this.setState({ white_auto_resign_expiration: null });
            }
        }

        this.sync_state(); // now do the real work of updating the teams/players.
    };

    checkAndEnterAnalysis(move?: MoveTree) {
        if (
            this.goban.mode === "play" &&
            this.goban.engine.phase !== "stone removal" &&
            (!this.goban.isAnalysisDisabled() || this.goban.engine.phase === "finished")
        ) {
            this.setState({ variation_name: "" });
            this.goban.setMode("analyze");
            if (move) {
                this.goban.engine.jumpTo(move);
            }
            return true;
        }
        if (this.goban.mode === "analyze") {
            if (move) {
                this.goban.engine.jumpTo(move);
            }
            return true;
        }
        return false;
    }
    recenterGoban() {
        const m = this.goban.computeMetrics();
        $(this.goban_div).css({
            top: Math.ceil(this.ref_goban_container.offsetHeight - m.height) / 2,
            left: Math.ceil(this.ref_goban_container.offsetWidth - m.width) / 2,
        });
    }
    onResize = (no_debounce: boolean = false, skip_state_update: boolean = false) => {
        //Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight)
        if (!skip_state_update) {
            if (
                this.computeViewMode() !== this.state.view_mode ||
                goban_view_squashed() !== this.state.squashed
            ) {
                this.setState({
                    squashed: goban_view_squashed(),
                    view_mode: this.computeViewMode(),
                });
            }
        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }

        if (!this.goban) {
            return;
        }

        this.goban.setGameClock(
            this.goban.last_clock,
        ); /* this forces a clock refresh, important after a layout when the dom could have been replaced */

        if (!this.ref_goban_container) {
            return;
        }

        if (this.computeViewMode() === "portrait") {
            const w = win.width() + 10;
            if (this.ref_goban_container.style.minHeight !== `${w}px`) {
                this.ref_goban_container.style.minHeight = `${w}px`;
            }
        } else {
            if (this.ref_goban_container.style.minHeight !== `initial`) {
                this.ref_goban_container.style.minHeight = `initial`;
            }
            const w = this.ref_goban_container.offsetWidth;
            if (this.ref_goban_container.style.flexBasis !== `${w}px`) {
                this.ref_goban_container.style.flexBasis = `${w}px`;
            }
        }

        if (!no_debounce) {
            this.resize_debounce = setTimeout(() => this.onResize(true), 10);
            this.recenterGoban();
            return;
        }

        this.goban.setSquareSizeBasedOnDisplayWidth(
            Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight),
        );

        this.recenterGoban();
    };
    setAnalyzeTool(tool, subtool) {
        if (this.checkAndEnterAnalysis()) {
            $("#game-analyze-button-bar .active").removeClass("active");
            $("#game-analyze-" + tool + "-tool").addClass("active");
            switch (tool) {
                case "draw":
                    this.goban.setAnalyzeTool(tool, this.state.analyze_pencil_color);
                    break;
                case "erase":
                    console.log("Erase not supported yet");
                    break;
                case "label":
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
                case "stone":
                    if (subtool == null) {
                        //subtool = goban.engine.colorToMove() === "black" ? "black-white" : "white-black"
                        subtool = "alternate";
                    }
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
            }
        }

        this.sync_state();
        return false;
    }
    setLabelHandler = (event) => {
        try {
            if (
                document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA" ||
                document.activeElement.tagName === "SELECT"
            ) {
                return;
            }
        } catch (e) {
            // ignore error
        }

        if (this.goban && this.goban.mode === "analyze") {
            if (this.goban.analyze_tool === "label") {
                if (event.charCode) {
                    const ch = String.fromCharCode(event.charCode).toUpperCase();
                    this.goban.setLabelCharacter(ch);
                }
            }
        }
    };
    computeViewMode(): ViewMode {
        return goban_view_mode();
    }
    computeSquashed(): boolean {
        return win.height() < 680;
    }
    toggleCoordinates() {
        const goban = this.goban;

        let label_position = preferences.get("label-positioning");
        switch (label_position) {
            case "all":
                label_position = "none";
                break;
            case "none":
                label_position = "top-left";
                break;
            case "top-left":
                label_position = "top-right";
                break;
            case "top-right":
                label_position = "bottom-right";
                break;
            case "bottom-right":
                label_position = "bottom-left";
                break;
            case "bottom-left":
                label_position = "all";
                break;
        }
        preferences.set("label-positioning", label_position);

        goban.draw_top_labels = label_position === "all" || label_position.indexOf("top") >= 0;
        goban.draw_left_labels = label_position === "all" || label_position.indexOf("left") >= 0;
        goban.draw_right_labels = label_position === "all" || label_position.indexOf("right") >= 0;
        goban.draw_bottom_labels =
            label_position === "all" || label_position.indexOf("bottom") >= 0;
        this.onResize(true);
        goban.redraw(true);
    }
    showGameInfo() {
        for (const k of ["komi", "rules", "handicap", "rengo", "rengo_teams"]) {
            this.goban.config[k] = this.goban.engine.config[k];
        }
        openGameInfoModal(
            this.goban.config,
            this.state[`historical_black`] || this.goban.engine.players.black,
            this.state[`historical_white`] || this.goban.engine.players.white,
            this.state.annulled,
            this.creator_id || this.goban.review_owner_id,
        );
    }

    toggleShowTiming = () => {
        this.setState({ show_game_timing: !this.state.show_game_timing });
    };

    showLogModal = () => {
        openGameLogModal(
            this.goban.config,
            this.state[`historical_black`] || this.goban.engine.players.black,
            this.state[`historical_white`] || this.goban.engine.players.white,
        );
    };
    toggleAnonymousModerator = () => {
        const channel = `game-${this.game_id}`;
        data.set(
            `moderator.join-game-publicly.${channel}`,
            !data.get(
                `moderator.join-game-publicly.${channel}`,
                !preferences.get("moderator.join-games-anonymously"),
            ),
        );
    };
    showLinkModal() {
        openGameLinkModal(this.goban);
    }
    gameAnalyze() {
        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished") {
            //swal(_("Analysis mode has been disabled for this game"));
        } else {
            const last_estimate_move = this.stopEstimatingScore();

            this.goban.setMode("analyze");
            if (last_estimate_move) {
                this.goban.engine.jumpTo(last_estimate_move);
            }
        }
    }
    fork() {
        if (
            this.goban?.engine.rengo ||
            (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished")
        ) {
            //swal(_("Game forking has been disabled for this game since analysis mode has been disabled"));
        } else {
            challengeFromBoardPosition(this.goban);
        }
    }
    toggleZenMode() {
        if (this.state.zen_mode) {
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class
            this.setState({
                zen_mode: false,
                view_mode: this.computeViewMode(),
            });
        } else {
            const body = document.getElementsByTagName("body")[0];
            body.classList.add("zen"); //add the class
            this.setState({
                zen_mode: true,
                view_mode: this.computeViewMode(),
            });
        }
        this.onResize();
    }
    toggleAIReview = () => {
        preferences.set("ai-review-enabled", !this.state.ai_review_enabled);
        if (this.state.ai_review_enabled) {
            this.goban.setHeatmap(null);
            this.goban.setColoredCircles(null);
            let move_tree = this.goban.engine.move_tree;
            while (move_tree.next(true)) {
                move_tree = move_tree.next(true);
                move_tree.clearMarks();
            }
            this.goban.redraw();
            this.sync_state();
        }
        this.setState({ ai_review_enabled: !this.state.ai_review_enabled });
    };
    togglePortraitTab() {
        let portrait_tab = null;
        switch (this.state.portrait_tab) {
            case "game":
                portrait_tab = "chat";
                break;
            case "chat":
                //portrait_tab = 'dock';
                portrait_tab = "game";
                break;

            case "dock":
                portrait_tab = "game";
                break;
        }

        this.setState({ portrait_tab: portrait_tab });
        this.onResize();
    }
    setPencilColor(ev) {
        const color = (ev.target as HTMLInputElement).value;
        if (this.goban.analyze_tool === "draw") {
            this.goban.analyze_subtool = color;
        }
        this.setState({ analyze_pencil_color: color });
    }
    updateVariationName(ev) {
        this.setState({ variation_name: (ev.target as HTMLInputElement).value });
    }
    updateMoveText = (ev) => {
        this.setState({ move_text: ev.target.value });
        this.goban.syncReviewMove(null, ev.target.value);
    };
    debouncedChatUpdate() {
        if (this.chat_update_debounce) {
            return;
        }
        this.chat_update_debounce = setTimeout(() => {
            this.chat_update_debounce = null;
            if (this.ref_chat) {
                this.ref_chat.forceUpdate();
            }
        }, 1);
    }
    shareAnalysis() {
        const diff = this.goban.engine.getMoveDiff();
        let name = this.state.variation_name;
        const goban = this.goban;
        let autonamed = false;

        if (!name) {
            autonamed = true;
            name = "" + ++this.last_variation_number;
        }

        const marks = {};
        let mark_ct = 0;
        for (let y = 0; y < goban.height; ++y) {
            for (let x = 0; x < goban.width; ++x) {
                const pos = goban.getMarks(x, y);
                const marktypes = ["letter", "triangle", "circle", "square", "cross"];
                for (let i = 0; i < marktypes.length; ++i) {
                    if (marktypes[i] in pos && pos[marktypes[i]]) {
                        const markkey = marktypes[i] === "letter" ? pos.letter : marktypes[i];
                        if (!(markkey in marks)) {
                            marks[markkey] = "";
                        }
                        marks[markkey] += GoMath.encodeMove(x, y);
                        ++mark_ct;
                    }
                }
            }
        }

        const analysis: any = {
            type: "analysis",
            from: diff.from,
            moves: diff.moves,
            name: name,
        };
        console.log(analysis);

        if (mark_ct) {
            analysis.marks = marks;
        }
        if (goban.pen_marks.length) {
            analysis.pen_marks = goban.pen_marks;
        }

        const last_analysis_sent = this.last_analysis_sent;
        if (
            last_analysis_sent &&
            last_analysis_sent.from === analysis.from &&
            last_analysis_sent.moves === analysis.moves &&
            (autonamed || last_analysis_sent.name === analysis.name) &&
            ((!analysis.marks && !last_analysis_sent.marks) ||
                last_analysis_sent.marks === analysis.marks) &&
            ((!analysis.pen_marks && !last_analysis_sent.pen_marks) ||
                last_analysis_sent.pen_marks === analysis.pen_marks)
        ) {
            if (autonamed) {
                --this.last_variation_number;
            }
            return;
        }

        if (!data.get("user").anonymous) {
            goban.sendChat(analysis, this.ref_chat.state.chat_log);
            this.last_analysis_sent = analysis;
        } else {
            goban.message("Can't send to the " + this.ref_chat.state.chat_log + " chat_log");
        }
    }
    openACL = () => {
        if (this.game_id) {
            openACLModal({ game_id: this.game_id });
        } else if (this.review_id) {
            openACLModal({ review_id: this.review_id });
        }
    };

    popupScores() {
        const goban = this.goban;

        if (goban.engine.cur_move) {
            this.orig_marks = JSON.stringify(goban.engine.cur_move.getAllMarks());
            goban.engine.cur_move.clearMarks();
        } else {
            this.orig_marks = null;
        }

        this._popupScores("black");
        this._popupScores("white");
    }
    _popupScores(color) {
        const goban = this.goban;

        const only_prisoners = false;
        const scores = goban.engine.computeScore(only_prisoners);
        this.showing_scores = goban.showing_scores;
        goban.showScores(scores);

        const score = scores[color];
        let html = "";
        if (!only_prisoners) {
            html += "<div class='score_breakdown'>";
            if (score.stones) {
                html +=
                    "<div><span>" + _("Stones") + "</span><div>" + score.stones + "</div></div>";
            }
            if (score.territory) {
                html +=
                    "<div><span>" +
                    _("Territory") +
                    "</span><div>" +
                    score.territory +
                    "</div></div>";
            }
            if (score.prisoners) {
                html +=
                    "<div><span>" +
                    _("Prisoners") +
                    "</span><div>" +
                    score.prisoners +
                    "</div></div>";
            }
            if (score.handicap) {
                html +=
                    "<div><span>" +
                    _("Handicap") +
                    "</span><div>" +
                    score.handicap +
                    "</div></div>";
            }
            if (score.komi) {
                html += "<div><span>" + _("Komi") + "</span><div>" + score.komi + "</div></div>";
            }

            if (!score.stones && !score.territory && !parseInt(score.prisoners) && !score.komi) {
                html += "<div><span>" + _("No score yet") + "</span>";
            }

            html += "<div>";
        } else {
            html += "<div class='score_breakdown'>";
            if (score.komi) {
                html += "<div><span>" + _("Komi") + "</span><div>" + score.komi + "</div></div>";
            }
            html +=
                "<div><span>" + _("Prisoners") + "</span><div>" + score.prisoners + "</div></div>";
            html += "<div>";
        }

        $("#" + color + "-score-details").html(html);
        this.setState({
            show_score_breakdown: true,
        });
    }
    hideScores() {
        const goban = this.goban;

        if (!this.showing_scores) {
            goban.hideScores();
        }
        if (goban.engine.cur_move) {
            goban.engine.cur_move.setAllMarks(JSON.parse(this.orig_marks));
        }
        goban.redraw();

        $("#black-score-details").children().remove();
        $("#white-score-details").children().remove();

        this.setState({
            show_score_breakdown: false,
        });
    }

    /*** Game stuff ***/
    reviewAdded(review) {
        const review_list = [];
        for (const r of this.state.review_list) {
            review_list.push(r);
        }
        review_list.push(review);
        review_list.sort((a, b) => {
            if (a.owner.ranking === b.owner.ranking) {
                return a.owner.username < b.owner.username ? -1 : 1;
            }
            return a.owner.ranking - b.owner.ranking;
        });
        this.setState({ review_list: review_list });
        if (this.goban?.engine?.phase === "finished") {
            sfx.play("review_started");
        }
    }
    handleEscapeKey() {
        if (this.state.zen_mode) {
            this.toggleZenMode();
        }

        if (this.goban) {
            if (this.goban.mode === "score estimation") {
                this.leaveScoreEstimation();
            } else if (this.goban.mode === "analyze" && this.game_id) {
                this.goban.setMode("play");
                this.sync_state();
            }
        }
    }
    sync_state() {
        const new_state: Partial<GameState> = {
            game_id: this.game_id,
            review_id: this.review_id,
            user_is_player: false,
        };
        const goban: Goban = this.goban;
        const engine: GoEngine = goban ? goban.engine : null;

        if (this.goban) {
            /* Is player? */
            const players = engine.rengo
                ? engine.rengo_teams.black.concat(this.goban.engine.rengo_teams.white)
                : [engine.players.black, engine.players.white];

            const player_ids = players.map((p) => p.id);

            new_state.user_is_player = player_ids.includes(data.get("user").id);

            /* Game state */
            new_state.mode = goban.mode;
            new_state.phase = engine.phase;
            new_state.title = goban.title;
            new_state.score_estimate = goban.score_estimate || {};
            new_state.show_undo_requested =
                engine.undo_requested === engine.last_official_move.move_number;
            new_state.show_accept_undo =
                goban.engine.playerToMove() === data.get("user").id ||
                (goban.submit_move != null &&
                    goban.engine.playerNotToMove() === data.get("user").id) ||
                null;
            new_state.show_title =
                !goban.submit_move || goban.engine.playerToMove() !== data.get("user").id || null;
            new_state.show_submit =
                !!goban.submit_move &&
                goban.engine.cur_move &&
                goban.engine.cur_move.parent &&
                goban.engine.last_official_move &&
                goban.engine.cur_move.parent.id === goban.engine.last_official_move.id;
            new_state.player_to_move = goban.engine.playerToMove();
            new_state.player_not_to_move = goban.engine.playerNotToMove();
            new_state.is_my_move = new_state.player_to_move === data.get("user").id;
            new_state.winner = goban.engine.winner;
            new_state.cur_move_number = engine.cur_move ? engine.cur_move.move_number : -1;
            new_state.official_move_number = engine.last_official_move
                ? engine.last_official_move.move_number
                : -1;
            new_state.strict_seki_mode = engine.strict_seki_mode;
            new_state.rules = engine.rules;
            new_state.paused = goban.pause_control && !!goban.pause_control.paused;
            new_state.analyze_tool = goban.analyze_tool;
            new_state.analyze_subtool = goban.analyze_subtool;

            if (goban.engine.gameCanBeCanceled()) {
                new_state.resign_text = _("Cancel game");
                new_state.resign_mode = "cancel";
            } else {
                new_state.resign_text = _("Resign");
                new_state.resign_mode = "resign";
            }

            if (engine.phase === "stone removal") {
                new_state.stone_removals = engine.getStoneRemovalString();
                const stone_removals = new_state.stone_removals;

                if (this.stone_removal_accept_timeout) {
                    clearTimeout(this.stone_removal_accept_timeout);
                }

                const gsra = $("#game-stone-removal-accept");
                gsra.prop("disabled", true);
                this.stone_removal_accept_timeout = setTimeout(
                    () => {
                        gsra.prop("disabled", false);
                        this.stone_removal_accept_timeout = null;
                    },
                    device.is_mobile ? 3000 : 1500,
                );

                new_state.black_accepted =
                    engine.players["black"].accepted_stones === stone_removals;
                new_state.white_accepted =
                    engine.players["white"].accepted_stones === stone_removals;
            }

            if (
                (engine.phase === "stone removal" || engine.phase === "finished") &&
                engine.outcome !== "Timeout" &&
                engine.outcome !== "Disconnection" &&
                engine.outcome !== "Resignation" &&
                engine.outcome !== "Abandonment" &&
                engine.outcome !== "Cancellation" &&
                goban.mode === "play"
            ) {
                new_state.score = engine.computeScore(false);
                goban.showScores(new_state.score);
            } else {
                new_state.score = engine.computeScore(true);
            }

            if (goban.mode === "conditional") {
                const tree = $(this.conditional_move_tree);
                tree.empty();
                this.selected_conditional_move = null;
                this.conditional_move_list = [];
                const elts = this.createConditionalMoveTreeDisplay(
                    this.goban.conditional_tree,
                    "",
                    this.goban.conditional_starting_color === "black",
                );
                for (let i = 0; i < elts.length; ++i) {
                    tree.append(elts[i]);
                }
            }

            new_state.move_text =
                engine.cur_move && engine.cur_move.text ? engine.cur_move.text : "";

            if (
                this.state.phase &&
                engine.phase &&
                this.state.phase !== engine.phase &&
                engine.phase === "finished"
            ) {
                if (this.return_url && !this.return_url_debounce) {
                    this.return_url_debounce = true;
                    console.log("Transition from ", this.state.phase, " to ", engine.phase);
                    setTimeout(() => {
                        if (
                            confirm(
                                interpolate(_("Would you like to return to {{url}}?"), {
                                    url: this.return_url,
                                }),
                            )
                        ) {
                            window.location.href = this.return_url;
                        }
                    }, 1500);
                }
            }

            /* review stuff */
            new_state.review_owner_id = goban.review_owner_id;
            new_state.review_controller_id = goban.review_controller_id;
            new_state.review_out_of_sync =
                engine.cur_move &&
                engine.cur_review_move &&
                engine.cur_move.id !== engine.cur_review_move.id;
        }

        this.setState(new_state as GameState);
    }

    createConditionalMoveTreeDisplay(root, cpath, blacks_move) {
        const goban = this.goban;

        const mkcb = (path) => {
            return () => {
                goban.jumpToLastOfficialMove();
                goban.followConditionalPath(path);
                this.sync_state();
                goban.redraw();
            };
        };
        const mkdelcb = (path) => {
            return () => {
                goban.jumpToLastOfficialMove();
                goban.deleteConditionalPath(path);
                this.sync_state();
                goban.redraw();
            };
        };

        const color1 = blacks_move ? "black" : "white";
        const color2 = blacks_move ? "white" : "black";

        let ret = null;
        const ul = $("<ul>").addClass("tree");
        if (root.move) {
            if (cpath + root.move === goban.getCurrentConditionalPath()) {
                this.selected_conditional_move = cpath + root.move;
            }
            this.conditional_move_list.push(cpath + root.move);

            const mv = goban.engine.decodeMoves(root.move)[0];

            const delete_icon = $("<i>")
                .addClass("fa fa-times")
                .addClass("delete-move")
                .click(mkdelcb(cpath + root.move));

            ret = [
                $("<span>")
                    .addClass("entry")
                    .append($("<span>").addClass("stone " + color2))
                    .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
                    .addClass(
                        cpath + root.move === goban.getCurrentConditionalPath() ? "selected" : "",
                    )
                    .click(mkcb(cpath + root.move)),
            ];

            if (cpath + root.move === goban.getCurrentConditionalPath()) {
                // selected move
                ret.push(delete_icon);
            }
            ret.push(ul);

            cpath += root.move;
        } else {
            ret = [ul];
        }

        for (const ch in root.children) {
            if (cpath + ch === goban.getCurrentConditionalPath()) {
                this.selected_conditional_move = cpath + ch;
            }
            this.conditional_move_list.push(cpath + ch);

            const li = $("<li>").addClass("move-row");
            const mv = goban.engine.decodeMoves(ch)[0];
            const span = $("<span>")
                .addClass("entry")
                .append($("<span>").addClass("stone " + color1))
                .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
                .addClass(cpath + ch === goban.getCurrentConditionalPath() ? "selected" : "")
                .click(mkcb(cpath + ch));
            li.append(span);

            const elts = this.createConditionalMoveTreeDisplay(
                root.children[ch],
                cpath + ch,
                blacks_move,
            );
            for (let i = 0; i < elts.length; ++i) {
                li.append(elts[i]);
            }

            ul.append(li);
        }
        return ret;
    }

    leaveScoreEstimation() {
        this.setState({
            estimating_score: false,
        });
        this.goban.setScoringMode(false);
        this.goban.hideScores();
        this.goban.score_estimate = null;
        this.sync_state();
    }
    enterConditionalMovePlanner() {
        //if (!auth) { return; }
        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished") {
            //swal(_("Conditional moves have been disabled for this game."));
        } else {
            this.stashed_conditional_moves = this.goban.conditional_tree.duplicate();
            this.goban.setMode("conditional");
        }
    }
    pauseGame() {
        this.goban.pauseGame();
    }
    startReview() {
        const user = data.get("user");
        const is_player =
            user.id === this.goban.engine.players.black.id ||
            user.id === this.goban.engine.players.white.id;

        if (
            this.goban.isAnalysisDisabled() &&
            this.goban.engine.phase !== "finished" &&
            is_player
        ) {
            //swal(_("Analysis mode has been disabled for this game, you can start a review after the game has concluded."));
        } else {
            swal({
                text: _("Start a review of this game?"),
                showCancelButton: true,
            })
                .then(() => {
                    post("games/%%/reviews", this.game_id, {})
                        .then((res) => browserHistory.push(`/review/${res.id}`))
                        .catch(errorAlerter);
                })
                .catch(ignore);
        }
    }
    estimateScore(): boolean {
        const user = data.get("user");
        const is_player =
            user.id === this.goban.engine.players.black.id ||
            user.id === this.goban.engine.players.white.id ||
            shared_ip_with_player_map[this.game_id];

        if (
            this.goban.isAnalysisDisabled() &&
            this.goban.engine.phase !== "finished" &&
            is_player
        ) {
            return null;
        }

        if (this.goban.engine.phase === "stone removal") {
            console.log(
                "Cowardly refusing to enter score estimation phase while stone removal phase is active",
            );
            return false;
        }
        this.setState({ estimating_score: true });
        this.goban.setScoringMode(true, !is_player || this.goban.engine.phase === "finished");
        this.sync_state();
        return true;
    }
    stopEstimatingScore(): MoveTree {
        if (!this.state.estimating_score) {
            return null;
        }
        this.setState({ estimating_score: false });
        const ret = this.goban.setScoringMode(false);
        this.goban.hideScores();
        this.goban.score_estimate = null;
        //goban.engine.cur_move.clearMarks();
        this.sync_state();
        return ret;
    }
    alertModerator() {
        alertModerator(this.game_id ? { game: this.game_id } : { review: this.review_id });
    }
    decide(winner): void {
        let moderation_note = null;
        do {
            moderation_note = prompt("Deciding for " + winner.toUpperCase() + " - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/moderate", this.game_id, {
            decide: winner,
            moderation_note: moderation_note,
        }).catch(errorAlerter);
    }
    force_autoscore = () => {
        let moderation_note = null;
        do {
            moderation_note = prompt("Autoscoring game - Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/moderate", this.game_id, {
            autoscore: true,
            moderation_note: moderation_note,
        }).catch(errorAlerter);
    };
    private annul(tf: boolean): void {
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
                .replace(/(black)\b/g, `player ${this.goban.engine.players.black.id}`)
                .replace(/(white)\b/g, `player ${this.goban.engine.players.white.id}`);
        } while (moderation_note === "");

        post("games/%%/annul", this.game_id, {
            annul: tf ? 1 : 0,
            moderation_note: moderation_note,
        })
            .then(() => {
                if (tf) {
                    swal({ text: _("Game has been annulled") }).catch(swal.noop);
                } else {
                    swal({ text: _("Game ranking has been restored") }).catch(swal.noop);
                }
                this.setState({ annulled: tf });
            })
            .catch(errorAlerter);
    }

    cancelOrResign() {
        let dropping_from_casual_rengo = false;

        if (this.goban.engine.rengo && this.goban.engine.rengo_casual_mode) {
            const team = this.goban.engine.rengo_teams.black.find(
                (p) => p.id === data.get("user").id,
            )
                ? "black"
                : "white";
            dropping_from_casual_rengo = this.goban.engine.rengo_teams[team].length > 1;
        }

        if (this.state.resign_mode === "cancel") {
            swal({
                text: _("Are you sure you wish to cancel this game?"),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
                .then(() => this.goban.cancelGame())
                .catch(() => 0);
        } else {
            swal({
                text: dropping_from_casual_rengo
                    ? _("Are you sure you want to abandon your team?")
                    : _("Are you sure you wish to resign this game?"),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
                .then(() => this.goban.resign())
                .catch(() => 0);
        }
    }
    goban_acceptUndo() {
        this.goban.acceptUndo();
    }
    goban_submit_move() {
        this.goban.submit_move();
    }
    goban_setMode_play() {
        this.goban.setMode("play");
        if (this.stashed_conditional_moves) {
            this.goban.setConditionalTree(this.stashed_conditional_moves);
            this.stashed_conditional_moves = null;
        }
    }
    goban_resumeGame() {
        this.goban.resumeGame();
    }
    goban_jumpToLastOfficialMove() {
        this.goban.jumpToLastOfficialMove();
    }
    acceptConditionalMoves() {
        this.stashed_conditional_moves = null;
        this.goban.saveConditionalMoves();
        this.goban.setMode("play");
    }
    pass() {
        if (
            !isLiveGame(this.goban.engine.time_control) ||
            !preferences.get("one-click-submit-live")
        ) {
            swal({ text: _("Are you sure you want to pass?"), showCancelButton: true })
                .then(() => this.goban.pass())
                .catch(() => 0);
        } else {
            this.goban.pass();
        }
    }
    analysis_pass = () => {
        this.goban.pass();
        this.forceUpdate();
    };
    undo() {
        if (
            data.get("user").id === this.goban.engine.playerNotToMove() &&
            this.goban.engine.undo_requested !== this.goban.engine.getMoveNumber()
        ) {
            this.goban.requestUndo();
        }
    }
    goban_setModeDeferredPlay() {
        this.goban.setModeDeferred("play");
    }
    goban_deleteBranch = () => {
        if (this.state.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to delete branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection().isCollapsed) {
                return;
            }
        } catch (e) {
            // ignore error
        }

        if (this.goban.engine.cur_move.trunk) {
            swal({
                text: _(
                    "The current position is not an explored branch, so there is nothing to delete",
                ),
            }).catch(swal.noop);
        } else {
            swal({
                text: _("Are you sure you wish to remove this move branch?"),
                showCancelButton: true,
            })
                .then(() => {
                    this.goban.deleteBranch();
                    this.goban.syncReviewMove();
                })
                .catch(() => 0);
        }
    };
    goban_copyBranch = () => {
        if (this.state.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to copy branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection().isCollapsed) {
                return;
            }
        } catch (e) {
            // ignore error
        }

        this.copied_node = this.goban.engine.cur_move;
        toast(<div>{_("Branch copied")}</div>, 1000);
    };
    goban_pasteBranch = () => {
        if (this.state.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to paste branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection().isCollapsed) {
                return;
            }
        } catch (e) {
            // ignore error
        }

        if (this.copied_node) {
            const paste = (base: MoveTree, source: MoveTree) => {
                this.goban.engine.jumpTo(base);
                if (source.edited) {
                    this.goban.engine.editPlace(source.x, source.y, source.player, false);
                } else {
                    this.goban.engine.place(source.x, source.y, false, false, true, false, false);
                }
                const cur = this.goban.engine.cur_move;

                if (source.trunk_next) {
                    paste(cur, source.trunk_next);
                }
                for (const branch of source.branches) {
                    paste(cur, branch);
                }
            };

            try {
                paste(this.goban.engine.cur_move, this.copied_node);
            } catch (e) {
                errorAlerter(_("A move conflict has been detected"));
            }
            this.goban.syncReviewMove();
        } else {
            console.log("Nothing copied or cut to paste");
        }
    };
    setStrictSekiMode(ev) {
        this.goban.setStrictSekiMode((ev.target as HTMLInputElement).checked);
    }
    rematch() {
        try {
            $(document.activeElement).blur();
        } catch (e) {
            console.error(e);
        }

        challengeRematch(
            this.goban,
            data.get("user").id === this.goban.engine.players.black.id
                ? this.goban.engine.players.white
                : this.goban.engine.players.black,
            this.goban.engine.config,
        );
    }
    onStoneRemovalCancel() {
        swal({ text: _("Are you sure you want to resume the game?"), showCancelButton: true })
            .then(() => this.goban.rejectRemovedStones())
            .catch(() => 0);
        return false;
    }
    onStoneRemovalAccept() {
        this.goban.acceptRemovedStones();
        return false;
    }
    onStoneRemovalAutoScore() {
        this.goban.autoScore();
        return false;
    }
    clearAnalysisDrawing() {
        this.goban.syncReviewMove({ clearpen: true });
        this.goban.clearAnalysisDrawing();
    }
    setChatLog = (chat_log) => {
        this.setState({ chat_log: chat_log });
    };

    toggleVolume = () => {
        this._setVolume(this.state.volume > 0 ? 0 : 0.5);
    };
    setVolume = (ev) => {
        const new_volume = parseFloat(ev.target.value);
        this._setVolume(new_volume);
    };
    _setVolume(volume) {
        sfx.setVolume("master", volume);

        this.setState({
            volume: volume,
        });

        if (this.volume_sound_debounce) {
            clearTimeout(this.volume_sound_debounce);
        }

        this.volume_sound_debounce = setTimeout(
            () => sfx.playStonePlacementSound(5, 5, 9, 9, "white"),
            250,
        );
    }

    /* Review stuff */
    delete_ai_reviews = () => {
        swal({
            text: _("Really clear ALL AI reviews for this game?"),
            showCancelButton: true,
        })
            .then(() => {
                console.info(`Clearing AI reviews for ${this.game_id}`);
                del(`games/${this.game_id}/ai_reviews`, {})
                    .then(() => console.info("AI Reviews cleared"))
                    .catch(errorAlerter);
            })
            .catch(ignore);
    };
    force_ai_review(analysis_type: "fast" | "full") {
        post(`games/${this.game_id}/ai_reviews`, {
            engine: "katago",
            type: analysis_type,
        })
            .then(() => swal(_("Analysis started")))
            .catch(errorAlerter);
    }

    syncToCurrentReviewMove = () => {
        if (this.goban.engine.cur_review_move) {
            this.goban.engine.jumpTo(this.goban.engine.cur_review_move);
            this.sync_state();
        } else {
            setTimeout(this.syncToCurrentReviewMove, 50);
        }
    };
    hasVoice(user_id) {
        if (this.review_id && this.goban) {
            if (
                this.goban.review_controller_id === user_id ||
                this.goban.review_owner_id === user_id
            ) {
                return true;
            }
        }
        return false;
    }

    render() {
        const CHAT = (
            <GameChat
                ref={(el) => (this.ref_chat = el)}
                chatlog={this.chat_log}
                onChatLogChanged={this.setChatLog}
                gameview={this}
                userIsPlayer={this.state.user_is_player}
                channel={this.game_id ? `game-${this.game_id}` : `review-${this.review_id}`}
            />
        );
        const review = !!this.review_id;

        return (
            <div>
                <div
                    className={
                        "Game MainGobanView " +
                        (this.state.zen_mode ? "zen " : "") +
                        this.state.view_mode +
                        " " +
                        (this.state.squashed ? "squashed" : "")
                    }
                >
                    {this.frag_kb_shortcuts()}
                    <i
                        onClick={this.toggleZenMode}
                        className="leave-zen-mode-button ogs-zen-mode"
                    ></i>

                    <div className="align-row-start"></div>
                    <div className="left-col"></div>

                    <div className="center-col">
                        {(this.state.view_mode === "portrait" || null) && this.frag_players()}

                        {(this.state.view_mode !== "portrait" ||
                            this.state.portrait_tab === "game" ||
                            null) && (
                            <div
                                ref={(el) => (this.ref_goban_container = el)}
                                className="goban-container"
                            >
                                <ReactResizeDetector
                                    handleWidth
                                    handleHeight
                                    onResize={() => this.onResize()}
                                />
                                <PersistentElement className="Goban" elt={this.goban_div} />
                            </div>
                        )}

                        {this.frag_below_board_controls()}

                        {((this.state.view_mode === "square" && !this.state.squashed) || null) &&
                            CHAT}

                        {((this.state.view_mode === "portrait" && !this.state.zen_mode) || null) &&
                            this.frag_ai_review()}

                        {(this.state.view_mode === "portrait" || null) &&
                            (review ? this.frag_review_controls() : this.frag_play_controls(false))}

                        {((this.state.view_mode === "portrait" &&
                            !this.state.zen_mode) /* && this.state.portrait_tab === 'chat' */ ||
                            null) &&
                            CHAT}

                        {((this.state.view_mode === "portrait" &&
                            !this.state.zen_mode /* && this.state.portrait_tab === 'chat' */ &&
                            this.state.user_is_player &&
                            this.state.phase !== "finished") ||
                            null) &&
                            this.frag_cancel_button()}

                        {((this.state.view_mode === "portrait" &&
                            !this.state.zen_mode &&
                            this.state.portrait_tab === "game") ||
                            null) &&
                            this.frag_dock()}
                    </div>

                    {(this.state.view_mode !== "portrait" || null) && (
                        <div className="right-col">
                            {(this.state.zen_mode || null) && (
                                <div className="align-col-start"></div>
                            )}
                            {(this.state.view_mode === "square" ||
                                this.state.view_mode === "wide" ||
                                null) &&
                                this.frag_players()}

                            {(this.state.view_mode === "square" ||
                                this.state.view_mode === "wide" ||
                                null) &&
                                !this.state.zen_mode &&
                                this.frag_ai_review()}

                            {(this.state.view_mode === "square" ||
                                this.state.view_mode === "wide" ||
                                null) &&
                                this.state.show_game_timing &&
                                this.frag_timings()}

                            {review ? this.frag_review_controls() : this.frag_play_controls(true)}

                            {/*
                        <div className='filler'/>
                        */}
                            {(this.state.view_mode === "wide" || null) && CHAT}
                            {((this.state.view_mode === "square" && this.state.squashed) || null) &&
                                CHAT}
                            {((this.state.view_mode === "square" && this.state.squashed) || null) &&
                                CHAT}

                            {this.frag_dock()}
                            {(this.state.zen_mode || null) && <div className="align-col-end"></div>}
                        </div>
                    )}

                    <div className="align-row-end"></div>
                </div>
            </div>
        );
    }
    frag_cancel_button() {
        if (this.state.view_mode === "portrait") {
            return (
                <button className="bold cancel-button reject" onClick={this.cancelOrResign}>
                    {this.state.resign_text}
                </button>
            );
        } else {
            return (
                <button className="xs bold cancel-button" onClick={this.cancelOrResign}>
                    {this.state.resign_text}
                </button>
            );
        }
    }
    frag_play_buttons(show_cancel_button) {
        const state = this.state;

        return (
            <span className="play-buttons">
                <span>
                    {((state.cur_move_number >= 1 &&
                        state.player_not_to_move === data.get("user").id &&
                        !(this.goban.engine.undo_requested >= this.goban.engine.getMoveNumber()) &&
                        this.goban.submit_move == null) ||
                        null) && (
                        <button className="bold undo-button xs" onClick={this.undo}>
                            {_("Undo")}
                        </button>
                    )}
                    {state.show_undo_requested && (
                        <span>
                            {state.show_accept_undo && (
                                <button
                                    className="sm primary bold accept-undo-button"
                                    onClick={this.goban_acceptUndo}
                                >
                                    {_("Accept Undo")}
                                </button>
                            )}
                        </span>
                    )}
                </span>
                <span>
                    {((!state.show_submit &&
                        state.is_my_move &&
                        this.goban.engine.handicapMovesLeft() === 0) ||
                        null) && (
                        <button className="sm primary bold pass-button" onClick={this.pass}>
                            {_("Pass")}
                        </button>
                    )}
                    {((state.show_submit &&
                        this.goban.engine.undo_requested !== this.goban.engine.getMoveNumber()) ||
                        null) && (
                        <button
                            className="sm primary bold submit-button"
                            id="game-submit-move"
                            onClick={this.goban_submit_move}
                        >
                            {_("Submit Move")}
                        </button>
                    )}
                </span>
                <span>
                    {((show_cancel_button && state.user_is_player && state.phase !== "finished") ||
                        null) &&
                        this.frag_cancel_button()}
                </span>
            </span>
        );
    }

    variationKeyPress = (ev) => {
        if (ev.keyCode === 13) {
            this.shareAnalysis();
            return false;
        }
    };

    frag_play_controls(show_cancel_button) {
        const state = this.state;
        const user = data.get("user");

        if (!this.goban) {
            return null;
        }

        const user_is_active_player = [
            this.goban.engine.players.black.id,
            this.goban.engine.players.white.id,
        ].includes(user.id);

        return (
            <div className="play-controls">
                <div
                    ref={(el) => (this.ref_game_action_buttons = el)}
                    className="game-action-buttons"
                >
                    {/* { */}
                    {((state.mode === "play" &&
                        state.phase === "play" &&
                        state.cur_move_number >= state.official_move_number) ||
                        null) &&
                        this.frag_play_buttons(show_cancel_button)}
                    {/* (this.state.view_mode === 'portrait' || null) && <i onClick={this.togglePortraitTab} className={'tab-icon fa fa-commenting'}/> */}
                </div>
                {/* } */}
                <div ref={(el) => (this.ref_game_state_label = el)} className="game-state">
                    {/*{*/}
                    {((state.mode === "play" && state.phase === "play") || null) && (
                        <span>
                            {state.show_undo_requested ? (
                                <span>{_("Undo Requested")}</span>
                            ) : (
                                <span>
                                    {((state.show_title && !this.goban?.engine?.rengo) || null) && (
                                        <span>{state.title}</span>
                                    )}
                                </span>
                            )}
                        </span>
                    )}
                    {((state.mode === "play" && state.phase === "stone removal") || null) && (
                        <span>{_("Stone Removal Phase")}</span>
                    )}

                    {(state.mode === "analyze" || null) && (
                        <span>
                            {state.show_undo_requested ? (
                                <span>{_("Undo Requested")}</span>
                            ) : (
                                <span>{_("Analyze Mode")}</span>
                            )}
                        </span>
                    )}

                    {(state.mode === "conditional" || null) && (
                        <span>{_("Conditional Move Planner")}</span>
                    )}

                    {(state.mode === "score estimation" || null) && this.frag_estimate_score()}

                    {((state.mode === "play" && state.phase === "finished") || null) && (
                        <span style={{ textDecoration: state.annulled ? "line-through" : "none" }}>
                            {state.winner
                                ? interpolate(
                                      pgettext("Game winner", "{{color}} wins by {{outcome}}"),
                                      {
                                          // When is winner an id?
                                          color:
                                              (state.winner as any) ===
                                                  this.goban.engine.players.black.id ||
                                              state.winner === "black"
                                                  ? _("Black")
                                                  : _("White"),
                                          outcome: getOutcomeTranslation(this.goban.engine.outcome),
                                      },
                                  )
                                : interpolate(pgettext("Game winner", "Tie by {{outcome}}"), {
                                      outcome: pgettext("Game outcome", this.goban.engine.outcome),
                                  })}
                        </span>
                    )}
                </div>
                <div className="annulled-indicator">
                    {state.annulled &&
                        pgettext(
                            "Displayed to the user when the game is annulled",
                            "Game Annulled",
                        )}
                </div>
                {/* } */}
                {((state.phase === "play" &&
                    state.mode === "play" &&
                    this.state.paused &&
                    this.goban.pause_control &&
                    this.goban.pause_control.paused) ||
                    null) /* { */ && (
                    <div className="pause-controls">
                        <h3>{_("Game Paused")}</h3>
                        {(this.state.user_is_player || user.is_moderator || null) && (
                            <button className="info" onClick={this.goban_resumeGame}>
                                {_("Resume")}
                            </button>
                        )}
                        <div>
                            {this.goban.engine.players.black.id ===
                            this.goban.pause_control.paused.pausing_player_id
                                ? interpolate(_("{{pauses_left}} pauses left for Black"), {
                                      pauses_left: this.goban.pause_control.paused.pauses_left,
                                  })
                                : interpolate(_("{{pauses_left}} pauses left for White"), {
                                      pauses_left: this.goban.pause_control.paused.pauses_left,
                                  })}
                        </div>
                    </div>
                )}

                {((this.goban.pause_control &&
                    this.goban.pause_control.moderator_paused &&
                    user.is_moderator) ||
                    null) /* { */ && (
                    <div className="pause-controls">
                        <h3>{_("Paused by Moderator")}</h3>
                        <button className="info" onClick={this.goban_resumeGame}>
                            {_("Resume")}
                        </button>
                    </div>
                )}
                {(this.state.phase === "finished" || null) /* { */ && (
                    <div className="analyze-mode-buttons">
                        {" "}
                        {/* not really analyze mode, but equivalent button position and look*/}
                        {((this.state.user_is_player &&
                            this.state.mode !== "score estimation" &&
                            !this.goban.engine.rengo) ||
                            null) && (
                            <button onClick={this.rematch} className="primary">
                                {_("Rematch")}
                            </button>
                        )}
                        {(this.state.review_list.length > 0 || null) && (
                            <div className="review-list">
                                <h3>{_("Reviews")}</h3>
                                {this.state.review_list.map((review, idx) => (
                                    <div key={idx}>
                                        <Player user={review.owner} icon></Player> -{" "}
                                        <Link to={`/review/${review.id}`}>{_("view")}</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(this.return_url || null) && (
                            <div className="return-url">
                                <a href={this.return_url} rel="noopener">
                                    {interpolate(
                                        pgettext(
                                            "Link to where the user came from",
                                            "Return to {{url}}",
                                        ),
                                        {
                                            url: this.return_url,
                                        },
                                    )}
                                </a>
                            </div>
                        )}
                    </div>
                )}
                {/* } */}
                {(this.state.phase === "stone removal" || null) /* { */ && (
                    <div className="stone-removal-controls">
                        <div>
                            {(user_is_active_player || user.is_moderator || null) && ( // moderators see the button, with its timer, but can't press it
                                <button
                                    id="game-stone-removal-accept"
                                    className={
                                        user.is_moderator && !user_is_active_player ? "" : "primary"
                                    }
                                    disabled={user.is_moderator && !user_is_active_player}
                                    onClick={this.onStoneRemovalAccept}
                                >
                                    {_("Accept removed stones")}
                                    <Clock goban={this.goban} color="stone-removal" />
                                </button>
                            )}
                        </div>
                        <br />
                        <div style={{ textAlign: "center" }}>
                            <div style={{ textAlign: "left", display: "inline-block" }}>
                                <div>
                                    {(this.state.black_accepted || null) && (
                                        <i
                                            className="fa fa-check"
                                            style={{ color: "green", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {(!this.state.black_accepted || null) && (
                                        <i
                                            className="fa fa-times"
                                            style={{ color: "red", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {this.goban.engine.players.black.username}
                                </div>
                                <div>
                                    {(this.state.white_accepted || null) && (
                                        <i
                                            className="fa fa-check"
                                            style={{ color: "green", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {(!this.state.white_accepted || null) && (
                                        <i
                                            className="fa fa-times"
                                            style={{ color: "red", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {this.goban.engine.players.white.username}
                                </div>
                            </div>
                        </div>
                        <br />

                        <div style={{ textAlign: "center" }}>
                            {(this.state.user_is_player || null) && (
                                <button
                                    id="game-stone-removal-auto-score"
                                    onClick={this.onStoneRemovalAutoScore}
                                >
                                    {_("Auto-score")}
                                </button>
                            )}
                        </div>
                        <div style={{ textAlign: "center" }}>
                            {(this.state.user_is_player || null) && (
                                <button
                                    id="game-stone-removal-cancel"
                                    onClick={this.onStoneRemovalCancel}
                                >
                                    {_("Cancel and resume game")}
                                </button>
                            )}
                        </div>

                        <div className="explanation">
                            {_(
                                "In this phase, both players select and agree upon which groups should be considered captured and should be removed for the purposes of scoring.",
                            )}
                        </div>
                        {/*
                       <i id='scoring-help' className='fa fa-question-circle'
                          popover='${_("Mark dead stones by clicking them. Mark dame by clicking the empty intersection. Holding down shift while selecting an intersection or stone will toggle only that selection.")|h}'
                          popover-title='${_("Stone Removal")|h}'
                          popover-trigger="mouseenter"
                          popover-placement="left"
                       ></i>
                       */}

                        {null /* just going to disable this for now, no one cares I don't think */ &&
                            (this.state.rules === "japanese" ||
                                this.state.rules === "korean" ||
                                null) && (
                                <div
                                    style={{
                                        paddingTop: "2rem",
                                        paddingBottom: "2rem",
                                        textAlign: "center",
                                    }}
                                >
                                    {/*
                               <i id='strict-scoring-help' className='fa fa-question-circle'
                                  popover="${_('Official Japanese and Korean rules do not count territory in seki, which means players need to fill out or mark dame for most territory to be counted correctly. Most of the time this rule doesn\'t affect the game and is just a nuisance, but you can enable being strict about this rule if it makes a difference in your game.')|h}"
                                  popover-title='${pgettext("Enable Japanese territory in seki rule", "Strict Scoring")|h}'
                                  popover-trigger="mouseenter"
                                  popover-placement="left"
                               ></i>
                               */}
                                    <label
                                        style={{ display: "inline-block" }}
                                        htmlFor="strict-seki-mode"
                                    >
                                        {pgettext(
                                            "Enable Japanese territory in seki rule",
                                            "Strict Scoring",
                                        )}
                                    </label>
                                    <input
                                        style={{ marginTop: "-0.2em" }}
                                        name="strict-seki-mode"
                                        type="checkbox"
                                        checked={this.state.strict_seki_mode}
                                        disabled={!this.state.user_is_player}
                                        onChange={this.setStrictSekiMode}
                                    ></input>
                                </div>
                            )}
                    </div>
                )}
                {/* } */}
                {(this.state.mode === "conditional" || null) /* { */ && (
                    <div className="conditional-move-planner">
                        <div className="buttons">
                            <button className="primary" onClick={this.acceptConditionalMoves}>
                                {_("Accept Conditional moves")}
                            </button>
                            <button onClick={this.goban_setMode_play}>{_("Cancel")}</button>
                        </div>
                        <div className="ctrl-conditional-tree">
                            <hr />
                            <span
                                className="move-current"
                                onClick={this.goban_jumpToLastOfficialMove}
                            >
                                {_("Current Move")}
                            </span>
                            <PersistentElement elt={this.conditional_move_tree} />
                        </div>
                    </div>
                )}
                {/* } */}
                {(this.state.mode === "analyze" || null) /* { */ && (
                    <div>
                        {this.frag_analyze_button_bar()}

                        <Resizable
                            id="move-tree-container"
                            className="vertically-resizable"
                            ref={this.setMoveTreeContainer}
                        />

                        {(!this.state.zen_mode || null) && (
                            <div style={{ padding: "0.5em" }}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className={`form-control ${this.state.chat_log}`}
                                        placeholder={_("Variation name...")}
                                        value={this.state.variation_name}
                                        onChange={this.updateVariationName}
                                        onKeyDown={this.variationKeyPress}
                                        disabled={user.anonymous}
                                    />
                                    {(this.state.chat_log !== "malkovich" || null) && (
                                        <button
                                            className="sm"
                                            type="button"
                                            disabled={user.anonymous}
                                            onClick={this.shareAnalysis}
                                        >
                                            {_("Share")}
                                        </button>
                                    )}
                                    {(this.state.chat_log === "malkovich" || null) && (
                                        <button
                                            className="sm malkovich"
                                            type="button"
                                            disabled={user.anonymous}
                                            onClick={this.shareAnalysis}
                                        >
                                            {_("Record")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* } */}
                {((state.mode === "play" &&
                    state.phase === "play" &&
                    this.goban.isAnalysisDisabled() &&
                    state.cur_move_number < state.official_move_number) ||
                    null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button
                                className="sm primary bold"
                                onClick={this.goban_setModeDeferredPlay}
                            >
                                {_("Back to Game")}
                            </button>
                        </span>
                    </div>
                )}
                {(state.mode === "score estimation" || null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button className="sm primary bold" onClick={this.stopEstimatingScore}>
                                {_("Back to Board")}
                            </button>
                        </span>
                    </div>
                )}
            </div>
        );
    }
    frag_review_controls() {
        const user = data.get("user");

        if (!this.goban) {
            return null;
        }

        return (
            <div className="play-controls">
                <div ref={(el) => (this.ref_game_state_label = el)} className="game-state">
                    {(this.state.mode === "analyze" || null) && (
                        <div>
                            {_("Review by")}: <Player user={this.state.review_owner_id} />
                            {((this.state.review_controller_id &&
                                this.state.review_controller_id !== this.state.review_owner_id) ||
                                null) && (
                                <div>
                                    {_("Review controller")}:{" "}
                                    <Player user={this.state.review_controller_id} />
                                </div>
                            )}
                        </div>
                    )}

                    {(this.state.mode === "score estimation" || null) && (
                        <div>{this.frag_estimate_score()}</div>
                    )}
                </div>
                {(this.state.mode === "analyze" || null) && (
                    <div>
                        {this.frag_analyze_button_bar()}

                        <div className="space-around">
                            {this.state.review_controller_id &&
                                this.state.review_controller_id !== user.id &&
                                this.state.review_out_of_sync && (
                                    <button className="sm" onClick={this.syncToCurrentReviewMove}>
                                        {pgettext("Synchronize to current review position", "Sync")}{" "}
                                        <i className="fa fa-refresh" />
                                    </button>
                                )}
                        </div>

                        <Resizable
                            id="move-tree-container"
                            className="vertically-resizable"
                            ref={this.setMoveTreeContainer}
                        />

                        <div style={{ paddingLeft: "0.5em", paddingRight: "0.5em" }}>
                            <textarea
                                id="game-move-node-text"
                                placeholder={_("Move comments...")}
                                rows={5}
                                className="form-control"
                                value={this.state.move_text}
                                disabled={this.state.review_controller_id !== data.get("user").id}
                                onChange={this.updateMoveText}
                            ></textarea>
                        </div>

                        <div style={{ padding: "0.5em" }}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className={`form-control ${this.state.chat_log}`}
                                    placeholder={_("Variation name...")}
                                    value={this.state.variation_name}
                                    onChange={this.updateVariationName}
                                    onKeyDown={this.variationKeyPress}
                                    disabled={user.anonymous}
                                />
                                <button
                                    className="sm"
                                    type="button"
                                    disabled={user.anonymous}
                                    onClick={this.shareAnalysis}
                                >
                                    {_("Share")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {(this.state.mode === "score estimation" || null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button className="sm primary bold" onClick={this.stopEstimatingScore}>
                                {_("Back to Review")}
                            </button>
                        </span>
                    </div>
                )}
            </div>
        );
    }
    frag_estimate_score() {
        return (
            <span>
                {(this.state.score_estimate.winner || null) && (
                    <span>
                        {interpolate(_("{{winner}} by {{score}}"), {
                            winner: this.goban.score_estimate.winner,
                            score: this.goban.score_estimate.amount.toFixed(1),
                        })}
                    </span>
                )}
                {(!this.state.score_estimate.winner || null) && <span>{_("Estimating...")}</span>}
            </span>
        );
    }
    frag_analyze_button_bar() {
        const state = this.state;

        return (
            <div className="game-analyze-button-bar">
                {/*
            {(this.review_id || null) &&
                <i id='review-sync' className='fa fa-refresh {{goban.engine.cur_move.id !== goban.engine.cur_review_move.id ? "need-sync" : ""}}'
                    onClick={this.syncToCurrentReviewMove()} title={_("Sync to where the reviewer is at")}></i>
            }
            */}
                <div className="btn-group">
                    <button
                        onClick={this.set_analyze_tool.stone_alternate}
                        title={_("Place alternating stones")}
                        className={
                            "stone-button " +
                            (this.state.analyze_tool === "stone" &&
                            this.state.analyze_subtool !== "black" &&
                            this.state.analyze_subtool !== "white"
                                ? "active"
                                : "")
                        }
                    >
                        <img
                            alt="alternate"
                            src={data.get("config.cdn_release") + "/img/black-white.png"}
                        />
                    </button>

                    <button
                        onClick={this.set_analyze_tool.stone_black}
                        title={_("Place black stones")}
                        className={
                            "stone-button " +
                            (this.state.analyze_tool === "stone" &&
                            this.state.analyze_subtool === "black"
                                ? "active"
                                : "")
                        }
                    >
                        <img
                            alt="alternate"
                            src={data.get("config.cdn_release") + "/img/black.png"}
                        />
                    </button>

                    <button
                        onClick={this.set_analyze_tool.stone_white}
                        title={_("Place white stones")}
                        className={
                            "stone-button " +
                            (this.state.analyze_tool === "stone" &&
                            this.state.analyze_subtool === "white"
                                ? "active"
                                : "")
                        }
                    >
                        <img
                            alt="alternate"
                            src={data.get("config.cdn_release") + "/img/white.png"}
                        />
                    </button>
                </div>

                <div className="btn-group">
                    <button
                        onClick={this.set_analyze_tool.draw}
                        title={_("Draw on the board with a pen")}
                        className={this.state.analyze_tool === "draw" ? "active" : ""}
                    >
                        <i className="fa fa-pencil"></i>
                    </button>
                    <button onClick={this.clearAnalysisDrawing} title={_("Clear pen marks")}>
                        <i className="fa fa-eraser"></i>
                    </button>
                </div>
                <input
                    type="color"
                    value={this.state.analyze_pencil_color}
                    title={_("Select pen color")}
                    onChange={this.setPencilColor}
                />

                <div className="btn-group">
                    <button onClick={this.goban_copyBranch} title={_("Copy this branch")}>
                        <i className="fa fa-clone"></i>
                    </button>
                    <button
                        disabled={this.copied_node === null}
                        onClick={this.goban_pasteBranch}
                        title={_("Paste branch")}
                    >
                        <i className="fa fa-clipboard"></i>
                    </button>
                    <button onClick={this.goban_deleteBranch} title={_("Delete branch")}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>

                <div className="btn-group">
                    <button
                        onClick={this.set_analyze_tool.label_letters}
                        title={_("Place alphabetical labels")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "letters"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="fa fa-font"></i>
                    </button>
                    <button
                        onClick={this.set_analyze_tool.label_numbers}
                        title={_("Place numeric labels")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "numbers"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-number"></i>
                    </button>
                    <button
                        onClick={this.set_analyze_tool.label_triangle}
                        title={_("Place triangle marks")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "triangle"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-triangle"></i>
                    </button>
                    <button
                        onClick={this.set_analyze_tool.label_square}
                        title={_("Place square marks")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "square"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-square"></i>
                    </button>
                    <button
                        onClick={this.set_analyze_tool.label_circle}
                        title={_("Place circle marks")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "circle"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-circle"></i>
                    </button>
                    <button
                        onClick={this.set_analyze_tool.label_cross}
                        title={_("Place X marks")}
                        className={
                            this.state.analyze_tool === "label" &&
                            this.state.analyze_subtool === "cross"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-x"></i>
                    </button>
                </div>
                <div className="analyze-mode-buttons">
                    {(state.mode === "analyze" || null) && (
                        <span>
                            {(!this.review_id || null) && (
                                <button
                                    className="sm primary bold"
                                    onClick={this.goban_setModeDeferredPlay}
                                >
                                    {_("Back to Game")}
                                </button>
                            )}
                            <button
                                className="sm primary bold pass-button"
                                onClick={this.analysis_pass}
                            >
                                {_("Pass")}
                            </button>
                        </span>
                    )}
                </div>
            </div>
        );
    }

    frag_ai_review() {
        if (
            this.goban &&
            this.goban.engine &&
            this.goban.engine.phase === "finished" &&
            ((this.goban.engine.width === 19 && this.goban.engine.height === 19) ||
                (this.goban.engine.width === 13 && this.goban.engine.height === 13) ||
                (this.goban.engine.width === 9 && this.goban.engine.height === 9))
        ) {
            return (
                <AIReview
                    onAIReviewSelected={(r) => this.setState({ selected_ai_review_uuid: r?.uuid })}
                    game={this}
                    move={this.goban.engine.cur_move}
                    hidden={!this.state.ai_review_enabled}
                />
            );
        }
        return null;
    }

    frag_timings = () => {
        if (this.goban && this.goban.engine) {
            return (
                <GameTimings
                    moves={this.goban.engine.config.moves}
                    start_time={this.goban.engine.config.start_time}
                    end_time={this.goban.engine.config.end_time}
                    free_handicap_placement={this.goban.engine.config.free_handicap_placement}
                    handicap={this.goban.engine.config.handicap}
                    black_id={this.goban.engine.config.black_player_id}
                    white_id={this.goban.engine.config.white_player_id}
                />
            );
        }
        return null;
    };

    frag_num_captures_text(color) {
        const num_prisoners = this.state.score[color].prisoners;
        const prisoner_color = color === "black" ? "white" : "black";
        const prisoner_img_src = data.get("config.cdn_release") + "/img/" + prisoner_color + ".png";
        return (
            <div className={"captures" + (this.state.estimating_score ? " hidden" : "")}>
                <span className="num-captures-container">
                    <span className="num-captures-count">{num_prisoners}</span>
                    {(!this.state.zen_mode || null) && (
                        <span className="num-captures-units">
                            {` ${ngettext("capture", "captures", num_prisoners)}`}
                        </span>
                    )}
                    {(this.state.zen_mode || null) && (
                        <span className="num-captures-stone">
                            {" "}
                            <img className="stone-image" src={prisoner_img_src} />
                        </span>
                    )}
                </span>
            </div>
        );
    }

    frag_players() {
        const goban = this.goban;
        if (!goban) {
            return null;
        }
        const engine = goban.engine;

        return (
            <div ref={(el) => (this.ref_players = el)} className="players">
                <div className="player-icons">
                    {["black", "white"].map((color: "black" | "white", idx) => {
                        const player_bg: any = {};

                        // In rengo we always will have a player icon to show (after initialisation).
                        // In other cases, we only have one if `historical` is set
                        if (
                            engine.rengo &&
                            engine.players[color] &&
                            engine.players[color]["icon-url"]
                        ) {
                            const icon = icon_size_url(engine.players[color]["icon-url"], 64);
                            player_bg.backgroundImage = `url("${icon}")`;
                        } else if (this.state[`historical_${color}`]) {
                            const icon = icon_size_url(
                                this.state[`historical_${color}`]["icon"],
                                64,
                            );
                            player_bg.backgroundImage = `url("${icon}")`;
                        }

                        const their_turn = this.state.player_to_move === engine.players[color].id;

                        const highlight_their_turn = their_turn ? `their-turn` : "";

                        return (
                            <div
                                key={idx}
                                className={`${color} ${highlight_their_turn} player-container`}
                            >
                                <div className="player-icon-clock-row">
                                    {((engine.players[color] && engine.players[color].id) ||
                                        null) && (
                                        <div className="player-icon-container" style={player_bg}>
                                            {this.state[`${color}_auto_resign_expiration`] && (
                                                <div className={`auto-resign-overlay`}>
                                                    <i className="fa fa-bolt" />
                                                    <CountDown
                                                        to={
                                                            this.state[
                                                                `${color}_auto_resign_expiration`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            )}
                                            <div className="player-flag">
                                                <Flag country={engine.players[color].country} />
                                            </div>
                                            <ChatPresenceIndicator
                                                channel={
                                                    this.game_id
                                                        ? `game-${this.game_id}`
                                                        : `review-${this.review_id}`
                                                }
                                                userId={engine.players[color].id}
                                            />
                                        </div>
                                    )}

                                    {((goban.engine.phase !== "finished" && !goban.review_id) ||
                                        null) && (
                                        <Clock
                                            goban={this.goban}
                                            color={color}
                                            className="in-game-clock"
                                        />
                                    )}
                                </div>

                                {((goban.engine.players[color] &&
                                    goban.engine.players[color].rank !== -1) ||
                                    null) && (
                                    <div className={`${color} player-name-container`}>
                                        <Player
                                            user={
                                                (!engine.rengo &&
                                                    this.state[`historical_${color}`]) ||
                                                goban.engine.players[color]
                                            }
                                            disableCacheUpdate
                                        />
                                    </div>
                                )}

                                {(!goban.engine.players[color] || null) && (
                                    <span className="player-name-plain">
                                        {color === "black" ? _("Black") : _("White")}
                                    </span>
                                )}

                                <div
                                    className={
                                        "score-container " +
                                        (this.state.show_score_breakdown
                                            ? "show-score-breakdown"
                                            : "")
                                    }
                                    onClick={() =>
                                        this.state.show_score_breakdown
                                            ? this.hideScores()
                                            : this.popupScores()
                                    }
                                >
                                    {(goban.engine.phase === "finished" ||
                                        goban.engine.phase === "stone removal" ||
                                        null) &&
                                        goban.mode !== "analyze" &&
                                        goban.engine.outcome !== "Timeout" &&
                                        goban.engine.outcome !== "Resignation" &&
                                        goban.engine.outcome !== "Cancellation" && (
                                            <div
                                                className={
                                                    "points" +
                                                    (this.state.estimating_score ? " hidden" : "")
                                                }
                                            >
                                                {interpolate(_("{{total}} {{unit}}"), {
                                                    total: this.state.score[color].total,
                                                    unit: ngettext(
                                                        "point",
                                                        "points",
                                                        this.state.score[color].total,
                                                    ),
                                                })}
                                            </div>
                                        )}
                                    {((goban.engine.phase !== "finished" &&
                                        goban.engine.phase !== "stone removal") ||
                                        null ||
                                        goban.mode === "analyze" ||
                                        goban.engine.outcome === "Timeout" ||
                                        goban.engine.outcome === "Resignation" ||
                                        goban.engine.outcome === "Cancellation") &&
                                        this.frag_num_captures_text(color)}
                                    {((goban.engine.phase !== "finished" &&
                                        goban.engine.phase !== "stone removal") ||
                                        null ||
                                        goban.mode === "analyze" ||
                                        goban.engine.outcome === "Timeout" ||
                                        goban.engine.outcome === "Resignation" ||
                                        goban.engine.outcome === "Cancellation") && (
                                        <div className="komi">
                                            {this.state.score[color].komi === 0
                                                ? ""
                                                : `+ ${parseFloat(
                                                      this.state.score[color].komi as any,
                                                  ).toFixed(1)}`}
                                        </div>
                                    )}
                                    <div id={`${color}-score-details`} className="score-details" />
                                </div>
                                {(engine.rengo || null) && (
                                    <div
                                        className={
                                            "rengo-team-members player-name-container " + color
                                        }
                                        key={idx}
                                    >
                                        {engine.rengo_teams[color].slice(1).map((player, idx) => (
                                            <div className={"rengo-team-member"} key={idx}>
                                                {<Player user={player} icon rank />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {(engine.rengo || null) && (
                    <div className="rengo-header-block">
                        {((!this.review_id && this.state.show_title && this.goban?.engine?.rengo) ||
                            null) && <div className="game-state">{this.state.title}</div>}
                    </div>
                )}
            </div>
        );
    }

    frag_below_board_controls() {
        const goban = this.goban;

        if (this.state.view_mode === "portrait" && this.state.portrait_tab === "dock") {
            return (
                <div ref={(el) => (this.ref_action_bar = el)} className="action-bar">
                    <span className="move-number">
                        <i onClick={this.togglePortraitTab} className={"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }

        if (this.state.view_mode === "portrait" && this.state.portrait_tab === "chat") {
            return (
                <div ref={(el) => (this.ref_action_bar = el)} className="action-bar">
                    <span className="move-number">
                        <i onClick={this.togglePortraitTab} className={"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }
        return (
            <div ref={(el) => (this.ref_action_bar = el)} className="action-bar">
                <span className="icons" />
                <span className="controls">
                    <span onClick={this.nav_first} className="move-control">
                        <i className="fa fa-fast-backward"></i>
                    </span>
                    <span onClick={this.nav_prev_10} className="move-control">
                        <i className="fa fa-backward"></i>
                    </span>
                    <span onClick={this.nav_prev} className="move-control">
                        <i className="fa fa-step-backward"></i>
                    </span>
                    <span onClick={this.nav_play_pause} className="move-control">
                        <i
                            className={"fa " + (this.state.autoplaying ? "fa-pause" : "fa-play")}
                        ></i>
                    </span>
                    <span onClick={this.nav_next} className="move-control">
                        <i className="fa fa-step-forward"></i>
                    </span>
                    <span onClick={this.nav_next_10} className="move-control">
                        <i className="fa fa-forward"></i>
                    </span>
                    <span onClick={this.nav_last} className="move-control">
                        <i className="fa fa-fast-forward"></i>
                    </span>
                </span>

                {(this.state.view_mode !== "portrait" || null) && (
                    <span className="move-number">
                        {interpolate(_("Move {{move_number}}"), {
                            move_number: goban && this.goban.engine.getMoveNumber(),
                        })}
                    </span>
                )}
            </div>
        );
    }

    frag_dock() {
        const goban = this.goban;
        let superuser_ai_review_ready =
            (goban && data.get("user").is_superuser && goban.engine.phase === "finished") || null;
        let mod =
            (goban && data.get("user").is_moderator && goban.engine.phase !== "finished") || null;
        let annul =
            (goban && data.get("user").is_moderator && goban.engine.phase === "finished") || null;
        const annulable = (goban && !this.state.annulled && goban.engine.config.ranked) || null;
        const unannulable = (goban && this.state.annulled && goban.engine.config.ranked) || null;

        const review = !!this.review_id || null;
        const game = !!this.game_id || null;
        if (review) {
            superuser_ai_review_ready = null;
            mod = null;
            annul = null;
        }

        let game_id = null;
        let sgf_download_enabled = false;
        try {
            sgf_download_enabled =
                this.goban.engine.phase === "finished" || !this.goban.isAnalysisDisabled(true);
            game_id = this.goban.engine.config.game_id;
        } catch (e) {
            // ignore error
        }

        let sgf_url = null;
        let sgf_with_comments_url = null;
        let sgf_with_ai_review_url = null;
        if (this.game_id) {
            sgf_url = api1(`games/${this.game_id}/sgf`);
            if (this.state.selected_ai_review_uuid) {
                sgf_with_ai_review_url = api1(
                    `games/${this.game_id}/sgf?ai_review=${this.state.selected_ai_review_uuid}`,
                );
            }
        } else {
            sgf_url = api1(`reviews/${this.review_id}/sgf?without-comments=1`);
            sgf_with_comments_url = api1(`reviews/${this.review_id}/sgf`);
        }

        return (
            <Dock>
                {(this.tournament_id || null) && (
                    <Link className="plain" to={`/tournament/${this.tournament_id}`}>
                        <i className="fa fa-trophy" title={_("This is a tournament game")} />{" "}
                        {_("Tournament")}
                    </Link>
                )}
                {(this.ladder_id || null) && (
                    <Link className="plain" to={`/ladder/${this.ladder_id}`}>
                        <i className="fa fa-trophy" title={_("This is a ladder game")} />{" "}
                        {_("Ladder")}
                    </Link>
                )}
                {((this.goban && this.goban.engine.config["private"]) || null) && (
                    <a onClick={this.openACL}>
                        <i className="fa fa-lock" />{" "}
                        {pgettext("Control who can access the game or review", "Access settings")}
                    </a>
                )}

                <a>
                    <i
                        className={
                            "fa volume-icon " +
                            (this.state.volume === 0
                                ? "fa-volume-off"
                                : this.state.volume > 0.5
                                ? "fa-volume-up"
                                : "fa-volume-down")
                        }
                        onClick={this.toggleVolume}
                    />{" "}
                    <input
                        type="range"
                        className="volume-slider"
                        onChange={this.setVolume}
                        value={this.state.volume}
                        min={0}
                        max={1.0}
                        step={0.01}
                    />
                </a>

                <a onClick={this.toggleZenMode}>
                    <i className="ogs-zen-mode"></i> {_("Zen mode")}
                </a>
                <a onClick={this.toggleCoordinates}>
                    <i className="ogs-coordinates"></i> {_("Toggle coordinates")}
                </a>
                {game && (
                    <a onClick={this.toggleAIReview}>
                        <i className="fa fa-desktop"></i>{" "}
                        {this.state.ai_review_enabled
                            ? _("Disable AI review")
                            : _("Enable AI review")}
                    </a>
                )}
                <a onClick={this.showGameInfo}>
                    <i className="fa fa-info"></i> {_("Game information")}
                </a>
                {game && (
                    <a
                        onClick={this.gameAnalyze}
                        className={
                            goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled()
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-sitemap"></i> {_("Analyze game")}
                    </a>
                )}
                {((goban && this.state.user_is_player && goban.engine.phase !== "finished") ||
                    null) && (
                    <a
                        style={{
                            visibility:
                                goban.mode === "play" &&
                                goban &&
                                goban.engine.playerToMove() !== data.get("user").id
                                    ? "visible"
                                    : "hidden",
                        }}
                        className={
                            goban &&
                            goban.engine.phase !== "finished" &&
                            (goban.isAnalysisDisabled() || goban.engine.rengo)
                                ? "disabled"
                                : ""
                        }
                        onClick={this.enterConditionalMovePlanner}
                    >
                        <i className="fa fa-exchange"></i> {_("Plan conditional moves")}
                    </a>
                )}
                {((goban &&
                    (this.state.user_is_player || mod) &&
                    goban.engine.phase !== "finished") ||
                    null) && (
                    <a onClick={this.pauseGame}>
                        <i className="fa fa-pause"></i> {_("Pause game")}
                    </a>
                )}
                {game && (
                    <a
                        onClick={this.startReview}
                        className={
                            goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled()
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-refresh"></i> {_("Review this game")}
                    </a>
                )}
                <a
                    onClick={this.estimateScore}
                    className={
                        goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled()
                            ? "disabled"
                            : ""
                    }
                >
                    <i className="fa fa-tachometer"></i> {_("Estimate score")}
                </a>
                <a onClick={this.fork} className={goban?.engine.rengo ? "disabled" : ""}>
                    <i className="fa fa-code-fork"></i> {_("Fork game")}
                </a>
                <a onClick={this.alertModerator}>
                    <i className="fa fa-exclamation-triangle"></i> {_("Call moderator")}
                </a>
                {((review && game_id) || null) && (
                    <Link to={`/game/${game_id}`}>
                        <i className="ogs-goban" /> {_("Original game")}
                    </Link>
                )}
                <a onClick={this.showLinkModal}>
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
                    <a onClick={this.decide_black}>
                        <i className="fa fa-gavel"></i> {_("Black Wins")}
                    </a>
                )}
                {mod && (
                    <a onClick={this.decide_white}>
                        <i className="fa fa-gavel"></i> {_("White Wins")}
                    </a>
                )}
                {mod && (
                    <a onClick={this.decide_tie}>
                        <i className="fa fa-gavel"></i> {_("Tie")}
                    </a>
                )}
                {mod && (
                    <a onClick={this.force_autoscore}>
                        <i className="fa fa-gavel"></i> {_("Auto-score")}
                    </a>
                )}

                {
                    annul && annulable && (
                        <a onClick={() => this.annul(true)}>
                            <i className="fa fa-gavel"></i> {_("Annul")}
                        </a>
                    ) /* mod can annul this game */
                }
                {
                    annul &&
                        unannulable && (
                            <a onClick={() => this.annul(false)}>
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
                    <a onClick={this.toggleShowTiming}>
                        <i className="fa fa-clock-o"></i> {_("Timing")}
                    </a>
                )}
                {(mod || annul) && (
                    <a onClick={this.showLogModal}>
                        <i className="fa fa-list-alt"></i> {"Log"}
                    </a>
                )}
                {(mod || annul) && (
                    <a onClick={this.toggleAnonymousModerator}>
                        <i className="fa fa-user-secret"></i> {"Cloak of Invisibility"}
                    </a>
                )}

                {superuser_ai_review_ready && <hr />}
                {superuser_ai_review_ready && (
                    <a onClick={() => this.force_ai_review("fast")}>
                        <i className="fa fa-line-chart"></i> {"Fast AI Review"}
                    </a>
                )}
                {superuser_ai_review_ready && (
                    <a onClick={() => this.force_ai_review("full")}>
                        <i className="fa fa-area-chart"></i> {_("Full AI Review")}
                    </a>
                )}
                {superuser_ai_review_ready && (
                    <a onClick={this.delete_ai_reviews}>
                        <i className="fa fa-trash"></i> {"Delete AI reviews"}
                    </a>
                )}
            </Dock>
        );
    }
    frag_kb_shortcuts() {
        const goban = this.goban;

        return (
            <div>
                {(this.game_id > 0 || null) && (
                    <UIPush
                        event="review-added"
                        channel={`game-${this.game_id}`}
                        action={this.reviewAdded}
                    />
                )}
                <KBShortcut shortcut="up" action={this.nav_up} />
                <KBShortcut shortcut="down" action={this.nav_down} />
                <KBShortcut shortcut="left" action={this.nav_prev} />
                <KBShortcut shortcut="right" action={this.nav_next} />
                <KBShortcut shortcut="page-up" action={this.nav_prev_10} />
                <KBShortcut shortcut="page-down" action={this.nav_next_10} />
                <KBShortcut shortcut="space" action={this.nav_play_pause} />
                <KBShortcut shortcut="home" action={this.nav_first} />
                <KBShortcut shortcut="end" action={this.nav_last} />
                <KBShortcut shortcut="escape" action={this.handleEscapeKey} />
                <KBShortcut shortcut="f1" action={this.set_analyze_tool.stone_null} />
                <KBShortcut shortcut="f2" action={this.set_analyze_tool.stone_black} />
                {/* <KBShortcut shortcut='f3' action='console.log("Should be entering scoring mode");'></KBShortcut> */}
                <KBShortcut shortcut="f4" action={this.set_analyze_tool.label_triangle} />
                <KBShortcut shortcut="f5" action={this.set_analyze_tool.label_square} />
                <KBShortcut shortcut="f6" action={this.set_analyze_tool.label_circle} />
                <KBShortcut shortcut="f7" action={this.set_analyze_tool.label_letters} />
                <KBShortcut shortcut="f8" action={this.set_analyze_tool.label_numbers} />
                <KBShortcut shortcut="ctrl-c" action={this.goban_copyBranch} />
                <KBShortcut shortcut="ctrl-v" action={this.goban_pasteBranch} />
                <KBShortcut shortcut="f9" action={this.set_analyze_tool.draw} />
                {((goban && goban.mode === "analyze") || null) && (
                    <KBShortcut shortcut="f10" action={this.set_analyze_tool.clear_and_sync} />
                )}
                <KBShortcut shortcut="del" action={this.set_analyze_tool.delete_branch} />
                <KBShortcut shortcut="shift-z" action={this.toggleZenMode} />
                <KBShortcut shortcut="shift-c" action={this.toggleCoordinates} />
                <KBShortcut shortcut="shift-i" action={this.toggleAIReview} />
                <KBShortcut shortcut="shift-a" action={this.gameAnalyze} />
                <KBShortcut shortcut="shift-r" action={this.startReview} />
                <KBShortcut shortcut="shift-e" action={this.estimateScore} />
                <KBShortcut shortcut="shift-p" action={this.goban_setModeDeferredPlay} />
            </div>
        );
    }

    renderExtraPlayerActions = (player_id: number) => {
        const user = data.get("user");
        if (
            this.review_id &&
            this.goban &&
            (this.goban.review_controller_id === user.id || this.goban.review_owner_id === user.id)
        ) {
            let is_owner = null;
            let is_controller = null;
            if (this.goban.review_owner_id === player_id) {
                is_owner = (
                    <div style={{ fontStyle: "italic" }}>
                        {_("Owner") /* translators: Review owner */}
                    </div>
                );
            }
            if (this.goban.review_controller_id === player_id) {
                is_controller = (
                    <div style={{ fontStyle: "italic" }}>
                        {_("Controller") /* translators: Review controller */}
                    </div>
                );
            }

            const give_control = (
                <button
                    className="xs"
                    onClick={() => {
                        this.goban.giveReviewControl(player_id);
                        close_all_popovers();
                    }}
                >
                    {_("Give Control") /* translators: Give control in review or on a demo board */}
                </button>
            );

            if (player_id === this.goban.review_owner_id) {
                return (
                    <div>
                        {is_owner}
                        {is_controller}
                        <div className="actions">{give_control}</div>
                    </div>
                );
            }

            return (
                <div>
                    {is_owner}
                    {is_controller}
                    <div className="actions">{give_control}</div>
                </div>
            );
        }
        return null;
    };
    setMoveTreeContainer = (resizable: Resizable): void => {
        this.ref_move_tree_container = resizable ? resizable.div : null;
        if (this.goban) {
            (this.goban as GobanCanvas).setMoveTreeContainer(this.ref_move_tree_container);
        }
    };
}

export function goban_view_mode(bar_width?: number): ViewMode {
    if (!bar_width) {
        bar_width = 300;
    }

    const h = win.height() || 1;
    const w = win.width() || 1;
    const aspect_ratio = w / h;

    if ((aspect_ratio <= 0.8 || w < bar_width * 2) && w < 1280) {
        return "portrait";
    }

    if (aspect_ratio >= 1920 / 1200 && w >= 1280) {
        return "wide";
    }

    return "wide";
}
export function goban_view_squashed(): boolean {
    /* This value needs to match the "dock-inline-height" found in Dock.styl */
    return win.height() <= 500;
}

const shared_ip_with_player_map: { [game_id: number]: boolean } = {};

termination_socket.on(
    "score-estimator-enabled-state",
    (state: { game_id: number; shared_ip_with_player: boolean }) => {
        shared_ip_with_player_map[state.game_id] = state.shared_ip_with_player;
    },
);
