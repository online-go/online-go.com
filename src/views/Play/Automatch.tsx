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
import {AdUnit} from "AdUnit";
import {Card} from "material";
import {browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {post, get, del} from "requests";
import {uuid, errorAlerter, rulesText, dup} from "misc";
import data from "data";
import {FirstTimeSetup} from "FirstTimeSetup";
import {automatch_manager, AutomatchPreferences} from 'automatch_manager';

const default_preferences:AutomatchPreferences = {
    uuid: null,
    size_speed_options: [
        {
            speed: 'live',
            size: '19x19'
        }
    ],
    lower_rank_diff: 3,
    upper_rank_diff: 3,
    rules: {
        condition: 'no-preference',
        value: 'japanese',
    },
    time_control: {
        condition: 'no-preference',
        value: {
            system: 'fischer',
        }
    },
    handicap: {
        condition: 'no-preference',
        value: 'enabled',
    },
};

interface AutomatchProperties {
}

export class Automatch extends React.PureComponent<AutomatchProperties, any> {

    constructor(props) {
        super(props);
        this.state = {
            speed_options: {},
            preferences: Object.assign({}, dup(default_preferences), dup(data.get('automatch-preferences', {}))),
        };
        for (let opt of this.state.preferences.size_speed_options) {
            this.state.speed_options[`${opt.speed}-${opt.size}`] = true;
        }
        if (Object.keys(this.state.speed_options).length === 0) {
            this.state.speed_options[`blitz-9x9`] = true;
        }
    }

    componentDidMount() {{{
        automatch_manager.on('entry', this.onEntry);
    }}}
    componentWillUnmount() {{{
        automatch_manager.off('entry', this.onEntry);
    }}}
    onEntry = (entry) => {{{
        this.forceUpdate();
    }}}
    findMatch = () => {{{
        let preferences:AutomatchPreferences = dup(this.state.preferences);
        preferences.uuid = uuid();
        automatch_manager.findMatch(preferences);
        this.onEntry(preferences);
    }}}
    cancelActive() {{{
        console.log('tood');
    }}}

    getSpeedSizeActiveClass(speed, size) {
        return this.state.speed_options[`${speed}-${size}`] ? 'active' : '';
    }
    toggleSpeedSize(speed, size) {
        let opts = dup(this.state.speed_options);
        opts[`${speed}-${size}`] = !opts[`${speed}-${size}`];
        if (opts[`${speed}-${size}`]) {
            /* enabling either correspondence or blitz/live? disable the other class */
            if (speed === 'correspondence') {
                Object.keys(opts).map((key) => opts[key] = key.split('-')[0] === 'correspondence' ? opts[key] : false);
            } else {
                Object.keys(opts).map((key) => opts[key] = key.split('-')[0] === 'correspondence' ? false : opts[key]);
            }
        }
        /* Nothing selected after toggle? don't allow that*/
        if (Object.keys(opts).filter((key) => opts[key]).length === 0) {
            return;
        }

        let speed_options_array = Object.keys(opts).filter((key) => opts[key]).map((key) => {
            return {
                speed: key.split('-')[0],
                size: key.split('-')[1]
            };
        });

        this.setState({
            speed_options: opts,
            preferences: Object.assign({}, this.state.preferences, {
                size_speed_options: speed_options_array
            })
        });
    }

    render() {{{
        if (!data.get("user").setup_rank_set) {
            return <FirstTimeSetup/>;
        }

        let preferences = this.state.preferences;
        let rank_diff = Math.min(9, Math.max(preferences.lower_rank_diff, preferences.upper_rank_diff, 0));

        return (
            <div className="Automatch">
                {automatch_manager.active_live_automatcher
                    ? <div className='active'>
                        <div className='center'>
                            <button className='default' onClick={this.cancelActive} >{_("Cancel")}</button>
                        </div>
                      </div>
                    : <div className='settings'>
                        {['blitz', 'live', 'correspondence'].map((speed, idx) => (
                            <div className='row flex-stretch' key={idx}>
                                <div className='col-sm-3'>
                                    <b>{translateSpeed(speed)}</b>
                                </div>
                                <div className='col-sm-9'>
                                    <div className="btn-group">
                                        {['9x9', '13x13', '19x19'].map((size, idx) => (
                                            <button key={idx}
                                                className={this.getSpeedSizeActiveClass(speed, size)}
                                                onClick={() => this.toggleSpeedSize(speed, size)}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}


                        <button className='primary' onClick={this.findMatch} >{_("Find match")}</button>
                      </div>
                }
            </div>
        );
    }}}
}

function translateSpeed(speed) {
    switch (speed) {
        case 'blitz'          : return _("Blitz");
        case 'live'           : return _("Live");
        case 'correspondence' : return _("Correspondence");
    }
    return '[ERROR]';
}
