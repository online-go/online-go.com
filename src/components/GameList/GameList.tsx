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
import { _, pgettext } from "translate";
import * as preferences from "preferences";
import { MiniGoban } from "MiniGoban";
import { GobanLineSummary } from "GobanLineSummary";
import { Player } from "Player";
import { AdHocPauseControl, AdHocClock, AdHocPackedMove, Goban } from "goban";

interface UserType {
    id: number;
    username: string;
}

interface GameType {
    id: number;
    name: string;
    black: UserType;
    white: UserType;
    goban?: Goban;
    json?: {
        clock: AdHocClock;
        moves: AdHocPackedMove[];
        pause_control: AdHocPauseControl;
        rengo_teams: {
            black: Array<UserType>;
            white: Array<UserType>;
        };
    };
    width: number;
    height: number;
}

interface GameListProps {
    list: Array<GameType>;
    player?: { id: number };
    emptyMessage?: string;
    disableSort?: boolean;
    miniGobanProps?: any;
    namesByGobans?: boolean;
    forceList?: boolean;
    lineSummaryMode: LineSummaryTableMode;
}

type SortOrder = "clock" | "move-number" | "name" | "opponent" | "opponent-clock" | "size";
type DescendingSortOrder = `-${SortOrder}`;

interface GameListState {
    sort_order: SortOrder | DescendingSortOrder;
}

export class GameList extends React.PureComponent<GameListProps, GameListState> {
    constructor(props) {
        super(props);
        this.state = {
            sort_order: "clock",
        };
    }

    sortBy = (sort: SortOrder) => {
        if (this.state.sort_order === sort) {
            this.setState({ sort_order: ("-" + sort) as DescendingSortOrder });
        } else {
            this.setState({ sort_order: sort });
        }
    };

    isPaused(pause_control: AdHocPauseControl) {
        for (const _key in pause_control) {
            return true;
        }
        return false;
    }

    extractClockSortFields(game: GameType) {
        try {
            // In the initial sort, game.goban is null. In later sorts, it's
            // valid.
            //
            // This is why:
            //
            //   - GameList.render() calls:
            //       - applyCurrentSort()   [game.goban null]
            //       - LineSummaryTable()
            //           - GobanLineSummary() [game.goban gets initialized]
            //
            //   - Later, something triggers a re-sort:
            //       - applyCurrentSort()   [game.goban valid]
            //
            // For the initial sort, we can use game.json.clock, which comes
            // directly with the game list.
            const clock =
                game.goban && game.goban.last_clock ? game.goban.last_clock : game.json.clock;
            const paused = game.goban
                ? this.isPaused(game.goban.config?.pause_control)
                : this.isPaused(game.json?.pause_control);

            // AdHocClock.expiration is useful, but insufficient, for sorting.
            //
            //   - For unpaused games, the value is a timestamp (in the future)
            //     when the game will time out if no one makes a move.
            //   - For paused games, the value is (at least sometimes) the
            //     timestamp (in the past) when the game was paused.
            //   - It's tied to the clock of the player whose turn it is, and
            //     tells you nothing about the other player's clock.
            //
            // A useful property of AdHocClock.expiration is that it doesn't
            // change as the clock counts down. It only changes when a move is
            // made (or the pause state is changed).
            //
            // Ideally what we'd have available:
            //
            //   - AdHocClock.expiration: Valid for un-paused games. Timestamp
            //     when game will time out if no moves are made. (Same as we
            //     have...)
            //   - black_remaining: Valid on white's turn or if the game is
            //     paused. Amount of time remaining when it becomes black's turn
            //     and the game is unpaused.
            //   - white_remaining: Valid on black's turn or if the game is
            //     paused. Amount of time remaining when it becomes white's turn
            //     and the game is unpaused.
            //
            // All three of these have stable values (they don't change unless
            // someone moves, pauses, or unpauses).
            //
            // Then we could sort the Clock field by:
            //
            //  1. this player's turn, then opponent's turn
            //  2. unpaused, then paused
            //  3. expired OR ..._remaining, as relevant
            //
            // Unfortunately, game.json lacks JGOFTimeControl.  While
            // black_remaining and white_remaining could be computed from
            // game.goban, they can't be computed for the initial sort because
            // we can't discriminate the AdHocClock.black_time and
            // AdHocClock.white_time unions.
            const expiration = clock.expiration;
            return {
                paused: paused,
                is_current_player: clock.current_player === this.props.player.id,
                expiration: expiration,
            };
        } catch (e) {
            console.error(game, e);
            return {
                paused: true,
                is_current_player: false,
                expiration: Number.MAX_SAFE_INTEGER,
            };
        }
    }

    applyCurrentSort(games: GameType[]) {
        switch (this.state.sort_order) {
            case "-clock":
            case "clock":
                games.sort((a, b) => {
                    const a_clock = this.extractClockSortFields(a);
                    const b_clock = this.extractClockSortFields(b);
                    return (
                        +b_clock.is_current_player - +a_clock.is_current_player ||
                        +a_clock.paused - +b_clock.paused ||
                        a_clock.expiration - b_clock.expiration ||
                        a.id - b.id
                    );
                });
                break;

            case "-opponent-clock":
            case "opponent-clock":
                games.sort((a, b) => {
                    const a_clock = this.extractClockSortFields(a);
                    const b_clock = this.extractClockSortFields(b);
                    return (
                        +a_clock.is_current_player - +b_clock.is_current_player ||
                        +a_clock.paused - +b_clock.paused ||
                        a_clock.expiration - b_clock.expiration ||
                        a.id - b.id
                    );
                });
                break;

            case "-name":
            case "name":
                games.sort((a, b) => {
                    try {
                        return a.name.localeCompare(b.name) || a.id - b.id;
                    } catch (e) {
                        console.error(a, b, e);
                        return 0;
                    }
                });
                break;

            case "-opponent":
            case "opponent":
                // TODO: this is old code that doesn't always work for rengo games
                games.sort((a, b) => {
                    try {
                        const a_opponent = a.black.id === this.props.player.id ? a.white : a.black;
                        const b_opponent = b.black.id === this.props.player.id ? b.white : b.black;
                        return (
                            a_opponent.username.localeCompare(b_opponent.username) || a.id - b.id
                        );
                    } catch (e) {
                        console.error(a, b, e);
                        return 0;
                    }
                });
                break;

            case "-move-number":
            case "move-number":
                games.sort((a, b) => {
                    try {
                        const a_move_num = a.goban
                            ? a.goban.engine.getMoveNumber()
                            : a.json.moves.length;
                        const b_move_num = b.goban
                            ? b.goban.engine.getMoveNumber()
                            : b.json.moves.length;

                        return a_move_num - b_move_num || a.id - b.id;
                    } catch (e) {
                        console.error(a, b, e);
                        return 0;
                    }
                });
                break;

            case "-size":
            case "size":
                games.sort((a, b) => {
                    try {
                        // sort by number of intersection
                        // for non-square boards with the same number of intersections, the wider board is concidered larger
                        const a_size = a.width * a.height * 100 + a.width;
                        const b_size = b.width * b.height * 100 + b.width;

                        return a_size - b_size || a.id - b.id;
                    } catch (e) {
                        console.error(a, b, e);
                        return 0;
                    }
                });
                break;
        }

        if (this.state.sort_order[0] === "-") {
            games.reverse();
        }
    }

    render() {
        const games: GameType[] = this.props.list.slice(0);

        if (!this.props.disableSort) {
            this.applyCurrentSort(games);
        }

        if (games.length === 0) {
            return <div className="container">{this.props.emptyMessage || ""}</div>;
        } else if (this.props.forceList || games.length > preferences.get("game-list-threshold")) {
            return (
                <LineSummaryTable
                    list={games}
                    disableSort={this.props.disableSort}
                    onSort={this.sortBy}
                    currentSort={this.state.sort_order}
                    player={this.props.player}
                    lineSummaryMode={this.props.lineSummaryMode}
                ></LineSummaryTable>
            );
        } else {
            return MiniGobanList(games, this.props.namesByGobans, this.props.miniGobanProps);
        }
    }
}

export type LineSummaryTableMode = "both-players" | "opponent-only" | "dropped-rengo";

interface LineSummaryTableProps extends GameListProps {
    list: GameType[];
    lineSummaryMode: LineSummaryTableMode;
    player?: { id: number };
    disableSort: boolean;
    currentSort: SortOrder | DescendingSortOrder;
    onSort: (sortBy: SortOrder) => void;
}

function LineSummaryTable({
    list,
    lineSummaryMode,
    player,
    disableSort,
    currentSort,
    onSort,
}: LineSummaryTableProps): JSX.Element {
    const getHeaderClassName = (sortOrder: SortOrder) => {
        const sortable = disableSort && player ? "" : "sortable";
        let currentlySorting = "";
        if (currentSort === sortOrder) {
            currentlySorting = " sorted-asc";
        } else if (currentSort === `-${sortOrder}`) {
            currentlySorting = " sorted-desc";
        }
        return sortable + currentlySorting;
    };

    const renderHeader = (): JSX.Element => {
        if (lineSummaryMode === "both-players") {
            return (
                <div className="GobanLineSummaryContainerHeader">
                    <div>{pgettext("Game list move number", "Move")}</div>
                    <div>{_("Game")}</div>
                    <div className="text-align-left">{_("Black")}</div>
                    <div></div>
                    <div className="text-align-left">{_("White")}</div>
                    <div></div>
                    <div className="text-align-left">{_("Size")}</div>
                </div>
            );
        }
        return (
            <div className="GobanLineSummaryContainerHeader">
                <div
                    onClick={() => onSort("move-number")}
                    className={getHeaderClassName("move-number")}
                >
                    {pgettext("Game list move number", "Move")}
                </div>
                <div
                    onClick={() => onSort("name")}
                    className={getHeaderClassName("name") + " text-align-left"}
                >
                    {_("Game")}
                </div>
                {lineSummaryMode === "opponent-only" && (
                    <>
                        <div
                            onClick={() => onSort("opponent")}
                            className={getHeaderClassName("opponent") + " text-align-left"}
                        >
                            {_("Opponent")}
                        </div>
                        <div
                            onClick={() => onSort("clock")}
                            className={getHeaderClassName("clock")}
                        >
                            {_("Clock")}
                        </div>
                        <div
                            onClick={() => onSort("opponent-clock")}
                            className={getHeaderClassName("opponent-clock")}
                        >
                            {_("Opponent's Clock")}
                        </div>
                    </>
                )}
                <div onClick={() => onSort("size")} className={getHeaderClassName("size")}>
                    {_("Size")}
                </div>
            </div>
        );
    };

    return (
        <div className="GameList GobanLineSummaryContainer">
            {renderHeader()}
            {list.map((game) => (
                <GobanLineSummary
                    key={game.id}
                    id={game.id}
                    black={game.black}
                    white={game.white}
                    player={player}
                    gobanref={(goban) => (game.goban = goban)}
                    width={game.width}
                    height={game.height}
                    rengo_teams={game.json?.rengo_teams}
                    lineSummaryMode={lineSummaryMode}
                />
            ))}
        </div>
    );
}

function MiniGobanList(games: GameType[], withNames: boolean, miniGobanProps?): JSX.Element {
    return (
        <div className="GameList">
            {games.map((game) => {
                const miniGoban = (
                    <MiniGoban
                        key={!withNames ? game.id : undefined}
                        id={game.id}
                        width={game.width}
                        height={game.height}
                        {...(miniGobanProps || {})}
                    />
                );
                if (withNames) {
                    return (
                        <div className="goban-with-names" key={game.id}>
                            <div className="names">
                                <div>
                                    <Player user={game.black} disableCacheUpdate noextracontrols />
                                </div>
                                <div>
                                    <Player user={game.white} disableCacheUpdate noextracontrols />
                                </div>
                            </div>
                            {miniGoban}
                        </div>
                    );
                } else {
                    return miniGoban;
                }
            })}
        </div>
    );
}
