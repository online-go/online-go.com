/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import {_, ngettext, pgettext, interpolate} from "translate";
import {post, get, api1} from "requests";
import {KBShortcut} from "KBShortcut";
import {UIPush} from "UIPush";
import {alertModerator, errorAlerter, ignore, getOutcomeTranslation} from "misc";
import {LineText} from "misc-ui";
import {challengeFromBoardPosition, challengeRematch} from "ChallengeModal";
import {Goban, GoEngine, GoMath, MoveTree} from "goban";
import {isLiveGame} from "TimeControl";
import {termination_socket, get_network_latency, get_clock_drift} from "sockets";
import {Dock} from "Dock";
import {Player, setExtraActionCallback} from "Player";
import {Flag} from "Flag";
import * as player_cache from "player_cache";
import {icon_size_url} from "PlayerIcon";
import {profanity_filter} from "profanity_filter";
import {notification_manager} from "Notifications";
import {PersistentElement} from "PersistentElement";
import {close_all_popovers} from "popover";
import {Resizable} from "Resizable";
import {TabCompleteInput} from "TabCompleteInput";
import {ChatUserList, ChatUserCount} from "ChatUserList";
import {ChatPresenceIndicator} from "ChatPresenceIndicator";
import {chat_manager} from "chat_manager";
import {openGameInfoModal} from "./GameInfoModal";
import {openGameLinkModal} from "./GameLinkModal";
import {VoiceChat} from "VoiceChat";
import {openACLModal} from "./ACLModal";
import {sfx} from "ogs-goban/SFXManager";
import {AdUnit, should_show_ads, refresh_ads} from "AdUnit";
import * as moment from "moment";

declare var swal;

let Perf = (React as any).addons ? (React as any).addons.Perf : null;
window["Perf"] = Perf;

let win = $(window);
let active_game_view = null;

interface GameProperties {
    match: {
        params: {
            game_id?: string,
            review_id?: string,
        }
    };
}

interface GameChatProperties {
    chatlog: Array<any>;
    gameview: Game;
    userIsPlayer: boolean;
    onChatLogChanged: (c) => void;
    channel: string;
}

interface GameChatLineProperties {
    line: any;
    lastline: any;
    gameview: Game;
}

/* TODO: Implement giving voice and control over to players in Reviews */
/* TODO: Implement mobile interface for reviews */


export type ViewMode = "portrait"|"wide"|"square"|"zen";
type AdClass = 'no-ads' | 'block' | 'goban-banner' | 'outer-banner' | 'mobile-banner';

export class Game extends React.PureComponent<GameProperties, any> {
    ref_goban;
    ref_goban_container;
    ref_players;
    ref_action_bar;
    ref_game_action_buttons;
    ref_game_state_label;
    ref_chat;

    game_id: number;
    creator_id: number;
    ladder_id: number;
    tournament_id: number;
    review_id: number;
    goban_div: any;
    white_clock: any;
    black_clock: any;
    goban: Goban;
    resize_debounce: any = null;
    set_analyze_tool: any = {};
    score_popups: any = { };
    ad: HTMLElement;
    ad_class: AdClass = null;
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

    decide_white: () => void;
    decide_black: () => void;
    decide_tie: () => void;

    constructor(props) { /* {{{ */
        super(props);
        window["Game"] = this;

        this.game_id = this.props.match.params.game_id ? parseInt(this.props.match.params.game_id) : 0;
        this.review_id = this.props.match.params.review_id ? parseInt(this.props.match.params.review_id) : 0;
        this.state = {
            view_mode: false,
            squashed: goban_view_squashed(),
            undo_requested: false,
            estimating_score: false,
            analyze_pencil_color: "#8DDD3C",
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
            volume: preferences.get("sound-volume"),
            historical_black: null,
            historical_white: null,
            annulled: false,
            black_auto_resign_expiration: null,
            white_auto_resign_expiration: null,
        };

        (this.state as any).view_mode = this.computeViewMode(); /* needs to access this.state.zen_mode, so can't be set above */

        this.conditional_move_tree = $("<div class='conditional-move-tree-container'/>")[0];
        this.goban_div = $("<div class='Goban'>");
        this.white_clock = $("<div class='Goban'>");
        this.black_clock = $("<div class='Goban'>");
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
            draw: () => { this.setAnalyzeTool("draw", this.state.analyze_pencil_color); },
            clear_and_sync: () => { this.goban.syncReviewMove({"clearpen": true}); this.goban.clearAnalysisDrawing(); },
            delete_branch: () => { this.goban_deleteBranch(); },
        };
        this.score_popups = {
            popup_black: this.popupScores.bind(this, "black"),
            popup_white: this.popupScores.bind(this, "white"),
            hide_black: this.hideScores.bind(this, "black"),
            hide_white: this.hideScores.bind(this, "white"),
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
        this.goban_deleteBranch = this.goban_deleteBranch.bind(this);
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
    } /* }}}  */
    componentWillMount() {{{
        active_game_view = this;
        setExtraActionCallback(this.renderExtraPlayerActions);
        $(window).on("focus", this.onFocus);
    }}}
    componentWillReceiveProps(nextProps) {{{
        if (
            this.props.match.params.game_id !== nextProps.match.params.game_id ||
            this.props.match.params.review_id !== nextProps.match.params.review_id
        ) {
            this.deinitialize();
            this.goban_div.empty();

            refresh_ads(true);

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

            this.game_id = nextProps.match.params.game_id ? parseInt(nextProps.match.params.game_id) : 0;
            this.review_id = nextProps.match.params.review_id ? parseInt(nextProps.match.params.review_id) : 0;
            this.sync_state();
        } else {
            console.log("componentWillReceiveProps called with same game id: ", this.props, nextProps);
        }
    }}}
    componentDidUpdate(prevProps, prevState) {{{
        if (
            this.props.match.params.game_id !== prevProps.match.params.game_id ||
            this.props.match.params.review_id !== prevProps.match.params.review_id
        ) {
            this.initialize();
            this.sync_state();
        }
        this.onResize();
    }}}
    componentDidMount() {{{
        this.initialize();
        if (this.computeViewMode() === "portrait") {
            this.ref_goban_container.style.minHeight = `${screen.width}px`;
        } else {
            this.ref_goban_container.style.minHeight = `initial`;
        }
        this.onResize();
    }}}
    componentWillUnmount() {{{
        sfx.volume_override = null;
        this.deinitialize();
        active_game_view = null;
        setExtraActionCallback(null);
        $(window).off("focus", this.onFocus);
        window.document.title = "OGS";
    }}}
    deinitialize() {{{
        this.chat_proxy.part();
        this.chat_log = [];
        this.creator_id = null;
        this.ladder_id = null;
        this.tournament_id = null;
        $(window).off("resize", this.onResize as () => void);
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
    }}}
    onFocus = () => {{{
        if (this.goban && this.goban.engine) {
            this.last_move_viewed = this.goban.engine.getMoveNumber();
        }
        window.document.title = this.on_refocus_title;
    }}}
    initialize() {{{
        this.chat_proxy = this.game_id
            ? chat_manager.join(`game-${this.game_id}`, interpolate(_("Game {{number}}"), {"number": this.game_id}))
            : chat_manager.join(`review-${this.review_id}`, interpolate(_("Review {{number}}"), {"number": this.review_id}));
        $(window).on("resize", this.onResize as () => void);
        $(document).on("keypress", this.setLabelHandler);
        //chat_handlers = goban_chat_initialize($scope);
        //let live_suffix = (game.time_per_move || 86400) < (30*60) ? "-live" : "";
        //let label_position = $.jStorage.get("go.settings.label-position", "all");
        let label_position = preferences.get("label-positioning");
        let opts: any = {
            "board_div": this.goban_div,
            //"title_div": $("#goban-primary-ctrl"),
            "black_clock": "#game-black-clock",
            "white_clock": "#game-white-clock",
            "stone_removal_clock": "#stone-removal-clock",
            "node_textarea": "#game-move-node-text",
            //"game_type": $scope.game.type,
            //"game_source": $scope.game.source,
            "interactive": true,
            "connect_to_chat": true,
            "isInPushedAnalysis": () => this.in_pushed_analysis,
            "leavePushedAnalysis": () => {
                if (this.leave_pushed_analysis) {
                    this.leave_pushed_analysis();
                }
            },

            /*
            "onChat": function(m,t) { chat_handlers.handleChat(m,t); },
            "onChatReset": function() { chat_handlers.handleChatReset(); },
            "onPendingResignation": function(player_id, delay) {
                if (global_user && player_id === global_user.id) {
                    if (!leaving_page) {
                        //console.log("I disconnected from another tab, but I guess I have multiple open, clearing resignation ");
                        goban.clearPendingResignation();
                    }
                } else {
                    //console.log("Player " + player_id + " disconnected, will be resigning in "+ delay + "ms");
                }
            },
            "onPendingResignationCleared": function(player_id, delay) {
                //console.log("Player " + player_id + " reconnected, resignation canceled");
            },
            "onClearChatLogs": function() {
                chat_handlers.clearChatLogs();
            },
            */
            "game_id": null,
            "review_id": null,
            "draw_top_labels": (label_position === "all" || label_position.indexOf("top") >= 0),
            "draw_left_labels": (label_position === "all" || label_position.indexOf("left") >= 0),
            "draw_right_labels": (label_position === "all" || label_position.indexOf("right") >= 0),
            "draw_bottom_labels": (label_position === "all" || label_position.indexOf("bottom") >= 0),
            "move_tree_div": "#move-tree-container",
            "move_tree_canvas": "#move-tree-canvas",
            "display_width": Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight),

            //"square_size": 10,
            //"wait_for_game_to_start": $scope.game.started == null,
            //"width": $scope.game.width,
            //"height": $scope.game.height,
        };

        if (opts.display_width <= 0) {
            let I = setInterval(() => {
                this.onResize(true);
                setTimeout(() => {
                    if (Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight) > 0) {
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

        console.log(opts);

        /*
        if (global_user) {
            opts.username = global_user.username;
            opts.chat_player_id = global_user.id;
            opts.chat_auth = $scope.game_chat_auth;
        }
        if ($scope.auth) {
            opts.auth = $scope.auth;
        }
        */

        //goban = new Goban(opts, initial_gamedata);
        this.goban = new Goban(opts);
        this.onResize(true);
        //global_goban = this.goban;
        window["global_goban"] = this.goban;
        //window["this.goban"] = goban;
        //$scope.goban = goban;
        if (this.review_id) {
            this.goban.setMode("analyze");
        }

        // We need an initial score for the first display rendering (which is not set in the constructor).
        // Best to get this from the engine, so we know we have the right structure...
        this.setState({score: this.goban.engine.computeScore(true)});


        /* Title Updates {{{ */
        let last_title = window.document.title;
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
                    let diff = this.goban.engine.getMoveNumber() - this.last_move_viewed;
                    window.document.title = interpolate(_("(%s) moves made"), [diff]);
                }
            } else {
                window.document.title = state.title;
            }
        });
        /* }}} */

        this.goban.on("advance-to-next-board", () => notification_manager.advanceToNextBoard());
        this.goban.on("title", (title) => this.setState({title: title}));
        this.goban.on("update", () => this.sync_state());
        this.goban.on("reset", () => this.sync_state());
        this.goban.on("show-submit", (tf) => {
            this.setState({show_submit: tf});
        });
        this.goban.on("pause-text", (new_text) => this.setState({
            "white_pause_text": new_text.white_pause_text,
            "black_pause_text": new_text.black_pause_text,
        }));
        this.goban.on("chat", (line) => {
            this.chat_log.push(line);
            /*
            if (!(chat_log in this.chats)) {
                this.chats[chat_log] = [];
            }
            this.chats[chat_log].push(line);
            */

            this.debouncedChatUpdate();
        });
        this.goban.on("chat-reset", () => {
            /*
            for (let k in this.chats) {
                this.chats[k] = [];
            }
            */
            this.chat_log.length = 0;
            this.debouncedChatUpdate();
        });

        this.goban.on("gamedata", (gamedata) => {
            try {
                if (isLiveGame(gamedata.time_control)) {
                    this.goban.one_click_submit = preferences.get("one-click-submit-live");
                    this.goban.double_click_submit = preferences.get("double-click-submit-live");
                } else {
                    this.goban.one_click_submit = preferences.get("one-click-submit-correspondence");
                    this.goban.double_click_submit = preferences.get("double-click-submit-correspondence");
                }
            } catch (e) {
                console.error(e.stack);
            }

            this.sync_state();
        });

        this.goban.on("auto-resign", (data) => {
            if (this.goban.engine && data.player_id === this.goban.engine.black_player_id) {
                this.setState({ black_auto_resign_expiration: new Date(data.expiration - get_network_latency() + get_clock_drift() ) });
            }
            if (this.goban.engine && data.player_id === this.goban.engine.white_player_id) {
                this.setState({ white_auto_resign_expiration: new Date(data.expiration - get_network_latency() + get_clock_drift()) });
            }
        });
        this.goban.on("clear-auto-resign", (data) => {
            if (this.goban.engine && data.player_id === this.goban.engine.black_player_id) {
                this.setState({ black_auto_resign_expiration: null });
            }
            if (this.goban.engine && data.player_id === this.goban.engine.white_player_id) {
                this.setState({ white_auto_resign_expiration:null });
            }
        });


        if (this.review_id) {
            this.goban.on("review.updated", () => {
                this.sync_state();
            });
            this.goban.on("review.sync-to-current-move", () => {
                this.syncToCurrentReviewMove();
            });
        }



        if (this.game_id) {
            get("games/%%", this.game_id)
            .then((game) => {
                if (game.players.white.id) {
                    player_cache.update(game.players.white, true);
                }
                if (game.players.black.id) {
                    player_cache.update(game.players.black, true);
                }
                this.creator_id = game.creator;
                this.ladder_id = game.ladder;
                this.tournament_id = game.tournament;

                let review_list = [];
                for (let k in game.gamedata.reviews) {
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
    }}}

    /*** Common stuff ***/
    nav_up() {{{
        this.checkAndEnterAnalysis();
        this.goban.prevSibling();
        this.goban.syncReviewMove();
    }}}
    nav_down() {{{
        this.checkAndEnterAnalysis();
        this.goban.nextSibling();
        this.goban.syncReviewMove();
    }}}
    nav_first() {{{
        let last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showFirst();
        this.goban.syncReviewMove();
    }}}
    nav_prev_10() {{{
        let last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showPrevious();
        }
        this.goban.syncReviewMove();
    }}}
    nav_prev() {{{
        let last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showPrevious();
        this.goban.syncReviewMove();
    }}}
    nav_next(event?: React.MouseEvent<any>, dont_stop_autoplay?: boolean) {{{
        let last_estimate_move = this.stopEstimatingScore();
        if (!dont_stop_autoplay) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showNext();
        this.goban.syncReviewMove();
    }}}
    nav_next_10() {{{
        let last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showNext();
        }
        this.goban.syncReviewMove();
    }}}
    nav_last() {{{
        let last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.jumpToLastOfficialMove();
        this.goban.syncReviewMove();
    }}}
    nav_play_pause() {{{
        if (this.state.autoplaying) {
            this.stopAutoplay();
        } else {
            this.startAutoplay();
        }
    }}}
    stopAutoplay() {{{
        if (this.autoplay_timer) {
            clearTimeout(this.autoplay_timer);
            this.autoplay_timer = null;
        }
        if (this.state.autoplaying) {
            this.setState({autoplaying: false});
        }
    }}}
    startAutoplay() {{{
        if (this.autoplay_timer) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis();
        let step = () => {
            if (this.goban.mode === "analyze") {
                this.nav_next(null, true);

                if (this.goban.engine.last_official_move.move_number === this.goban.engine.cur_move.move_number) {
                    this.stopAutoplay();
                } else {
                    this.autoplay_timer = setTimeout(step, preferences.get("autoplay-delay"));
                }
            } else {
                this.stopAutoplay();
            }
        };
        this.autoplay_timer = setTimeout(step, Math.min(1000, preferences.get("autoplay-delay")));

        this.setState({autoplaying: true});
    }}}

    checkAndEnterAnalysis(move?:MoveTree) {{{
        if (this.goban.mode === "play" && this.goban.engine.phase !== "stone removal" && (!this.goban.isAnalysisDisabled() || this.goban.engine.phase === "finished")) {
            this.setState({variation_name: ""});
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
    }}}
    recenterGoban() {{{
        let m = this.goban.computeMetrics();
        $(this.goban_div).css({
            top: Math.ceil(this.ref_goban_container.offsetHeight - m.height) / 2,
            left: Math.ceil(this.ref_goban_container.offsetWidth - m.width) / 2,
        });
    }}}
    onResize = (no_debounce?: boolean) => {{{
        //Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight)
        if (this.computeViewMode() !== this.state.view_mode || goban_view_squashed() !== this.state.squashed) {
            this.setState({
                squashed: goban_view_squashed(),
                view_mode: this.computeViewMode(),
            });

        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }

        /*
        if (!this.goban) {
            return;
        }
        */

        this.goban.setGameClock(this.goban.last_clock); /* this forces a clock refresh, important after a layout when the dom could have been replaced */

        if (!this.ref_goban_container) {
            return;
        }

        if (this.computeViewMode() === "portrait") {
            let w = win.width() + 10;
            /*
            let max_h = win.height() - 32; // 32 for navbar
            max_h -= $(this.ref_players).height();
            max_h -= $(this.ref_action_bar).height();
            if (this.ref_game_state_label) {
                max_h -= $(this.ref_game_state_label).height();
            }
            if (this.ref_game_action_buttons) {
                max_h -= $(this.ref_game_action_buttons).height();
            }
            let ad_class = this.getAdClass();
            switch (ad_class) {
                case 'mobile-banner':
                    max_h -= 50;
                    break;
                case 'goban-banner':
                case 'outer-banner':
                    max_h -= 90;
                    break;
            }
            w = Math.min(w, max_h);
            */

            if (this.ref_goban_container.style.minHeight !== `${w}px`) {
                this.ref_goban_container.style.minHeight = `${w}px`;
            }
        } else {
            if (this.ref_goban_container.style.minHeight !== `initial`) {
                this.ref_goban_container.style.minHeight = `initial`;
            }
            let w = this.ref_goban_container.offsetWidth;
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
            Math.min(this.ref_goban_container.offsetWidth, this.ref_goban_container.offsetHeight)
        );

        this.recenterGoban();
    }}}
    setAnalyzeTool(tool, subtool) {{{
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
    }}}
    setLabelHandler = (event) => {{{
        try {
            if (document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA" ||
                document.activeElement.tagName === "SELECT"
            ) {
                return;
            }
        } catch (e) {
        }

        if (this.goban && this.goban.mode === "analyze") {
            if (this.goban.analyze_tool === "label") {
                if (event.charCode) {
                    let ch = String.fromCharCode(event.charCode).toUpperCase();
                    this.goban.setLabelCharacter(ch);
                }
            }
        }
    }}}
    computeViewMode(ignore_zen_mode?): ViewMode {{{
        if (!ignore_zen_mode && this.state.zen_mode) {
            return "zen";
        }

        return goban_view_mode();
    }}}
    computeSquashed(): boolean {{{
        return win.height() < 680;
    }}}
    getAdClass(): AdClass {{{
        let show_ad = should_show_ads() && preferences.get("show-ads-on-game-page");

        if (!show_ad) {
            return "no-ads";
        }

        if (this.ad_class) {
            return this.ad_class;
        }

        let w = win.width() || 1;
        let h = win.height() || 1;

        if (w >= 1280) {
            if (w - (300 + 400) > h - 90) { // 300 for left block, 400 for right col
                return this.ad_class = 'block';
            }
        }
        if (w <= 728) {
            return this.ad_class = 'mobile-banner';
        }
        if (w - 400 >= 728) {
            return this.ad_class = 'goban-banner';
        }
        return this.ad_class = 'outer-banner';
    }}}
    toggleCoordinates() {{{
        let goban = this.goban;

        let label_position = preferences.get("label-positioning");
        switch (label_position) {
            case "all": label_position = "none"; break;
            case "none": label_position = "top-left"; break;
            case "top-left": label_position = "top-right"; break;
            case "top-right": label_position = "bottom-right"; break;
            case "bottom-right": label_position = "bottom-left"; break;
            case "bottom-left": label_position = "all"; break;
        }
        preferences.set("label-positioning", label_position);

        goban.draw_top_labels = label_position === "all" || label_position.indexOf("top") >= 0;
        goban.draw_left_labels = label_position === "all" || label_position.indexOf("left") >= 0;
        goban.draw_right_labels = label_position === "all" || label_position.indexOf("right") >= 0;
        goban.draw_bottom_labels = label_position === "all" || label_position.indexOf("bottom") >= 0;
        this.onResize(true);
        goban.redraw(true);
    }}}
    showGameInfo() {{{
        openGameInfoModal(this.goban.engine,
            this.state[`historical_black`] || this.goban.engine.players.black,
            this.state[`historical_white`] || this.goban.engine.players.white,
            this.state.annulled, this.creator_id || this.goban.review_owner_id);
    }}}
    showLinkModal() {{{
        openGameLinkModal(this.goban);
    }}}
    gameAnalyze() {{{
        let user = data.get("user");
        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished") {
            //swal(_("Analysis mode has been disabled for this game"));
        } else {
            let last_estimate_move = this.stopEstimatingScore();

            this.goban.setMode("analyze");
            if (last_estimate_move) {
                this.goban.engine.jumpTo(last_estimate_move);
            }
        }
    }}}
    fork() {{{
        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished") {
            //swal(_("Game forking has been disabled for this game since analysis mode has been disabled"));
        } else {
            challengeFromBoardPosition(this.goban);
        }
    }}}
    toggleZenMode() {{{
        if (this.state.zen_mode) {
            this.setState({
                zen_mode: false,
                view_mode: this.computeViewMode(true),
            });
        } else {
            this.setState({
                zen_mode: true,
                view_mode: "zen",
            });
        }
        this.onResize();
    }}}
    togglePortraitTab() {{{
        if (Perf) {
            Perf.start();
        }
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

        this.setState({portrait_tab: portrait_tab});
        this.onResize();
        if (Perf) {
        setTimeout(() => {
            Perf.stop();
            window["p"] = Perf.getLastMeasurements();
            Perf.printExclusive(Perf.getLastMeasurements());
            Perf.printWasted(Perf.getLastMeasurements());
        }, 500);
        }
    }}}
    setPencilColor(ev) {{{
        let color = (ev.target as HTMLInputElement).value;
        if (this.goban.analyze_tool === "draw") {
            this.goban.analyze_subtool = color;
        }
        this.setState({analyze_pencil_color: color});
    }}}
    updateVariationName(ev) {{{
        this.setState({variation_name: (ev.target as HTMLInputElement).value});
    }}}
    updateMoveText = (ev) => {{{
        this.setState({move_text: ev.target.value});
        this.goban.syncReviewMove(null, ev.target.value);
    }}}
    debouncedChatUpdate() {{{
        if (this.chat_update_debounce) {
            return;
        }
        this.chat_update_debounce = setTimeout(() => {
            this.chat_update_debounce = null;
            if (this.ref_chat) {
                this.ref_chat.forceUpdate();
            }
        }, 1);
    }}}
    shareAnalysis() {{{
        let diff = this.goban.engine.getMoveDiff();
        let str;
        let name = this.state.variation_name;
        let goban = this.goban;
        let autonamed = false;

        if (!name) {
            autonamed = true;
            name = "" + (++this.last_variation_number);
        }

        let marks = {};
        let mark_ct = 0;
        for (let y = 0; y < goban.height; ++y) {
            for (let x = 0; x < goban.width; ++x) {
                let pos = goban.getMarks(x, y);
                let marktypes = ["letter", "triangle", "circle", "square", "cross"];
                for (let i = 0; i < marktypes.length; ++i) {
                    if (marktypes[i] in pos && pos[marktypes[i]]) {
                        let markkey = marktypes[i] === "letter" ? pos.letter : marktypes[i];
                        if (!(markkey in marks)) {
                            marks[markkey] = "";
                        }
                        marks[markkey] += GoMath.encodeMove(x, y);
                        ++mark_ct;
                    }
                }
            }
        }


        let analysis: any = {
            "type": "analysis",
            "from": diff.from,
            "moves": diff.moves,
            "name": name
        };
        console.log(analysis);

        if (mark_ct) {
            analysis.marks = marks;
        }
        if (goban.pen_marks.length) {
            analysis.pen_marks = goban.pen_marks;
        }

        let last_analysis_sent = this.last_analysis_sent;
        if (last_analysis_sent &&
            last_analysis_sent.from === analysis.from &&
            last_analysis_sent.moves === analysis.moves &&
            (autonamed || last_analysis_sent.name === analysis.name) &&
            ((!analysis.marks && !last_analysis_sent.marks) || (last_analysis_sent.marks === analysis.marks)) &&
            ((!analysis.pen_marks && !last_analysis_sent.pen_marks) || (last_analysis_sent.pen_marks === analysis.pen_marks))
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
            goban.message("Can't send to the " + this.ref_chat.state.chat_log  + " chat_log");
        }
    }}}
    openACL = () => {{{
        openACLModal(this.game_id, this.review_id, this.goban.engine);
    }}}

    popupScores(color) {{{
        let goban = this.goban;

        this.orig_marks = JSON.stringify(goban.engine.cur_move.getAllMarks());
        goban.engine.cur_move.clearMarks();

        let only_prisoners = false;
        let scores = goban.engine.computeScore(only_prisoners);
        this.showing_scores = goban.showing_scores;
        goban.showScores(scores);

        let score = scores[color];
        let html = "";
        if (!only_prisoners) {
            html += "<div class='score_breakdown'>";
            if (score.stones) {
                html += "<div><span>" + _("Stones") + "</span><div>" + score.stones + "</div></div>";
            }
            if (score.territory) {
                html += "<div><span>" + _("Territory") + "</span><div>" + score.territory + "</div></div>";
            }
            if (score.prisoners) {
                html += "<div><span>" + _("Prisoners") + "</span><div>" + score.prisoners + "</div></div>";
            }
            if (score.handicap) {
                html += "<div><span>" + _("Handicap") + "</span><div>" + score.handicap + "</div></div>";
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
            html += "<div><span>" + _("Prisoners") + "</span><div>" + score.prisoners + "</div></div>";
            html += "<div>";
        }

        $("#" + color + "-score-details").html(html);
    }}}
    hideScores(color) {{{
        let goban = this.goban;

        if (!this.showing_scores) {
            goban.hideScores();
        }
        goban.engine.cur_move.setAllMarks(JSON.parse(this.orig_marks));
        goban.redraw();
        $("#" + color + "-score-details").children().remove();
    }}}

    /*** Game stuff ***/
    reviewAdded(review) {{{
        let review_list = [];
        for (let r of this.state.review_list) {
            review_list.push(r);
        }
        review_list.push(review);
        review_list.sort((a, b) => {
            if (a.owner.ranking === b.owner.ranking) {
                return a.owner.username < b.owner.username ? -1 : 1;
            }
            return a.owner.ranking - b.owner.ranking;
        });
        this.setState({review_list: review_list});
    }}}
    handleEscapeKey() {{{
        if (this.state.zen_mode) {
            this.toggleZenMode();
        }

        if (this.goban && !this.goban.engine.config.original_sgf) {
            if (this.goban.mode === "score estimation") {
                this.leaveScoreEstimation();
            } else if (this.goban.mode === "analyze") {
                this.goban.setMode("play");
                this.sync_state();
            }
        }
    }}}
    sync_state() {{{
        let new_state: any = {
            game_id: this.game_id,
            review_id: this.review_id,
            user_is_player: false,
        };
        let goban: Goban = this.goban;
        let engine: GoEngine = goban ? goban.engine : null;

        if (this.goban) {
            /* Is player? */
            try {
                for (let color in this.goban.engine.players) {
                    if (this.goban.engine.players[color].id === data.get("user").id) {
                        new_state.user_is_player = true;
                        break;
                    }
                }
            } catch (e) {
                console.error(e.stack);
            }

            /* Game state */
            new_state.mode = goban.mode;
            new_state.phase = engine.phase;
            new_state.title = goban.title;
            new_state.score_estimate = goban.score_estimate || {};
            new_state.show_undo_requested = (engine.undo_requested === engine.last_official_move.move_number);
            new_state.show_accept_undo = (goban.engine.playerToMove() === data.get("user").id || (goban.submit_move != null && goban.engine.playerNotToMove() === data.get("user").id) || null);
            new_state.show_title = (!goban.submit_move || goban.engine.playerToMove() !== data.get("user").id || null);
            new_state.show_submit = !!goban.submit_move;
            new_state.player_to_move = goban.engine.playerToMove();
            new_state.player_not_to_move = goban.engine.playerNotToMove();
            new_state.is_my_move = new_state.player_to_move === data.get("user").id;
            new_state.winner = goban.engine.winner;
            new_state.cur_move_number = engine.cur_move ? engine.cur_move.move_number : -1;
            new_state.official_move_number = engine.last_official_move ? engine.last_official_move.move_number : -1;
            new_state.strict_seki_mode = engine.strict_seki_mode;
            new_state.rules = engine.rules;
            new_state.paused = goban.engine.pause_control && !!goban.engine.pause_control.paused;
            new_state.analyze_tool = goban.analyze_tool;
            new_state.analyze_subtool = goban.analyze_subtool;
            new_state.white_pause_text = goban.white_pause_text;
            new_state.black_pause_text = goban.black_pause_text;

            if (goban.engine.gameCanBeCanceled()) {
                new_state.resign_text = _("Cancel game");
                new_state.resign_mode = "cancel";
            } else {
                new_state.resign_text = _("Resign");
                new_state.resign_mode = "resign";
            }


            if (engine.phase === "stone removal") {
                new_state.stone_removals = engine.getStoneRemovalString();
                let stone_removals = new_state.stone_removals;

                if (this.stone_removal_accept_timeout) {
                    clearTimeout(this.stone_removal_accept_timeout);
                }

                let gsra = $("#game-stone-removal-accept");
                gsra.prop("disabled", true);
                this.stone_removal_accept_timeout = setTimeout(() => {
                    gsra.prop("disabled", false);
                    this.stone_removal_accept_timeout = null;
                }, device.is_mobile ? 3000 : 1500 );

                new_state.black_accepted = engine.players["black"].accepted_stones === stone_removals;
                new_state.white_accepted = engine.players["white"].accepted_stones === stone_removals;
            }

            if ((engine.phase === "stone removal" || engine.phase === "finished") &&
              engine.outcome !== "Timeout" && engine.outcome !== "Resignation" && engine.outcome !== "Cancellation" && goban.mode === "play") {
                new_state.score = engine.computeScore(false);
                goban.showScores(new_state.score);
            } else {
                new_state.score = engine.computeScore(true);
            }



            if (goban.mode === "conditional") {
                let tree = $(this.conditional_move_tree);
                tree.empty();
                this.selected_conditional_move = null;
                this.conditional_move_list = [];
                let elts = this.createConditionalMoveTreeDisplay(this.goban.conditional_tree, "", this.goban.conditional_starting_color === "black");
                for (let i = 0; i < elts.length; ++i) {
                    tree.append(elts[i]);
                }
            }

            new_state.move_text = engine.cur_move && engine.cur_move.text ? engine.cur_move.text : "";

            /* review stuff */
            new_state.review_owner_id = goban.review_owner_id;
            new_state.review_controller_id = goban.review_controller_id;
            new_state.review_out_of_sync = engine.cur_move && engine.cur_review_move && (engine.cur_move.id !== engine.cur_review_move.id);
        }

        this.setState(new_state);
    }}}
    createConditionalMoveTreeDisplay(root, cpath, blacks_move) {{{
        let goban = this.goban;

        let mkcb = (path) => {
            return () => {
                goban.jumpToLastOfficialMove();
                goban.followConditionalPath(path);
                this.sync_state();
                goban.redraw();
            };
        };
        let mkdelcb = (path) => {
            return () => {
                goban.jumpToLastOfficialMove();
                goban.deleteConditionalPath(path);
                this.sync_state();
                goban.redraw();
            };
        };

        let color1 = blacks_move ? "black" : "white";
        let color2 = blacks_move ? "white" : "black";

        let ret = null;
        let ul = $("<ul>").addClass("tree");
        if (root.move) {
            if ((cpath + root.move) === goban.getCurrentConditionalPath()) {
                this.selected_conditional_move = (cpath + root.move);
            }
            this.conditional_move_list.push((cpath + root.move));

            let mv = goban.engine.decodeMoves(root.move)[0];

            let delete_icon = $("<i>")
                .addClass("fa fa-times")
                .addClass("delete-move")
                .click(mkdelcb(cpath + root.move));

            ret = [
                $("<span>")
                    .addClass("entry")
                    .append($("<span>").addClass("stone " + color2))
                    .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
                    .addClass(((cpath + root.move) === goban.getCurrentConditionalPath()) ? "selected" : "")
                    .click(mkcb(cpath + root.move))
                  ];


            if (((cpath + root.move) === goban.getCurrentConditionalPath())) { // selected move
                ret.push(delete_icon);
            }
            ret.push(ul);

            cpath += root.move;
        } else {
            ret = [ul];
        }


        for (let ch in root.children) {
            if ((cpath + ch) === goban.getCurrentConditionalPath()) {
                this.selected_conditional_move = (cpath + ch);
            }
            this.conditional_move_list.push((cpath + ch));

            let li = $("<li>").addClass("move-row");
            let mv = goban.engine.decodeMoves(ch)[0];
            let span = $("<span>")
                .addClass("entry")
                .append($("<span>").addClass("stone " + color1))
                .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
                .addClass(((cpath + ch) === goban.getCurrentConditionalPath()) ? "selected" : "")
                .click(mkcb(cpath + ch));
            li.append(span);


            let elts = this.createConditionalMoveTreeDisplay(root.children[ch], cpath + ch, blacks_move);
            for (let i = 0; i < elts.length; ++i) {
                li.append(elts[i]);
            }

            ul.append(li);
        }
        return ret;
    }}}

    leaveScoreEstimation() {{{
        this.setState({
            estimating_score: false
        });
        this.goban.setScoringMode(false);
        this.goban.engine.clearRemoved();
        this.goban.hideScores();
        this.goban.score_estimate = null;
        this.sync_state();
    }}}
    enterConditionalMovePlanner() {{{
            //if (!auth) { return; }
        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished") {
            //swal(_("Conditional moves have been disabled for this game."));
        } else {
            this.stashed_conditional_moves = this.goban.conditional_tree.duplicate();
            this.goban.setMode("conditional");
        }
    }}}
    pauseGame() {{{
        this.goban.pauseGame();
    }}}
    startReview() {{{
        let user = data.get("user");
        let is_player = user.id === this.goban.engine.players.black.id || user.id === this.goban.engine.players.white.id;

        if (this.goban.isAnalysisDisabled() && this.goban.engine.phase !== "finished" && is_player) {
            //swal(_("Analysis mode has been disabled for this game, you can start a review after the game has concluded."));

        } else {
            swal({
                "text": _("Start a review of this game?"),
                showCancelButton: true
            }).then(() => {
                post("games/%%/reviews", this.game_id, {})
                .then((res) => browserHistory.push(`/review/${res.id}`))
                .catch(errorAlerter);
            })
            .catch(ignore);
        }
    }}}
    estimateScore():boolean {{{
        if (this.goban.engine.phase === "stone removal") {
            console.log("Cowardly refusing to enter score estimation phase while stone removal phase is active");
            return false;
        }
        this.setState({estimating_score: true});
        this.goban.setScoringMode(true);
        this.sync_state();
        return true;
    }}}
    stopEstimatingScore():MoveTree {{{
        if (!this.state.estimating_score) {
            return null;
        }
        this.setState({estimating_score: false});
        let ret = this.goban.setScoringMode(false);
        this.goban.engine.clearRemoved();
        this.goban.hideScores();
        this.goban.score_estimate = null;
        //goban.engine.cur_move.clearMarks();
        this.sync_state();
        return ret;
    }}}
    alertModerator() {{{
        alertModerator(this.game_id ? {game: this.game_id} : {review: this.review_id});
    }}}
    decide(winner): void {{{
        let moderation_note = null;
        do {
            moderation_note = prompt("Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/moderate", this.game_id,
             {
                 "decide": winner,
                 "moderation_note": moderation_note,
             }
        ).catch(errorAlerter);
    }}}
    annul = () => {{{
        let moderation_note = null;
        do {
            moderation_note = prompt("Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        post("games/%%/annul", this.game_id,
             {
                 "moderation_note": moderation_note,
             }
        )
        .then(() => {
            swal({text: _(`Game has been annulled`)});
        })
        .catch(errorAlerter);
    }}}

    cancelOrResign() {{{
        if (this.state.resign_mode === "cancel") {
            swal({
                text: _("Are you sure you wish to cancel this game?"),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true
            })
            .then(() => this.goban.cancelGame())
            .catch(() => 0);
        } else {
            swal({
                text: _("Are you sure you wish to resign this game?"),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true
            })
            .then(() => this.goban.resign())
            .catch(() => 0);
        }
    }}}
    goban_acceptUndo() {{{
        this.goban.acceptUndo();
    }}}
    goban_submit_move() {{{
        this.goban.submit_move();
    }}}
    goban_setMode_play() {{{
        this.goban.setMode("play");
        if (this.stashed_conditional_moves) {
            this.goban.setConditionalTree(this.stashed_conditional_moves);
            this.stashed_conditional_moves = null;
        }
    }}}
    goban_resumeGame() {{{
        this.goban.resumeGame();
    }}}
    goban_jumpToLastOfficialMove() {{{
        this.goban.jumpToLastOfficialMove();
    }}}
    acceptConditionalMoves() {{{
        this.stashed_conditional_moves = null;
        this.goban.saveConditionalMoves();
        this.goban.setMode("play");
    }}}
    pass() {{{
        if (!isLiveGame(this.goban.engine.time_control) || !preferences.get('one-click-submit-live')) {
            swal({text: _("Are you sure you want to pass?"), showCancelButton: true})
            .then(() => this.goban.pass())
            .catch(() => 0);
        } else {
            this.goban.pass();
        }
    }}}
    analysis_pass = () => {{{
        this.goban.pass();
    }}}
    undo() {{{
        if (data.get("user").id === this.goban.engine.playerNotToMove() && this.goban.engine.undo_requested !== this.goban.engine.getMoveNumber()) {
            this.goban.requestUndo();
        }
    }}}
    goban_setModeDeferredPlay() {{{
        this.goban.setModeDeferred("play");
    }}}
    goban_deleteBranch() {{{
        if (this.state.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to delete branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection().isCollapsed) {
                return;
            }
        } catch (e) {
        }

        if (this.goban.engine.cur_move.trunk) {
            swal({text: _(`The current position is not an explored branch, so there is nothing to delete`)});
        } else {
            swal({text: _("Are you sure you wish to remove this move branch?"), showCancelButton: true})
            .then(() => this.goban.deleteBranch())
            .catch(() => 0);
        }
    }}}
    setStrictSekiMode(ev) {{{
        this.goban.setStrictSekiMode((ev.target as HTMLInputElement).checked);
    }}}
    rematch() {{{
        try {
            $(document.activeElement).blur();
        } catch (e) {
            console.error(e);
        }


        challengeRematch(this.goban,
            data.get("user").id === this.goban.engine.players.black.id ?  this.goban.engine.players.white : this.goban.engine.players.black,
            this.goban.engine.config,
        );
    }}}
    onStoneRemovalCancel() {{{
        swal({"text": _("Are you sure you want to resume the game?"), showCancelButton: true})
        .then(() => this.goban.rejectRemovedStones())
        .catch(() => 0);
        return false;
    }}}
    onStoneRemovalAccept() {{{
        this.goban.acceptRemovedStones();
        return false;
    }}}
    onStoneRemovalAutoScore() {{{
        this.goban.autoScore();
        return false;
    }}}
    clearAnalysisDrawing() {{{
        swal({"text": _("Clear all pen marks?"), showCancelButton: true})
        .then(() => {
            this.goban.syncReviewMove({"clearpen": true});
            this.goban.clearAnalysisDrawing();
        })
        .catch(() => 0);
    }}}
    setChatLog = (chat_log) => {{{
        this.setState({chat_log: chat_log});
    }}}

    toggleVolume = () => {{{
        this._setVolume(this.state.volume > 0 ? 0 : 0.5);
    }}}
    setVolume = (ev) => {{{
        this._setVolume(parseFloat(ev.target.value));
    }}}
    _setVolume(volume) {{{
        let enabled = volume > 0;

        sfx.volume_override = volume;

        this.setState({
            volume: volume,
            sound_enabled: enabled,
        });
        let idx = Math.round(Math.random() * 10000) % 5; /* 5 === number of stone sounds */

        if (this.volume_sound_debounce) {
            clearTimeout(this.volume_sound_debounce);
        }

        this.volume_sound_debounce = setTimeout(() => { sfx.play("stone-" + (idx + 1)); }, 250);
    }}}

    saveVolume = () => {{{
        let enabled = this.state.volume > 0;
        preferences.set("sound-volume", this.state.volume);
        preferences.set("sound-enabled", enabled);
    }}}


    /* Review stuff */
    syncToCurrentReviewMove = () => {{{
        if (this.goban.engine.cur_review_move) {
            this.goban.engine.jumpTo(this.goban.engine.cur_review_move);
            this.sync_state();
        } else {
            setTimeout(this.syncToCurrentReviewMove, 50);
        }
    }}}
    hasVoice(user_id) {{{
        if (this.review_id && this.goban) {
            if (this.goban.review_controller_id === user_id || this.goban.review_owner_id === user_id) {
                return true;
            }
        }
        return false;
    }}}


    render() {{{
        const CHAT = <GameChat ref={el => this.ref_chat = el} chatlog={this.chat_log} onChatLogChanged={this.setChatLog}
                         gameview={this} userIsPlayer={this.state.user_is_player}
                         channel={this.game_id ? `game-${this.game_id}` : `review-${this.review_id}`} />;
        const review = !!this.review_id;

        let ad_class = this.getAdClass();
        let FLEX_AD = null;
        switch (ad_class) {
            case 'no-ads':
                FLEX_AD = null;
                break;

            case 'block':
                FLEX_AD = <AdUnit unit='cdm-zone-02' />;
                break;

            default:
                FLEX_AD = <AdUnit unit='cdm-zone-01' />;
        }

        return (
            <div className={(ad_class === 'outer-banner' || ad_class === 'mobile-banner') ? ad_class : ''}>
             {((ad_class === 'outer-banner' || ad_class === 'mobile-banner') || null) && FLEX_AD}
             <div className={"Game MainGobanView " + this.state.view_mode + " " + (this.state.squashed ? "squashed" : "")}>
                {this.frag_kb_shortcuts()}
                <i onClick={this.toggleZenMode} className="leave-zen-mode-button ogs-zen-mode"></i>


                <div className={"left-col " + (ad_class === 'block' ? 'block' : 'no-ads')}>
                    {(ad_class === "block" || null) && FLEX_AD}
                </div>


                <div className="center-col">
                    {(ad_class === 'goban-banner' || null) && FLEX_AD}

                    {(this.state.view_mode === "portrait" || null) && this.frag_players()}

                    {((this.state.view_mode !== "portrait" || this.state.portrait_tab === "game") || null) &&
                        <div ref={el => this.ref_goban_container = el} className="goban-container">
                            <PersistentElement className="Goban" elt={this.goban_div}/>
                        </div>
                    }

                    {
                        /*
                        ((this.state.view_mode === 'portrait' && this.state.portrait_tab === 'chat') || null) &&
                        this.frag_players()
                        */
                    }

                    {(this.state.view_mode === "zen" || null) && this.frag_play_controls(true)}

                    {this.frag_below_board_controls()}

                    {/* ((this.state.view_mode === 'wide' && win.width() > 1024) || null) && CURSE_ATF_AD */}

                    {((this.state.view_mode === "square" && !this.state.squashed) || null) && CHAT}


                    {((this.state.view_mode === "portrait") || null) &&
                        (review
                            ? this.frag_review_controls()
                            : this.frag_play_controls(false)
                        )
                    }

                    {/* ((this.state.view_mode === 'portrait') || null) && CURSE_BTF_AD */}


                    {((this.state.view_mode === "portrait" /* && this.state.portrait_tab === 'chat' */) || null) &&
                        CHAT
                    }

                    {(((this.state.view_mode === "portrait" /* && this.state.portrait_tab === 'chat' */)
                      && this.state.user_is_player && this.state.phase !== "finished" ) || null) &&
                        this.frag_cancel_button()
                    }


                    {((this.state.view_mode === "portrait" && this.state.portrait_tab === "game") || null) &&
                        this.frag_dock()
                    }

                </div>


                {(this.state.view_mode !== "portrait" || null) &&
                    <div className="right-col">
                        {(this.state.view_mode === "square" || null) && this.frag_players()}
                        {(this.state.view_mode === "wide" || null) && this.frag_players()}

                        {review
                            ? this.frag_review_controls()
                            : this.frag_play_controls(true)
                        }

                        {/*
                        <div className='filler'/>
                        */}
                        {(this.state.view_mode === "square" || null) && FLEX_AD}
                        {(this.state.view_mode === "wide" || null) && CHAT}
                        {((this.state.view_mode === "square" && this.state.squashed) || null) && CHAT}

                        {this.frag_dock()}
                    </div>
                }

             </div>
            </div>
        );
    }}}
    frag_cancel_button() {{{
        return <button className="xs bold cancel-button" onClick={this.cancelOrResign}>{this.state.resign_text}</button>;
    }}}
    frag_play_buttons(show_cancel_button) {{{
        let state = this.state;

        return (
            <span className="play-buttons">
                <span>
                    {(state.cur_move_number >= 1 && state.player_not_to_move === data.get("user").id &&
                      !(this.goban.engine.undo_requested >= this.goban.engine.getMoveNumber()) && this.goban.submit_move == null || null) &&
                         <button className="bold undo-button xs" onClick={this.undo}>{_("Undo")}</button>
                    }
                    {state.show_undo_requested &&
                        <span>
                            {state.show_accept_undo &&
                                <button className="sm primary bold accept-undo-button" onClick={this.goban_acceptUndo}>{_("Accept Undo")}</button>
                            }
                        </span>
                    }
                </span>
                <span>
                    {((!state.show_submit && state.is_my_move && this.goban.engine.handicapMovesLeft() === 0) || null) &&
                        <button className="sm primary bold pass-button" onClick={this.pass}>{_("Pass")}</button>
                    }
                    {((state.show_submit && this.goban.engine.undo_requested !== this.goban.engine.getMoveNumber()) || null) &&
                        <button className="sm primary bold submit-button" id="game-submit-move" onClick={this.goban_submit_move}>{_("Submit Move")}</button>
                    }
                </span>
                <span>
                    {(show_cancel_button && state.user_is_player && state.phase !== "finished" || null) &&
                        this.frag_cancel_button()
                    }
                </span>
            </span>
        );
    }}}

    variationKeyPress = (ev) => {{{
        if (ev.keyCode === 13) {
            this.shareAnalysis();
            return false;
        }
    }}}

    frag_play_controls(show_cancel_button) {{{
        let state = this.state;
        let user = data.get("user");

        if (!this.goban) {
            return null;
        }

        return (
            <div className="play-controls">
                <div ref={el => this.ref_game_action_buttons = el} className="game-action-buttons">{/* {{{ */}
                    {(state.mode === "play" && state.phase === "play" && state.cur_move_number >= state.official_move_number || null) &&
                        this.frag_play_buttons(show_cancel_button)
                    }
                    {(state.mode === "play" && state.phase === "play" && this.goban.isAnalysisDisabled() && state.cur_move_number < state.official_move_number || null) &&
                        <span>
                            <button className="sm primary bold" onClick={this.goban_setModeDeferredPlay}>{_("Back to Game")}</button>
                        </span>
                    }

                    {(state.mode === "analyze" && !this.goban.engine.config.original_sgf || null) &&
                        <span>
                            <button className="sm primary bold" onClick={this.goban_setModeDeferredPlay}>{_("Back to Game")}</button>
                            <button className="sm primary bold pass-button" onClick={this.analysis_pass}>{_("Pass")}</button>
                        </span>
                    }

                    {(state.mode === "score estimation" || null) &&
                        <span>
                            <button className="sm primary bold" onClick={this.stopEstimatingScore}>{_("Back to Game")}</button>
                        </span>
                    }

                    {/* (this.state.view_mode === 'portrait' || null) && <i onClick={this.togglePortraitTab} className={'tab-icon fa fa-commenting'}/> */}
                </div>
                {/* }}} */}
               <div ref={el => this.ref_game_state_label = el} className="game-state">{/*{{{*/}
                    {(state.mode === "play" && state.phase === "play" || null) &&
                        <span>
                            {state.show_undo_requested
                                ?
                                <span>
                                    {_("Undo Requested")}
                                </span>
                                :
                                <span>
                                    {(state.show_title || null) && <span>{state.title}</span>}
                                </span>
                            }
                        </span>
                    }
                    {(state.mode === "play" && state.phase === "stone removal" || null) &&
                        <span>
                            {_("Stone Removal Phase")}
                        </span>
                    }


                    {(state.mode === "analyze" || null) &&
                        <span>
                            {state.show_undo_requested
                                ?
                                <span>
                                    {_("Undo Requested")}
                                </span>
                                :
                                <span>
                            {_("Analyze Mode")}
                                </span>
                            }
                        </span>
                    }


                    {(state.mode === "conditional" || null) &&
                        <span>
                            {_("Conditional Move Planner")}
                        </span>
                    }

                    {(state.mode === "score estimation" || null) &&
                        <span>
                            {(state.score_estimate.winner || null) &&
                                <span>
                                    {interpolate(_("{{winner}} by {{score}}"), {"winner": this.goban.score_estimate.winner, "score": this.goban.score_estimate.amount})}
                                </span>
                            }
                            {(!state.score_estimate.winner || null) &&
                                <span>
                                    {_("Estimating...")}
                                </span>
                            }
                        </span>
                    }

                    {(state.mode === "play" && state.phase === "finished" || null) &&
                        <span>
                            {state.winner
                                ?
                                (interpolate(pgettext("Game winner", "%s wins by %s"), [
                                    (state.winner === this.goban.engine.black_player_id || state.winner === "black" ? _("Black") : _("White")),
                                    getOutcomeTranslation(this.goban.engine.outcome)
                                ]))
                                :
                                (interpolate(pgettext("Game winner", "Tie by %s"), [ pgettext("Game outcome", this.goban.engine.outcome)]))
                            }
                        </span>
                    }
                </div>
                {/*}}}*/}
                {((state.phase === "play" && state.mode === "play" && this.state.paused && this.goban.engine.pause_control && this.goban.engine.pause_control.paused) || null) &&  /* {{{ */
                    <div className="pause-controls">
                        <h3>{_("Game Paused")}</h3>
                        {(this.state.user_is_player || null) &&
                            <button className="info" onClick={this.goban_resumeGame}>
                               {_("Resume")}
                            </button>
                        }
                        <div>{
                            this.goban.engine.black_player_id === this.goban.engine.pause_control.paused.pausing_player_id
                                ? interpolate(_("{{pauses_left}} pauses left for Black"), {pauses_left: this.goban.engine.pause_control.paused.pauses_left})
                                : interpolate(_("{{pauses_left}} pauses left for White"), {pauses_left: this.goban.engine.pause_control.paused.pauses_left})
                        }</div>
                    </div>
                }{/* }}} */}
                {(this.state.phase === "finished" || null) &&  /* {{{ */
                    <div>
                        {(this.state.user_is_player && this.state.mode !== "score estimation" || null) &&
                            <button
                                onClick={this.rematch}
                                className="primary">
                                {_("Rematch")}
                            </button>
                        }

                        {(this.state.review_list.length > 0 || null) &&
                            <div className="review-list">
                                <h3>{_("Reviews")}</h3>
                                {this.state.review_list.map((review, idx) => (
                                    <div key={idx}>
                                        <Player user={review.owner} icon></Player> -  <Link to={`/review/${review.id}`}>{_("view")}</Link>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                }{/* }}} */}
                {(this.state.phase === "stone removal" || null) &&  /* {{{ */
                    <div className="stone-removal-controls">

                       <div>
                           {(this.state.user_is_player || null) &&
                               <button id="game-stone-removal-accept" className="primary" onClick={this.onStoneRemovalAccept}>
                                   {_("Accept removed stones")}
                                   <span style={{whiteSpace: "nowrap"}}>(<span id="stone-removal-clock"></span>)</span>
                               </button>
                           }
                       </div>
                       <br/>
                       <div style={{textAlign: "center"}}>
                           <div style={{textAlign: "left", display: "inline-block"}}>
                               <div>
                                   {(this.state.black_accepted || null) && <i className="fa fa-check" style={{color: "green", width: "1.5em"}}></i>}
                                   {(!this.state.black_accepted || null) && <i className="fa fa-times" style={{color: "red", width: "1.5em"}}></i>}
                                   {this.goban.engine.players.black.username}
                               </div>
                               <div>
                                   {(this.state.white_accepted || null) && <i className="fa fa-check" style={{color: "green", width: "1.5em"}}></i>}
                                   {(!this.state.white_accepted || null) && <i className="fa fa-times" style={{color: "red", width: "1.5em"}}></i>}
                                   {this.goban.engine.players.white.username}
                               </div>
                           </div>
                       </div>
                       <br/>

                       <div style={{textAlign: "center"}}>
                           {(this.state.user_is_player || null) &&
                               <button id="game-stone-removal-auto-score" onClick={this.onStoneRemovalAutoScore}>
                                   {_("Auto-score")}
                               </button>
                           }
                       </div>
                       <div style={{textAlign: "center"}}>
                          {(this.state.user_is_player || null) &&
                               <button id="game-stone-removal-cancel" onClick={this.onStoneRemovalCancel}>
                                   {_("Cancel and resume game")}
                               </button>
                          }
                       </div>

                       <div className="explanation">
                       {_("In this phase, both players select and agree upon which groups should be considered captured and should be removed for the purposes of scoring.")}
                       </div>
                       {/*
                       <i id='scoring-help' className='fa fa-question-circle'
                          popover='${_("Mark dead stones by clicking them. Mark dame by clicking the empty intersection. Holding down shift while selecting an intersection or stone will toggle only that selection.")|h}'
                          popover-title='${_("Stone Removal")|h}'
                          popover-trigger="mouseenter"
                          popover-placement="left"
                       ></i>
                       */}

                       { null &&   /* just going to disable this for now, no one cares I don't think */
                           (this.state.rules === "japanese" || this.state.rules === "korean" || null) &&
                           <div style={{paddingTop: "2rem", paddingBottom: "2rem", textAlign: "center"}}>
                               {/*
                               <i id='strict-scoring-help' className='fa fa-question-circle'
                                  popover="${_('Official Japanese and Korean rules do not count territory in seki, which means players need to fill out or mark dame for most territory to be counted correctly. Most of the time this rule doesn\'t affect the game and is just a nuisance, but you can enable being strict about this rule if it makes a difference in your game.')|h}"
                                  popover-title='${pgettext("Enable Japanese territory in seki rule", "Strict Scoring")|h}'
                                  popover-trigger="mouseenter"
                                  popover-placement="left"
                               ></i>
                               */}
                               <label style={{display: "inline-block"}} htmlFor="strict-seki-mode">{pgettext("Enable Japanese territory in seki rule", "Strict Scoring")}</label>
                               <input style={{marginTop: "-0.2em"}} name="strict-seki-mode" type="checkbox"
                                   checked={this.state.strict_seki_mode}
                                   disabled={!this.state.user_is_player}
                                   onChange={this.setStrictSekiMode}
                               ></input>
                           </div>
                       }

                    </div>
                }{/* }}} */}
                {(this.state.mode === "conditional" || null) &&  /* {{{ */
                    <div className="conditional-move-planner">
                      <div className="buttons">
                          <button className="primary" onClick={this.acceptConditionalMoves}>{_("Accept Conditional moves")}</button>
                          <button onClick={this.goban_setMode_play}>{_("Cancel")}</button>
                      </div>
                      <div className="ctrl-conditional-tree">
                          <hr/>
                          <span className="move-current" onClick={this.goban_jumpToLastOfficialMove}>{_("Current Move")}</span>
                          <PersistentElement elt={this.conditional_move_tree} />
                      </div>
                    </div>
                }{/* }}} */}
                {(this.state.mode === "analyze" || null) &&  /* {{{ */
                    <div>
                        {this.frag_analyze_button_bar()}

                        <Resizable id="move-tree-container" className="vertically-resizable">
                            <canvas id="move-tree-canvas"></canvas>
                        </Resizable>



                        <div style={{padding: "0.5em"}}>
                        <div className="input-group">
                            <input type="text" className={`form-control ${this.state.chat_log}`} placeholder={_("Variation name...")}
                                value={this.state.variation_name}
                                onChange={this.updateVariationName}
                                onKeyDown={this.variationKeyPress}
                                disabled={user.anonymous}
                                />
                                {(this.state.chat_log !== "malkovich" || null) && <button className="sm" type="button" disabled={user.anonymous} onClick={this.shareAnalysis}>{_("Share")}</button>}
                                {(this.state.chat_log === "malkovich" || null) && <button className="sm malkovich" type="button" disabled={user.anonymous} onClick={this.shareAnalysis}>{_("Record")}</button>}
                        </div>
                        </div>
                    </div>
                }{/* }}} */}

                {/*
                    (this.goban.engine.config.original_sgf || null) &&
                    <div style={{paddingLeft: '0.5em', paddingRight: '0.5em'}}>
                        <textarea id='game-move-node-text' placeholder={_("Move comments...")}
                            rows={5}
                            className='form-control'
                            disabled={true}></textarea>
                    </div>
                */}
            </div>
        );
    }}}
    frag_review_controls() {{{
        let user = data.get("user");

        if (!this.goban) {
            return null;
        }

        return (
            <div className="play-controls">
                <div ref={el => this.ref_game_state_label = el} className="game-state">
                    {_("Review by")}: <Player user={this.state.review_owner_id} />
                    {((this.state.review_controller_id && this.state.review_controller_id !== this.state.review_owner_id) || null) &&
                        <div>
                            {_("Review controller")}: <Player user={this.state.review_controller_id} />
                        </div>
                    }
                </div>
                <div>
                    {this.frag_analyze_button_bar()}

                    <div className="space-around">
                        <button className="sm primary bold pass-button" onClick={this.analysis_pass}>{_("Pass")}</button>
                        {(this.state.review_controller_id && this.state.review_controller_id !== user.id) &&
                            this.state.review_out_of_sync &&
                            <button className="sm" onClick={this.syncToCurrentReviewMove}>
                                {pgettext("Synchronize to current review position", "Sync")} <i className='fa fa-refresh'/>
                            </button>
                        }
                    </div>

                    <Resizable id="move-tree-container" className="vertically-resizable">
                        <canvas id="move-tree-canvas"></canvas>
                    </Resizable>

                    <div style={{paddingLeft: "0.5em", paddingRight: "0.5em"}}>
                        <textarea id="game-move-node-text" placeholder={_("Move comments...")}
                            rows={5}
                            className="form-control"
                            value={this.state.move_text}
                            disabled={this.state.review_controller_id !== data.get("user").id}
                            onChange={this.updateMoveText}
                            ></textarea>
                    </div>

                    <div style={{padding: "0.5em"}}>
                        <div className="input-group">
                            <input type="text" className={`form-control ${this.state.chat_log}`} placeholder={_("Variation name...")}
                                value={this.state.variation_name}
                                onChange={this.updateVariationName}
                                onKeyDown={this.variationKeyPress}
                                disabled={user.anonymous}
                                />
                            <button className="sm" type="button" disabled={user.anonymous} onClick={this.shareAnalysis}>{_("Share")}</button>
                        </div>
                    </div>

                    <div style={{padding: "0.5em", textAlign: "center"}}>
                        {_("Voice Chat: ")} <VoiceChat channel={"review-" + this.review_id} hasVoice={ this.hasVoice(user.id) } />
                    </div>
                </div>
            </div>
        );
    }}}
    frag_analyze_button_bar() {{{
        return (
        <div className="game-analyze-button-bar">
            {/*
            {(this.review || null) &&
                <i id='review-sync' className='fa fa-refresh {{goban.engine.cur_move.id !== goban.engine.cur_review_move.id ? "need-sync" : ""}}'
                    onClick={this.syncToCurrentReviewMove()} title={_("Sync to where the reviewer is at")}></i>
            }
            */}
            <div className="btn-group">
                <button onClick={this.set_analyze_tool.stone_alternate}
                     className={"stone-button " + ((this.state.analyze_tool === "stone" && (this.state.analyze_subtool !== "black" && this.state.analyze_subtool !== "white")) ? "active" : "")}>
                     <img alt="alternate" src={data.get("config.cdn_release") + "/img/black-white.png"}/>
                </button>

                <button onClick={this.set_analyze_tool.stone_black}
                     className={"stone-button " + ((this.state.analyze_tool === "stone" && this.state.analyze_subtool === "black") ? "active" : "")}>
                     <img alt="alternate" src={data.get("config.cdn_release") + "/img/black.png"}/>
                </button>

                <button onClick={this.set_analyze_tool.stone_white}
                     className={"stone-button " + ((this.state.analyze_tool === "stone" && this.state.analyze_subtool === "white") ? "active" : "")}>
                     <img alt="alternate" src={data.get("config.cdn_release") + "/img/white.png"}/>
                </button>
            </div>

            <div className="btn-group">
                <button onClick={this.set_analyze_tool.draw}
                    className={(this.state.analyze_tool === "draw") ? "active" : ""}
                    >
                    <i className="fa fa-pencil"></i>
                </button>
                <button onClick={this.clearAnalysisDrawing}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>
            <input type="color" value={this.state.analyze_pencil_color} onChange={this.setPencilColor}/>

            <button onClick={this.goban_deleteBranch}>
                <i className="fa fa-trash"></i>
            </button>

            <div className="btn-group">
                <button onClick={this.set_analyze_tool.label_letters}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "letters") ? "active" : ""}>
                    <i className="fa fa-font"></i>
                </button>
                <button onClick={this.set_analyze_tool.label_numbers}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "numbers") ? "active" : ""}>
                    <i className="ogs-label-number"></i>
                </button>
                <button onClick={this.set_analyze_tool.label_triangle}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "triangle") ? "active" : ""}>
                    <i className="ogs-label-triangle"></i>
                </button>
                <button onClick={this.set_analyze_tool.label_square}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "square") ? "active" : ""}>
                    <i className="ogs-label-square"></i>
                </button>
                <button onClick={this.set_analyze_tool.label_circle}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "circle") ? "active" : ""}>
                    <i className="ogs-label-circle"></i>
                </button>
                <button onClick={this.set_analyze_tool.label_cross}
                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "cross") ? "active" : ""}>
                    <i className="ogs-label-x"></i>
                </button>
            </div>

        </div>
        );
    }}}

    frag_clock(color) {{{
        return (
          <div id={`game-${color}-clock`} className={(color + " clock in-game-clock") + (this.state[`${color}_pause_text`] ? " paused" : "")}>
              <div className="main-time boxed"></div>
              {(this.goban.engine.time_control.time_control === "byoyomi" || null) &&
                  <span> + <div className="periods boxed"/> x <div className="period-time boxed"/></span>
              }
              {(this.goban.engine.time_control.time_control === "canadian" || null) &&
                  <span> + <div className="period-time boxed"/> / <div className="periods boxed"/></span>
              }
              {(this.state[`${color}_pause_text`] || null) &&
                  <div className="pause-text">{this.state[`${color}_pause_text`]}</div>
              }
              {null && (this.goban.engine.time_control.time_control === "byoyomi" || this.goban.engine.time_control.time_control === "canadian" || null) &&

                  <div className="overtime-container">
                      <div className="overtime">{_("OVERTIME")}</div>
                      <div className="periods-container">
                          <div className="periods boxed">&nbsp;</div>
                          <div className="period-time boxed">&nbsp;</div>
                      </div>
                  </div>
              }
          </div>
        );
    }}}
    frag_players() {{{
        let goban = this.goban;
        if (!goban) {
            return null;
        }
        let engine = goban.engine;
        let portrait_game_mode = this.state.view_mode === "portrait" && this.state.portrait_tab === "game";


        return (
            <div ref={el => this.ref_players = el} className="players">
              {["black", "white"].map((color, idx) => {
                  let player_bg: any = {};
                  if (this.state[`historical_${color}`]) {
                      let icon = icon_size_url(this.state[`historical_${color}`]['icon'], 64);
                      player_bg.backgroundImage = `url("${icon}")`;
                  }

                  return (
                  <div key={idx} className={`${color} player-container`}>
                      {this.state[`${color}_auto_resign_expiration`] &&
                          <div className={`auto-resign-overlay`}>
                              <i className='fa fa-bolt' />
                              <CountDown to={this.state[`${color}_auto_resign_expiration`]} />
                          </div>
                      }

                      <div className="player-icon-clock-row">
                          {((engine.players[color] && engine.players[color].id) || null) &&
                              <div className="player-icon-container" style={player_bg}>
                                 <div className="player-flag"><Flag country={engine.players[color].country}/></div>
                                 <ChatPresenceIndicator channel={this.game_id ? `game-${this.game_id}` : `review-${this.review_id}`} userId={engine.players[color].id} />
                              </div>
                          }

                          {(goban.engine.phase !== "finished" && !goban.review_id || null) &&
                              this.frag_clock(color)
                          }
                      </div>

                      {((goban.engine.players[color] && goban.engine.players[color].rank !== -1) || null) &&
                          <div className={`${color} player-name-container`}>
                             <Player user={ this.state[`historical_${color}`] || goban.engine.players[color] } disableCacheUpdate />
                          </div>
                      }

                      {((!goban.engine.players[color]) || null) &&
                          <span className="player-name-plain">{color === "black" ? _("Black") : _("White")}</span>
                      }


                      <div className="score-container" onMouseEnter={this.score_popups[`popup_${color}`]} onMouseLeave={this.score_popups[`hide_${color}`]}>
                          {((goban.engine.phase === "finished" || goban.engine.phase === "stone removal" || null) && goban.mode !== "analyze" &&
                            goban.engine.outcome !== "Timeout" && goban.engine.outcome !== "Resignation" && goban.engine.outcome !== "Cancellation") &&
                              <div className="points">
                                  {interpolate(_("{{total}} {{unit}}"), {"total": this.state.score[color].total, "unit": ngettext("point", "points", this.state.score[color].total)})}
                              </div>
                          }
                          {((goban.engine.phase !== "finished" && goban.engine.phase !== "stone removal" || null) || goban.mode === "analyze" ||
                            goban.engine.outcome === "Timeout" || goban.engine.outcome === "Resignation" || goban.engine.outcome === "Cancellation") &&
                              <div className="captures">
                                  {interpolate(_("{{captures}} {{unit}}"), {"captures": this.state.score[color].prisoners, "unit": ngettext("capture", "captures", this.state.score[color].prisoners)})}
                              </div>
                          }
                          {((goban.engine.phase !== "finished" && goban.engine.phase !== "stone removal" || null) || goban.mode === "analyze" ||
                            goban.engine.outcome === "Timeout" || goban.engine.outcome === "Resignation" || goban.engine.outcome === "Cancellation") &&
                              <div className="komi">
                                {this.state.score[color].komi === 0 ? "" : `+ ${parseFloat(this.state.score[color].komi).toFixed(1)}`}
                              </div>
                          }
                          <div id={`${color}-score-details`} className="score-details"/>
                      </div>
                  </div>
              ); })}
            </div>
        );
    }}}
    frag_below_board_controls() {{{
        let goban = this.goban;

        if (this.state.view_mode === "portrait" && this.state.portrait_tab === "dock") {
            return (
                <div ref={el => this.ref_action_bar = el} className="action-bar">
                    <span className="move-number">
                        <i onClick={this.togglePortraitTab} className={"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }

        if (this.state.view_mode === "portrait" && this.state.portrait_tab === "chat") {
            return (
                <div ref={el => this.ref_action_bar = el} className="action-bar">
                    <span className="move-number">
                        <i onClick={this.togglePortraitTab} className={/*'tab-icon fa fa-list-ul'*/"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }

        return (
            <div ref={el => this.ref_action_bar = el} className="action-bar">
                <span className="icons" />{/* for flex centering */}
                <span className="controls">
                    <span onClick={this.nav_first} className="move-control"><i className="fa fa-fast-backward"></i></span>
                    <span onClick={this.nav_prev_10} className="move-control"><i className="fa fa-backward"></i></span>
                    <span onClick={this.nav_prev} className="move-control"><i className="fa fa-step-backward"></i></span>
                    <span onClick={this.nav_play_pause} className="move-control"><i className={"fa " + (this.state.autoplaying ? "fa-pause" : "fa-play")}></i></span>
                    <span onClick={this.nav_next} className="move-control"><i className="fa fa-step-forward"></i></span>
                    <span onClick={this.nav_next_10} className="move-control"><i className="fa fa-forward"></i></span>
                    <span onClick={this.nav_last} className="move-control"><i className="fa fa-fast-forward"></i></span>
                </span>

                {((this.state.view_mode !== "portrait") || null) &&
                <span className="move-number">
                    {interpolate(_("Move {{move_number}}"), {"move_number": goban && this.goban.engine.getMoveNumber()})}
                </span>
                }
            </div>
        );
    }}}

    frag_dock() {{{
        let goban = this.goban;
        let mod = (goban && data.get("user").is_moderator && goban.engine.phase !== "finished" || null);
        let annul = (goban && data.get("user").is_moderator && goban.engine.phase === "finished" || null);
        let review = !!this.review_id || null;
        let game = !!this.game_id || null;
        if (review) {
            mod = null;
            annul = null;
        }

        let game_id = null;
        let sgf_download_enabled = false;
        try {
            sgf_download_enabled = this.goban.engine.phase === 'finished' || !this.goban.isAnalysisDisabled(true);
            game_id = this.goban.engine.config.game_id;

        } catch (e) {}

        let sgf_url = null;
        if (this.game_id) {
            sgf_url = api1(`games/${this.game_id}/sgf`);
        } else {
            sgf_url = api1(`reviews/${this.review_id}/sgf`);
        }

        return (
            <Dock>
                {(this.tournament_id || null) &&
                    <Link className="plain" to={`/tournament/${this.tournament_id}`}><i className="fa fa-trophy" title={_("This is a tournament game")}/> {_("Tournament")}</Link>
                }
                {(this.ladder_id || null) &&
                    <Link className="plain" to={`/ladder/${this.ladder_id}`}><i className="fa fa-trophy" title={_("This is a ladder game")}/> {_("Ladder")}</Link>
                }
                {(this.goban && this.goban.engine.config["private"] || null) &&
                    <a onClick={this.openACL}><i className="fa fa-lock"/> {pgettext("Control who can access the game or review", "Access settings")}</a>
                }

                <a>
                    <i className={"fa volume-icon " +
                        (this.state.volume === 0 ? "fa-volume-off"
                            : (this.state.volume > 0.5 ? "fa-volume-up" : "fa-volume-down"))}
                            onClick={this.toggleVolume}
                    /> <input type="range"
                        onChange={this.setVolume}
                        value={this.state.volume} min={0} max={1.0} step={0.01}
                    /> <i className="fa fa-save" onClick={this.saveVolume} style={{cursor: "pointer"}}/>
                </a>

                <a onClick={this.toggleZenMode}><i className="ogs-zen-mode"></i> {_("Zen mode")}</a>
                <a onClick={this.toggleCoordinates}><i className="ogs-coordinates"></i> {_("Toggle coordinates")}</a>
                <a onClick={this.showGameInfo}><i className="fa fa-info"></i> {_("Game information")}</a>
                {game &&
                    <a onClick={this.gameAnalyze} className={goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""} >
                        <i className="fa fa-sitemap"></i> {_("Analyze game")}
                    </a>
                }
                {(goban && this.state.user_is_player && goban.engine.phase !== "finished" || null) &&
                    <a style={{visibility: goban.mode === "play" && goban && goban.engine.playerToMove() !== data.get("user").id ? "visible" : "hidden"}}
                       className={goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""}
                       onClick={this.enterConditionalMovePlanner}>
                       <i className="fa fa-exchange"></i> {_("Plan conditional moves")}
                    </a>
                }
                {(goban && this.state.user_is_player && goban.engine.phase !== "finished" || null) &&
                    <a onClick={this.pauseGame}><i className="fa fa-pause"></i> {_("Pause game")}</a>
                }
                {game &&
                    <a onClick={this.startReview} className={goban && goban.engine.phase !== "finished" && goban.isAnalysisDisabled() ? "disabled" : ""}>
                        <i className="fa fa-refresh"></i> {_("Review this game")}
                    </a>
                }
                {game && <a onClick={this.estimateScore}><i className="fa fa-tachometer"></i> {_("Estimate score")}</a>}
                <a onClick={this.fork}><i className="fa fa-code-fork"></i> {_("Fork game")}</a>
                <a onClick={this.alertModerator}><i className="fa fa-exclamation-triangle"></i> {_("Call moderator")}</a>
                {review && game_id && <Link to={`/game/${game_id}`}><i className="ogs-goban"/> {_("Original game")}</Link>}
                <a onClick={this.showLinkModal}><i className="fa fa-share-alt"></i> {review ? _("Link to review") : _("Link to game")}</a>
                {sgf_download_enabled
                    ? <a href={sgf_url} target='_blank'><i className="fa fa-download"></i> {_("Download SGF")}</a>
                    : <a className='disabled' onClick={() => swal(_("SGF downloading for this game is disabled until the game is complete."))}><i className="fa fa-download"></i> {_("Download SGF")}</a>
                }
                {(mod || annul) && <hr/>}
                {mod && <a onClick={this.decide_black}><i className="fa fa-gavel"></i> {_("Black Wins")}</a>}
                {mod && <a onClick={this.decide_white}><i className="fa fa-gavel"></i> {_("White Wins")}</a>}
                {mod && <a onClick={this.decide_tie}><i className="fa fa-gavel"></i> {_("Tie")}</a>}
                {annul && <a onClick={this.annul}><i className="fa fa-gavel"></i> {_("Annul")}</a>}
            </Dock>
        );
    }}}
    frag_kb_shortcuts() {{{
        let goban = this.goban;

        return (
            <div>
                {((this.game_id > 0) || null) && <UIPush event="review-added" channel={`game-${this.game_id}`} action={this.reviewAdded}/>}
                <KBShortcut shortcut="up" action={this.nav_up}/>
                <KBShortcut shortcut="down" action={this.nav_down}/>
                <KBShortcut shortcut="left" action={this.nav_prev}/>
                <KBShortcut shortcut="right" action={this.nav_next}/>
                <KBShortcut shortcut="page-up" action={this.nav_prev_10}/>
                <KBShortcut shortcut="page-down" action={this.nav_next_10}/>
                <KBShortcut shortcut="space" action={this.nav_play_pause}/>
                <KBShortcut shortcut="home" action={this.nav_first}/>
                <KBShortcut shortcut="end" action={this.nav_last}/>
                <KBShortcut shortcut="escape" action={this.handleEscapeKey}/>

                <KBShortcut shortcut="f1" action={this.set_analyze_tool.stone_null}/>
                <KBShortcut shortcut="f2" action={this.set_analyze_tool.stone_black}/>
                {/* <KBShortcut shortcut='f3' action='console.log("Should be entering scoring mode");'></KBShortcut> */}
                <KBShortcut shortcut="f4" action={this.set_analyze_tool.label_triangle}/>
                <KBShortcut shortcut="f5" action={this.set_analyze_tool.label_square}/>
                <KBShortcut shortcut="f6" action={this.set_analyze_tool.label_circle}/>
                <KBShortcut shortcut="f7" action={this.set_analyze_tool.label_letters}/>
                <KBShortcut shortcut="f8" action={this.set_analyze_tool.label_numbers}/>
                <KBShortcut shortcut="f9" action={this.set_analyze_tool.draw}/>
                {((goban && goban.mode === "analyze") || null) && <KBShortcut shortcut="f10" action={this.set_analyze_tool.clear_and_sync}/>}
                <KBShortcut shortcut="del" action={this.set_analyze_tool.delete_branch}/>
            </div>
        );
    }}}

    renderExtraPlayerActions = (player_id: number, user: any) => {{{
        let user = data.get("user");
        if (this.review_id && this.goban && (this.goban.review_controller_id === user.id || this.goban.review_owner_id === user.id)) {
            let is_owner = null;
            let is_controller = null;
            if (this.goban.review_owner_id === player_id) {
                is_owner = <div style={{fontStyle: "italic"}}>{_("Owner") /* translators: Review owner */}</div>;
            }
            if (this.goban.review_controller_id === player_id) {
                is_controller = <div style={{fontStyle: "italic"}}>{_("Controller") /* translators: Review controller */}</div>;
            }

            let give_control = (
                <button className="xs" onClick={() => {
                    this.goban.giveReviewControl(player_id);
                    close_all_popovers();
                }}>{_("Give Control") /* translators: Give control in review or on a demo board */}</button>
            );

            if (player_id === this.goban.review_owner_id) {
                return (
                    <div>
                        {is_owner}
                        {is_controller}
                        <div className="actions">
                            {give_control}
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    {is_owner}
                    {is_controller}
                    <div className="actions">
                        {give_control}
                    </div>
                </div>
            );
        }
        return null;
    }}}
}


export function goban_view_mode(bar_width?: number): ViewMode {{{
    if (!bar_width) {
        bar_width = 300;
    }

    let h = win.height() || 1;
    let w = win.width() || 1;
    let aspect_ratio = w / h;

    //swal('' + aspect_ratio + ` ${w}x${h}`);

    if (((aspect_ratio <= 0.8) || w < bar_width * 2) && w < 1280) {
        return "portrait";
    }

    if (aspect_ratio >= 1920 / 1200 && w >= 1280) {
        return "wide";
    }

    //swal('' + aspect_ratio);

    //return 'square';
    return "wide";
}}}
export function goban_view_squashed(): boolean {{{
    //return win.height() < 680;
    /* This value needs to match the "dock-inline-height" found in Dock.styl */
    return win.height() <= 500;
}}}



export class CountDown extends React.PureComponent<{to:Date}, any> { /* {{{ */
    timeout: any;

    constructor(props) {
        super(props);
        this.state = {
            display: this.format(props.to.getTime() - Date.now())
        };
    }

    update() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        let left = this.props.to.getTime() - Date.now();

        if (left > 0) {
            //this.timeout = setTimeout(() => this.update(), left % 100 || 100);
            this.timeout = setTimeout(() => this.update(), 100);
        }

        this.setState({display: this.format(left)});
    }

    format(ms) {
        if (ms < 0) {
            return '0:00.0';
        }

        let minutes = Math.floor(ms / 60000);
        ms -= minutes * 60000;
        let seconds = Math.floor(ms / 1000);
        ms -= seconds * 1000;
        let tenths = Math.floor(ms / 100);

        if (seconds < 10) {
            return `${minutes}:0${seconds}.${tenths}`;
        }
        return `${minutes}:${seconds}.${tenths}`;
    }

    componentDidMount() {
        this.update();
    }

    componentDidUpdate(prevProps, prevState) {
        this.update();
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
    }

    render() {
        return <div>{this.state.display}</div>;
    }
} /* }}} */



/* Chat {{{ */
export class GameChat extends React.PureComponent<GameChatProperties, any> {
    ref_chat_log;

    scrolled_to_bottom: boolean = true;

    constructor(props) { /* {{{ */
        super(props);
        this.state = {
            chat_log: "main",
            show_player_list: false,
        };
        this.chat_log_filter = this.chat_log_filter.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.updateScrollPosition = this.updateScrollPosition.bind(this);
    } /* }}} */

    chat_log_filter(line) {{{
        return true;
    }}}
    onKeyPress(event) {{{
        if (event.charCode === 13) {
            let input = event.target as HTMLInputElement;
            this.props.gameview.goban.sendChat(input.value, this.state.chat_log);
            input.value = "";
            return false;
        }
    }}}

    componentDidMount() {{{
        this.autoscroll();
    }}}
    componentDidUpdate() {{{
        this.autoscroll();
    }}}

    updateScrollPosition() {{{
        let tf = this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 < this.ref_chat_log.offsetHeight;
        if (tf !== this.scrolled_to_bottom) {
            this.scrolled_to_bottom  = tf;
            this.ref_chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        this.scrolled_to_bottom = this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 < this.ref_chat_log.offsetHeight;
    }}}
    autoscroll() {{{
        if (this.scrolled_to_bottom) {
            this.ref_chat_log.scrollTop = this.ref_chat_log.scrollHeight;
            setTimeout(() => {
                if (this.ref_chat_log) {
                    this.ref_chat_log.scrollTop = this.ref_chat_log.scrollHeight;
                }
            }, 100);
        }
    }}}
    toggleChatLog = () => {{{
        let new_chat_log = this.state.chat_log === "main" ? "malkovich" : "main";
        this.setState({
            chat_log: new_chat_log
        });
        this.props.onChatLogChanged(new_chat_log);
    }}}
    togglePlayerList = () => {{{
        this.setState({
            show_player_list: !this.state.show_player_list
        });
    }}}
    togglePlayerListSortOrder = () => {{{
    }}}

    render() {{{
        let last_line = null;
        let user = data.get("user");
        let channel = this.props.gameview.game_id ? `game-${this.props.gameview.game_id}` : `review-${this.props.gameview.review_id}`;

        return (
            <div className="chat-container">
                <div className={"log-player-container" + (this.state.show_player_list ? " show-player-list" : "")}>
                    <div className="chat-log-container">
                        <div ref={el => this.ref_chat_log = el} className="chat-log autoscrolling" onScroll={this.updateScrollPosition}>
                            {this.props.chatlog.filter(this.chat_log_filter).map((line, idx) => {
                                //console.log(">>>" ,line.chat_id)
                                let ll = last_line;
                                last_line = line;
                                //jreturn <GameChatLine key={line.chat_id} line={line} lastline={ll} gameview={this.props.gameview} />
                                return <GameChatLine key={line.chat_id} line={line} lastline={ll} gameview={this.props.gameview} />;
                            })}
                        </div>
                    </div>
                    {(this.state.show_player_list || null) &&
                        <ChatUserList channel={channel} />
                    }
                </div>
                <div className="chat-input-container input-group">
                    {((this.props.userIsPlayer && data.get('user').email_validated) || null) &&
                        <button
                            className={`chat-input-chat-log-toggle sm ${this.state.chat_log}`}
                            onClick={this.toggleChatLog}
                            >
                            {this.state.chat_log === "malkovich" ? _("Malkovich") : _("Chat")} <i className={"fa " + (this.state.chat_log === "malkovich" ? "fa-caret-up" : "fa-caret-down")}/>
                        </button>
                    }
                    <TabCompleteInput className={`chat-input  ${this.state.chat_log}`}
                        disabled={user.anonymous || !data.get('user').email_validated}
                        placeholder={user.anonymous
                            ? _("Login to chat")
                            : !data.get('user').email_validated ? _("Chat will be enabled once your email address has been validated")
                                : (this.state.chat_log === "malkovich"
                                    ? pgettext("Malkovich logs are only visible after the game has ended", "Visible after the game")
                                    : _("Say hi!")
                                  )
                        }
                        onKeyPress={this.onKeyPress}
                    />
                    <ChatUserCount
                        chat={this}
                        active={this.state.show_player_list}
                        channel={channel}
                    />
                </div>
            </div>
        );
    }}}
}


function parsePosition(position: string) {{{
    if (!active_game_view) { return; }
    let goban = active_game_view.goban;

    let i = "abcdefghjklmnopqrstuvwxyz".indexOf(position[0].toLowerCase());
    let j = ((goban && goban.height) || 19) - parseInt(position.substr(1));
    if (j < 0 || i < 0) {
        i = -1;
        j = -1;
    }
    if (i >= ((goban && goban.width) || 19) || j >= ((goban && goban.height) || 19)) {
        i = -1;
        j = -1;
    }
    return {"i": i, "j": j};
}}}
function highlight_position(event) {{{
    if (!active_game_view) { return; }

    let pos = parsePosition(event.target.innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = true;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}}}
function unhighlight_position(event) {{{
    if (!active_game_view) { return; }

    let pos = parsePosition(event.target.innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = false;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}}}

export class GameChatLine extends React.Component<GameChatLineProperties, any> {
    //scrolled_to_bottom:any = {"malkovich": true, "main": true};

    constructor(props) {
        super(props);
    }

    chat_markup(body, extra_pattern_replacements?: Array<{split: RegExp; pattern: RegExp; replacement: ((m: any, idx: number) => any)}>): Array<JSX.Element> {{{
        let replacements = [
            {split: /(https?:\/\/[^<> ]+)/gi, pattern: /(https?:\/\/[^<> ]+)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)},
            {split: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  pattern: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  replacement: (m, idx) => (<a key={idx} target="_blank" href={"mailto:" + m[1]}>{m[1]}</a>)},
            {split: /(^##[0-9]{3,}|[ ]##[0-9]{3,})/gi, pattern: /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
                replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}##${m[2] || ""}${m[4] || ""}`}</Link>)},
            {split: /(^#[0-9]{3,}|[ ]#[0-9]{3,})/gi, pattern: /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi,
                replacement: (m, idx) => (<Link key={idx} to={`/game/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}#${m[2] || ""}${m[4] || ""}`}</Link>)},
            {split: /(#group-[0-9]+)/gi, pattern: /(#group-([0-9]+))/gi, replacement: (m, idx) => (<Link key={idx} to={`/group/${m[2]}`}>{m[1]}</Link>)},
            {split: /(#group-[0-9]+)/gi, pattern: /(#group-([0-9]+))/gi, replacement: (m, idx) => (<Link key={idx} to={`/group/${m[2]}`}>{m[1]}</Link>)},
            {split: /(%%%PLAYER-[0-9]+%%%)/g, pattern: /(%%%PLAYER-([0-9]+)%%%)/g, replacement: (m, idx) => (<Player key={idx} user={parseInt(m[2])}/>)},
        ];

        if (extra_pattern_replacements) {
            replacements = replacements.concat(extra_pattern_replacements);
        }

        let ret = [profanity_filter(body)];
        for (let r of replacements) {
            ret = [].concat.apply([], ret.map((text_fragment) => {
                return text_fragment.split(r.split);
            }));
        }

        for (let i = 0; i < ret.length; ++i) {
            let fragment = ret[i];
            let matched = false;
            for (let r of replacements) {
                let m = r.pattern.exec(fragment);
                if (m) {
                    ret[i] = r.replacement(m, i);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                ret[i] = <span key={i}>{ret[i]}</span>;
            }
        }

        return ret;
    }}}

    markup(body): JSX.Element|Array<JSX.Element> {{{
        if (typeof(body) === "string") {
            return this.chat_markup(body, [
                {split: /(\b[a-zA-Z][0-9]{1,2}\b)/mg, pattern: /\b([a-zA-Z][0-9]{1,2})\b/mg,
                    replacement: (m, idx) => {
                        let pos = m[1];
                        if (parsePosition(pos).i < 0) {
                            return (<span key={idx}>{m[1]}</span>);
                        }
                        return (<span key={idx} className="position" onMouseEnter={highlight_position} onMouseLeave={unhighlight_position}>{m[1]}</span>);
                    }
                },
            ]);
        } else {
            try {
                switch (body.type) {
                    case "analysis":
                        {
                            let gameview = this.props.gameview;
                            let goban = gameview.goban;
                            let orig_move = null;
                            let stashed_pen_marks = goban.pen_marks;
                            let orig_marks = null;

                            let v = parseInt("" + (body.name ? body.name.replace(/^[^0-9]*/, "") : 0));
                            if (v) {
                                this.props.gameview.last_variation_number = Math.max(v, this.props.gameview.last_variation_number);
                            }

                            let onLeave = () => {
                                if (this.props.gameview.in_pushed_analysis) {
                                    this.props.gameview.in_pushed_analysis = false;
                                    this.props.gameview.leave_pushed_analysis = null;
                                    goban.engine.jumpTo(orig_move);
                                    orig_move.marks = orig_marks;
                                    goban.pen_marks = stashed_pen_marks;
                                    if (goban.pen_marks.length === 0) {
                                        goban.detachPenCanvas();
                                    }
                                    goban.redraw();
                                }
                            };

                            let onEnter = () => {
                                this.props.gameview.in_pushed_analysis = true;
                                this.props.gameview.leave_pushed_analysis = onLeave;
                                let turn = "branch_move" in body ? body.branch_move - 1 : body.from; /* branch_move exists in old games, and was +1 from our current counting */
                                let moves = body.moves;

                                orig_move = goban.engine.cur_move;
                                orig_marks = orig_move.marks;
                                orig_move.clearMarks();
                                goban.engine.followPath(parseInt(turn), moves);

                                if (body.marks) {
                                    goban.setMarks(body.marks);
                                }
                                stashed_pen_marks = goban.pen_marks;
                                if (body.pen_marks) {
                                    goban.pen_marks = [].concat(body.pen_marks);
                                } else {
                                    goban.pen_marks = [];
                                }

                                goban.redraw();
                            };

                            let onClick = () => {
                                onLeave();
                                goban.setMode("analyze");
                                onEnter();
                                this.props.gameview.in_pushed_analysis = false;
                                goban.updateTitleAndStonePlacement();
                                goban.syncReviewMove();
                                goban.redraw();
                            };

                            return (
                                <span className="variation"
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    onClick={onClick}
                                >
                                    {_("Variation") + ": " + (body.name ? profanity_filter(body.name) : "<error>")}
                                </span>
                            );
                        }
                    case "review":
                        return <Link to={`/review/${body.review_id}`}>{interpolate(_("Review: ##{{id}}"), {"id": body.review_id})}</Link>;
                    default:
                        return <span>[error loading chat line]</span>;
                }
            } catch (e) {
                console.log(e.stack);
                return <span>[error loading chat line]</span>;
            }
        }
    }}}

    shouldComponentUpdate(next_props, _next_state) {{{
        return this.props.line.chat_id !== next_props.line.chat_id;
    }}}

    jumpToMove = () => {{{
       let line = this.props.line;
       let goban = this.props.gameview.goban;

       if ("move_number" in line) {
           if (!goban.isAnalysisDisabled()) {
               goban.setMode("analyze");
           }

            goban.engine.followPath(line.move_number, "");
            goban.redraw();

            if (goban.isAnalysisDisabled()) {
                goban.updatePlayerToMoveTitle();
            }

            goban.emit("update");
       }

       if ("from" in line) {
            let mvs = goban.engine.decodeMoves(line.moves);
            let ct = 0;
            for (let i = 0; i < mvs.length; ++i) {
                ct += mvs[i].edited ? 0 : 1;
            }

            if (goban.isAnalysisDisabled()) {
                goban.setMode("analyze");
            }

            goban.engine.followPath(line.from, line.moves);
            goban.syncReviewMove();
            goban.drawPenMarks(goban.engine.cur_move.pen_marks);
            goban.redraw();
            //last_move_number[type] = line.from;
            //last_moves[type] = line.moves;
       }

    }}}

    render() {{{
        let line = this.props.line;
        let lastline = this.props.lastline;
        let ts = line.date ? new Date(line.date * 1000) : null;
        let third_person = "";
        if (typeof(line.body) === "string" && line.body.substr(0, 4) === "/me ") {
            third_person = (line.body.substr(0, 4) === "/me ") ? "third-person" : "";
            line.body = line.body.substr(4);
        }
        let msg = this.markup(line.body);
        let show_date: JSX.Element = null;
        let move_number: JSX.Element = null;

        if (!lastline || (line.date && lastline.date)) {
            if (line.date) {
                if (!lastline || moment(new Date(line.date * 1000)).format("YYYY-MM-DD") !== moment(new Date(lastline.date * 1000)).format("YYYY-MM-DD")) {
                    show_date = <div className="date">{moment(new Date(line.date * 1000)).format("LL")}</div>;
                }
            }
        }


        if (!lastline || (line.move_number !== lastline.move_number) || (line.from !== lastline.from) || (line.moves !== lastline.moves)) {
            move_number = <LineText className="move-number" onClick={this.jumpToMove}>Move {
                ("move_number" in line
                    ? line.move_number
                    : ("moves" in line ? (line.from + (line.moves.length ? " + " + line.moves.length / 2 : "")) : "")
                )
            }</LineText>;
        }

        return (
            <div className={`chat-line-container`}>
                {move_number}
                {show_date}
                <div className={`chat-line ${line.channel} ${third_person}`}>
                    {(ts) && <span className="timestamp">[{ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}] </span>}
                    {(line.player_id || null) && <Player user={line} flare disableCacheUpdate />}
                    <span className="body">{third_person ? " " : ": "}{msg}</span>
                </div>
            </div>
        );
    }}}
}

/* }}} */
