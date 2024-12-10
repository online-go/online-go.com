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

import { _ } from "@/lib/translate";
import * as React from "react";
import { Glicko2Entry, glicko2_update } from "./glicko2";
import { get_handicap_adjustment, getUserRating, Rating } from "@/lib/rank_utils";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { PlayerCacheEntry, lookup } from "@/lib/player_cache";
import { get } from "@/lib/data";

interface RatingCalcState {}

export class RatingCalculator extends React.Component<{}, RatingCalcState> {
    constructor(props: {}) {
        super(props);
    }

    componentDidMount() {
        window.document.title = _("Rating Calculator");
    }

    render() {
        return (
            <div id="RatingCalculator">
                <h3>
                    {_(
                        "This calculator lets you predict the rating change of players who have played a game together.",
                    )}
                </h3>
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
    p1_new_rating: string[];
    p2_new_rating: string[];
    p1_new_deviation: string[];
    p2_new_deviation: string[];
    p1_new_volatility: string[];
    p2_new_volatility: string[];
    auto_black: PlayerCacheEntry | null;
    auto_white: PlayerCacheEntry | null;
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
            p1_new_rating: [],
            p2_new_rating: [],
            p1_new_deviation: [],
            p2_new_deviation: [],
            p1_new_volatility: [],
            p2_new_volatility: [],
            auto_black: null,
            auto_white: null,
        };
        this.compute_new_ratings = this.compute_new_ratings.bind(this);
        this.fill_player_info = this.fill_player_info.bind(this);
        this.calculated_rank_display_player = this.calculated_rank_display_player.bind(this);
        this.input_rank_display_player = this.input_rank_display_player.bind(this);
        this.setHandicap = this.setHandicap.bind(this);
    }

    user = get("user");

    componentDidMount(): void {
        //console.log(this.user);
        if (this.user.id > 0) {
            const user_cache_entry = lookup(this.user.id);
            //console.log(user_cache_entry);
            this.setState(
                {
                    auto_black: user_cache_entry,
                    auto_white: user_cache_entry,
                },
                this.fill_player_info,
            );
        }
    }

    //componentWillUnmount() {}

    inputs_positive(all_inputs: string[]) {
        //console.log(all_inputs);
        return (
            all_inputs.length === 6 &&
            all_inputs.every((element) => {
                return element !== "" && !isNaN(Number(element)) && Number(element) > 0;
            })
        );
    }

    setHandicap(event: React.ChangeEvent<HTMLInputElement>) {
        if (
            event.target.value !== "" &&
            !isNaN(Number(event.target.value)) &&
            Number(event.target.value) >= 0
        ) {
            this.setState(
                { handicap: String(Math.min(Math.max(Number(event.target.value), 0), 9)) },
                this.compute_new_ratings,
            );
        } else {
            this.setState({ handicap: "0" }, this.compute_new_ratings);
        }
    }

    info_found() {
        return (
            (this.state.auto_black?.ratings?.overall?.rating !== undefined &&
                this.state.auto_black?.ratings?.overall?.deviation !== undefined &&
                this.state.auto_black?.ratings?.overall?.volatility !== undefined) ||
            (this.state.auto_white?.ratings?.overall?.rating !== undefined &&
                this.state.auto_white?.ratings?.overall?.deviation !== undefined &&
                this.state.auto_white?.ratings?.overall?.volatility !== undefined)
        );
    }

    fill_player_info() {
        if (this.state.auto_black === null && this.state.auto_white === null) {
            return;
        }
        if (this.info_found()) {
            if (this.state.auto_black?.ratings?.overall?.rating !== undefined) {
                this.setState(
                    {
                        p1r: this.state.auto_black.ratings.overall.rating.toFixed(2),
                        p1d: this.state.auto_black.ratings.overall.deviation.toFixed(2),
                        p1v: this.state.auto_black.ratings.overall.volatility.toFixed(4),
                    },
                    this.compute_new_ratings,
                );
            }

            if (this.state.auto_white?.ratings?.overall?.rating !== undefined) {
                this.setState(
                    {
                        p2r: this.state.auto_white.ratings.overall.rating.toFixed(2),
                        p2d: this.state.auto_white.ratings.overall.deviation.toFixed(2),
                        p2v: this.state.auto_white.ratings.overall.volatility.toFixed(4),
                    },
                    this.compute_new_ratings,
                );
            }
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
            p1_new_rating: [p1win.rating.toFixed(2), p1loss.rating.toFixed(2)],
            p2_new_rating: [p2loss.rating.toFixed(2), p2win.rating.toFixed(2)],
            p1_new_deviation: [p1win.deviation.toFixed(2), p1loss.deviation.toFixed(2)],
            p2_new_deviation: [p2loss.deviation.toFixed(2), p2win.deviation.toFixed(2)],
            p1_new_volatility: [p1win.volatility.toFixed(4), p1loss.volatility.toFixed(4)],
            p2_new_volatility: [p2loss.volatility.toFixed(4), p2win.volatility.toFixed(4)],
        });
    }

    calculated_rank_display_player(p12: number, win: boolean): string {
        const win_index = (p12 === 1 && win) || (p12 === 2 && !win) ? 0 : 1;
        if (
            this.state.p1_new_rating.length === 0 ||
            this.state.p2_new_rating.length === 0 ||
            this.state.p1_new_deviation.length === 0 ||
            this.state.p2_new_deviation.length === 0 ||
            this.state.p1_new_volatility.length === 0 ||
            this.state.p1_new_deviation.length === 0
        ) {
            return "";
        }

        if (p12 === 1) {
            return this.rank_display(
                getUserRating({
                    ratings: {
                        overall: {
                            rating: Number(this.state.p1_new_rating[win_index]),
                            deviation: Number(this.state.p1_new_deviation[win_index]),
                            volatility: Number(this.state.p1_new_volatility[win_index]),
                        },
                    },
                }),
            );
        } else {
            return this.rank_display(
                getUserRating({
                    ratings: {
                        overall: {
                            rating: Number(this.state.p2_new_rating[win_index]),
                            deviation: Number(this.state.p2_new_deviation[win_index]),
                            volatility: Number(this.state.p2_new_volatility[win_index]),
                        },
                    },
                }),
            );
        }
    }

    input_rank_display_player(p12: number): string {
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
            return "";
        }

        if (
            p12 === 1 &&
            this.inputs_positive([this.state.p1r, "1", this.state.p1d, "1", this.state.p1v, "1"])
        ) {
            return this.rank_display(
                getUserRating({
                    ratings: {
                        overall: {
                            rating: Number(this.state.p1r),
                            deviation: Number(this.state.p1d),
                            volatility: Number(this.state.p1v),
                        },
                    },
                }),
            );
        } else if (
            p12 === 2 &&
            this.inputs_positive(["1", this.state.p2r, "1", this.state.p2d, "1", this.state.p2v])
        ) {
            return this.rank_display(
                getUserRating({
                    ratings: {
                        overall: {
                            rating: Number(this.state.p2r),
                            deviation: Number(this.state.p2d),
                            volatility: Number(this.state.p2v),
                        },
                    },
                }),
            );
        } else {
            return "";
        }
    }

    rank_display(rating: Rating): string {
        return rating.partial_bounded_rank_label + " \xB1 " + rating.rank_deviation.toFixed(1);
    }

    render() {
        return (
            <div id="Rating-Table-Div">
                <table className="rating-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th className={"rating-table-divider"}>
                                <h2>{_("Black")}</h2>
                            </th>
                            <th>
                                <h2>{_("White")}</h2>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>{_("Player")}</th>
                            <td className={"rating-table-divider"}>
                                <div>
                                    <PlayerAutocomplete
                                        onComplete={(player) => {
                                            this.setState(
                                                { auto_black: player },
                                                this.fill_player_info,
                                            );
                                        }}
                                        playerId={this.user.id > 0 ? this.user.id : undefined}
                                    />
                                </div>
                            </td>
                            <td>
                                <div>
                                    <PlayerAutocomplete
                                        onComplete={(player) => {
                                            this.setState(
                                                { auto_white: player },
                                                this.fill_player_info,
                                            );
                                        }}
                                        playerId={this.user.id > 0 ? this.user.id : undefined}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rating")}</th>
                            <td className={"rating-table-divider"}>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1r}
                                    onChange={(event) => {
                                        //console.log(event.target.value);
                                        this.setState(
                                            { p1r: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>

                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2r}
                                    onChange={(event) => {
                                        this.setState(
                                            { p2r: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Deviation")}</th>
                            <td className={"rating-table-divider"}>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1d}
                                    onChange={(event) => {
                                        this.setState(
                                            { p1d: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2d}
                                    onChange={(event) => {
                                        this.setState(
                                            { p2d: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Volatility")}</th>
                            <td className={"rating-table-divider"}>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p1v}
                                    onChange={(event) => {
                                        this.setState(
                                            { p1v: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    required
                                    value={this.state.p2v}
                                    onChange={(event) => {
                                        this.setState(
                                            { p2v: event.target.value },
                                            this.compute_new_ratings,
                                        );
                                    }}
                                ></input>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rank")}</th>
                            <td className={"rating-table-divider"}>
                                {this.input_rank_display_player(1) || null}
                            </td>
                            <td>{this.input_rank_display_player(2) || null}</td>
                        </tr>
                        <tr>
                            <th colSpan={1}>{_("Handicap")}</th>
                            <td colSpan={3}>
                                <input
                                    id="handicap-picker"
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={this.state.handicap}
                                    onChange={(event) => {
                                        this.setHandicap(event);
                                    }}
                                ></input>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={3}>
                                <h3>{_("If Black wins")}</h3>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rating")}</th>
                            <td className={"rating-table-divider result-won"}>
                                {this.state.p1_new_rating[0] || null}
                            </td>
                            <td className="result-lost">{this.state.p2_new_rating[0] || null}</td>
                        </tr>
                        <tr>
                            <th>{_("Deviation")}</th>
                            <td className={"rating-table-divider result-won"}>
                                {this.state.p1_new_deviation[0] || null}
                            </td>
                            <td className="result-lost">
                                {this.state.p2_new_deviation[0] || null}
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Volatility")}</th>
                            <td className={"rating-table-divider result-won"}>
                                {this.state.p1_new_volatility[0] || null}
                            </td>
                            <td className="result-lost">
                                {this.state.p2_new_volatility[0] || null}
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rank")}</th>
                            <td className={"rating-table-divider result-won"}>
                                {this.calculated_rank_display_player(1, true) || null}
                            </td>
                            <td className="result-lost">
                                {this.calculated_rank_display_player(2, false) || null}
                            </td>
                        </tr>

                        <tr>
                            <td colSpan={3}>
                                <h3>{_("If White wins")}</h3>
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rating")}</th>
                            <td className={"rating-table-divider result-lost"}>
                                {this.state.p1_new_rating[1] || null}
                            </td>
                            <td className="result-won">{this.state.p2_new_rating[1] || null}</td>
                        </tr>
                        <tr>
                            <th>{_("Deviation")}</th>
                            <td className={"rating-table-divider result-lost"}>
                                {this.state.p1_new_deviation[1] || null}
                            </td>
                            <td className="result-won">{this.state.p2_new_deviation[1] || null}</td>
                        </tr>
                        <tr>
                            <th>{_("Volatility")}</th>
                            <td className={"rating-table-divider result-lost"}>
                                {this.state.p1_new_volatility[1] || null}
                            </td>
                            <td className="result-won">
                                {this.state.p2_new_volatility[1] || null}
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Rank")}</th>
                            <td className={"rating-table-divider result-lost"}>
                                {this.calculated_rank_display_player(1, false) || null}
                            </td>
                            <td className="result-won">
                                {this.calculated_rank_display_player(2, true) || null}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
