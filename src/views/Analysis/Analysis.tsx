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
import {KBShortcut} from "KBShortcut";
import {PersistentElement} from "PersistentElement";
import {errorAlerter, dup, ignore} from "misc";
import {Goban, GoMath} from "goban";
import {Resizable} from "Resizable";
import {_} from "translate";
import {get} from "requests";
import {AnalysisPredictionChart, AnalysisEntry} from 'AnalysisPredictionChart';

interface AnalysisProperties {
    match: {
        params: {
            game_id?: string,
            analysis_id?: string,
        }
    };
}

export class Analysis extends React.Component<AnalysisProperties, any> {
    refs: {
        goban_container;
    };

    goban: Goban;
    goban_div: any;
    goban_opts: any = {};

    game_id: string;
    analysis_id: string;

    constructor(props) {
        super(props);

        this.state = {
            move_string: "",
            loading: true,
            err: null,
            entries: [],
        };

        this.goban_div = $("<div className='Goban'>");
        this.game_id = this.props.match.params.game_id;
        this.analysis_id = this.props.match.params.analysis_id;

        this.load();
    }

    load() {
        get(`/termination-api/analysis/${this.game_id}/${this.analysis_id}`)
        .then((res) => {
            let opts = {
                "board_div": this.goban_div,
                "interactive": true,
                "mode": "puzzle",
                "player_id": 0,
                "server_socket": null,
                "square_size": 20,
                "original_sgf": res.details.sgf,
            };

            this.goban_opts = opts;
            this.goban = new Goban(opts);
            this.goban.setMode("puzzle");
            this.goban.on("update", () => this.onUpdate());
            window["global_goban"] = this.goban;

            let entries = [];

            if (res.data['full-network-fastmap']) {
                let last_full_prediction = 0.5;
                entries = res.data['full-network-fastmap'].map(d => {
                    let full_prediction = last_full_prediction;

                    if (`full-${d.move}` in res.data) {
                        if (res.data[`full-${d.move}`].variations.length) {
                            full_prediction = res.data[`full-${d.move}`].prediction;
                        }
                    }

                    last_full_prediction = full_prediction;

                    return new AnalysisEntry({
                        move: d.move,
                        fast_prediction: d.prediction,
                        full_prediction: full_prediction
                    });
                });
            }

            this.setState({loading: false, entries});
        }).catch(err => {
            console.error(err);
            this.setState({err: _("Error loading game analysis")});
        });
    }


    /* This is called every time a move is played or anything else changes about the state of the board */
    onUpdate = () => {
        let mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height);
        let move_string = mvs.map((p) => GoMath.prettyCoords(p.x, p.y, this.goban.height)).join(",");
        this.setState({ move_string });
    }


    setMove = (move_number:number):void => {
        this.goban.engine.jumpToOfficialMoveNumber(move_number);
    }

    render() {
        if (this.state.err) {
            return <div className='GobanTest error'>{this.state.err}</div>;
        }

        if (this.state.loading) {
            return <div className='GobanTest loading'>{_("Loading")}</div>;
        }

        return (
            <div className={`GobanTest`}>
                <div className={"center-col"}>
                    <div ref="goban_container" className="goban-container">
                        <PersistentElement className="Goban" elt={this.goban_div}/>
                    </div>
                </div>
                <div>
                    <AnalysisPredictionChart entries={this.state.entries} setmove={this.setMove} />
                </div>

                <div>
                    Moves made: {this.state.move_string}

                </div>
            </div>
        );
    }
}
