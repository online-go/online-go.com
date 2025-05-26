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
import { fetch, lookup } from "@/lib/player_cache";
//import { alert } from "@/lib/swal_config";

const MIN_ANALYZER_VERSION = "2025-05-13-04";
const BROKEN_DATA = "😿";

type GroomedGameAIDetection = rest_api.GameAIDetection & {
    first_column_player: number;
    second_column_player: number;
    is_old_version: boolean;
    outcome: string;
    first_player_is_bot: boolean;
    second_player_is_bot: boolean;
    first_player_is_banned: boolean;
    second_player_is_banned: boolean;
    first_player_filter_match: boolean;
    second_player_filter_match: boolean;
    broken_data: boolean;
};

export function AIDetection(): React.ReactElement | null {
    const apl_off = 100;
    const ailr_off = 0;
    const blur_off = 0;

    const user = data.get("user");
    const [searchParams, setSearchParams] = useSearchParams();
    const show_all = searchParams.get("show_all") === "true";
    const tableRef = React.useRef<{ refresh: () => void }>(null);

    // Initialize state from URL params
    const [player_filter, setPlayerFilter] = React.useState<number | undefined>(
        searchParams.get("player") ? Number(searchParams.get("player")) : undefined,
    );
    const [player_data_ready, setPlayerDataReady] = React.useState(false);
    const player_fetch_ref = React.useRef<Promise<any> | null>(null);
    const [apl_threshold, setAplThreshold] = React.useState<number>(
        searchParams.get("apl") ? Number(searchParams.get("apl")) : apl_off,
    );
    const [ailr_threshold, setAilrThreshold] = React.useState<number>(
        searchParams.get("ailr") ? Number(searchParams.get("ailr")) : ailr_off,
    );
    const [blur_threshold, setBlurThreshold] = React.useState<number>(
        searchParams.get("blur") ? Number(searchParams.get("blur")) : blur_off,
    );
    const [apply_filters, setApplyFilters] = React.useState<boolean>(
        searchParams.get("apply_filters") === "true",
    );

    // Derive filter values to ensure they're stable between renders
    const filterValues = React.useMemo(
        () => ({
            apl_threshold,
            ailr_threshold,
            blur_threshold,
            apply_filters,
        }),
        [apl_threshold, ailr_threshold, blur_threshold, apply_filters],
    );

    // Fetch player data when component mounts with a player ID
    React.useEffect(() => {
        if (player_filter) {
            console.log("Fetching player data for ID:", player_filter);
            setPlayerDataReady(false);
            player_fetch_ref.current = fetch(player_filter)
                .then((player) => {
                    console.log("Player data fetched:", player);
                    setPlayerDataReady(true);
                    return player;
                })
                .catch((err) => {
                    console.error("Error fetching player:", err);
                    setPlayerDataReady(true); // Still set to true so we don't block rendering
                    throw err;
                });
        } else {
            setPlayerDataReady(true);
            player_fetch_ref.current = null;
        }
    }, [player_filter]);

    // Update URL when filters change
    React.useEffect(() => {
        const updateUrl = async () => {
            const newParams = new URLSearchParams(searchParams);

            if (player_filter !== undefined) {
                // Wait for player fetch to complete if it's in progress
                if (player_fetch_ref.current) {
                    try {
                        console.log("Waiting for player fetch to complete...");
                        const player = await player_fetch_ref.current;
                        console.log("Player fetch completed:", player);
                    } catch (err) {
                        console.error("Error in player fetch:", err);
                    }
                }
                newParams.set("player", player_filter.toString());
            } else {
                newParams.delete("player");
            }

            if (apl_threshold !== apl_off) {
                newParams.set("apl", apl_threshold.toString());
            } else {
                newParams.delete("apl");
            }

            if (ailr_threshold !== ailr_off) {
                newParams.set("ailr", ailr_threshold.toString());
            } else {
                newParams.delete("ailr");
            }

            if (blur_threshold !== blur_off) {
                newParams.set("blur", blur_threshold.toString());
            } else {
                newParams.delete("blur");
            }

            if (apply_filters) {
                newParams.set("apply_filters", "true");
            } else {
                newParams.delete("apply_filters");
            }

            setSearchParams(newParams);
        };

        void updateUrl();
    }, [
        player_filter,
        apl_threshold,
        ailr_threshold,
        blur_threshold,
        apply_filters,
        setSearchParams,
    ]);

    // Log when player_filter changes
    React.useEffect(() => {
        console.log("player_filter changed to:", player_filter);
        if (player_filter) {
            const cached_player = lookup(player_filter);
            console.log("Cached player data:", cached_player);
        }
    }, [player_filter]);

    // Refresh table when filter values change
    React.useEffect(() => {
        if (tableRef.current) {
            // Use setTimeout to ensure this runs after the data processing
            setTimeout(() => {
                tableRef.current?.refresh();
            }, 0);
        }
    }, [apl_threshold, ailr_threshold, blur_threshold, apply_filters]);

    if (!user.is_moderator && (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) === 0) {
        return null;
    }

    const filters_off =
        apl_threshold === apl_off && ailr_threshold === ailr_off && blur_threshold === blur_off;

    return (
        <div id="AI-Detection">
            <h1>AI Detection</h1>
            <div className="game-options">
                <div
                    className="search"
                    style={{ display: "flex", alignItems: "center", paddingBottom: "0.5rem" }}
                >
                    <i className="fa fa-search"></i>
                    {player_data_ready && (
                        <PlayerAutocomplete
                            onComplete={(player) => {
                                setPlayerFilter(player?.id);
                            }}
                            playerId={player_filter}
                        />
                    )}
                </div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                            type="checkbox"
                            checked={apply_filters}
                            onChange={(e) => setApplyFilters(e.target.checked)}
                            id="apply-filters"
                        />
                        <label htmlFor="apply-filters">full reviews with:</label>
                    </div>
                    <div>
                        <label style={{ opacity: filters_off ? 0.5 : 1 }}>APL {"<"} </label>
                        <input
                            type="number"
                            value={apl_threshold}
                            onChange={(e) => setAplThreshold(Number(e.target.value))}
                            style={{ width: "4rem", opacity: filters_off ? 0.5 : 1 }}
                        />
                    </div>
                    <div>
                        <label style={{ opacity: filters_off ? 0.5 : 1 }}>Blur ≥ </label>
                        <input
                            type="number"
                            value={blur_threshold}
                            onChange={(e) => setBlurThreshold(Number(e.target.value))}
                            style={{ width: "4rem", opacity: filters_off ? 0.5 : 1 }}
                        />
                        <span style={{ opacity: filters_off ? 0.5 : 1 }}>%</span>
                    </div>
                    <div>
                        <label style={{ opacity: filters_off ? 0.5 : 1 }}>AILR ≥ </label>
                        <input
                            type="number"
                            value={ailr_threshold}
                            onChange={(e) => setAilrThreshold(Number(e.target.value))}
                            style={{ width: "4rem", opacity: filters_off ? 0.5 : 1 }}
                        />
                        <span style={{ opacity: filters_off ? 0.5 : 1 }}>%</span>
                    </div>
                </div>
            </div>
            <PaginatedTable
                ref={tableRef}
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
                    return data
                        .map((row) => {
                            const firstColumnPlayer = player_filter
                                ? player_filter
                                : row.players.black.id;
                            const secondColumnPlayer = player_filter
                                ? player_filter === row.players.black.id
                                    ? row.players.white.id
                                    : row.players.black.id
                                : row.players.white.id;

                            const firstPlayerIsBot =
                                firstColumnPlayer === row.players.black.id
                                    ? row.players.black.ui_class === "bot"
                                    : row.players.white.ui_class === "bot";
                            const secondPlayerIsBot =
                                secondColumnPlayer === row.players.black.id
                                    ? row.players.black.ui_class === "bot"
                                    : row.players.white.ui_class === "bot";

                            const firstPlayerIsBanned =
                                firstColumnPlayer === row.players.black.id
                                    ? row.black_banned
                                    : row.white_banned;
                            const secondPlayerIsBanned =
                                secondColumnPlayer === row.players.black.id
                                    ? row.black_banned
                                    : row.white_banned;

                            const firstPlayerResults =
                                row.bot_detection_results?.[firstColumnPlayer];
                            const secondPlayerResults =
                                row.bot_detection_results?.[secondColumnPlayer];

                            const firstPlayerApl = Math.abs(
                                firstPlayerResults?.average_point_loss || 0,
                            );
                            const secondPlayerApl = Math.abs(
                                secondPlayerResults?.average_point_loss || 0,
                            );
                            const firstPlayerAilr = firstPlayerResults?.AILR ?? 0;
                            const secondPlayerAilr = secondPlayerResults?.AILR ?? 0;
                            const firstPlayerBlur = firstPlayerResults?.blur_rate ?? 0;
                            const secondPlayerBlur = secondPlayerResults?.blur_rate ?? 0;

                            const broken_data =
                                row.bot_detection_results?.ai_review_params?.type === "full" &&
                                (row.bot_detection_results?.[firstColumnPlayer]?.AILR == null ||
                                    row.bot_detection_results?.[secondColumnPlayer]?.AILR == null);

                            const firstPlayerFilterMatch =
                                !broken_data &&
                                firstPlayerApl < filterValues.apl_threshold &&
                                firstPlayerAilr >= filterValues.ailr_threshold &&
                                firstPlayerBlur >= filterValues.blur_threshold;

                            const secondPlayerFilterMatch =
                                !broken_data &&
                                secondPlayerApl < filterValues.apl_threshold &&
                                secondPlayerAilr >= filterValues.ailr_threshold &&
                                secondPlayerBlur >= filterValues.blur_threshold;

                            return {
                                ...row,
                                first_column_player: firstColumnPlayer,
                                second_column_player: secondColumnPlayer,
                                is_old_version:
                                    !row.bot_detection_results ||
                                    !row.bot_detection_results.analyzer_version ||
                                    row.bot_detection_results.analyzer_version <
                                        MIN_ANALYZER_VERSION,
                                outcome: row.outcome,
                                first_player_is_bot: firstPlayerIsBot,
                                second_player_is_bot: secondPlayerIsBot,
                                first_player_filter_match: firstPlayerFilterMatch,
                                second_player_filter_match: secondPlayerFilterMatch,
                                first_player_is_banned: firstPlayerIsBanned,
                                second_player_is_banned: secondPlayerIsBanned,
                                broken_data,
                            };
                        })
                        .filter((row) => {
                            if (!filterValues.apply_filters) {
                                return true;
                            }

                            if (
                                !row.bot_detection_results ||
                                row.bot_detection_results.ai_review_params?.type !== "full"
                            ) {
                                return false;
                            }

                            // Only show rows where at least one player has an exclamation mark
                            return (
                                (!row.first_player_is_bot && row.first_player_filter_match) ||
                                (!row.second_player_is_bot && row.second_player_filter_match)
                            );
                        });
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
                                    style={{
                                        textDecoration: row.annulled ? "line-through" : "none",
                                        fontStyle: row.annulled ? "italic" : "normal",
                                    }}
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
                                {row.game_speed === "correspondence" && (
                                    <i className="fa fa-envelope" title="Correspondence game" />
                                )}
                                {!row.ranked && (
                                    <i className="fa fa-minus-square-o" title="Unranked game" />
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
                            return (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        width: "100%",
                                        minWidth: 0,
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                        <Player
                                            user={row.first_column_player}
                                            showAsBanned={row.first_player_is_banned}
                                        />
                                    </div>
                                </span>
                            );
                        },
                        cellProps: {
                            style: {
                                maxWidth: "8rem",
                            },
                        },
                    },
                    {
                        header: "",
                        render: (row) => {
                            const isBlack = row.players.black.id === row.first_column_player;
                            const won = isBlack ? !row.black_lost : !row.white_lost;
                            return won ? (
                                <i className="fa fa-trophy" style={{ color: "#FFD700" }} />
                            ) : null;
                        },
                        cellProps: {
                            style: { textAlign: "center", paddingLeft: "0.5rem" },
                        },
                    },
                    {
                        header: _("APL"),
                        render: (row: GroomedGameAIDetection) =>
                            !row.is_old_version &&
                            row.bot_detection_results?.[row.first_column_player]
                                ?.average_point_loss != null ? (
                                <span
                                    title="Average point loss per move"
                                    style={{ color: row.first_player_is_bot ? "#666" : undefined }}
                                >
                                    {Math.abs(
                                        row.bot_detection_results[row.first_column_player]
                                            .average_point_loss,
                                    ).toFixed(2)}
                                </span>
                            ) : null,
                    },

                    {
                        header: _("Blur"),
                        render: (row: GroomedGameAIDetection) =>
                            row.bot_detection_results?.[row.first_column_player]?.blur_rate !=
                            null ? (
                                <span
                                    title="Window blur rate - percentage of time spent with window not in focus"
                                    style={{ color: row.first_player_is_bot ? "#666" : undefined }}
                                >
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
                            <span
                                title="SGF downloads"
                                style={{ color: row.first_player_is_bot ? "#666" : undefined }}
                            >
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
                                          <span
                                              title="Timing consistency score"
                                              style={{
                                                  color: row.first_player_is_bot
                                                      ? "#666"
                                                      : undefined,
                                              }}
                                          >
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
                        render: (row: GroomedGameAIDetection) => {
                            if (
                                row.bot_detection_results?.ai_review_params?.type !== "full" ||
                                row.is_old_version
                            ) {
                                return null;
                            }
                            const ailr = row.bot_detection_results?.[row.first_column_player]?.AILR;
                            if (ailr == null) {
                                return null;
                            }
                            return (
                                <span
                                    title="AI-like moves"
                                    style={{ color: row.first_player_is_bot ? "#666" : undefined }}
                                >
                                    {ailr.toFixed(0)}%
                                </span>
                            );
                        },
                    },
                    {
                        header: _("Match"),
                        headerProps: {
                            style: { textAlign: "center" },
                        },
                        render: (row: GroomedGameAIDetection) => (
                            <span
                                title="AI detection criteria met"
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                {row.broken_data ? (
                                    BROKEN_DATA
                                ) : !filters_off &&
                                  row.bot_detection_results?.ai_review_params?.type === "full" &&
                                  !row.first_player_is_bot &&
                                  row.first_player_filter_match ? (
                                    <i className="fa fa-exclamation-circle" />
                                ) : null}
                            </span>
                        ),
                        cellProps: {
                            style: { textAlign: "center" },
                        },
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
                                                  color: row.first_player_is_bot
                                                      ? "#666"
                                                      : undefined,
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
                            return (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        width: "100%",
                                        minWidth: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                        <Player
                                            user={row.second_column_player}
                                            showAsBanned={row.second_player_is_banned}
                                        />
                                    </div>
                                </span>
                            );
                        },
                        cellProps: {
                            style: {
                                maxWidth: "8rem",
                                overflow: "hidden",
                            },
                        },
                    },
                    {
                        header: "",
                        render: (row) => {
                            const isBlack = row.players.black.id === row.second_column_player;
                            const won = isBlack ? !row.black_lost : !row.white_lost;
                            return won ? (
                                <i className="fa fa-trophy" style={{ color: "#FFD700" }} />
                            ) : null;
                        },
                        cellProps: {
                            style: { textAlign: "center", paddingLeft: "0.5rem" },
                        },
                    },
                    {
                        header: _("APL"),
                        render: (row: GroomedGameAIDetection) =>
                            !row.is_old_version &&
                            row.bot_detection_results?.[row.second_column_player]
                                ?.average_point_loss != null ? (
                                <span
                                    title="Average point loss per move"
                                    style={{ color: row.second_player_is_bot ? "#666" : undefined }}
                                >
                                    {Math.abs(
                                        row.bot_detection_results[row.second_column_player]
                                            .average_point_loss,
                                    ).toFixed(2)}
                                </span>
                            ) : null,
                    },

                    {
                        header: _("Blur"),
                        render: (row: GroomedGameAIDetection) =>
                            row.bot_detection_results?.[row.second_column_player]?.blur_rate !=
                            null ? (
                                <span
                                    title="Window blur rate - percentage of time spent with window not in focus"
                                    style={{ color: row.second_player_is_bot ? "#666" : undefined }}
                                >
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
                            <span
                                title="SGF downloads"
                                style={{ color: row.second_player_is_bot ? "#666" : undefined }}
                            >
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
                                          <span
                                              title="Timing consistency score"
                                              style={{
                                                  color: row.second_player_is_bot
                                                      ? "#666"
                                                      : undefined,
                                              }}
                                          >
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
                        render: (row: GroomedGameAIDetection) => {
                            if (
                                row.bot_detection_results?.ai_review_params?.type !== "full" ||
                                row.is_old_version
                            ) {
                                return null;
                            }
                            const ailr =
                                row.bot_detection_results?.[row.second_column_player]?.AILR;
                            if (ailr == null) {
                                return null;
                            }
                            return (
                                <span
                                    title="AI-like moves"
                                    style={{ color: row.second_player_is_bot ? "#666" : undefined }}
                                >
                                    {ailr.toFixed(0)}%
                                </span>
                            );
                        },
                    },
                    {
                        header: _("Match"),
                        headerProps: {
                            style: { textAlign: "center" },
                        },
                        render: (row: GroomedGameAIDetection) => (
                            <span
                                title="AI detection criteria met"
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                {row.broken_data ? (
                                    BROKEN_DATA
                                ) : !filters_off &&
                                  row.bot_detection_results?.ai_review_params?.type === "full" &&
                                  !row.second_player_is_bot &&
                                  row.second_player_filter_match ? (
                                    <i className="fa fa-exclamation-circle" />
                                ) : null}
                            </span>
                        ),
                        cellProps: {
                            style: { textAlign: "center" },
                        },
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
                                                  color: row.second_player_is_bot
                                                      ? "#666"
                                                      : undefined,
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
