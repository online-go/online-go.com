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
    MoveCategory,
    MoveNumbers,
    ScoreDiffThresholds,
    CategorizationMethod,
} from "@/lib/ai_review_move_categories";
import { MoveListPopover } from "@/components/AIReview/MoveListPopover";

interface AiSummaryTableProperties {
    /** headings for ai review table */
    heading_list: string[];
    /** the body of the table excluding the average score loss part */
    body_list: string[][];
    /** values for the average score loss */
    avg_loss: { black: number; white: number };
    median_score_loss: { black: number; white: number };
    strong_move_rate: { black: number; white: number };
    table_hidden: boolean;
    pending_entries: number;
    max_entries: number;
    scoreDiffThresholds: ScoreDiffThresholds;
    categorization_method: CategorizationMethod;
    onThresholdChange: (category: string, value: number) => void;
    onResetThresholds: () => void;
    includeNegativeScores: boolean;
    onToggleNegativeScores: () => void;
    categorized_moves: MoveNumbers;
}

interface AiSummaryTableState {
    showMoveList: boolean;
    selectedCategory: string;
    selectedColor: "black" | "white";
}

export class AiSummaryTable extends React.Component<AiSummaryTableProperties, AiSummaryTableState> {
    state = {
        showMoveList: false,
        selectedCategory: "",
        selectedColor: "black" as "black" | "white",
    };

    constructor(props: AiSummaryTableProperties) {
        super(props);
    }

    render(): React.ReactElement {
        // Determine which categories should have editable thresholds
        const { scoreDiffThresholds, categorization_method, onThresholdChange, onResetThresholds } =
            this.props;
        // For 'old', only Good, Inaccuracy, Mistake, Blunder; for 'new', all
        const editableCategories =
            categorization_method === "new"
                ? ["Excellent", "Great", "Good", "Inaccuracy", "Mistake", "Blunder"]
                : ["Good", "Inaccuracy", "Mistake", "Blunder"];
        // Default values for display (should match those in ai_review_move_categories)
        const defaultThresholds: { [k: string]: number } = {
            Excellent: 0.2,
            Great: 0.6,
            Good: 1.0,
            Inaccuracy: 2.0,
            Mistake: 5.0,
        };
        if (categorization_method === "old") {
            defaultThresholds.Good = 1;
            defaultThresholds.Inaccuracy = 2;
            defaultThresholds.Mistake = 5;
        }

        // Add defensive check for required props
        if (!this.props.body_list || !this.props.heading_list) {
            return <div className="ai-summary-container" />;
        }

        return (
            <div className="ai-summary-container">
                <table
                    className="ai-summary-table"
                    style={{ display: this.props.table_hidden ? "none" : "block" }}
                >
                    <thead>
                        <tr>
                            {this.props.heading_list.map((head, index) => {
                                return <th key={index}>{head}</th>;
                            })}
                            <th className="spacer-column" style={{ width: "10px" }}></th>
                            <th className="centered">Δs &lt;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.body_list.map((body, b_index) => {
                            // Use the translation function to get the English key
                            // (since body[0] is translated)
                            // We'll map by index instead:
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
                                            // Black and White count columns
                                            const color = e_index === 1 ? "black" : "white";
                                            const moves =
                                                this.props.categorized_moves[color][
                                                    catKey as MoveCategory
                                                ];
                                            return (
                                                <td key={e_index}>
                                                    <div className="move-count-container">
                                                        {element}
                                                        <button
                                                            className={`move-list-button ${
                                                                moves.length === 0
                                                                    ? "invisible"
                                                                    : ""
                                                            }`}
                                                            onClick={() => {
                                                                if (moves.length > 0) {
                                                                    this.setState({
                                                                        showMoveList: true,
                                                                        selectedCategory: catKey,
                                                                        selectedColor: color,
                                                                    });
                                                                }
                                                            }}
                                                            title={
                                                                moves.length > 0
                                                                    ? `Show ${color} ${catKey} moves`
                                                                    : `No ${color} ${catKey} moves`
                                                            }
                                                        >
                                                            <i className="fa fa-chevron-down" />
                                                        </button>
                                                        {this.state.showMoveList &&
                                                            this.state.selectedCategory ===
                                                                catKey &&
                                                            this.state.selectedColor === color && (
                                                                <MoveListPopover
                                                                    moves={moves}
                                                                    category={catKey}
                                                                    color={color}
                                                                    onClose={() =>
                                                                        this.setState({
                                                                            showMoveList: false,
                                                                        })
                                                                    }
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
                                        {editableCategories.includes(catKey) &&
                                        catKey !== "Blunder" ? (
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
                        {this.props.pending_entries > 0 && (
                            <React.Fragment>
                                <tr>
                                    <td colSpan={2}>{"Moves Pending"}</td>
                                    <td colSpan={3}>{this.props.pending_entries}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colSpan={5}>
                                        <progress
                                            value={
                                                this.props.max_entries - this.props.pending_entries
                                            }
                                            max={this.props.max_entries}
                                        ></progress>
                                    </td>
                                    <td></td>
                                </tr>
                            </React.Fragment>
                        )}
                        <tr>
                            <td colSpan={5}>{"Average score loss per move"}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"Black"}</td>
                            <td colSpan={3}>{this.props.avg_loss.black}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"White"}</td>
                            <td colSpan={3}>{this.props.avg_loss.white}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={5}>{"Median score loss per move"}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"Black"}</td>
                            <td colSpan={3}>{this.props.median_score_loss.black}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"White"}</td>
                            <td colSpan={3}>{this.props.median_score_loss.white}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={5}>{"Strong Move Rate"}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"Black"}</td>
                            <td colSpan={3}>{this.props.strong_move_rate.black}%</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>{"White"}</td>
                            <td colSpan={3}>{this.props.strong_move_rate.white}%</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
