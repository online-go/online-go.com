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
import {
    AnalysisTool,
    ConditionalMoveResponseTree,
    ConditionalMoveTree,
    GobanModes,
    GobanRenderer,
    MoveTree,
    color_blend,
} from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { GobanController } from "@/lib/GobanController";
import { toast } from "@/lib/toast";
import { _ } from "@/lib/translate";
import { enableTouchAction } from "@/views/Game/touch_actions";
import "./GobanAnalyzeButtonBar.css";

interface GobanAnalyzeButtonBarProps {
    controller: GobanController;
    showBackToGame?: boolean;
    showConditionalPlannerButton?: boolean;
}

export function GobanAnalyzeButtonBar({
    controller,
    showBackToGame = true,
    showConditionalPlannerButton = true,
}: GobanAnalyzeButtonBarProps): React.ReactElement {
    const setAnalyzeTool = controller.setAnalyzeTool;
    const setAnalyzePencilColor = controller.setAnalyzePencilColor;
    const analyze_pencil_color = controller.analyze_pencil_color;
    const [analyze_tool, set_analyze_tool] = React.useState<AnalysisTool>();
    const [analyze_subtool, set_analyze_subtool] = React.useState<string>();
    const [analyze_score_color, setAnalyzeScoreColor] =
        preferences.usePreference("analysis.score-color");
    const [is_review, set_is_review] = React.useState(!!controller.goban.review_id);
    const [mode, set_mode] = React.useState<GobanModes>();
    const [copied_node, set_copied_node] = React.useState<MoveTree | undefined>(undefined);

    const goban = controller.goban;

    React.useEffect(() => {
        const onLoad = () => {
            set_analyze_tool(goban.analyze_tool);
            set_analyze_subtool(goban.analyze_subtool);
        };

        set_is_review(!!goban.review_id);
        set_mode(goban.mode);
        set_copied_node(controller.copied_node);

        goban.on("load", onLoad);
        goban.on("analyze_tool", set_analyze_tool);
        goban.on("analyze_subtool", set_analyze_subtool);
        goban.on("mode", set_mode);
        controller.on("copied_node", set_copied_node);

        return () => {
            goban.off("load", onLoad);
            goban.off("analyze_tool", set_analyze_tool);
            goban.off("analyze_subtool", set_analyze_subtool);
            goban.off("mode", set_mode);
            controller.off("copied_node", set_copied_node);
        };
    }, [controller, goban]);

    const setPencilColor = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const color = ev.target.value;
        if (goban.analyze_tool === "draw") {
            goban.analyze_subtool = color;
        }
        setAnalyzePencilColor(color);
    };

    const clearAnalysisDrawing = () => {
        goban.syncReviewMove({ clearpen: true });
        goban.clearAnalysisDrawing();
    };

    const setScoreColor = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const color = ev.target.value;
        if (goban.analyze_tool === "score") {
            goban.analyze_subtool = color;
        }
        setAnalyzeScoreColor(color);
    };

    const user_id = data.get("user").id;
    const is_player =
        goban.engine.players.black.id === user_id || goban.engine.players.white.id === user_id;

    return (
        <div id="game-analyze-button-bar" className="game-analyze-button-bar">
            <div className="btn-group">
                <button
                    id="game-analyze-stone-tool"
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
                        (analyze_tool === "stone" && analyze_subtool === "black" ? "active" : "")
                    }
                >
                    <img alt="" src={data.get("config.cdn_release") + "/img/black.png"} />
                </button>

                <button
                    onClick={() => setAnalyzeTool("stone", "white")}
                    title={_("Place white stones")}
                    className={
                        "stone-button " +
                        (analyze_tool === "stone" && analyze_subtool === "white" ? "active" : "")
                    }
                >
                    <img alt="" src={data.get("config.cdn_release") + "/img/white.png"} />
                </button>

                <button
                    id="game-analyze-removal-tool"
                    onClick={() => setAnalyzeTool("removal", "")}
                    title={_("Mark stones for removal")}
                    className={
                        "stone-removal-button " + (analyze_tool === "removal" ? "active" : "")
                    }
                >
                    <i className="ogs-label-x removal"></i>
                </button>

                <button className="pass-button" onClick={() => goban.pass()}>
                    {_("Pass")}
                </button>
            </div>

            <div className="btn-group">
                <button
                    id="game-analyze-draw-tool"
                    onClick={() => setAnalyzeTool("draw", analyze_pencil_color)}
                    title={_("Draw on the board with a pen")}
                    className={analyze_tool === "draw" ? "active" : ""}
                >
                    <i className="fa fa-pencil"></i>
                </button>
                <input
                    type="color"
                    value={analyze_pencil_color}
                    title={_("Select pen color")}
                    onChange={setPencilColor}
                />
                <button onClick={clearAnalysisDrawing} title={_("Clear pen marks")}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>

            <div className="btn-group">
                <button onClick={() => controller.copyBranch()} title={_("Copy this branch")}>
                    <i className="fa fa-clone"></i>
                </button>
                <button
                    disabled={copied_node == null}
                    onClick={() => controller.pasteBranch()}
                    title={_("Paste branch")}
                >
                    <i className="fa fa-clipboard"></i>
                </button>
                <button onClick={controller.deleteBranch} title={_("Delete branch")}>
                    <i className="fa fa-trash"></i>
                </button>
            </div>

            <div className="btn-group">
                <button
                    id="game-analyze-label-tool"
                    onClick={() => setAnalyzeTool("label", "letters")}
                    title={_("Place alphabetical labels")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "letters" ? "active" : ""
                    }
                >
                    <i className="fa fa-font"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "numbers")}
                    title={_("Place numeric labels")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "numbers" ? "active" : ""
                    }
                >
                    <i className="ogs-label-number"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "triangle")}
                    title={_("Place triangle marks")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "triangle" ? "active" : ""
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

            <div className="btn-group">
                <button
                    id="game-analyze-score-tool"
                    onClick={() => setAnalyzeTool("score", "black")}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" && analyze_subtool === "black" ? "active" : "")
                    }
                >
                    <span className="score-square black"></span>
                </button>

                <button
                    onClick={() => setAnalyzeTool("score", "white")}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" && analyze_subtool === "white" ? "active" : "")
                    }
                >
                    <span className="score-square white"></span>
                </button>

                <button
                    onClick={() => setAnalyzeTool("score", analyze_score_color)}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" &&
                        analyze_subtool !== "white" &&
                        analyze_subtool !== "black"
                            ? "active"
                            : "")
                    }
                >
                    <span
                        className="score-square custom"
                        style={{
                            backgroundColor: analyze_score_color,
                            borderColor: color_blend("#888888", analyze_score_color),
                        }}
                    ></span>
                </button>

                <input
                    type="color"
                    value={analyze_score_color}
                    title={_("Select score")}
                    onChange={setScoreColor}
                />

                <button onClick={() => goban.markAnalysisScores()} title={_("Score")}>
                    <i className="fa fa-calculator"></i>
                </button>

                <button onClick={() => goban.clearAnalysisScores()} title={_("Clear scores")}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>

            {showConditionalPlannerButton &&
            !is_review &&
            !goban.engine.rengo &&
            is_player &&
            goban.engine.phase !== "finished" ? (
                <div className="btn-group">
                    <button
                        onClick={() => automateBranch(goban)}
                        title={_("Copy branch to conditional move planner")}
                        disabled={user_id === goban.engine.playerToMoveOnOfficialBranch()}
                    >
                        <i className="fa fa-exchange"></i>
                    </button>
                </div>
            ) : null}

            {showBackToGame && mode === "analyze" && !is_review ? (
                <div className="analyze-mode-buttons">
                    <span>
                        <button
                            className="sm primary bold"
                            onClick={() => {
                                enableTouchAction();
                                goban.setModeDeferred("play");
                            }}
                        >
                            {_("Back to Game")}
                        </button>
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function diffToConditionalMove(moves: string): ConditionalMoveTree {
    let tree = new ConditionalMoveTree(null);

    for (let i = 0; i < moves.length; i += 2) {
        const move = moves.slice(i, i + 2);
        const parent = new ConditionalMoveTree(null, tree);
        parent.move = move;
        tree = parent;
    }

    return tree;
}

function mergeConditionalMoves(
    a: ConditionalMoveTree,
    b: ConditionalMoveTree,
): ConditionalMoveTree {
    const treeA = a.encode()[1];
    const treeB = b.encode()[1];
    mergeConditionalTrees(treeA, treeB);
    return ConditionalMoveTree.decode([null, treeA]);
}

function mergeConditionalTrees(
    a: ConditionalMoveResponseTree,
    b: ConditionalMoveResponseTree,
): void {
    if (a === b) {
        return;
    }

    for (const move in b) {
        if (!Object.prototype.hasOwnProperty.call(a, move)) {
            a[move] = JSON.parse(JSON.stringify(b[move]));
            continue;
        }

        const [responseA, nextA] = a[move];
        const [responseB, nextB] = b[move];
        if (responseA !== responseB) {
            a[move] = JSON.parse(JSON.stringify(b[move]));
            continue;
        }

        mergeConditionalTrees(nextA, nextB);
    }
}

function automateBranch(goban: GobanRenderer): void {
    if (goban.engine.phase === "finished") {
        return;
    }

    if (goban.engine.rengo) {
        toast(<div>{_("You cannot make conditional moves in Rengo games.")}</div>, 2000);
        return;
    }

    if (data.get("user").id === goban.engine.playerToMoveOnOfficialBranch()) {
        toast(<div>{_("You cannot make conditional moves on your turn.")}</div>, 2000);
        return;
    }

    const diff = goban.engine.getMoveDiff();

    if (diff.from !== goban.engine.last_official_move.move_number) {
        toast(<div>{_("Outdated branch")}</div>, 1000);
        return;
    }

    const before = goban.conditional_tree.duplicate();
    const tree = mergeConditionalMoves(before, diffToConditionalMove(diff.moves));

    goban.setConditionalTree(tree);
    goban.saveConditionalMoves();
    goban.setConditionalTree(before);
    toast(<div>{_("Copied branch to the conditional move planner")}</div>, 2000);
}
