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
import {_, pgettext, interpolate} from "translate";
import {post, get, put} from "requests";
import {errorAlerter} from "misc";
import {longRankString} from "rank_utils";

import data from "data";

declare var swal;

interface FirstTimeSetupProperties {
}


let durations = [
    {"time": _("I've never played before")},
    {"time": _("1 Day")},
    {"time": interpolate(_("{{num}} Days"), {num: "3+"})},
    {"time": _("1 Week")},
    {"time": interpolate(_("{{num}} Weeks"), {num: "3+"})},
    {"time": _("1 Month")},
    {"time": interpolate(_("{{num}} Weeks"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Months"), {num: "3+"})},
    {"time": _("1 Year")},
    {"time": interpolate(_("{{num}} Years"), {num: "1+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "1+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "1+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "1+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "1+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "2+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "2+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "2+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "3+"})},
    {"time": interpolate(_("{{num}} Years"), {num: "3+"})},
    {"time": _("A long time")},
];


export class FirstTimeSetup extends React.PureComponent<FirstTimeSetupProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            rank: -1,
        };
    }

    save = () => {
        let user = data.get("user");
        let rank = this.state.rank + 5;
        put(`players/${user.id}`, {ranking: rank})
        .then((player) => {
            data.set("config.user", Object.assign({}, data.get("config.user"), player, {setup_rank_set : true}));
            setTimeout(() => {
                window.location.pathname = "/";
            }, 10);
        })
        .catch(errorAlerter);
    }

    setRank = (ev) => {
        this.setState({rank: parseInt(ev.target.value)});
    }

    render() {
        return (
            <div className="FirstTimeSetup">
                <h3>{_("Welcome to Online-Go.com!")}</h3>
                <div>
                    <p>{_("To finish setting up your account, we need to set your rank appropriately to help you find good games. ")}</p>
                    <p><i>{_("Tip: If you are coming from another server, using your rank from the other server is a good place to start")}</i></p>
                </div>

                <h4>{_("Pick your starting rank if you know it, or select how long you've been playin go for")}</h4>
                <div className="play-range-selector">
                    <select onChange={this.setRank}>
                        <option selected={this.state.rank === -1} value={-1}>
                            {_("Select Rank")}
                        </option>

                        {durations.map((elt, idx) => (
                            <option selected={this.state.rank === idx} key={idx} value={idx}>
                                {longRankString(idx + 5)} : {elt.time}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="primary" disabled={this.state.rank < 0} onClick={this.save}>{_("Finish")} &gt;</button>
            </div>
        );
    }
}

