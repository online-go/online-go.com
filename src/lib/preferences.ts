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

import * as data from "data";
import {GoThemes} from "goban";
import {current_language} from "translate";

let defaults = {
    "ai-review-enabled": true,
    "always-disable-analysis": false,
    "asked-to-enable-desktop-notifications": false,
    "auto-advance-after-submit": true,
    "autoplay-delay": 10000,
    "board-labeling": 'automatic',
    "chat.show-all-global-channels": true,
    "chat.show-all-group-channels": true,
    "chat.show-all-tournament-channels": true,
    "chat.user-sort-order": "rank",
    "desktop-notifications": true,
    "dock-delay": 0, // seconds.
    "double-click-submit-correspondence": false,
    "double-click-submit-live": false,
    "dynamic-title": true,
    "function-keys-enabled": false,
    "game-list-threshold": 10,
    "goban-theme-black": null,
    "goban-theme-board": null,
    "goban-theme-white": null,
    "label-positioning": "all",
    "language": "auto",
    "move-tree-numbering": "move-number",
    "new-game-board-size": 19,
    "notification-timeout": 10,
    "notify-on-incident-report": true,
    "observed-games-page-size": 9,
    "observed-games-viewing": "live",
    "one-click-submit-correspondence": false,
    "one-click-submit-live": true,
    "profanity-filter": {"en": true},
    "puzzle.randomize.color": true,
    "puzzle.randomize.transform": true,
    "puzzle.zoom": true,
    "show-all-challenges": false,
    "show-move-numbers": true,
    "show-offline-friends": true,
    "hide-ranks": false,
    "show-tournament-indicator": true,
    "show-variation-move-numbers": false,

    "sound-enabled": true,
    "sound-voice-countdown-main" : false,
    "sound-voice-countdown": true,
    "sound-volume": 0.5,

    "sound.volume.master": 1.0,

    "sound.countdown.tick-tock.start": 30,
    "sound.countdown.ten-seconds.start": 10,
    "sound.countdown.five-seconds.start": 10,
    "sound.countdown.every-second.start": 10,
    "sound.countdown.byoyomi-direction": "auto",
    "sound.vibrate-on-stone-placement": true,

    "supporter.currency": "auto",
    "supporter.interval": "month",
    "tournaments-tab": "correspondence",
    "translation-dialog-dismissed": 0,
    "translation-dialog-never-show": false,
    "unicode-filter": false,
    "variations-in-chat-enabled": true,
};

defaults['profanity-filter'][current_language] = true;


for (let k in defaults) {
    data.setDefault(`preferences.${k}`, defaults[k]);
}

export type ValidPreference = keyof typeof defaults;

export function get(key: ValidPreference): any {
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

export function getSelectedThemes():{"board": string, "black": string, "white": string} {
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
