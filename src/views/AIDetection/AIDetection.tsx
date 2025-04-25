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
import { _ } from "@/lib/translate";
import { Player } from "@/components/Player";
import * as data from "@/lib/data";
import { MODERATOR_POWERS } from "@/lib/moderation";
import { PaginatedTable } from "@/components/PaginatedTable";
import { ReviewStrengthIcon } from "@/views/Game/AIReview";
//import { alert } from "@/lib/swal_config";

export function AIDetection(): React.ReactElement | null {
    const user = data.get("user");

    if (!user.is_moderator && (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) === 0) {
        return null;
    }

    return (
        <div id="AI-Detection">
            <h1>AI Detection</h1>
            <PaginatedTable
                name="ai-detection"
                className="ai-detection"
                source="games/ai_detection"
                columns={[
                    {
                        header: _("Game"),
                        render: (row: rest_api.GameAIDetection) => (
                            // Inline styles to avoid messing with Player and ReviewStrengthIcon styles globally
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <a
                                    href={`/game/${row.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    #{row.id}
                                </a>

                                {row.bot_detection_results?.ai_review_params && (
                                    <ReviewStrengthIcon
                                        review={row.bot_detection_results.ai_review_params}
                                    />
                                )}
                                {!row.bot_detection_results?.ai_review_params && (
                                    <i className="fa fa-question-circle" />
                                )}
                            </span>
                        ),
                    },
                    {
                        header: "moves",
                        headerProps: {
                            style: { textAlign: "center" },
                        },
                        render: (row) => row.length,
                        cellProps: {
                            style: { textAlign: "center" },
                        },
                    },
                    {
                        header: _("Black"),
                        render: (row) => (
                            <>
                                <Player user={row.players.black} />
                                {row.bot_detection_results?.ai_suspected?.includes(
                                    row.players.black.id,
                                ) && (
                                    <i
                                        className="fa fa-flag"
                                        style={{ marginLeft: "0.5em", color: "red" }}
                                    />
                                )}
                                {row.bot_detection_results?.black_composite != null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="AI Detection composite score"
                                    >
                                        <i className="fa fa-calculator" />
                                        {row.bot_detection_results.black_composite.toFixed(2)}
                                    </span>
                                )}
                                {row.bot_detection_results?.[row.players.black.id]
                                    ?.average_point_loss != null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="Average point loss per move"
                                    >
                                        <i className="fa fa-arrow-circle-down" />
                                        {row.bot_detection_results[
                                            row.players.black.id
                                        ].average_point_loss.toFixed(2)}
                                    </span>
                                )}
                                {row.bot_detection_results?.[row.players.black.id]?.blur_rate !=
                                    null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="Blur rate"
                                    >
                                        <i className="fa fa-window-restore" />
                                        {Math.round(
                                            row.bot_detection_results[row.players.black.id]
                                                .blur_rate,
                                        )}
                                        %
                                    </span>
                                )}
                            </>
                        ),
                    },
                    {
                        header: _("White"),
                        render: (row) => (
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                                <Player user={row.players.white} />

                                {row.bot_detection_results?.ai_suspected?.includes(
                                    row.players.white.id,
                                ) && (
                                    <i
                                        className="fa fa-flag"
                                        style={{ marginLeft: "0.5em", color: "red" }}
                                    />
                                )}
                                {row.bot_detection_results?.white_composite != null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="AI Detection composite score"
                                    >
                                        <i className="fa fa-calculator" />
                                        {row.bot_detection_results.white_composite.toFixed(2)}
                                    </span>
                                )}
                                {row.bot_detection_results?.[row.players.white.id]
                                    ?.average_point_loss != null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="Average point loss per move"
                                    >
                                        <i className="fa fa-arrow-circle-down" />
                                        {(-row.bot_detection_results[row.players.white.id]
                                            .average_point_loss).toFixed(2)}
                                    </span>
                                )}
                                {row.bot_detection_results?.[row.players.white.id]?.blur_rate !=
                                    null && (
                                    <span
                                        style={{ marginLeft: "0.5em", color: "#666" }}
                                        title="Window blur rate - percentage of time spent with window not in focus"
                                    >
                                        <i className="fa fa-window-restore" />
                                        {Math.round(
                                            row.bot_detection_results[row.players.white.id]
                                                .blur_rate,
                                        )}
                                        %
                                    </span>
                                )}
                            </span>
                        ),
                    },
                ]}
            />
        </div>
    );
}
