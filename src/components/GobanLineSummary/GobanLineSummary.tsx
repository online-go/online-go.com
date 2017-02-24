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
import {browserHistory} from "react-router";
import {_, interpolate} from "translate";
import preferences from "preferences";
import {Goban} from "goban";
import {termination_socket} from "sockets";
import {makePlayerLink} from "Player";
import data from "data";
import {PersistentElement} from "PersistentElement";
import {rankString, navigateTo} from "misc";
import {Player} from "Player";

interface GobanLineSummaryProps {
    id: number;
    width?: number;
    height?: number;
    black: any;
    white: any;
    onUpdate?: () => void;
    json?: any;
    noLink?: boolean;
    opponentStyle: boolean;
}

export class GobanLineSummary extends React.Component<GobanLineSummaryProps, any> {
    white_clock;
    black_clock;
    user_clock;
    opponent_clock;
    opponent;
    goban;

    constructor(props) {
        super(props);
        this.state = {
            white_score: "",
            black_score: "",
        };

        this.white_clock = $("<span>");
        this.black_clock = $("<span>");
        let user = data.get("user");
        this.user_clock = user.id === this.props.black.id ? this.black_clock : this.white_clock;
        this.opponent_clock = user.id === this.props.black.id ? this.white_clock : this.black_clock;
        this.opponent = user.id === this.props.black.id ? this.props.white : this.props.black;
    }

    componentDidMount() {{{
        this.initialize();
    }}}
    componentWillUnmount() {{{
        this.destroy();
    }}}
    componentDidUpdate(prev_props) {{{
        if (prev_props.id !== this.props.id) {
            this.destroy();
            this.initialize();
        }
    }}}

    initialize() {{{
        this.goban = new Goban({
            "board_div": null,
            "black_clock": this.black_clock,
            "white_clock": this.white_clock,
            "draw_top_labels": false,
            "draw_bottom_labels": false,
            "draw_left_labels": false,
            "draw_right_labels": false,
            "use_short_format_clock": false,
            "game_id": this.props.id,
            "square_size": "auto",
            "width" : this.props.width || (this.props.json ? this.props.json.width : 19),
            "height" : this.props.height || (this.props.json ? this.props.json.height : 19)
        }, this.props.json);


        this.goban.on("update", () => {
            this.sync_state();
            if (this.props.onUpdate) {
                this.props.onUpdate();
            }
        });

        this.goban.on("pause-text", (new_text) => this.setState({
            "white_pause_text": new_text.white_pause_text,
            "black_pause_text": new_text.black_pause_text,
        }));
    }}}

    destroy() {
        this.goban.destroy();
    }

    sync_state() {
        const score = this.goban.engine.computeScore(true);
        const black = this.props.black;
        const white = this.props.white;
        const player_to_move = (this.goban && this.goban.engine.playerToMove()) || 0;

        this.setState({
            black_score: interpolate("%s points", [(score.black.prisoners + score.black.komi)]),
            white_score: interpolate("%s points", [(score.white.prisoners + score.white.komi)]),

            move_number: this.goban.engine.getMoveNumber(),
            game_name: this.goban.engine.config.game_name,

            black_name: (typeof(black) === "object" ? (black.username + " [" + rankString(black) + "]") : black),
            white_name: (typeof(white) === "object" ? (white.username + " [" + rankString(white) + "]") : white),
            paused: this.state.black_pause_text ? "paused" : "",

            current_users_move: player_to_move === data.get("config.user").id,
            black_to_move_cls: (this.goban && black.id === player_to_move) ? "to-move" : "",
            white_to_move_cls: (this.goban && white.id === player_to_move) ? "to-move" : "",



            in_stone_removal_phase: (this.goban && this.goban.engine.phase === "stone removal"),
            finished: (this.goban && this.goban.engine.phase === "finished"),
        });
    }

    gotoGame = (ev) => {
        if (this.props.noLink) {
            return;
        }
        navigateTo(`/game/${this.props.id}`, ev);
    }

    render() {
        return (
            <div className={ `GobanLineSummary `
                            + (this.props.noLink ? " nolink" : " link")
                            + (this.state.current_users_move ? " current-users-move" : "")
                            + (this.state.in_stone_removal_phase ? " in-stone-removal-phase" : "")
                }
                 onClick={this.gotoGame}
                >
                <div className="move-number">{this.state.move_number}</div>
                <div className="game-name">{this.state.game_name}</div>

                {this.props.opponentStyle && <div className="player"><Player user={this.opponent} rank/></div> }
                {this.props.opponentStyle &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.user_clock} />
                    </div>
                }
                {this.props.opponentStyle &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.opponent_clock} />
                    </div>
                }

                {!this.props.opponentStyle && <div className="player"><Player user={this.props.black} rank/></div> }
                {!this.props.opponentStyle &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.black_clock} />
                    </div>
                }
                {!this.props.opponentStyle && <div className="player"><Player user={this.props.white} rank/></div> }
                {!this.props.opponentStyle &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.white_clock} />
                    </div>
                }
            </div>
        );
    }
}
