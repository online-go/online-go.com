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
    emptyMessage?: string;
    opponentStyle: boolean;
}

export class GameList extends React.PureComponent<GameListProps, any> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        if (this.props.list.length === 0) {
            return <div className="container">{this.props.emptyMessage || ""}</div>;
        } else if (this.props.list.length > preferences.get("game-list-threshold")) {
            return (
                <div className="GameList GobanLineSummaryContainer">
                    {this.props.opponentStyle
                        ? <div className="GobanLineSummaryContainerHeader">
                              <div>{_("Move")}</div>
                              <div className="text-align-left">{_("Game")}</div>
                              <div className="text-align-left">{_("Opponent")}</div>
                              <div>{_("Your Clock")}</div>
                              <div>{_("Opponent's Clock")}</div>
                          </div>
                        : <div className="GobanLineSummaryContainerHeader">
                              <div>{_("Move")}</div>
                              <div className="text-align-left">{_("Game")}</div>
                              <div className="text-align-left">{_("Black")}</div>
                              <div></div>
                              <div className="text-align-left">{_("White")}</div>
                              <div></div>
                          </div>
                    }
                    {this.props.list.map((game) =>
                        <GobanLineSummary key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            opponentStyle={this.props.opponentStyle}
                            />)}
                </div>
            );
        } else {
            return (
                <div className="GameList">
                    {this.props.list.map((game) =>
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
