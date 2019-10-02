/*
 * Copyright (C) 2012-2019  Online-Go.com
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

export {GoEngine, sfx, GoThemes, GoMath, MoveTree} from 'ogs-goban';

export class Goban extends OGSGoban {
    constructor(config, preloaded_data?) {
        super(config, preloaded_data);
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
        return window.location.pathname;
    }

    protected getCoordinateDisplaySystem():'A1'|'1-1' {
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
    }

    getShowMoveNumbers():boolean {
        return preferences.get("show-move-numbers");
    }

    getShowVariationMoveNumbers():boolean {
        return preferences.get("show-variation-move-numbers");
    }

    isAnalysisDisabled(perGameSettingAppliesToNonPlayers = false):boolean {
        // The player's preference setting to always disable analysis overrides the per-game setting for
        // their own games.
        if (preferences.get("always-disable-analysis") && this.isParticipatingPlayer()) {
            return true;
        }

        // If the user hasn't enabled the always-disable-analysis option (or they do not participate in this game),
        // we check the per-game setting.
        if (perGameSettingAppliesToNonPlayers) {
            // This is used for the SGF download which is disabled even for users that are not
            // participating in the game (or not signed in)
            return this.engine.config.original_disable_analysis;
        } else {
            return this.engine.config.disable_analysis;
        }
    }

    watchSelectedThemes(cb) {
        return watchSelectedThemes(cb);
    }

    getSelectedThemes() {
        return getSelectedThemes();
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


/* Theme setup */

import { GoThemes } from "ogs-goban";
import { GoTheme } from "ogs-goban";

import init_board_plain from "./goban-themes/board_plain";
import init_board_woods from "./goban-themes/board_woods";
import init_disc from "./goban-themes/disc";
import init_rendered from "./goban-themes/rendered_stones";

init_board_plain(GoThemes);
init_board_woods(GoThemes);
init_disc(GoThemes);
init_rendered(GoThemes);

function theme_sort(a, b) {
    return a.sort - b.sort;
}

for (let k in GoThemes) {
    GoThemes[k].sorted = Object.keys(GoThemes[k]).map((n) => {
        GoThemes[k][n].theme_name = n;
        return GoThemes[k][n];
    });
    GoThemes[k].sorted.sort(theme_sort);
}
