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

import data from "data";
import {Listener} from "data";
import {GoThemes} from "goban";

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

    "sound-enabled": true,
    "sound-volume": 0.5,
    "sound-voice-countdown": true,

    "goban-theme-board": null,
    "goban-theme-black": null,
    "goban-theme-white": null,

    "language": "auto",
    "profanity-filter": {"en": true, "locale": true},
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
};

for (let k in defaults) {
    data.setDefault(`preferences.${k}`, defaults[k]);
}



export function get(key: string): any {
    return data.ensureDefaultAndGet(`preferences.${key}`);
}
export function set(key: string, value: any): any {
    return data.set(`preferences.${key}`, value);
}
export function watch(key: string, cb: (d: any, key?: string) => void, call_on_undefined?: boolean): Listener {
    return data.watch(`preferences.${key}`, cb, call_on_undefined);
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

    let a = watch("goban-theme-board", call_cb);
    let b = watch("goban-theme-black", call_cb);
    dont_call_right_away = false;
    let c = watch("goban-theme-white", call_cb);
    return {
        remove: () => {
            a.remove();
            b.remove();
            c.remove();
        }
    };
}


export default window["preferences"] = {
    get: get,
    set: set,
    watch: watch,
    dump: dump,
};
