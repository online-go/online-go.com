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
import { MiniGoban, MiniGobanProps } from "MiniGoban";
import { GobanLineSummary } from "GobanLineSummary";
import { Player } from "Player";
import {
    JGOFTimeControl,
    JGOFPauseState,
    JGOFClock,
    JGOFPlayerClock,
    AdHocClock,
    AdHocPlayerClock,
    AdHocPauseControl,
    AdHocPackedMove,
    Goban,
} from "goban";

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
        pause_control?: AdHocPauseControl;
        time_control?: JGOFTimeControl;
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
    force_render: number;
}

export class GameList extends React.PureComponent<GameListProps, GameListState> {
    constructor(props: GameListProps) {
        super(props);
        this.state = {
            sort_order: "clock",
            force_render: 0,
        };
    }

    sortBy = (sort: SortOrder) => {
        if (this.state.sort_order === sort) {
            this.setState({ sort_order: ("-" + sort) as DescendingSortOrder });
        } else {
            this.setState({ sort_order: sort });
        }
    };

    isPaused(pause_control: JGOFPauseState | AdHocPauseControl | undefined) {
        for (const _key in pause_control) {
            return true;
        }
        return false;
    }

    computeRemainingTimeAdHoc(
        time_control: JGOFTimeControl | undefined,
        clock: AdHocClock,
        player_clock: AdHocPlayerClock | number,
    ) {
        // Inaccurate for paused clocks.
        switch (time_control?.system) {
            case "simple": {
                const time: number = player_clock as number;
                return time - clock.last_move;
            }
            case "absolute":
            case "fischer": {
                const time: AdHocPlayerClock = player_clock as AdHocPlayerClock;
                return time.thinking_time * 1000;
            }
            case "byoyomi": {
                const time: AdHocPlayerClock = player_clock as AdHocPlayerClock;
                return (
                    (time.thinking_time + (time.period_time as number) * (time.periods as number)) *
                    1000
                );
            }
            case "canadian": {
                const time: AdHocPlayerClock = player_clock as AdHocPlayerClock;
                return (time.thinking_time + (time.block_time as number)) * 1000;
            }
            case "none":
            default:
                return Number.MAX_SAFE_INTEGER;
        }
    }

    computeRemainingTime(
        time_control: JGOFTimeControl | undefined,
        clock: JGOFClock,
        player_clock: JGOFPlayerClock,
    ) {
        if (clock?.start_mode) {
            return clock.start_time_left || 0;
        }
        if (clock?.stone_removal_time_left) {
            return clock.stone_removal_time_left || 0;
        }
        switch (time_control?.system) {
            case "none":
            default:
                return Number.MAX_SAFE_INTEGER;

            case "fischer":
            case "absolute":
            case "simple":
                return player_clock.main_time;

            case "byoyomi": {
                // JGOFClock.periods_left includes the current, partially used,
                // period, but we just need to count the full ones.
                const full_periods_left = (player_clock.periods_left || 1) - 1;
                return (
                    player_clock.main_time +
                    (player_clock.period_time_left || 0) +
                    full_periods_left * (time_control.period_time as number) * 1000
                );
            }
            case "canadian":
                return player_clock.main_time + (player_clock.block_time_left || 0);
        }
    }

    extractClockSortFieldsAdHoc(game: GameType, use_this_player: boolean) {
        if (game?.json?.clock === undefined) {
            // No clock at all! Sort last.
            return {
                paused: true,
                is_current_player: false,
                remaining: Number.MAX_SAFE_INTEGER,
            };
        }

        const clock = game.goban?.last_clock || game.json.clock;
        const paused = this.isPaused(game.json?.pause_control);
        const is_current_player = clock.current_player === this.props.player?.id;
        const is_black = clock.black_player_id === this.props.player?.id;
        const use_black = use_this_player === is_black;
        const remaining = this.computeRemainingTimeAdHoc(
            game.json?.time_control,
            clock,
            use_black ? clock.black_time : clock.white_time,
        );

        return {
            paused: paused,
            is_current_player: is_current_player,
            remaining: remaining,
        };
    }

    extractClockSortFields(game: GameType, use_this_player: boolean) {
        if (game?.goban?.last_emitted_clock === undefined) {
            // No JGOFClock yet. Use the AdHocClock.
            return this.extractClockSortFieldsAdHoc(game, use_this_player);
        }

        const clock = game.goban.last_emitted_clock;
        const paused = this.isPaused(clock.pause_state);

        // Figure out which player clock to use.
        const is_current_player = clock.current_player_id === this.props.player?.id?.toString();
        const is_black = is_current_player === (clock.current_player === "black");
        const use_black = use_this_player === is_black;
        const remaining = this.computeRemainingTime(
            game.goban.config?.time_control,
            clock,
            use_black ? clock.black_clock : clock.white_clock,
        );
        return {
            paused: paused,
            is_current_player: is_current_player,
            remaining: remaining,
        };
    }

    applyCurrentSort(games: GameType[]) {
        switch (this.state.sort_order) {
            case "-clock":
            case "clock":
                games.sort((a, b) => {
                    const a_clock = this.extractClockSortFields(a, true);
                    const b_clock = this.extractClockSortFields(b, true);
                    return (
                        +b_clock.is_current_player - +a_clock.is_current_player ||
                        +a_clock.paused - +b_clock.paused ||
                        a_clock.remaining - b_clock.remaining ||
                        a.id - b.id
                    );
                });
                break;

            case "-opponent-clock":
            case "opponent-clock":
                games.sort((a, b) => {
                    const a_clock = this.extractClockSortFields(a, false);
                    const b_clock = this.extractClockSortFields(b, false);
                    return (
                        +a_clock.is_current_player - +b_clock.is_current_player ||
                        +a_clock.paused - +b_clock.paused ||
                        a_clock.remaining - b_clock.remaining ||
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
                        const a_opponent = a.black.id === this.props.player?.id ? a.white : a.black;
                        const b_opponent = b.black.id === this.props.player?.id ? b.white : b.black;
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
                            : a.json?.moves.length || 0;
                        const b_move_num = b.goban
                            ? b.goban.engine.getMoveNumber()
                            : b.json?.moves.length || 0;

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
                        // for non-square boards with the same number of intersections, the wider board is considered larger
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
                    disableSort={!!this.props.disableSort}
                    onSort={this.sortBy}
                    currentSort={this.state.sort_order}
                    player={this.props.player}
                    lineSummaryMode={this.props.lineSummaryMode}
                    onGobanCreated={(game: GameType, goban: Goban) =>
                        this.onGobanCreated(game, goban)
                    }
                ></LineSummaryTable>
            );
        } else {
            return MiniGobanList(
                games,
                !!this.props.namesByGobans,
                (game: GameType, goban: Goban) => this.onGobanCreated(game, goban),
                this.props.miniGobanProps,
            );
        }
    }

    onGobanCreated(game: GameType, goban: Goban) {
        // Save a pointer into the goban to use when sorting.
        game.goban = goban;

        // Render again once goban has a valid clock to set the sorted order.
        if (goban.last_emitted_clock === undefined) {
            goban.once("clock", () => {
                this.forceRender();
            });
        } else {
            this.forceRender();
        }
    }

    forceRender() {
        this.setState({
            force_render: this.state.force_render + 1,
        });
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
    onGobanCreated: (game: GameType, goban: Goban) => void;
}

function LineSummaryTable({
    list,
    lineSummaryMode,
    player,
    disableSort,
    currentSort,
    onSort,
    onGobanCreated,
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
                    gobanRef={(goban) => onGobanCreated(game, goban)}
                    width={game.width}
                    height={game.height}
                    rengo_teams={game.json?.rengo_teams}
                    lineSummaryMode={lineSummaryMode}
                />
            ))}
        </div>
    );
}

function MiniGobanList(
    games: GameType[],
    withNames: boolean,
    onGobanCreated: (game: GameType, goban: Goban) => void,
    miniGobanProps?: MiniGobanProps,
): JSX.Element {
    return (
        <div className="GameList">
            {games.map((game) => {
                const miniGoban = (
                    <MiniGoban
                        key={!withNames ? game.id : undefined}
                        id={game.id}
                        width={game.width}
                        height={game.height}
                        onGobanCreated={(goban) => onGobanCreated(game, goban)}
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
