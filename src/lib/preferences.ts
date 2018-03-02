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

import * as data from "data";
import {GoThemes} from "goban";
import {current_language} from "translate";

let defaults = {
    "one-click-submit-live": true,
    "double-click-submit-live": false,
    "one-click-submit-correspondence": false,
    "double-click-submit-correspondence": false,
    "label-positioning": "all",
    "game-list-threshold": 10,
    "show-move-numbers": true,
    "show-variation-move-numbers": false,
    "auto-advance-after-submit": true,
    "notification-timeout": 10,
    "autoplay-delay": 10000,
    "desktop-notifications": true,
    "asked-to-enable-desktop-notifications": false,
    "always-disable-analysis": false,
    "show-offline-friends": true,
    "show-ads-on-game-page": true,

    "sound-enabled": true,
    "sound-volume": 0.5,
    "sound-voice-countdown": true,

    "goban-theme-board": null,
    "goban-theme-black": null,
    "goban-theme-white": null,

    "language": "auto",
    "profanity-filter": {"en": true},
    "chat.user-sort-order": "rank",
    "chat.show-all-global-channels": true,
    "chat.show-all-group-channels": true,
    "chat.show-all-tournament-channels": true,

    "observed-games-page-size": 9,
    "observed-games-viewing": "live",

    "new-game-board-size": 19,

    "tournaments-tab": "correspondence",
    "move-tree-numbering": "move-number",

    "puzzle.randomize.color": true,
    "puzzle.randomize.transform": true,
    "puzzle.zoom": true,

    "board-labeling": 'automatic',
};

defaults['profanity-filter'][current_language] = true;


for (let k in defaults) {
    data.setDefault(`preferences.${k}`, defaults[k]);
}



export function get(key: keyof typeof defaults): any {
    if (!(key in defaults)) {
        throw new Error(`Undefined default: ${key}`);
    }
    return data.get(`preferences.${key}`);
}
export function set(key: string, value: any): any {
    return data.set(`preferences.${key}`, value);
}
export function watch(key: string, cb: (d: any) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void {
    data.watch(`preferences.${key}`, cb, call_on_undefined, dont_call_immediately);
}
export function unwatch(key: string, cb: (d: any) => void): void {
    data.unwatch(`preferences.${key}`, cb);
}

export function dump(): void {
    data.dump("preferences.", true);
}

export function getSelectedThemes() {
    //let default_plain = $.browser.mobile || ($(window).width() * (window.devicePixelRatio || 1)) <= 768;
    let default_plain = ($(window).width() * (window.devicePixelRatio || 1)) <= 768;

    let board = get("goban-theme-board") || (default_plain ? "Plain" : "Kaya");
    let white = get("goban-theme-white") || (default_plain ? "Plain" : "Shell");
    let black = get("goban-theme-black") || (default_plain ? "Plain" : "Slate");

    if (!(board in GoThemes["board"])) { board = default_plain ? "Plain" : "Kaya"; }
    if (!(white in GoThemes["white"])) { white = default_plain ? "Plain" : "Shell"; }
    if (!(black in GoThemes["black"])) { black = default_plain ? "Plain" : "Slate"; }

    return {
        "board": board,
        "white": white,
        "black": black
    };
}

export function watchSelectedThemes(cb) {
    let dont_call_right_away = true;
    let call_cb = () => {
        if (dont_call_right_away) {
            return;
        }
        cb(getSelectedThemes());
    };

    watch("goban-theme-board", call_cb);
    watch("goban-theme-black", call_cb);
    dont_call_right_away = false;
    watch("goban-theme-white", call_cb);
    return {
        remove: () => {
            unwatch("goban-theme-board", call_cb);
            unwatch("goban-theme-black", call_cb);
            unwatch("goban-theme-white", call_cb);
        }
    };
}
