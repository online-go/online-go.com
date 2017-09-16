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

import {Goban as OGSGoban} from 'ogs-goban';
import {deepEqual, dup, getRandomInt, getRelativeEventPosition} from "misc";
import {shortDurationString, isLiveGame} from "TimeControl";
import {get_clock_drift, get_network_latency, termination_socket} from 'sockets';
import {getSelectedThemes, watchSelectedThemes} from "preferences";
import {_, pgettext, interpolate, current_language} from "translate";
import * as preferences from "preferences";
import * as data from "data";
import * as player_cache from "player_cache";
import {RegisteredPlayer} from "data/Player";

export {GoEngine, sfx, GoThemes, GoMath} from 'ogs-goban';
export {MoveTree} from 'ogs-goban/MoveTree';

export class Goban extends OGSGoban {
    constructor(config, preloaded_data?) {
        super(config, preloaded_data);
        this.on('move-made', this.autoadvance);
    }

    defaultConfig() {
        return {
            server_socket : termination_socket,
            player_id: Math.max(0, (data.get("user") || {id: 0}).id),
        };
    }

    getClockDrift() {
        return get_clock_drift();
    }

    getNetworkLatency() {
        return get_network_latency();
    }

    getLocation():string {
        return window.location.pathname;
    }

    protected getShouldPlayVoiceCountdown():boolean {
        return preferences.get("sound-voice-countdown");
    }

    protected getCoordinateDisplaySystem():'A1'|'1-1' {{{
        switch (preferences.get('board-labeling')) {
            case 'A1':
                return 'A1';
            case '1-1':
                return '1-1';
            default: // auto
                switch (current_language) {
                    case 'ko':
                    case 'ja':
                    case 'zh-cn':
                        return '1-1';
                    default:
                        return 'A1';
                }
        }
    }}}

    getShowMoveNumbers():boolean {
        return preferences.get("show-move-numbers");
    }

    getShowVariationMoveNumbers():boolean {
        return preferences.get("show-variation-move-numbers");
    }


    watchSelectedThemes(cb) {
        return watchSelectedThemes(cb);
    }

    getSelectedThemes() {
        return getSelectedThemes();
    }

    autoadvance = () => {
        let user = data.get('user');

        if (user instanceof RegisteredPlayer && /^\/game\//.test(this.getLocation())) {
            /* if we just moved */
            if (this.engine.playerNotToMove() === user.id) {
                if (!isLiveGame(this.engine.time_control) && preferences.get("auto-advance-after-submit")) {
                    this.emit("advance-to-next-board");
                }
            }
        }
    }
}

OGSGoban.getMoveTreeNumbering = ():string => {
    return preferences.get("move-tree-numbering");
};
OGSGoban.getCDNReleaseBase = ():string => {
    return data.get('config.cdn_release');
};
OGSGoban.getSoundEnabled = ():boolean => {
    return preferences.get('sound-enabled') as boolean;
};
OGSGoban.getSoundVolume = ():number => {
    return preferences.get('sound-volume') as number;
};
