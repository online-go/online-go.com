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

import type { ChangeEvent, MouseEvent } from "react";
import {
    AnalysisTool,
    ConditionalMoveTree,
    GobanRendererConfig,
    GobanRenderer,
    MoveTree,
    createGoban,
    encodeMove,
    JGOFClock,
    JGOFSealingIntersection,
} from "goban";
import { EventEmitter } from "eventemitter3";
import { sfx, SFXSprite, ValidSound } from "@/lib/sfx";
import { AudioClockEvent } from "goban";
import { _, current_language } from "@/lib/translate";
import { disableTouchAction, enableTouchAction } from "@/views/Game/touch_actions";
import { browserHistory } from "@/lib/ogsHistory";
import { errorAlerter, ignore } from "@/lib/misc";
import { post } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { goban_view_mode, shared_ip_with_player_map, ViewMode } from "@/views/Game/util";
import { ChatMode } from "@/views/Game/GameChat";
import { chat_manager, ChatChannelProxy, inGameModChannel } from "@/lib/chat_manager";
import { Resizable } from "@/components/Resizable";
import { PlayerCacheEntry } from "./player_cache";
import { isLiveGame } from "@/components/TimeControl";

interface GobanControllerEvents {
    autoplaying: (autoplaying: boolean) => void;
    variation_name: (variation_name: string) => void;
    show_game_timing: (show_game_timing: boolean) => void;
    show_bot_detection_results: (show_bot_detection_results: boolean) => void;
    zen_mode: (zen_mode: boolean) => void;
    copied_node: (copied_node: MoveTree | undefined) => void;
    view_mode: (view_mode: ViewMode) => void;
    ai_review_enabled: (ai_review_enabled: boolean) => void;
    estimating_score: (estimating_score: boolean) => void;
    resize: () => void;
    stop_estimating_score: () => void; // emitted when we want to stop estimating the score
    selected_chat_log: (selected_chat_log: ChatMode) => void;
    selected_ai_review_uuid: (selected_ai_review_uuid: string | null) => void;
    branch_copied: (copied_node: MoveTree | undefined) => void;
    in_pushed_analysis: (in_pushed_analysis: boolean) => void;
    annulled: (annulled: boolean) => void;
    destroy: () => void;
    stashed_conditional_moves: (stashed_conditional_moves: ConditionalMoveTree | null) => void;
}

export interface ReviewListEntry {
    owner: PlayerCacheEntry;
    id: number;
}

export interface GobanTransformSetting {
    game: number;
    transform: number;
}

/*
 * This class is a wrapper around the Goban class that stacks on various
 * non-react functionality that we need in the various components within
 * the Game view.
 */

export class GobanController extends EventEmitter<GobanControllerEvents> {
    public readonly goban: GobanRenderer;
    private _autoplaying: boolean = false;
    public analyze_pencil_color: string = preferences.get("analysis.pencil-color");
    private show_game_timing: boolean = false;
    private show_bot_detection_results: boolean = false;
    private _zen_mode: boolean = preferences.get("start-in-zen-mode");
    private _ai_review_enabled: boolean = preferences.get("ai-review-enabled");
    private autoplay_timer: ReturnType<typeof setTimeout> | null = null;
    private _variation_name: string = "";
    private _in_pushed_analysis: boolean = false;
    public onPushAnalysisLeft?: () => void;
    public last_variation_number: number = 0;
    public creator_id?: number;
    private last_analysis_sent: any;
    private game_id?: number;
    private review_id?: number;
    public _selected_chat_log: ChatMode;
    private _stashed_conditional_moves: ConditionalMoveTree | null = null;
    private _selected_ai_review_uuid: string | null = null;
    private _copied_node?: MoveTree;
    private _view_mode: ViewMode = "wide"; // Default to wide, will be updated on resize if needed
    private _annulled: boolean = false;
    public chat_proxy?: ChatChannelProxy;
    public review_list: ReviewListEntry[] = [];
    public destroyed: boolean = false;
    private enable_sounds: boolean = true;
    private _estimating_score: boolean = false;
    private _stashed_submit_move?: () => void;

    constructor(opts: GobanRendererConfig & { enable_sounds?: boolean }) {
        super();
        this.goban = createGoban(opts);
        this.enable_sounds = opts.enable_sounds !== false; // Default to true if not specified
        if (this.enable_sounds) {
            this.bindAudioEvents();
        }
        this.game_id = opts.game_id ? Number(opts.game_id) : undefined;
        this.review_id = opts.review_id ? Number(opts.review_id) : undefined;

        const defaultChatMode = preferences.get("chat-mode") as ChatMode;
        const in_game_mod_channel =
            !this.review_id && this.game_id && inGameModChannel(this.game_id);
        this._selected_chat_log = in_game_mod_channel ? "hidden" : defaultChatMode;

        if (opts.connect_to_chat) {
            this.chat_proxy = this.game_id
                ? chat_manager.join(`game-${this.game_id}`)
                : chat_manager.join(`review-${this.review_id}`);
        }

        this.setupCountdownCounter();
        this.goban.on("phase", this.syncStoneRemoval.bind(this));
        this.goban.on("mode", this.syncStoneRemoval.bind(this));
        this.goban.on("outcome", this.syncStoneRemoval.bind(this));
        this.goban.on("stone-removal.accepted", this.syncStoneRemoval.bind(this));
        this.goban.on("stone-removal.updated", this.syncStoneRemoval.bind(this));
        this.goban.on("stone-removal.needs-sealing", this.syncNeedsSealing.bind(this));

        this.goban.on("load", () => {
            this.syncStoneRemoval();
            this.review_list = [];
            for (const k in this.goban.engine.config.reviews) {
                this.review_list.push({
                    id: Number(k),
                    owner: this.goban.engine.config.reviews[k as any] as PlayerCacheEntry,
                });
            }
            this.review_list.sort(rankingThenUsername);
        });

        this.goban.on("gamedata", (gamedata) => {
            try {
                if (gamedata.time_control) {
                    if (isLiveGame(gamedata.time_control, gamedata.width, gamedata.height)) {
                        this.goban.one_click_submit = preferences.get("one-click-submit-live");
                        this.goban.double_click_submit = preferences.get(
                            "double-click-submit-live",
                        );
                    } else {
                        this.goban.one_click_submit = preferences.get(
                            "one-click-submit-correspondence",
                        );
                        this.goban.double_click_submit = preferences.get(
                            "double-click-submit-correspondence",
                        );
                    }
                }
            } catch (e) {
                console.error(e.stack);
            }
        });
    }

    public destroy() {
        if (this.destroyed) {
            console.warn("GobanController.destroy() called twice");
            return;
        }
        this.destroyed = true;
        if (this.chat_proxy?.part) {
            this.chat_proxy.part();
        }
        this.stopAutoplay();
        this.goban.destroy();
        this.emit("destroy");
        this.removeAllListeners();
    }

    /* This is the code that draws the count down number on the "hover
     * stone" for the current player if they are running low on time */
    private setupCountdownCounter() {
        this.goban.on("clock", (clock: JGOFClock | null) => {
            const user = data.get("user");

            if (!clock) {
                return;
            }

            if (user.anonymous) {
                return;
            }

            const goban = this.goban;

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
    }

    public get stashed_conditional_moves(): ConditionalMoveTree | null {
        return this._stashed_conditional_moves;
    }
    public setStashedConditionalMoves(stashed_conditional_moves: ConditionalMoveTree | null) {
        this._stashed_conditional_moves = stashed_conditional_moves;
        this.emit("stashed_conditional_moves", stashed_conditional_moves);
    }

    public get in_pushed_analysis(): boolean {
        return this._in_pushed_analysis;
    }
    public setInPushedAnalysis(in_pushed_analysis: boolean) {
        this._in_pushed_analysis = in_pushed_analysis;
        this.emit("in_pushed_analysis", in_pushed_analysis);
    }

    public get autoplaying(): boolean {
        return this._autoplaying;
    }

    public get estimating_score(): boolean {
        return this._estimating_score;
    }

    public get annulled(): boolean {
        return this._annulled;
    }

    public setAnnulled = (annulled: boolean) => {
        this._annulled = annulled;
        this.emit("annulled", annulled);
    };

    public get selected_chat_log(): ChatMode {
        return this._selected_chat_log;
    }

    public setSelectedChatLog(selected_chat_log: ChatMode) {
        this._selected_chat_log = selected_chat_log;
        this.emit("selected_chat_log", selected_chat_log);
    }

    public get selected_ai_review_uuid(): string | null {
        return this._selected_ai_review_uuid;
    }
    public setSelectedAiReviewUuid(selected_ai_review_uuid: string | null) {
        this._selected_ai_review_uuid = selected_ai_review_uuid;
        this.emit("selected_ai_review_uuid", selected_ai_review_uuid);
    }

    public get zen_mode(): boolean {
        return this._zen_mode;
    }
    public setZenMode(zen_mode: boolean) {
        this._zen_mode = zen_mode;
        this.emit("zen_mode", zen_mode);
    }

    public get ai_review_enabled(): boolean {
        return this._ai_review_enabled;
    }

    public get copied_node(): MoveTree | undefined {
        return this._copied_node;
    }
    public setCopiedNode(copied_node: MoveTree | undefined) {
        this._copied_node = copied_node;
        this.emit("copied_node", copied_node);
    }

    public get view_mode(): ViewMode {
        return this._view_mode;
    }
    public setViewMode(view_mode: ViewMode) {
        this._view_mode = view_mode;
        this.emit("view_mode", view_mode);
    }

    public nextBranchUp = () => {
        if (this.goban.mode === "conditional") {
            return;
        }
        this.checkAndEnterAnalysis();
        this.goban.prevSibling();
        this.goban.syncReviewMove();
    };

    public nextBranchDown = () => {
        this.checkAndEnterAnalysis();
        this.goban.nextSibling();
        this.goban.syncReviewMove();
    };
    public gotoFirstMove = () => {
        if (this.goban.mode === "conditional") {
            return;
        }
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showFirst();
        this.goban.syncReviewMove();
    };
    public previous10Moves = () => {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showPrevious();
        }
        this.goban.syncReviewMove();
    };
    public previousMove = () => {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        const cur = this.goban.engine.cur_move;
        this.goban.showPrevious();
        const prev = this.goban.engine.cur_move;

        if (this.goban.isAnalysisDisabled()) {
            prev.clearBranchesExceptFor(cur);
        }

        this.goban.syncReviewMove();
    };
    public nextMove = (event?: MouseEvent<any>, dont_stop_autoplay?: boolean) => {
        const last_estimate_move = this.stopEstimatingScore();
        if (!dont_stop_autoplay) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showNext();
        this.goban.syncReviewMove();
    };
    public forwardTenMoves = () => {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        for (let i = 0; i < 10; ++i) {
            this.goban.showNext();
        }
        this.goban.syncReviewMove();
    };
    public gotoLastMove = () => {
        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        if (this.goban.engine.last_official_move.move_number !== 0) {
            this.goban.jumpToLastOfficialMove();
        } else {
            while (this.goban.engine.showNext()) {
                // show next if there is one
            }
        }
        this.goban.syncReviewMove();
    };
    public togglePlayPause = () => {
        if (this.goban.mode === "conditional") {
            return;
        }
        if (this.autoplaying) {
            this.stopAutoplay();
        } else {
            this.startAutoplay();
        }
        console.log("nav_play_pause", this.autoplaying);
    };
    public gotoMove = (move_number?: number) => {
        if (typeof move_number !== "number") {
            return;
        }

        const last_estimate_move = this.stopEstimatingScore();
        this.stopAutoplay();
        this.checkAndEnterAnalysis(last_estimate_move);
        this.goban.showFirst(move_number > 0);
        for (let i = 0; i < move_number; ++i) {
            this.goban.showNext(i !== move_number - 1);
        }
        this.goban.syncReviewMove();
    };

    public checkAndEnterAnalysis = (move?: MoveTree) => {
        if (this.goban.mode === "conditional") {
            return true;
        }

        if (
            this.goban.mode === "play" &&
            this.goban.engine.phase !== "stone removal" &&
            !this.goban.isAnalysisDisabled()
        ) {
            if (!move) {
                move = this.goban.engine.cur_move;
            }

            this.saveSubmitMove();
            this.setVariationName("");
            this.goban.setMode("analyze");
            this.goban.engine.jumpTo(move);
            return true;
        }

        if (this.goban.mode === "analyze") {
            if (move) {
                this.goban.engine.jumpTo(move);
            }
            return true;
        }
        return false;
    };

    public setVariationName = (variation_name: string) => {
        this._variation_name = variation_name;
        this.emit("variation_name", variation_name);
    };

    public get variation_name(): string {
        return this._variation_name;
    }

    public setMoveTreeContainer = (resizable: Resizable) => {
        if (this.destroyed) {
            return;
        }
        if (this.goban && resizable?.div) {
            this.goban.setMoveTreeContainer(resizable.div);
        }
    };

    public stopAutoplay() {
        if (!this.autoplaying) {
            return;
        }
        if (this.autoplay_timer) {
            clearTimeout(this.autoplay_timer);
            this.autoplay_timer = null;
        }
        this._autoplaying = false;
        this.emit("autoplaying", false);
    }
    public startAutoplay() {
        if (this.autoplay_timer) {
            this.stopAutoplay();
        }
        this.checkAndEnterAnalysis();
        const step = () => {
            if (this.goban.mode === "analyze") {
                this.nextMove(undefined, true);

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
        step();

        this._autoplaying = true;
        console.log("startAutoplay", this.autoplaying);
        this.emit("autoplaying", true);
    }

    /************/
    public setAnalyzePencilColor = (color: string) => {
        preferences.set("analysis.pencil-color", color);
        this.analyze_pencil_color = color;
    };

    public setAnalyzeTool = (tool: AnalysisTool | "erase", subtool: string) => {
        if (this.checkAndEnterAnalysis()) {
            document.querySelector("#game-analyze-button-bar .active")?.classList.remove("active");
            document.querySelector(`#game-analyze-${tool}-tool`)?.classList.add("active");
            enableTouchAction();
            switch (tool) {
                case "draw":
                    disableTouchAction();
                    this.goban.setAnalyzeTool(tool, this.analyze_pencil_color);
                    break;
                case "erase":
                    console.log("Erase not supported yet");
                    break;
                case "label":
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
                case "stone":
                    if (subtool == null) {
                        subtool = "alternate";
                    }
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
                case "score":
                    if (subtool == null) {
                        subtool = "black";
                    }
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
                case "removal":
                    this.goban.setAnalyzeTool(tool, subtool);
                    break;
            }
        }

        return false;
    };
    clearAndSync = () => {
        this.goban.syncReviewMove({ clearpen: true });
        this.goban.clearAnalysisDrawing();
        return true;
    };

    /* It's not clear to me if we need this anymore - anoek 2025-07-08 */
    private syncStoneRemoval = () => {
        const goban = this.goban;
        const engine = goban.engine;

        if (
            (engine.phase === "stone removal" || engine.phase === "finished") &&
            engine.outcome !== "Timeout" &&
            engine.outcome !== "Disconnection" &&
            engine.outcome !== "Resignation" &&
            engine.outcome !== "Abandonment" &&
            engine.outcome !== "Cancellation" &&
            goban.mode === "play"
        ) {
            if (engine.phase === "finished" && engine.outcome.indexOf("Server Decision") === 0) {
                if (engine.stalling_score_estimate) {
                    goban.showStallingScoreEstimate(engine.stalling_score_estimate);
                }
            } else {
                const s = engine.computeScore(false);
                goban.showScores(s);
            }
        }
    };
    private syncNeedsSealing = (positions: undefined | JGOFSealingIntersection[]) => {
        console.log("sync_needs_sealing", positions);
        const engine = this.goban.engine;

        const cur_move = engine.cur_move;
        for (const pos of positions || []) {
            const { x, y } = pos;
            const marks = cur_move.getMarks(x, y);
            marks.needs_sealing = true;
            this.goban.drawSquare(x, y);
        }
    };

    setLabelHandler = (event: KeyboardEvent) => {
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

        if (this.goban.mode === "analyze") {
            if (this.goban.analyze_tool === "label") {
                if (event.key && event.key.length === 1) {
                    const ch = event.key.toUpperCase();
                    this.goban.setLabelCharacter(ch);
                    event.preventDefault();
                }
            }
        }
    };
    toggleCoordinates = () => {
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

        this.goban.setLabelPosition(label_position);
    };

    rotateGoban = () => {
        const goban_div = this.goban.config.board_div;

        if (!goban_div) {
            return;
        }

        const d =
            goban_div.style.transform === ""
                ? 0
                : goban_div.style.transform.includes("rotate")
                  ? parseInt(goban_div.style.transform.split("(")[1].split("deg")[0])
                  : 0;

        const newD: number = d !== 270 ? d + 90 : 0;

        goban_div.style.transform = `rotate(${newD}deg)`;

        let gobanTransformArray: GobanTransformSetting[] | undefined = data.get("goban-transform");

        if (!gobanTransformArray) {
            gobanTransformArray = [];
        }

        const foundGame = gobanTransformArray.find((e) => e.game === this.goban.game_id);

        if (foundGame) {
            gobanTransformArray = gobanTransformArray.map((e) => {
                if (e.game === this.goban.game_id) {
                    e.transform = newD;
                }
                return e;
            });
        } else {
            gobanTransformArray.push({ game: this.goban.game_id, transform: newD });
        }

        data.set("goban-transform", gobanTransformArray);
    };

    toggleShowTiming = () => {
        this.show_game_timing = !this.show_game_timing;
        this.emit("show_game_timing", this.show_game_timing);
    };

    toggleShowBotDetectionResults = () => {
        this.show_bot_detection_results = !this.show_bot_detection_results;
        this.emit("show_bot_detection_results", this.show_bot_detection_results);
    };

    gameLogModalMarkCoords = (stones_string: string) => {
        if (!this.goban.config || !this.goban.config.width || !this.goban.config.height) {
            return;
        }
        for (let i = 0; i < this.goban.config.width; i++) {
            for (let j = 0; j < this.goban.config.height; j++) {
                this.goban.deleteCustomMark(i, j, "triangle", true);
            }
        }

        const coord_array = stones_string.split(",").map((item) => item.trim());
        for (let j = 0; j < coord_array.length; j++) {
            const move = this.goban.decodeMoves(coord_array[j])[0];
            this.goban.setMark(move.x, move.y, "triangle", false);
        }
    };
    gameAnalyze = () => {
        if (this.goban.isAnalysisDisabled()) {
            //alert.fire(_("Analysis mode has been disabled for this game"));
        } else {
            const last_estimate_move = this.stopEstimatingScore();

            const cur_move = this.goban.engine.cur_move;
            this.goban.setMode("analyze");
            this.goban.engine.jumpTo(cur_move);
            if (last_estimate_move) {
                this.goban.engine.jumpTo(last_estimate_move);
            }
        }
    };
    toggleZenMode = () => {
        const body = document.getElementsByTagName("body")[0];
        if (this.zen_mode) {
            body.classList.remove("zen"); //remove the class
            this.setZenMode(false);
        } else {
            body.classList.add("zen"); //add the class
            this.setZenMode(true);
        }
        this.emit("view_mode", goban_view_mode());
        this.emit("resize");
    };
    toggleAIReview = () => {
        this._ai_review_enabled = !this._ai_review_enabled;
        preferences.set("ai-review-enabled", this._ai_review_enabled);
        console.log("toggleAIReview", this._ai_review_enabled);
        this.goban.setHeatmap(undefined);
        this.goban.setColoredCircles(undefined);
        this.goban.engine.move_tree.traverse((node: MoveTree) => node.clearAIMarks());
        this.goban.redraw();
        this.emit("ai_review_enabled", this._ai_review_enabled);
    };
    updateVariationName = (ev: ChangeEvent<HTMLInputElement>) => {
        this.setVariationName(ev.target.value);
    };
    shareAnalysis = () => {
        const diff = this.goban.engine.getMoveDiff();
        let name = this.variation_name;
        let auto_named = false;

        if (!name) {
            auto_named = true;
            name = "" + ++this.last_variation_number;
        }

        const marks: { [k: string]: string } = {};
        let mark_ct = 0;
        for (let y = 0; y < this.goban.height; ++y) {
            for (let x = 0; x < this.goban.width; ++x) {
                const pos = this.goban.getMarks(x, y);
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
        if (this.goban.pen_marks.length) {
            analysis.pen_marks = this.goban.pen_marks;
        }

        const las = this.last_analysis_sent;
        if (
            las &&
            las.from === analysis.from &&
            las.moves === analysis.moves &&
            (auto_named || las.name === analysis.name) &&
            ((!analysis.marks && !las.marks) || las.marks === analysis.marks) &&
            ((!analysis.pen_marks && !las.pen_marks) || las.pen_marks === analysis.pen_marks)
        ) {
            if (auto_named) {
                --this.last_variation_number;
            }
            return;
        }

        if (!data.get("user").anonymous) {
            this.goban.sendChat(analysis, this.selected_chat_log);
            this.last_analysis_sent = analysis;
        } else {
            this.goban.showMessage("error", {
                error: { message: "Can't send to the " + this.selected_chat_log + " chat_log" },
            });
        }
    };

    addReview = (review: ReviewListEntry) => {
        console.log("Review added: " + JSON.stringify(review));
        this.review_list.push(review);
        this.review_list.sort(rankingThenUsername);
        if (this.goban.engine.phase === "finished") {
            sfx.play("review_started");
        }
    };

    /*** Game stuff ***/
    handleEscapeKey = () => {
        if (this.zen_mode) {
            this.toggleZenMode();
        }

        if (this.goban) {
            if (this.goban.mode === "score estimation") {
                this.stopEstimatingScore();
            } else if (this.goban.mode === "analyze" && this.game_id) {
                this.goban.setMode("play");
            }
        }
    };

    enterConditionalMovePlanner = () => {
        if (this.goban.isAnalysisDisabled()) {
            //alert.fire(_("Conditional moves have been disabled for this game."));
        } else {
            this.setStashedConditionalMoves(this.goban.conditional_tree.duplicate());
            this.goban.setMode("conditional");
        }
    };
    pauseGame = () => {
        this.goban.pauseGame();
    };
    startReview = () => {
        const user = data.get("user");
        const is_player =
            user.id === this.goban.engine.players.black.id ||
            user.id === this.goban.engine.players.white.id;

        if (this.goban.isAnalysisDisabled() && is_player) {
            //alert.fire(_("Analysis mode has been disabled for this game, you can start a review after the game has concluded."));
        } else {
            alert
                .fire({
                    text: _("Start a review of this game?"),
                    showCancelButton: true,
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        post(`games/${this.game_id}/reviews`, {})
                            .then((res) => browserHistory.push(`/review/${res.id}`))
                            .catch(errorAlerter);
                    }
                })
                .catch(ignore);
        }
    };
    estimateScore = (): boolean => {
        if (this.goban.mode === "conditional") {
            return false;
        }
        this.saveSubmitMove();
        const user = data.get("user");
        const is_player =
            user.id === this.goban.engine.players.black.id ||
            user.id === this.goban.engine.players.white.id ||
            (this.game_id && shared_ip_with_player_map[this.game_id]);

        if (this.goban.isAnalysisDisabled() && is_player) {
            return false;
        }

        if (this.goban.engine.phase === "stone removal") {
            console.log(
                "Cowardly refusing to enter score estimation phase while stone removal phase is active",
            );
            return false;
        }
        this._estimating_score = true;
        this.emit("estimating_score", true);
        const use_ai_estimate =
            this.goban.engine.phase === "finished" || !this.goban.engine.isParticipant(user.id);
        this.goban.setScoringMode(true, use_ai_estimate);
        return true;
    };
    stopEstimatingScore = (): MoveTree | undefined => {
        if (!this._estimating_score) {
            return;
        }
        this._estimating_score = false;
        this.emit("estimating_score", false);
        const ret = this.goban.setScoringMode(false);
        this.goban.hideScores();
        this.goban.score_estimator = null;
        this.goban.engine.jumpTo(ret);
        this.restoreSubmitMove();
        this.goban.updateTitleAndStonePlacement();
        if (this.goban.submit_move) {
            this.goban.enableStonePlacement();
        }
        return ret;
    };

    restoreSubmitMove = () => {
        if (this._stashed_submit_move && this.goban.mode === "play") {
            this.goban.submit_move = this._stashed_submit_move;
            this._stashed_submit_move = undefined;
        }
    };
    saveSubmitMove = () => {
        if (this.goban.submit_move) {
            this._stashed_submit_move = this.goban.submit_move;
        }
    };

    /*** Branch stuff ***/
    deleteBranch = () => {
        if (this.goban.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to delete branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection()?.isCollapsed) {
                return;
            }
        } catch {
            // ignore error
        }

        if (this.goban.engine.cur_move.trunk) {
            void alert.fire({
                text: _(
                    "The current position is not an explored branch, so there is nothing to delete",
                ),
            });
        } else {
            void alert
                .fire({
                    text: _("Are you sure you wish to remove this move branch?"),
                    showCancelButton: true,
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        this.goban.deleteBranch();
                        this.goban.syncReviewMove();
                    }
                });
        }
    };
    copyBranch = () => {
        if (this.goban.mode !== "analyze") {
            return;
        }
        try {
            /* Don't try to copy branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection()?.isCollapsed) {
                return;
            }
        } catch {
            // ignore error
        }

        this.setCopiedNode(this.goban.engine.cur_move);
        this.emit("branch_copied", this.copied_node);
    };
    pasteBranch = () => {
        if (this.goban.mode !== "analyze") {
            return;
        }

        try {
            /* Don't try to paste branches when the user is selecting stuff somewhere on the page */
            if (!window.getSelection()?.isCollapsed) {
                return;
            }
        } catch {
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
            } catch {
                errorAlerter(_("A move conflict has been detected"));
            }
            this.goban.syncReviewMove();
        } else {
            console.log("Nothing copied or cut to paste");
        }
    };

    /*******************/
    /*** Audio stuff ***/
    /*******************/
    private bindAudioEvents(): void {
        const goban = this.goban;
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
}

function rankingThenUsername(a: ReviewListEntry, b: ReviewListEntry): number {
    if (a.owner.ranking === b.owner.ranking) {
        return a.owner.username! < b.owner.username! ? -1 : 1;
    }
    return (a.owner.ranking ?? 0) - (b.owner.ranking ?? 0);
}
