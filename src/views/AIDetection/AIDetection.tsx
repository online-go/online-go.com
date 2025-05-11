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

    const hide_bad_data = true;

    return (
        <div id="AI-Detection">
            <h1>AI Detection</h1>
            <PaginatedTable
                name="ai-detection"
                className="ai-detection"
                source="games/ai_detection"
                pageSizeOptions={[10, 25, 50, 100]}
                columns={[
                    {
                        header: _("Game"),
                        render: (row: rest_api.GameAIDetection) => (
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
                        render: (row) => <Player user={row.players.black} />,
                    },
                    {
                        header: _("APL"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.black.id]?.average_point_loss !=
                            null ? (
                                <span title="Average point loss per move">
                                    {row.bot_detection_results[
                                        row.players.black.id
                                    ].average_point_loss.toFixed(2)}
                                </span>
                            ) : null,
                    },
                    {
                        header: _("Blur"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.black.id]?.blur_rate != null ? (
                                <span title="Window blur rate - percentage of time spent with window not in focus">
                                    {Math.round(
                                        row.bot_detection_results[row.players.black.id].blur_rate,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                    {
                        header: _("SGF"),
                        render: (row) => (
                            <span title="SGF downloads">
                                {row.bot_detection_results?.[row.players.black.id]
                                    ?.has_sgf_downloads ? (
                                    <i className="fa fa-download" style={{ color: "#666" }} />
                                ) : null}
                            </span>
                        ),
                    },
                    {
                        header: _("Timing"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.black.id]?.timing_consistency !=
                            null ? (
                                <span title="Timing consistency score">
                                    {row.bot_detection_results[
                                        row.players.black.id
                                    ].timing_consistency.toFixed(0)}
                                </span>
                            ) : null,
                    },
                    {
                        header: _("Composite"),
                        render: (row) => (
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                                {!hide_bad_data &&
                                    row.bot_detection_results?.ai_suspected?.includes(
                                        row.players.black.id,
                                    ) && (
                                        <i
                                            className="fa fa-flag"
                                            style={{ marginRight: "0.5em", color: "red" }}
                                        />
                                    )}
                                {!hide_bad_data &&
                                    row.bot_detection_results?.[row.players.black.id]?.composite !=
                                        null && (
                                        <span title="AI Detection composite score">
                                            {row.bot_detection_results[
                                                row.players.black.id
                                            ].composite.toFixed(2)}
                                        </span>
                                    )}
                            </span>
                        ),
                    },
                    {
                        header: _("AILR"),
                        render: (row) =>
                            !hide_bad_data &&
                            row.bot_detection_results?.[row.players.black.id]?.AILR != null ? (
                                <span title="AI-like moves">
                                    {row.bot_detection_results[row.players.black.id].AILR.toFixed(
                                        0,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                    {
                        header: _("White"),
                        render: (row) => <Player user={row.players.white} />,
                    },
                    {
                        header: _("APL"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.white.id]?.average_point_loss !=
                            null ? (
                                <span title="Average point loss per move">
                                    {(-row.bot_detection_results[row.players.white.id]
                                        .average_point_loss).toFixed(2)}
                                </span>
                            ) : null,
                    },
                    {
                        header: _("Blur"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.white.id]?.blur_rate != null ? (
                                <span title="Window blur rate - percentage of time spent with window not in focus">
                                    {Math.round(
                                        row.bot_detection_results[row.players.white.id].blur_rate,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                    {
                        header: _("SGF"),
                        render: (row) => (
                            <span title="SGF downloads">
                                {row.bot_detection_results?.[row.players.white.id]
                                    ?.has_sgf_downloads ? (
                                    <i className="fa fa-download" style={{ color: "#666" }} />
                                ) : null}
                            </span>
                        ),
                    },
                    {
                        header: _("Timing"),
                        render: (row) =>
                            row.bot_detection_results?.[row.players.white.id]?.timing_consistency !=
                            null ? (
                                <span title="Timing consistency score">
                                    {row.bot_detection_results[
                                        row.players.white.id
                                    ].timing_consistency.toFixed(0)}
                                </span>
                            ) : null,
                    },
                    {
                        header: _("Composite"),
                        render: (row) => (
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                                {!hide_bad_data &&
                                    row.bot_detection_results?.ai_suspected?.includes(
                                        row.players.white.id,
                                    ) && (
                                        <i
                                            className="fa fa-flag"
                                            style={{ marginRight: "0.5em", color: "red" }}
                                        />
                                    )}
                                {!hide_bad_data &&
                                    row.bot_detection_results?.[row.players.white.id]?.composite !=
                                        null && (
                                        <span title="AI Detection composite score">
                                            {row.bot_detection_results[
                                                row.players.white.id
                                            ].composite.toFixed(2)}
                                        </span>
                                    )}
                            </span>
                        ),
                    },
                    {
                        header: _("AILR"),
                        render: (row) =>
                            !hide_bad_data &&
                            row.bot_detection_results?.[row.players.white.id]?.AILR != null ? (
                                <span title="AI-like moves">
                                    {row.bot_detection_results[row.players.white.id].AILR.toFixed(
                                        0,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                ]}
            />
        </div>
    );
}
