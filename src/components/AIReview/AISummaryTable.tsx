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
import { useState, useMemo } from "react";
import {
    MoveCategory,
    ScoreDiffThresholds,
    AiReviewCategorization,
    DEFAULT_SCORE_DIFF_THRESHOLDS,
} from "goban";
import { MoveListPopover } from "@/components/AIReview/MoveListPopover";

interface AiSummaryTableProperties {
    categorization: AiReviewCategorization | null;
    reviewType: "fast" | "full";
    table_hidden: boolean;
    scoreDiffThresholds: ScoreDiffThresholds;
    onThresholdChange: (category: string, value: number) => void;
    onResetThresholds: () => void;
    includeNegativeScores: boolean;
    onToggleNegativeScores: () => void;
    onPopupMovesChange?: (moves: number[]) => void;
}

// Category constants moved outside component since they never change
const FAST_CATEGORIES = ["Good", "Inaccuracy", "Mistake", "Blunder"] as const;
const FULL_CATEGORIES = ["Excellent", "Great", "Good", "Inaccuracy", "Mistake", "Blunder"] as const;

export function AISummaryTable({
    categorization,
    reviewType,
    table_hidden,
    scoreDiffThresholds,
    onThresholdChange,
    onResetThresholds,
    includeNegativeScores,
    onToggleNegativeScores,
    onPopupMovesChange,
}: AiSummaryTableProperties): React.ReactElement {
    // State management with useState hooks
    const [showMoveList, setShowMoveList] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState<"black" | "white">("black");

    // Helper function for setting up table data - doesn't need memoization as it's called within useMemo
    const setupTableData = (type: "fast" | "full") => {
        const ai_table_rows: string[][] = [];
        const summary_moves_list: {
            blackCount: string;
            blackPercent: string;
            whiteCount: string;
            whitePercent: string;
        }[] = [];

        const categories = type === "fast" ? FAST_CATEGORIES : FULL_CATEGORIES;
        const num_rows = categories.length;

        for (let j = 0; j < num_rows; j++) {
            ai_table_rows.push([categories[j]]);
            summary_moves_list.push({
                blackCount: "",
                blackPercent: "",
                whiteCount: "",
                whitePercent: "",
            });
        }

        return { ai_table_rows, summary_moves_list, num_rows };
    };

    // Memoize the formatted table data to avoid unnecessary recalculations
    const formatted = useMemo(() => {
        if (!categorization) {
            return {
                heading_list: ["Type", "Black", "%", "", "White", "%"],
                body_list: [["", "", "", "", ""]],
                avg_loss: { black: 0, white: 0 },
                median_score_loss: { black: 0, white: 0 },
                strong_move_rate: { black: 0, white: 0 },
                categorized_moves: {
                    black: {
                        Excellent: [],
                        Great: [],
                        Good: [],
                        Inaccuracy: [],
                        Mistake: [],
                        Blunder: [],
                    },
                    white: {
                        Excellent: [],
                        Great: [],
                        Good: [],
                        Inaccuracy: [],
                        Mistake: [],
                        Blunder: [],
                    },
                },
            };
        }

        const { ai_table_rows, summary_moves_list, num_rows } = setupTableData(reviewType);
        const categories = reviewType === "fast" ? FAST_CATEGORIES : FULL_CATEGORIES;

        const totalMoves = {
            black: Object.values(categorization.move_counters.black).reduce(
                (sum, count) => sum + count,
                0,
            ),
            white: Object.values(categorization.move_counters.white).reduce(
                (sum, count) => sum + count,
                0,
            ),
        };

        // Assemble table data
        for (let j = 0; j < num_rows; j++) {
            const cat = categories[j] as MoveCategory;
            summary_moves_list[j].blackCount = categorization.move_counters.black[cat].toString();
            summary_moves_list[j].blackPercent =
                totalMoves.black > 0
                    ? ((100 * categorization.move_counters.black[cat]) / totalMoves.black).toFixed(
                          1,
                      )
                    : "";
            summary_moves_list[j].whiteCount = categorization.move_counters.white[cat].toString();
            summary_moves_list[j].whitePercent =
                totalMoves.white > 0
                    ? ((100 * categorization.move_counters.white[cat]) / totalMoves.white).toFixed(
                          1,
                      )
                    : "";
        }

        for (let j = 0; j < ai_table_rows.length; j++) {
            ai_table_rows[j] = ai_table_rows[j].concat([
                summary_moves_list[j].blackCount,
                summary_moves_list[j].blackPercent,
                "", // Spacer column
                summary_moves_list[j].whiteCount,
                summary_moves_list[j].whitePercent,
            ]);
        }

        return {
            heading_list: ["Type", "Black", "%", "", "White", "%"],
            body_list: ai_table_rows,
            avg_loss: categorization.avg_score_loss,
            median_score_loss: categorization.median_score_loss,
            strong_move_rate: categorization.strong_move_rate,
            categorized_moves: categorization.categorized_moves,
        };
    }, [categorization, reviewType]);

    const editableCategories = ["Excellent", "Great", "Good", "Inaccuracy", "Mistake", "Blunder"];
    const defaultThresholds: { [k: string]: number } = { ...DEFAULT_SCORE_DIFF_THRESHOLDS };

    // Add defensive check for required props
    if (!formatted.body_list || !formatted.heading_list) {
        return <div className="ai-summary-container" />;
    }

    return (
        <div className="ai-summary-container">
            <table
                className="ai-summary-table"
                style={{ display: table_hidden ? "none" : "block" }}
            >
                <thead>
                    <tr>
                        {formatted.heading_list.map((head, index) => {
                            return <th key={index}>{head}</th>;
                        })}
                        <th className="spacer-column" style={{ width: "10px" }}></th>
                        <th className="centered">Δs &lt;</th>
                    </tr>
                </thead>
                <tbody>
                    {formatted.body_list.map((body, b_index) => {
                        const catKey = [
                            "Excellent",
                            "Great",
                            "Good",
                            "Inaccuracy",
                            "Mistake",
                            "Blunder",
                        ][b_index];
                        return (
                            <tr key={b_index}>
                                {body.map((element, e_index) => {
                                    if (e_index === 1 || e_index === 4) {
                                        const color = e_index === 1 ? "black" : "white";
                                        const moves =
                                            formatted.categorized_moves[color][
                                                catKey as MoveCategory
                                            ];
                                        return (
                                            <td key={e_index}>
                                                <div className="move-count-container">
                                                    {element}
                                                    <button
                                                        className={`move-list-button ${
                                                            moves.length === 0 ? "invisible" : ""
                                                        }`}
                                                        onClick={() => {
                                                            if (moves.length > 0) {
                                                                setShowMoveList(true);
                                                                setSelectedCategory(catKey);
                                                                setSelectedColor(color);
                                                                if (onPopupMovesChange) {
                                                                    onPopupMovesChange(
                                                                        moves.map(
                                                                            (move) => move - 1,
                                                                        ),
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        title={
                                                            moves.length > 0
                                                                ? `Show ${color} ${catKey} moves`
                                                                : ""
                                                        }
                                                    >
                                                        <i className="fa fa-chevron-down" />
                                                    </button>
                                                    {showMoveList &&
                                                        selectedCategory === catKey &&
                                                        selectedColor === color && (
                                                            <MoveListPopover
                                                                moves={moves}
                                                                category={catKey}
                                                                color={color}
                                                                onClose={() => {
                                                                    setShowMoveList(false);
                                                                    onPopupMovesChange?.([]);
                                                                }}
                                                            />
                                                        )}
                                                </div>
                                            </td>
                                        );
                                    }
                                    if (e_index === 3) {
                                        return (
                                            <td
                                                key={e_index}
                                                className="spacer-column"
                                                style={{ width: "10px" }}
                                            ></td>
                                        );
                                    }
                                    return <td key={e_index}>{element}</td>;
                                })}
                                <td className="spacer-column" style={{ width: "10px" }}></td>
                                <td className="centered">
                                    {editableCategories.includes(catKey) && catKey !== "Blunder" ? (
                                        <input
                                            type="number"
                                            style={{
                                                width: 60,
                                                textAlign: "center",
                                                display: "block",
                                                margin: "0 auto",
                                                color:
                                                    scoreDiffThresholds[
                                                        catKey as keyof ScoreDiffThresholds
                                                    ] !==
                                                    defaultThresholds[
                                                        catKey as keyof ScoreDiffThresholds
                                                    ]
                                                        ? "#e67c00"
                                                        : undefined,
                                            }}
                                            value={
                                                scoreDiffThresholds[
                                                    catKey as keyof ScoreDiffThresholds
                                                ] !== undefined
                                                    ? scoreDiffThresholds[
                                                          catKey as keyof ScoreDiffThresholds
                                                      ]
                                                    : defaultThresholds[
                                                          catKey as keyof ScoreDiffThresholds
                                                      ]
                                            }
                                            step={0.1}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                if (!isNaN(v)) {
                                                    onThresholdChange(catKey, v);
                                                }
                                            }}
                                        />
                                    ) : null}
                                    {catKey === "Blunder" && (
                                        <button
                                            style={{
                                                marginLeft: 8,
                                                fontSize: "0.8em",
                                                padding: "2px 6px",
                                            }}
                                            onClick={onResetThresholds}
                                        >
                                            ^ reset
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {categorization && categorization.moves_pending > 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: "right" }}>
                                {"Moves pending"}
                            </td>
                            <td>{categorization.moves_pending}</td>
                        </tr>
                    )}
                    <tr>
                        <td colSpan={7}>{"Average score loss per move"}</td>
                        <td>
                            {" "}
                            <button
                                style={{
                                    marginLeft: 8,
                                    fontSize: "0.8em",
                                    padding: "2px 6px",
                                    width: "4.5rem",
                                }}
                                onClick={onToggleNegativeScores}
                            >
                                {includeNegativeScores ? "Δs ±" : "only + Δs"}
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"Black"}</td>
                        <td colSpan={2}>{formatted.avg_loss.black.toFixed(1)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"White"}</td>
                        <td colSpan={2}>{formatted.avg_loss.white.toFixed(1)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={7}>{"Median score loss per move"}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"Black"}</td>
                        <td colSpan={2}>{formatted.median_score_loss.black.toFixed(1)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"White"}</td>
                        <td colSpan={2}>{formatted.median_score_loss.white.toFixed(1)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={7}>{"Strong Move Rate"}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"Black"}</td>
                        <td colSpan={2}>{formatted.strong_move_rate.black.toFixed(0)}%</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{"White"}</td>
                        <td colSpan={2}>{formatted.strong_move_rate.white.toFixed(0)}%</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={7} style={{ fontSize: "0.8em", color: "#666" }}>
                            Review ID: {categorization?.uuid || "not available"}
                        </td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
