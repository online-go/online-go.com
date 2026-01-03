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
import { MoveCategory, AiReviewCategorization as AIReviewCategorization } from "goban";
import { MoveListPopover } from "@/components/AIReview/MoveListPopover";
import { _, interpolate } from "@/lib/translate";

interface SummaryTableProperties {
    categorization: AIReviewCategorization | null;
    table_hidden: boolean;
    onPopupMovesChange?: (moves: number[]) => void;
    isFastReview?: boolean;
    onStartFullReview?: () => void;
    showBecomeSupporterText?: boolean;
}

const CATEGORIES = [
    "Excellent",
    "Great",
    "Good",
    "Joseki",
    "Inaccuracy",
    "Mistake",
    "Blunder",
] as const;

export function SummaryTable({
    categorization,
    table_hidden,
    onPopupMovesChange,
    isFastReview,
    onStartFullReview,
    showBecomeSupporterText,
}: SummaryTableProperties): React.ReactElement {
    const [showMoveList, setShowMoveList] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState<"black" | "white">("black");

    const setupTableData = () => {
        const ai_table_rows: string[][] = [];
        const summary_moves_list: {
            blackCount: string;
            blackPercent: string;
            whiteCount: string;
            whitePercent: string;
        }[] = [];

        const num_rows = CATEGORIES.length;

        for (let j = 0; j < num_rows; j++) {
            ai_table_rows.push([CATEGORIES[j]]);
            summary_moves_list.push({
                blackCount: "",
                blackPercent: "",
                whiteCount: "",
                whitePercent: "",
            });
        }

        return { ai_table_rows, summary_moves_list, num_rows };
    };

    const formatted = useMemo(() => {
        const emptyCategorizedMoves = {
            black: {
                Excellent: [] as number[],
                Great: [] as number[],
                Good: [] as number[],
                Joseki: [] as number[],
                Inaccuracy: [] as number[],
                Mistake: [] as number[],
                Blunder: [] as number[],
            },
            white: {
                Excellent: [] as number[],
                Great: [] as number[],
                Good: [] as number[],
                Joseki: [] as number[],
                Inaccuracy: [] as number[],
                Mistake: [] as number[],
                Blunder: [] as number[],
            },
        };

        if (!categorization) {
            return {
                heading_list: ["Type", "Black", "%", "", "White", "%"],
                body_list: [],
                categorized_moves: emptyCategorizedMoves,
            };
        }

        const { ai_table_rows, summary_moves_list, num_rows } = setupTableData();

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

        for (let j = 0; j < num_rows; j++) {
            const cat = CATEGORIES[j] as MoveCategory;
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
                "",
                summary_moves_list[j].whiteCount,
                summary_moves_list[j].whitePercent,
            ]);
        }

        return {
            heading_list: ["Type", "Black", "%", "", "White", "%"],
            body_list: ai_table_rows,
            categorized_moves: categorization.categorized_moves,
        };
    }, [categorization]);

    if (!formatted.body_list || !formatted.heading_list) {
        return <div className="ai-summary-container" />;
    }

    const getCategoryClass = (category: string): string => {
        return `category-${category.toLowerCase()}`;
    };

    return (
        <div className="ai-summary-container">
            <table
                className="ai-summary-table"
                style={{ display: table_hidden ? "none" : "table" }}
            >
                <thead>
                    <tr>
                        <th>{_("Type")}</th>
                        <th>
                            <div className="player-header">
                                <span className="stone-indicator black" />
                                <span>{_("Black")}</span>
                            </div>
                        </th>
                        <th>%</th>
                        <th className="spacer-column" />
                        <th>
                            <div className="player-header">
                                <span className="stone-indicator white" />
                                <span>{_("White")}</span>
                            </div>
                        </th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    {formatted.body_list.map((body, b_index) => {
                        const catKey = CATEGORIES[b_index];
                        if (!catKey) {
                            return null;
                        }
                        return (
                            <tr key={b_index} className={getCategoryClass(catKey)}>
                                <td>
                                    <div className={`category-label ${catKey.toLowerCase()}`}>
                                        <span className="category-indicator" />
                                        <span>{catKey}</span>
                                    </div>
                                </td>
                                {body.slice(1).map((element, e_index) => {
                                    const actualIndex = e_index + 1;
                                    if (actualIndex === 1 || actualIndex === 4) {
                                        const color = actualIndex === 1 ? "black" : "white";
                                        const moves =
                                            formatted.categorized_moves[color][
                                                catKey as MoveCategory
                                            ];
                                        return (
                                            <td key={e_index}>
                                                <div className="move-count-container">
                                                    <span>{element}</span>
                                                    <button
                                                        className={`move-list-button ${
                                                            moves.length === 0 ? "invisible" : ""
                                                        }`}
                                                        onClick={() => {
                                                            if (moves.length > 0) {
                                                                const isCurrentlyOpen =
                                                                    showMoveList &&
                                                                    selectedCategory === catKey &&
                                                                    selectedColor === color;

                                                                if (isCurrentlyOpen) {
                                                                    setShowMoveList(false);
                                                                    onPopupMovesChange?.([]);
                                                                } else {
                                                                    setShowMoveList(true);
                                                                    setSelectedCategory(catKey);
                                                                    setSelectedColor(color);
                                                                    onPopupMovesChange?.(
                                                                        moves.map(
                                                                            (move) => move - 1,
                                                                        ),
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        title={
                                                            moves.length > 0
                                                                ? interpolate(
                                                                      _(
                                                                          "Show {{color}} {{category}} moves",
                                                                      ),
                                                                      {
                                                                          color: _(color),
                                                                          category: _(catKey),
                                                                      },
                                                                  )
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
                                                                showFullReviewPrompt={isFastReview}
                                                                onStartFullReview={
                                                                    onStartFullReview
                                                                }
                                                                showBecomeSupporterText={
                                                                    showBecomeSupporterText
                                                                }
                                                            />
                                                        )}
                                                </div>
                                            </td>
                                        );
                                    }
                                    if (actualIndex === 3) {
                                        return <td key={e_index} className="spacer-column" />;
                                    }
                                    if (actualIndex === 2 || actualIndex === 5) {
                                        return (
                                            <td key={e_index}>
                                                <span className="percent-value">
                                                    {element ? `${element}%` : ""}
                                                </span>
                                            </td>
                                        );
                                    }
                                    return <td key={e_index}>{element}</td>;
                                })}
                            </tr>
                        );
                    })}
                    {categorization && categorization.moves_pending > 0 && (
                        <tr className="pending-row">
                            <td colSpan={5} style={{ textAlign: "right" }}>
                                {_("Moves pending")}
                            </td>
                            <td>{categorization.moves_pending}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
