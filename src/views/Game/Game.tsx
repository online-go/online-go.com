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
import * as preferences from "preferences";
import * as React from "react";
import ReactResizeDetector from "react-resize-detector";
import { useParams } from "react-router-dom";
import { browserHistory } from "ogsHistory";
import { _, interpolate, current_language } from "translate";
import { popover } from "popover";
import { post, get } from "requests";
import { KBShortcut } from "KBShortcut";
import { UIPush } from "UIPush";
import { errorAlerter, ignore } from "misc";
import {
    Goban,
    GobanCanvas,
    GobanCanvasConfig,
    GoMath,
    MoveTree,
    AudioClockEvent,
    Score,
    GoEnginePhase,
    GobanModes,
    JGOFPlayerSummary,
    GoConditionalMove,
    AnalysisTool,
} from "goban";
import { isLiveGame } from "TimeControl";
import { get_network_latency, get_clock_drift } from "sockets";
import { setExtraActionCallback, PlayerDetails } from "Player";
import * as player_cache from "player_cache";
import { notification_manager } from "Notifications";
import { PersistentElement } from "PersistentElement";
import { Resizable } from "Resizable";
import { chat_manager, ChatChannelProxy } from "chat_manager";
import { sfx, SFXSprite, ValidSound } from "sfx";
import { AIReview } from "./AIReview";
import { GameChat, ChatMode } from "./GameChat";
import { JGOFClock } from "goban";
import { GameTimings } from "./GameTimings";
import { goban_view_mode, goban_view_squashed, ViewMode, shared_ip_with_player_map } from "./util";
import { game_control } from "./game_control";
import { PlayerCards } from "./PlayerCards";
import {
    EstimateScore,
    PlayControls,
    AnalyzeButtonBar,
    copyBranch,
    pasteBranch,
    deleteBranch,
    ReviewControls,
} from "./PlayControls";
import { CancelButton } from "./PlayButtons";
import { GameDock } from "./GameDock";
import swal from "sweetalert2";
import { useUserIsParticipant } from "./GameHooks";

const win = $(window);

export function Game(): JSX.Element {
    const params = useParams<"game_id" | "review_id" | "move_number">();

    const game_id = params.game_id ? parseInt(params.game_id) : 0;
    const review_id = params.review_id ? parseInt(params.review_id) : 0;

    /* Refs */
    const ref_goban_container = React.useRef<HTMLDivElement>();
    const ref_move_tree_container = React.useRef<HTMLElement>();
    const ladder_id = React.useRef<number>();
    const tournament_id = React.useRef<number>();
    const goban_div = React.useRef<HTMLDivElement | null>();
    const resize_debounce = React.useRef<any>();
    const autoplay_timer = React.useRef<any>();
    const chat_proxy = React.useRef<ChatChannelProxy>();
    const last_analysis_sent = React.useRef<any>();
    const on_refocus_title = React.useRef<string>("OGS");
    const last_move_viewed = React.useRef<number>(0);
    const stashed_conditional_moves = React.useRef<GoConditionalMove>();
    const copied_node = React.useRef<MoveTree>();
    const white_username = React.useRef<string>("White");
    const black_username = React.useRef<string>("Black");
    const goban = React.useRef<Goban>(null);

    /* State */
    const [view_mode, set_view_mode] = React.useState<ViewMode>(goban_view_mode());
    const [squashed, set_squashed] = React.useState<boolean>(goban_view_squashed());
    const [estimating_score, set_estimating_score] = React.useState<boolean>(false);
    const [analyze_pencil_color, set_analyze_pencil_color] = React.useState<string>("#004cff");
    const user_is_player = useUserIsParticipant(goban.current);
    const [zen_mode, set_zen_mode] = React.useState(false);
    const [autoplaying, set_autoplaying] = React.useState(false);
    const [review_list, set_review_list] = React.useState([]);
    const [selected_chat_log, set_selected_chat_log] = React.useState<ChatMode>("main");
    const [variation_name, set_variation_name] = React.useState("");
    const [historical_black, set_historical_black] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [historical_white, set_historical_white] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [annulled, set_annulled] = React.useState(false);
    const [black_auto_resign_expiration, set_black_auto_resign_expiration] =
        React.useState<Date>(null);
    const [white_auto_resign_expiration, set_white_auto_resign_expiration] =
        React.useState<Date>(null);
    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        preferences.get("ai-review-enabled"),
    );
    const [phase, set_phase] = React.useState<GoEnginePhase>();
    const [selected_ai_review_uuid, set_selected_ai_review_uuid] = React.useState<string | null>(
        null,
    );
    const [show_game_timing, set_show_game_timing] = React.useState(false);
    const [score, set_score] = React.useState<Score>();

    const [title, set_title] = React.useState<string>();

    const [mode, set_mode] = React.useState<GobanModes>("play");
    const [score_estimate_winner, set_score_estimate_winner] = React.useState<string>();
    const [score_estimate_amount, set_score_estimate_amount] = React.useState<number>();
    const [show_title, set_show_title] = React.useState<boolean>();
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
        step();

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
        if (goban.current) {
            goban.current.setGameClock(goban.current.last_clock);
        }

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

        if (goban.current) {
            goban.current.setSquareSizeBasedOnDisplayWidth(
                Math.min(
                    ref_goban_container.current.offsetWidth,
                    ref_goban_container.current.offsetHeight,
                ),
            );
        }

        recenterGoban();
    };
    const setAnalyzeTool = (tool: AnalysisTool | "erase", subtool: string) => {
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
    const updateVariationName = (ev) => {
        set_variation_name((ev.target as HTMLInputElement).value);
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
            last_analysis_sent.current = analysis;
        } else {
            goban.current.message("Can't send to the " + selected_chat_log + " chat_log");
        }
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
        if (!goban.current) {
            return;
        }
        goban.current.setScoringMode(false);
        goban.current.hideScores();
        goban.current.score_estimate = null;
    };
    const enterConditionalMovePlanner = () => {
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
    const stopEstimatingScore = (): MoveTree | null => {
        if (!estimating_score) {
            return null;
        }
        set_estimating_score(false);
        if (!goban.current) {
            return null;
        }
        const ret = goban.current.setScoringMode(false);
        goban.current.hideScores();
        goban.current.score_estimate = null;
        return ret;
    };

    const goban_setModeDeferredPlay = () => {
        goban.current.setModeDeferred("play");
    };
    const goban_deleteBranch = () => deleteBranch(goban.current, mode);
    const goban_copyBranch = () => copyBranch(goban.current, copied_node, mode);
    const goban_pasteBranch = () => pasteBranch(goban.current, copied_node, mode);

    /* Review stuff */

    const variationKeyPress = (ev) => {
        if (ev.keyCode === 13) {
            shareAnalysis();
            return false;
        }
    };
    const frag_estimate_score = () => (
        <EstimateScore
            score_estimate_winner={score_estimate_winner}
            score_estimate_amount={score_estimate_amount}
        />
    );
    const frag_analyze_button_bar = () => {
        return (
            <AnalyzeButtonBar
                setAnalyzePencilColor={set_analyze_pencil_color}
                analyze_pencil_color={analyze_pencil_color}
                setAnalyzeTool={setAnalyzeTool}
                goban={goban.current}
                forceUpdate={forceUpdate}
                is_review={!!review_id}
                mode={mode}
                copied_node={copied_node}
            />
        );
    };
    const frag_review_controls = () => (
        <ReviewControls
            mode={mode}
            goban={goban.current}
            review_id={review_id}
            renderEstimateScore={frag_estimate_score}
            renderAnalyzeButtonBar={frag_analyze_button_bar}
            setMoveTreeContainer={setMoveTreeContainer}
            onShareAnalysis={shareAnalysis}
            variation_name={variation_name}
            updateVariationName={updateVariationName}
            variationKeyPress={variationKeyPress}
            selected_chat_log={selected_chat_log}
            stopEstimatingScore={stopEstimatingScore}
        />
    );
    const frag_play_controls = (show_cancel: boolean) => (
        <PlayControls
            goban={goban.current}
            show_cancel={show_cancel}
            review_list={review_list}
            stashed_conditional_moves={stashed_conditional_moves.current}
            mode={mode}
            phase={phase}
            title={title}
            show_title={show_title}
            renderEstimateScore={frag_estimate_score}
            renderAnalyzeButtonBar={frag_analyze_button_bar}
            setMoveTreeContainer={setMoveTreeContainer}
            onShareAnalysis={shareAnalysis}
            variation_name={variation_name}
            updateVariationName={updateVariationName}
            variationKeyPress={variationKeyPress}
            annulled={annulled}
            zen_mode={zen_mode}
            selected_chat_log={selected_chat_log}
            stopEstimatingScore={stopEstimatingScore}
        />
    );

    const frag_ai_review = () => {
        if (
            goban &&
            goban.current.engine &&
            goban.current.engine.phase === "finished" &&
            goban.current.engine.game_id === game_id &&
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

    const frag_below_board_controls = () => {
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

    const setMoveTreeContainer = (resizable: Resizable): void => {
        ref_move_tree_container.current = resizable ? resizable.div : null;
        if (goban.current) {
            (goban.current as GobanCanvas).setMoveTreeContainer(ref_move_tree_container.current);
        }
    };

    /* Constructor */
    React.useEffect(() => {
        game_control.last_variation_number = 0;

        goban_div.current = document.createElement("div");
        goban_div.current.className = "Goban";
        /* end constructor */

        set_estimating_score(false);
        set_autoplaying(false);
        set_review_list([]);
        set_historical_black(null);
        set_historical_white(null);

        game_control.on("stopEstimatingScore", stopEstimatingScore);
        game_control.on("gotoMove", nav_goto_move);

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
                        data.set(`moderator.join-game-publicly.${channel}`, true);
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

        const sync_show_title = () =>
            set_show_title(
                !goban.current.submit_move ||
                    goban.current.engine.playerToMove() !== data.get("user").id ||
                    null,
            );

        const sync_stone_removal = () => {
            const engine = goban.current.engine;

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

        const onLoad = () => {
            const engine = goban.current.engine;
            set_mode(goban.current.mode);
            set_phase(engine.phase);
            set_title(goban.current.title);

            set_score_estimate_winner(undefined);
            set_undo_requested(engine.undo_requested);

            sync_show_title();
            sync_stone_removal();

            // These are only updated on load events

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
        goban.current.on("phase", () => goban.current.engine.cur_move.clearMarks());
        goban.current.on("title", set_title);
        goban.current.on("cur_move", () => set_score(goban.current.engine.computeScore(true)));
        goban.current.on("score_estimate", (est) => {
            set_score_estimate_winner(est?.winner || "");
            set_score_estimate_amount(est?.amount);
        });
        goban.current.on("undo_requested", set_undo_requested);
        goban.current.on("cur_move", sync_show_title);
        goban.current.on("submit_move", sync_show_title);

        goban.current.on("phase", sync_stone_removal);
        goban.current.on("mode", sync_stone_removal);
        goban.current.on("outcome", sync_stone_removal);
        goban.current.on("stone-removal.accepted", sync_stone_removal);
        goban.current.on("stone-removal.updated", sync_stone_removal);

        /* END sync_state port */

        goban.current.on("move-made", autoadvance);
        goban.current.on("player-update", processPlayerUpdate);
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

    const CHAT = zen_mode ? null : (
        <GameChat
            selected_chat_log={selected_chat_log}
            onSelectedChatModeChange={set_selected_chat_log}
            goban={goban.current}
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
                    {(view_mode === "portrait" || null) && (
                        <PlayerCards
                            goban={goban.current}
                            historical_black={historical_black}
                            historical_white={historical_white}
                            black_auto_resign_expiration={black_auto_resign_expiration}
                            white_auto_resign_expiration={white_auto_resign_expiration}
                            game_id={game_id}
                            review_id={review_id}
                            estimating_score={estimating_score}
                            zen_mode={zen_mode}
                            score={score}
                            show_title={show_title}
                            title={title}
                        />
                    )}

                    <div ref={ref_goban_container} className="goban-container">
                        <ReactResizeDetector handleWidth handleHeight onResize={() => onResize()} />
                        <PersistentElement className="Goban" elt={goban_div.current} />
                    </div>

                    {frag_below_board_controls()}

                    {((view_mode === "square" && !squashed) || null) && CHAT}

                    {((view_mode === "portrait" && !zen_mode) || null) && frag_ai_review()}

                    {(view_mode === "portrait" || null) &&
                        (review ? frag_review_controls() : frag_play_controls(false))}

                    {((view_mode === "portrait" && !zen_mode) || null) && CHAT}

                    {((view_mode === "portrait" &&
                        !zen_mode &&
                        user_is_player &&
                        phase !== "finished") ||
                        null) && <CancelButton goban={goban.current} className="bold reject" />}

                    {((view_mode === "portrait" && !zen_mode) || null) && (
                        <GameDock
                            goban={goban.current}
                            annulled={annulled}
                            review_id={review_id}
                            game_id={game_id}
                            selected_ai_review_uuid={selected_ai_review_uuid}
                            tournament_id={tournament_id.current}
                            ladder_id={ladder_id.current}
                            ai_review_enabled={ai_review_enabled}
                            historical_black={historical_black}
                            historical_white={historical_white}
                            onZenClicked={toggleZenMode}
                            onCoordinatesClicked={toggleCoordinates}
                            onAIReviewClicked={toggleAIReview}
                            onAnalyzeClicked={gameAnalyze}
                            onConditionalMovesClicked={enterConditionalMovePlanner}
                            onPauseClicked={pauseGame}
                            onEstimateClicked={estimateScore}
                            onGameAnnulled={set_annulled}
                            onTimingClicked={toggleShowTiming}
                            onCoordinatesMarked={gameLogModalMarkCoords}
                            onReviewClicked={startReview}
                        />
                    )}
                </div>

                {(view_mode !== "portrait" || null) && (
                    <div className="right-col">
                        {(zen_mode || null) && <div className="align-col-start"></div>}
                        {(view_mode === "square" || view_mode === "wide" || null) && (
                            <PlayerCards
                                goban={goban.current}
                                historical_black={historical_black}
                                historical_white={historical_white}
                                black_auto_resign_expiration={black_auto_resign_expiration}
                                white_auto_resign_expiration={white_auto_resign_expiration}
                                game_id={game_id}
                                review_id={review_id}
                                estimating_score={estimating_score}
                                zen_mode={zen_mode}
                                score={score}
                                show_title={show_title}
                                title={title}
                            />
                        )}

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

                        <GameDock
                            goban={goban.current}
                            annulled={annulled}
                            review_id={review_id}
                            game_id={game_id}
                            selected_ai_review_uuid={selected_ai_review_uuid}
                            tournament_id={tournament_id.current}
                            ladder_id={ladder_id.current}
                            ai_review_enabled={ai_review_enabled}
                            historical_black={historical_black}
                            historical_white={historical_white}
                            onZenClicked={toggleZenMode}
                            onCoordinatesClicked={toggleCoordinates}
                            onAIReviewClicked={toggleAIReview}
                            onAnalyzeClicked={gameAnalyze}
                            onConditionalMovesClicked={enterConditionalMovePlanner}
                            onPauseClicked={pauseGame}
                            onEstimateClicked={estimateScore}
                            onGameAnnulled={set_annulled}
                            onTimingClicked={toggleShowTiming}
                            onCoordinatesMarked={gameLogModalMarkCoords}
                            onReviewClicked={startReview}
                        />
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

    goban.on("audio-enter-stone-removal", () => {
        sfx.stop();
        sfx.play("remove_the_dead_stones");
    });
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
                if (winner === color) {
                    sfx.play("you_have_won");
                } else {
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
            return;
        }

        if (paused) {
            return;
        }

        if (user.id.toString() !== audio_clock_event.player_id.toString()) {
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
