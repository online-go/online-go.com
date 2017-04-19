/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {OGSComponent} from "components";
import {_, interpolate} from "translate";
import preferences from "preferences";
import {Goban} from "goban";
import {termination_socket} from "sockets";
import {makePlayerLink} from "Player";
import {MiniGoban} from "MiniGoban";
import {GobanLineSummary} from "GobanLineSummary";
import data from "data";

interface GameListProps {
    list: Array<any>;
    player?: any;
    emptyMessage?: string;
    disableSort?: boolean;
}

export class GameList extends React.PureComponent<GameListProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            sort_order: 'clock'
        };
    }

    sortBy(name: string) {
        return () => {
            if (this.state.sort_order === name) {
                this.setState({ sort_order: '-' + name });
            } else {
                 this.setState({ sort_order: name });
             }
        };
    }

    render() {
        let lst = this.props.list.slice(0);

        if (!this.props.disableSort) {
            switch (this.state.sort_order) {
                case '-clock':
                case 'clock':
                    lst.sort((a, b) => {
                        try {
                            let a_clock = a.goban && a.goban.last_clock ? a.goban.last_clock : a.json.clock;
                            let b_clock = b.goban && b.goban.last_clock ? b.goban.last_clock : b.json.clock;

                            /* not my move? push to bottom (or top) */
                            if (a_clock.current_player === this.props.player.id && b_clock.current_player !== this.props.player.id) {
                                return -1;
                            }
                            if (b_clock.current_player === this.props.player.id && a_clock.current_player !== this.props.player.id) {
                                return 1;
                            }

                            return a_clock.expiration - b_clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-opponent-clock':
                case 'opponent-clock':
                    lst.sort((a, b) => {
                        try {
                            let a_clock = a.goban && a.goban.last_clock ? a.goban.last_clock : a.json.clock;
                            let b_clock = b.goban && b.goban.last_clock ? b.goban.last_clock : b.json.clock;

                            /* not my move? push to bottom (or top) */
                            if (a_clock.current_player === this.props.player.id && b_clock.current_player !== this.props.player.id) {
                                return 1;
                            }
                            if (b_clock.current_player === this.props.player.id && a_clock.current_player !== this.props.player.id) {
                                return -1;
                            }

                            return a_clock.expiration - b_clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-name':
                case 'name':
                    lst.sort((a, b) => {
                        try {
                            return a.name.localeCompare(b.name) || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-opponent':
                case 'opponent':
                    lst.sort((a, b) => {
                        try {
                            let a_opponent = a.black.id === this.props.player.id ? a.white : a.black;
                            let b_opponent = b.black.id === this.props.player.id ? b.white : b.black;
                            return a_opponent.username.localeCompare(b_opponent.username) || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-move-number' :
                case 'move-number' :
                    lst.sort((a, b) => {
                        try {
                            let a_move_num = a.goban ? a.goban.engine.getMoveNumber() : a.json.moves.length;
                            let b_move_num = b.goban ? b.goban.engine.getMoveNumber() : b.json.moves.length;

                            return a_move_num - b_move_num || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;
            }

            if (this.state.sort_order[0] === '-') {
                lst.reverse();
            }
        }


        if (lst.length === 0) {
            return <div className="container">{this.props.emptyMessage || ""}</div>;
        } else if (lst.length > preferences.get("game-list-threshold")) {
            let sortable = this.props.disableSort && this.props.player ? '' : ' sortable ';
            let sort_order = this.state.sort_order;
            let move_number_sort      = sort_order === 'move-number'    ? 'sorted-desc' : sort_order === '-move-number'    ? 'sorted-asc' : '';
            let game_sort             = sort_order === 'name'           ? 'sorted-desc' : sort_order === '-name'           ? 'sorted-asc' : '';
            let opponent_sort         = sort_order === 'opponent'       ? 'sorted-desc' : sort_order === '-opponent'       ? 'sorted-asc' : '';
            let clock_sort            = sort_order === 'clock'          ? 'sorted-desc' : sort_order === '-clock'          ? 'sorted-asc' : '';
            let opponent_clock_sort   = sort_order === 'opponent-clock' ? 'sorted-desc' : sort_order === '-opponent-clock' ? 'sorted-asc' : '';

            return (
                <div className="GameList GobanLineSummaryContainer">
                    {this.props.player
                        ? <div className="GobanLineSummaryContainerHeader">
                              <div onClick={this.sortBy("move-number")} className={sortable + move_number_sort}>{_("Move")}</div>
                              <div onClick={this.sortBy("name")} className={sortable + game_sort + " text-align-left"}>{_("Game")}</div>
                              <div onClick={this.sortBy("opponent")} className={sortable + opponent_sort + " text-align-left"}>{_("Opponent")}</div>
                              <div onClick={this.sortBy("clock")} className={sortable + clock_sort}>{_("Clock")}</div>
                              <div onClick={this.sortBy("opponent-clock")} className={sortable + opponent_clock_sort}>{_("Opponent's Clock")}</div>
                          </div>
                        : <div className="GobanLineSummaryContainerHeader">
                              <div >{_("Move")}</div>
                              <div >{_("Game")}</div>
                              <div className="text-align-left">{_("Black")}</div>
                              <div></div>
                              <div className="text-align-left">{_("White")}</div>
                              <div></div>
                          </div>
                    }
                    {lst.map((game) =>
                        <GobanLineSummary key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            player={this.props.player}
                            gobanref={(goban) => game.goban = goban}
                            />)}
                </div>
            );
        } else {
            return (
                <div className="GameList">
                    {lst.map((game) =>
                        <MiniGoban key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            width={game.width}
                            height={game.height}
                            />)}
                </div>
            );
        }
    }
}
