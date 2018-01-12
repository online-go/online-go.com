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
import {Link} from "react-router-dom";
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

        let adfree_done = Math.min(100, goals.adfree * 100);
        let adfree_left = (1.0 - goals.adfree) * 100;
        let aprx_supporters_needed = Math.max(0, Math.round((1.0 - goals.adfree) * 960));

        return (
            <div id='SupporterGoalsContainer'>
                <div id='SupporterGoalText'>
                    <Link to='/user/supporter'>{_("By supporting OGS you keep us ad free for everyone and fuel our development efforts. If you see a site supporter, tell them thanks! If you'd like to help chip in and become one, click this link, and thanks in advance!")} :)</Link>
                </div>

                <div id='SupporterGoals'>
                    <div className="progress">
                        <div className={`progress-bar ${goals.adfree >= 1 ? 'success' : 'primary'}`} style={{width: `${adfree_done}%`}}>
                            {interpolate(_("Ad Free OGS! ({{percentage}}%)"), { 'percentage': (goals.adfree * 100.0).toFixed(1) })}
                        </div>
                        {goals.adfree < 1 && <div className={`progress-bar default`} style={{width: `${adfree_left}%`}}>&nbsp;</div>}
                    </div>
                </div>

                <div id='SupporterCountLeftText'>
                    { aprx_supporters_needed > 0 ?
                        <Link to='/user/supporter'>{
                            interpolate(_("Only ~{{supporters_needed}} more site supporters needed for our goal!"), {supporters_needed: aprx_supporters_needed})
                        }</Link>
                        :
                        <Link to='/user/supporter'>{
                            _("Thanks a ton to all of our site supporters that made this happen!")
                        }</Link>
                    }
                </div>

            </div>
        );
    }
}
