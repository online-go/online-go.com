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
import {_} from "translate";
import {Link} from "react-router";
import * as data from "data";

interface SupporterGoalsProperties {
    alwaysShow?:boolean;
}

export class SupporterGoals extends React.Component<SupporterGoalsProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    //shouldComponentUpdate(nextProps, nextState) { }
    componentDidMount() { }
    componentWillUnmount() { }

    render() {
        if (data.get('user').supporter && !this.props.alwaysShow) {
            return null;
        }

        let goals = data.get('config').supporter_goals;
        if (!goals) {
            return null;
        }


        let adfree_done = goals.adfree * 80;
        let adfree_left = (1.0 - goals.adfree) * 80;
        let loc1_done = goals.loc1 * 10;
        let loc1_left = (1.0 - goals.loc1) * 10;
        let loc2_done = goals.loc2 * 10;
        let loc2_left = (1.0 - goals.loc2) * 10;

        return (
            <div id='SupporterGoalsContainer'>
                <div id='SupporterGoalText'>
                    <Link to='/user/supporter'>{_("We would like to get rid of all ads on the site, as well as add some additional servers in different parts of the world for better service. We need more supporters to do this, so chip in today for a better tomorrow!")} :)</Link>
                </div>

                <div id='SupporterGoals'>
                    <div className="progress">
                        <div className={`progress-bar ${goals.adfree >= 1 ? 'success' : 'primary'}`} style={{width: `${adfree_done}%`}}>Ad Free OGS!</div>
                        {goals.adfree < 1 && <div className={`progress-bar default`} style={{width: `${adfree_left}%`}}>&nbsp;</div>}
                        <div className={`progress-bar ${goals.loc1 >= 1 ? 'success' : 'primary'}`} style={{width: `${loc1_done}%`}}>{goals.loc1 > 0.5 ? _("Asia") : <span>&nbsp;</span>}</div>
                        {goals.loc1 < 1 && <div className={`progress-bar info`} style={{width: `${loc1_left}%`}}>{goals.loc1 <= 0.5 ? _("Asia") : <span>&nbsp;</span>}</div> }
                        <div className={`progress-bar ${goals.loc2 >= 1 ? 'success' : 'primary'}`} style={{width: `${loc2_done}%`}}>{goals.loc2 > 0.5 ? _("Europe") : <span>&nbsp;</span>}</div>
                        {goals.loc2 < 1 && <div className={`progress-bar info`} style={{width: `${loc2_left}%`}}>{goals.loc2 <= 0.5 ? _("Europe") :  <span>&nbsp;</span>}</div> }
                    </div>
                </div>
            </div>
        );
    }
}
