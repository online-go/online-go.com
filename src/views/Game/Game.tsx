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
import { browserHistory } from "@/lib/ogsHistory";
import { _, interpolate, current_language } from "@/lib/translate";
import { popover } from "@/lib/popover";
import { post, get, abort_requests_in_flight } from "@/lib/requests";
import { KBShortcut } from "@/components/KBShortcut";
import { UIPush } from "@/components/UIPush";
import { errorAlerter, ignore, rulesText } from "@/lib/misc";
import {
    createGoban,
    GobanRenderer,
    GobanRendererConfig,
    MoveTree,
    AudioClockEvent,
    GobanEnginePhase,
    GobanModes,
    ConditionalMoveTree,
    AnalysisTool,
    JGOFNumericPlayerColor,
    JGOFSealingIntersection,
    encodeMove,
} from "goban";
import { isLiveGame } from "@/components/TimeControl";
import { setExtraActionCallback, PlayerDetails } from "@/components/Player";
import * as player_cache from "@/lib/player_cache";
import { notification_manager } from "@/components/Notifications";
import { Resizable } from "@/components/Resizable";
import { chat_manager, ChatChannelProxy, inGameModChannel } from "@/lib/chat_manager";
import { sfx, SFXSprite, ValidSound } from "@/lib/sfx";
import { AIReview } from "./AIReview";
import { AIDemoReview } from "./AIDemoReview";
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
import { alert } from "@/lib/swal_config";
import { useCurrentMove, useShowTitle, useTitle, useUserIsParticipant } from "./GameHooks";
import { GobanContainer } from "@/components/GobanContainer";
import { GobanContext } from "./goban_context";
import { is_valid_url } from "@/lib/url_validation";
import { disableTouchAction, enableTouchAction } from "./touch_actions";
import { BotDetectionResults } from "./BotDetectionResults";
import { ActiveTournament } from "@/lib/types";

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
    const autoplay_timer = React.useRef<any | undefined>(undefined);
    const chat_proxy = React.useRef<ChatChannelProxy | undefined>(undefined);
    const last_analysis_sent = React.useRef<any | undefined>(undefined);
    const on_refocus_title = React.useRef<string>("OGS");
    const last_move_viewed = React.useRef<number>(0);
    const stashed_conditional_moves = React.useRef<ConditionalMoveTree | undefined>(undefined);
    const copied_node = React.useRef<MoveTree | undefined>(undefined);
    const white_username = React.useRef<string>("White");
    const black_username = React.useRef<string>("Black");
    const goban = React.useRef<GobanRenderer | null>(null);
    const return_url_debounce = React.useRef<boolean>(false);
    const last_phase = React.useRef<string>("");
    const page_loaded_time = React.useRef<number>(Date.now()); // when we first created this view

    /* State */
    const [view_mode, set_view_mode] = React.useState<ViewMode>(goban_view_mode());
    const [squashed, set_squashed] = React.useState<boolean>(goban_view_squashed());
    const [estimating_score, _set_estimating_score] = React.useState<boolean>(false);
    const estimating_score_ref = React.useRef(estimating_score);
    const [analyze_pencil_color, _setAnalyzePencilColor] =
        preferences.usePreference("analysis.pencil-color");
    const user_is_player = useUserIsParticipant(goban.current);
    const [zen_mode, set_zen_mode] = React.useState(preferences.get("start-in-zen-mode"));
    const [autoplaying, set_autoplaying] = React.useState<boolean>(false);
    const [review_list, set_review_list] = React.useState<any[]>([]);
    const defaultChatMode = preferences.get("chat-mode") as ChatMode;
    const in_game_mod_channel = !review_id && inGameModChannel(game_id);
    const [selected_chat_log, set_selected_chat_log] = React.useState<ChatMode>(
        in_game_mod_channel ? "hidden" : defaultChatMode,
    );
    const [variation_name, set_variation_name] = React.useState("");
    const [historical_black, set_historical_black] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [historical_white, set_historical_white] = React.useState<rest_api.games.Player | null>(
        null,
    );
    const [black_flags, set_black_flags] = React.useState<null | rest_api.GamePlayerFlags>(null);
    const [white_flags, set_white_flags] = React.useState<null | rest_api.GamePlayerFlags>(null);
    const [annulled, set_annulled] = React.useState(false);
    const [annulment_reason, set_annulment_reason] =
        React.useState<rest_api.AnnulmentReason | null>(null);
    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        preferences.get("ai-review-enabled"),
    );
    const [scroll_to_navigate, _setScrollToNavigate] = React.useState(
        preferences.get("scroll-to-navigate"),
    );
    const [phase, set_phase] = React.useState<GobanEnginePhase>();
    const [selected_ai_review_uuid, set_selected_ai_review_uuid] = React.useState<string | null>(
        null,
    );
    const [show_game_timing, set_show_game_timing] = React.useState(false);

    const title = useTitle(goban.current);
    const cur_move = useCurrentMove(goban.current);
    const [tournament, set_tournament] = React.useState<ActiveTournament>();

    const [mode, set_mode] = React.useState<GobanModes>("play");
    const [score_estimate_winner, set_score_estimate_winner] = React.useState<string>();
    const [score_estimate_amount, set_score_estimate_amount] = React.useState<number>();
    const show_title = useShowTitle(goban.current);
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

    const setAnalyzePencilColor = (color: string) => {
        preferences.set("analysis.pencil-color", color);
        _setAnalyzePencilColor(color);
    };

    const auto_advance = () => {
        const user = data.get("user");

        if (!user.anonymous && /^\/game\//.test(getLocation())) {
            /* if we just moved */
            if (goban.current?.engine && goban.current.engine.playerNotToMove() === user.id) {
                const engine = goban.current.engine;
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
        if (goban?.current?.engine) {
            last_move_viewed.current = goban.current.engine.getMoveNumber();
        }
        window.document.title = on_refocus_title.current;
    };

    /*** Common stuff ***/
    const nav_up = () => {
        if (goban?.current?.mode === "conditional") {
            return;
        }

        const start = Date.now();
        checkAndEnterAnalysis();
        goban.current?.prevSibling();
        goban.current?.syncReviewMove();
        console.log("up", Date.now() - start);
    };
    const nav_down = () => {
        if (!goban.current) {
            return;
        }
        if (goban.current.mode === "conditional") {
            return;
        }

        const start = Date.now();
        checkAndEnterAnalysis();
        goban.current.nextSibling();
        goban.current.syncReviewMove();
        console.log("down", Date.now() - start);
    };
    const nav_first = () => {
        if (!goban.current) {
            return;
        }
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showFirst();
        goban.current.syncReviewMove();
        console.log("nav_first", Date.now() - start);
    };
    const nav_prev_10 = () => {
        if (!goban.current) {
            return;
        }
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
        if (!goban.current) {
            return;
        }
        //const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        const cur = goban.current.engine.cur_move;
        goban.current.showPrevious();
        const prev = goban.current.engine.cur_move;

        if (goban.current.isAnalysisDisabled()) {
            prev.clearBranchesExceptFor(cur);
        }

        goban.current.syncReviewMove();
        //console.log("nav_prev", Date.now() - start);
    };
    const nav_next = (event?: React.MouseEvent<any>, dont_stop_autoplay?: boolean) => {
        if (!goban.current) {
            return;
        }
        //const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        if (!dont_stop_autoplay) {
            stopAutoplay();
        }
        checkAndEnterAnalysis(last_estimate_move);
        goban.current.showNext();
        goban.current.syncReviewMove();
        //console.log("nav_next", Date.now() - start);
    };
    const nav_next_10 = () => {
        if (!goban.current) {
            return;
        }
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
        if (!goban.current) {
            return;
        }
        const start = Date.now();
        const last_estimate_move = stopEstimatingScore();
        stopAutoplay();
        checkAndEnterAnalysis(last_estimate_move);
        if (goban.current.engine.last_official_move.move_number !== 0) {
            goban.current.jumpToLastOfficialMove();
        } else {
            while (goban.current.engine.showNext()) {
                // show next if there is one
            }
        }
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
    const nav_goto_move = (move_number?: number) => {
        if (typeof move_number !== "number") {
            return;
        }

        if (!goban.current) {
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
            if (!goban.current) {
                return;
            }
            if (goban.current.mode === "analyze") {
                nav_next(undefined, true);

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

    const checkAndEnterAnalysis = (move?: MoveTree) => {
        if (!goban.current) {
            return false;
        }

        if (
            goban.current.mode === "play" &&
            goban.current.engine.phase !== "stone removal" &&
            !goban.current.isAnalysisDisabled()
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

    const setAnalyzeTool = (tool: AnalysisTool | "erase", subtool: string) => {
        if (!goban.current) {
            return false;
        }
        if (checkAndEnterAnalysis()) {
            document.querySelector("#game-analyze-button-bar .active")?.classList.remove("active");
            document.querySelector(`#game-analyze-${tool}-tool`)?.classList.add("active");
            enableTouchAction();
            switch (tool) {
                case "draw":
                    disableTouchAction();
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
                case "score":
                    if (subtool == null) {
                        subtool = "black";
                    }
                    goban.current.setAnalyzeTool(tool, subtool);
                    break;
                case "removal":
                    goban.current.setAnalyzeTool(tool, subtool);
                    break;
            }
        }

        return false;
    };
    const clear_and_sync = () => {
        if (!goban.current) {
            return false;
        }
        goban.current.syncReviewMove({ clearpen: true });
        goban.current.clearAnalysisDrawing();
        return true;
    };
    const delete_branch = () => {
        goban_deleteBranch();
    };
    const setLabelHandler = (event: KeyboardEvent) => {
        if (!goban.current) {
            return;
        }
        try {
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA" ||
                document.activeElement?.tagName === "SELECT"
            ) {
                return;
            }
        } catch {
            // ignore error
        }

        if (goban && goban.current.mode === "analyze") {
            if (goban.current.analyze_tool === "label") {
                if (event.key && event.key.length === 1) {
                    const ch = event.key.toUpperCase();
                    goban.current.setLabelCharacter(ch);
                    event.preventDefault();
                }
            }
        }
    };
    const toggleCoordinates = () => {
        if (!goban.current) {
            return;
        }
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

        goban.current.setLabelPosition(label_position);
    };

    const toggleShowTiming = () => {
        set_show_game_timing(!show_game_timing);
    };

    const toggleShowBotDetectionResults = () => {
        set_show_bot_detection_results(!show_bot_detection_results);
    };

    const gameLogModalMarkCoords = (stones_string: string) => {
        if (
            !goban.current ||
            !goban.current.config ||
            !goban.current.config.width ||
            !goban.current.config.height
        ) {
            return;
        }
        for (let i = 0; i < goban.current.config.width; i++) {
            for (let j = 0; j < goban.current.config.height; j++) {
                goban.current.deleteCustomMark(i, j, "triangle", true);
            }
        }

        const coord_array = stones_string.split(",").map((item) => item.trim());
        for (let j = 0; j < coord_array.length; j++) {
            const move = goban.current.decodeMoves(coord_array[j])[0];
            goban.current.setMark(move.x, move.y, "triangle", false);
        }
    };
    const gameAnalyze = () => {
        if (!goban.current) {
            return;
        }

        if (goban.current.isAnalysisDisabled()) {
            //alert.fire(_("Analysis mode has been disabled for this game"));
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
        if (!goban.current) {
            return;
        }

        preferences.set("ai-review-enabled", !ai_review_enabled);
        if (ai_review_enabled) {
            goban.current.setHeatmap(undefined);
            goban.current.setColoredCircles(undefined);
            goban.current.engine.move_tree.traverse((node: MoveTree) => node.clearMarks());
            goban.current.redraw();
        }
        set_ai_review_enabled(!ai_review_enabled);
    };
    const updateVariationName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        set_variation_name(ev.target.value);
    };
    const shareAnalysis = () => {
        if (!goban.current) {
            return;
        }

        const diff = goban.current.engine.getMoveDiff();
        let name = variation_name;
        let auto_named = false;

        if (!name) {
            auto_named = true;
            name = "" + ++game_control.last_variation_number;
        }

        const marks: { [k: string]: string } = {};
        let mark_ct = 0;
        for (let y = 0; y < goban.current.height; ++y) {
            for (let x = 0; x < goban.current.width; ++x) {
                const pos = goban.current.getMarks(x, y);
                const mark_types = [
                    "letter",
                    "triangle",
                    "circle",
                    "square",
                    "cross",
                    "score",
                    "stone_removed",
                ];
                for (let i = 0; i < mark_types.length; ++i) {
                    if (mark_types[i] in pos && pos[mark_types[i]]) {
                        const mark_key =
                            mark_types[i] === "letter"
                                ? pos.letter
                                : mark_types[i] === "score"
                                  ? `score-${pos.score}`
                                  : mark_types[i];

                        if (mark_key) {
                            if (!(mark_key in marks)) {
                                marks[mark_key] = "";
                            }
                            marks[mark_key] += encodeMove(x, y);
                        }
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
            (auto_named || las.name === analysis.name) &&
            ((!analysis.marks && !las.marks) || las.marks === analysis.marks) &&
            ((!analysis.pen_marks && !las.pen_marks) || las.pen_marks === analysis.pen_marks)
        ) {
            if (auto_named) {
                --game_control.last_variation_number;
            }
            return;
        }

        if (!data.get("user").anonymous) {
            goban.current.sendChat(analysis, selected_chat_log);
            last_analysis_sent.current = analysis;
        } else {
            goban.current.showMessage("error", {
                error: { message: "Can't send to the " + selected_chat_log + " chat_log" },
            });
        }
    };

    /*** Game stuff ***/
    const reviewAdded = (review: any) => {
        console.log("Review added: " + JSON.stringify(review));
        const new_review_list: any[] = [];
        for (const r of review_list) {
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
        goban.current.score_estimator = null;
    };
    const enterConditionalMovePlanner = () => {
        if (!goban.current) {
            return;
        }
        if (goban.current.isAnalysisDisabled()) {
            //alert.fire(_("Conditional moves have been disabled for this game."));
        } else {
            stashed_conditional_moves.current = goban.current.conditional_tree.duplicate();
            goban.current.setMode("conditional");
        }
    };
    const pauseGame = () => {
        if (!goban.current) {
            return;
        }
        goban.current.pauseGame();
    };
    const startReview = () => {
        if (!goban.current) {
            return;
        }
        const user = data.get("user");
        const is_player =
            user.id === goban.current.engine.players.black.id ||
            user.id === goban.current.engine.players.white.id;

        if (goban.current.isAnalysisDisabled() && is_player) {
            //alert.fire(_("Analysis mode has been disabled for this game, you can start a review after the game has concluded."));
        } else {
            alert
                .fire({
                    text: _("Start a review of this game?"),
                    showCancelButton: true,
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        post(`games/${game_id}/reviews`, {})
                            .then((res) => browserHistory.push(`/review/${res.id}`))
                            .catch(errorAlerter);
                    }
                })
                .catch(ignore);
        }
    };
    const estimateScore = (): boolean => {
        if (!goban.current) {
            return false;
        }
        const user = data.get("user");
        const is_player =
            user.id === goban.current.engine.players.black.id ||
            user.id === goban.current.engine.players.white.id ||
            shared_ip_with_player_map[game_id];

        if (goban.current.isAnalysisDisabled() && is_player) {
            return false;
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
    const stopEstimatingScore = (): MoveTree | undefined => {
        if (!estimating_score_ref.current) {
            return;
        }
        set_estimating_score(false);
        if (!goban.current) {
            return;
        }
        const ret = goban.current.setScoringMode(false);
        goban.current.hideScores();
        goban.current.score_estimator = null;
        return ret;
    };

    const goban_setModeDeferredPlay = () => {
        goban.current?.setModeDeferred("play");
    };
    const goban_deleteBranch = () => goban.current && deleteBranch(goban.current, mode);
    const goban_copyBranch = () => goban.current && copyBranch(goban.current, copied_node, mode);
    const goban_pasteBranch = () => goban.current && pasteBranch(goban.current, copied_node, mode);

    /* Review stuff */

    const variationKeyPress = (ev: React.KeyboardEvent): boolean | void => {
        if (ev.keyCode === 13) {
            shareAnalysis();
            return false;
        }
    };
    const frag_rengo_header = () => {
        if (!goban.current?.engine?.rengo) {
            return null;
        }
        return (
            <div className="rengo-header-block">
                {!goban.current?.review_id && show_title && (
                    <div className="game-state">{title}</div>
                )}
            </div>
        );
    };
    const frag_game_information = () => {
        if (zen_mode) {
            return null;
        }

        const config = goban.current?.engine?.config;
        if (!config) {
            return null;
        }
        const rules = config?.rules ? rulesText(config.rules) : null;
        return (
            <div className="condensed-game-information">
                <div className="condensed-game-ranked">
                    {config.ranked ? _("Ranked") : _("Unranked")}
                </div>
                {rules && (
                    <div className="condensed-game-rules">
                        {_("Rules")}: {rules}
                    </div>
                )}
            </div>
        );
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
                setAnalyzePencilColor={setAnalyzePencilColor}
                analyze_pencil_color={analyze_pencil_color}
                setAnalyzeTool={setAnalyzeTool}
                is_review={!!review_id}
                mode={mode}
                copied_node={copied_node}
            />
        );
    };
    const frag_review_controls = () => (
        <ReviewControls
            mode={mode}
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
            show_cancel={show_cancel}
            review_list={review_list}
            stashed_conditional_moves={stashed_conditional_moves.current}
            mode={mode}
            phase={phase as any}
            title={title as string}
            show_title={show_title as boolean}
            renderEstimateScore={frag_estimate_score}
            renderAnalyzeButtonBar={frag_analyze_button_bar}
            setMoveTreeContainer={setMoveTreeContainer}
            onShareAnalysis={shareAnalysis}
            variation_name={variation_name}
            updateVariationName={updateVariationName}
            variationKeyPress={variationKeyPress}
            annulled={annulled}
            annulment_reason={annulment_reason}
            zen_mode={zen_mode}
            selected_chat_log={selected_chat_log}
            stopEstimatingScore={stopEstimatingScore}
        />
    );

    const frag_ai_review = () => {
        if (!goban.current) {
            return;
        }
        // Games
        if (
            cur_move &&
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
                    move={cur_move}
                    hidden={!ai_review_enabled}
                />
            );
        }

        if (
            goban.current.review_controller_id &&
            goban.current.engine &&
            goban.current.review_id === review_id &&
            ((goban.current.engine.width === 19 && goban.current.engine.height === 19) ||
                (goban.current.engine.width === 13 && goban.current.engine.height === 13) ||
                (goban.current.engine.width === 9 && goban.current.engine.height === 9))
        ) {
            return (
                <AIDemoReview
                    goban={goban.current}
                    controller={goban.current.review_controller_id}
                />
            );
        }
        return null;
    };

    const frag_bot_detection_results = (): React.ReactElement | null => {
        if (bot_detection_results?.ai_suspected.length > 0) {
            return (
                <BotDetectionResults
                    bot_detection_results={bot_detection_results}
                    game_id={game_id}
                    updateBotDetectionResults={set_bot_detection_results}
                />
            );
        }

        return null;
    };

    const frag_timings = () => {
        if (goban.current?.engine?.config) {
            return (
                <GameTimings
                    moves={goban.current.engine.config.moves ?? []}
                    start_time={goban.current.engine.config.start_time ?? 0}
                    end_time={goban.current.engine.config.end_time}
                    free_handicap_placement={
                        goban.current.engine.config.free_handicap_placement ?? false
                    }
                    handicap={goban.current.engine.config.handicap ?? 0}
                    black_id={goban.current.engine.config.black_player_id ?? 0}
                    white_id={goban.current.engine.config.white_player_id ?? 0}
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
                    <button type="button" onClick={nav_first} className="move-control">
                        <i className="fa fa-fast-backward"></i>
                    </button>
                    <button type="button" onClick={nav_prev_10} className="move-control">
                        <i className="fa fa-backward"></i>
                    </button>
                    <button type="button" onClick={nav_prev} className="move-control">
                        <i className="fa fa-step-backward"></i>
                    </button>
                    <button type="button" onClick={nav_play_pause} className="move-control">
                        <i className={"fa " + (autoplaying ? "fa-pause" : "fa-play")}></i>
                    </button>
                    <button type="button" onClick={nav_next} className="move-control">
                        <i className="fa fa-step-forward"></i>
                    </button>
                    <button type="button" onClick={nav_next_10} className="move-control">
                        <i className="fa fa-forward"></i>
                    </button>
                    <button type="button" onClick={nav_last} className="move-control">
                        <i className="fa fa-fast-forward"></i>
                    </button>
                </span>

                {view_mode !== "portrait" && (
                    <span className="move-number">
                        {interpolate(_("Move {{move_number}}"), {
                            move_number: goban.current?.engine.getMoveNumber(),
                        })}
                    </span>
                )}
            </div>
        );
    };

    const frag_kb_shortcuts = () => {
        return (
            <div>
                {game_id > 0 && (
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
                <KBShortcut shortcut="f1" action={() => setAnalyzeTool("stone", "alternate")} />
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
                {goban.current?.mode === "analyze" && (
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
        ref_move_tree_container.current = resizable ? resizable.div ?? undefined : undefined;
        if (goban.current && ref_move_tree_container.current) {
            (goban.current as GobanRenderer).setMoveTreeContainer(ref_move_tree_container.current);
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
        set_black_flags(null);
        set_white_flags(null);

        game_control.on("stopEstimatingScore", stopEstimatingScore);
        game_control.on("gotoMove", nav_goto_move);

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
            isInPushedAnalysis: () => game_control.in_pushed_analysis,
            leavePushedAnalysis: () => {
                if (game_control.onPushAnalysisLeft) {
                    game_control.onPushAnalysisLeft();
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
                goban.current?.redraw(true);
            },
        };

        if (game_id) {
            opts.game_id = game_id;
        }
        if (review_id) {
            opts.review_id = review_id;
            opts.isPlayerOwner = () => goban.current?.review_owner_id === data.get("user").id;
            opts.isPlayerController = () =>
                goban.current?.review_controller_id === data.get("user").id;
        }

        goban.current = createGoban(opts);

        onResize(true);
        window.global_goban = goban.current;
        if (review_id) {
            goban.current.setMode("analyze");
        }

        goban.current.on("gamedata", () => {
            const user = data.get("user");
            try {
                if (
                    user.is_moderator &&
                    (user.id in (goban.current!.engine.player_pool || {}) ||
                        user.id === goban.current!.engine.config.white_player_id ||
                        user.id === goban.current!.engine.config.black_player_id)
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
            goban.current.on("state_text", (state) => {
                on_refocus_title.current = state.title;
                if (state.show_moves_made_count) {
                    if (!goban) {
                        window.document.title = state.title;
                        return;
                    }
                    if (document.hasFocus()) {
                        last_move_viewed.current = goban.current!.engine.getMoveNumber();
                        window.document.title = state.title;
                    } else {
                        const diff =
                            goban.current!.engine.getMoveNumber() - last_move_viewed.current;
                        window.document.title = interpolate(_("(%s) moves made"), [diff]);
                    }
                } else {
                    window.document.title = state.title;
                }
            });
            /* } */
        }

        bindAudioEvents(goban.current);

        goban.current.on("submitting-move", () => {
            // clear any pending "your move" notifications
            notification_manager.clearTimecopNotification(game_id);
        });

        goban.current.on("clock", (clock: JGOFClock | null) => {
            /* This is the code that draws the count down number on the "hover
             * stone" for the current player if they are running low on time */

            const user = data.get("user");

            if (!clock) {
                return;
            }

            if (user.anonymous) {
                return;
            }

            if (!goban.current) {
                return;
            }

            if (user.id.toString() !== clock.current_player_id) {
                goban.current.setByoYomiLabel("");
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
                goban.current.setByoYomiLabel("");
            }
        });

        /* Ensure our state is kept up to date */

        const sync_stone_removal = () => {
            const engine = goban.current!.engine;

            if (
                (engine.phase === "stone removal" || engine.phase === "finished") &&
                engine.outcome !== "Timeout" &&
                engine.outcome !== "Disconnection" &&
                engine.outcome !== "Resignation" &&
                engine.outcome !== "Abandonment" &&
                engine.outcome !== "Cancellation" &&
                goban.current!.mode === "play"
            ) {
                if (
                    engine.phase === "finished" &&
                    engine.outcome.indexOf("Server Decision") === 0
                ) {
                    if (engine.stalling_score_estimate) {
                        goban.current!.showStallingScoreEstimate(engine.stalling_score_estimate);
                    }
                } else {
                    const s = engine.computeScore(false);
                    goban.current!.showScores(s);
                }
            }
        };

        const sync_needs_sealing = (positions: undefined | JGOFSealingIntersection[]) => {
            console.log("sync_needs_sealing", positions);
            //const cur = goban.current as GobanRenderer;
            const engine = goban.current!.engine;

            const cur_move = engine.cur_move;
            for (const pos of positions || []) {
                const { x, y } = pos;
                const marks = cur_move.getMarks(x, y);
                marks.needs_sealing = true;
                goban.current!.drawSquare(x, y);
            }
        };

        const onLoad = () => {
            const engine = goban.current!.engine;
            set_mode(goban.current!.mode);
            set_phase(engine.phase);

            set_score_estimate_winner(undefined);
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

        goban.current.on("load", onLoad);
        onLoad();

        goban.current.on("mode", set_mode);
        goban.current.on("phase", set_phase);
        goban.current.on("phase", () => goban.current!.engine.cur_move.clearMarks());
        goban.current.on("score_estimate", (est) => {
            set_score_estimate_winner(est?.winner || "");
            set_score_estimate_amount(est?.amount);
        });
        goban.current.on("undo_requested", set_undo_requested);

        goban.current.on("phase", sync_stone_removal);
        goban.current.on("mode", sync_stone_removal);
        goban.current.on("outcome", sync_stone_removal);
        goban.current.on("stone-removal.accepted", sync_stone_removal);
        goban.current.on("stone-removal.updated", sync_stone_removal);
        goban.current.on("stone-removal.needs-sealing", sync_needs_sealing);

        /* END sync_state port */

        goban.current.on("move-made", auto_advance);
        goban.current.on("gamedata", onResize);

        goban.current.on("gamedata", (gamedata) => {
            if (!goban.current) {
                throw new Error("goban.current is null");
            }

            try {
                if (isLiveGame(gamedata.time_control, gamedata.width, gamedata.height)) {
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
                /*
                goban.current.visual_undo_request_indicator = preferences.get(
                    "visual-undo-request-indicator",
                );
                */
            } catch (e) {
                console.error(e.stack);
            }
        });

        goban.current.on("played-by-click", (event) => {
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
            goban.current.once(review_id ? "review.load-end" : "gamedata", () => {
                nav_goto_move(parseInt(params.move_number as string));
            });
        }

        if (review_id) {
            let stashed_move_string: string | null = null;
            let stashed_review_id: number | null = null;
            /* If we lose connection, save our place when we reconnect so we can jump to it. */
            goban.current.on("review.load-start", () => {
                if (!goban.current) {
                    return;
                }

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
                if (goban.current?.review_controller_id !== data.get("user").id) {
                    return;
                }

                if (stashed_move_string && stashed_review_id === goban.current.review_id) {
                    const prev_last_review_message = goban.current.getLastReviewMessage();
                    const moves = goban.current.decodeMoves(stashed_move_string);

                    goban.current.engine.jumpTo(goban.current.engine.move_tree);
                    for (const move of moves) {
                        if (move.edited) {
                            goban.current.engine.editPlace(
                                move.x,
                                move.y,
                                move.color as JGOFNumericPlayerColor,
                                false,
                            );
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
                        goban.current?.setLastReviewMessage(prev_last_review_message);
                        goban.current?.syncReviewMove();
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
                    game_control.creator_id = game.creator;
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

                    set_annulled(game.annulled);
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
            set_selected_chat_log(defaultChatMode);
            delete game_control.creator_id;
            ladder_id.current = undefined;
            tournament_id.current = undefined;
            document.removeEventListener("keypress", setLabelHandler);
            try {
                if (goban.current) {
                    goban.current.destroy();
                }
            } catch (e) {
                console.error(e.stack);
            }
            goban.current?.removeAllListeners();
            goban.current = null;
            if (resize_debounce.current) {
                clearTimeout(resize_debounce.current);
                resize_debounce.current = null;
            }
            if (autoplay_timer.current) {
                clearTimeout(autoplay_timer.current);
            }
            window.Game = null;
            window.global_goban = null;

            setExtraActionCallback(null as any);
            window.removeEventListener("focus", onFocus);
            window.document.title = "OGS";
            const body = document.getElementsByTagName("body")[0];
            body.classList.remove("zen"); //remove the class
            game_control.off("stopEstimatingScore", stopEstimatingScore);
            game_control.off("gotoMove", nav_goto_move);

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

    if (goban.current === null) {
        return null;
    }

    const CHAT = zen_mode ? null : (
        <GameChat
            selected_chat_log={selected_chat_log}
            onSelectedChatModeChange={set_selected_chat_log}
            channel={game_id ? `game-${game_id}` : `review-${review_id}`}
            game_id={game_id}
            review_id={review_id}
        />
    );
    const review = !!review_id;

    const experimental: boolean = data.get("experiments.v6") === "enabled";

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
                <GobanContext.Provider value={goban.current}>
                    {frag_kb_shortcuts()}
                    <i onClick={toggleZenMode} className="leave-zen-mode-button ogs-zen-mode"></i>

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
                                {frag_game_information()}
                                {frag_rengo_header()}
                            </div>
                        )}
                        <GobanContainer
                            goban={goban.current}
                            onResize={onResize}
                            onWheel={onWheel}
                        />

                        {frag_below_board_controls()}

                        {view_mode === "square" && !squashed && CHAT}

                        {view_mode === "portrait" && !zen_mode && frag_ai_review()}

                        {view_mode === "portrait" &&
                            (review ? frag_review_controls() : frag_play_controls(false))}

                        {view_mode === "portrait" && !zen_mode && CHAT}

                        {view_mode === "portrait" &&
                            !zen_mode &&
                            user_is_player &&
                            phase !== "finished" && <CancelButton className="bold reject" />}

                        {view_mode === "portrait" && !zen_mode && (
                            <GameDock
                                annulled={annulled}
                                selected_ai_review_uuid={selected_ai_review_uuid}
                                tournament_id={tournament_id.current}
                                tournament_name={tournament?.name}
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
                                onDetectionResultsClicked={toggleShowBotDetectionResults}
                                ai_suspected={bot_detection_results?.ai_suspected.length > 0}
                            />
                        )}
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
                                    {frag_game_information()}
                                    {frag_rengo_header()}
                                </div>
                            )}

                            {(view_mode === "square" || view_mode === "wide") &&
                                !zen_mode &&
                                frag_ai_review()}

                            {(view_mode === "square" || view_mode === "wide") &&
                                show_game_timing &&
                                frag_timings()}

                            {(view_mode === "square" || view_mode === "wide") &&
                                show_bot_detection_results &&
                                frag_bot_detection_results()}

                            {review ? frag_review_controls() : frag_play_controls(true)}

                            {view_mode === "wide" && CHAT}
                            {view_mode === "square" && squashed && CHAT}
                            {view_mode === "square" && squashed && CHAT}

                            <GameDock
                                annulled={annulled}
                                selected_ai_review_uuid={selected_ai_review_uuid}
                                tournament_id={tournament_id.current}
                                tournament_name={tournament?.name}
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
                                onDetectionResultsClicked={toggleShowBotDetectionResults}
                                ai_suspected={bot_detection_results?.ai_suspected.length > 0}
                            />
                            {zen_mode && <div className="align-col-end"></div>}
                        </div>
                    )}

                    <div className="align-row-end"></div>
                </GobanContext.Provider>
            </div>
        </div>
    );
}

function bindAudioEvents(goban: GobanRenderer): void {
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
        let cur_sound: SFXSprite | undefined;
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
        let cur_sound: SFXSprite | undefined;

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
    let last_period_announced: number | undefined = -1;
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

        let audio_to_play: ValidSound | undefined;
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
                                count_from - parseInt(audio_to_play ?? "0")
                            ).toString() as ValidSound;
                        } else if (
                            five_seconds_start > 0 &&
                            seconds_left <= five_seconds_start &&
                            seconds_left % 5 === 0 &&
                            seconds_left !== every_second_start
                        ) {
                            audio_to_play = (
                                count_from - parseInt(audio_to_play ?? "0")
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
