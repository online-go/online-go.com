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
import {Link} from "react-router";
import data from "data";
import * as moment from "moment";



export class TournamentIndicator extends React.PureComponent<{}, any> {
    update_interval = null;

    constructor(props) {
        super(props);
        this.state = {
            tournament: null
        };
    }
    componentWillMount() {
        data.watch("active-tournament", (tournament) => {
            this.setState({tournament: tournament});
            if (this.update_interval) {
                clearInterval(this.update_interval);
            }
            if (tournament) {
                this.update_interval = setInterval(this.forceUpdate.bind(this), 1000);
            }
        });
    }

    render() {
        if (this.state.tournament == null) {
            return null;
        }

        let t = (moment(this.state.tournament.expiration).toDate().getTime() - Date.now()) / 1000;
        if (t < 0) {
            setTimeout(() => {
                data.set("active-tournament", null);
            }, 1);
            return null;
        }

        let m = Math.floor(t / 60);
        let s: any = Math.floor(t - (m * 60));
        if (s < 10) {
            s = "0" + s;
        }

        return (
            <Link to={this.state.tournament.link} className="TournamentIndicator"
                title={this.state.tournament.text} >
                <i className="fa fa-trophy"/>
                <span className="time">{m}:{s}</span>
            </Link>
       );
    }
}
