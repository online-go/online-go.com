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
import { Link, useParams } from "react-router-dom";
import { browserHistory } from "ogsHistory";
import { _, ngettext, pgettext, interpolate, current_language } from "translate";
import { popover } from "popover";
import { post, get, api1, del } from "requests";
import { KBShortcut } from "KBShortcut";
import { UIPush } from "UIPush";
import { errorAlerter, ignore, getOutcomeTranslation } from "misc";
import { challengeFromBoardPosition, challengeRematch } from "ChallengeModal";
import {
    Goban,
    GobanCanvas,
    GobanCanvasConfig,
    //GoEngine,
    GoMath,
    MoveTree,
    AudioClockEvent,
    Score,
    GoEnginePhase,
    GobanModes,
    GoEngineRules,
    AnalysisTool,
    JGOFPlayerSummary,
    JGOFNumericPlayerColor,
} from "goban";
import { isLiveGame } from "TimeControl";
import { get_network_latency, get_clock_drift } from "sockets";
import { Dock } from "Dock";
import { Player, setExtraActionCallback, PlayerDetails } from "Player";
import { Flag } from "Flag";
import * as player_cache from "player_cache";
import { icon_size_url } from "PlayerIcon";
import { notification_manager } from "Notifications";
import { PersistentElement } from "PersistentElement";
import { close_all_popovers } from "popover";
import { Resizable } from "Resizable";
import { ChatPresenceIndicator } from "ChatPresenceIndicator";
import { chat_manager, ChatChannelProxy } from "chat_manager";
import { openGameInfoModal } from "./GameInfoModal";
import { openGameLinkModal } from "./GameLinkModal";
import { openGameLogModal } from "./GameLogModal";
import { openACLModal } from "ACLModal";
import { sfx, SFXSprite, ValidSound } from "sfx";
import { AIReview } from "./AIReview";
import { GameChat, ChatMode } from "./GameChat";
import { CountDown } from "./CountDown";
import { toast } from "toast";
import { Clock } from "Clock";
import { JGOFClock } from "goban";
import { GameTimings } from "./GameTimings";
import { openReport } from "Report";
import { goban_view_mode, goban_view_squashed, ViewMode, shared_ip_with_player_map } from "./util";
import { game_control } from "./game_control";

import swal from "sweetalert2";

/*
interface GameParams {
    game_id?: string;
    review_id?: string;
    move_number?: string;
}
*/

const win = $(window);

export function Game(): JSX.Element {
    //const params = useParams<GameParams>();
    const params = useParams();

    const game_id = params.game_id ? parseInt(params.game_id) : 0;
    const review_id = params.review_id ? parseInt(params.review_id) : 0;

    /* Refs */
    const ref_goban_container = React.useRef<HTMLDivElement>();
    const ref_move_tree_container = React.useRef<HTMLElement>();
    const ladder_id = React.useRef<number>();
    const tournament_id = React.useRef<number>();
    const goban_div = React.useRef<HTMLDivElement | null>();
    const resize_debounce = React.useRef<any>();
    const stone_removal_accept_timeout = React.useRef<any>();
    const autoplay_timer = React.useRef<any>();
    const conditional_move_list = React.useRef<any[]>([]);
    const selected_conditional_move = React.useRef<any>();
    const chat_proxy = React.useRef<ChatChannelProxy>();
    const last_analysis_sent = React.useRef<any>();
    const orig_marks = React.useRef<any>(null);
    const showing_scores = React.useRef<boolean>(false);
    const on_refocus_title = React.useRef<string>("OGS");
    const last_move_viewed = React.useRef<number>(0);
    const conditional_move_tree = React.useRef<any>();
    const stashed_conditional_moves = React.useRef<any>();
    const volume_sound_debounce = React.useRef<any>();
    const copied_node = React.useRef<MoveTree>();
    const white_username = React.useRef<string>("White");
    const black_username = React.useRef<string>("Black");
    const return_url = React.useRef<string>(); // url to return to after a game is over
    //const return_url_debounce = React.useRef<boolean>(false);
    const goban = React.useRef<Goban>(null);

    /* State */
    const [view_mode, set_view_mode] = React.useState<ViewMode>(goban_view_mode());
    const [squashed, set_squashed] = React.useState<boolean>(goban_view_squashed());
    const [estimating_score, set_estimating_score] = React.useState<boolean>(false);
    const [analyze_pencil_color, set_analyze_pencil_color] = React.useState<string>("#004cff");
    const [show_submit, set_show_submit] = React.useState(false);
    const [user_is_player, set_user_is_player] = React.useState(false);
    const [zen_mode, set_zen_mode] = React.useState(false);
    const [autoplaying, set_autoplaying] = React.useState(false);
    const [portrait_tab, set_portrait_tab] = React.useState<"game" | "chat" | "dock">("game");
    const [review_list, set_review_list] = React.useState([]);
    const [selected_chat_log, set_selected_chat_log] = React.useState<ChatMode>("main");
    const [variation_name, set_variation_name] = React.useState("");
    const [strict_seki_mode, set_strict_seki_mode] = React.useState(false);
    const [volume, set_volume] = React.useState(sfx.getVolume("master"));
    const [historical_black, set_historical_black] = React.useState(null);
    const [historical_white, set_historical_white] = React.useState(null);
    const [annulled, set_annulled] = React.useState(false);
    const [black_auto_resign_expiration, set_black_auto_resign_expiration] = React.useState(null);
    const [white_auto_resign_expiration, set_white_auto_resign_expiration] = React.useState(null);
    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        preferences.get("ai-review-enabled"),
    );
    const [phase, set_phase] = React.useState<GoEnginePhase>();
    const [show_score_breakdown, set_show_score_breakdown] = React.useState(false);
    const [selected_ai_review_uuid, set_selected_ai_review_uuid] = React.useState(null);
    const [show_game_timing, set_show_game_timing] = React.useState(false);
    const [submitting_move, set_submitting_move] = React.useState(false);
    const [score, set_score] = React.useState<Score>();

    const [title, set_title] = React.useState<string>();
    const [paused, set_paused] = React.useState<boolean>();
    const [mode, set_mode] = React.useState<GobanModes>("play");
    const [move_text, set_move_text] = React.useState<string>();
    const [resign_mode, set_resign_mode] = React.useState<"cancel" | "resign">();
    const [resign_text, set_resign_text] = React.useState<string>();
    const [cur_move_number, set_cur_move_number] = React.useState<number>();
    const [score_estimate_winner, set_score_estimate_winner] = React.useState<string>();
    const [score_estimate_amount, set_score_estimate_amount] = React.useState<number>();
    const [show_undo_requested, set_show_undo_requested] = React.useState<boolean>();
    const [show_accept_undo, set_show_accept_undo] = React.useState<boolean>();
    const [show_title, set_show_title] = React.useState<boolean>();
    const [player_to_move, set_player_to_move] = React.useState<number>();
    const [player_not_to_move, set_player_not_to_move] = React.useState<number>();
    const [is_my_move, set_is_my_move] = React.useState<boolean>();
    const [winner, set_winner] = React.useState<"black" | "white">();
    const [official_move_number, set_official_move_number] = React.useState<number>();
    const [rules, set_rules] = React.useState<GoEngineRules>();
    const [analyze_tool, set_analyze_tool] = React.useState<AnalysisTool>();
    const [analyze_subtool, set_analyze_subtool] = React.useState<string>();
    const [black_accepted, set_black_accepted] = React.useState<boolean>();
    const [white_accepted, set_white_accepted] = React.useState<boolean>();
    const [review_owner_id, set_review_owner_id] = React.useState<number>();
    const [review_controller_id, set_review_controller_id] = React.useState<number>();
    const [review_out_of_sync, set_review_out_of_sync] = React.useState<boolean>();
    const [, set_undo_requested] = React.useState<number | undefined>();
    const [, forceUpdate] = React.useState<number>();

    /* Functions */
    const getLocation = (): string => {
        return window.location.pathname;
    };

    const autoadvance = () => {
        const user = data.get("user");

        if (!user.anonymous && /^\/game\//.test(getLocation())) {
            /* if we just moved */
            if (
                goban &&
                goban.current.engine &&
                goban.current.engine.playerNotToMove() === user.id
            ) {
                if (
                    !isLiveGame(goban.current.engine.time_control) &&
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
        if (goban && goban.current.engine) {
            last_move_viewed.current = goban.current.engine.getMoveNumber();
        }
        window.document.title = on_refocus_title.current;
    };

    /*** Common stuff ***/
    const nav_up = () => {
        const start = Date.now();
        checkAndEnterAnalysis();
        goban.current.prevSibling();
        goban.current.syncReviewMove();
        console.log("up", Date.now() - start);
    };
    const nav_down = () => {
        const start = Date.now();
        checkAndEnterAnalysis();
        goban.current.nextSibling();
        goban.current.syncReviewMove();
        console.log("down", Date.now() - start);
    };
    const nav_first = () => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showFirst();
        goban.current.syncReviewMove();
        console.log("nav_first", Date.now() - start);
    };
    const nav_prev_10 = () => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            goban.current.showPrevious();
        }
        goban.current.syncReviewMove();
        console.log("nav_prev_10", Date.now() - start);
    };
    const nav_prev = () => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showPrevious();
        goban.current.syncReviewMove();
        console.log("nav_prev", Date.now() - start);
    };
    const nav_next = (event?: React.MouseEvent<any>, dont_stop_autoplay?: boolean) => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        if (!dont_stop_autoplay) {
            stopAutoplay();
        }
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showNext();
        goban.current.syncReviewMove();
        console.log("nav_next", Date.now() - start);
    };
    const nav_next_10 = () => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            goban.current.showNext();
        }
        goban.current.syncReviewMove();
        console.log("nav_next_10", Date.now() - start);
    };
    const nav_last = () => {
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.jumpToLastOfficialMove();
        goban.current.syncReviewMove();
        console.log("nav_last", Date.now() - start);
    };
    const nav_play_pause = () => {
        if (autoplaying) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    };
    const nav_goto_move = (move_number: number) => {
        if (!goban) {
            return;
        }

        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showFirst(move_number > 0);
        for (let i = 0; i < move_number; ++i) {
            goban.current.showNext(i !== move_number - 1);
        }
        goban.current.syncReviewMove();
    };

    const stopAutoplay = () => {
        if (autoplay_timer.current) {
            clearTimeout(autoplay_timer.current);
            autoplay_timer.current = null;
        }
        if (autoplaying) {
            set_autoplaying(false);
        }
    };
    const startAutoplay = () => {
        if (autoplay_timer.current) {
            stopAutoplay();
        }
        checkAndEnterAnalysis();
        const step = () => {
            if (goban.current.mode === "analyze") {
                nav_next(null, true);

                if (
                    goban.current.engine.last_official_move.move_number ===
                    goban.current.engine.cur_move.move_number
                ) {
                    stopAutoplay();
                } else {
                    autoplay_timer.current = setTimeout(step, preferences.get("autoplay-delay"));
                }
            } else {
                stopAutoplay();
            }
        };
        autoplay_timer.current = setTimeout(
            step,
            Math.min(1000, preferences.get("autoplay-delay")),
        );

        set_autoplaying(true);
    };

    const processPlayerUpdate = (player_update: JGOFPlayerSummary) => {
        if (player_update.dropped_players) {
            if (player_update.dropped_players.black) {
                console.log("dropping black");
                // we don't care who was dropped, we just have to clear the auto-resign-overlay!
                set_black_auto_resign_expiration(null);
            }
            if (player_update.dropped_players.white) {
                set_white_auto_resign_expiration(null);
            }
        }
    };

    const checkAndEnterAnalysis = (move?: MoveTree) => {
        if (!goban) {
            return false;
        }

        if (
            goban.current.mode === "play" &&
            goban.current.engine.phase !== "stone removal" &&
            (!goban.current.isAnalysisDisabled() || goban.current.engine.phase === "finished")
        ) {
            set_variation_name("");
            goban.current.setMode("analyze");
            if (move) {
                goban.current.engine.jumpTo(move);
            }
            return true;
        }

        if (goban.current.mode === "analyze") {
            if (move) {
                goban.current.engine.jumpTo(move);
            }
            return true;
        }
        return false;
    };
    const recenterGoban = () => {
        if (ref_goban_container.current && goban.current) {
            const m = goban.current.computeMetrics();
            $(goban_div.current).css({
                top: Math.ceil(ref_goban_container.current.offsetHeight - m.height) / 2,
                left: Math.ceil(ref_goban_container.current.offsetWidth - m.width) / 2,
            });
        }
    };
    const onResize = (no_debounce: boolean = false, skip_state_update: boolean = false) => {
        //Math.min(ref_goban_container.current.offsetWidth, ref_goban_container.current.offsetHeight)
        if (!skip_state_update) {
            if (goban_view_mode() !== view_mode || goban_view_squashed() !== squashed) {
                set_squashed(goban_view_squashed());
                set_view_mode(goban_view_mode());
            }
        }

        if (resize_debounce.current) {
            clearTimeout(resize_debounce.current);
            resize_debounce.current = null;
        }

        if (!goban) {
            return;
        }

        // this forces a clock refresh, important after a layout when the dom
        // could have been replaced
        // TODO: When we are revamping this view we should see if we can either remove this
        // or move it into a clock component or something.
        goban.current.setGameClock(goban.current.last_clock);

        if (!ref_goban_container.current) {
            return;
        }

        if (goban_view_mode() === "portrait") {
            const w = win.width() + 10;
            if (ref_goban_container.current.style.minHeight !== `${w}px`) {
                ref_goban_container.current.style.minHeight = `${w}px`;
            }
        } else {
            if (ref_goban_container.current.style.minHeight !== `initial`) {
                ref_goban_container.current.style.minHeight = `initial`;
            }
            const w = ref_goban_container.current.offsetWidth;
            if (ref_goban_container.current.style.flexBasis !== `${w}px`) {
                ref_goban_container.current.style.flexBasis = `${w}px`;
            }
        }

        if (!no_debounce) {
            resize_debounce.current = setTimeout(() => onResize(true), 10);
            recenterGoban();
            return;
        }

        goban.current.setSquareSizeBasedOnDisplayWidth(
            Math.min(
                ref_goban_container.current.offsetWidth,
                ref_goban_container.current.offsetHeight,
            ),
        );

        recenterGoban();
    };
    const setAnalyzeTool = (tool, subtool) => {
        if (checkAndEnterAnalysis()) {
            $("#game-analyze-button-bar .active").removeClass("active");
            $("#game-analyze-" + tool + "-tool").addClass("active");
            switch (tool) {
                case "draw":
                    goban.current.setAnalyzeTool(tool, analyze_pencil_color);
                    break;
                case "erase":
                    console.log("Erase not supported yet");
                    break;
                case "label":
                    goban.current.setAnalyzeTool(tool, subtool);
                    break;
                case "stone":
                    if (subtool == null) {
                        //subtool = goban.current.engine.colorToMove() === "black" ? "black-white" : "white-black"
                        subtool = "alternate";
                    }
                    goban.current.setAnalyzeTool(tool, subtool);
                    break;
            }
        }

        return false;
    };
    const clear_and_sync = () => {
        goban.current.syncReviewMove({ clearpen: true });
        goban.current.clearAnalysisDrawing();
    };
    const delete_branch = () => {
        goban_deleteBranch();
    };
    const setLabelHandler = (event) => {
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

        if (goban && goban.current.mode === "analyze") {
            if (goban.current.analyze_tool === "label") {
                if (event.charCode) {
                    const ch = String.fromCharCode(event.charCode).toUpperCase();
                    goban.current.setLabelCharacter(ch);
                }
            }
        }
    };
    const toggleCoordinates = () => {
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

        goban.current.draw_top_labels =
            label_position === "all" || label_position.indexOf("top") >= 0;
        goban.current.draw_left_labels =
            label_position === "all" || label_position.indexOf("left") >= 0;
        goban.current.draw_right_labels =
            label_position === "all" || label_position.indexOf("right") >= 0;
        goban.current.draw_bottom_labels =
            label_position === "all" || label_position.indexOf("bottom") >= 0;
        onResize(true);
        goban.current.redraw(true);
    };
    const showGameInfo = () => {
        for (const k of ["komi", "rules", "handicap", "rengo", "rengo_teams"]) {
            goban.current.config[k] = goban.current.engine.config[k];
        }
        openGameInfoModal(
            goban.current.config,
            historical_black || goban.current.engine.players.black,
            historical_white || goban.current.engine.players.white,
            annulled,
            game_control.creator_id || goban.current.review_owner_id,
        );
    };

    const toggleShowTiming = () => {
        set_show_game_timing(!show_game_timing);
    };

    const gameLogModalMarkCoords = (stones_string: string) => {
        for (let i = 0; i < goban.current.config.width; i++) {
            for (let j = 0; j < goban.current.config.height; j++) {
                goban.current.deleteCustomMark(i, j, "triangle", true);
            }
        }

        const coordarray = stones_string.split(",").map((item) => item.trim());
        for (let j = 0; j < coordarray.length; j++) {
            const move = GoMath.decodeMoves(
                coordarray[j],
                goban.current.config.width,
                goban.current.config.height,
            )[0];
            goban.current.setMark(move.x, move.y, "triangle", false);
        }
    };

    const showLogModal = () => {
        openGameLogModal(
            goban.current.config,
            gameLogModalMarkCoords,
            historical_black || goban.current.engine.players.black,
            historical_white || goban.current.engine.players.white,
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
    const showLinkModal = () => {
        openGameLinkModal(goban.current);
    };
    const gameAnalyze = () => {
        if (goban.current.isAnalysisDisabled() && goban.current.engine.phase !== "finished") {
            //swal(_("Analysis mode has been disabled for this game"));
        } else {
            const last_estimate_move = stopEstimatingScore();

            goban.current.setMode("analyze");
            if (last_estimate_move) {
                goban.current.engine.jumpTo(last_estimate_move);
            }
        }
    };
    const fork = () => {
        if (
            goban.current?.engine.rengo ||
            (goban.current.isAnalysisDisabled() && goban.current.engine.phase !== "finished")
        ) {
            //swal(_("Game forking has been disabled for this game since analysis mode has been disabled"));
        } else {
            challengeFromBoardPosition(goban.current);
        }
    };
    const toggleZenMode = () => {
        if (zen_mode) {
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class
            set_zen_mode(false);
            set_view_mode(goban_view_mode());
        } else {
            const body = document.getElementsByTagName("body")[0];
            body.classList.add("zen"); //add the class
            set_zen_mode(true);
            set_view_mode(goban_view_mode());
        }
        onResize();
    };
    const toggleAIReview = () => {
        preferences.set("ai-review-enabled", !ai_review_enabled);
        if (ai_review_enabled) {
            goban.current.setHeatmap(null);
            goban.current.setColoredCircles(null);
            let move_tree = goban.current.engine.move_tree;
            while (move_tree.next(true)) {
                move_tree = move_tree.next(true);
                move_tree.clearMarks();
            }
            goban.current.redraw();
        }
        set_ai_review_enabled(!ai_review_enabled);
    };
    const togglePortraitTab = () => {
        let portrait_tab = null;
        switch (portrait_tab) {
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

        set_portrait_tab(portrait_tab);
        onResize();
    };
    const setPencilColor = (ev) => {
        const color = (ev.target as HTMLInputElement).value;
        if (goban.current.analyze_tool === "draw") {
            goban.current.analyze_subtool = color;
        }
        set_analyze_pencil_color(color);
    };
    const updateVariationName = (ev) => {
        set_variation_name((ev.target as HTMLInputElement).value);
    };
    const updateMoveText = (ev) => {
        set_move_text(ev.target.value);
        goban.current.syncReviewMove(null, ev.target.value);
    };
    const shareAnalysis = () => {
        const diff = goban.current.engine.getMoveDiff();
        let name = variation_name;
        let autonamed = false;

        if (!name) {
            autonamed = true;
            name = "" + ++game_control.last_variation_number;
        }

        const marks = {};
        let mark_ct = 0;
        for (let y = 0; y < goban.current.height; ++y) {
            for (let x = 0; x < goban.current.width; ++x) {
                const pos = goban.current.getMarks(x, y);
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
        if (goban.current.pen_marks.length) {
            analysis.pen_marks = goban.current.pen_marks;
        }

        const las = last_analysis_sent.current;
        if (
            las &&
            las.from === analysis.from &&
            las.moves === analysis.moves &&
            (autonamed || las.name === analysis.name) &&
            ((!analysis.marks && !las.marks) || las.marks === analysis.marks) &&
            ((!analysis.pen_marks && !las.pen_marks) || las.pen_marks === analysis.pen_marks)
        ) {
            if (autonamed) {
                --game_control.last_variation_number;
            }
            return;
        }

        if (!data.get("user").anonymous) {
            goban.current.sendChat(analysis, selected_chat_log);
            las.current = analysis;
        } else {
            goban.current.message("Can't send to the " + selected_chat_log + " chat_log");
        }
    };
    const openACL = () => {
        if (game_id) {
            openACLModal({ game_id: game_id });
        } else if (review_id) {
            openACLModal({ review_id: review_id });
        }
    };

    const popupScores = () => {
        if (goban.current.engine.cur_move) {
            orig_marks.current = JSON.stringify(goban.current.engine.cur_move.getAllMarks());
            goban.current.engine.cur_move.clearMarks();
        } else {
            orig_marks.current = null;
        }

        _popupScores("black");
        _popupScores("white");
    };
    const _popupScores = (color) => {
        const only_prisoners = false;
        const scores = goban.current.engine.computeScore(only_prisoners);
        showing_scores.current = goban.current.showing_scores;
        goban.current.showScores(scores);

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
        set_show_score_breakdown(true);
    };
    const hideScores = () => {
        if (!showing_scores.current) {
            goban.current.hideScores();
        }
        if (goban.current.engine.cur_move) {
            goban.current.engine.cur_move.setAllMarks(JSON.parse(orig_marks.current));
        }
        goban.current.redraw();

        $("#black-score-details").children().remove();
        $("#white-score-details").children().remove();

        set_show_score_breakdown(false);
    };

    /*** Game stuff ***/
    const reviewAdded = (review) => {
        const review_list = [];
        for (const r of review_list) {
            review_list.push(r);
        }
        review_list.push(review);
        review_list.sort((a, b) => {
            if (a.owner.ranking === b.owner.ranking) {
                return a.owner.username < b.owner.username ? -1 : 1;
            }
            return a.owner.ranking - b.owner.ranking;
        });
        set_review_list(review_list);
        if (goban.current?.engine?.phase === "finished") {
            sfx.play("review_started");
        }
    };
    const handleEscapeKey = () => {
        if (zen_mode) {
            toggleZenMode();
        }

        if (goban.current) {
            if (goban.current.mode === "score estimation") {
                leaveScoreEstimation();
            } else if (goban.current.mode === "analyze" && game_id) {
                goban.current.setMode("play");
            }
        }
    };

    const leaveScoreEstimation = () => {
        set_estimating_score(false);
        goban.current.setScoringMode(false);
        goban.current.hideScores();
        goban.current.score_estimate = null;
    };
    const enterConditionalMovePlanner = () => {
        //if (!auth) { return; }
        if (goban.current.isAnalysisDisabled() && goban.current.engine.phase !== "finished") {
            //swal(_("Conditional moves have been disabled for this game."));
        } else {
            stashed_conditional_moves.current = goban.current.conditional_tree.duplicate();
            goban.current.setMode("conditional");
        }
    };
    const pauseGame = () => {
        goban.current.pauseGame();
    };
    const startReview = () => {
        const user = data.get("user");
        const is_player =
            user.id === goban.current.engine.players.black.id ||
            user.id === goban.current.engine.players.white.id;

        if (
            goban.current.isAnalysisDisabled() &&
            goban.current.engine.phase !== "finished" &&
            is_player
        ) {
            //swal(_("Analysis mode has been disabled for this game, you can start a review after the game has concluded."));
        } else {
            swal({
                text: _("Start a review of this game?"),
                showCancelButton: true,
            })
                .then(() => {
                    post("games/%%/reviews", game_id, {})
                        .then((res) => browserHistory.push(`/review/${res.id}`))
                        .catch(errorAlerter);
                })
                .catch(ignore);
        }
    };
    const estimateScore = (): boolean => {
        const user = data.get("user");
        const is_player =
            user.id === goban.current.engine.players.black.id ||
            user.id === goban.current.engine.players.white.id ||
            shared_ip_with_player_map[game_id];

        if (
            goban.current.isAnalysisDisabled() &&
            goban.current.engine.phase !== "finished" &&
            is_player
        ) {
            return null;
        }

        if (goban.current.engine.phase === "stone removal") {
            console.log(
                "Cowardly refusing to enter score estimation phase while stone removal phase is active",
            );
            return false;
        }
        set_estimating_score(true);
        const use_ai_estimate =
            goban.current.engine.phase === "finished" ||
            !goban.current.engine.isParticipant(user.id);
        goban.current.setScoringMode(true, use_ai_estimate);
        return true;
    };
    const stopEstimatingScore = (): MoveTree => {
        if (!estimating_score) {
            return null;
        }
        set_estimating_score(false);
        const ret = goban.current.setScoringMode(false);
        goban.current.hideScores();
        goban.current.score_estimate = null;
        //goban.current.engine.cur_move.clearMarks();
        return ret;
    };
    const alertModerator = () => {
        const user = data.get("user");
        const obj: any = game_id
            ? { reported_game_id: game_id }
            : { reported_review_id: review_id };

        if (user.id === goban.current?.engine?.config?.white_player_id) {
            obj.reported_user_id = goban.current.engine.config.black_player_id;
        }
        if (user.id === goban.current?.engine?.config?.black_player_id) {
            obj.reported_user_id = goban.current.engine.config.white_player_id;
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

    const decide = (winner): void => {
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
                .replace(/(black)\b/g, `player ${goban.current.engine.players.black.id}`)
                .replace(/(white)\b/g, `player ${goban.current.engine.players.white.id}`);
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
                set_annulled(tf);
            })
            .catch(errorAlerter);
    };

    const cancelOrResign = () => {
        let dropping_from_casual_rengo = false;

        if (goban.current.engine.rengo && goban.current.engine.rengo_casual_mode) {
            const team = goban.current.engine.rengo_teams.black.find(
                (p) => p.id === data.get("user").id,
            )
                ? "black"
                : "white";
            dropping_from_casual_rengo = goban.current.engine.rengo_teams[team].length > 1;
        }

        if (resign_mode === "cancel") {
            swal({
                text: _("Are you sure you wish to cancel this game?"),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
                .then(() => goban.current.cancelGame())
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
                .then(() => goban.current.resign())
                .catch(() => 0);
        }
    };
    const goban_acceptUndo = () => {
        goban.current.acceptUndo();
    };
    const goban_submit_move = () => {
        goban.current.submit_move();
    };
    const goban_setMode_play = () => {
        goban.current.setMode("play");
        if (stashed_conditional_moves.current) {
            goban.current.setConditionalTree(stashed_conditional_moves.current);
            stashed_conditional_moves.current = null;
        }
    };
    const goban_resumeGame = () => {
        goban.current.resumeGame();
    };
    const goban_jumpToLastOfficialMove = () => {
        goban.current.jumpToLastOfficialMove();
    };
    const acceptConditionalMoves = () => {
        stashed_conditional_moves.current = null;
        goban.current.saveConditionalMoves();
        goban.current.setMode("play");
    };
    const pass = () => {
        if (
            !isLiveGame(goban.current.engine.time_control) ||
            !preferences.get("one-click-submit-live")
        ) {
            swal({ text: _("Are you sure you want to pass?"), showCancelButton: true })
                .then(() => goban.current.pass())
                .catch(() => 0);
        } else {
            goban.current.pass();
        }
    };
    const analysis_pass = () => {
        goban.current.pass();
        forceUpdate(Math.random());
    };
    const undo = () => {
        if (
            data.get("user").id === goban.current.engine.playerNotToMove() &&
            goban.current.engine.undo_requested !== goban.current.engine.getMoveNumber()
        ) {
            goban.current.requestUndo();
        }
    };
    const goban_setModeDeferredPlay = () => {
        goban.current.setModeDeferred("play");
    };
    const goban_deleteBranch = () => {
        if (mode !== "analyze") {
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

        if (goban.current.engine.cur_move.trunk) {
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
                    goban.current.deleteBranch();
                    goban.current.syncReviewMove();
                })
                .catch(() => 0);
        }
    };
    const goban_copyBranch = () => {
        if (mode !== "analyze") {
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

        copied_node.current = goban.current.engine.cur_move;
        toast(<div>{_("Branch copied")}</div>, 1000);
    };
    const goban_pasteBranch = () => {
        if (mode !== "analyze") {
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

        if (copied_node.current) {
            const paste = (base: MoveTree, source: MoveTree) => {
                goban.current.engine.jumpTo(base);
                if (source.edited) {
                    goban.current.engine.editPlace(source.x, source.y, source.player, false);
                } else {
                    goban.current.engine.place(
                        source.x,
                        source.y,
                        false,
                        false,
                        true,
                        false,
                        false,
                    );
                }
                const cur = goban.current.engine.cur_move;

                if (source.trunk_next) {
                    paste(cur, source.trunk_next);
                }
                for (const branch of source.branches) {
                    paste(cur, branch);
                }
            };

            try {
                paste(goban.current.engine.cur_move, copied_node.current);
            } catch (e) {
                errorAlerter(_("A move conflict has been detected"));
            }
            goban.current.syncReviewMove();
        } else {
            console.log("Nothing copied or cut to paste");
        }
    };
    const setStrictSekiMode = (ev) => {
        goban.current.setStrictSekiMode((ev.target as HTMLInputElement).checked);
    };
    const rematch = () => {
        try {
            $(document.activeElement).blur();
        } catch (e) {
            console.error(e);
        }

        challengeRematch(
            goban,
            data.get("user").id === goban.current.engine.players.black.id
                ? goban.current.engine.players.white
                : goban.current.engine.players.black,
            goban.current.engine.config,
        );
    };
    const onStoneRemovalCancel = () => {
        swal({ text: _("Are you sure you want to resume the game?"), showCancelButton: true })
            .then(() => goban.current.rejectRemovedStones())
            .catch(() => 0);
        return false;
    };
    const onStoneRemovalAccept = () => {
        goban.current.acceptRemovedStones();
        return false;
    };
    const onStoneRemovalAutoScore = () => {
        goban.current.autoScore();
        return false;
    };
    const clearAnalysisDrawing = () => {
        goban.current.syncReviewMove({ clearpen: true });
        goban.current.clearAnalysisDrawing();
    };

    const toggleVolume = () => {
        _setVolume(volume > 0 ? 0 : 0.5);
    };
    const setVolume = (ev) => {
        const new_volume = parseFloat(ev.target.value);
        _setVolume(new_volume);
    };
    const _setVolume = (volume) => {
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

    /* Review stuff */
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

    const syncToCurrentReviewMove = () => {
        if (goban.current.engine.cur_review_move) {
            goban.current.engine.jumpTo(goban.current.engine.cur_review_move);
        } else {
            setTimeout(syncToCurrentReviewMove, 50);
        }
    };

    const frag_cancel_button = () => {
        if (view_mode === "portrait") {
            return (
                <button className="bold cancel-button reject" onClick={cancelOrResign}>
                    {resign_text}
                </button>
            );
        } else {
            return (
                <button className="xs bold cancel-button" onClick={cancelOrResign}>
                    {resign_text}
                </button>
            );
        }
    };
    const frag_play_buttons = (show_cancel_button) => {
        return (
            <span className="play-buttons">
                <span>
                    {((cur_move_number >= 1 &&
                        player_not_to_move === data.get("user").id &&
                        !(
                            goban.current.engine.undo_requested >=
                            goban.current.engine.getMoveNumber()
                        ) &&
                        goban.current.submit_move == null) ||
                        null) && (
                        <button className="bold undo-button xs" onClick={undo}>
                            {_("Undo")}
                        </button>
                    )}
                    {show_undo_requested && (
                        <span>
                            {show_accept_undo && (
                                <button
                                    className="sm primary bold accept-undo-button"
                                    onClick={goban_acceptUndo}
                                >
                                    {_("Accept Undo")}
                                </button>
                            )}
                        </span>
                    )}
                </span>
                <span>
                    {((!show_submit &&
                        is_my_move &&
                        goban.current.engine.handicapMovesLeft() === 0) ||
                        null) && (
                        <button className="sm primary bold pass-button" onClick={pass}>
                            {_("Pass")}
                        </button>
                    )}
                    {((show_submit &&
                        goban.current.engine.undo_requested !==
                            goban.current.engine.getMoveNumber()) ||
                        null) && (
                        <button
                            className="sm primary bold submit-button"
                            id="game-submit-move"
                            disabled={submitting_move}
                            onClick={goban_submit_move}
                        >
                            {_("Submit Move")}
                        </button>
                    )}
                </span>
                <span>
                    {((show_cancel_button && user_is_player && phase !== "finished") || null) &&
                        frag_cancel_button()}
                </span>
            </span>
        );
    };

    const variationKeyPress = (ev) => {
        if (ev.keyCode === 13) {
            shareAnalysis();
            return false;
        }
    };

    const frag_play_controls = (show_cancel_button) => {
        const user = data.get("user");

        if (!goban) {
            return null;
        }

        const user_is_active_player = [
            goban.current.engine.players.black.id,
            goban.current.engine.players.white.id,
        ].includes(user.id);

        return (
            <div className="play-controls">
                <div className="game-action-buttons">
                    {/* { */}
                    {((mode === "play" && phase === "play") || null) &&
                        frag_play_buttons(show_cancel_button)}
                    {/* (view_mode === 'portrait' || null) && <i onClick={togglePortraitTab} className={'tab-icon fa fa-commenting'}/> */}
                </div>
                {/* } */}
                <div className="game-state">
                    {/*{*/}
                    {((mode === "play" && phase === "play") || null) && (
                        <span>
                            {show_undo_requested ? (
                                <span>{_("Undo Requested")}</span>
                            ) : (
                                <span>
                                    {((show_title && !goban.current?.engine?.rengo) || null) && (
                                        <span>{title}</span>
                                    )}
                                </span>
                            )}
                        </span>
                    )}
                    {((mode === "play" && phase === "stone removal") || null) && (
                        <span>{_("Stone Removal Phase")}</span>
                    )}

                    {(mode === "analyze" || null) && (
                        <span>
                            {show_undo_requested ? (
                                <span>{_("Undo Requested")}</span>
                            ) : (
                                <span>{_("Analyze Mode")}</span>
                            )}
                        </span>
                    )}

                    {(mode === "conditional" || null) && (
                        <span>{_("Conditional Move Planner")}</span>
                    )}

                    {(mode === "score estimation" || null) && frag_estimate_score()}

                    {((mode === "play" && phase === "finished") || null) && (
                        <span style={{ textDecoration: annulled ? "line-through" : "none" }}>
                            {winner
                                ? interpolate(
                                      pgettext("Game winner", "{{color}} wins by {{outcome}}"),
                                      {
                                          // When is winner an id?
                                          color:
                                              (winner as any) ===
                                                  goban.current.engine.players.black.id ||
                                              winner === "black"
                                                  ? _("Black")
                                                  : _("White"),
                                          outcome: getOutcomeTranslation(
                                              goban.current.engine.outcome,
                                          ),
                                      },
                                  )
                                : interpolate(pgettext("Game winner", "Tie by {{outcome}}"), {
                                      outcome: pgettext(
                                          "Game outcome",
                                          goban.current.engine.outcome,
                                      ),
                                  })}
                        </span>
                    )}
                </div>
                <div className="annulled-indicator">
                    {annulled &&
                        pgettext(
                            "Displayed to the user when the game is annulled",
                            "Game Annulled",
                        )}
                </div>
                {/* } */}
                {((phase === "play" &&
                    mode === "play" &&
                    paused &&
                    goban.current.pause_control &&
                    goban.current.pause_control.paused) ||
                    null) /* { */ && (
                    <div className="pause-controls">
                        <h3>{_("Game Paused")}</h3>
                        {(user_is_player || user.is_moderator || null) && (
                            <button className="info" onClick={goban_resumeGame}>
                                {_("Resume")}
                            </button>
                        )}
                        <div>
                            {goban.current.engine.players.black.id ===
                                goban.current.pause_control.paused.pausing_player_id ||
                            (goban.current.engine.rengo &&
                                goban.current.engine.rengo_teams.black
                                    .map((p) => p.id)
                                    .includes(goban.current.pause_control.paused.pausing_player_id))
                                ? interpolate(_("{{pauses_left}} pauses left for Black"), {
                                      pauses_left: goban.current.pause_control.paused.pauses_left,
                                  })
                                : interpolate(_("{{pauses_left}} pauses left for White"), {
                                      pauses_left: goban.current.pause_control.paused.pauses_left,
                                  })}
                        </div>
                    </div>
                )}

                {((goban.current.pause_control &&
                    goban.current.pause_control.moderator_paused &&
                    user.is_moderator) ||
                    null) /* { */ && (
                    <div className="pause-controls">
                        <h3>{_("Paused by Moderator")}</h3>
                        <button className="info" onClick={goban_resumeGame}>
                            {_("Resume")}
                        </button>
                    </div>
                )}
                {(phase === "finished" || null) /* { */ && (
                    <div className="analyze-mode-buttons">
                        {" "}
                        {/* not really analyze mode, but equivalent button position and look*/}
                        {((user_is_player &&
                            mode !== "score estimation" &&
                            !goban.current.engine.rengo) ||
                            null) && (
                            <button onClick={rematch} className="primary">
                                {_("Rematch")}
                            </button>
                        )}
                        {(review_list.length > 0 || null) && (
                            <div className="review-list">
                                <h3>{_("Reviews")}</h3>
                                {review_list.map((review, idx) => (
                                    <div key={idx}>
                                        <Player user={review.owner} icon></Player> -{" "}
                                        <Link to={`/review/${review.id}`}>{_("view")}</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(return_url.current || null) && (
                            <div className="return-url">
                                <a href={return_url.current} rel="noopener">
                                    {interpolate(
                                        pgettext(
                                            "Link to where the user came from",
                                            "Return to {{url}}",
                                        ),
                                        {
                                            url: return_url.current,
                                        },
                                    )}
                                </a>
                            </div>
                        )}
                    </div>
                )}
                {/* } */}
                {(phase === "stone removal" || null) /* { */ && (
                    <div className="stone-removal-controls">
                        <div>
                            {(user_is_active_player || user.is_moderator || null) && ( // moderators see the button, with its timer, but can't press it
                                <button
                                    id="game-stone-removal-accept"
                                    className={
                                        user.is_moderator && !user_is_active_player ? "" : "primary"
                                    }
                                    disabled={user.is_moderator && !user_is_active_player}
                                    onClick={onStoneRemovalAccept}
                                >
                                    {_("Accept removed stones")}
                                    <Clock goban={goban.current} color="stone-removal" />
                                </button>
                            )}
                        </div>
                        <br />
                        <div style={{ textAlign: "center" }}>
                            <div style={{ textAlign: "left", display: "inline-block" }}>
                                <div>
                                    {(black_accepted || null) && (
                                        <i
                                            className="fa fa-check"
                                            style={{ color: "green", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {(!black_accepted || null) && (
                                        <i
                                            className="fa fa-times"
                                            style={{ color: "red", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {goban.current.engine.players.black.username}
                                </div>
                                <div>
                                    {(white_accepted || null) && (
                                        <i
                                            className="fa fa-check"
                                            style={{ color: "green", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {(!white_accepted || null) && (
                                        <i
                                            className="fa fa-times"
                                            style={{ color: "red", width: "1.5em" }}
                                        ></i>
                                    )}
                                    {goban.current.engine.players.white.username}
                                </div>
                            </div>
                        </div>
                        <br />

                        <div style={{ textAlign: "center" }}>
                            {(user_is_player || null) && (
                                <button
                                    id="game-stone-removal-auto-score"
                                    onClick={onStoneRemovalAutoScore}
                                >
                                    {_("Auto-score")}
                                </button>
                            )}
                        </div>
                        <div style={{ textAlign: "center" }}>
                            {(user_is_player || null) && (
                                <button
                                    id="game-stone-removal-cancel"
                                    onClick={onStoneRemovalCancel}
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
                            (rules === "japanese" || rules === "korean" || null) && (
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
                                        checked={strict_seki_mode}
                                        disabled={!user_is_player}
                                        onChange={setStrictSekiMode}
                                    ></input>
                                </div>
                            )}
                    </div>
                )}
                {/* } */}
                {(mode === "conditional" || null) /* { */ && (
                    <div className="conditional-move-planner">
                        <div className="buttons">
                            <button className="primary" onClick={acceptConditionalMoves}>
                                {_("Accept Conditional moves")}
                            </button>
                            <button onClick={goban_setMode_play}>{_("Cancel")}</button>
                        </div>
                        <div className="ctrl-conditional-tree">
                            <hr />
                            <span className="move-current" onClick={goban_jumpToLastOfficialMove}>
                                {_("Current Move")}
                            </span>
                            <PersistentElement elt={conditional_move_tree.current} />
                        </div>
                    </div>
                )}
                {/* } */}
                {(mode === "analyze" || null) /* { */ && (
                    <div>
                        {frag_analyze_button_bar()}

                        <Resizable
                            id="move-tree-container"
                            className="vertically-resizable"
                            ref={setMoveTreeContainer}
                        />

                        {(!zen_mode || null) && (
                            <div style={{ padding: "0.5em" }}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className={`form-control ${selected_chat_log}`}
                                        placeholder={_("Variation name...")}
                                        value={variation_name}
                                        onChange={updateVariationName}
                                        onKeyDown={variationKeyPress}
                                        disabled={user.anonymous}
                                    />
                                    {(selected_chat_log !== "malkovich" || null) && (
                                        <button
                                            className="sm"
                                            type="button"
                                            disabled={user.anonymous}
                                            onClick={shareAnalysis}
                                        >
                                            {_("Share")}
                                        </button>
                                    )}
                                    {(selected_chat_log === "malkovich" || null) && (
                                        <button
                                            className="sm malkovich"
                                            type="button"
                                            disabled={user.anonymous}
                                            onClick={shareAnalysis}
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
                {((mode === "play" &&
                    phase === "play" &&
                    goban.current.isAnalysisDisabled() &&
                    cur_move_number < official_move_number) ||
                    null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button className="sm primary bold" onClick={goban_setModeDeferredPlay}>
                                {_("Back to Game")}
                            </button>
                        </span>
                    </div>
                )}
                {(mode === "score estimation" || null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button className="sm primary bold" onClick={stopEstimatingScore}>
                                {_("Back to Board")}
                            </button>
                        </span>
                    </div>
                )}
            </div>
        );
    };
    const frag_review_controls = () => {
        const user = data.get("user");

        if (!goban) {
            return null;
        }

        return (
            <div className="play-controls">
                <div className="game-state">
                    {(mode === "analyze" || null) && (
                        <div>
                            {_("Review by")}: <Player user={review_owner_id} />
                            {((review_controller_id && review_controller_id !== review_owner_id) ||
                                null) && (
                                <div>
                                    {_("Review controller")}: <Player user={review_controller_id} />
                                </div>
                            )}
                        </div>
                    )}

                    {(mode === "score estimation" || null) && <div>{frag_estimate_score()}</div>}
                </div>
                {(mode === "analyze" || null) && (
                    <div>
                        {frag_analyze_button_bar()}

                        <div className="space-around">
                            {review_controller_id &&
                                review_controller_id !== user.id &&
                                review_out_of_sync && (
                                    <button className="sm" onClick={syncToCurrentReviewMove}>
                                        {pgettext("Synchronize to current review position", "Sync")}{" "}
                                        <i className="fa fa-refresh" />
                                    </button>
                                )}
                        </div>

                        <Resizable
                            id="move-tree-container"
                            className="vertically-resizable"
                            ref={setMoveTreeContainer}
                        />

                        <div style={{ paddingLeft: "0.5em", paddingRight: "0.5em" }}>
                            <textarea
                                id="game-move-node-text"
                                placeholder={_("Move comments...")}
                                rows={5}
                                className="form-control"
                                value={move_text}
                                disabled={review_controller_id !== data.get("user").id}
                                onChange={updateMoveText}
                            ></textarea>
                        </div>

                        <div style={{ padding: "0.5em" }}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className={`form-control ${selected_chat_log}`}
                                    placeholder={_("Variation name...")}
                                    value={variation_name}
                                    onChange={updateVariationName}
                                    onKeyDown={variationKeyPress}
                                    disabled={user.anonymous}
                                />
                                <button
                                    className="sm"
                                    type="button"
                                    disabled={user.anonymous}
                                    onClick={shareAnalysis}
                                >
                                    {_("Share")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {(mode === "score estimation" || null) && (
                    <div className="analyze-mode-buttons">
                        <span>
                            <button className="sm primary bold" onClick={stopEstimatingScore}>
                                {_("Back to Review")}
                            </button>
                        </span>
                    </div>
                )}
            </div>
        );
    };
    const frag_estimate_score = () => {
        return (
            <span>
                {(score_estimate_winner || null) && (
                    <span>
                        {interpolate(_("{{winner}} by {{score}}"), {
                            winner: score_estimate_winner,
                            score: score_estimate_amount?.toFixed(1),
                        })}
                    </span>
                )}
                {(!score_estimate_winner || null) && <span>{_("Estimating...")}</span>}
            </span>
        );
    };
    const frag_analyze_button_bar = () => {
        return (
            <div className="game-analyze-button-bar">
                {/*
            {(review_id || null) &&
                <i id='review-sync' className='fa fa-refresh {{goban.current.engine.cur_move.id !== goban.current.engine.cur_review_move.id ? "need-sync" : ""}}'
                    onClick={syncToCurrentReviewMove()} title={_("Sync to where the reviewer is at")}></i>
            }
            */}
                <div className="btn-group">
                    <button
                        onClick={() => setAnalyzeTool("stone", "alternate")}
                        title={_("Place alternating stones")}
                        className={
                            "stone-button " +
                            (analyze_tool === "stone" &&
                            analyze_subtool !== "black" &&
                            analyze_subtool !== "white"
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
                        onClick={() => setAnalyzeTool("stone", "black")}
                        title={_("Place black stones")}
                        className={
                            "stone-button " +
                            (analyze_tool === "stone" && analyze_subtool === "black"
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
                        onClick={() => setAnalyzeTool("stone", "white")}
                        title={_("Place white stones")}
                        className={
                            "stone-button " +
                            (analyze_tool === "stone" && analyze_subtool === "white"
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
                        onClick={() => setAnalyzeTool("draw", analyze_pencil_color)}
                        title={_("Draw on the board with a pen")}
                        className={analyze_tool === "draw" ? "active" : ""}
                    >
                        <i className="fa fa-pencil"></i>
                    </button>
                    <button onClick={clearAnalysisDrawing} title={_("Clear pen marks")}>
                        <i className="fa fa-eraser"></i>
                    </button>
                </div>
                <input
                    type="color"
                    value={analyze_pencil_color}
                    title={_("Select pen color")}
                    onChange={setPencilColor}
                />

                <div className="btn-group">
                    <button onClick={goban_copyBranch} title={_("Copy this branch")}>
                        <i className="fa fa-clone"></i>
                    </button>
                    <button
                        disabled={copied_node.current === null}
                        onClick={goban_pasteBranch}
                        title={_("Paste branch")}
                    >
                        <i className="fa fa-clipboard"></i>
                    </button>
                    <button onClick={goban_deleteBranch} title={_("Delete branch")}>
                        <i className="fa fa-trash"></i>
                    </button>
                </div>

                <div className="btn-group">
                    <button
                        onClick={() => setAnalyzeTool("label", "letters")}
                        title={_("Place alphabetical labels")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "letters"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="fa fa-font"></i>
                    </button>
                    <button
                        onClick={() => setAnalyzeTool("label", "numbers")}
                        title={_("Place numeric labels")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "numbers"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-number"></i>
                    </button>
                    <button
                        onClick={() => setAnalyzeTool("label", "triangle")}
                        title={_("Place triangle marks")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "triangle"
                                ? "active"
                                : ""
                        }
                    >
                        <i className="ogs-label-triangle"></i>
                    </button>
                    <button
                        onClick={() => setAnalyzeTool("label", "square")}
                        title={_("Place square marks")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "square" ? "active" : ""
                        }
                    >
                        <i className="ogs-label-square"></i>
                    </button>
                    <button
                        onClick={() => setAnalyzeTool("label", "circle")}
                        title={_("Place circle marks")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "circle" ? "active" : ""
                        }
                    >
                        <i className="ogs-label-circle"></i>
                    </button>
                    <button
                        onClick={() => setAnalyzeTool("label", "cross")}
                        title={_("Place X marks")}
                        className={
                            analyze_tool === "label" && analyze_subtool === "cross" ? "active" : ""
                        }
                    >
                        <i className="ogs-label-x"></i>
                    </button>
                </div>
                <div className="analyze-mode-buttons">
                    {(mode === "analyze" || null) && (
                        <span>
                            {(!review_id || null) && (
                                <button
                                    className="sm primary bold"
                                    onClick={goban_setModeDeferredPlay}
                                >
                                    {_("Back to Game")}
                                </button>
                            )}
                            <button className="sm primary bold pass-button" onClick={analysis_pass}>
                                {_("Pass")}
                            </button>
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const frag_ai_review = () => {
        if (
            goban &&
            goban.current.engine &&
            goban.current.engine.phase === "finished" &&
            ((goban.current.engine.width === 19 && goban.current.engine.height === 19) ||
                (goban.current.engine.width === 13 && goban.current.engine.height === 13) ||
                (goban.current.engine.width === 9 && goban.current.engine.height === 9))
        ) {
            return (
                <AIReview
                    onAIReviewSelected={(r) => set_selected_ai_review_uuid(r?.uuid)}
                    game_id={game_id}
                    move={goban.current.engine.cur_move}
                    hidden={!ai_review_enabled}
                />
            );
        }
        return null;
    };

    const frag_timings = () => {
        if (goban && goban.current.engine) {
            return (
                <GameTimings
                    moves={goban.current.engine.config.moves}
                    start_time={goban.current.engine.config.start_time}
                    end_time={goban.current.engine.config.end_time}
                    free_handicap_placement={goban.current.engine.config.free_handicap_placement}
                    handicap={goban.current.engine.config.handicap}
                    black_id={goban.current.engine.config.black_player_id}
                    white_id={goban.current.engine.config.white_player_id}
                />
            );
        }
        return null;
    };

    const frag_num_captures_text = (color) => {
        const num_prisoners = score[color].prisoners;
        const prisoner_color = color === "black" ? "white" : "black";
        const prisoner_img_src = data.get("config.cdn_release") + "/img/" + prisoner_color + ".png";
        return (
            <div className={"captures" + (estimating_score ? " hidden" : "")}>
                <span className="num-captures-container">
                    <span className="num-captures-count">{num_prisoners}</span>
                    {(!zen_mode || null) && (
                        <span className="num-captures-units">
                            {` ${ngettext("capture", "captures", num_prisoners)}`}
                        </span>
                    )}
                    {(zen_mode || null) && (
                        <span className="num-captures-stone">
                            {" "}
                            <img className="stone-image" src={prisoner_img_src} />
                        </span>
                    )}
                </span>
            </div>
        );
    };

    const frag_players = () => {
        if (!goban) {
            return null;
        }
        const engine = goban.current.engine;

        return (
            <div className="players">
                <div className="player-icons">
                    {["black", "white"].map((color: "black" | "white", idx) => {
                        const player_bg: any = {};
                        const historical = color === "black" ? historical_black : historical_white;
                        const auto_resign_expiration =
                            color === "black"
                                ? black_auto_resign_expiration
                                : white_auto_resign_expiration;

                        // In rengo we always will have a player icon to show (after initialisation).
                        // In other cases, we only have one if `historical` is set
                        if (
                            engine.rengo &&
                            engine.players[color] &&
                            engine.players[color]["icon-url"]
                        ) {
                            const icon = icon_size_url(engine.players[color]["icon-url"], 64);
                            player_bg.backgroundImage = `url("${icon}")`;
                        } else if (historical) {
                            const icon = icon_size_url(historical["icon"], 64);
                            player_bg.backgroundImage = `url("${icon}")`;
                        }

                        const their_turn = player_to_move === engine.players[color].id;

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
                                            {auto_resign_expiration && (
                                                <div className={`auto-resign-overlay`}>
                                                    <i className="fa fa-bolt" />
                                                    <CountDown to={auto_resign_expiration} />
                                                </div>
                                            )}
                                            <div className="player-flag">
                                                <Flag country={engine.players[color].country} />
                                            </div>
                                            <ChatPresenceIndicator
                                                channel={
                                                    game_id
                                                        ? `game-${game_id}`
                                                        : `review-${review_id}`
                                                }
                                                userId={engine.players[color].id}
                                            />
                                        </div>
                                    )}

                                    {((goban.current.engine.phase !== "finished" &&
                                        !goban.current.review_id) ||
                                        null) && (
                                        <Clock
                                            goban={goban.current}
                                            color={color}
                                            className="in-game-clock"
                                        />
                                    )}
                                </div>

                                {((goban.current.engine.players[color] &&
                                    goban.current.engine.players[color].rank !== -1) ||
                                    null) && (
                                    <div className={`${color} player-name-container`}>
                                        <Player
                                            user={
                                                (!engine.rengo && historical) ||
                                                goban.current.engine.players[color]
                                            }
                                            disableCacheUpdate
                                        />
                                    </div>
                                )}

                                {(!goban.current.engine.players[color] || null) && (
                                    <span className="player-name-plain">
                                        {color === "black" ? _("Black") : _("White")}
                                    </span>
                                )}

                                <div
                                    className={
                                        "score-container " +
                                        (show_score_breakdown ? "show-score-breakdown" : "")
                                    }
                                    onClick={() =>
                                        show_score_breakdown ? hideScores() : popupScores()
                                    }
                                >
                                    {(goban.current.engine.phase === "finished" ||
                                        goban.current.engine.phase === "stone removal" ||
                                        null) &&
                                        goban.current.mode !== "analyze" &&
                                        goban.current.engine.outcome !== "Timeout" &&
                                        goban.current.engine.outcome !== "Resignation" &&
                                        goban.current.engine.outcome !== "Cancellation" && (
                                            <div
                                                className={
                                                    "points" + (estimating_score ? " hidden" : "")
                                                }
                                            >
                                                {interpolate(_("{{total}} {{unit}}"), {
                                                    total: score[color].total,
                                                    unit: ngettext(
                                                        "point",
                                                        "points",
                                                        score[color].total,
                                                    ),
                                                })}
                                            </div>
                                        )}
                                    {((goban.current.engine.phase !== "finished" &&
                                        goban.current.engine.phase !== "stone removal") ||
                                        null ||
                                        goban.current.mode === "analyze" ||
                                        goban.current.engine.outcome === "Timeout" ||
                                        goban.current.engine.outcome === "Resignation" ||
                                        goban.current.engine.outcome === "Cancellation") &&
                                        frag_num_captures_text(color)}
                                    {((goban.current.engine.phase !== "finished" &&
                                        goban.current.engine.phase !== "stone removal") ||
                                        null ||
                                        goban.current.mode === "analyze" ||
                                        goban.current.engine.outcome === "Timeout" ||
                                        goban.current.engine.outcome === "Resignation" ||
                                        goban.current.engine.outcome === "Cancellation") && (
                                        <div className="komi">
                                            {score[color].komi === 0
                                                ? ""
                                                : `+ ${parseFloat(score[color].komi as any).toFixed(
                                                      1,
                                                  )}`}
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
                        {((!review_id && show_title && goban.current?.engine?.rengo) || null) && (
                            <div className="game-state">{title}</div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const frag_below_board_controls = () => {
        if (view_mode === "portrait" && portrait_tab === "dock") {
            return (
                <div className="action-bar">
                    <span className="move-number">
                        <i onClick={togglePortraitTab} className={"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }

        if (view_mode === "portrait" && portrait_tab === "chat") {
            return (
                <div className="action-bar">
                    <span className="move-number">
                        <i onClick={togglePortraitTab} className={"tab-icon ogs-goban"} />
                    </span>
                </div>
            );
        }
        return (
            <div className="action-bar">
                <span className="icons" />
                <span className="controls">
                    <span onClick={nav_first} className="move-control">
                        <i className="fa fa-fast-backward"></i>
                    </span>
                    <span onClick={nav_prev_10} className="move-control">
                        <i className="fa fa-backward"></i>
                    </span>
                    <span onClick={nav_prev} className="move-control">
                        <i className="fa fa-step-backward"></i>
                    </span>
                    <span onClick={nav_play_pause} className="move-control">
                        <i className={"fa " + (autoplaying ? "fa-pause" : "fa-play")}></i>
                    </span>
                    <span onClick={nav_next} className="move-control">
                        <i className="fa fa-step-forward"></i>
                    </span>
                    <span onClick={nav_next_10} className="move-control">
                        <i className="fa fa-forward"></i>
                    </span>
                    <span onClick={nav_last} className="move-control">
                        <i className="fa fa-fast-forward"></i>
                    </span>
                </span>

                {(view_mode !== "portrait" || null) && (
                    <span className="move-number">
                        {interpolate(_("Move {{move_number}}"), {
                            move_number: goban && goban.current.engine.getMoveNumber(),
                        })}
                    </span>
                )}
            </div>
        );
    };

    const frag_dock = () => {
        let superuser_ai_review_ready =
            (goban && data.get("user").is_superuser && goban.current.engine.phase === "finished") ||
            null;
        let mod =
            (goban && data.get("user").is_moderator && goban.current.engine.phase !== "finished") ||
            null;
        let annul =
            (goban && data.get("user").is_moderator && goban.current.engine.phase === "finished") ||
            null;
        const annulable = (goban && !annulled && goban.current.engine.config.ranked) || null;
        const unannulable = (goban && annulled && goban.current.engine.config.ranked) || null;

        const review = !!review_id || null;
        const game = !!game_id || null;
        if (review) {
            superuser_ai_review_ready = null;
            mod = null;
            annul = null;
        }

        let sgf_download_enabled = false;
        try {
            sgf_download_enabled =
                goban.current.engine.phase === "finished" ||
                !goban.current.isAnalysisDisabled(true);
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

        return (
            <Dock>
                {(tournament_id.current || null) && (
                    <Link className="plain" to={`/tournament/${tournament_id.current}`}>
                        <i className="fa fa-trophy" title={_("This is a tournament game")} />{" "}
                        {_("Tournament")}
                    </Link>
                )}
                {(ladder_id.current || null) && (
                    <Link className="plain" to={`/ladder/${ladder_id.current}`}>
                        <i className="fa fa-trophy" title={_("This is a ladder game")} />{" "}
                        {_("Ladder")}
                    </Link>
                )}
                {((goban && goban.current.engine.config["private"]) || null) && (
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

                <a onClick={toggleZenMode}>
                    <i className="ogs-zen-mode"></i> {_("Zen mode")}
                </a>
                <a onClick={toggleCoordinates}>
                    <i className="ogs-coordinates"></i> {_("Toggle coordinates")}
                </a>
                {game && (
                    <a onClick={toggleAIReview}>
                        <i className="fa fa-desktop"></i>{" "}
                        {ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}
                    </a>
                )}
                <a onClick={showGameInfo}>
                    <i className="fa fa-info"></i> {_("Game information")}
                </a>
                {game && (
                    <a
                        onClick={gameAnalyze}
                        className={
                            goban &&
                            goban.current.engine.phase !== "finished" &&
                            goban.current.isAnalysisDisabled()
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-sitemap"></i> {_("Analyze game")}
                    </a>
                )}
                {((goban &&
                    !review_id &&
                    user_is_player &&
                    goban.current.engine.phase !== "finished") ||
                    null) && (
                    <a
                        style={{
                            visibility:
                                goban.current.mode === "play" &&
                                goban &&
                                goban.current.engine.playerToMove() !== data.get("user").id
                                    ? "visible"
                                    : "hidden",
                        }}
                        className={
                            goban &&
                            goban.current.engine.phase !== "finished" &&
                            (goban.current.isAnalysisDisabled() || goban.current.engine.rengo)
                                ? "disabled"
                                : ""
                        }
                        onClick={enterConditionalMovePlanner}
                    >
                        <i className="fa fa-exchange"></i> {_("Plan conditional moves")}
                    </a>
                )}
                {((goban &&
                    !review_id &&
                    (user_is_player || mod) &&
                    goban.current.engine.phase !== "finished") ||
                    null) && (
                    <a onClick={pauseGame}>
                        <i className="fa fa-pause"></i> {_("Pause game")}
                    </a>
                )}
                {game && (
                    <a
                        onClick={startReview}
                        className={
                            goban &&
                            goban.current.engine.phase !== "finished" &&
                            goban.current.isAnalysisDisabled()
                                ? "disabled"
                                : ""
                        }
                    >
                        <i className="fa fa-refresh"></i> {_("Review this game")}
                    </a>
                )}
                <a
                    onClick={estimateScore}
                    className={
                        goban &&
                        goban.current.engine.phase !== "finished" &&
                        goban.current.isAnalysisDisabled()
                            ? "disabled"
                            : ""
                    }
                >
                    <i className="fa fa-tachometer"></i> {_("Estimate score")}
                </a>
                <a onClick={fork} className={goban.current?.engine.rengo ? "disabled" : ""}>
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
                    <a onClick={toggleShowTiming}>
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
    };
    const frag_kb_shortcuts = () => {
        return (
            <div>
                {(game_id > 0 || null) && (
                    <UIPush event="review-added" channel={`game-${game_id}`} action={reviewAdded} />
                )}
                <KBShortcut shortcut="up" action={nav_up} />
                <KBShortcut shortcut="down" action={nav_down} />
                <KBShortcut shortcut="left" action={nav_prev} />
                <KBShortcut shortcut="right" action={nav_next} />
                <KBShortcut shortcut="page-up" action={nav_prev_10} />
                <KBShortcut shortcut="page-down" action={nav_next_10} />
                <KBShortcut shortcut="space" action={nav_play_pause} />
                <KBShortcut shortcut="home" action={nav_first} />
                <KBShortcut shortcut="end" action={nav_last} />
                <KBShortcut shortcut="escape" action={handleEscapeKey} />
                <KBShortcut shortcut="f1" action={() => setAnalyzeTool("stone", null)} />
                <KBShortcut shortcut="f2" action={() => setAnalyzeTool("stone", "black")} />
                {/* <KBShortcut shortcut='f3' action='console.log("Should be entering scoring mode");'></KBShortcut> */}
                <KBShortcut shortcut="f4" action={() => setAnalyzeTool("label", "triangle")} />
                <KBShortcut shortcut="f5" action={() => setAnalyzeTool("label", "square")} />
                <KBShortcut shortcut="f6" action={() => setAnalyzeTool("label", "circle")} />
                <KBShortcut shortcut="f7" action={() => setAnalyzeTool("label", "letters")} />
                <KBShortcut shortcut="f8" action={() => setAnalyzeTool("label", "numbers")} />
                <KBShortcut shortcut="ctrl-c" action={goban_copyBranch} />
                <KBShortcut shortcut="ctrl-v" action={goban_pasteBranch} />
                <KBShortcut
                    shortcut="f9"
                    action={() => setAnalyzeTool("draw", analyze_pencil_color)}
                />
                {((goban && goban.current.mode === "analyze") || null) && (
                    <KBShortcut shortcut="f10" action={clear_and_sync} />
                )}
                <KBShortcut shortcut="del" action={delete_branch} />
                <KBShortcut shortcut="shift-z" action={toggleZenMode} />
                <KBShortcut shortcut="shift-c" action={toggleCoordinates} />
                <KBShortcut shortcut="shift-i" action={toggleAIReview} />
                <KBShortcut shortcut="shift-a" action={gameAnalyze} />
                <KBShortcut shortcut="shift-r" action={startReview} />
                <KBShortcut shortcut="shift-e" action={estimateScore} />
                <KBShortcut shortcut="shift-p" action={goban_setModeDeferredPlay} />
            </div>
        );
    };

    const renderExtraPlayerActions = (player_id: number) => {
        const user = data.get("user");
        if (
            review_id &&
            goban &&
            (goban.current.review_controller_id === user.id ||
                goban.current.review_owner_id === user.id)
        ) {
            let is_owner = null;
            let is_controller = null;
            if (goban.current.review_owner_id === player_id) {
                is_owner = (
                    <div style={{ fontStyle: "italic" }}>
                        {_("Owner") /* translators: Review owner */}
                    </div>
                );
            }
            if (goban.current.review_controller_id === player_id) {
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
                        goban.current.giveReviewControl(player_id);
                        close_all_popovers();
                    }}
                >
                    {_("Give Control") /* translators: Give control in review or on a demo board */}
                </button>
            );

            if (player_id === goban.current.review_owner_id) {
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
    const setMoveTreeContainer = (resizable: Resizable): void => {
        ref_move_tree_container.current = resizable ? resizable.div : null;
        if (goban.current) {
            (goban.current as GobanCanvas).setMoveTreeContainer(ref_move_tree_container.current);
        }
    };

    /* Constructor */
    React.useEffect(() => {
        game_control.last_variation_number = 0;

        try {
            return_url.current =
                new URLSearchParams(window.location.search).get("return") || undefined;
            // console.log("Return url", return_url.current);
        } catch (e) {
            console.error(e);
        }

        conditional_move_tree.current = $("<div class='conditional-move-tree-container'/>")[0];
        goban_div.current = document.createElement("div");
        goban_div.current.className = "Goban";
        /* end constructor */

        set_portrait_tab("game");
        set_estimating_score(false);
        set_show_submit(false);
        set_autoplaying(false);
        set_review_list([]);
        set_historical_black(null);
        set_historical_white(null);

        game_control.on("stopEstimatingScore", stopEstimatingScore);
        game_control.on("gotoMove", nav_goto_move);

        setExtraActionCallback(renderExtraPlayerActions);
        $(window).on("focus", onFocus);

        /*** BEGIN initialize ***/
        chat_proxy.current = game_id
            ? chat_manager.join(`game-${game_id}`)
            : chat_manager.join(`review-${review_id}`);
        $(document).on("keypress", setLabelHandler);

        const label_position = preferences.get("label-positioning");
        const opts: GobanCanvasConfig = {
            board_div: goban_div.current,
            move_tree_container: ref_move_tree_container.current,
            interactive: true,
            connect_to_chat: true,
            isInPushedAnalysis: () => game_control.in_pushed_analysis,
            leavePushedAnalysis: () => {
                if (game_control.onPushAnalysisLeft) {
                    game_control.onPushAnalysisLeft();
                }
            },
            game_id: null,
            review_id: null,
            draw_top_labels: label_position === "all" || label_position.indexOf("top") >= 0,
            draw_left_labels: label_position === "all" || label_position.indexOf("left") >= 0,
            draw_right_labels: label_position === "all" || label_position.indexOf("right") >= 0,
            draw_bottom_labels: label_position === "all" || label_position.indexOf("bottom") >= 0,
            display_width: Math.min(
                ref_goban_container.current?.offsetWidth || 0,
                ref_goban_container.current?.offsetHeight || 0,
            ),
            visual_undo_request_indicator: preferences.get("visual-undo-request-indicator"),
            onScoreEstimationUpdated: () => {
                goban.current.redraw(true);
            },
        };

        if (opts.display_width <= 0) {
            const I = setInterval(() => {
                onResize(true);
                setTimeout(() => {
                    if (
                        !goban ||
                        (ref_goban_container.current &&
                            Math.min(
                                ref_goban_container.current.offsetWidth,
                                ref_goban_container.current.offsetHeight,
                            ) > 0)
                    ) {
                        clearInterval(I);
                    }
                }, 1);
            }, 500);
        }

        if (game_id) {
            opts.game_id = game_id;
        }
        if (review_id) {
            opts.review_id = review_id;
            opts.isPlayerOwner = () => goban.current.review_owner_id === data.get("user").id;
            opts.isPlayerController = () =>
                goban.current.review_controller_id === data.get("user").id;
        }

        goban.current = new Goban(opts);
        game_control.goban = goban.current;
        onResize(true);
        window["global_goban"] = goban.current;
        if (review_id) {
            goban.current.setMode("analyze");
        }

        goban.current.on("submitting-move", (tf) => {
            set_submitting_move(tf);
        });
        goban.current.on("gamedata", () => {
            const user = data.get("user");
            try {
                if (
                    user.is_moderator &&
                    (user.id in (goban.current.engine.player_pool || {}) ||
                        user.id === goban.current.engine.config.white_player_id ||
                        user.id === goban.current.engine.config.black_player_id)
                ) {
                    const channel = `game-${game_id}`;
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
        set_score(goban.current.engine.computeScore(true));

        if (preferences.get("dynamic-title")) {
            /* Title Updates { */
            const last_title = window.document.title;
            last_move_viewed.current = 0;
            on_refocus_title.current = last_title;
            goban.current.on("state_text", (state) => {
                on_refocus_title.current = state.title;
                if (state.show_moves_made_count) {
                    if (!goban) {
                        window.document.title = state.title;
                        return;
                    }
                    if (document.hasFocus()) {
                        last_move_viewed.current = goban.current.engine.getMoveNumber();
                        window.document.title = state.title;
                    } else {
                        const diff =
                            goban.current.engine.getMoveNumber() - last_move_viewed.current;
                        window.document.title = interpolate(_("(%s) moves made"), [diff]);
                    }
                } else {
                    window.document.title = state.title;
                }
            });
            /* } */
        }

        bindAudioEvents(goban.current);

        goban.current.on("clock", (clock: JGOFClock) => {
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
                goban.current.setByoYomiLabel(null);
                return;
            }

            let ms_left = 0;
            const player_clock =
                clock.current_player === "black" ? clock.black_clock : clock.white_clock;
            if (player_clock.main_time > 0) {
                ms_left = player_clock.main_time;
                if (
                    goban.current.engine.time_control.system === "byoyomi" ||
                    goban.current.engine.time_control.system === "canadian"
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
                        goban.current.setByoYomiLabel((every_second_start - seconds).toString());
                    }
                } else {
                    goban.current.setByoYomiLabel(seconds.toString());
                }
            } else {
                goban.current.setByoYomiLabel(null);
            }
        });

        /* Ensure our state is kept up to date */
        const sync_show_submit = () => {
            set_show_submit(
                !!goban.current.submit_move &&
                    goban.current.engine.cur_move &&
                    goban.current.engine.cur_move.parent &&
                    goban.current.engine.last_official_move &&
                    goban.current.engine.cur_move.parent.id ===
                        goban.current.engine.last_official_move.id,
            );
        };

        const sync_resign_text = () => {
            if (goban.current.engine.gameCanBeCanceled()) {
                set_resign_text(_("Cancel game"));
                set_resign_mode("cancel");
            } else {
                set_resign_text(_("Resign"));
                set_resign_mode("resign");
            }
        };

        const sync_move_text = () => set_move_text(goban.current.engine.cur_move?.text || "");

        const sync_show_undo_requested = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            set_show_undo_requested(
                goban.current.engine.undo_requested ===
                    goban.current.engine.last_official_move.move_number,
            );
        };

        const sync_show_accept_undo = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            set_show_accept_undo(
                goban.current.engine.playerToMove() === data.get("user").id ||
                    (goban.current.submit_move != null &&
                        goban.current.engine.playerNotToMove() === data.get("user").id) ||
                    null,
            );
        };
        const sync_show_title = () =>
            set_show_title(
                !goban.current.submit_move ||
                    goban.current.engine.playerToMove() !== data.get("user").id ||
                    null,
            );

        const sync_move_info = () => {
            set_player_to_move(goban.current.engine.playerToMove());
            set_player_not_to_move(goban.current.engine.playerNotToMove());

            const real_player_to_move =
                goban.current.engine.last_official_move?.player === JGOFNumericPlayerColor.BLACK
                    ? goban.current.engine.players.white.id
                    : goban.current.engine.players.black.id;
            set_is_my_move(real_player_to_move === data.get("user").id);
        };

        const sync_stone_removal = () => {
            const engine = goban.current.engine;
            if (engine.phase === "stone removal") {
                const stone_removals = engine.getStoneRemovalString();

                if (stone_removal_accept_timeout.current) {
                    clearTimeout(stone_removal_accept_timeout.current);
                }

                // TODO: Convert this way old jquery crap to React
                const gsra = $("#game-stone-removal-accept");
                gsra.prop("disabled", true);
                stone_removal_accept_timeout.current = setTimeout(
                    () => {
                        gsra.prop("disabled", false);
                        stone_removal_accept_timeout.current = null;
                    },
                    device.is_mobile ? 3000 : 1500,
                );

                set_black_accepted(engine.players["black"].accepted_stones === stone_removals);
                set_white_accepted(engine.players["white"].accepted_stones === stone_removals);
            }

            if (
                (engine.phase === "stone removal" || engine.phase === "finished") &&
                engine.outcome !== "Timeout" &&
                engine.outcome !== "Disconnection" &&
                engine.outcome !== "Resignation" &&
                engine.outcome !== "Abandonment" &&
                engine.outcome !== "Cancellation" &&
                goban.current.mode === "play"
            ) {
                const s = engine.computeScore(false);
                set_score(s);
                goban.current.showScores(s);
            } else {
                set_score(engine.computeScore(true));
            }
        };

        const sync_conditional_tree = () => {
            if (goban.current.mode === "conditional") {
                const tree = $(conditional_move_tree.current);
                tree.empty();
                selected_conditional_move.current = null;
                conditional_move_list.current = [];
                const elts = createConditionalMoveTreeDisplay(
                    goban.current,
                    selected_conditional_move,
                    conditional_move_list,
                    goban.current.conditional_tree,
                    "",
                    goban.current.conditional_starting_color === "black",
                );
                for (let i = 0; i < elts.length; ++i) {
                    tree.append(elts[i]);
                }
            }
        };

        const sync_review_out_of_sync = () => {
            const engine = goban.current.engine;
            set_review_out_of_sync(
                engine.cur_move &&
                    engine.cur_review_move &&
                    engine.cur_move.id !== engine.cur_review_move.id,
            );
        };

        const onLoad = () => {
            const engine = goban.current.engine;
            set_mode(goban.current.mode);
            set_phase(engine.phase);
            set_title(goban.current.title);
            set_cur_move_number(engine.cur_move?.move_number || -1);
            set_official_move_number(engine.last_official_move?.move_number || -1);
            set_analyze_tool(goban.current.analyze_tool);
            set_analyze_subtool(goban.current.analyze_subtool);
            set_review_owner_id(goban.current.review_owner_id);
            set_review_controller_id(goban.current.review_controller_id);

            set_strict_seki_mode(engine.strict_seki_mode);
            set_rules(engine.rules);
            set_winner(goban.current.engine.winner);
            set_score_estimate_winner(undefined);
            set_undo_requested(engine.undo_requested);
            set_paused(goban.current.pause_control && !!goban.current.pause_control.paused);

            sync_show_submit();
            sync_resign_text();
            sync_move_text();
            sync_show_undo_requested();
            sync_show_accept_undo();
            sync_show_title();
            sync_move_info();
            sync_stone_removal();
            sync_conditional_tree();
            sync_review_out_of_sync();

            // These are only updated on load events
            set_user_is_player(engine.isParticipant(data.get("user").id));

            // I have no recollection of this code and why I thought it was necessary. If you find
            // this code after 2022-06-01, feel free to remove it. - anoek 2022-04-19
            // If we do need it, it needs to be implemented as some function that listens for phase
            // changes.
            /*
            if (phase && engine.phase && phase !== engine.phase && engine.phase === "finished") {
                if (return_url.current && !return_url_debounce.current) {
                    return_url_debounce.current = true;
                    console.log("Transition from ", phase, " to ", engine.phase);
                    setTimeout(() => {
                        if (
                            confirm(
                                interpolate(_("Would you like to return to {{url}}?"), {
                                    url: return_url.current,
                                }),
                            )
                        ) {
                            window.location.href = return_url.current;
                        }
                    }, 1500);
                }
            }
            */
        };

        goban.current.on("load", onLoad);
        onLoad();

        goban.current.on("mode", set_mode);
        goban.current.on("phase", set_phase);
        goban.current.on("title", set_title);
        goban.current.on("cur_move", (move) => set_cur_move_number(move.move_number));
        goban.current.on("last_official_move", (move) =>
            set_official_move_number(move.move_number),
        );
        goban.current.on("analyze_tool", set_analyze_tool);
        goban.current.on("analyze_subtool", set_analyze_subtool);
        goban.current.on("strict_seki_mode", set_strict_seki_mode);
        goban.current.on("rules", set_rules);
        goban.current.on("winner", set_winner);
        goban.current.on("score_estimate", (est) => {
            set_score_estimate_winner(est?.winner || "");
            set_score_estimate_amount(est?.amount || "");
        });
        goban.current.on("undo_requested", set_undo_requested);
        goban.current.on("submit_move", sync_show_submit);
        goban.current.on("last_official_move", sync_show_submit);
        goban.current.on("cur_move", sync_show_submit);
        goban.current.on("cur_move", sync_resign_text);
        goban.current.on("cur_move", sync_move_text);
        goban.current.on("undo_requested", sync_show_undo_requested);
        goban.current.on("last_official_move", sync_show_undo_requested);
        goban.current.on("cur_move", sync_show_title);
        goban.current.on("cur_move", sync_show_accept_undo);
        goban.current.on("submit_move", sync_show_title);
        goban.current.on("submit_move", sync_show_accept_undo);
        goban.current.on("cur_move", sync_move_info);
        goban.current.on("last_official_move", sync_move_info);
        goban.current.on("paused", set_paused);
        goban.current.on("review_owner_id", set_review_owner_id);
        goban.current.on("review_controller_id", set_review_controller_id);

        goban.current.on("phase", sync_stone_removal);
        goban.current.on("mode", sync_stone_removal);
        goban.current.on("outcome", sync_stone_removal);
        goban.current.on("stone-removal.accepted", sync_stone_removal);
        goban.current.on("mode", sync_conditional_tree);
        goban.current.on("conditional-moves.updated", sync_conditional_tree);
        goban.current.on("cur_move", sync_review_out_of_sync);

        /* END sync_state port */

        goban.current.on("move-made", autoadvance);
        goban.current.on("player-update", processPlayerUpdate);
        //goban.current.on("update", () => sync_state());
        //goban.current.on("reset", () => sync_state());
        goban.current.on("gamedata", onResize);

        goban.current.on("gamedata", (gamedata) => {
            try {
                if (isLiveGame(gamedata.time_control)) {
                    goban.current.one_click_submit = preferences.get("one-click-submit-live");
                    goban.current.double_click_submit = preferences.get("double-click-submit-live");
                } else {
                    goban.current.one_click_submit = preferences.get(
                        "one-click-submit-correspondence",
                    );
                    goban.current.double_click_submit = preferences.get(
                        "double-click-submit-correspondence",
                    );
                }
                goban.current.variation_stone_transparency = preferences.get(
                    "variation-stone-transparency",
                );
                goban.current.visual_undo_request_indicator = preferences.get(
                    "visual-undo-request-indicator",
                );
            } catch (e) {
                console.error(e.stack);
            }
        });

        goban.current.on("played-by-click", (event) => {
            const target = ref_move_tree_container.current.getBoundingClientRect();
            popover({
                elt: <PlayerDetails playerId={event.player_id} />,
                at: { x: event.x + target.x, y: event.y + target.y },
                minWidth: 240,
                minHeight: 250,
            });
        });

        if (params.move_number) {
            goban.current.once("gamedata", () => {
                nav_goto_move(parseInt(params.move_number));
            });
        }

        goban.current.on("auto-resign", (data) => {
            if (goban.current.engine && data.player_id === goban.current.engine.players.black.id) {
                set_black_auto_resign_expiration(
                    new Date(data.expiration - get_network_latency() + get_clock_drift()),
                );
            }
            if (goban.current.engine && data.player_id === goban.current.engine.players.white.id) {
                set_white_auto_resign_expiration(
                    new Date(data.expiration - get_network_latency() + get_clock_drift()),
                );
            }
        });
        goban.current.on("clear-auto-resign", (data) => {
            if (goban.current.engine && data.player_id === goban.current.engine.players.black.id) {
                set_black_auto_resign_expiration(null);
            }
            if (goban.current.engine && data.player_id === goban.current.engine.players.white.id) {
                set_white_auto_resign_expiration(null);
            }
        });

        if (review_id) {
            goban.current.on("review.sync-to-current-move", () => {
                syncToCurrentReviewMove();
            });

            let stashed_move_string = null;
            let stashed_review_id = null;
            /* If we lose connection, save our place when we reconnect so we can jump to it. */
            goban.current.on("review.load-start", () => {
                if (goban.current.review_controller_id !== data.get("user").id) {
                    return;
                }

                stashed_review_id = goban.current.review_id;
                stashed_move_string = goban.current.engine.cur_move.getMoveStringToThisPoint();
                if (stashed_move_string.length === 0) {
                    stashed_review_id = null;
                    stashed_move_string = null;
                }
            });
            goban.current.on("review.load-end", () => {
                if (goban.current.review_controller_id !== data.get("user").id) {
                    return;
                }

                if (stashed_move_string && stashed_review_id === goban.current.review_id) {
                    const prev_last_review_message = goban.current.getLastReviewMessage();
                    const moves = GoMath.decodeMoves(
                        stashed_move_string,
                        goban.current.width,
                        goban.current.height,
                    );

                    goban.current.engine.jumpTo(goban.current.engine.move_tree);
                    for (const move of moves) {
                        if (move.edited) {
                            goban.current.engine.editPlace(move.x, move.y, move.color, false);
                        } else {
                            goban.current.engine.place(
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
                        goban.current.setLastReviewMessage(prev_last_review_message);
                        goban.current.syncReviewMove();
                    }, 100);
                }
            });
        }

        if (game_id) {
            get("games/%%", game_id)
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
                    game_control.creator_id = game.creator;
                    ladder_id.current = game.ladder;
                    tournament_id.current = game.tournament;

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

                    set_review_list(review_list);
                    set_annulled(game.annulled);
                    set_historical_black(game.historical_ratings.black);
                    set_historical_white(game.historical_ratings.white);

                    goban_div.current.setAttribute("data-game-id", game_id.toString());

                    if (ladder_id.current) {
                        goban_div.current.setAttribute(
                            "data-ladder-id",
                            ladder_id.current.toString(),
                        );
                    } else {
                        goban_div.current.removeAttribute("data-ladder-id");
                    }
                    if (tournament_id.current) {
                        goban_div.current.setAttribute(
                            "data-tournament-id",
                            tournament_id.current.toString(),
                        );
                    } else {
                        goban_div.current.removeAttribute("data-tournament-id");
                    }
                })
                .catch(ignore);
        }

        if (review_id) {
            get("reviews/%%", review_id)
                .then((review) => {
                    if (review.game) {
                        set_historical_black(review.game.historical_ratings.black);
                        set_historical_white(review.game.historical_ratings.white);
                    }
                })
                .catch(ignore);
        }
        /*** END initialize ***/

        if (ref_goban_container.current) {
            if (goban_view_mode() === "portrait") {
                ref_goban_container.current.style.minHeight = `${screen.width}px`;
            } else {
                ref_goban_container.current.style.minHeight = `initial`;
            }
        }
        onResize();

        return () => {
            console.log("unmounting, going to destroy", goban);
            chat_proxy.current.part();
            set_selected_chat_log("main");
            delete game_control.creator_id;
            ladder_id.current = null;
            tournament_id.current = null;
            $(document).off("keypress", setLabelHandler);
            try {
                if (goban.current) {
                    goban.current.destroy();
                }
            } catch (e) {
                console.error(e.stack);
            }
            goban.current = null;
            game_control.goban = null;
            if (resize_debounce.current) {
                clearTimeout(resize_debounce.current);
                resize_debounce.current = null;
            }
            if (autoplay_timer.current) {
                clearTimeout(autoplay_timer.current);
            }
            window["Game"] = null;
            window["global_goban"] = null;
            set_black_auto_resign_expiration(null);
            set_white_auto_resign_expiration(null);

            setExtraActionCallback(null);
            $(window).off("focus", onFocus);
            window.document.title = "OGS";
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class
            game_control.off("stopEstimatingScore", stopEstimatingScore);
            game_control.off("gotoMove", nav_goto_move);

            goban_div.current.childNodes.forEach((node) => node.remove());
        };
    }, [game_id, review_id]);

    /**********/
    /* RENDER */
    /**********/

    if (goban.current === null) {
        return null;
    }

    const CHAT = (
        <GameChat
            selected_chat_log={selected_chat_log}
            onSelectedChatModeChange={set_selected_chat_log}
            goban={goban.current}
            userIsPlayer={user_is_player}
            channel={game_id ? `game-${game_id}` : `review-${review_id}`}
            game_id={game_id}
            review_id={review_id}
        />
    );
    const review = !!review_id;

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
                {frag_kb_shortcuts()}
                <i onClick={toggleZenMode} className="leave-zen-mode-button ogs-zen-mode"></i>

                <div className="align-row-start"></div>
                <div className="left-col"></div>

                <div className="center-col">
                    {(view_mode === "portrait" || null) && frag_players()}

                    {(view_mode !== "portrait" || portrait_tab === "game" || null) && (
                        <div ref={ref_goban_container} className="goban-container">
                            <ReactResizeDetector
                                handleWidth
                                handleHeight
                                onResize={() => onResize()}
                            />
                            <PersistentElement className="Goban" elt={goban_div.current} />
                        </div>
                    )}

                    {frag_below_board_controls()}

                    {((view_mode === "square" && !squashed) || null) && CHAT}

                    {((view_mode === "portrait" && !zen_mode) || null) && frag_ai_review()}

                    {(view_mode === "portrait" || null) &&
                        (review ? frag_review_controls() : frag_play_controls(false))}

                    {((view_mode === "portrait" && !zen_mode) /* && portrait_tab === 'chat' */ ||
                        null) &&
                        CHAT}

                    {((view_mode === "portrait" &&
                        !zen_mode /* && portrait_tab === 'chat' */ &&
                        user_is_player &&
                        phase !== "finished") ||
                        null) &&
                        frag_cancel_button()}

                    {((view_mode === "portrait" && !zen_mode && portrait_tab === "game") || null) &&
                        frag_dock()}
                </div>

                {(view_mode !== "portrait" || null) && (
                    <div className="right-col">
                        {(zen_mode || null) && <div className="align-col-start"></div>}
                        {(view_mode === "square" || view_mode === "wide" || null) && frag_players()}

                        {(view_mode === "square" || view_mode === "wide" || null) &&
                            !zen_mode &&
                            frag_ai_review()}

                        {(view_mode === "square" || view_mode === "wide" || null) &&
                            show_game_timing &&
                            frag_timings()}

                        {review ? frag_review_controls() : frag_play_controls(true)}

                        {(view_mode === "wide" || null) && CHAT}
                        {((view_mode === "square" && squashed) || null) && CHAT}
                        {((view_mode === "square" && squashed) || null) && CHAT}

                        {frag_dock()}
                        {(zen_mode || null) && <div className="align-col-end"></div>}
                    </div>
                )}

                <div className="align-row-end"></div>
            </div>
        </div>
    );
}

function bindAudioEvents(goban: Goban): void {
    // called by init
    const user = data.get("user");
    //goban.on('audio-game-started', (obj:{ player_id: number }) => sfx.play("game_started"));

    goban.on("audio-enter-stone-removal", () => {
        sfx.stop();
        sfx.play("remove_the_dead_stones");
    });
    //goban.on('audio-enter-stone-removal', () => sfx.play('stone_removal'));
    goban.on("audio-resume-game-from-stone-removal", () => {
        sfx.stop();
        sfx.play("game_resumed");
    });

    goban.on("audio-game-paused", () => {
        if (goban.engine.phase === "play") {
            sfx.play("game_paused");
        }
    });
    goban.on("audio-game-resumed", () => {
        if (goban.engine.phase === "play") {
            sfx.play("game_resumed");
        }
    });
    goban.on("audio-stone", (stone) =>
        sfx.playStonePlacementSound(stone.x, stone.y, stone.width, stone.height, stone.color),
    );
    goban.on("audio-pass", () => sfx.play("pass"));
    goban.on("audio-undo-requested", () => sfx.play("undo_requested"));
    goban.on("audio-undo-granted", () => sfx.play("undo_granted"));

    goban.on("audio-capture-stones", (obj: { count: number; already_captured: number }) => {
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
    });

    {
        // Announce when *we* have disconnected / reconnected
        let disconnected = false;
        let debounce: ReturnType<typeof setTimeout> | null;
        let cur_sound: SFXSprite;
        let can_play_disconnected_sound = false;

        setTimeout(() => (can_play_disconnected_sound = true), 3000);

        goban.on("audio-disconnected", () => {
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
        goban.on("audio-reconnected", () => {
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

        goban.on("audio-other-player-disconnected", (who: { player_id: number }) => {
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
                if (goban.engine.playerColor(user?.id) === "invalid") {
                    // spectating? don't say opponent
                    cur_sound = sfx.play("player_disconnected");
                } else {
                    cur_sound = sfx.play("your_opponent_has_disconnected");
                }
                debounce = null;
            }, 5000); // don't play "your opponent has disconnected" if they are just reloading the page
        });
        goban.on("audio-other-player-reconnected", (who: { player_id: number }) => {
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
            if (goban.engine.playerColor(user?.id) === "invalid") {
                // spectating? don't say opponent
                cur_sound = sfx.play("player_reconnected");
            } else {
                cur_sound = sfx.play("your_opponent_has_reconnected");
            }
        });
    }

    goban.on("audio-game-ended", (winner: "black" | "white" | "tie") => {
        const user = data.get("user");
        const color = goban.engine.playerColor(user?.id);

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
    let paused = false;

    goban.on("audio-game-paused", () => (paused = true));
    goban.on("audio-game-resumed", () => (paused = false));

    goban.on("audio-clock", (audio_clock_event: AudioClockEvent) => {
        const user = data.get("user");
        if (user.anonymous) {
            //console.log("anon");
            return;
        }

        if (paused) {
            //console.log("paused");
            return;
        }

        if (user.id.toString() !== audio_clock_event.player_id.toString()) {
            //console.log("not user");
            return;
        }

        const tick_tock_start = preferences.get("sound.countdown.tick-tock.start") as number;
        const ten_seconds_start = preferences.get("sound.countdown.ten-seconds.start") as number;
        const five_seconds_start = preferences.get("sound.countdown.five-seconds.start") as number;
        const every_second_start = preferences.get("sound.countdown.every-second.start") as number;
        const count_direction = preferences.get("sound.countdown.byoyomi-direction") as string;
        let count_direction_auto = "down";
        if (count_direction === "auto") {
            count_direction_auto =
                current_language === "ja" || current_language === "ko" ? "up" : "down";
        }

        const count_direction_computed =
            count_direction !== "auto" ? count_direction : count_direction_auto;
        const time_control = goban.engine.time_control;

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
        } else if (
            audio_clock_event.in_overtime &&
            time_control.system === "byoyomi" &&
            seconds_left === time_control.period_time
        ) {
            // when we're in a byo-yomi period that we've announced and our turn
            // just began, don't play the top second sound - otherwise it plays
            // really fast and the next second sound starts sounding out too quickly.
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

function createConditionalMoveTreeDisplay(
    goban: Goban,
    selected_conditional_move: React.MutableRefObject<any | undefined>,
    conditional_move_list: React.MutableRefObject<any[]>,
    root: any,
    cpath: string,
    blacks_move: boolean,
) {
    const mkcb = (path: string) => {
        return () => {
            goban.jumpToLastOfficialMove();
            goban.followConditionalPath(path);
            goban.redraw();
        };
    };
    const mkdelcb = (path: string) => {
        return () => {
            goban.jumpToLastOfficialMove();
            goban.deleteConditionalPath(path);
            goban.redraw();
        };
    };

    const color1 = blacks_move ? "black" : "white";
    const color2 = blacks_move ? "white" : "black";

    let ret = null;
    const ul = $("<ul>").addClass("tree");
    if (root.move) {
        if (cpath + root.move === goban.getCurrentConditionalPath()) {
            selected_conditional_move.current = cpath + root.move;
        }
        conditional_move_list.current.push(cpath + root.move);

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
                .addClass(cpath + root.move === goban.getCurrentConditionalPath() ? "selected" : "")
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
            selected_conditional_move.current = cpath + ch;
        }
        conditional_move_list.current.push(cpath + ch);

        const li = $("<li>").addClass("move-row");
        const mv = goban.engine.decodeMoves(ch)[0];
        const span = $("<span>")
            .addClass("entry")
            .append($("<span>").addClass("stone " + color1))
            .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
            .addClass(cpath + ch === goban.getCurrentConditionalPath() ? "selected" : "")
            .click(mkcb(cpath + ch));
        li.append(span);

        const elts = createConditionalMoveTreeDisplay(
            goban,
            selected_conditional_move,
            conditional_move_list,
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
