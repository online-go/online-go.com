/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {Modal, openModal} from "Modal";
import {dup} from "misc";
import * as data from "data";
import { AutomatchPreferencesBase, Size, Speed } from "src/lib/types";

interface Events {
}

interface AutomatchSettingsProperties {
}


type AutomatchPreferences = AutomatchPreferencesBase & { size_options: Size[] };

interface AutomatchSettingsState {
    tab: Speed;
    blitz_settings: AutomatchPreferences;
    live_settings: AutomatchPreferences;
    correspondence_settings: AutomatchPreferences;
}


const default_blitz: AutomatchPreferences = {
    upper_rank_diff: 3,
    lower_rank_diff: 3,
    size_options: ['19x19'],
    rules: {
        condition: 'no-preference',
        value: 'japanese',
    },
    time_control: {
        condition: 'no-preference',
        value: {
            'system': 'byoyomi',
        }
    },
    handicap: {
        condition: 'no-preference',
        value: 'disabled',
    },
};
const default_live: AutomatchPreferences = {
    upper_rank_diff: 3,
    lower_rank_diff: 3,
    size_options: ['19x19'],
    rules: {
        condition: 'no-preference',
        value: 'japanese',
    },
    time_control: {
        condition: 'no-preference',
        value: {
            'system': 'byoyomi',
        }
    },
    handicap: {
        condition: 'no-preference',
        value: 'enabled',
    },
};
const default_correspondence: AutomatchPreferences = {
    upper_rank_diff: 3,
    lower_rank_diff: 3,
    size_options: ['19x19'],
    rules: {
        condition: 'no-preference',
        value: 'japanese',
    },
    time_control: {
        condition: 'no-preference',
        value: {
            'system': 'fischer',
        }
    },
    handicap: {
        condition: 'no-preference',
        value: 'enabled',
    },
};

const ConditionSelect = (props) => (
    <div>
        <select {...props}>
            <option value='no-preference'>{_("No preference")}</option>
            <option value='preferred'>{_("Prefer")}</option>
            <option value='required'>{_("Require")}</option>
        </select>
    </div>
);

export function getAutomatchSettings(speed: 'blitz'|'live'|'correspondence') {
    switch (speed) {
        case 'blitz':
            return dup(data.get("automatch.blitz", default_blitz));
        case 'live':
            return dup(data.get("automatch.live", default_live));
        case 'correspondence':
            return dup(data.get("automatch.correspondence", default_correspondence));
    }
}

export class AutomatchSettings extends Modal<Events, AutomatchSettingsProperties, AutomatchSettingsState> {
    constructor(props) {
        super(props);
        this.state = {
            tab: data.get("automatch.last-tab", 'live'),
            blitz_settings: data.get("automatch.blitz", default_blitz),
            live_settings: data.get("automatch.live", default_live),
            correspondence_settings: data.get("automatch.correspondence", default_correspondence),
        };
    }

    setTab = (tab) => {
        data.set('automatch.last-tab', tab);
        this.setState({'tab': tab});
    };

    getSelectedSettings() {
        switch (this.state.tab) {
            case 'blitz':
                return dup(this.state.blitz_settings);
            case 'live':
                return dup(this.state.live_settings);
            case 'correspondence':
                return dup(this.state.correspondence_settings);
        }
        return null;
    }
    setSelectedSettings(settings) {
        settings = dup(settings);
        switch (this.state.tab) {
            case 'blitz':
                data.set("automatch.blitz", settings);
                this.setState({blitz_settings: settings});
                break;
            case 'live':
                data.set("automatch.live", settings);
                this.setState({live_settings: settings});
                break;
            case 'correspondence':
                data.set("automatch.correspondence", settings);
                this.setState({correspondence_settings: settings});
                break;
        }
    }
    setLowerRankDiff = (ev) => {
        const settings = this.getSelectedSettings();
        const diff = Math.max(0, Math.min(9, parseInt(ev.target.value)));
        settings.lower_rank_diff = diff;
        this.setSelectedSettings(settings);
    };
    setUpperRankDiff = (ev) => {
        const settings = this.getSelectedSettings();
        const diff = Math.max(0, Math.min(9, parseInt(ev.target.value)));
        settings.upper_rank_diff = diff;
        this.setSelectedSettings(settings);
    };
    setHandicapCondition = (ev) => {
        const settings = this.getSelectedSettings();
        settings.handicap.condition = ev.target.value;
        this.setSelectedSettings(settings);
    };
    setTimeControlCondition = (ev) => {
        const settings = this.getSelectedSettings();
        settings.time_control.condition = ev.target.value;
        this.setSelectedSettings(settings);
    };
    setRulesCondition = (ev) => {
        const settings = this.getSelectedSettings();
        settings.rules.condition = ev.target.value;
        this.setSelectedSettings(settings);
    };
    toggleSize(size) {
        const settings = this.getSelectedSettings();
        if (settings.size_options.indexOf(size) >= 0) {
            settings.size_options = settings.size_options.filter((x) => x !== size);
        } else {
            settings.size_options.push(size);
        }
        if (settings.size_options.length === 0) {
            settings.size_options.push('19x19');
        }
        this.setSelectedSettings(settings);
    }

    setHandicapValue = (ev) => {
        const settings = this.getSelectedSettings();
        settings.handicap.value = ev.target.value;
        this.setSelectedSettings(settings);
    };
    setRulesValue = (ev) => {
        const settings = this.getSelectedSettings();
        settings.rules.value = ev.target.value;
        this.setSelectedSettings(settings);
    };
    setTimeControlSystem = (ev) => {
        const settings = this.getSelectedSettings();
        settings.time_control.value.system = ev.target.value;
        this.setSelectedSettings(settings);
    };

    render() {
        const settings = this.getSelectedSettings();
        const tab = this.state.tab;

        const size_enabled = (size) => {
            return settings.size_options.indexOf(size) >= 0;
        };


        return (
            <div className="Modal AutomatchSettings" ref="modal">
                <div className="header">
                    <h2>{_("Automatch Settings")}</h2>
                </div>
                <div className="body">
                    <div className='btn-group'>
                        <button className={this.state.tab === 'blitz' ? 'primary active sm' : 'sm'} onClick={() => this.setTab("blitz")}>
                            {_("Blitz")}
                        </button>
                        <button className={this.state.tab === 'live' ? 'primary active sm' : 'sm'} onClick={() => this.setTab("live")}>
                            {_("Normal")}
                        </button>
                        <button className={this.state.tab === 'correspondence' ? 'primary active sm' : 'sm'} onClick={() => this.setTab("correspondence")}>
                            {_("Correspondence")}
                        </button>
                    </div>

                    <div className='automatch-settings'>
                        <table>
                            <tbody>
                                <tr>
                                    <th>{_("Opponent rank range")}</th>
                                    <td>
                                        <span style={{visibility: settings.lower_rank_diff ? 'visible' : 'hidden'}}>-</span>
                                        <input type='number' min={0} max={9} value={settings.lower_rank_diff} onChange={this.setLowerRankDiff} />
                                    &nbsp; &nbsp;
                                        <span style={{visibility: settings.upper_rank_diff ? 'visible' : 'hidden'}}>+</span>
                                        <input type='number' min={0} max={9} value={settings.upper_rank_diff} onChange={this.setUpperRankDiff} />
                                    </td>
                                </tr>
                                <tr>
                                    <th>{_("Handicap")}</th>
                                    <td>
                                        <ConditionSelect value={settings.handicap.condition} onChange={this.setHandicapCondition} />
                                        {settings.handicap.condition === 'no-preference'
                                        ? <i>{tab === 'blitz' ? _("Default is disabled") : _("Default is enabled")} </i>
                                        : <select value={settings.handicap.value} onChange={this.setHandicapValue} >
                                            <option value='enabled'>{_("Handicaps enabled")}</option>
                                            <option value='disabled'>{_("Handicaps disabled")}</option>
                                        </select>
                                        }
                                    </td>
                                </tr>

                                <tr>
                                    <th>{_("Time Control")}</th>
                                    <td>
                                        <ConditionSelect value={settings.time_control.condition} onChange={this.setTimeControlCondition} />
                                        {settings.time_control.condition === 'no-preference'
                                        ? <i>{tab === 'correspondence' ? _("Default is to use Fischer") : _("Default is to use Byo-Yomi")}</i>
                                        : <select value={settings.time_control.value.system} onChange={this.setTimeControlSystem} >
                                            <option value='byoyomi'>{_("Byo-Yomi")}</option>
                                            <option value='fischer'>{_("Fischer")}</option>
                                            <option value='canadian'>{_("Canadian")}</option>
                                        </select>
                                        }
                                    </td>
                                </tr>

                                <tr>
                                    <th>{_("Rules")}</th>
                                    <td>
                                        <ConditionSelect value={settings.rules.condition} onChange={this.setRulesCondition} />
                                        {settings.rules.condition === 'no-preference'
                                        ? <i>{_("Default is to use Japanese rules")}</i>
                                        : <select value={settings.rules.value} onChange={this.setRulesValue} >
                                            <option value='japanese'>{_("Japanese")}</option>
                                            <option value='chinese'>{_("Chinese")}</option>
                                            <option value='aga'>{_("AGA")}</option>
                                            <option value='korean'>{_("Korean")}</option>
                                            <option value='nz'>{_("New Zealand")}</option>
                                            <option value='ing'>{_("Ing")}</option>
                                        </select>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}


export function openAutomatchSettings() {
    return openModal(<AutomatchSettings fastDismiss={true} />);
}
