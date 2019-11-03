/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {Link} from 'react-router-dom';
import {_, interpolate} from "translate";
import {Goban} from "goban";
import * as data from "data";
import {PersistentElement} from "PersistentElement";
import {rankString} from "rank_utils";
import {Player} from "Player";
import {Clock} from "Clock";

interface GobanLineSummaryProps {
    id: number;
    black: any;
    white: any;
    player?: any;
    gobanref?: (goban:Goban) => void;
    width?: number;
    height?: number;
}

export class GobanLineSummary extends React.Component<GobanLineSummaryProps, any> {
    goban;

    constructor(props) {
        super(props);
        this.state = {
            white_score: "",
            black_score: "",
        };
    }

    componentDidMount() {
        this.initialize();
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate(prev_props) {
        if (prev_props.id !== this.props.id) {
            this.destroy();
            this.initialize();
        }
    }

    initialize() {
        this.goban = new Goban({
            "board_div": null,
            "draw_top_labels": false,
            "draw_bottom_labels": false,
            "draw_left_labels": false,
            "draw_right_labels": false,
            "game_id": this.props.id,
            "square_size": "auto",
        });


        this.goban.on("update", () => {
            this.sync_state();
        });

        this.goban.on("pause-text", (new_text) => this.setState({
            "white_pause_text": new_text.white_pause_text,
            "black_pause_text": new_text.black_pause_text,
        }));

        if (this.props.gobanref) {
            this.props.gobanref(this.goban);
        }
    }

    destroy() {
        if (this.goban) {
            /* This is guarded because we hit this being called before
             * initialize ran a few times, so I guess componentWillUnmount can
             * be called without componentDidMount having been executed, or
             * something else fuggly is going on. */
            this.goban.destroy();
        }
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

    render() {
        let player;
        let opponent;
        let player_color:string;
        let opponent_color:string;

        if (this.props.player && this.props.player.id === this.props.black.id) {
            player = this.props.black;
            opponent = this.props.white;
            player_color = 'black';
            opponent_color = 'white';
        }

        if (this.props.player && this.props.player.id === this.props.white.id) {
            player = this.props.white;
            opponent = this.props.black;
            player_color = 'white';
            opponent_color = 'black';
        }

        return (
            <Link to={`/game/${this.props.id}`} className={ `GobanLineSummary `
                            + (this.state.current_users_move ? " current-users-move" : "")
                            + (this.state.in_stone_removal_phase ? " in-stone-removal-phase" : "")
                }
                >
                <div className="move-number">{this.state.move_number}</div>
                <div className="game-name">{this.state.game_name}</div>

                {player && <div className="player"><Player user={opponent} fakelink rank /></div> }
                {player &&
                    <div>
                        <Clock goban={this.goban} color={player_color as 'black' | 'white'} />
                    </div>
                }
                {player &&
                    <div>
                        <Clock goban={this.goban} color={opponent_color as 'black' | 'white'} />
                    </div>
                }

                {!player && <div className="player"><Player user={this.props.black} fakelink rank/></div> }
                {!player &&
                    <div>
                        <Clock goban={this.goban} color='black' />
                    </div>
                }
                {!player && <div className="player"><Player user={this.props.white} fakelink /></div> }
                {!player &&
                    <div>
                        <Clock goban={this.goban} color='white' />
                    </div>
                }
                <div className="size">{this.props.width + "x" + this.props.height}</div>
            </Link>
        );
    }
}
