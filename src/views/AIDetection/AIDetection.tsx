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
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { useSearchParams } from "react-router-dom";
import { getGameResultRichText } from "../User/GameHistoryTable";
//import { alert } from "@/lib/swal_config";

const MIN_ANALYZER_VERSION = "2025-05-13-04";
const BROKEN_DATA = "😿";

type GroomedGameAIDetection = rest_api.GameAIDetection & {
    first_column_player: number;
    second_column_player: number;
    is_old_version: boolean;
    outcome: string;
};

export function AIDetection(): React.ReactElement | null {
    const user = data.get("user");
    const [player_filter, setPlayerFilter] = React.useState<number>();
    // This lets us normally hide dubious analysis columns, but still be able
    // to see them if we need to while debugging them.
    const [searchParams] = useSearchParams();
    const show_all = searchParams.get("show_all") === "true";

    if (!user.is_moderator && (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) === 0) {
        return null;
    }

    return (
        <div id="AI-Detection">
            <h1>AI Detection</h1>
            <div className="game-options">
                <div
                    className="search"
                    style={{ display: "flex", alignItems: "center", paddingBottom: "0.5rem" }}
                >
                    <i className="fa fa-search"></i>
                    <PlayerAutocomplete
                        onComplete={(player) => {
                            setPlayerFilter(player?.id);
                        }}
                    />
                </div>
            </div>
            <PaginatedTable
                name="ai-detection"
                className="ai-detection"
                source="games/ai_detection"
                pageSizeOptions={[10, 25, 50, 100]}
                filter={{
                    ...(player_filter !== undefined && {
                        player: player_filter,
                    }),
                }}
                // If we're filtering by a player, put that person always in the first column,
                // so that we can scan down their data easily.
                groom={(data: rest_api.GameAIDetection[]): GroomedGameAIDetection[] => {
                    return data.map((row) => ({
                        ...row,
                        first_column_player: player_filter ? player_filter : row.players.black.id,
                        second_column_player: player_filter
                            ? player_filter === row.players.black.id
                                ? row.players.white.id
                                : row.players.black.id
                            : row.players.white.id,
                        is_old_version:
                            !row.bot_detection_results ||
                            !row.bot_detection_results.analyzer_version ||
                            row.bot_detection_results.analyzer_version < MIN_ANALYZER_VERSION,
                        outcome: row.outcome,
                    }));
                }}
                columns={[
                    {
                        header: _("Game"),
                        render: (row) => (
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
                            style: {
                                textAlign: "center",
                                width: "4rem",
                                maxWidth: "4rem",
                            },
                        },
                        render: (row) => <span style={{ margin: 0 }}>{row.final_move_count}</span>,
                        cellProps: {
                            style: {
                                textAlign: "center",
                                width: "4rem",
                                maxWidth: "4rem",
                                margin: 0,
                            },
                        },
                    },
                    {
                        header: _(""),
                        render: (row) => {
                            const isBlack = row.players.black.id === row.first_column_player;
                            const won = isBlack ? !row.black_lost : !row.white_lost;
                            return (
                                <span
                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    {won && (
                                        <i className="fa fa-trophy" style={{ color: "#FFD700" }} />
                                    )}
                                    <Player user={row.first_column_player} />
                                </span>
                            );
                        },
                        cellProps: {
                            style: {
                                "max-width": "7rem",
                            },
                        },
                    },

                    {
                        header: _("APL"),
                        render: (row: GroomedGameAIDetection) =>
                            !row.is_old_version &&
                            row.bot_detection_results?.[row.first_column_player]
                                ?.average_point_loss != null ? (
                                <span title="Average point loss per move">
                                    {row.bot_detection_results[
                                        row.first_column_player
                                    ].average_point_loss.toFixed(2)}
                                </span>
                            ) : null,
                    },

                    {
                        header: _("Blur"),
                        render: (row: GroomedGameAIDetection) =>
                            row.bot_detection_results?.[row.first_column_player]?.blur_rate !=
                            null ? (
                                <span title="Window blur rate - percentage of time spent with window not in focus">
                                    {Math.round(
                                        row.bot_detection_results[row.first_column_player]
                                            .blur_rate,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                    {
                        header: _("SGF"),
                        render: (row: GroomedGameAIDetection) => (
                            <span title="SGF downloads">
                                {row.bot_detection_results?.[row.first_column_player]
                                    ?.has_sgf_downloads ? (
                                    <i className="fa fa-download" style={{ color: "#666" }} />
                                ) : null}
                            </span>
                        ),
                    },
                    ...(show_all
                        ? [
                              {
                                  header: _("Timing"),
                                  render: (row: GroomedGameAIDetection) =>
                                      row.bot_detection_results?.[row.first_column_player]
                                          ?.timing_consistency != null ? (
                                          <span title="Timing consistency score">
                                              {row.bot_detection_results[
                                                  row.first_column_player
                                              ].timing_consistency.toFixed(0)}
                                          </span>
                                      ) : null,
                              },
                          ]
                        : []),
                    {
                        header: _("AILR"),
                        render: (row: GroomedGameAIDetection) =>
                            row.is_old_version ? null : row.bot_detection_results?.[
                                  row.first_column_player
                              ]?.AILR != null ? (
                                <span title="AI-like moves">
                                    {row.bot_detection_results[
                                        row.first_column_player
                                    ].AILR.toFixed(0)}
                                    %
                                </span>
                            ) : (
                                BROKEN_DATA
                            ),
                    },
                    ...(show_all
                        ? [
                              {
                                  header: _("Composite"),
                                  render: (row: GroomedGameAIDetection) =>
                                      !row.is_old_version ? (
                                          <span
                                              style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                              }}
                                              title="AI Detection composite score"
                                          >
                                              {row.bot_detection_results?.ai_suspected?.includes(
                                                  row.first_column_player,
                                              ) && (
                                                  <i
                                                      className="fa fa-flag"
                                                      style={{ marginRight: "0.5em", color: "red" }}
                                                  />
                                              )}
                                              {row.bot_detection_results?.[row.first_column_player]
                                                  ?.composite != null && (
                                                  <>
                                                      {row.bot_detection_results[
                                                          row.first_column_player
                                                      ].composite.toFixed(2)}
                                                  </>
                                              )}
                                          </span>
                                      ) : null,
                              },
                          ]
                        : []),

                    {
                        header: _(""),
                        render: (row: GroomedGameAIDetection) => {
                            const isBlack = row.players.black.id === row.second_column_player;
                            const won = isBlack ? !row.black_lost : !row.white_lost;
                            return (
                                <span
                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    {won && (
                                        <i className="fa fa-trophy" style={{ color: "#FFD700" }} />
                                    )}
                                    <Player user={row.second_column_player} />
                                </span>
                            );
                        },
                        cellProps: {
                            style: {
                                "max-width": "7rem",
                            },
                        },
                    },

                    {
                        header: _("APL"),
                        render: (row: GroomedGameAIDetection) =>
                            !row.is_old_version &&
                            row.bot_detection_results?.[row.second_column_player]
                                ?.average_point_loss != null ? (
                                <span title="Average point loss per move">
                                    {(-row.bot_detection_results[row.second_column_player]
                                        .average_point_loss).toFixed(2)}
                                </span>
                            ) : null,
                    },

                    {
                        header: _("Blur"),
                        render: (row: GroomedGameAIDetection) =>
                            row.bot_detection_results?.[row.second_column_player]?.blur_rate !=
                            null ? (
                                <span title="Window blur rate - percentage of time spent with window not in focus">
                                    {Math.round(
                                        row.bot_detection_results[row.second_column_player]
                                            .blur_rate,
                                    )}
                                    %
                                </span>
                            ) : null,
                    },
                    {
                        header: _("SGF"),
                        render: (row: GroomedGameAIDetection) => (
                            <span title="SGF downloads">
                                {row.bot_detection_results?.[row.second_column_player]
                                    ?.has_sgf_downloads ? (
                                    <i className="fa fa-download" style={{ color: "#666" }} />
                                ) : null}
                            </span>
                        ),
                    },
                    ...(show_all
                        ? [
                              {
                                  header: _("Timing"),
                                  render: (row: GroomedGameAIDetection) =>
                                      row.bot_detection_results?.[row.second_column_player]
                                          ?.timing_consistency != null ? (
                                          <span title="Timing consistency score">
                                              {row.bot_detection_results[
                                                  row.second_column_player
                                              ].timing_consistency.toFixed(0)}
                                          </span>
                                      ) : null,
                              },
                          ]
                        : []),
                    {
                        header: _("AILR"),
                        render: (row: GroomedGameAIDetection) =>
                            row.is_old_version ? null : row.bot_detection_results?.[
                                  row.second_column_player
                              ]?.AILR != null ? (
                                <span title="AI-like moves">
                                    {row.bot_detection_results[
                                        row.second_column_player
                                    ].AILR.toFixed(0)}
                                    %
                                </span>
                            ) : (
                                BROKEN_DATA
                            ),
                    },
                    ...(show_all
                        ? [
                              {
                                  header: _("Composite"),
                                  render: (row: GroomedGameAIDetection) =>
                                      !row.is_old_version ? (
                                          <span
                                              style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                              }}
                                              title="AI Detection composite score"
                                          >
                                              {row.bot_detection_results?.ai_suspected?.includes(
                                                  row.second_column_player,
                                              ) && (
                                                  <i
                                                      className="fa fa-flag"
                                                      style={{ marginRight: "0.5em", color: "red" }}
                                                  />
                                              )}
                                              {row.bot_detection_results?.[row.second_column_player]
                                                  ?.composite != null && (
                                                  <>
                                                      {row.bot_detection_results[
                                                          row.second_column_player
                                                      ].composite.toFixed(2)}
                                                  </>
                                              )}
                                          </span>
                                      ) : null,
                              },
                          ]
                        : []),
                    {
                        header: _("Outcome"),
                        headerProps: {
                            style: { textAlign: "center" },
                        },
                        render: (row: GroomedGameAIDetection) => (
                            <span
                                style={{
                                    display: "inline-block",
                                    maxWidth: "5rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {getGameResultRichText(row as any)}
                            </span>
                        ),
                        cellProps: {
                            style: { textAlign: "center" },
                        },
                    },
                    {
                        header: _("Analyzer Version"),
                        headerProps: {
                            style: {
                                textAlign: "center",
                                "font-size": "smaller",
                            },
                        },
                        render: (row: GroomedGameAIDetection) =>
                            row.bot_detection_results?.analyzer_version,
                        cellProps: {
                            style: {
                                "font-size": "smaller",
                                "text-align": "center",
                            },
                        },
                    },
                ]}
            />
        </div>
    );
}
