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
import {_, pgettext, interpolate} from "translate";
import {termination_socket} from "sockets";
import {TypedEventEmitter} from "TypedEventEmitter";
import {sfx} from "goban";
import {browserHistory} from "ogsHistory";
import * as data from "data";
import * as preferences from "preferences";
import {Toast, toast} from 'toast';

export type Speed = 'blitz' | 'live' | 'correspondence';
export type Size = '9x9' | '13x13' | '19x19';
export type AutomatchCondition = 'required' | 'preferred' | 'no-preference';

interface Events {
    'start': any;
    'entry': any;
    'cancel': any;
}

export interface AutomatchPreferences {
    uuid: string;
    timestamp?: number;
    size_speed_options: Array<{speed:Speed, size:Size}>;
    lower_rank_diff: number;
    upper_rank_diff: number;
    rules: {
        condition: AutomatchCondition;
        value: 'japanese' | 'chinese' | 'aga' | 'korean' | 'nz' | 'ing';
    };
    time_control: {
        condition: AutomatchCondition;
        value: {
            system: 'byoyomi' | 'fischer' | 'simple' | 'canadian';
            initial_time?: number,
            time_increment?: number,
            max_time?: number,
            main_time?: number,
            period_time?: number,
            periods?: number,
            stones_per_period?: number,
            per_move?: number,
            pause_on_weekends?: boolean,
        }
    };
    handicap: {
        condition: AutomatchCondition;
        value: 'enabled' | 'disabled';
    };
}


class AutomatchToast extends React.PureComponent<{}, any> {
    timer:any;

    constructor(props) {
        super(props);
        this.state = {
            start: Date.now(),
            elapsed: '00:00',
        };
    }

    componentDidMount() {
        this.timer = setInterval(() => {
            let elapsed = Math.floor((Date.now() - this.state.start) / 1000);
            let seconds = elapsed % 60;
            let minutes = Math.floor((elapsed - seconds) / 60);
            let display = seconds < 10 ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`;
            this.setState({elapsed: display});
        }, 1000);
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        return (
            <div className='AutomatchToast'>
                {interpolate(pgettext("Automatch search message", "{{elapsed_time}} Finding a game..."), {"elapsed_time": this.state.elapsed})}
            </div>
        );
    }
}

class AutomatchManager extends TypedEventEmitter<Events> {
    active_live_automatcher:AutomatchPreferences;
    active_correspondence_automatchers:{[id:string]: AutomatchPreferences} = {};
    last_find_match_uuid:string;
    active_toast:Toast;



    constructor() {
        super();
        termination_socket.on("connect", () => {
            this.clearState();
            termination_socket.send("automatch/list");
        });
        termination_socket.on('disconnect', () => {
            this.clearState();
        });
        termination_socket.on('automatch/start', this.onAutomatchStart);
        termination_socket.on('automatch/entry', this.onAutomatchEntry);
        termination_socket.on('automatch/cancel', this.onAutomatchCancel);
    }

    private onAutomatchEntry = (entry:AutomatchPreferences) => {
        if (!entry.timestamp) {
            entry.timestamp = Date.now();
        }

        for (let opt of entry.size_speed_options) {
            if (opt.speed === 'correspondence') {
                this.active_correspondence_automatchers[entry.uuid] = entry;
            } else {
                this.active_live_automatcher = entry;
            }
        }

        this.emit('entry', entry);
    }
    private onAutomatchStart = (entry) => {
        this.remove(entry.uuid);

        if (entry.uuid === this.last_find_match_uuid) {
            browserHistory.push(`/game/view/${entry.game_id}`);

            let t = sfx.volume_override;
            sfx.volume_override = preferences.get("automatch-alert-volume");
            sfx.play(preferences.get("automatch-alert-sound"));
            sfx.volume_override = t;
        }

        this.emit('start', entry);
    }
    private onAutomatchCancel = (entry) => {
        if (!entry)  {
            if (this.active_live_automatcher) {
                entry = this.active_live_automatcher;
            } else {
                return;
            }
        }
        this.remove(entry.uuid);
        this.emit('cancel', entry);
    }
    private remove(uuid:string) {
        if (this.active_live_automatcher && this.active_live_automatcher.uuid === uuid) {
            this.active_live_automatcher = null;
        }

        if (uuid === this.last_find_match_uuid) {
            if (this.active_toast) {
                this.active_toast.close();
                this.active_toast = null;
            }
        }

        delete this.active_correspondence_automatchers[uuid];
    }
    private clearState() {
        this.active_live_automatcher = null;
        this.active_correspondence_automatchers = {};
        this.last_find_match_uuid = null;
        if (this.active_toast) {
            this.active_toast.close();
            this.active_toast = null;
        }
    }

    public findMatch(preferences:AutomatchPreferences) {
        termination_socket.emit('automatch/find_match', preferences);

        /* live game? track it, and pop up our searching toast */
        if (preferences.size_speed_options.filter((opt) => opt.speed === 'blitz' || opt.speed === 'live').length) {
            this.last_find_match_uuid = preferences.uuid;
            if (this.active_toast) {
                this.active_toast.close();
                this.active_toast = null;
            }
            this.active_toast = toast(<AutomatchToast />);
        }
    }
    public cancel(uuid?:string) {
        this.remove(uuid);
        termination_socket.emit('automatch/cancel', uuid);
    }
}

export const automatch_manager = new AutomatchManager();
