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

import {termination_socket} from "sockets";
import {EventEmitter} from "eventemitter3";
import {browserHistory} from 'react-router';
import data from "data";

export type Speed = 'blitz' | 'live' | 'correspondence';
export type Size = '9x9' | '13x13' | '19x19';
export type AutomatchCondition = 'required' | 'preferred' | 'no-preference';

export interface AutomatchPreferences {
    uuid: string;
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
};

class AutomatchEntry {
    uuid:string;

    constructor() {
    }
}


class AutomatchManager extends EventEmitter {
    active_live_automatcher:AutomatchEntry;
    active_correspondence_automatchers:Array<AutomatchEntry> = [];
    last_find_match_uuid:string;



    constructor() {
        super();
        termination_socket.on("connect", () => {
            this.clearState();
            termination_socket.send("automatch/list");
        });
        termination_socket.on('automatch/start', this.onAutomatchStart);
        termination_socket.on('automatch/entry', this.onAutomatchEntry);
        termination_socket.on('automatch/cancel', this.onAutomatchCancel);
    }

    private onAutomatchEntry = (entry:AutomatchPreferences) => {{{
        for (let opt of entry.size_speed_options) {
            if (opt.speed === 'correspondence') {
                this.active_correspondence_automatchers.push(entry);
            } else {
                this.active_live_automatcher = entry;
            }
        }

        this.emit('entry', entry);
    }}}
    private onAutomatchStart = (entry) => {{{
        this.emit('start', entry);

        if (entry.uuid) {
            this.remove(entry.uuid);
            browserHistory.push(`/game/view/${entry.game_id}`);
        }
    }}}
    private onAutomatchCancel = (entry) => {{{
        this.remove(entry.uuid);
        this.emit('cancel', entry);
    }}}
    private remove(uuid:string) {
        if (this.active_live_automatcher && this.active_live_automatcher.uuid === uuid) {
            this.active_live_automatcher = null;
        }
        for (let i = 0; i < this.active_correspondence_automatchers.length; ++i) {
            if (this.active_correspondence_automatchers[i].uuid === uuid) {
                this.active_correspondence_automatchers.splice(i, 1);
                break;
            }
        }
    }
    private clearState() {{{
        this.active_live_automatcher = null;
        this.active_correspondence_automatchers = [];
        this.last_find_match_uuid = null;
    }}}

    public findMatch(preferences:AutomatchPreferences) {{{
        this.last_find_match_uuid = preferences.uuid;
        console.log('Finding match: ', preferences);
        termination_socket.emit('automatch/find_match', preferences);
    }}}
    public cancel(uuid?:string) {{{
        this.remove(uuid);
        termination_socket.emit('automatch/cancel', uuid);
    }}}
}

export const automatch_manager = new AutomatchManager();
