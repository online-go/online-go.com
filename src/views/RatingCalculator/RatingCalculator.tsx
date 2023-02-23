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

import { _ } from "translate";
import * as React from "react";
import { test_table_1, test_example_3, test_example_4, test_example_5 } from "./test_gor";
import {
    test_glicko2,
    test_str,
    test_expansion,
    test_copy,
    test_expected_win_probability,
    test_nop,
    test_exercise,
} from "./test_glicko2";
import { Glicko2Entry, glicko2_update } from "./glicko2";
import { get_handicap_adjustment } from "rank_utils";
import { PlayerAutocomplete } from "PlayerAutocomplete";
import { PlayerCacheEntry } from "src/lib/player_cache";

interface RatingCalcState {}

export class RatingCalculator extends React.Component<{}, RatingCalcState> {
    constructor(props: {}) {
        super(props);
    }

    componentDidMount() {
        window.document.title = _("Rating Calculator");
    }

    //componentDidUpdate() {}

    //componentWillUnmount() {}

    run_unit_tests() {
        //test gor
        test_table_1();
        test_example_3();
        test_example_4();
        test_example_5();
        //test glicko2
        test_glicko2();
        test_str();
        test_expansion();
        test_copy();
        test_expected_win_probability();
        test_nop();
        test_exercise();
    }

    render() {
        return (
            <div id="Rating-Calculator-Container">
                <p>
                    Glicko2 rating calculator to predict rating changes for even and handicap rated
                    games.
                </p>
                {false && <button onClick={this.run_unit_tests}>Run Unit Tests</button>}
                <RatingCalculatorTable />
            </div>
        );
    }
}

interface RatingCalcTableState {
    p1r: string;
    p2r: string;
    p1d: string;
    p2d: string;
    p1v: string;
    p2v: string;
    handicap: string;
    p1newrating: string[];
    p2newrating: string[];
    p1newdeviation: string[];
    p2newdeviation: string[];
    p1newvolatility: string[];
    p2newvolatility: string[];
    auto_black: PlayerCacheEntry;
    auto_white: PlayerCacheEntry;
}

export class RatingCalculatorTable extends React.Component<{}, RatingCalcTableState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            p1r: "",
            p2r: "",
            p1d: "",
            p2d: "",
            p1v: "",
            p2v: "",
            handicap: "0",
            p1newrating: [],
            p2newrating: [],
            p1newdeviation: [],
            p2newdeviation: [],
            p1newvolatility: [],
            p2newvolatility: [],
            auto_black: null,
            auto_white: null,
        };
        this.compute_new_ratings = this.compute_new_ratings.bind(this);
        this.fill_player_info = this.fill_player_info.bind(this);
    }

    /*componentDidMount() {
    }*/

    inputs_positive(all_inputs: string[]) {
        //console.log(all_inputs);
        return (
            all_inputs.length === 6 &&
            all_inputs.every((element) => {
                return element !== "" && !isNaN(Number(element)) && Number(element) > 0;
            })
        );
    }

    all_info_found() {
        return (
            this.state.auto_black?.ratings?.overall?.rating !== undefined &&
            this.state.auto_black?.ratings?.overall?.deviation !== undefined &&
            this.state.auto_black?.ratings?.overall?.volatility !== undefined &&
            this.state.auto_white?.ratings?.overall?.rating !== undefined &&
            this.state.auto_white?.ratings?.overall?.deviation !== undefined &&
            this.state.auto_white?.ratings?.overall?.volatility !== undefined
        );
    }

    fill_player_info() {
        if (this.state.auto_black === null || this.state.auto_white === null) {
            return;
        }
        if (this.all_info_found()) {
            this.setState({
                p1r: this.state.auto_black.ratings.overall.rating.toFixed(2),
                p2r: this.state.auto_white.ratings.overall.rating.toFixed(2),
                p1d: this.state.auto_black.ratings.overall.deviation.toFixed(2),
                p2d: this.state.auto_white.ratings.overall.deviation.toFixed(2),
                p1v: this.state.auto_black.ratings.overall.volatility.toFixed(4),
                p2v: this.state.auto_white.ratings.overall.volatility.toFixed(4),
            });
        }
    }

    compute_new_ratings() {
        //console.log("computing new ratings");
        if (
            !this.inputs_positive([
                this.state.p1r,
                this.state.p2r,
                this.state.p1d,
                this.state.p2d,
                this.state.p1v,
                this.state.p2v,
            ])
        ) {
            //console.log("not all positive");
            return;
        }

        //console.log("all positive");

        let p1win: Glicko2Entry;
        let p1loss: Glicko2Entry;
        let p2win: Glicko2Entry;
        let p2loss: Glicko2Entry;

        const p1 = new Glicko2Entry(
            Number(this.state.p1r),
            Number(this.state.p1d),
            Number(this.state.p1v),
        );

        p1.glicko2_configure(0.5, 10, 500);

        const p2 = new Glicko2Entry(
            Number(this.state.p2r),
            Number(this.state.p2d),
            Number(this.state.p2v),
        );

        p2.glicko2_configure(0.5, 10, 500);

        if (Number(this.state.handicap) > 0) {
            const handicap_adjustment_black = get_handicap_adjustment(
                Number(this.state.p1r),
                Number(this.state.handicap),
            );
            const handicap_adjustment_white = get_handicap_adjustment(
                Number(this.state.p2r),
                Number(this.state.handicap),
            );

            const p1up = new Glicko2Entry(
                Number(this.state.p1r) + handicap_adjustment_black,
                Number(this.state.p1d),
                Number(this.state.p1v),
            );

            p1up.glicko2_configure(0.5, 10, 500);

            const p2down = new Glicko2Entry(
                Number(this.state.p2r) - handicap_adjustment_white,
                Number(this.state.p2d),
                Number(this.state.p2v),
            );
            p2down.glicko2_configure(0.5, 10, 500);

            p1win = glicko2_update(p1, [[p2down, 1]]);
            p1loss = glicko2_update(p1, [[p2down, 0]]);
            p2win = glicko2_update(p2, [[p1up, 1]]);
            p2loss = glicko2_update(p2, [[p1up, 0]]);
        } else {
            p1win = glicko2_update(p1, [[p2, 1]]);
            p1loss = glicko2_update(p1, [[p2, 0]]);
            p2win = glicko2_update(p2, [[p1, 1]]);
            p2loss = glicko2_update(p2, [[p1, 0]]);
        }

        this.setState({
            p1newrating: [p1win.rating.toFixed(2), p1loss.rating.toFixed(2)],
            p2newrating: [p2loss.rating.toFixed(2), p2win.rating.toFixed(2)],
            p1newdeviation: [p1win.deviation.toFixed(2), p1loss.deviation.toFixed(2)],
            p2newdeviation: [p2loss.deviation.toFixed(2), p2win.deviation.toFixed(2)],
            p1newvolatility: [p1win.volatility.toFixed(4), p1loss.volatility.toFixed(4)],
            p2newvolatility: [p2loss.volatility.toFixed(4), p2win.volatility.toFixed(4)],
        });
    }

    render() {
        return (
            <div id="Rating-Table-Div">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>
                                <span>{_("Black")}</span>
                            </th>
                            <th>
                                <span>{_("White")}</span>
                            </th>
                            <th>
                                <span>{_("Comment")}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td></td>
                            <td>
                                <div>
                                    <PlayerAutocomplete
                                        onComplete={(player) => {
                                            this.setState({ auto_black: player });
                                        }}
                                    />
                                </div>
                            </td>
                            <td>
                                <div>
                                    <PlayerAutocomplete
                                        onComplete={(player) => {
                                            this.setState({ auto_white: player });
                                        }}
                                    />
                                </div>
                            </td>
                            <td>
                                <span>Fill using players</span>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4}>
                                <button onClick={this.fill_player_info}>{_("Use Players")}</button>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4}>{_("Current Parameters")}</td>
                        </tr>
                        <tr>
                            <td>
                                <span>{_("Rating")}</span>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1r}
                                    onChange={(event) => {
                                        //console.log(event.target.value);
                                        this.setState({ p1r: event.target.value });
                                    }}
                                ></input>
                            </td>

                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2r}
                                    onChange={(event) => {
                                        this.setState({ p2r: event.target.value });
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <td>{_("Deviation")}</td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1d}
                                    onChange={(event) => {
                                        this.setState({ p1d: event.target.value });
                                    }}
                                ></input>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2d}
                                    onChange={(event) => {
                                        this.setState({ p2d: event.target.value });
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <td>{_("Volatility")}</td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1v}
                                    onChange={(event) => {
                                        this.setState({ p1v: event.target.value });
                                    }}
                                ></input>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2v}
                                    onChange={(event) => {
                                        this.setState({ p2v: event.target.value });
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}> Handicap </td>
                            <td colSpan={2}>
                                <input
                                    id="handicap-picker"
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={this.state.handicap}
                                    onChange={(event) => {
                                        this.setState({ handicap: event.target.value });
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4}>
                                <button onClick={this.compute_new_ratings}>{_("Calculate")}</button>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={4}>{_("New Parameters")}</td>
                        </tr>
                        <tr>
                            <td>{_("Rating")}</td>
                            <td>{this.state.p1newrating[0] || null}</td>
                            <td>{this.state.p2newrating[0] || null}</td>
                            <td>Black win</td>
                        </tr>
                        <tr>
                            <td>{_("Deviation")}</td>
                            <td>{this.state.p1newdeviation[0] || null}</td>
                            <td>{this.state.p2newdeviation[0] || null}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>{_("Volatility")}</td>
                            <td>{this.state.p1newvolatility[0] || null}</td>
                            <td>{this.state.p2newvolatility[0] || null}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>{_("Rating")}</td>
                            <td>{this.state.p1newrating[1] || null}</td>
                            <td>{this.state.p2newrating[1] || null}</td>
                            <td>White win</td>
                        </tr>
                        <tr>
                            <td>{_("Deviation")}</td>
                            <td>{this.state.p1newdeviation[1] || null}</td>
                            <td>{this.state.p2newdeviation[1] || null}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>{_("Volatility")}</td>
                            <td>{this.state.p1newvolatility[1] || null}</td>
                            <td>{this.state.p2newvolatility[1] || null}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
