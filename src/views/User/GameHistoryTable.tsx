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
import { _, pgettext, moment } from "@/lib/translate";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { Card } from "@/components/material";
import { PaginatedTable } from "@/components/PaginatedTable";
import { effective_outcome } from "@/lib/rank_utils";
import { capitalize, getGameResultText } from "@/lib/misc";
import { openUrlIfALinkWasNotClicked, maskedRank } from "./common";
import { rankString } from "@/lib/rank_utils";
import { Player } from "@/components/Player";
import { Link } from "react-router-dom";
import { interpolate } from "@/lib/translate";
import * as preferences from "@/lib/preferences";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { TimeControl } from "@/components/TimeControl";
import { Speed } from "@/lib/types";
import { usePreference } from "@/lib/preferences";
import { openAnnulQueueModal, AnnulQueueModal } from "@/components/AnnulQueueModal";
import { useUser } from "@/lib/hooks";
import { GameNameForList } from "@/components/GobanLineSummary";
import { get } from "@/lib/requests";
import { MODERATOR_POWERS } from "@/lib/moderation";

interface GameHistoryProps {
    user_id: number;
}

interface AnnulmentGamesResponse {
    games: number[];
    stats: {
        count: number;
        player_id: number;
        detected_game_id: number;
        settings: {
            months_threshold: number;
            games_before: number;
            games_after: number;
            smr_threshold: number;
            smr_delta: number;
            blur_threshold: number;
            game_count_threshold: number;
        };
    };
}

type ResultClass = `library-${"won" | "lost" | "tie"}-result${
    | "-vs-stronger"
    | "-vs-weaker"
    | "-unranked"
    | ""}`;

interface GroomedGame {
    bot_detection_results: Record<string, any>;
    id: number;
    annulled: boolean;
    ranked: boolean;
    played_black: boolean;
    player: PlayerCacheEntry;
    player_won: boolean;
    date: Date;
    opponent?: PlayerCacheEntry;
    speed_icon_class: `speed-icon ${string}`;
    speed: Capitalize<Speed>;
    width: number;
    height: number;
    href: `/game/${number}`;
    name: string;
    black: PlayerCacheEntry;
    white: PlayerCacheEntry;
    result_class: ResultClass;
    result: React.ReactElement;
    flags?: { [flag_key: string]: number | string | boolean };
    rengo_vs_text?: `${number} vs. ${number}`;
    handicap: string;
}

export function GameHistoryTable(props: GameHistoryProps) {
    const [player_filter, setPlayerFilter] = React.useState<number>();
    const [game_history_board_size_filter, setGameHistoryBoardSizeFilter] = React.useState<string>(
        preferences.get("game-history-size-filter"),
    );
    const [game_history_ranked_filter, setGameHistoryRankedFilter] = React.useState<string>(
        preferences.get("game-history-ranked-filter"),
    );
    const [hide_flags] = usePreference("moderator.hide-flags");
    const [selectModeActive, setSelectModeActive] = React.useState<boolean>(false);
    const [annulQueue, setAnnulQueue] = React.useState<any[]>([]);
    const [isAnnulQueueModalOpen, setIsAnnulQueueModalOpen] = React.useState(false);
    const [detectedGame, setDetectedGame] = React.useState<GroomedGame | null>(null);
    const [loadingAnnulmentGames, setLoadingAnnulmentGames] = React.useState<boolean>(false);

    const user = useUser();

    // Check if user has AI detection powers (either full moderator or community moderator with AI_DETECTOR power)
    const hasAIDetectionPower =
        user.is_moderator || (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) !== 0;

    function getBoardSize(size_filter: string): number | undefined {
        switch (size_filter) {
            case "9x9":
                return 9;
            case "13x13":
                return 13;
            case "19x19":
                return 19;
        }
        throw new Error(`Unknown size filter: ${size_filter}`);
    }

    async function fetchAnnulmentGames(detectedGameId: number, rows: GroomedGame[]) {
        setLoadingAnnulmentGames(true);
        try {
            const response = (await get(`moderation/annulment_games`, {
                player_id: props.user_id,
                detected_game_id: detectedGameId,
            })) as AnnulmentGamesResponse;

            // Find the games in the current table that match the returned IDs
            const matchingGames = rows.filter((game) => response.games.includes(game.id));

            // Set these as the annul queue
            setAnnulQueue(matchingGames);
        } catch (error) {
            console.error("Failed to fetch annulment games:", error);
            // Show error to user - could use a toast notification here
            alert("Failed to fetch games matching annulment criteria. Check console for details.");
        } finally {
            setLoadingAnnulmentGames(false);
        }
    }

    function handleRowClick(
        row: GroomedGame,
        ev: React.MouseEvent | React.TouchEvent | React.PointerEvent,
        rows: GroomedGame[],
    ) {
        if (row.annulled) {
            return;
        }

        if (selectModeActive) {
            if (ev.shiftKey) {
                if (annulQueue.at(-1)) {
                    window.getSelection()?.removeAllRanges();
                    const indexes = [
                        rows.findIndex((r) => r.id === annulQueue.at(-1)!.id),
                        rows.findIndex((r) => r.id === row.id),
                    ];
                    const minIndex = Math.min(...indexes);
                    const maxIndex = Math.max(...indexes);
                    setAnnulQueue(rows.slice(minIndex, maxIndex + 1).filter((r) => !r.annulled));
                }
            } else {
                // If this is the first game clicked in select mode, treat it as the detected game
                if (!detectedGame) {
                    setDetectedGame(row);
                    // Fetch games matching annulment criteria
                    void fetchAnnulmentGames(row.id, rows);
                } else {
                    // Otherwise, toggle selection as normal
                    toggleQueued(row);
                }
            }
        } else {
            openUrlIfALinkWasNotClicked(ev, row.href);
        }
    }

    function toggleQueued(rowData: GroomedGame) {
        const alreadyInQueue = annulQueue.some((item) => item.id === rowData.id);

        if (!alreadyInQueue) {
            setAnnulQueue([...annulQueue, rowData]);
        } else {
            setAnnulQueue(annulQueue.filter((item) => item.id !== rowData.id));
        }
    }

    function handleLinkClick(event: React.MouseEvent) {
        if (selectModeActive) {
            event.preventDefault();
        }
    }

    function handleCloseAnnulQueueModal() {
        setIsAnnulQueueModalOpen(false);
    }

    function toggleBoardSizeFilter(size_filter: string) {
        const new_size_filter =
            game_history_board_size_filter === size_filter ? "all" : size_filter;
        setGameHistoryBoardSizeFilter(new_size_filter);
        preferences.set("game-history-size-filter", new_size_filter);
    }

    function toggleRankedFilter(ranked_filter: string) {
        const new_ranked_filter =
            game_history_ranked_filter === ranked_filter ? "all" : ranked_filter;
        setGameHistoryRankedFilter(new_ranked_filter);
        preferences.set("game-history-ranked-filter", new_ranked_filter);
    }

    function game_history_groomer(results: rest_api.Game[]): GroomedGame[] {
        const ret: GroomedGame[] = [];
        for (let i = 0; i < results.length; ++i) {
            const r = results[i];

            const black_won = !r.black_lost && r.white_lost && !r.annulled;
            const white_won = !r.white_lost && r.black_lost && !r.annulled;

            const item: Partial<GroomedGame> = {
                id: r.id,
            };

            item.width = r.width;
            item.height = r.height;
            item.date = r.ended ? new Date(r.ended) : undefined;
            item.annulled = r.annulled || false;
            item.ranked = r.ranked;

            item.black = r.players.black;
            item.white = r.players.white;

            item.played_black = playedBlack(r, props.user_id);

            if (item.played_black === false) {
                item.opponent = r.historical_ratings.black;
                item.player = r.historical_ratings.white;
                item.player_won = white_won;
            } else if (item.played_black === true) {
                item.opponent = r.historical_ratings.white;
                item.player = r.historical_ratings.black;
                item.player_won = black_won;
            }

            if (r.rengo) {
                item.rengo_vs_text = `${r.rengo_black_team?.length ?? -1} vs. ${
                    r.rengo_white_team?.length ?? -1
                }`;
            }

            item.result_class = getResultClass(r, props.user_id);

            const speed = getSpeed(r);
            item.speed = capitalize(speed);
            item.speed_icon_class = getSpeedClass(speed);

            item.name = r.name;

            item.handicap = r.handicap === 0 ? "-" : r.handicap.toString();

            if (item.name && item.name.trim() === "") {
                item.name = item.href;
            }

            item.href = `/game/${item.id as number}`;
            item.result = getGameResultRichText(r);
            item.flags = r.flags && props.user_id in r.flags ? r.flags[props.user_id] : undefined;
            item.bot_detection_results = r.bot_detection_results ?? undefined;

            ret.push(item as GroomedGame);
        }
        return ret;
    }

    return (
        <div className="col-sm-12">
            <h2>{_("Game History")}</h2>
            <Card>
                <div>
                    {isAnnulQueueModalOpen && (
                        <AnnulQueueModal
                            setSelectModeActive={setSelectModeActive}
                            annulQueue={annulQueue}
                            setAnnulQueue={setAnnulQueue}
                            onClose={handleCloseAnnulQueueModal}
                            forDetectedAI={false}
                        />
                    )}
                    {/* loading-container="game_history.settings().$loading" */}
                    <div className="game-options">
                        <div className="search">
                            <i className="fa fa-search"></i>
                            <PlayerAutocomplete
                                onComplete={(player) => {
                                    // happily, and importantly, if there isn't a player, then we get null
                                    setPlayerFilter(player?.id);
                                }}
                            />
                        </div>
                        <div>
                            {hasAIDetectionPower ? (
                                <div className="btn-group">
                                    {loadingAnnulmentGames && (
                                        <span className="loading-indicator">
                                            <i className="fa fa-spinner fa-spin" />{" "}
                                            {_("Loading matching games...")}
                                        </span>
                                    )}
                                    {selectModeActive &&
                                        !detectedGame &&
                                        !loadingAnnulmentGames && (
                                            <span className="select-detected-prompt">
                                                {_("(select detected game)")}
                                            </span>
                                        )}
                                    {detectedGame && !loadingAnnulmentGames && (
                                        <span className="detected-game-indicator">
                                            {_("Detected game:")} #{detectedGame.id}
                                        </span>
                                    )}
                                    {/* View Queue button is only visible to full moderators */}
                                    {user.is_moderator && annulQueue.length > 0 ? (
                                        <button
                                            className="sm info"
                                            onClick={() =>
                                                openAnnulQueueModal(setIsAnnulQueueModalOpen)
                                            }
                                        >
                                            {_("View Queue")} {`(${annulQueue.length})`}
                                        </button>
                                    ) : null}
                                    <button
                                        className={selectModeActive ? "sm danger" : "sm"}
                                        onClick={() => {
                                            setSelectModeActive(!selectModeActive);
                                            setAnnulQueue([]);
                                            setDetectedGame(null);
                                        }}
                                    >
                                        {_("Select")}
                                    </button>
                                </div>
                            ) : null}
                            <div className="btn-group">
                                <button
                                    className={
                                        game_history_board_size_filter === "9x9"
                                            ? "primary sm"
                                            : "sm"
                                    }
                                    onClick={() => toggleBoardSizeFilter("9x9")}
                                >
                                    {_("9x9")}
                                </button>
                                <button
                                    className={
                                        game_history_board_size_filter === "13x13"
                                            ? "primary sm"
                                            : "sm"
                                    }
                                    onClick={() => toggleBoardSizeFilter("13x13")}
                                >
                                    {_("13x13")}
                                </button>
                                <button
                                    className={
                                        game_history_board_size_filter === "19x19"
                                            ? "primary sm"
                                            : "sm"
                                    }
                                    onClick={() => toggleBoardSizeFilter("19x19")}
                                >
                                    {_("19x19")}
                                </button>
                            </div>
                            <div className="btn-group">
                                <button
                                    className={
                                        game_history_ranked_filter === "ranked"
                                            ? "primary sm"
                                            : "sm"
                                    }
                                    onClick={() => toggleRankedFilter("ranked")}
                                >
                                    {_("Ranked")}
                                </button>
                                <button
                                    className={
                                        game_history_ranked_filter === "unranked"
                                            ? "primary sm"
                                            : "sm"
                                    }
                                    onClick={() => toggleRankedFilter("unranked")}
                                >
                                    {_("Unranked")}
                                </button>
                            </div>
                        </div>
                    </div>
                    <PaginatedTable
                        className="game-history-table"
                        name="game-history"
                        method="GET"
                        source={`players/${props.user_id}/games/`}
                        filter={{
                            source: "play",
                            ended__isnull: false,
                            ...(player_filter !== undefined && {
                                alt_player: player_filter,
                            }),
                            ...(game_history_board_size_filter !== "all" && {
                                height: getBoardSize(game_history_board_size_filter),
                                width: getBoardSize(game_history_board_size_filter),
                            }),
                            ...(game_history_ranked_filter !== "all" && {
                                ranked: game_history_ranked_filter === "ranked",
                                annulled: false, // Assume the user wants to filter annulled games
                            }),
                        }}
                        orderBy={["-ended"]}
                        groom={game_history_groomer}
                        pageSizeOptions={[10, 15, 25, 50]}
                        onRowClick={handleRowClick}
                        highlightedRows={annulQueue}
                        columns={[
                            {
                                header: _("User"),
                                className: (X) =>
                                    "user_info" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => (
                                    <React.Fragment>
                                        <span>
                                            {X.played_black == null
                                                ? "❓" // Some rengo games don't tell us which team the user is on. Needs backend fix.
                                                : X.played_black
                                                  ? "⚫"
                                                  : "⚪"}
                                        </span>
                                        {X.played_black != null &&
                                            maskedRank(`[${rankString(X.player)}]`)}
                                    </React.Fragment>
                                ),
                            },
                            {
                                header: "",
                                className: (X) =>
                                    "winner_marker" + (X && X.annulled ? " annulled" : ""),
                                render: (X) =>
                                    X.player_won ? (
                                        <i className="fa fa-trophy game-history-winner" />
                                    ) : (
                                        ""
                                    ),
                            },
                            {
                                header: _("Date"),
                                className: (X) => "date" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => moment(X.date).format("YYYY-MM-DD"),
                            },
                            {
                                header: _("Opponent"),
                                className: (X) => "player" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => (
                                    <>
                                        {X.rengo_vs_text ? (
                                            <strong>{X.rengo_vs_text}</strong>
                                        ) : (
                                            <Player user={X.opponent as any} disableCacheUpdate />
                                        )}
                                    </>
                                ),
                            },
                            {
                                header: "",
                                className: (X) => "speed" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => <i className={X.speed_icon_class} title={X.speed} />,
                            },
                            {
                                header: _("Size"),
                                className: (X) =>
                                    "board_size" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => `${X.width}x${X.height}`,
                            },
                            {
                                header: pgettext("Handicap abbreviation", "HC"),
                                className: (X) => "handicap" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => X.handicap,
                            },
                            {
                                header: _("Name"),
                                className: (X) =>
                                    "game_name" + (X && X.annulled ? " annulled" : ""),
                                render: (X) => (
                                    <Link to={X.href} onClick={(e) => handleLinkClick(e)}>
                                        {!X.name &&
                                            interpolate(
                                                "{{black_username}} vs. {{white_username}}",
                                                {
                                                    black_username: X.black.username,
                                                    white_username: X.white.username,
                                                },
                                            )}
                                        {X.name && <GameNameForList original_name={X.name} />}
                                    </Link>
                                ),
                            },
                            {
                                header: _("Result"),
                                className: (X) =>
                                    X ? X.result_class + (X.annulled ? " annulled" : "") : "",
                                render: (X) => {
                                    if (
                                        !hide_flags &&
                                        (X.flags ||
                                            X.bot_detection_results?.ai_suspected.includes(
                                                props.user_id,
                                            ))
                                    ) {
                                        let str = "";
                                        if (
                                            X.bot_detection_results?.ai_suspected.includes(
                                                props.user_id,
                                            )
                                        ) {
                                            str += "AI Suspected";
                                        } else if (X.flags) {
                                            for (const flag of Object.keys(X.flags)) {
                                                if (flag === "blur_rate") {
                                                    str +=
                                                        flag +
                                                        ": " +
                                                        Math.round(
                                                            (X.flags[flag] as number) * 100.0,
                                                        ) +
                                                        "%\n";
                                                } else {
                                                    str += flag + ": " + X.flags[flag] + "\n";
                                                }
                                            }
                                        }

                                        return (
                                            <span className="flagged-game">
                                                <i className="fa fa-flag" title={str} /> {X.result}
                                            </span>
                                        );
                                    }

                                    return X.result;
                                },
                            },
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}

export function getGameResultRichText(game: rest_api.Game) {
    let resultText = getGameResultText(game.outcome, game.white_lost, game.black_lost);

    if (game.ranked) {
        resultText += ", ";
        resultText += _("ranked");
    }
    if (game.annulled) {
        return (
            <span>
                <span style={{ textDecoration: "line-through" }}>{resultText}</span>
                <span>, {_("annulled")}</span>
            </span>
        );
    }

    return <>{resultText}</>;
}

function getResultClass(game: rest_api.Game, user_id: number): ResultClass {
    const annulled = game.annulled;
    const black_won = !game.black_lost && game.white_lost && !annulled;
    const white_won = !game.white_lost && game.black_lost && !annulled;
    const ranked = game.ranked;
    const played_black = playedBlack(game, user_id);
    const player_won = (played_black && black_won) || (!played_black && white_won);

    if (!(black_won || white_won)) {
        return "library-tie-result";
    }

    if (ranked && !preferences.get("hide-ranks")) {
        const { black_effective_stronger, white_effective_stronger } = effective_outcome(
            game.historical_ratings.black.ratings.overall.rating,
            game.historical_ratings.white.ratings.overall.rating,
            game.handicap,
        );
        const player_effective_stronger =
            (black_effective_stronger && played_black) ||
            (white_effective_stronger && !played_black);

        if (player_won) {
            return player_effective_stronger
                ? "library-won-result-vs-weaker"
                : "library-won-result-vs-stronger";
        } else {
            return player_effective_stronger
                ? "library-lost-result-vs-weaker"
                : "library-lost-result-vs-stronger";
        }
    }

    // tie caught above
    return player_won ? "library-won-result-unranked" : "library-lost-result-unranked";
}

function getSpeed(game: rest_api.Game): Speed {
    if ("time_control_parameters" in game) {
        const tcp = game.time_control_parameters
            ? (JSON.parse(game.time_control_parameters) as TimeControl)
            : undefined;
        if (tcp?.speed) {
            return tcp.speed;
        }
    }

    // fallback
    const time_per_move = game.time_per_move;
    if (time_per_move >= 3600 || time_per_move === 0) {
        return "correspondence";
    }
    if (time_per_move >= 10) {
        return "live";
    }
    if (time_per_move > 0) {
        return "blitz";
    }

    console.log("time per move less than 0: " + time_per_move);
    return "correspondence";
}

function getSpeedClass(speed: Speed) {
    switch (speed) {
        case "correspondence":
            return "speed-icon ogs-turtle";
        case "live":
            return "speed-icon fa fa-clock-o";
        case "rapid":
            return "speed-icon fa fa-clock-o";
        case "blitz":
            return "speed-icon fa fa-bolt";
    }
}

function playedBlack(game: rest_api.Game, user_id: number) {
    if (game.rengo) {
        if (game.rengo_black_team?.indexOf(user_id) !== -1) {
            return true;
        }
        if (game.rengo_white_team?.indexOf(user_id) !== -1) {
            return false;
        }
    }

    if (user_id === game.players.black.id) {
        return true;
    }
    if (user_id === game.players.white.id) {
        return false;
    }

    console.error(`Unable to determine which color player ${user_id} is in game ${game.id}`);
    return undefined;
}
