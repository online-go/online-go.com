/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GoEngine, encodeMove, encodeMoves} from "./GoEngine";
import {GoMath} from "./GoMath";
import {GoStoneGroup} from "./GoStoneGroup";
import {GoConditionalMove} from "./GoConditionalMove";
import {GoThemes} from "./GoThemes";
import {MoveTree} from "./MoveTree";
import {init_score_estimator, ScoreEstimator} from "./ScoreEstimator";
import {createDeviceScaledCanvas, resizeDeviceScaledCanvas, deviceCanvasScalingRatio,
    deepEqual, getRelativeEventPosition, getRandomInt, shortDurationString, dup
} from "./GoUtil";
import {TypedEventEmitter} from "TypedEventEmitter";
import {sfx} from "./SFXManager";
import {_, pgettext, interpolate} from "./translate";


export const GOBAN_FONT =  "Verdana,Arial,sans-serif";
declare let swal;

const SCORE_ESTIMATION_TRIALS = 1000;
const SCORE_ESTIMATION_TOLERANCE = 0.30;
const AUTOSCORE_TRIALS = 1000;
const AUTOSCORE_TOLERANCE = 0.30;

let __theme_cache = {"black": {}, "white": {}};
let last_goban_id = 0;

interface Events {
    "destroy": never;
    "update": never;
    "chat-reset": never;
    "reset": any;
    "error": any;
    "gamedata": any;
    "chat": any;
    "move-made": never;
    "review.sync-to-current-move": never;
    "review.updated": never;
    "title": string;
    "puzzle-wrong-answer": never;
    "puzzle-correct-answer": never;
    "show-submit": boolean;
    "state_text": {
        title: string;
        show_moves_made_count?: boolean;
    };
    "advance-to-next-board": never;
    "pause-text": {
        white_pause_text: string;
        black_pause_text: string;
    };
    "auto-resign": {
        game_id: number;
        player_id: number;
        expiration: number;
    };
    "clear-auto-resign": {
        game_id: number;
        player_id: number;
    };
    "set-for-removal": {x:number, y:number, removed:boolean};
    "puzzle-place": {x:number, y:number};
}


export abstract class Goban extends TypedEventEmitter<Events> {
    public conditional_starting_color:'black'|'white'|'invalid';
    public analyze_subtool:string;
    public analyze_tool:string;
    public black_pause_text: string = null;
    public conditional_tree:GoConditionalMove;
    public double_click_submit: boolean;
    public draw_bottom_labels:boolean;
    public draw_left_labels:boolean;
    public draw_right_labels:boolean;
    public draw_top_labels:boolean;
    public engine: GoEngine;
    public height:number;
    public last_clock: any = null;
    public mode:string;
    public one_click_submit: boolean;
    public pen_marks:Array<any>;
    public readonly game_id: number;
    public readonly review_id: number;
    public review_controller_id: number;
    public review_owner_id: number;
    public score_estimate:any;
    public showing_scores:boolean;
    public submit_move:() => void;
    public title:string;
    public white_pause_text: string = null;
    public width:number;


    private __board_redraw_pen_layer_timer;
    private __borders_initialized;
    private __clock_timer;
    private __draw_state;
    private __last_pt;
    private __set_board_height;
    private __set_board_width;
    private __update_move_tree;
    private analysis_move_counter;
    private auto_scoring_done;
    private autoplaying_puzzle_move;
    private black_clock;
    private black_name;
    private board;
    private board_div;
    private bounded_height:number;
    private bounded_width:number;
    private bounds;
    private byoyomi_label;
    private conditional_path;
    private readonly config;
    private connectToReviewSent;
    private ctx;
    private current_cmove;
    private current_pen_mark;
    private currently_my_cmove;
    private destroyed;
    private dirty_redraw;
    private disconnectedFromGame;
    private display_width;
    private done_loading_review;
    private dont_draw_last_move;
    private drawing_enabled;
    private edit_color;
    private errorHandler;
    private game_connection_data;
    private game_type;
    private getPuzzlePlacementSetting;
    private goban_id: number;
    private handleShiftKey;
    private has_new_official_move;
    private highlight_movetree_moves;
    private interactive;
    private isInPushedAnalysis;
    private leavePushedAnalysis;
    private isPlayerController;
    private isPlayerOwner;
    private label_character;
    private label_mark;
    private labeling_mode;
    private last_hover_square;
    private last_label_position;
    private last_move;
    private last_pen_position;
    private last_phase;
    private last_review_message;
    private last_sent_move;
    private last_sound_played;
    private last_sound_played_for_a_stone_placement;
    private last_stone_sound;
    private layer_offset_left;
    private layer_offset_top;
    private message_div;
    private message_td;
    private message_text;
    private message_timeout;
    private metrics;
    private move_number;
    private move_selected;
    private move_tree_canvas;
    private move_tree_div;
    private no_display;
    private onError;
    private onPendingResignation;
    private onPendingResignationCleared;
    private on_disconnects;
    private on_game_screen;
    private original_square_size;
    private parent;
    private pattern_search_color;
    private pen_ctx;
    private pen_layer;
    private player_id: number;
    private puzzle_autoplace_delay;
    private restrict_moves_to_movetree;
    private review_connection_data;
    private review_had_gamedata;
    private scoring_mode;
    private selectedThemeWatcher;
    private shadow_ctx;
    private shadow_layer;
    private shift_key_is_down;
    private show_move_numbers;
    private show_variation_move_numbers;
    private socket;
    private socket_event_bindings = [];
    private square_size:number;
    private stone_placement_enabled;
    private stone_removal_clock;
    private submitBlinkTimer;
    private syncToCurrentReviewMove;
    public  theme_black;            /* public for access by our MoveTree render methods */
    private theme_black_stones;
    public  theme_black_text_color; /* public for access by our MoveTree render methods */
    private theme_blank_text_color;
    public  theme_board;            /* public for access by our MoveTree render methods */
    private theme_faded_line_color;
    private theme_faded_star_color;
    private theme_faded_text_color;
    private theme_line_color;
    private theme_star_color;
    private theme_stone_radius;
    public  theme_white;            /* public for access by our MoveTree render methods */
    private theme_white_stones;
    public  theme_white_text_color; /* public for access by our MoveTree render methods */
    public  themes;                 /* public for access by our MoveTree render methods */
    private title_div;
    private waiting_for_game_to_begin;
    private white_clock;
    private white_name;


    constructor(config, preloaded_data?) { /* {{{ */
        super();

        this.goban_id = ++last_goban_id;

        /* Apply defaults */
        let C: any = {};
        let default_config = this.defaultConfig();
        for (let k in default_config) {
            C[k] = default_config[k];
        }
        for (let k in config) {
            C[k] = config[k];
        }
        config = C;



        /* Apply config */
        //window['active_gobans'][this.goban_id] = this;
        this.destroyed = false;
        this.on_game_screen = this.getLocation().indexOf("/game/") >= 0;
        this.parent = config["board_div"] ? $(config["board_div"]) : null;
        this.no_display = false;
        if (!this.parent) {
            this.no_display = true;
            this.parent = $("<div>"); /* let a div dangle in no-mans land to prevent null pointer refs */
        }

        this.width = config.width || 19;
        this.height = config.height || 19;
        this.bounds = config.bounds || {top: 0, left: 0, bottom: this.height - 1, right: this.width - 1};
        this.bounded_width = this.bounds ? (this.bounds.right - this.bounds.left) + 1 : this.width;
        this.bounded_height = this.bounds ? (this.bounds.bottom - this.bounds.top) + 1 : this.height;
        this.title_div = config["title_div"];
        this.black_clock = config["black_clock"];
        this.white_clock = config["white_clock"];
        this.stone_removal_clock = config["stone_removal_clock"];
        this.black_name = config["black_name"];
        this.white_name = config["white_name"];
        this.move_number = config["move_number"];
        this.__clock_timer = null;
        this.setGameClock(null);
        this.last_stone_sound = -1;
        this.drawing_enabled = true;
        this.scoring_mode = false;
        this.score_estimate = null;

        /* TODO: Remove this after 5.0 and after doing a check to see if any of these still exist somehow */
        if ("game_type" in config && config.game_type === "temporary") {
            config.game_id = "tmp:" + config.game_id;
        }

        this.game_type = config.game_type || "";
        this.one_click_submit = "one_click_submit" in config ? config["one_click_submit"] : false;
        this.double_click_submit = "double_click_submit" in config ? config["double_click_submit"] : true;
        this.original_square_size = config["square_size"] || "auto";
        this.square_size = config["square_size"] || "auto";
        this.board = createDeviceScaledCanvas(10, 10).attr("id", "board-canvas").addClass("StoneLayer");
        this.interactive = "interactive" in config ? config["interactive"] : false;
        this.parent.append(this.board);
        this.bindPointerBindings(this.board);
        this.pen_marks = [];
        this.move_tree_div = config.move_tree_div || null;
        this.move_tree_canvas = config.move_tree_canvas || null;

        this.engine = null;
        this.last_move = null;
        this.config = config;
        this.__draw_state = GoMath.makeMatrix(this.width, this.height);
        this.game_id = config.game_id;
        this.player_id = config.player_id;
        this.review_id = config.review_id;
        this.last_review_message = {};
        this.review_had_gamedata = false;
        this.puzzle_autoplace_delay = "puzzle_autoplace_delay" in config ? config.puzzle_autoplace_delay : 300;
        this.isPlayerOwner = config.isPlayerOwner || (() => false); /* for reviews  */
        this.isPlayerController = config.isPlayerController || (() => false); /* for reviews  */
        this.isInPushedAnalysis = config.isInPushedAnalysis ? config.isInPushedAnalysis : (() => false);
        this.leavePushedAnalysis = config.leavePushedAnalysis ? config.leavePushedAnalysis : (() => false);
        this.onPendingResignation = config.onPendingResignation;
        this.onPendingResignationCleared = config.onPendingResignationCleared;
        this.onError = "onError" in config ? config.onError : null;
        this.dont_draw_last_move = "dont_draw_last_move" in config ? config.dont_draw_last_move : false;
        this.getPuzzlePlacementSetting = "getPuzzlePlacementSetting" in config ? config.getPuzzlePlacementSetting : null;
        this.has_new_official_move = false;
        this.last_sent_move = null;
        this.mode = "play";
        this.analyze_tool = "stone";
        this.analyze_subtool = "alternate";
        this.label_character = "A";
        this.edit_color = null;
        this.stone_placement_enabled = false;
        this.highlight_movetree_moves = false;
        this.restrict_moves_to_movetree = false;
        this.analysis_move_counter = 0;
        //this.wait_for_game_to_start = config.wait_for_game_to_start;
        this.errorHandler = (e) => {
            if (e.message === _("A stone has already been placed here") || e.message === "A stone has already been placed here") {
                return;
            }
            this.message(e.message, 5000);
            if (this.onError) {
                this.onError(e);
            }
        };

        this.draw_top_labels    = "draw_top_labels"    in config ? config["draw_top_labels"]    : true;
        this.draw_left_labels   = "draw_left_labels"   in config ? config["draw_left_labels"]   : true;
        this.draw_right_labels  = "draw_right_labels"  in config ? config["draw_right_labels"]  : true;
        this.draw_bottom_labels = "draw_bottom_labels" in config ? config["draw_bottom_labels"] : true;
        this.show_move_numbers  = this.getShowMoveNumbers();
        this.show_variation_move_numbers = this.getShowVariationMoveNumbers();

        if (this.bounds.left > 0) { this.draw_left_labels = false; }
        if (this.bounds.top > 0) { this.draw_top_labels = false; }
        if (this.bounds.right < this.width - 1) { this.draw_right_labels = false; }
        if (this.bounds.bottom < this.height - 1) { this.draw_bottom_labels = false; }


        if (typeof(config["square_size"]) === "function") {
            this.square_size = config["square_size"](this);
            if (isNaN(this.square_size)) {
                console.error("Invalid square size set: (NaN)");
                this.square_size = 12;
            }
        }
        if ("display_width" in config && this.original_square_size === "auto") {
            this.display_width = config["display_width"];
            let n_squares = Math.max(
                this.bounded_width  + +this.draw_left_labels + +this.draw_right_labels,
                this.bounded_height + +this.draw_bottom_labels + +this.draw_top_labels
            );

            if (isNaN(this.display_width)) {
                console.error("Invalid display width. (NaN)");
                this.display_width = 320;
            }

            if (isNaN(n_squares)) {
                console.error("Invalid n_squares: ", n_squares);
                console.error("bounded_width: ", this.bounded_width);
                console.error("this.draw_left_labels: ", this.draw_left_labels);
                console.error("this.draw_right_labels: ", this.draw_right_labels);
                console.error("bounded_height: ", this.bounded_height);
                console.error("this.draw_top_labels: ", this.draw_top_labels);
                console.error("this.draw_bottom_labels: ", this.draw_bottom_labels);
                n_squares = 19;
            }

            this.square_size = Math.floor(this.display_width / n_squares);
        }

        let first_pass = true;
        let watcher = this.watchSelectedThemes((themes) => {
            this.setThemes(themes, first_pass ? true : false);
            first_pass = false;
        });
        this.on("destroy", () => watcher.remove());
        this.message_div = null;
        this.message_timeout = null;

        this.current_cmove = null; /* set in setConditionalTree */
        this.currently_my_cmove = false;
        this.setConditionalTree(null);

        this.last_hover_square = null;
        this.__last_pt = this.xy2ij(-1, -1);
        if (preloaded_data) {
            this.load(preloaded_data);
        } else {
            this.load(config);
        }

        this.game_connection_data = {
            "game_id": config.game_id,
            "player_id": config.player_id,
            "chat": config.connect_to_chat || 0,
            //"game_type": ("game_type" in config ? config.game_type : "temporary")
        };

        if ("auth" in config) {
            this.game_connection_data.auth = config.auth;
        }
        if ("archive_id" in config) {
            this.game_connection_data.archive_id = config.archive_id;
        }

        this.review_connection_data = {
            "auth": config.auth,
            "review_id": config.review_id,
            "player_id": config.player_id
        };

        if ("server_socket" in config && config["server_socket"]) {
            if (!preloaded_data) {
                this.message(_("Loading..."), -1);
            }
            this.connect(config["server_socket"]);
        } else {
            this.load(config);
        }

        this.__update_move_tree = null;

        this.shift_key_is_down = false;
        this.handleShiftKey = (ev) => {
            if (ev.shiftKey !== this.shift_key_is_down) {
                this.shift_key_is_down = ev.shiftKey;
                if (this.last_hover_square) {
                    this.__drawSquare(this.last_hover_square.x, this.last_hover_square.y);
                }
            }
        };
        $(window).on("keydown", this.handleShiftKey);
        $(window).on("keyup", this.handleShiftKey);
    } /* }}} */

    private _socket_on(event, cb) {{{
        this.socket.on(event, cb);
        this.socket_event_bindings.push([event, cb]);
    }}}

    protected getClockDrift():number {{{
        console.warn("getClockDrift not provided for Goban instance");
        return 0;
    }}}
    protected getNetworkLatency():number {{{
        console.warn("getNetworkLatency not provided for Goban instance");
        return 0;
    }}}
    protected getCoordinateDisplaySystem():'A1'|'1-1' {{{
        return 'A1';
    }}}
    protected getShowMoveNumbers():boolean {{{
        return false;
    }}}
    protected getShowVariationMoveNumbers():boolean {{{
        return false;
    }}}
    public static getMoveTreeNumbering():string {{{
        return 'move-number';
    }}}
    public static getCDNReleaseBase():string {{{
        return '';
    }}}
    public static getSoundEnabled():boolean {{{
        return true;
    }}}
    public static getSoundVolume():number {{{
        return 0.5;
    }}}
    protected defaultConfig():any {{{
        return {};
    }}}
    protected watchSelectedThemes(cb):{ remove:() => any } {{{
        return { remove: () => {} };
    }}}

    protected getLocation():string {{{
        return window.location.pathname;
    }}}
    private connect(server_socket) { /* {{{ */
        let socket = this.socket = server_socket;

        this.disconnectedFromGame = false;
        this.on_disconnects = [];

        let send_connect_message = () => {
            if (this.disconnectedFromGame) { return; }

            if (this.review_id) {
                this.connectToReviewSent = true;
                this.done_loading_review = false;
                document.title = _("Review");
                if (!this.disconnectedFromGame) {
                    socket.send("review/connect", this.review_connection_data);
                }
                //this.onClearChatLogs();
                this.emit("chat-reset");
            } else if (this.game_id) {
                /*
                if (this.wait_for_game_to_start) {
                    this.message(_("Waiting for game to begin"), -1);
                    this.waiting_for_game_to_begin = true;
                    this.emit('update');
                }
                */

                if (!this.disconnectedFromGame) {
                    socket.send("game/connect", this.game_connection_data);
                }
            }
        };

        if (socket.connected) {
            send_connect_message();
        }

        this._socket_on("connect", send_connect_message);
        this._socket_on("disconnect", () => {
            if (this.disconnectedFromGame) { return; }
        });


        let prefix = null;

        if (this.game_id) {
            prefix = "game/" + this.game_id + "/";
        }
        if (this.review_id) {
            prefix = "review/" + this.review_id + "/";
        }

        this._socket_on(prefix + "reset", (msg) => {
            if (this.disconnectedFromGame) { return; }
            this.emit("reset", msg);

            if (msg.gamestart_beep) {
                sfx.play("beepbeep", true);
            }
            if (msg.message) {
                if (!window["has_focus"] && !window["user"].anonymous && /^\/game\//.test(this.getLocation())) {
                    swal(_(msg.message));
                } else {
                    console.info(msg.message);
                }
            }
            console.info("Game connection reset");
        });
        this._socket_on(prefix + "error", (msg) => {
            if (this.disconnectedFromGame) { return; }
            this.emit("error", msg);
            let duration = 500;

            if (msg === "This is a private game" || msg === "This is a private review") {
                duration = -1;
            }

            this.message(_(msg), duration);
            console.error("ERROR: ", msg);
        });

        /*****************/
        /*** Game mode ***/
        /*****************/
        if (this.game_id) {
            this._socket_on(prefix + "gamedata", (obj) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                this.clearMessage();
                //this.onClearChatLogs();
                this.emit("chat-reset");

                if (this.on_game_screen && this.last_phase && this.last_phase !== "finished" && obj.phase === "finished") {
                    sfx.play("beepbeep");
                }
                this.last_phase = obj.phase;
                this.load(obj);
                this.emit("gamedata", obj);

                /*
                if (this.wait_for_game_to_start) {
                    sfx.play('beepbeep', true);
                    if (this.onReset) {
                        this.onReset();
                    }
                }
                */
            }); /* }}} */
            this._socket_on(prefix + "chat", (obj) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }
                obj.line.channel = obj.channel;
                this.emit("chat", obj.line);
            }); /* }}} */
            this._socket_on(prefix + "reset-chats", (obj) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }
                this.emit("chat-reset");
            }); /* }}} */
            this._socket_on(prefix + "message", (msg) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }
                this.message(msg);
            }); /* }}} */
            this.last_phase = null;

            this._socket_on(prefix + "clock", (obj) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                this.setGameClock(obj);

                this.updateTitleAndStonePlacement();
                this.emit("update");
            }); /* }}} */
            this._socket_on(prefix + "phase", (new_phase) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                this.setMode("play");
                if (new_phase !== "finished") {
                    this.engine.clearRemoved();
                }
                /*
                if (new_phase !== "play") {
                    if (this.estimatingScore) {
                        console.error(toggleScoreEstimation();
                    }
                }
                */
                this.engine.phase = new_phase;

                if (this.engine.phase === "stone removal") {
                    this.autoScore();
                } else {
                    delete this.auto_scoring_done;
                }

                this.updateTitleAndStonePlacement();
                this.emit("update");
            }); /* }}} */
            this._socket_on(prefix + "undo_requested", (move_number) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                this.engine.undo_requested = parseInt(move_number);
                this.emit("update");
            }); /* }}} */
            this._socket_on(prefix + "undo_accepted", (move_number) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                if (!this.engine.undo_requested) {
                    console.warn("Undo accepted, but no undo requested, we might be out of sync");
                    swal("Game synchronization error related to undo, please reload your game page");
                    return;
                }

                delete this.engine.undo_requested;

                this.setMode("play");
                this.engine.showPrevious();
                this.engine.setLastOfficialMove();

                /* TODO: clear conditional trees */

                delete this.engine.undo_requested;
                this.updateTitleAndStonePlacement();
                this.emit("update");
            }); /* }}} */
            this._socket_on(prefix + "move", (move_obj) => { /* {{{ */
                try {
                    if (this.disconnectedFromGame) { return; }

                    if (move_obj.game_id !== this.game_id) {
                        console.error("Invalid move for this game received [" + this.game_id + "]", move_obj);
                        return;
                    }
                    let move = move_obj.move;

                    if (this.isInPushedAnalysis()) {
                        this.leavePushedAnalysis();
                    }

                    /* clear any undo state that may be hanging around */
                    delete this.engine.undo_requested;

                    let mv = this.engine.decodeMoves(move);

                    if (this.mode === "conditional" || this.mode === "play") {
                        this.setMode("play");
                    }

                    let jumptomove = null;
                    if (this.engine.cur_move.id !== this.engine.last_official_move.id &&
                        (this.engine.cur_move.parent == null
                         && this.engine.cur_move.trunk_next != null
                         || this.engine.cur_move.parent.id !== this.engine.last_official_move.id)
                    ) {
                        jumptomove = this.engine.cur_move;
                    }
                    this.engine.jumpToLastOfficialMove();

                    if (this.engine.playerToMove() !== this.player_id) {
                        let t = this.conditional_tree.getChild(GoMath.encodeMove(mv[0].x, mv[0].y));
                        t.move = null;
                        this.setConditionalTree(t);
                    }

                    if (this.engine.getMoveNumber() !== move_obj.move_number - 1) {
                        this.message(_("Synchronization error, reloading"));
                        setTimeout(() => {
                            window.location.href = window.location.href;
                        }, 2500);
                        console.error("Synchronization error, we thought move should be " + this.engine.getMoveNumber()
                                      + " server thought it should be " + (move_obj.move_number - 1));

                        return;
                    }

                    if (mv[0].edited) {
                        this.engine.editPlace(mv[0].x, mv[0].y, mv[0].color);
                    }
                    else {
                        this.engine.place(mv[0].x, mv[0].y, false, false, false, true, true);
                    }

                    this.setLastOfficialMove();
                    this.move_selected = false;

                    if (jumptomove) {
                        this.engine.jumpTo(jumptomove);
                        this.has_new_official_move = true;
                    } else {
                        this.has_new_official_move = false;
                    }

                    this.emit("update");
                    this.playMovementSound();

                    this.emit('move-made');

                    if (this.move_number) {
                        this.move_number.text(this.engine.getMoveNumber());
                    }
                } catch (e) {
                    console.error(e);
                }
            }); /* }}} */
            this._socket_on(prefix + "conditional_moves", (cmoves) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                if (cmoves.moves == null) {
                    this.setConditionalTree(null);
                } else {
                    this.setConditionalTree(GoConditionalMove.decode(cmoves.moves));
                }
            }); /* }}} */
            this._socket_on(prefix + "removed_stones", (cfg) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                if ("strict_seki_mode" in cfg) {
                    this.engine.strict_seki_mode = cfg.strict_seki_mode;
                } else {
                    let removed = cfg.removed;
                    let stones = cfg.stones;
                    let moves;
                    if (!stones) {
                        moves = [];
                    } else {
                        moves = this.engine.decodeMoves(stones);
                    }

                    for (let i = 0; i < moves.length; ++i) {
                        this.engine.setRemoved(moves[i].x, moves[i].y, removed);
                    }
                }
                this.updateTitleAndStonePlacement();
                this.emit("update");
            }); /* }}} */
            this._socket_on(prefix + "removed_stones_accepted", (cfg) => { /* {{{ */
                if (this.disconnectedFromGame) { return; }

                let player_id = cfg.player_id;
                let stones = cfg.stones;

                if (player_id === 0) {
                    this.engine.players["white"].accepted_stones = stones;
                    this.engine.players["black"].accepted_stones = stones;
                }
                else {
                    this.engine.players[this.engine.playerColor(player_id)].accepted_stones = stones;
                    this.engine.players[this.engine.playerColor(player_id)].accepted_strict_seki_mode = "strict_seki_mode" in cfg ? cfg.strict_seki_mode : false;
                }
                this.updateTitleAndStonePlacement();
                this.emit("update");
            }); /* }}} */

            this._socket_on(prefix + "auto_resign", (obj) => { /* {{{ */
                this.emit('auto-resign', {
                    game_id: obj.game_id,
                    player_id: obj.player_id,
                    expiration: obj.expiration,
                });
            }); /* }}} */
            this._socket_on(prefix + "clear_auto_resign", (obj) => { /* {{{ */
                this.emit('clear-auto-resign', {
                    game_id: obj.game_id,
                    player_id: obj.player_id,
                });
            }); /* }}} */
        }


        /*******************/
        /*** Review mode ***/
        /*******************/
        let bulk_processing = false;
        let process_r = (obj) => {{{
            if (this.disconnectedFromGame) { return; }

            if ("chat" in obj) {
                obj["chat"].channel = "discussion";
                if (!obj.chat.chat_id) {
                    obj.chat.chat_id = obj.chat.player_id + "." + obj.chat.date;
                }
                this.emit("chat", obj["chat"]);
            }

            if ("gamedata" in obj) {
                if (obj.gamedata.phase === "stone removal") {
                    obj.gamedata.phase = "finished";
                }

                this.load(obj.gamedata);
                this.review_had_gamedata = true;
                $("#option-review-sgf-download-a").removeClass("hidden");
            }

            if ("owner" in obj) {
                this.review_owner_id =  typeof(obj.owner) === "object" ? obj.owner.id : obj.owner;
            }
            if ("controller" in obj) {
                this.review_controller_id = typeof(obj.controller) === "object" ? obj.controller.id : obj.controller;
            }

            if (!this.isPlayerController()
                || !this.done_loading_review
                || "om" in obj   /* official moves are always alone in these object broadcasts */
                || "undo" in obj /* official moves are always alone in these object broadcasts */
            ) {
                let curmove = this.engine.cur_move;
                let follow = this.engine.cur_review_move == null || this.engine.cur_review_move.id === curmove.id;
                let do_redraw = false;
                if ("f" in obj) { /* specifying node */
                    let t = this.done_loading_review;
                    this.done_loading_review = false; /* this prevents drawing from being drawn when we do a follow path. */
                    this.engine.followPath(obj.f, obj.m);
                    this.drawSquare(this.engine.cur_move.x, this.engine.cur_move.y);
                    this.done_loading_review = t;
                    this.engine.setAsCurrentReviewMove();
                    this.scheduleRedrawPenLayer();
                }

                if ("om" in obj) { /* Official move [comes from live review of game] */
                    let t = this.engine.cur_review_move || this.engine.cur_move;
                    let mv = this.engine.decodeMoves([obj.om])[0];
                    let follow_om = t.id === this.engine.last_official_move.id;
                    this.engine.jumpToLastOfficialMove();
                    this.engine.place(mv.x, mv.y, false, false, true, true, true);
                    this.engine.setLastOfficialMove();
                    if ((t.x !== mv.x || t.y !== mv.y)  /* case when a branch has been promoted to trunk */
                        && !follow_om) { /* case when they were on a last official move, autofollow to next */
                        this.engine.jumpTo(t);
                    }
                    this.engine.setAsCurrentReviewMove();
                    if (this.done_loading_review) {
                        this.redrawMoveTree();
                    }
                }

                if ("undo" in obj) { /* Official undo move [comes from live review of game] */
                    let t = this.engine.cur_review_move;
                    let cur_move_undone = this.engine.cur_review_move.id === this.engine.last_official_move.id;
                    this.engine.jumpToLastOfficialMove();
                    this.engine.showPrevious();
                    this.engine.setLastOfficialMove();
                    if (!cur_move_undone) {
                        this.engine.jumpTo(t);
                    }
                    this.engine.setAsCurrentReviewMove();
                    if (this.done_loading_review) {
                        this.redrawMoveTree();
                    }
                }


                if (this.engine.cur_review_move) {
                    if ("t" in obj) { /* set text */
                        this.engine.cur_review_move.text = obj["t"];
                    }
                    if ("t+" in obj) { /* append to text */
                        this.engine.cur_review_move.text += obj["t+"];
                    }
                    if ("k" in obj) { /* set marks */
                        let t = this.engine.cur_move;
                        this.engine.cur_review_move.clearMarks();
                        this.engine.cur_move = this.engine.cur_review_move;
                        this.setMarks(obj["k"], this.engine.cur_move.id !== t.id);
                        this.engine.cur_move = t;
                    }
                    if ("clearpen" in obj) {
                        this.engine.cur_review_move.pen_marks = [];
                        this.scheduleRedrawPenLayer();
                        do_redraw = false;
                    }
                    if ("delete" in obj) {
                        let t = this.engine.cur_review_move.parent;
                        this.engine.cur_review_move.remove();
                        this.engine.jumpTo(t);
                        this.engine.setAsCurrentReviewMove();
                        this.scheduleRedrawPenLayer();
                        if (this.done_loading_review) {
                            this.redrawMoveTree();
                        }
                    }
                    if ("pen" in obj) { /* start pen */
                        this.engine.cur_review_move.pen_marks.push({"color": obj["pen"], "points": []});
                    }
                    if ("pp" in obj) { /* update pen marks */
                        try {
                            let pts = this.engine.cur_review_move.pen_marks[this.engine.cur_review_move.pen_marks.length - 1].points;
                            this.engine.cur_review_move.pen_marks[this.engine.cur_review_move.pen_marks.length - 1].points = pts.concat(obj["pp"]);
                            this.scheduleRedrawPenLayer();
                            do_redraw = false;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }


                if (this.done_loading_review) {
                    if (!follow) {
                        this.engine.jumpTo(curmove);
                        this.redrawMoveTree();
                    } else {
                        if (do_redraw) {
                            this.redraw(true);
                        }
                        if (!this.__update_move_tree) {
                            this.__update_move_tree = setTimeout(() => {
                                this.__update_move_tree = null;
                                this.updateOrRedrawMoveTree();
                                this.emit("update");
                            }, 100);
                        }
                    }
                }
            }

            if ("controller" in obj) {
                if (!("owner" in obj)) { /* only false at index 0 of the replay log */
                    if (this.isPlayerController()) {
                        this.emit("review.sync-to-current-move");
                    }
                    this.updateTitleAndStonePlacement();

                    this.emit("chat", {
                        "system": true,
                        "chat_id": uuid(),
                        "body": interpolate(_("Control passed to %s"), [typeof(obj.controller) === "number" ? `%%%PLAYER-${obj.controller}%%%` : obj.controller.username]),
                        "channel": "system",
                    });
                    this.emit("update");
                }
            }
            if (!bulk_processing) {
                this.emit("review.updated");
            }
        }}};

        if (this.review_id) {
            this._socket_on(prefix + "full_state", (entries) => {
                try {
                    if (!entries || entries.length === 0) {
                        console.error('Blank full state received, ignoring');
                        return;
                    }
                    if (this.disconnectedFromGame) { return; }

                    this.disableDrawing();
                    /* TODO: Clear our state here better */

                    bulk_processing = true;
                    for (let i = 0; i < entries.length; ++i) {
                        process_r(entries[i]);
                    }
                    bulk_processing = false;
                    this.emit("review.updated");

                    this.enableDrawing();
                    if (this.isPlayerController()) {
                        this.done_loading_review = true;
                        this.drawPenMarks(this.engine.cur_move.pen_marks);
                        this.redraw(true);
                        return;
                    }

                    this.done_loading_review = true;
                    this.drawPenMarks(this.engine.cur_move.pen_marks);
                    this.redrawMoveTree();
                    this.redraw(true);
                } catch (e) {
                    console.error(e);
                }
            });
            this._socket_on(prefix + "r", process_r);
        }



        return socket;
    } /* }}} */
    public destroy() { /* {{{ */
        this.emit("destroy");
        //delete window['active_gobans'][this.goban_id];
        this.destroyed = true;
        if (this.socket) {
            this.disconnect();
        }
        this.board.remove();
        this.detachPenCanvas();
        this.detachShadowLayer();

        /* Clear various timeouts that may be running */
        if (this.__clock_timer) {
            clearTimeout(this.__clock_timer);
            this.__clock_timer = null;
        }
        if (this.submitBlinkTimer) {
            clearTimeout(this.submitBlinkTimer);
        }
        this.submitBlinkTimer = null;
        if (this.message_timeout) {
            clearTimeout(this.message_timeout);
            this.message_timeout = null;
        }
        $(window).off("keydown", this.handleShiftKey);
        $(window).off("keyup", this.handleShiftKey);
    } /* }}} */
    private disconnect() { /* {{{ */
        this.emit("destroy");
        if (!this.disconnectedFromGame) {
            this.disconnectedFromGame = true;
            if (this.socket) {
                if (this.review_id) {
                    this.socket.send("review/disconnect", {"review_id": this.review_id});
                }
                if (this.game_id) {
                    this.socket.send("game/disconnect", {"game_id": this.game_id});
                }
            }
        }
        for (let pair of this.socket_event_bindings) {
            this.socket.off(pair[0], pair[1]);
        }
        this.socket_event_bindings = [];
    } /* }}} */
    private scheduleRedrawPenLayer() { /* {{{ */
        if (!this.__board_redraw_pen_layer_timer) {
            this.__board_redraw_pen_layer_timer = setTimeout(() => {
                if (this.engine.cur_move.pen_marks.length) {
                    this.drawPenMarks(this.engine.cur_move.pen_marks);
                } else if (this.pen_marks.length) {
                    this.clearAnalysisDrawing();
                }
                this.__board_redraw_pen_layer_timer = null;
            }, 100);
        }
    } /* }}} */

    public sendChat(msg_body, type) { /* {{{ */
        if (typeof(msg_body) === "string" && msg_body.length === 0) {
            return;
        }

        let msg: any = {
            body: msg_body
        };

        let where = null;
        if (this.game_id) {
            where = "game/chat";
            msg["type"] = type;
            msg["game_id"] = this.config.game_id;
            msg["move_number"] = this.engine.getCurrentMoveNumber();
        } else {
            let diff = this.engine.getMoveDiff();
            where = "review/chat";
            msg["review_id"] = this.config.review_id;
            msg["from"] = diff.from;
            msg["moves"] =  diff.moves;
        }

        this.socket.send(where, msg);
    } /* }}} */
    public message(msg, timeout?) { /* {{{ */
        this.clearMessage();

        this.message_div = $("<div>").addClass("GobanMessage");
        this.message_td = $("<td>");
        this.message_div.append($("<table>").append($("<tr>").append(this.message_td)));
        this.message_text = $("<div>").html(msg);
        this.message_td.append(this.message_text);
        this.parent.append(this.message_div);
        this.message_div.click(() => {
            if (timeout > 0) {
                this.clearMessage();
            }
        });

        if (!timeout) {
            timeout = 5000;
        }

        if (timeout > 0) {
            this.message_timeout = setTimeout(() => {
                this.clearMessage();
            }, timeout);
        }
    } /* }}} */
    private clearMessage() { /* {{{ */
        if (this.message_div) {
            this.message_div.remove();
            this.message_div = null;
        }
        if (this.message_timeout) {
            clearTimeout(this.message_timeout);
            this.message_timeout = null;
        }
    } /* }}} */
    private setTitle(title) { /* {{{ */
        this.title = title;
        if (this.title_div) {
            if (typeof(title) === "string") {
                this.title_div.html(title);
            } else {
                this.title_div.empty();
                this.title_div.append(title);
            }
        }
        this.emit('title', title);
    } /* }}} */

    private getWidthForSquareSize(square_size) { /* {{{ */
        return (this.bounded_width + +this.draw_left_labels + +this.draw_right_labels) * square_size;
    } /* }}} */
    private xy2ij(x, y) { /* {{{ */
        if (x > 0 && y > 0) {
            if (this.bounds.left > 0) {
                x += this.bounds.left * this.square_size;
            } else {
                x -= +this.draw_left_labels * this.square_size;
            }

            if (this.bounds.top > 0) {
                y += this.bounds.top * this.square_size;
            } else {
                y -= +this.draw_top_labels * this.square_size;
            }
        }

        let i = Math.floor(x / this.square_size);
        let j = Math.floor(y / this.square_size);
        return {"i": i, "j": j, "valid": i >= 0 && j >= 0 && i < this.width && j < this.height};
    } /* }}} */
    public setAnalyzeTool(tool, subtool) { /* {{{ */
        this.analyze_tool = tool;
        this.analyze_subtool = subtool;
        if (tool === "stone" && subtool === "black") {
            this.edit_color = "black";
        } else if (tool === "stone" && subtool === "white") {
            this.edit_color = "white";

        } else {
            this.edit_color = null;
        }

        this.setLabelCharacterFromMarks(this.analyze_subtool);

        if (tool === "draw") {
            this.attachPenCanvas();
        }
    } /* }}} */

    private detachShadowLayer() { /* {{{ */
        if (this.shadow_layer) {
            this.shadow_layer.remove();
            this.shadow_layer = null;
            this.shadow_ctx = null;
        }
    } /* }}} */
    private attachShadowLayer() { /* {{{ */
        if (!this.shadow_layer) {
            this.shadow_layer = createDeviceScaledCanvas(this.metrics.width, this.metrics.height).attr("class", "shadow-canvas").addClass("ShadowLayer");
            this.shadow_layer.insertBefore(this.board);
            this.shadow_layer.css({"left": this.layer_offset_left, "top": this.layer_offset_top});
            this.shadow_ctx = this.shadow_layer[0].getContext("2d");
            this.bindPointerBindings(this.shadow_layer);
        }
    } /* }}} */
    public detachPenCanvas() { /* {{{ */
        if (this.pen_layer) {
            this.pen_layer.remove();
            this.pen_layer = null;
            this.pen_ctx = null;
        }
    } /* }}} */
    private attachPenCanvas() { /* {{{ */
        if (!this.pen_layer) {
            this.pen_layer = createDeviceScaledCanvas(this.metrics.width, this.metrics.height).attr("id", "pen-canvas").addClass("PenLayer");
            this.parent.append(this.pen_layer);
            this.pen_layer.css({"left": this.layer_offset_left, "top": this.layer_offset_top});
            this.pen_ctx = this.pen_layer[0].getContext("2d");
            this.bindPointerBindings(this.pen_layer);
        }
    } /* }}} */
    private bindPointerBindings(canvas) { /* {{{ */
        if (!this.interactive) {
            return;
        }

        if (canvas.data("pointers-bound")) {
            return;
        }

        canvas.data("pointers-bound", true);

        let dragging = false;

        let last_click_square = this.xy2ij(0, 0);

        let pointerUp = (ev, double_clicked) => {
            if (!dragging) {
                /* if we didn't start the click in the canvas, don't respond to it */
                return;
            }

            dragging = false;

            if (this.scoring_mode) {
                let pos = getRelativeEventPosition(ev);
                let pt = this.xy2ij(pos.x, pos.y);
                if (pt.i >= 0 && pt.i < this.width && pt.j >= 0 && pt.j < this.height) {
                    if (this.score_estimate) {
                        this.score_estimate.handleClick(pt.i, pt.j, ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey);
                    }
                    this.emit("update");
                }
                return;
            }

            if (ev.ctrlKey || ev.metaKey || ev.altKey) {
                try {
                    let pos = getRelativeEventPosition(ev);
                    let pt = this.xy2ij(pos.x, pos.y);
                    let chat_input = $(".chat-input");
                    if (!chat_input.attr("disabled")) {
                        if (pt.i >= 0 && pt.i < this.engine.width && pt.j >= 0 && pt.j < this.engine.height) {
                            let txt = (chat_input.val().trim() + " " + this.engine.prettyCoords(pt.i, pt.j)).trim();
                            chat_input.val(txt);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
                return;
            }

            if (this.mode === "analyze" && this.analyze_tool === "draw") {
                /* might want to interpret this as a start/stop of a line segment */
            } else {
                let pos = getRelativeEventPosition(ev);
                let pt = this.xy2ij(pos.x, pos.y);
                if (!double_clicked) {
                    last_click_square = pt;
                } else {
                    if (last_click_square.i !== pt.i || last_click_square.j !== pt.j) {
                        this.onMouseOut(ev);
                        return;
                    }
                }

                this.onTap(ev, double_clicked);
                this.onMouseOut(ev);
            }
        };

        let pointerDown = (ev) => {
            dragging = true;
            if (this.mode === "analyze" && this.analyze_tool === "draw") {
                this.onPenStart(ev);
            }
            else if (this.mode === "analyze" && this.analyze_tool === "label") {
                if (ev.shiftKey) {
                    if (this.analyze_subtool === "letters") {
                        let label_char = prompt(_("Enter the label you want to add to the board"), "");
                        if (label_char) {
                            this.label_character = label_char.substring(0, 3);
                            dragging = false;
                            return;
                        }
                    }
                }

                this.onLabelingStart(ev);
            }
        };

        let pointerMove = (ev) => {
            if (this.mode === "analyze" && this.analyze_tool === "draw") {
                if (!dragging) { return; }
                this.onPenMove(ev);
            } else if (dragging && this.mode === "analyze" && this.analyze_tool === "label") {
                this.onLabelingMove(ev);
            } else {
                 this.onMouseMove(ev);
            }
        };

        let pointerOut = (ev) => {
            dragging = false;
            this.onMouseOut(ev);
        };

        let mousedisabled:any = 0;

        canvas.on("click", (ev) => { if (!mousedisabled) { dragging = true; pointerUp(ev, false); } ev.preventDefault(); return false; });
        canvas.on("dblclick", (ev) => { if (!mousedisabled) { dragging = true; pointerUp(ev, true); } ev.preventDefault(); return false; });
        canvas.on("mousedown", (ev) => { if (!mousedisabled) { pointerDown(ev); } ev.preventDefault(); return false; });
        canvas.on("mousemove", (ev) => { if (!mousedisabled) { pointerMove(ev); } ev.preventDefault(); return false; });
        canvas.on("mouseout", (ev) => { if (!mousedisabled) { pointerOut(ev); } else { ev.preventDefault(); } return false; });
        canvas.on("focus", (ev) => { ev.preventDefault(); return false; });

        let lastX = 0;
        let lastY = 0;
        let startX = 0;
        let startY = 0;

        const onTouchStart = (ev) => {
            if (mousedisabled) {
                clearTimeout(mousedisabled);
            }
            mousedisabled = setTimeout(() => { mousedisabled = 0; }, 5000);

            if (ev.target === canvas[0]) {
                let target = $(ev.target);
                lastX = ev.originalEvent.touches[0].pageX;
                lastY = ev.originalEvent.touches[0].pageY;
                startX = ev.originalEvent.touches[0].pageX;
                startY = ev.originalEvent.touches[0].pageY;
                pointerDown(ev);
            } else if (dragging) {
                pointerOut(ev);
            }
        };
        const onTouchEnd = (ev) => {
            if (mousedisabled) {
                clearTimeout(mousedisabled);
            }
            mousedisabled = setTimeout(() => { mousedisabled = 0; }, 5000);

            if (ev.target === canvas[0]) {
                let target = $(ev.target);
                ev.pageX = lastX;
                ev.pageY = lastY;

                if (Math.sqrt((startX - lastX) * (startX - lastX) + (startY - lastY) * (startY - lastY)) > 10) {
                    pointerOut(ev);
                } else {
                    pointerUp(ev, false);
                }
            } else if (dragging) {
                pointerOut(ev);
            }
        };
        const onTouchMove = (ev) => {
            if (mousedisabled) {
                clearTimeout(mousedisabled);
            }
            mousedisabled = setTimeout(() => { mousedisabled = 0; }, 5000);

            if (ev.target === canvas[0]) {
                let target = $(ev.target);
                lastX = ev.originalEvent.touches[0].pageX;
                lastY = ev.originalEvent.touches[0].pageY;
                if (this.mode === "analyze" && this.analyze_tool === "draw") {
                    pointerMove(ev);
                    ev.preventDefault();
                    return false;
                }
            } else if (dragging) {
                pointerOut(ev);
            }
        };

        $(document).on("touchstart", onTouchStart);
        $(document).on("touchend", onTouchEnd);
        $(document).on("touchmove", onTouchMove);
        this.on("destroy", () => {
            $(document).off("touchstart", onTouchStart);
            $(document).off("touchend", onTouchEnd);
            $(document).off("touchmove", onTouchMove);
        });
    } /* }}} */
    public clearAnalysisDrawing() { /* {{{ */
        this.pen_marks = [];
        if (this.pen_ctx) {
            this.pen_ctx.clearRect(0, 0, this.metrics.width, this.metrics.height);
        }
    } /* }}} */
    private xy2pen(x, y) { /* {{{ */
        let lx = this.draw_left_labels ? 0.0 : 1.0;
        let ly = this.draw_top_labels ? 0.0 : 1.0;
        return [Math.round(((x / this.square_size) + lx) * 64), Math.round(((y / this.square_size) + ly) * 64)];
    } /* }}} */
    private pen2xy(x, y) { /* {{{ */
        let lx = this.draw_left_labels ? 0.0 : 1.0;
        let ly = this.draw_top_labels ? 0.0 : 1.0;

        return [((x / 64) - lx) * this.square_size, ((y / 64) - ly) * this.square_size];
    } /* }}} */
    private setPenStyle(color) { /* {{{ */
        this.pen_ctx.strokeStyle = color;
        this.pen_ctx.lineWidth = Math.max(1, Math.round(this.square_size * 0.1));
        this.pen_ctx.lineCap = "round";
    } /* }}} */
    private onPenStart(ev) { /* {{{ */
        this.attachPenCanvas();

        let pos = getRelativeEventPosition(ev);
        this.last_pen_position = this.xy2pen(pos.x, pos.y);
        this.current_pen_mark = {"color": this.analyze_subtool, "points": this.xy2pen(pos.x, pos.y)};
        this.pen_marks.push(this.current_pen_mark);
        this.setPenStyle(this.analyze_subtool);

        this.syncReviewMove({"pen": this.analyze_subtool, "pp": this.xy2pen(pos.x, pos.y)});
    } /* }}} */
    private onPenMove(ev) { /* {{{ */
        let pos = getRelativeEventPosition(ev);
        let start = this.last_pen_position;
        let s = this.pen2xy(start[0], start[1]);
        let end = this.xy2pen(pos.x, pos.y);
        let e = this.pen2xy(end[0], end[1]);

        let dx = end[0] - start[0];
        let dy = end[1] - start[1];
        if (dx * dx + dy * dy < 64) {
            return;
        }

        this.last_pen_position = end;
        this.current_pen_mark.points.push(dx);
        this.current_pen_mark.points.push(dy);
        this.pen_ctx.beginPath();
        this.pen_ctx.moveTo(s[0], s[1]);
        this.pen_ctx.lineTo(e[0], e[1]);
        this.pen_ctx.stroke();

        this.syncReviewMove({"pp": [dx, dy]});
    } /* }}} */
    public drawPenMarks(penmarks) { /* {{{ */
        if (this.review_id && !this.done_loading_review) { return; }
        if (!(penmarks.length || this.pen_layer)) {
            return;
        }
        this.attachPenCanvas();
        this.clearAnalysisDrawing();
        this.pen_marks = penmarks;
        for (let i = 0; i < penmarks.length; ++i) {
            let stroke = penmarks[i];
            this.setPenStyle(stroke.color);

            let px = stroke.points[0];
            let py = stroke.points[1];
            this.pen_ctx.beginPath();
            let pt = this.pen2xy(px, py);
            this.pen_ctx.moveTo(pt[0], pt[1]);
            for (let j = 2; j < stroke.points.length; j += 2 ) {
                px += stroke.points[j];
                py += stroke.points[j + 1];
                let pt = this.pen2xy(px, py);
                this.pen_ctx.lineTo(pt[0], pt[1]);
            }
            this.pen_ctx.stroke();
        }
    } /* }}} */


    private putOrClearLabel(x, y, mode?) { /* {{{ */
        let ret = null;
        if (mode == null || typeof(mode) === "undefined") {
            if (this.analyze_subtool === "letters" || this.analyze_subtool === "numbers") {
                this.label_mark = this.label_character;
                ret = this.toggleMark(x, y, this.label_character, true);
                if (ret === true) {
                    this.incrementLabelCharacter();
                } else {
                    this.setLabelCharacterFromMarks();
                }
            } else {
                this.label_mark = this.analyze_subtool;
                ret = this.toggleMark(x, y, this.analyze_subtool);
            }
        }
        else {
            if (mode === "put") {
                ret = this.toggleMark(x, y, this.label_mark, this.label_mark.length <= 3, true);
            } else {
                let marktypes = ["letter", "circle", "square", "triangle", "cross"];
                let marks = this.getMarks(x, y);

                for (let i = 0; i < marktypes.length; ++i) {
                    delete marks[marktypes[i]];
                }
                this.drawSquare(x, y);
            }
        }

        this.syncReviewMove();
        return ret;
    } /* }}} */
    private onLabelingStart(ev) { /* {{{ */
        let pos = getRelativeEventPosition(ev);
        this.last_label_position = this.xy2ij(pos.x, pos.y);

        {
            let x = this.last_label_position.i;
            let y = this.last_label_position.j;
            if (!((x >= 0 && x < this.width) && (y >= 0 && y < this.height))) {
                return;
            }
        }

        this.labeling_mode = this.putOrClearLabel(this.last_label_position.i, this.last_label_position.j) ? "put" : "clear";

        /* clear hover */
        if (this.__last_pt.valid) {
            let last_hover = this.last_hover_square;
            this.last_hover_square = null;
            this.drawSquare(last_hover.x, last_hover.y);
        }
        this.__last_pt = this.xy2ij(-1, -1);
        this.drawSquare(this.last_label_position.i, this.last_label_position.j);
    } /* }}} */
    private onLabelingMove(ev) { /* {{{ */
        let pos = getRelativeEventPosition(ev);
        let cur = this.xy2ij(pos.x, pos.y);

        {
            let x = cur.i;
            let y = cur.j;
            if (!((x >= 0 && x < this.width) && (y >= 0 && y < this.height))) {
                return;
            }
        }

        if (cur.i !== this.last_label_position.i || cur.j !== this.last_label_position.j) {
            this.last_label_position = cur;
            this.putOrClearLabel(cur.i, cur.j, this.labeling_mode);
            this.setLabelCharacterFromMarks();
        }
    } /* }}} */
    public setSquareSize(new_ss) { /* {{{ */
        let redraw = this.square_size !== new_ss;
        this.square_size = new_ss;
        if (redraw) {
            this.redraw(true);
        }
    } /* }}} */
    public setSquareSizeBasedOnDisplayWidth(display_width) {{{
        let n_squares = Math.max(
            this.bounded_width  + +this.draw_left_labels + +this.draw_right_labels,
            this.bounded_height + +this.draw_bottom_labels + +this.draw_top_labels
        );
        this.display_width = display_width;

        if (isNaN(this.display_width)) {
            console.error("Invalid display width. (NaN)");
            this.display_width = 320;
        }

        if (isNaN(n_squares)) {
            console.error("Invalid n_squares: ", n_squares);
            console.error("bounded_width: ", this.bounded_width);
            console.error("this.draw_left_labels: ", this.draw_left_labels);
            console.error("this.draw_right_labels: ", this.draw_right_labels);
            console.error("bounded_height: ", this.bounded_height);
            console.error("this.draw_top_labels: ", this.draw_top_labels);
            console.error("this.draw_bottom_labels: ", this.draw_bottom_labels);
            n_squares = 19;
        }

        this.setSquareSize(Math.floor(this.display_width / n_squares));
    }}}


    private onTap(event, double_tap) { /* {{{ */
        if (!(this.stone_placement_enabled && (this.player_id || this.engine.black_player_id === 0 || this.mode === "analyze" || this.mode === "pattern search" || this.mode === "puzzle"))) { return; }

        let pos = getRelativeEventPosition(event);
        let xx = pos.x;
        let yy = pos.y;


        let pt = this.xy2ij(xx, yy);
        let x = pt.i;
        let y = pt.j;

        if (x < 0 || y < 0 || x >= this.engine.width || y >= this.engine.height) {
            return;
        }

        if (!this.double_click_submit) {
            double_tap = false;
        }

        if (this.mode === "analyze" && event.shiftKey
            /* don't warp to move tree position when shift clicking in stone edit mode */
            && !(this.analyze_tool === "stone" && (this.analyze_subtool === "black" || this.analyze_subtool === "white"))
            /* nor when in labeling mode */
            && this.analyze_tool !== "label"
           ) {
            let m = this.engine.getMoveByLocation(x, y);
            if (m) {
                this.engine.jumpTo(m);
            }
            return;
        }

        if (this.mode === "analyze" && this.analyze_tool === "label") {
            return;
        }

        this.setSubmit(null);
        $("#pass-resign-buttons span").removeClass("hidden-by-submit");
        $("#ctrl-play-submit").addClass("hidden");
        if (this.submitBlinkTimer) {
            clearTimeout(this.submitBlinkTimer);
        }
        this.submitBlinkTimer = null;


        let tap_time = Date.now();
        let submit = () => {
            let submit_time = Date.now();
            if (!this.one_click_submit && (!this.double_click_submit || !double_tap)) {
                /* then submit button was pressed, so check to make sure this didn't happen too quick */
                let delta = submit_time - tap_time;
                if (delta <= 50) {
                    console.info("Submit button pressed only ", delta, "ms after stone was placed, presuming bad click");
                    return;
                }
            }
            this.last_sent_move = encodeMove(x, y);
            this.sendMove({
                "auth": this.config.auth,
                "game_id": this.config.game_id,
                "player_id": this.config.player_id,
                "move": encodeMove(x, y)
            });
            this.setTitle(_("Submitting..."));
            this.disableStonePlacement();
            this.move_selected = false;
        };
        /* we disable clicking if we've been initialized with the view user,
         * unless the board is a demo board (thus black_player_id is 0).  */
        try {
            let force_redraw = false;
            if (this.mode === "play") {
                $("#pass-resign-buttons").removeClass("hidden");
            }
            if ((this.engine.phase === "stone removal" || this.scoring_mode) && this.isParticipatingPlayer()) { /* {{{ */
                let arrs;
                if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                    let removed = !this.engine.removal[y][x];
                    arrs = [[removed, [{"x": x, "y": y}]]];
                }
                else {
                    arrs = this.engine.toggleMetaGroupRemoval(x, y);
                }

                for (let i = 0; i < arrs.length; ++i) {
                    let arr = arrs[i];

                    let removed = arr[0];
                    let group = arr[1];
                    if (group.length && !this.scoring_mode) {
                        this.socket.send("game/removed_stones/set", {
                            "auth"        : this.config.auth,
                            "game_id"     : this.config.game_id,
                            "player_id"   : this.config.player_id,
                            "removed"     : removed,
                            "stones"      : encodeMoves(group)
                        });
                    }
                    if (this.scoring_mode) {
                        this.score_estimate = this.engine.estimateScore(SCORE_ESTIMATION_TRIALS, SCORE_ESTIMATION_TOLERANCE);
                        this.redraw(true);
                    }
                }
            } /* }}} */
            else if (this.mode === "pattern search") { /* {{{ */
                let color = (this.engine.board[y][x] + 1) % 3; /* cycle through the colors */
                if (this.pattern_search_color) {
                    color = this.pattern_search_color;
                    if (this.engine.board[y][x] === this.pattern_search_color) {
                        color = 0;
                    }
                }
                if (event.shiftKey && color === 1) { /* if we're going to place a black on an empty square but we're holding down shift, place white */
                    color = 2;
                }
                if (event.shiftKey && color === 2) { /* if we're going to place a black on an empty square but we're holding down shift, place white */
                    color = 1;
                }
                if (!double_tap) { /* we get called for each tap, then once for the final double tap so we only want to process this x2 */
                    this.engine.editPlace(x, y, color);
                }
                this.emit("update");
            } /* }}} */
            else if (this.mode === "puzzle") { /* {{{ */
                let puzzle_mode = "place";
                let color = 0;
                if (this.getPuzzlePlacementSetting) {
                    let s = this.getPuzzlePlacementSetting();
                    puzzle_mode = s.mode;
                    color = s.color;
                    if (this.shift_key_is_down) {
                        color = color === 1 ? 2 : 1;
                    }
                }

                if (puzzle_mode === "place") {
                    if (!double_tap) { /* we get called for each tap, then once for the final double tap so we only want to process this x2 */
                        this.engine.place(x, y, true, false, true, false, false);
                        this.emit("puzzle-place", {x, y});
                    }
                }
                if (puzzle_mode === "play") {
                    /* we get called for each tap, then once for the final double tap so we only want to process this x2 */
                    /* Also, if we just placed a piece and the computer is waiting to place it's piece (autoplaying), then
                     * don't allow anything to be placed. */
                    if (!double_tap && !this.autoplaying_puzzle_move) {
                        let mv_x = x;
                        let mv_y = y;
                        let calls = 0;

                        if (this.engine.puzzle_player_move_mode !== "fixed" || this.engine.cur_move.lookupMove(x, y, this.engine.player, false)) {
                            let puzzle_place = (mv_x, mv_y) => {{{
                                ++calls;

                                this.engine.place(mv_x, mv_y, true, false, true, false, false);
                                this.emit("puzzle-place", {x : mv_x, y : mv_y});
                                if (this.engine.cur_move.wrong_answer) {
                                    this.emit("puzzle-wrong-answer");
                                }
                                if (this.engine.cur_move.correct_answer) {
                                    this.emit("puzzle-correct-answer");
                                }

                                if (this.engine.cur_move.branches.length === 0) {
                                    let isobranches = this.engine.cur_move.findStrongIsobranches();
                                    if (isobranches.length > 0) {
                                        let w = getRandomInt(0, isobranches.length);
                                        let which = isobranches[w];
                                        console.info("Following isomorphism (" + (w + 1) + " of " + isobranches.length + ")");
                                        this.engine.jumpTo(which);
                                        this.emit("update");
                                    }
                                }

                                if (this.engine.cur_move.branches.length) {
                                    let next = this.engine.cur_move.branches[getRandomInt(0, this.engine.cur_move.branches.length)];

                                    if (calls === 1
                                        && /* only move if it's the "ai" turn.. if we undo we can get into states where we
                                            * are playing for the ai for some moves so don't automove blindly */
                                        ((next.player === 2 && this.engine.config.initial_player === "black")
                                            || (next.player === 1 && this.engine.config.initial_player === "white"))
                                        && this.engine.puzzle_opponent_move_mode !== "manual"
                                       ) {
                                           this.autoplaying_puzzle_move = true;
                                           setTimeout(() => {
                                               this.autoplaying_puzzle_move = false;
                                               puzzle_place(next.x, next.y);
                                               this.emit("update");
                                           }, this.puzzle_autoplace_delay);
                                       }
                                } else {
                                    /* default to wrong answer, but only if there are no nodes prior to us that were marked
                                     * as correct */
                                    let c = this.engine.cur_move;
                                    let parent_was_correct = false;
                                    while (c) {
                                        if (c.correct_answer) {
                                            parent_was_correct = true;
                                            break;
                                        }
                                        c = c.parent;
                                    }
                                    if (!parent_was_correct) {
                                        /* default to wrong answer - we say ! here because we will have already emitted
                                         * puzzle-wrong-answer if wrong_answer was true above. */
                                        if (!this.engine.cur_move.wrong_answer) {
                                            this.emit("puzzle-wrong-answer");
                                        }
                                        //break;
                                    }
                                }
                            }}};
                            puzzle_place(x, y);
                        }
                    }
                }
                if (puzzle_mode === "setup") {
                    if (this.engine.board[y][x] === color) {
                        this.engine.initialStatePlace(x, y, 0);
                    } else {
                        this.engine.initialStatePlace(x, y, color);
                    }
                }
                this.emit("update");
            } /* }}} */
            else if (this.engine.phase === "play" || (this.engine.phase === "finished" && this.mode === "analyze")) { /* {{{ */
                if (this.move_selected) {
                    if (this.mode === "play") {
                        this.engine.cur_move.removeIfNoChildren();
                    }

                    /* If same stone is clicked again, simply remove it */
                    let same_stone_clicked = false;
                    if ((this.move_selected.x === x && this.move_selected.y === y)) {
                        this.move_selected = false;
                        same_stone_clicked = true;
                    }

                    this.engine.jumpTo(this.engine.last_official_move);

                    /* If same stone is clicked again, simply remove it */
                    if (same_stone_clicked) {
                        this.updatePlayerToMoveTitle();
                        if (!double_tap) {
                            this.emit("update");
                            return;
                        }
                    }
                }
                this.move_selected = {"x": x, "y": y};

                /* Place our stone */
                try {
                    if ((this.mode !== "edit" || this.edit_color == null) &&
                        !(this.mode === "analyze" && this.analyze_tool === "stone" && this.analyze_subtool !== "alternate")) {
                        this.engine.place(x, y, true, true);

                        if (this.mode === "analyze") {
                            if (this.engine.handicapMovesLeft() > 0) {
                                this.engine.place(-1, -1);
                            }
                        }
                    } else {
                        let edit_color = this.engine.playerByColor(this.edit_color);
                        if (event.shiftKey && edit_color === 1) { /* if we're going to place a black on an empty square but we're holding down shift, place white */
                            edit_color = 2;
                        }
                        else if (event.shiftKey && edit_color === 2) { /* if we're going to place a black on an empty square but we're holding down shift, place white */
                            edit_color = 1;
                        }
                        if (this.engine.board[y][x] === edit_color) {
                            this.engine.editPlace(x, y, 0);
                        }
                        else {
                            this.engine.editPlace(x, y, edit_color);
                        }
                    }

                    if (this.mode === "analyze" && this.analyze_tool === "stone") {
                        let c = this.engine.cur_move;
                        while (c && !c.trunk) {
                            let mark:any = c.getMoveNumberDifferenceFromTrunk();
                            if (c.edited) {
                                mark = "triangle";
                            }

                            if (c.x >= 0 && c.y >= 0 && !(this.engine.board[c.y][c.x])) {
                                this.clearTransientMark(c.x, c.y, mark);
                            } else {
                                this.setTransientMark(c.x, c.y, mark, true);
                            }
                            c = c.parent;
                        }
                    }


                    if (this.isPlayerController()) {
                        this.syncReviewMove();
                        force_redraw = true;
                    }
                } catch (e) {
                    this.move_selected = false;
                    this.updatePlayerToMoveTitle();
                    throw e;
                }

                this.playMovementSound();

                switch (this.mode) {
                    case "play":
                        //if (this.one_click_submit || double_tap || this.engine.game_type === "temporary") {
                        if (this.one_click_submit || double_tap) {
                            submit();
                        }
                        else {
                            this.setSubmit(submit);
                        }
                        break;
                    case "analyze":
                        this.move_selected = false;
                        this.updateTitleAndStonePlacement();
                        this.emit("update");
                        break;
                    case "conditional":
                        this.followConditionalSegment(x, y);
                        this.move_selected = false;
                        this.updateTitleAndStonePlacement();
                        this.emit("update");
                        break;
                    case "edit":
                        this.move_selected = false;
                        this.updateTitleAndStonePlacement();
                        this.emit("update");

                        this.last_sent_move = encodeMove(x, y);
                        this.sendMove({
                            "auth": this.config.auth,
                            "game_id": this.config.game_id,
                            "player_id": this.config.player_id,
                            "move": "!" + this.engine.board[y][x] + encodeMove(x, y)
                        });
                        break;
                }

                if (force_redraw) {
                    this.redraw();
                }
            } /* }}} */

        } catch (e) {
            this.move_selected = false;
            console.info(e);
            this.errorHandler(e);
            this.emit("error");
            this.emit("update");
        }
    } /* }}} */
    public setStrictSekiMode(tf) { /* {{{ */
        if (this.engine.phase !== "stone removal") {
            throw "Not in stone removal phase";
        }
        if (this.engine.strict_seki_mode === tf) { return; }
        this.engine.strict_seki_mode = tf;

        this.socket.send("game/removed_stones/set", {
            "auth"            : this.config.auth,
            "game_id"         : this.config.game_id,
            "player_id"       : this.config.player_id,
            "strict_seki_mode": tf
        });
    } /* }}} */
    private onMouseMove(event) { /* {{{ */
        if (!(this.stone_placement_enabled &&
            (this.player_id || this.engine.black_player_id === 0 || this.mode === "analyze" || this.scoring_mode)
            )) { return; }

        let offset = this.board.offset();
        let x = event.pageX - offset.left;
        let y = event.pageY - offset.top;

        let pt = this.xy2ij(x, y);

        if (this.__last_pt.i === pt.i && this.__last_pt.j === pt.j) {
            return;
        }

        if (this.__last_pt.valid) {
            let last_hover = this.last_hover_square;
            this.last_hover_square = null;
            if (last_hover) {
                this.drawSquare(last_hover.x, last_hover.y);
            }
        }

        this.__last_pt = pt;

        if (pt.valid) {
            this.last_hover_square = {"x": pt.i, "y": pt.j};
            this.drawSquare(pt.i, pt.j);
        }
    } /* }}} */
    private onMouseOut(event) { /* {{{ */
        if (this.__last_pt.valid) {
            let last_hover = this.last_hover_square;
            this.last_hover_square = null;
            if (last_hover) {
                this.drawSquare(last_hover.x, last_hover.y);
            }
        }
        this.__last_pt = this.xy2ij(-1, -1);
    } /* }}} */
    private refreshHoverPosition() { /* {{{ */
        if (this.last_hover_square) {
            this.drawSquare(this.last_hover_square.x, this.last_hover_square.y);
        }
    } /* }}} */
    public computeMetrics() { /* {{{ */
        if (this.square_size <= 0) {
            //console.error("Non positive square size set", this.square_size);
            //console.error(new Error().stack);
            this.square_size = 12;
        }

        let ret = {
            "width": this.square_size * (this.bounded_width + +this.draw_left_labels + +this.draw_right_labels),
            "height": this.square_size * (this.bounded_height + +this.draw_top_labels + +this.draw_bottom_labels),
            "mid": this.square_size / 2,
            "offset": 0
        };

        if (this.square_size % 2 === 0) { ret.mid -= 0.5; ret.offset = 0.5; }

        return ret;
    } /* }}} */
    private setSubmit(fn) { /* {{{ */
        this.submit_move = fn;
        this.emit("show-submit", fn != null);
    } /* }}} */

    private enableDrawing() { /* {{{ */
        this.drawing_enabled = true;
    } /* }}} */
    private disableDrawing() { /* {{{ */
        this.drawing_enabled = false;
    } /* }}} */
    private markDirty() { /* {{{ */
        if (!this.dirty_redraw) {
            this.dirty_redraw = setTimeout(() => {
                this.dirty_redraw = null;
                this.redraw();
            }, 1);
        }
    }  /* }}} */

    private drawSquare(i, j) { /* {{{ */
        if (i < 0 || j < 0) { return; }
        if (this.__draw_state[j][i] !== this.drawingHash(i, j)) {
            this.__drawSquare(i, j);
        }
    } /* }}} */
    private __drawSquare(i, j) { /* {{{ */
        if (!this.drawing_enabled) { return; }
        if (this.no_display) { return; }
        let ctx = this.ctx;
        if (!ctx) { return; }
        if (i < 0 || j < 0) { return; }
        let s = this.square_size;
        let ox = this.draw_left_labels ? s : 0;
        let oy = this.draw_top_labels ? s : 0;
        if (this.bounds.left > 0) {
            ox = -s * this.bounds.left;
        }
        if (this.bounds.top > 0) {
            oy = -s * this.bounds.top;
        }

        let cx;
        let cy;
        let draw_last_move = !this.dont_draw_last_move;

        let stone_color = 0;
        if (this.engine) {
            stone_color = this.engine.board[j][i];
        }

        /* Figure out marks for this spot */
        let pos = this.getMarks(i, j);
        if (!pos) {
            console.error("No position for ", j, i);
            pos = {};
        }
        let altmarking = null;
        if (this.engine && this.engine.cur_move && (this.mode !== "play" || (typeof(this.isInPushedAnalysis()) !== "undefined" && this.isInPushedAnalysis()))) {
            for (let cur = this.engine.cur_move; !cur.trunk; cur = cur.parent) {
                if (cur.x === i && cur.y === j) {
                    let move_diff = cur.getMoveNumberDifferenceFromTrunk();
                    if (move_diff !== cur.move_number) {
                        altmarking = cur.edited ? null : (this.show_move_numbers ? cur.getMoveNumberDifferenceFromTrunk() : null);
                    }
                }
            }
        }

        let movetree_contains_this_square = false;
        if (this.engine && this.engine.cur_move.lookupMove(i, j, this.engine.player, false)) {
            movetree_contains_this_square = true;
        }



        let have_text_to_draw = false;
        let text_color = this.theme_blank_text_color;
        for (let key in pos) {
            if (key.length <= 3) {
                have_text_to_draw = true;
            }
        }
        if (pos.circle || pos.triangle || pos.chat_triangle || pos.cross || pos.square) {
            have_text_to_draw = true;
        }
        if (pos.letter && pos.letter.length > 0) {
            have_text_to_draw = true;
        }

        /* clear and draw lines */
        {{{
            let l = i * s + ox;
            let r = (i + 1) * s + ox;
            let t = j * s + oy;
            let b = (j + 1) * s + oy;

            ctx.clearRect(l, t, r - l, b - t);
            if (this.shadow_ctx) {
                let shadow_offset = this.square_size * 0.10;
                this.shadow_ctx.clearRect(l + shadow_offset, t + shadow_offset, this.square_size, this.square_size);
                shadow_offset = this.square_size * 0.20;
                this.shadow_ctx.clearRect(l + shadow_offset, t + shadow_offset, this.square_size, this.square_size);
                shadow_offset = this.square_size * 0.30;
                this.shadow_ctx.clearRect(l + shadow_offset, t + shadow_offset, this.square_size, this.square_size);
            }

            cx = l + this.metrics.mid;
            cy = t + this.metrics.mid;

            /* draw line */
            let sx = l;
            let ex = r;
            let mx = (r + l) / 2 - this.metrics.offset;
            let sy = t;
            let ey = b;
            let my = (t + b) / 2 - this.metrics.offset;

            if (i ===  0)               { sx += this.metrics.mid; }
            if (i ===  this.width - 1)  { ex -= this.metrics.mid; }
            if (j ===  0)               { sy += this.metrics.mid; }
            if (j ===  this.height - 1) { ey -= this.metrics.mid; }

            if (i ===  this.width - 1 && j ===  this.height - 1) {
                if (mx === ex && my === ey) {
                    ex += 1;
                    ey += 1;
                }
            }

            if (this.square_size < 5) {
                ctx.lineWidth = 0.2;
            } else {
                ctx.lineWidth = 1;
            }
            if (have_text_to_draw) {
                ctx.strokeStyle = this.theme_faded_line_color;
            } else {
                ctx.strokeStyle = this.theme_line_color;
            }
            ctx.lineCap = "butt";
            ctx.beginPath();
            ctx.moveTo(Math.floor(sx), my);
            ctx.lineTo(Math.floor(ex), my);
            ctx.moveTo(mx, Math.floor(sy));
            ctx.lineTo(mx, Math.floor(ey));
            ctx.stroke();
        }}}

        /* Draw star points */
        {{{
            let star_radius;
            if (this.square_size < 5) {
                star_radius = 0.5;
            } else {
                star_radius = Math.max(2, (this.metrics.mid - 1.5) * 0.16);
            }
            let draw_star_point = false;
            if (this.width === 19 && this.height === 19 &&
                (   (i === 3 && (j === 3 || j === 9 || j === 15))
                 || (i === 9 && (j === 3 || j === 9 || j === 15))
                 || (i === 15 && (j === 3 || j === 9 || j === 15))
                )
            ) {
                draw_star_point = true;
            }

            if (this.width === 13 && this.height === 13 &&
                (   (i === 3 && (j === 3 || j === 9))
                 || (i === 6 && (j === 6))
                 || (i === 9 && (j === 3 || j === 9))
                )
            ) {
                draw_star_point = true;
            }

            if (this.width === 9 && this.height === 9 &&
                (   (i === 2 && (j === 2 || j === 6))
                 || (i === 4 && (j === 4))
                 || (i === 6 && (j === 2 || j === 6))
                )
            ) {
                draw_star_point = true;
            }

            if (draw_star_point) {
                ctx.beginPath();
                ctx.fillStyle = this.theme_star_color;
                if (have_text_to_draw) {
                    ctx.fillStyle = this.theme_faded_star_color;
                }
                ctx.arc(cx, cy, star_radius, 0.001, 2 * Math.PI, false); /* 0.001 to workaround fucked up chrome 27 bug */
                ctx.fill();
            }
        }}}

        /* Draw square highlights if any */
        {{{
            if (pos.hint || (this.highlight_movetree_moves && movetree_contains_this_square)) {

                let color = pos.hint ? "#8EFF0A" : "#FF8E0A";

                ctx.lineCap = "square";
                ctx.save();
                ctx.beginPath();
                ctx.globalAlpha = 0.6;
                let r = Math.floor(this.square_size * 0.5) - 0.5;
                ctx.moveTo(cx - r, cy - r);
                ctx.lineTo(cx + r, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.lineTo(cx - r, cy + r);
                ctx.lineTo(cx - r, cy - r);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }
        }}}


        /* Draw stones & hovers */
        {{{
            if (stone_color  /* if there is really a stone here */
                || (this.stone_placement_enabled
                    && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j) && (this.mode !== "analyze" || this.analyze_tool === "stone")
                    && this.engine
                    && !this.scoring_mode
                    && (this.engine.phase === "play" || (this.engine.phase === "finished" && this.mode === "analyze"))
                    && ((this.engine.puzzle_player_move_mode !== "fixed" || movetree_contains_this_square) || this.getPuzzlePlacementSetting().mode !== "play")
                   )
                || (this.scoring_mode
                    && this.score_estimate
                    && this.score_estimate.board[j][i]
                    && this.score_estimate.removal[j][i]
                   )
                || (this.engine
                    && this.engine.phase === "stone removal"
                    && this.engine.board[j][i]
                    && this.engine.removal[j][i]
                   )
            ) {
                //let color = stone_color ? stone_color : (this.move_selected ? this.engine.otherPlayer() : this.engine.player);
                let transparent = false;
                let color;
                if (this.scoring_mode
                    && this.score_estimate
                    && this.score_estimate.board[j][i]
                    && this.score_estimate.removal[j][i]
                ) {
                    color = this.score_estimate.board[j][i];
                    transparent = true;
                }
                else if (this.engine && (this.engine.phase === "stone removal" || (this.engine.phase === "finished" && this.mode !== "analyze"))
                    && this.engine.board && this.engine.removal
                    && this.engine.board[j][i]
                    && this.engine.removal[j][i]
                ) {
                    color = this.engine.board[j][i];
                    transparent = true;
                }
                else if (stone_color) {
                    color = stone_color;
                }
                else if (this.mode === "edit" || (this.mode === "analyze" && this.analyze_tool === "stone" && this.analyze_subtool !== "alternate")) {
                    color = this.edit_color === "black" ? 1 : 2;
                    if (this.shift_key_is_down) {
                        color = this.edit_color === "black" ? 2 : 1;
                    }
                }
                else if (this.move_selected) {
                    if (this.engine.handicapMovesLeft() <= 0) {
                        color = this.engine.otherPlayer();
                    }   else {
                            color = this.engine.player;
                    }
                }
                else if (this.mode === "puzzle") {
                    if (this.getPuzzlePlacementSetting) {
                        let s = this.getPuzzlePlacementSetting();
                        if (s.mode === "setup") {
                            color = s.color;
                            if (this.shift_key_is_down) {
                                color = color === 1 ? 2 : 1;
                            }
                        } else {
                            color = this.engine.player;
                        }
                    } else {
                        color = this.engine.player;
                    }

                }
                else {
                    color = this.engine.player;

                    if (this.mode === "pattern search" && this.pattern_search_color) {
                        color = this.pattern_search_color;
                    }
                }


                if (!(this.autoplaying_puzzle_move && !stone_color)) {
                    text_color = color === 1 ? this.theme_black_text_color : this.theme_white_text_color;

                    if (!this.theme_black_stones) {
                        let err = new Error(`Goban.theme_black_stones not set. Current themes is ${JSON.stringify(this.themes)}`);
                        setTimeout(() => { throw err; }, 1);
                        return;
                    }
                    if (!this.theme_white_stones) {
                        let err = new Error(`Goban.theme_white_stones not set. Current themes is ${JSON.stringify(this.themes)}`);
                        setTimeout(() => { throw err; }, 1);
                        return;
                    }

                    ctx.save();
                    let shadow_ctx = this.shadow_ctx;
                    if (!stone_color || transparent) {
                        ctx.globalAlpha = 0.6;
                        shadow_ctx = null;
                    }
                    if (color === 1) {
                        let stone = this.theme_black_stones[((i + 1) * 53) * ((j + 1) * 97) % this.theme_black_stones.length];
                        this.theme_black.placeBlackStone(ctx, shadow_ctx, stone, cx, cy, this.theme_stone_radius);
                    } else {
                        let stone = this.theme_white_stones[((i + 1) * 53) * ((j + 1) * 97) % this.theme_white_stones.length];
                        this.theme_white.placeWhiteStone(ctx, shadow_ctx, stone, cx, cy, this.theme_stone_radius);
                    }
                    ctx.restore();
                }
            }
        }}}

        /* Draw delete X's */
        {{{
            let draw_x = false;
            let transparent_x = false;
            if (this.engine && (this.scoring_mode || this.engine.phase === "stone removal") && this.stone_placement_enabled
                && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)
                && (this.mode !== "analyze" || this.analyze_tool === "stone")) {
                draw_x = true;
                transparent_x = true;
            }

            if (pos.mark_x) {
                draw_x = true;
                transparent_x = false;
            }

            draw_x = false;


            if (draw_x) {
                ctx.beginPath();
                ctx.save();
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = this.square_size * 0.175;
                if (transparent_x) {
                    ctx.globalAlpha = 0.6;
                }
                let r = Math.max(1, this.metrics.mid * 0.7);
                ctx.moveTo(cx - r, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.moveTo(cx + r, cy - r);
                ctx.lineTo(cx - r, cy + r);
                ctx.stroke();
                ctx.restore();
            }
        }}}

        /* Draw Scores */
        {{{
            if ((pos.score && (this.engine.phase !== "finished" ||  this.mode === "play"))
                || (this.scoring_mode
                     && this.score_estimate
                     && (this.score_estimate.territory[j][i]
                         || (this.score_estimate.removal[j][i] && this.score_estimate.board[j][i] === 0)
                    ))
                || (
                    (this.engine.phase === "stone removal"
                     || ( this.engine.phase === "finished" && this.mode === "play")
                    ) &&
                    this.engine.board[j][i] === 0 && this.engine.removal[j][i])
                  ) {
                ctx.beginPath();

                let color = pos.score;
                if (this.scoring_mode
                    && this.score_estimate
                    && (this.score_estimate.territory[j][i] || (this.score_estimate.removal[j][i] && this.score_estimate.board[j][i] === 0))) {
                    color = this.score_estimate.territory[j][i] === 1 ? "black" : "white";
                    if (this.score_estimate.board[j][i] === 0 && this.score_estimate.removal[j][i]) {
                        color = "dame";
                    }
                }

                if ((this.engine.phase === "stone removal" || (this.engine.phase === "finished" && this.mode === "play")) &&
                    this.engine.board[j][i] === 0 && this.engine.removal[j][i]) {
                    color = "dame";
                }

                if (color === "white") {
                    ctx.fillStyle = this.theme_black_text_color;
                    ctx.strokeStyle = "#777777";
                }
                else if (color === "black") {
                    ctx.fillStyle = this.theme_white_text_color;
                    ctx.strokeStyle = "#888888";
                }
                else if (color === "dame") {
                    ctx.fillStyle = "#ff0000";
                    ctx.strokeStyle = "#365FE6";
                }
                ctx.lineWidth = Math.ceil(this.square_size * 0.065) - 0.5;

                let r = this.square_size * 0.15;
                ctx.rect(cx - r, cy - r, r * 2, r * 2);
                if (color !== "dame") {
                    ctx.fill();
                }
                ctx.stroke();
            }
        }}}



        /* Draw letters and numbers */
        let letter_was_drawn = false;
        {{{
            let letter = null;
            let transparent = false;
            if ("letter" in pos && pos.letter.length > 0) {
                letter = pos.letter;
            }

            if (this.mode === "play" && this.byoyomi_label && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                letter = this.byoyomi_label;
            }
            if (this.mode === "analyze" && this.analyze_tool === "label" && (this.analyze_subtool === "letters" || this.analyze_subtool === "numbers")
                && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                transparent = true;
                letter = this.label_character;
            }
            if (!letter && altmarking !== "triangle") {
                letter = altmarking;
            }


            if (this.show_variation_move_numbers
                && !letter
                && !(pos.circle || pos.triangle || pos.chat_triangle || pos.cross || pos.square)
            ) {
                let m = this.engine.getMoveByLocation(i, j);
                if (m && !m.trunk) {
                    if (m.edited) {
                        //letter = "triangle";
                        if (this.engine.board[j][i]) {
                            altmarking = "triangle";
                        }
                    } else {
                        letter = m.getMoveNumberDifferenceFromTrunk();
                    }
                }
            }


            if (letter) {
                letter_was_drawn = true;
                ctx.save();
                ctx.fillStyle = text_color;
                let metrics = ctx.measureText(letter);

                if (metrics.width > this.square_size) {
                    /* For some wide labels, our default font size is too large.. so
                     * for those labels, set the font size down. This is a slow
                     * operation to do on every square, so we don't want to dynamically
                     * size them like this unless we have to.  */
                    ctx.font = "bold " + (Math.round(this.square_size * 0.35)) + "px " + GOBAN_FONT;
                    metrics = ctx.measureText(letter);
                }

                let xx = cx - metrics.width / 2;
                let yy = cy + (/WebKit|Trident/.test(navigator.userAgent) ? this.square_size * -0.03 : 1); /* middle centering is different on firefox */
                ctx.textBaseline = "middle";
                if (transparent) {
                    ctx.globalAlpha = 0.6;
                }
                ctx.fillText(letter, xx, yy);
                draw_last_move = false;
                ctx.restore();
            }
        }}}

        /* draw special symbols */
        {{{
            let transparent = letter_was_drawn;
            let hovermark = null;
            let symbol_color = stone_color === 1 ? this.theme_black_text_color : stone_color === 2 ? this.theme_white_text_color : text_color;

            if (this.analyze_tool === "label" && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                if (this.analyze_subtool === "triangle" || this.analyze_subtool === "square" || this.analyze_subtool === "cross" || this.analyze_subtool === "circle") {
                    transparent = true;
                    hovermark = this.analyze_subtool;
                }
            }



            if (pos.circle || hovermark === "circle") {
                ctx.lineCap = "round";
                ctx.save();
                ctx.beginPath();
                if (transparent) {
                    ctx.globalAlpha = 0.6;
                }
                ctx.strokeStyle = symbol_color;
                ctx.lineWidth = this.square_size * 0.075;
                ctx.arc(cx, cy, this.square_size * 0.25, 0, 2 * Math.PI, false);
                ctx.stroke();
                ctx.restore();
                draw_last_move = false;
            }
            if (pos.triangle || pos.chat_triangle || altmarking === "triangle" || hovermark === "triangle") {
                ctx.lineCap = "round";
                ctx.save();
                ctx.beginPath();
                if (transparent) {
                    ctx.globalAlpha = 0.6;
                }
                ctx.strokeStyle = symbol_color;
                if (pos.chat_triangle) {
                    ctx.strokeStyle = "#00aaFF";
                }
                ctx.lineWidth = this.square_size * 0.075;
                let theta = -(Math.PI * 2) / 4;
                let r = this.square_size * 0.30;
                ctx.moveTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
                theta += (Math.PI * 2) / 3; ctx.lineTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
                theta += (Math.PI * 2) / 3; ctx.lineTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
                theta += (Math.PI * 2) / 3; ctx.lineTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
                ctx.stroke();
                ctx.restore();
                draw_last_move = false;
            }
            if (pos.cross || hovermark === "cross") {
                ctx.lineCap = "square";
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = this.square_size * 0.075;
                if (transparent) {
                    ctx.globalAlpha = 0.6;
                }
                let r = Math.max(1, this.metrics.mid * 0.35);
                ctx.moveTo(cx - r, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.moveTo(cx + r, cy - r);
                ctx.lineTo(cx - r, cy + r);
                ctx.strokeStyle = symbol_color;
                ctx.stroke();
                ctx.restore();
                draw_last_move = false;
            }

            if (pos.square || hovermark === "square") {
                ctx.lineCap = "square";
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = this.square_size * 0.075;
                if (transparent) {
                    ctx.globalAlpha = 0.6;
                }
                let r = Math.max(1, this.metrics.mid * 0.40);
                ctx.moveTo(cx - r, cy - r);
                ctx.lineTo(cx + r, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.lineTo(cx - r, cy + r);
                ctx.lineTo(cx - r, cy - r);
                ctx.strokeStyle = symbol_color;
                ctx.stroke();
                ctx.restore();
                draw_last_move = false;
            }

        }}}


        /* Clear last move */
        if (this.last_move && this.engine && !this.last_move.is(this.engine.cur_move)) { /* {{{ */
            let m = this.last_move;
            this.last_move = null;
            this.drawSquare(m.x, m.y);
        } /* }}} */

        /* Draw last move */
        if (draw_last_move && this.engine && this.engine.cur_move) { /* {{{ */
            if (this.engine.cur_move.x === i && this.engine.cur_move.y === j && this.engine.board[j][i] &&
                  (this.engine.phase === "play" || (this.engine.phase === "finished"))
            ) {
                let xx = -1;
                let yy = -1;
                this.last_move = this.engine.cur_move;

                let r = this.square_size * 0.35;

                if (i >= 0 && j >= 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = stone_color === 1 ? this.theme_black_text_color : this.theme_white_text_color;
                    ctx.lineWidth = this.square_size * 0.075;
                    ctx.arc(cx, cy, this.square_size * 0.25, 0, 2 * Math.PI, false);
                    ctx.stroke();
                }
            }
        } /* }}} */


        /* Score Estimation */
        /* {{{ */
        if (this.scoring_mode && this.score_estimate) {
            let se = this.score_estimate;
            let est = se.heat[j][i];

            ctx.beginPath();

            let color = est < 0 ? "white" : "black";

            if (color === "white") {
                ctx.fillStyle = this.theme_black_text_color;
                ctx.strokeStyle = "#777777";
            }
            else if (color === "black") {
                ctx.fillStyle = this.theme_white_text_color;
                ctx.strokeStyle = "#888888";
            }
            ctx.lineWidth = Math.ceil(this.square_size * 0.035) - 0.5;
            let r = this.square_size * 0.20 * Math.abs(est) ;
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
            ctx.fill();
            ctx.stroke();
        }
        /* }}} */


        this.__draw_state[j][i] = this.drawingHash(i, j);
    } /* }}} */
    private drawingHash(i, j) { /* {{{ */
        if (i < 0 || j < 0) {
            return "..";
        }

        let ret = this.square_size + ",";

        let draw_last_move = !this.dont_draw_last_move;
        let stone_color = 0;
        if (this.engine) {
            stone_color = this.engine.board[j][i];
        }


        ret += stone_color + ",";

        /* Figure out marks for this spot */
        let pos = this.getMarks(i, j);
        if (!pos) {
            console.error("No position for ", j, i);
            pos = {};
        }
        let altmarking = null;
        if (this.engine && this.engine.cur_move && (this.mode !== "play" || (typeof(this.isInPushedAnalysis()) !== "undefined" && this.isInPushedAnalysis()))) {
            for (let cur = this.engine.cur_move; !cur.trunk; cur = cur.parent) {
                if (cur.x === i && cur.y === j) {
                    let move_diff = cur.getMoveNumberDifferenceFromTrunk();
                    if (move_diff !== cur.move_number) {
                        altmarking = cur.edited ? null : (this.show_move_numbers ? cur.getMoveNumberDifferenceFromTrunk() : null);
                    }
                }
            }
        }

        let movetree_contains_this_square = false;
        if (this.engine && this.engine.cur_move.lookupMove(i, j, this.engine.player, false)) {
            movetree_contains_this_square = true;
        }

        /* Draw stones & hovers */
        {{{
            if (stone_color ||  /* if there is really a stone here */
                (this.stone_placement_enabled
                    && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j) && (this.mode !== "analyze" || this.analyze_tool === "stone")
                    && this.engine
                    && (this.engine.phase === "play" || (this.engine.phase === "finished" && this.mode === "analyze")))
                || (this.scoring_mode
                    && this.score_estimate
                    && this.score_estimate.board[j][i]
                    && this.score_estimate.removal[j][i]
                   )
                || (this.engine
                    && this.engine.phase === "stone removal"
                    && this.engine.board[j][i]
                    && this.engine.removal[j][i]
                   )
            ) {
                let transparent = false;
                let color;
                if (this.scoring_mode
                    && this.score_estimate
                    && this.score_estimate.board[j][i]
                    && this.score_estimate.removal[j][i]
                ) {
                    color = this.score_estimate.board[j][i];
                    transparent = true;
                }
                else if (this.engine && this.engine.phase === "stone removal"
                    && this.engine.board && this.engine.removal
                    && this.engine.board[j][i]
                    && this.engine.removal[j][i]
                ) {
                    color = this.engine.board[j][i];
                    transparent = true;
                }
                else if (stone_color) {
                    color = stone_color;
                }
                else if (this.mode === "edit" || (this.mode === "analyze" && this.analyze_tool === "stone" && this.analyze_subtool !== "alternate")) {
                    color = this.edit_color === "black" ? 1 : 2;
                }
                else if (this.move_selected) {
                    if (this.engine.handicapMovesLeft() <= 0) {
                        color = this.engine.otherPlayer();
                    }   else {
                            color = this.engine.player;
                    }
                }
                else {
                    color = this.engine.player;
                }

                ret += (transparent ? "T" : "") + color + ",";
            }
        }}}

        /* Draw square highlights if any */
        {{{
            if (pos.hint || (this.highlight_movetree_moves && movetree_contains_this_square)) {
                if (pos.hint) {
                    ret += "hint,";
                } else {
                    ret += "highlight,";
                }
            }
        }}}



        /* Draw delete X's */
        {{{
            let draw_x = false;
            let transparent = false;
            if (this.engine && (this.scoring_mode || this.engine.phase === "stone removal") && this.stone_placement_enabled
                && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)
                && (this.mode !== "analyze" || this.analyze_tool === "stone")) {
                draw_x = true;
                transparent = true;
            }

            if (pos.mark_x) {
                draw_x = true;
                transparent = false;
            }

            if (this.scoring_mode && this.score_estimate && this.score_estimate.removal[j][i]) {
                draw_x = true;
                transparent = false;
            }

            if (pos.remove && (this.mode !== "analyze")) {
                draw_x = true;
                transparent = false;
            }

            ret += draw_x + "," + transparent;
        }}}

        /* Draw Scores */
        {{{
            if ((pos.score && (this.engine.phase !== "finished" ||  this.mode === "play"))
                || (this.scoring_mode && this.score_estimate && (this.score_estimate.territory[j][i] || (this.score_estimate.removal[j][i] && this.score_estimate.board[j][i] === 0)))
                || ((this.engine.phase === "stone removal" || (this.engine.phase === "finished" && this.mode === "play")) &&
                    this.engine.board[j][i] === 0 && this.engine.removal[j][i])
                ) {

                let color = pos.score;
                if (this.scoring_mode && this.score_estimate && (this.score_estimate.territory[j][i] || (this.score_estimate.removal[j][i] && this.score_estimate.board[j][i] === 0))) {
                    color = this.score_estimate.territory[j][i] === 1 ? "black" : "white";
                    if (this.score_estimate.board[j][i] === 0 && this.score_estimate.removal[j][i]) {
                        color = "dame";
                    }
                }

                if ((this.engine.phase === "stone removal" || (this.engine.phase === "finished" && this.mode === "play")) &&
                    this.engine.board[j][i] === 0 && this.engine.removal[j][i]) {
                    color = "dame";
                }

                if (this.scoring_mode && this.score_estimate && this.score_estimate.territory[j][i]) {
                    color = this.score_estimate.territory[j][i] === 1 ? "black" : "white";
                }
                ret += "score " + color + ",";
            }
        }}}



        /* Draw letters and numbers */
        {{{
            let letter = null;
            let transparent = false;
            if ("letter" in pos && pos.letter.length > 0) {
                letter = pos.letter;
            }
            if (this.mode === "play" && this.byoyomi_label && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                //transparent = true;
                letter = this.byoyomi_label;
            }
            if (this.mode === "analyze" && this.analyze_tool === "label"
                && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                transparent = true;
                letter = this.label_character;
            }
            if (!letter && altmarking !== "triangle") {
                letter = altmarking;
            }

            if (this.show_variation_move_numbers
                && !letter
                && !(pos.circle || pos.triangle || pos.chat_triangle || pos.cross || pos.square)
            ) {
                let m = this.engine.getMoveByLocation(i, j);
                if (m && !m.trunk) {
                    if (m.edited) {
                        //letter = "triangle";
                        if (this.engine.board[j][i]) {
                            altmarking = "triangle";
                        }
                    } else {
                        letter = m.getMoveNumberDifferenceFromTrunk();
                    }
                }
            }

            if (letter) {
                ret += letter + (transparent ? " fade" : "") + ",";
            }
        }}}

        /* draw special symbols */
        {{{
            let hovermark;
            if (this.analyze_tool === "label" && (this.last_hover_square && this.last_hover_square.x === i && this.last_hover_square.y === j)) {
                if (this.analyze_subtool === "triangle" || this.analyze_subtool === "square" || this.analyze_subtool === "cross" || this.analyze_subtool === "circle") {
                    hovermark = this.analyze_subtool;
                    ret += "hover " + this.analyze_subtool + ",";
                }
            }


            if (pos.circle) {
                ret += "circle,";
            }
            if (pos.triangle || pos.chat_triangle || altmarking === "triangle") {
                ret += "triangle,";
            }
            if (pos.cross) {
                ret += "cross,";
            }
            if (pos.square) {
                ret += "square,";
            }
        }}}


        /* Draw last move */
        if (draw_last_move && this.engine && this.engine.cur_move) {
            if (this.engine.cur_move.x === i && this.engine.cur_move.y === j && this.engine.board[j][i] &&
                  (this.engine.phase === "play" || (this.engine.phase === "finished"))
            ) {
                ret += "last_move,";
            }
        }

        return ret;
    } /* }}} */

    public redraw(force_clear?: boolean) { /* {{{ */
        if (!this.drawing_enabled) {
            return;
        }
        if (this.no_display) { return; }

        let start = new Date();

        let metrics = this.metrics = this.computeMetrics();
        if (force_clear || !(this.__set_board_width === metrics.width && this.__set_board_height === metrics.height && this.theme_stone_radius === this.computeThemeStoneRadius(metrics))) {
            try {
                this.parent.css({"width": metrics.width + "px", "height": metrics.height + "px"});
                resizeDeviceScaledCanvas(this.board, metrics.width, metrics.height);

                let bo = this.board.offset();
                let po = this.parent.offset() || {"top": 0, "left": 0};
                let top = bo.top - po.top;
                let left = bo.left - po.left;

                this.layer_offset_left = 0;
                this.layer_offset_top = 0;

                if (this.pen_layer) {
                    if (this.pen_marks.length) {
                        resizeDeviceScaledCanvas(this.pen_layer, metrics.width, metrics.height);
                        this.pen_layer.css({"left": this.layer_offset_left, "top": this.layer_offset_top});
                        this.pen_ctx = this.pen_layer[0].getContext("2d");
                    } else {
                        this.detachPenCanvas();
                    }
                }

                this.__set_board_width = metrics.width;
                this.__set_board_height = metrics.height;
                this.ctx = this.board[0].getContext("2d");

                this.setThemes(this.getSelectedThemes(), true);
            } catch (e) {
                setTimeout(() => { throw e; }, 1);
                return;
            }
        }
        let ctx = this.ctx;


        let place = (ch, x, y) => { /* places centered (horizontally & veritcally) text at x,y */
            let metrics = ctx.measureText(ch);
            let xx = x - metrics.width / 2;
            let yy = y;
            ctx.fillText(ch, xx, yy);
        };
        let vplace = (ch, x, y) => { /* places centered (horizontally & veritcally) text at x,y, with text going down vertically. */
            for (let i = 0; i < ch.length; ++i) {
                let metrics = ctx.measureText(ch[i]);
                let xx = x - metrics.width / 2;
                let yy = y;
                let H = metrics.width; /* should be height in an ideal world, measureText doesn't seem to return it though. For our purposes this works well enough though. */

                if (ch.length === 2) {
                    yy = yy - H + (i * H);
                }
                if (ch.length === 3) {
                    yy = yy - (H * 1.5) + (i * H);
                }

                ctx.fillText(ch[i], xx, yy);
            }
        };

        let drawHorizontal = (i, j) => {
            switch (this.getCoordinateDisplaySystem()) {
                case 'A1':
                    for (let c = 0; c < this.width; ++i, ++c) {
                        let x = (i - this.bounds.left - (this.bounds.left > 0 ? +this.draw_left_labels : 0)) * this.square_size + this.square_size / 2;
                        let y = j * this.square_size + this.square_size / 2;
                        place("ABCDEFGHJKLMNOPQRSTUVWXYZ"[c], x, y);
                    }
                    break;
                case '1-1':
                    for (let c = 0; c < this.width; ++i, ++c) {
                        let x = (i - this.bounds.left - (this.bounds.left > 0 ? +this.draw_left_labels : 0)) * this.square_size + this.square_size / 2;
                        let y = j * this.square_size + this.square_size / 2;
                        place('' + (c + 1), x, y);
                    }
                    break;
            }
        };

        let drawVertical = (i, j) => {
            switch (this.getCoordinateDisplaySystem()) {
                case 'A1':
                    for (let c = 0; c < this.height; ++j, ++c) {
                        let x = i * this.square_size + this.square_size / 2;
                        let y = (j - this.bounds.top - (this.bounds.top > 0 ? +this.draw_top_labels : 0)) * this.square_size + this.square_size / 2;
                        place("" + (this.height - c), x, y);
                    }
                    break;
                case '1-1':
                    let chinese_japanese_numbers = [
                        "一", "二", "三", "四", "五",
                        "六", "七", "八", "九", "十",
                        "十一", "十二", "十三", "十四", "十五",
                        "十六", "十七", "十八", "十九", "二十",
                        "二十一", "二十二", "二十三", "二十四", "二十五",
                    ];
                    for (let c = 0; c < this.height; ++j, ++c) {
                        let x = i * this.square_size + this.square_size / 2;
                        let y = (j - this.bounds.top - (this.bounds.top > 0 ? +this.draw_top_labels : 0)) * this.square_size + this.square_size / 2;
                        vplace(chinese_japanese_numbers[c], x, y);
                    }
                    break;
            }
        };

        if (force_clear || !this.__borders_initialized) {
            this.__borders_initialized = true;
            if (this.shadow_ctx) {
                this.shadow_ctx.clearRect (0, 0, metrics.width, metrics.height);
            }
            ctx.clearRect (0, 0, metrics.width, metrics.height);

            /* Draw labels */
            let text_size = Math.round(this.square_size * 0.5);
            let bold = 'bold';
            if (this.getCoordinateDisplaySystem() === '1-1') {
                text_size *= 0.7;
                bold = '';

                if (this.height > 20) {
                    text_size *= 0.7;
                }
            }

            ctx.font = `${bold} ${text_size}px ${GOBAN_FONT}`;
            ctx.textBaseline = "middle";
            ctx.fillStyle = this.theme_board.getLabelTextColor();
            ctx.save();

            if (this.draw_top_labels && this.bounds.top === 0) {
                drawHorizontal(this.draw_left_labels, 0);
            }
            if (this.draw_bottom_labels && this.bounds.bottom === this.height - 1) {
                drawHorizontal(this.draw_left_labels, +this.draw_top_labels + this.bounded_height);
            }
            if (this.draw_left_labels && this.bounds.left === 0) {
                drawVertical(0, this.draw_top_labels);
            }
            if (this.draw_right_labels && this.bounds.right === this.width - 1) {
                drawVertical(+this.draw_left_labels + this.bounded_width, +this.draw_top_labels);
            }

            ctx.restore();
        }

        /* Draw squares */
        if (!this.__draw_state || force_clear || this.__draw_state.length !== this.height || this.__draw_state[0].length !== this.width) {
            this.__draw_state = GoMath.makeMatrix(this.width, this.height);
        }


        /* Set font for text overlay */
        {
            let text_size = Math.round(this.square_size * 0.45);
            ctx.font = "bold " + text_size + "px " + GOBAN_FONT;
        }

        for (let j = this.bounds.top; j <= this.bounds.bottom; ++j) {
            for (let i = this.bounds.left; i <= this.bounds.right; ++i) {
                this.drawSquare(i, j);
            }
        }

        let stop = new Date();
        this.drawPenMarks(this.pen_marks);

        if (this.move_tree_div) {
            this.redrawMoveTree();
        }
    } /* }}} */
    abstract getSelectedThemes();

    private computeThemeStoneRadius(metrics) {{{
        // Scale proportionally in general
        let r = this.square_size * 0.488;

        // Prevent pixel sharing in low-res
        if (this.square_size % 2 === 0) {
            r = Math.min(r, (this.square_size - 1) / 2);
        }

        return Math.max(1, r);
    }}}
    private setThemes(themes, dont_redraw) { /* {{{ */
        if (this.no_display) {
            return;
        }

        this.themes = themes;

        this.theme_board = new (GoThemes["board"][themes.board])();
        this.theme_white = new (GoThemes["white"][themes.white])(this.theme_board);
        this.theme_black = new (GoThemes["black"][themes.black])(this.theme_board);

        if (!this.metrics) {
            this.metrics = this.computeMetrics();
        }
        this.theme_stone_radius = this.computeThemeStoneRadius(this.metrics);
        if (isNaN(this.theme_stone_radius)) {
            console.error("setThemes was not able to find the board size, metrics were: ", JSON.stringify(this.metrics));
            throw new Error("invalid stone radius computed");
        }

        if (this.theme_white.stoneCastsShadow(this.theme_stone_radius) || this.theme_black.stoneCastsShadow(this.theme_stone_radius)) {
            if (this.shadow_layer) {
                resizeDeviceScaledCanvas(this.shadow_layer, this.metrics.width, this.metrics.height);
                this.shadow_layer.css({"left": this.layer_offset_left, "top": this.layer_offset_top});
                this.shadow_ctx = this.shadow_layer[0].getContext("2d");
            } else {
                this.attachShadowLayer();
            }
        } else {
            this.detachShadowLayer();
        }


        if (!(themes.white in __theme_cache.white)) { __theme_cache.white[themes.white] = {}; }
        if (!(themes.black in __theme_cache.black)) { __theme_cache.black[themes.black] = {}; }
        if (!(this.theme_stone_radius in __theme_cache.white[themes.white])) {
            __theme_cache.white[themes.white][this.theme_stone_radius] = this.theme_white.preRenderWhite(this.theme_stone_radius, 23434);
        }
        if (!(this.theme_stone_radius in __theme_cache.black[themes.black])) {
            __theme_cache.black[themes.black][this.theme_stone_radius] = this.theme_black.preRenderBlack(this.theme_stone_radius, 2081);
        }

        this.theme_white_stones = __theme_cache.white[themes.white][this.theme_stone_radius];
        this.theme_black_stones = __theme_cache.black[themes.black][this.theme_stone_radius];
        this.theme_line_color = this.theme_board.getLineColor();
        this.theme_faded_line_color = this.theme_board.getFadedLineColor();
        this.theme_star_color = this.theme_board.getStarColor();
        this.theme_faded_star_color = this.theme_board.getFadedStarColor();
        this.theme_blank_text_color = this.theme_board.getBlankTextColor();
        this.theme_black_text_color = this.theme_black.getBlackTextColor();
        this.theme_white_text_color = this.theme_white.getWhiteTextColor();
        this.parent.css(this.theme_board.getBackgroundCSS());
        if (this.move_tree_div) {
            if (this.engine) {
                this.engine.move_tree.updateTheme(this);
            }
        }

        if (!dont_redraw) {
            this.redraw(true);
            if (this.move_tree_div) {
                this.redrawMoveTree();
            }
        }
    } /* }}} */
    public redrawMoveTree() { /* {{{ */
        let d = $(this.move_tree_div);
        let c = $(this.move_tree_canvas);
        if (d.length && c.length) {
            this.engine.move_tree.redraw({
                "board": this,
                "active_path_end": this.engine.cur_move,
                "div": d,
                "canvas": c
            });
        }
    } /* }}} */
    private updateMoveTree() { /* {{{ */
        this.redrawMoveTree();
    } /* }}} */
    private updateOrRedrawMoveTree() { /* {{{ */
        if (MoveTree.layout_dirty) {
            this.redrawMoveTree();
        } else {
            this.updateMoveTree();
        }
    } /* }}} */

    public load(config) { /* {{{ */

        this.clearMessage();
        this.width = config.width || 19;
        this.height = config.height || 19;
        this.move_selected = false;

        this.bounds = config.bounds || {top: 0, left: 0, bottom: this.height - 1, right: this.width - 1};
        if (this.bounds) {
            this.bounded_width = (this.bounds.right - this.bounds.left) + 1;
            this.bounded_height = (this.bounds.bottom - this.bounds.top) + 1;
        } else {
            this.bounded_width = this.width;
            this.bounded_height = this.height;
        }


        if ("display_width" in config && this.original_square_size === "auto") {
            this.display_width = config["display_width"];
            if (isNaN(this.display_width)) {
                console.error("Invalid display width. (NaN)");
                this.display_width = 320;
            }
            let n_squares = Math.max(this.bounded_width + +this.draw_left_labels + +this.draw_right_labels, this.bounded_height + +this.draw_bottom_labels + +this.draw_top_labels);
            if (isNaN(n_squares)) {
                console.error("Invalid n_squares: ", n_squares);
                console.error("bounded_width: ", this.bounded_width);
                console.error("this.draw_left_labels: ", this.draw_left_labels);
                console.error("this.draw_right_labels: ", this.draw_right_labels);
                console.error("bounded_height: ", this.bounded_height);
                console.error("this.draw_top_labels: ", this.draw_top_labels);
                console.error("this.draw_bottom_labels: ", this.draw_bottom_labels);
                n_squares = 19;
            }

            this.square_size = Math.floor(this.display_width / n_squares);
        }

        if (!this.__draw_state || this.__draw_state.length !== this.height || this.__draw_state[0].length !== this.width) {
            this.__draw_state = GoMath.makeMatrix(this.width, this.height);
        }

        let merged_log = [];
        let main_log = (config.chat_log || []).map((x) => {x.channel = "main"; return x; });
        let spectator_log = (config.spectator_log || []).map((x) => {x.channel = "spectator"; return x; });
        let malkovich_log = (config.malkovich_log || []).map((x) => {x.channel = "malkovich"; return x; });
        merged_log = merged_log.concat(main_log, spectator_log, malkovich_log);
        merged_log.sort((a, b) => a.date - b.date);

        for (let line of merged_log) {
            this.emit("chat", line);
        }


        /* This must be done last as it will invoke the appropriate .set actions to set the board in it's correct state */
        let old_engine = this.engine;
        this.engine = new GoEngine(config, this);
        this.engine.getState_callback = () => { return this.getState(); };
        this.engine.setState_callback = (state) => { return this.setState(state); };
        if (this.move_number) {
            this.move_number.text(this.engine.getMoveNumber());
        }

        if ("marks" in this.config && this.engine) {
            this.setMarks(this.config.marks);
        }
        this.setConditionalTree(null);

        if (this.engine.puzzle_player_move_mode === "fixed" && this.getPuzzlePlacementSetting().mode === "play") {
            this.highlight_movetree_moves = true;
            this.restrict_moves_to_movetree = true;
        }
        if (this.getPuzzlePlacementSetting && this.getPuzzlePlacementSetting().mode !== "play") {
            this.highlight_movetree_moves = true;
        }

        if (!(old_engine && old_engine.boardMatriciesAreTheSame(old_engine.board, this.engine.board))) {
            this.redraw(true);
        }

        this.updatePlayerToMoveTitle();
        if (this.mode === "play") {
            if (this.engine.playerToMove() === this.player_id) {
                this.enableStonePlacement();
            } else {
                this.disableStonePlacement();
            }
        } else {
            if (this.stone_placement_enabled) {
                this.disableStonePlacement();
                this.enableStonePlacement();
            }
        }
        this.setLastOfficialMove();
        this.emit("update");

        if (this.engine.phase === "stone removal" && !("auto_scoring_done" in this) && !("auto_scoring_done" in (this as any).engine)) {
            (this as any).autoScore();
        }
    } /* }}} */
    private set(x, y, player) { /* {{{ */
        this.markDirty();
    } /* }}} */
    private setForRemoval(x, y, removed) { /* {{{ */
        if (removed) {
            this.getMarks(x, y).stone_removed = true;
            this.getMarks(x, y).remove = true;
        } else {
            this.getMarks(x, y).stone_removed = false;
            this.getMarks(x, y).remove = false;
        }
        this.drawSquare(x, y);
        this.emit("set-for-removal", {x, y, removed});
    } /* }}} */
    public showScores(score) { /* {{{ */
        this.hideScores();
        this.showing_scores = true;

        for (let i = 0; i < 2; ++i) {
            let color = i ? "black" : "white";
            let moves = this.engine.decodeMoves(score[color].scoring_positions);
            for (let j = 0; j < moves.length; ++j) {
                let mv = moves[j];
                if (mv.y < 0 || mv.x < 0) {
                    console.error("Negative scoring position: ", mv);
                    console.error("Scoring positions [" + color + "]: ", score[color].scoring_positions);
                } else {
                    this.getMarks(mv.x, mv.y).score = color;
                    this.drawSquare(mv.x, mv.y);
                }
            }
        }
    } /* }}} */
    public hideScores() { /* {{{ */
        this.showing_scores = false;
        for (let j = 0; j < this.height; ++j) {
            for (let i = 0; i < this.width; ++i) {
                if (this.getMarks(i, j).score) {
                    this.getMarks(i, j).score = false;
                    this.drawSquare(i, j);
                }
            }
        }
    } /* }}} */

    public updatePlayerToMoveTitle() { /* {{{ */
        switch (this.engine.phase) {
            case "play":
                if (this.player_id && this.player_id === this.engine.playerToMove() && this.mode !== "edit" && this.engine.cur_move.id === this.engine.last_official_move.id) {
                    if (this.engine.cur_move.passed() && this.engine.handicapMovesLeft() <= 0 && this.engine.cur_move.parent) {
                        this.setTitle(_("Your move - Opponent Passed"));
                        if (this.last_move && this.last_move.x >= 0) {
                            this.drawSquare(this.last_move.x, this.last_move.y);
                        }
                    } else {
                        this.setTitle(_("Your move"));
                    }
                    if (this.engine.cur_move.id === this.engine.last_official_move.id && this.mode === "play") {
                        this.emit("state_text", {title: _("Your Move")});
                    }
                } else {
                    let color = this.engine.playerColor(this.engine.playerToMove());
                    if (this.mode === "edit" && this.edit_color) {
                        color = this.edit_color;
                    }

                    let title;
                    if (color === "black") {
                        title = _("Black to move");
                    } else {
                        title = _("White to move");
                    }
                    this.setTitle(title);
                    if (this.engine.cur_move.id === this.engine.last_official_move.id && this.mode === "play") {
                        this.emit("state_text", {title: title, show_moves_made_count: true});
                    }
                }
                break;

            case "stone removal":
                this.setTitle(_("Stone Removal"));
                this.emit("state_text", {title: _("Stone Removal Phase")});
                break;

            case "finished":
                this.setTitle(_("Game Finished"));
                this.emit("state_text", {title: _("Game Finished")});
                break;

            default:
                this.setTitle(this.engine.phase);
                break;
        }
    } /* }}} */
    private disableStonePlacement() { /* {{{ */
        this.stone_placement_enabled = false;
        if (this.__last_pt && this.__last_pt.valid) {
            this.drawSquare(this.__last_pt.i, this.__last_pt.j);
        }
    } /* }}} */
    private enableStonePlacement() { /* {{{ */
        if (this.stone_placement_enabled) {
            this.disableStonePlacement();
        }

        if (this.engine.phase === "play" || (this.engine.phase === "finished" && this.mode === "analyze")) {
            let color = this.engine.playerColor(this.engine.playerToMove());
            if (this.mode === "edit" && this.edit_color) {
                color = this.edit_color;
            }
        }

        this.stone_placement_enabled = true;
        if (this.__last_pt && this.__last_pt.valid) {
            this.drawSquare(this.__last_pt.i, this.__last_pt.j);
        }
    } /* }}} */
    public showFirst() { /* {{{ */
        this.engine.jumpTo(this.engine.move_tree);
        this.updateTitleAndStonePlacement();
        this.emit("update");
    } /* }}} */
    public showPrevious(dont_update_display?) { /* {{{ */
        if (this.mode === "conditional") {
            if (this.conditional_path.length >= 2) {
                let prev_path = this.conditional_path.substr(0, this.conditional_path.length - 2);
                this.jumpToLastOfficialMove();
                this.followConditionalPath(prev_path);
            }
        } else {
            if (this.move_selected) {
                this.jumpToLastOfficialMove();
                return;
            }

            this.engine.showPrevious();
        }

        if (!dont_update_display) {
            this.updateTitleAndStonePlacement();
            this.emit("update");
        }
    } /* }}} */
    public showNext(dont_update_display?) { /* {{{ */
        if (this.mode === "conditional") {
            if (this.currently_my_cmove) {
                if (this.current_cmove.move != null) {
                    this.followConditionalPath(this.current_cmove.move);
                }
            } else {
                for (let ch in this.current_cmove.children) {
                    this.followConditionalPath(ch);
                    break;
                }
            }
        } else {
            if (this.move_selected) {
                return;
            }
            this.engine.showNext();
        }

        if (!dont_update_display) {
            this.updateTitleAndStonePlacement();
            this.emit("update");
        }
    } /* }}} */
    public prevSibling() { /* {{{ */
        let sibling = this.engine.cur_move.prevSibling();
        if (sibling) {
            this.engine.jumpTo(sibling);
            this.emit("update");
        }
    } /* }}} */
    public nextSibling() { /* {{{ */
        let sibling = this.engine.cur_move.nextSibling();
        if (sibling) {
            this.engine.jumpTo(sibling);
            this.emit("update");
        }
    } /* }}} */
    public deleteBranch() { /* {{{ */
        if (!this.engine.cur_move.trunk) {
            if (this.isPlayerController()) {
                this.syncReviewMove({"delete": 1});
            }
            this.engine.deleteCurMove();
            this.emit("update");
            this.redrawMoveTree();
        }
    } /* }}} */

    public jumpToLastOfficialMove() { /* {{{ */
        this.move_selected = false;
        this.engine.jumpToLastOfficialMove();
        this.updateTitleAndStonePlacement();

        this.conditional_path = "";
        this.currently_my_cmove = false;
        if (this.mode === "conditional") {
            this.current_cmove = this.conditional_tree;
        }

        this.emit("update");
    } /* }}} */
    private setLastOfficialMove() { /* {{{ */
        this.engine.setLastOfficialMove();
        this.updateTitleAndStonePlacement();
    } /* }}} */
    private isLastOfficialMove() { /* {{{ */
        return this.engine.isLastOfficialMove();
    } /* }}} */

    public updateTitleAndStonePlacement() { /* {{{ */
        this.updatePlayerToMoveTitle();

        if (this.engine.phase === "stone removal" || this.scoring_mode) {
            this.enableStonePlacement();
        }
        else if (this.engine.phase === "play") {
            switch (this.mode) {
                case "play":
                    if (this.isLastOfficialMove() && this.engine.playerToMove() === this.player_id) {
                        this.enableStonePlacement();
                    } else {
                        this.disableStonePlacement();
                    }
                    break;

                case "analyze":
                    this.disableStonePlacement();
                    this.enableStonePlacement();
                    break;

                case "conditional":
                    this.disableStonePlacement();
                    this.enableStonePlacement();
                    break;

                case "edit":
                    this.disableStonePlacement();
                    this.enableStonePlacement();
                    break;
            }
        }
        else if (this.engine.phase === "finished") {
            this.disableStonePlacement();
            if (this.mode === "analyze") {
                this.enableStonePlacement();
            }
        }
    } /* }}} */

    public setConditionalTree(conditional_tree) { /* {{{ */
        if (conditional_tree == null) {
            conditional_tree = new GoConditionalMove(null, null);
        }
        this.conditional_tree = conditional_tree;
        this.current_cmove = conditional_tree;

        this.emit("update");
    } /* }}} */
    public followConditionalPath(movepath) { /* {{{ */
        let moves = this.engine.decodeMoves(movepath);
        for (let i = 0; i < moves.length; ++i) {
            this.engine.place(moves[i].x, moves[i].y);
            this.followConditionalSegment(moves[i].x, moves[i].y);
        }
    } /* }}} */
    private followConditionalSegment(x, y) { /* {{{ */
        let mv = encodeMove(x, y);
        this.conditional_path += mv;

        if (this.currently_my_cmove) {
            if (mv !== this.current_cmove.move) {
                this.current_cmove.children = {};
            }
            this.current_cmove.move = mv;
        } else {
            let cmove = null;
            if (mv in this.current_cmove.children) {
                cmove = this.current_cmove.children[mv];
            } else {
                cmove = new GoConditionalMove(null, this.current_cmove);
                this.current_cmove.children[mv] = cmove;
            }
            this.current_cmove = cmove;
        }

        this.currently_my_cmove = !this.currently_my_cmove;
    } /* }}} */
    private deleteConditionalSegment(x, y) { /* {{{ */
        this.conditional_path += encodeMove(x, y);

        if (this.currently_my_cmove) {
            this.current_cmove.children = {};
            this.current_cmove.move = null;
            let cur = this.current_cmove;
            let parent = cur.parent;
            this.current_cmove = parent;
            for (let mv in parent.children) {
                if (parent.children[mv] === cur) {
                    delete parent.children[mv];
                }
            }
        } else {
            console.error("deleteConditionalSegment called on other player's move, which doesn't make sense");
            return;
            /*
            -- actually this code may work below, we just don't have a ui to drive it for testing so we throw an error

            let cmove = null;
            if (mv in this.current_cmove.children) {
                delete this.current_cmove.children[mv];
            }
            */
        }

        this.currently_my_cmove = !this.currently_my_cmove;
    } /* }}} */
    public deleteConditionalPath(movepath) { /* {{{ */
        let moves = this.engine.decodeMoves(movepath);
        if (moves.length) {
            for (let i = 0; i < moves.length - 1; ++i) {
                if (i !== moves.length - 2) {
                    this.engine.place(moves[i].x, moves[i].y);
                }
                this.followConditionalSegment(moves[i].x, moves[i].y);
            }
            this.deleteConditionalSegment(moves[moves.length - 1].x, moves[moves.length - 1].y);
        }
    } /* }}} */
    public getCurrentConditionalPath() { /* {{{ */
        return this.conditional_path;
    } /* }}} */
    public saveConditionalMoves() { /* {{{ */
        this.socket.send("game/conditional_moves/set", {
            "auth"        : this.config.auth,
            "move_number" : this.engine.getCurrentMoveNumber(),
            "game_id"     : this.config.game_id,
            "player_id"   : this.config.player_id,
            "cmoves"      : this.conditional_tree.encode()
        });
    } /* }}} */

    public setModeDeferred(mode) {  /* {{{ */
        setTimeout(() => { this.setMode(mode); }, 1);
    } /* }}} */
    public setMode(mode, dont_jump_to_official_move?) { /* {{{ */
        if (mode === "conditional" && this.player_id === this.engine.playerToMove()) {
            /* this shouldn't ever get called, but incase we screw up.. */
            swal("Can't enter conditional move planning when it's your turn");
            return false;
        }

        this.setSubmit(null);

        if (["play", "analyze", "conditional", "edit", "score estimation", "pattern search", "puzzle"].indexOf(mode) === -1) {
            swal("Invalid mode for Goban: " + mode);
            return;
        }

        if (this.engine.config.disable_analysis && this.engine.phase !== "finished" && (mode === "analyze" || mode === "conditional")) {
            swal("Unable to enter " + mode + " mode");
            return;
        }

        if (mode === "conditional") {
            this.conditional_starting_color = this.engine.playerColor();
        }

        let redraw = true;

        if (this.mode === "play" || this.mode === "finished") {
            this.has_new_official_move = false;
        }

        this.mode = mode;
        if (!dont_jump_to_official_move) {
            this.jumpToLastOfficialMove();
        }

        if (this.mode !== "analyze" || this.analyze_tool !== "draw") {
            this.detachPenCanvas();
        } else {
            this.attachPenCanvas();
        }

        if (mode === "play" && this.engine.phase !== "finished") {
            this.engine.cur_move.clearMarks();
            redraw = true;
        }

        if (redraw) {
            this.clearAnalysisDrawing();
            this.redraw();
        }
        this.updateTitleAndStonePlacement();

        return true;
    } /* }}} */
    public resign() { /* {{{ */
        this.socket.send("game/resign", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */
    private sendPendingResignation() { /* {{{ */
        window["comm_socket"].send("game/delayed_resign", {
            "auth": this.config.auth,
            "game_id": this.config.game_id
        });
    } /* }}} */
    private clearPendingResignation() { /* {{{ */
        window["comm_socket"].send("game/clear_delayed_resign", {
            "auth": this.config.auth,
            "game_id": this.config.game_id
        });
    } /* }}} */
    public cancelGame() { /* {{{ */
        this.socket.send("game/cancel", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */
    private annul() { /* {{{ */
        this.socket.send("game/annul", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */
    public pass() { /* {{{ */
        this.engine.place(-1, -1);
        if (this.mode === "play") {
            this.sendMove({
                "auth": this.config.auth,
                "game_id": this.config.game_id,
                "player_id": this.config.player_id,
                "move": encodeMove(-1, -1)
            });
        } else {
            this.syncReviewMove();
            if (this.move_tree_div) {
                this.redrawMoveTree();
            }
        }
    } /* }}} */
    public requestUndo() { /* {{{ */
        this.socket.send("game/undo/request", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id,
            "move_number": this.engine.getCurrentMoveNumber()
        });
    } /* }}} */
    public acceptUndo() { /* {{{ */
        this.socket.send("game/undo/accept", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id,
            "move_number": this.engine.getCurrentMoveNumber()
        });
    } /* }}} */
    public pauseGame() { /* {{{ */
        this.socket.send("game/pause", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */
    public resumeGame() { /* {{{ */
        this.socket.send("game/resume", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */

    public acceptRemovedStones() { /* {{{ */
        let stones = this.engine.getStoneRemovalString();
        this.engine.players[this.engine.playerColor(this.config.player_id)].accepted_stones = stones;
        this.socket.send("game/removed_stones/accept", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id,
            "stones": stones,
            "strict_seki_mode": this.engine.strict_seki_mode
        });
    } /* }}} */
    public rejectRemovedStones() { /* {{{ */
        let stones = this.engine.getStoneRemovalString();
        this.engine.players[this.engine.playerColor(this.config.player_id)].accepted_stones = null;
        this.socket.send("game/removed_stones/reject", {
            "auth": this.config.auth,
            "game_id": this.config.game_id,
            "player_id": this.config.player_id
        });
    } /* }}} */
    public setEditColor(color) { /* {{{ */
        this.edit_color = color;
        this.updateTitleAndStonePlacement();
    } /* }}} */
    private editSettings(changes) { /* {{{ */
        let need_to_change = false;
        for (let k in changes) {
            if (this.engine[k] !== changes[k]) {
                need_to_change = true;
                break;
            }
        }

        if (need_to_change) {
            /* this will send back a gamedata blob which will in turn update our own state */
            this.socket.send("editSettings", {
                "auth": this.config.auth,
                "game_id": this.config.game_id,
                "player_id": this.config.player_id,
                "changes": changes
            });
        }
    } /* }}} */
    private playMovementSound() { /* {{{ */
        if (this.last_sound_played_for_a_stone_placement === this.engine.cur_move.x + "," + this.engine.cur_move.y) {
            return;
        }
        this.last_sound_played_for_a_stone_placement = this.last_sound_played = this.engine.cur_move.x + "," + this.engine.cur_move.y;

        let idx;
        do {
            idx = Math.round(Math.random() * 10000) % 5; /* 5 === number of stone sounds */
        } while (idx === this.last_stone_sound);
        this.last_stone_sound = idx;

        if (this.on_game_screen) {
            if (this.last_sound_played_for_a_stone_placement === "-1,-1") {
                sfx.play("pass");
            } else {
                sfx.play("stone-" + (idx + 1));
            }
        }
    } /* }}} */
    private setState(state) { /* {{{ */
        if ((this.game_type === "review" || this.game_type === "demo") && this.engine) {
            this.drawPenMarks(this.engine.cur_move.pen_marks);
            if (this.isPlayerController() && this.connectToReviewSent) {
                this.syncReviewMove();
            }
        }

        this.setLabelCharacterFromMarks();
        this.markDirty();
    } /* }}} */
    private getState() { /* {{{ */
        /* This is a callback that gets called by GoEngine.getState to store board state in its state stack */
        let ret = { };
        return ret;
    } /* }}} */
    public giveReviewControl(player_id: number) { /* {{{ */
        this.syncReviewMove({ "controller": player_id });
    } /* }}} */
    private giveVoice(player_id: number) { /* {{{ */
        this.socket.send("review/voice/give", {
            "review_id": this.review_id,
            "voice_player": {
                "id": player_id,
            }
        });
    } /* }}} */
    private removeVoice(player_id: number) { /* {{{ */
        this.socket.send("review/voice/remove", {
            "review_id": this.review_id,
            "voice_player": {
                "id": player_id,
            }
        });
    } /* }}} */

    public setMarks(marks, dont_draw?) { /* {{{ */
        for (let key in marks) {
            console.log(key);
            let locations = this.engine.decodeMoves(marks[key]);
            console.log(locations);
            for (let i = 0; i < locations.length; ++i) {
                let pt = locations[i];
                this.setMark(pt.x, pt.y, key, dont_draw);
            }
        }
    } /* }}} */

    private setLetterMark(x, y, mark: string, drawSquare?) {
        this.engine.cur_move.getMarks(x, y).letter = mark;
        if (drawSquare) { this.drawSquare(x, y);  }
    }
    public setCustomMark(x, y, mark: string, drawSquare?) {
        this.engine.cur_move.getMarks(x, y)[mark] = true;
        if (drawSquare) { this.drawSquare(x, y); }
    }
    public deleteCustomMark(x, y, mark: string, drawSquare?) {
        delete this.engine.cur_move.getMarks(x, y)[mark];
        if (drawSquare) { this.drawSquare(x, y); }
    }

    private setMark(x, y, mark, dont_draw) { /* {{{ */
        try {
            if (x >= 0 && y >= 0) {
                if (typeof(mark) === "number") {
                    mark = "" + mark;
                }

                if (mark.length <= 3) {
                    this.setLetterMark(x, y, mark, !dont_draw);
                } else {
                    this.setCustomMark(x, y, mark, !dont_draw);
                }
            }
        } catch (e) {
            console.error(e.stack);
        }
    } /* }}} */
    private setTransientMark(x, y, mark, dont_draw) { /* {{{ */
        try {
            if (x >= 0 && y >= 0) {
                if (typeof(mark) === "number") {
                    mark = "" + mark;
                }

                if (mark.length <= 3) {
                    this.engine.cur_move.getMarks(x, y).transient_letter = mark;
                } else {
                    this.engine.cur_move.getMarks(x, y)["transient_" + mark] = true;
                }

                if (!dont_draw) {
                    this.drawSquare(x, y);
                }
            }
        } catch (e) {
            console.error(e.stack);
        }
    } /* }}} */
    public getMarks(x, y) { /* {{{ */
        if (this.engine && this.engine.cur_move) {
            return this.engine.cur_move.getMarks(x, y);
        }
        return {};
    } /* }}} */
    private toggleMark(x, y, mark, force_label?, force_put?) { /* {{{ */
        let ret = true;
        let marktypes = ["letter", "circle", "square", "triangle", "cross"];
        if (typeof(mark) === "number") {
            mark = "" + mark;
        }
        let marks = this.getMarks(x, y);

        let clearMarks = () => {
            for (let i = 0; i < marktypes.length; ++i) {
                delete marks[marktypes[i]];
            }
        };

        if (force_label || /^[a-zA-Z0-9]{1,2}$/.test(mark)) {
            if (!force_put && "letter" in marks) {
                clearMarks();
                ret = false;
            } else {
                clearMarks();
                marks.letter = mark;
            }
        } else {
            if (!force_put && mark in marks) {
                clearMarks();
                ret = false;
            } else {
                clearMarks();
                this.getMarks(x, y)[mark] = true;
            }
        }
        this.drawSquare(x, y);
        return ret;
    } /* }}} */
    private incrementLabelCharacter() { /* {{{ */
        let seq1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        if (parseInt(this.label_character)) {
            this.label_character = "" + (parseInt(this.label_character) + 1);
        } else if (seq1.indexOf(this.label_character) !== -1) {
            this.label_character = seq1[(seq1.indexOf(this.label_character) + 1) % seq1.length];
        }
    } /* }}} */
    private setLabelCharacterFromMarks(set_override?) { /* {{{ */
        if (set_override === "letters" || /^[a-zA-Z]$/.test(this.label_character)) {
            let seq1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            let idx = -1;

            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    let ch = this.getMarks(x, y).letter;
                    idx = Math.max(idx, seq1.indexOf(ch));
                }
            }

            this.label_character = seq1[idx + 1 % seq1.length];
        }
        if (set_override === "numbers" || /^[0-9]+$/.test(this.label_character)) {
            let val = 0;

            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    if (parseInt(this.getMarks(x, y).letter)) {
                        val = Math.max(val, parseInt(this.getMarks(x, y).letter));
                    }
                }
            }

            this.label_character = "" + (val + 1);
        }
    } /* }}} */
    public setLabelCharacter(ch) { /* {{{ */
        this.label_character = ch;
        if (this.last_hover_square) {
            this.drawSquare(this.last_hover_square.x, this.last_hover_square.y);
        }
    } /* }}} */
    public clearMark(x, y, mark) { /* {{{ */
        try {
            if (typeof(mark) === "number") {
                mark = "" + mark;
            }

            if (/^[a-zA-Z0-9]{1,2}$/.test(mark)) {
                this.getMarks(x, y).letter = "";
            } else {
                this.getMarks(x, y)[mark] = false;
            }
            this.drawSquare(x, y);
        } catch (e) {
            console.error(e);
        }
    } /* }}} */
    private clearTransientMark(x, y, mark) { /* {{{ */
        try {
            if (typeof(mark) === "number") {
                mark = "" + mark;
            }

            if (/^[a-zA-Z0-9]{1,2}$/.test(mark)) {
                this.getMarks(x, y).transient_letter = "";
            } else {
                this.getMarks(x, y)["transient_" + mark] = false;
            }
            this.drawSquare(x, y);
        } catch (e) {
            console.error(e);
        }
    } /* }}} */
    private heatmapUpdated() { /* {{{ */
        this.redraw(true);
    } /* }}} */
    private updateScoreEstimation() { /* {{{ */
        if (this.score_estimate) {
            let est = this.score_estimate.estimated_hard_score - this.engine.komi;
            let color;
            if (est > 0) { color = _("Black"); }
            else         { color = _("White"); }
            $("#score-estimation").text(interpolate(pgettext("Score estimation result", "Estimation: %s by %s"), [color, Math.abs(est).toFixed(1)]));
        }
    } /* }}} */
    public autoScore() { /* {{{ */
        try {
            if (!window["user"] || !this.on_game_screen  || !this.engine || (window["user"].id !== this.engine.black_player_id && window["user"].id !== this.engine.white_player_id)) {
                return;
            }
        } catch (e) {
            console.error(e.stack);
            return;
        }

        this.auto_scoring_done = true;

        this.message(_("Processing..."), -1);
        let do_score_estimation = () => {
            let se = new ScoreEstimator(null);
            se.init(this.engine, AUTOSCORE_TRIALS, AUTOSCORE_TOLERANCE);
            //console.error(se.area);

            let current_removed = this.engine.getStoneRemovalString();
            let new_removed = se.getProbablyDead();

            this.engine.clearRemoved();
            let moves = this.engine.decodeMoves(new_removed);
            for (let i = 0; i < moves.length; ++i) {
                this.engine.setRemoved(moves[i].x, moves[i].y, true);
            }

            this.updateTitleAndStonePlacement();
            this.emit("update");

            this.socket.send("game/removed_stones/set", {
                "auth"        : this.config.auth,
                "game_id"     : this.config.game_id,
                "player_id"   : this.config.player_id,
                "removed"     : false,
                "stones"      : current_removed
            });
            this.socket.send("game/removed_stones/set", {
                "auth"        : this.config.auth,
                "game_id"     : this.config.game_id,
                "player_id"   : this.config.player_id,
                "removed"     : true,
                "stones"      : new_removed
            });

            this.clearMessage();
        };


        setTimeout(() => {
            init_score_estimator().then(do_score_estimation);
        }, 10);
    } /* }}} */
    private sendMove(mv) { /* {{{ */
        let timeout = setTimeout(() => {
            this.message(_("Error submitting move"), -1);

            let second_try_timeout = setTimeout(() => {
                window.location.reload();
            }, 4000);
            this.socket.send("game/move", mv, () => {
                let confirmation_time = new Date();
                clearTimeout(second_try_timeout);
                this.clearMessage();
            });

        }, 4000);
        this.socket.send("game/move", mv, () => {
            let confirmation_time = new Date();
            clearTimeout(timeout);
            this.clearMessage();
        });
    } /* }}} */

    public setGameClock(clock) { /* {{{ */
        //console.log('Setting clock: ', clock);
        if (!this.white_clock || !this.black_clock) { return; }

        this.last_clock = clock;
        let white_clock = $(this.white_clock);
        let black_clock = $(this.black_clock);
        let _white_clock = white_clock;
        let _black_clock = black_clock;

        if (white_clock.hasClass("in-game-clock")) {
            white_clock = white_clock.children(".full-time");
        }
        if (black_clock.hasClass("in-game-clock")) {
            black_clock = black_clock.children(".full-time");
        }

        if (clock == null) {
            white_clock.children(".clock-component").text("");
            black_clock.children(".clock-component").text("");
            _black_clock.find(".main-time").empty();
            _white_clock.find(".main-time").empty();
            _white_clock.find(".periods").empty();
            _white_clock.find(".period-time").empty();
            _black_clock.find(".periods").empty();
            _black_clock.find(".period-time").empty();
            return;
        }

        if ("pause" in clock) {
            if (clock.pause.paused) {
                this.engine.paused_since = clock.pause.paused_since;
                this.engine.pause_control = clock.pause.pause_control;

                /* correct for when we used to store paused_since in terms of seconds instead of ms */
                if (this.engine.paused_since < 2000000000) {
                    this.engine.paused_since *= 1000;
                }
            } else {
                delete this.engine.paused_since;
                delete this.engine.pause_control;
            }
        }

        let now;
        let use_short_format = this.config.use_short_format_clock;
        //let now_delta = Date.now() - clock.now;

        this.last_sound_played = null;

        let formatTime = (clock_div, time, base_time: number, player_id?: number):number => { /* {{{ */
            let next_clock_update = 60000;
            let ms;
            let time_suffix = "";
            let periods_left = 0;

            /*** New game clock displays ***/
            let main_time_div       = null;
            let periods_div         = null;
            let period_time_div     = null;
            let overtime_div        = null;
            let overtime_parent_div = null;

            if (clock_div.hasClass("in-game-clock")) {
                main_time_div = clock_div.find(".main-time");
                if (clock.start_mode) {
                    main_time_div.addClass("start_clock");
                } else {
                    main_time_div.removeClass("start_clock");
                }
                periods_div = clock_div.find(".periods");
                period_time_div = clock_div.find(".period-time");
                overtime_div = clock_div.find(".overtime");
                overtime_parent_div = overtime_div.parent();
                clock_div = clock_div.children(".full-time");
            }


            if (typeof(time) === "object") {
                ms = (base_time + (time.thinking_time) * 1000) - now;
                if ("moves_left" in time) { /* canadian */
                    if ("block_time" in time) {
                        if (time.moves_left) {
                            time_suffix = "<span class='time_suffix'> + " + shortDurationString(time.block_time) + "/" + time.moves_left + "</span>";
                        }
                    }
                    if (time.thinking_time > 0) {
                        periods_left = 1;
                    }
                    if (ms < 0 || (time.thinking_time === 0 && "block_time" in time)) {
                        if (overtime_parent_div) {
                            overtime_parent_div.addClass("in-overtime");
                        }
                        ms = (base_time + (time.thinking_time + time.block_time) * 1000) - now;
                        if (time.moves_left) {
                            time_suffix = "<span class='time_suffix'>/ " + time.moves_left + "</span>";
                        }
                    }

                    let moves_done = this.engine.time_control.stones_per_period - time.moves_left;
                    if (periods_div) {
                        periods_div.text(moves_done + " / " + this.engine.time_control.stones_per_period);
                    }

                    if (period_time_div) {
                        period_time_div.text(shortDurationString(this.engine.time_control.period_time));
                    }
                }
                if ("periods" in time) { /* byo yomi */
                    let period_offset = 0;
                    if (ms < 0 || time.thinking_time === 0) {
                        if (overtime_parent_div) {
                            overtime_parent_div.addClass("in-overtime");
                        }

                        period_offset = Math.floor((-ms / 1000) / time.period_time);
                        if (period_offset < 0) {
                            period_offset = 0;
                        }

                        while (ms < 0) {
                            ms += time.period_time * 1000;
                        }

                        if (player_id !== clock.current_player) {
                            ms = time.period_time * 1000;
                        }
                        periods_left = ((time.periods - period_offset));
                        if (((time.periods - period_offset) - 1) > 0) {
                            time_suffix = "<span class='time_suffix'>+" + periods_left + "x" + (shortDurationString(time.period_time)).trim() + "</span>";
                            if (period_time_div) {
                                period_time_div.text(shortDurationString(time.period_time));
                            }
                        }
                        if (((time.periods - period_offset) - 1) < 0) {
                            ms = 0;
                        }
                    } else {
                        periods_left = time.periods;
                        time_suffix = "<span class='time_suffix'>+" + (time.periods) + "x" + (shortDurationString(time.period_time)).trim() + "</span>";
                        if (period_time_div) {
                            period_time_div.text(shortDurationString(time.period_time));
                        }
                    }

                    if (periods_div) {
                        periods_div.text(periods_left);
                    }
                }
            } else {
                /* time is just a raw number */
                ms = time - now;
            }

            let seconds = Math.ceil((ms - 1) / 1000);
            let days = Math.floor(seconds / 86400); seconds -= days * 86400;
            let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
            let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;

            let html = "";
            let cls = "plenty_of_time";
            if (ms <= 0 || isNaN(ms)) {
                next_clock_update = 0;
                cls = "out_of_time";
                html = "0.0";
            } else if (days > 1) {
                html = plurality(days, _("Day"), _("Days")) + " " + (hours ? plurality(hours, _("Hour"), _("Hours")) : "");
                next_clock_update = 60000;
            } else if (hours || days === 1) {
                next_clock_update = 60000;
                if (days === 1) {
                    hours += 24;
                }
                html = days === 0 ? interpolate(pgettext("Game clock: Hours and minutes", "%sh %sm"), [hours, minutes]) : interpolate(pgettext("Game clock: hours", "%sh"), [hours]);
            } else {
                next_clock_update = ms % 1000; /* once per second, right after the clock rolls over */
                if (next_clock_update === 0) {
                    next_clock_update = 1000;
                }
                if (this.engine.paused_since) {
                    next_clock_update = 60000;
                }
                html = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
                if (minutes === 0 && seconds <= 10) {
                    if (seconds % 2 === 0) {
                        cls += " low_time";
                    }

                    let sound_to_play = null;

                    if (this.on_game_screen && player_id) {
                        sound_to_play = seconds;
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

                        if (sound_to_play && window["user"].id === clock.current_player && player_id === window["user"].id) {
                            if (this.last_sound_played !== sound_to_play) {
                                this.last_sound_played = sound_to_play;

                                if (this.getShouldPlayVoiceCountdown()) {
                                    sfx.play(sound_to_play);
                                }
                            }
                        }
                    }
                }
            }

            if (clock.start_mode) {
                cls += " start_clock";
            }
            if (this.engine.paused_since) {
                cls += " paused";
            }

            if (main_time_div) {
                main_time_div.html(html);
            }
            clock_div.html(`<span class='clock ${cls}'>${html}<span>${(use_short_format ? "" : time_suffix)}`);
            return next_clock_update;
        }; /* }}} */

        let updateTime = () => { /* {{{ */
            now = Date.now();

            /* correct for when we used to store paused_since in terms of seconds instead of ms */
            if (this.engine.paused_since > 0 && this.engine.paused_since < 2000000000) {
                this.engine.paused_since *= 1000;
            }

            let now_delta = this.getClockDrift();
            let lag = this.getNetworkLatency();

            if (this.engine.phase !== "play" && this.engine.phase !== "stone removal") {
                white_clock.empty();
                black_clock.empty();
                return;
            }

            black_clock.empty();
            white_clock.empty();
            let next_clock_update = 1000;

            if (clock.start_mode) {
                next_clock_update = formatTime(clock.black_player_id === clock.current_player ? _black_clock : _white_clock, clock.expiration + now_delta, clock.last_move);
            } else if (clock.stone_removal_mode) {
                if (this.stone_removal_clock) {
                    let sr_clock = $(this.stone_removal_clock);
                    formatTime(sr_clock, clock.stone_removal_expiration + now_delta, clock.now);
                }
            } else {
                let white_pause_text = null;
                let black_pause_text = null;

                if (this.engine.paused_since) {
                    white_pause_text = _("Paused");
                    black_pause_text = _("Paused");
                    if (this.engine.pause_control) {
                        let pause_control = this.engine.pause_control;
                        if ("weekend" in pause_control) {
                            black_pause_text = _("Weekend");
                            white_pause_text = _("Weekend");
                        }
                        if ("system" in pause_control) {
                            black_pause_text = _("Paused by Server");
                            white_pause_text = _("Paused by Server");
                        }
                        if (("vacation-" + clock.black_player_id) in pause_control) {
                            black_pause_text = _("Vacation");
                        }
                        if (("vacation-" + clock.white_player_id) in pause_control) {
                            white_pause_text = _("Vacation");
                        }
                    }
                }
                if (white_pause_text !== this.white_pause_text || black_pause_text !== this.black_pause_text) {
                    this.white_pause_text = white_pause_text;
                    this.black_pause_text = black_pause_text;
                    this.emit("pause-text", {white_pause_text: white_pause_text, black_pause_text: black_pause_text});
                }

                let white_base_time;
                let black_base_time;
                let pause_delta = clock.pause_delta || 0;
                if (this.engine.paused_since) {
                    white_base_time = (clock.current_player === clock.white_player_id ? (now - pause_delta)  - lag : now);
                    black_base_time = (clock.current_player === clock.black_player_id ? (now - pause_delta)  - lag : now);
                } else {
                    white_base_time = (clock.current_player === clock.white_player_id ? (clock.last_move + now_delta) - lag : now);
                    black_base_time = (clock.current_player === clock.black_player_id ? (clock.last_move + now_delta) - lag : now);
                }

                if (clock.white_time) {
                    let white_next_update = formatTime(_white_clock, clock.white_time, white_base_time, clock.white_player_id);
                    if (clock.current_player === clock.white_player_id) {
                        next_clock_update = white_next_update;
                    }
                }
                if (clock.black_time) {
                    let black_next_update = formatTime(_black_clock, clock.black_time, black_base_time, clock.black_player_id);
                    if (clock.current_player === clock.black_player_id) {
                        next_clock_update = black_next_update;
                    }
                }
            }

            if (this.engine.phase === "stone removal") {
                next_clock_update = 1000;
            }

            if (next_clock_update) {
                if (this.__clock_timer) {
                    clearTimeout(this.__clock_timer);
                    this.__clock_timer = null;
                }
                this.__clock_timer = setTimeout(updateTime, next_clock_update);
            }
        }; /* }}} */

        try {
            updateTime();
        } catch (e) {
            console.error(e);
        }
    } /* }}} */
    public syncReviewMove(msg_override?, node_text?) { /* {{{ */
        if (this.review_id && (this.isPlayerController() || (this.isPlayerOwner() && msg_override && msg_override.controller)) && this.done_loading_review) {
            if (this.isInPushedAnalysis()) {
                return;
            }

            let diff = this.engine.getMoveDiff();
            this.engine.setAsCurrentReviewMove();

            let msg;

            if (!msg_override) {
                let marks = {};
                let mark_ct = 0;
                for (let y = 0; y < this.height; ++y) {
                    for (let x = 0; x < this.width; ++x) {
                        let pos = this.getMarks(x, y);
                        let marktypes = ["letter", "triangle", "circle", "square", "cross"];
                        for (let i = 0; i < marktypes.length; ++i) {
                            if (marktypes[i] in pos && pos[marktypes[i]]) {
                                let markkey = marktypes[i] === "letter" ? pos.letter : marktypes[i];
                                if (!(markkey in marks)) {
                                    marks[markkey] = "";
                                }
                                marks[markkey] += encodeMove(x, y);
                                ++mark_ct;
                            }
                        }
                    }
                }

                if (!node_text && node_text !== "") {
                    node_text = this.engine.cur_move.text || "";
                }

                msg = {
                    "f": diff.from,
                    "t": node_text,
                    "m": diff.moves,
                    "k": marks,
                };
                let tmp = dup(msg);

                if (this.last_review_message.f === msg.f && this.last_review_message.m === msg.m) {
                    delete msg["f"];
                    delete msg["m"];

                    let txt_idx = node_text.indexOf(this.engine.cur_move.text || "");
                    if (txt_idx === 0) {
                        delete msg["t"];
                        if (node_text !== this.engine.cur_move.text) {
                            msg["t+"] = node_text.substr(this.engine.cur_move.text.length);
                        }
                    }

                    if (deepEqual(marks, this.last_review_message.k)) {
                        delete msg["k"];
                    }
                }
                this.engine.cur_move.text = node_text;
                this.last_review_message = tmp;

                if (Object.keys(msg).length === 0) {
                    return;
                }
            } else {
                msg = msg_override;
                if (msg.clearpen) {
                    this.engine.cur_move.pen_marks = [];
                }
            }

            msg.auth = this.config.auth;
            msg.review_id = this.review_id;
            msg.player_id = this.player_id;
            msg.username = this.config.username;

            this.socket.send("review/append", msg);
        }
    } /* }}} */
    public setScoringMode(tf):MoveTree { /* {{{ */
        this.scoring_mode = tf;
        let ret = this.engine.cur_move;

        if (this.scoring_mode) {
            this.message(_("Processing..."), -1);
            this.setMode("score estimation", true);
            this.clearMessage();
            this.score_estimate = this.engine.estimateScore(SCORE_ESTIMATION_TRIALS, SCORE_ESTIMATION_TOLERANCE);
            this.enableStonePlacement();
            this.redraw(true);
            this.emit("update");
        } else {
            this.setMode("play");
            this.redraw(true);
        }

        return ret;
    } /* }}} */
    protected getShouldPlayVoiceCountdown():boolean {{{
        return false;
    }}}
    /**
     * Returns true if the user has signed in and if the signed in user is a participating player in this game
     * (and not only spectating), that is, if they are either white or black.
     */
    public isParticipatingPlayer():boolean { /* {{{ */
        return this.engine.black_player_id === this.player_id ||
               this.engine.white_player_id === this.player_id;
    } /* }}} */
}
function plurality(num, single, plural) {{{
    if (num > 0) {
        if (num === 1) {
            return num + " " + single;
        }
        return num + " " + plural;
    }
    return "";
}}}
function uuid(): string { /* {{{ */
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = Math.random() * 16 | 0;
        let v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
} /* }}} */
