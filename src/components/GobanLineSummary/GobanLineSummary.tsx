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
import {_, interpolate} from "translate";
import {Goban} from "goban";
import * as data from "data";
import {PersistentElement} from "PersistentElement";
import {navigateTo} from "misc";
import {rankString} from "rank_utils";
import {Player} from "Player";

interface GobanLineSummaryProps {
    id: number;
    black: any;
    white: any;
    player?: any;
    gobanref?: (goban:Goban) => void;
}

export class GobanLineSummary extends React.Component<GobanLineSummaryProps, any> {
    white_clock;
    black_clock;
    goban;

    constructor(props) {
        super(props);
        this.state = {
            white_score: "",
            black_score: "",
        };

        this.white_clock = $("<span>");
        this.black_clock = $("<span>");
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

            current_users_move: player_to_move === data.get("user").id,
            black_to_move_cls: (this.goban && black.id === player_to_move) ? "to-move" : "",
            white_to_move_cls: (this.goban && white.id === player_to_move) ? "to-move" : "",



            in_stone_removal_phase: (this.goban && this.goban.engine.phase === "stone removal"),
            finished: (this.goban && this.goban.engine.phase === "finished"),
        });
    }

    gotoGame = (ev) => {
        navigateTo(`/game/${this.props.id}`, ev);
    }

    render() {
        let player;
        let opponent;
        let player_clock;
        let opponent_clock;
        if (this.props.player && this.props.player.id === this.props.black.id) {
            player = this.props.black;
            opponent = this.props.white;
            player_clock = this.black_clock;
            opponent_clock = this.white_clock;
        }
        if (this.props.player && this.props.player.id === this.props.white.id) {
            player = this.props.white;
            opponent = this.props.black;
            player_clock = this.white_clock;
            opponent_clock = this.black_clock;
        }
        return (
            <div className={ `GobanLineSummary `
                            + (this.state.current_users_move ? " current-users-move" : "")
                            + (this.state.in_stone_removal_phase ? " in-stone-removal-phase" : "")
                }
                 onClick={this.gotoGame}
                 onMouseUp={this.gotoGame}
                >
                <div className="move-number">{this.state.move_number}</div>
                <div className="game-name">{this.state.game_name}</div>

                {player && <div className="player"><Player user={opponent} rank using_cache/></div> }
                {player &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={player_clock} />
                    </div>
                }
                {player &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={opponent_clock} />
                    </div>
                }

                {!player && <div className="player"><Player user={this.props.black} rank using_cache/></div> }
                {!player &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.black_clock} />
                    </div>
                }
                {!player && <div className="player"><Player user={this.props.white} rank using_cache/></div> }
                {!player &&
                    <div>
                        <PersistentElement className={`clock ${this.state.paused}`} elt={this.white_clock} />
                    </div>
                }
            </div>
        );
    }
}
