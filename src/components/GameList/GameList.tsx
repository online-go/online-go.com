/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _, pgettext, interpolate } from "translate";
import * as preferences from "preferences";
import { MiniGoban } from "MiniGoban";
import { GobanLineSummary } from "GobanLineSummary";
import { Player } from "Player";
import * as data from "data";

interface GameListProps {
    list: Array<any>;
    player?: any;
    emptyMessage?: string;
    disableSort?: boolean;
    miniGobanProps?: any;
    namesByGobans?: boolean;
    forceList?: boolean;
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

    sortBy(name: SortOrder) {
        return () => {
            if (this.state.sort_order === name) {
                this.setState({ sort_order: ("-" + name) as DescendingSortOrder });
            } else {
                this.setState({ sort_order: name });
            }
        };
    }

    render() {
        const lst = this.props.list.slice(0);

        if (!this.props.disableSort) {
            switch (this.state.sort_order) {
                case "-clock":
                case "clock":
                    lst.sort((a, b) => {
                        try {
                            const a_clock =
                                a.goban && a.goban.last_clock ? a.goban.last_clock : a.json.clock;
                            const b_clock =
                                b.goban && b.goban.last_clock ? b.goban.last_clock : b.json.clock;

                            /* not my move? push to bottom (or top) */
                            if (
                                a_clock.current_player === this.props.player.id &&
                                b_clock.current_player !== this.props.player.id
                            ) {
                                return -1;
                            }
                            if (
                                b_clock.current_player === this.props.player.id &&
                                a_clock.current_player !== this.props.player.id
                            ) {
                                return 1;
                            }

                            return a_clock.expiration - b_clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case "-opponent-clock":
                case "opponent-clock":
                    lst.sort((a, b) => {
                        try {
                            const a_clock =
                                a.goban && a.goban.last_clock ? a.goban.last_clock : a.json.clock;
                            const b_clock =
                                b.goban && b.goban.last_clock ? b.goban.last_clock : b.json.clock;

                            /* not my move? push to bottom (or top) */
                            if (
                                a_clock.current_player === this.props.player.id &&
                                b_clock.current_player !== this.props.player.id
                            ) {
                                return 1;
                            }
                            if (
                                b_clock.current_player === this.props.player.id &&
                                a_clock.current_player !== this.props.player.id
                            ) {
                                return -1;
                            }

                            return a_clock.expiration - b_clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case "-name":
                case "name":
                    lst.sort((a, b) => {
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
                    lst.sort((a, b) => {
                        try {
                            const a_opponent =
                                a.black.id === this.props.player.id ? a.white : a.black;
                            const b_opponent =
                                b.black.id === this.props.player.id ? b.white : b.black;
                            return (
                                a_opponent.username.localeCompare(b_opponent.username) ||
                                a.id - b.id
                            );
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case "-move-number":
                case "move-number":
                    lst.sort((a, b) => {
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
                    lst.sort((a, b) => {
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
                lst.reverse();
            }
        }

        if (lst.length === 0) {
            return <div className="container">{this.props.emptyMessage || ""}</div>;
        } else if (this.props.forceList || lst.length > preferences.get("game-list-threshold")) {
            const sortable = this.props.disableSort && this.props.player ? "" : " sortable ";
            const sort_order = this.state.sort_order;
            const move_number_sort =
                sort_order === "move-number"
                    ? "sorted-desc"
                    : sort_order === "-move-number"
                    ? "sorted-asc"
                    : "";
            const game_sort =
                sort_order === "name" ? "sorted-desc" : sort_order === "-name" ? "sorted-asc" : "";
            const opponent_sort =
                sort_order === "opponent"
                    ? "sorted-desc"
                    : sort_order === "-opponent"
                    ? "sorted-asc"
                    : "";
            const clock_sort =
                sort_order === "clock"
                    ? "sorted-desc"
                    : sort_order === "-clock"
                    ? "sorted-asc"
                    : "";
            const opponent_clock_sort =
                sort_order === "opponent-clock"
                    ? "sorted-desc"
                    : sort_order === "-opponent-clock"
                    ? "sorted-asc"
                    : "";
            const size =
                sort_order === "size" ? "sorted-desc" : sort_order === "-size" ? "sorted-asc" : "";

            return (
                <div className="GameList GobanLineSummaryContainer">
                    {this.props.player ? (
                        <div className="GobanLineSummaryContainerHeader">
                            <div
                                onClick={this.sortBy("move-number")}
                                className={sortable + move_number_sort}
                            >
                                {pgettext("Game list move number", "Move")}
                            </div>
                            <div
                                onClick={this.sortBy("name")}
                                className={sortable + game_sort + " text-align-left"}
                            >
                                {_("Game")}
                            </div>
                            <div
                                onClick={this.sortBy("opponent")}
                                className={sortable + opponent_sort + " text-align-left"}
                            >
                                {_("Opponent")}
                            </div>
                            <div onClick={this.sortBy("clock")} className={sortable + clock_sort}>
                                {_("Clock")}
                            </div>
                            <div
                                onClick={this.sortBy("opponent-clock")}
                                className={sortable + opponent_clock_sort}
                            >
                                {_("Opponent's Clock")}
                            </div>
                            <div onClick={this.sortBy("size")} className={sortable + size}>
                                {_("Size")}
                            </div>
                        </div>
                    ) : (
                        <div className="GobanLineSummaryContainerHeader">
                            <div>{pgettext("Game list move number", "Move")}</div>
                            <div>{_("Game")}</div>
                            <div className="text-align-left">{_("Black")}</div>
                            <div></div>
                            <div className="text-align-left">{_("White")}</div>
                            <div></div>
                            <div className="text-align-left">{_("Size")}</div>
                        </div>
                    )}
                    {lst.map((game) => (
                        <GobanLineSummary
                            key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            player={this.props.player}
                            gobanref={(goban) => (game.goban = goban)}
                            width={game.width}
                            height={game.height}
                        />
                    ))}
                </div>
            );
        } else {
            if (this.props.namesByGobans) {
                return (
                    <div className="GameList">
                        {lst.map((game) => {
                            return (
                                <div className="goban-with-names" key={game.id}>
                                    <div className="names">
                                        <div>
                                            <Player
                                                user={game.black}
                                                disableCacheUpdate
                                                noextracontrols
                                            />
                                        </div>
                                        <div>
                                            <Player
                                                user={game.white}
                                                disableCacheUpdate
                                                noextracontrols
                                            />
                                        </div>
                                    </div>
                                    <MiniGoban
                                        id={game.id}
                                        width={game.width}
                                        height={game.height}
                                        {...(this.props.miniGobanProps || {})}
                                    />
                                </div>
                            );
                        })}
                    </div>
                );
            } else {
                return (
                    <div className="GameList">
                        {lst.map((game) => {
                            return (
                                <MiniGoban
                                    key={game.id}
                                    id={game.id}
                                    width={game.width}
                                    height={game.height}
                                    {...(this.props.miniGobanProps || {})}
                                />
                            );
                        })}
                    </div>
                );
            }
        }
    }
}
