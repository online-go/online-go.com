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
import {getLocation, setLocation} from "location";
import {get_clock_drift, get_network_latency, termination_socket} from 'sockets';
import {getSelectedThemes, watchSelectedThemes} from "preferences";
import {_, pgettext, interpolate} from "translate";
import preferences from "preferences";
import data from "data";
import player_cache from "player_cache";


export {GoEngine, sfx, GoThemes, GoMath} from 'ogs-goban';

export class Goban extends OGSGoban {
    constructor(config, preloaded_data?) {
        super(config, preloaded_data);
        this.on('move-made', this.autoadvance);
    }

    defaultConfig() {
        return {
            server_socket : termination_socket,
            player_id     : (data.get("user").anonymous ? 0 : data.get("user").id),
        };
    }

    getClockDrift() {
        return get_clock_drift();
    }

    getNetworkLatency() {
        return get_network_latency();
    }

    getLocation():string {
        return getLocation();
    }

    protected getShouldPlayVoiceCountdown():boolean {
        return preferences.get("sound-voice-countdown");
    }

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

        if (!user.anonymous && /^\/game\//.test(this.getLocation())) {
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
