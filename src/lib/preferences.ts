/*
 * Copyright (C)  Online-Go.com
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

import * as data from "@/lib/data";
import { GobanSelectedThemes, Goban, LabelPosition, JGOFTimeControlSpeed, Size } from "goban";
import * as React from "react";
import { current_language } from "@/lib/translate";
import { DataSchema } from "./data_schema";
import { FollowedChannel } from "@/views/GoTV";
import { getWindowWidth } from "./device";

export const defaults = {
    "ai-review-enabled": true,
    "ai-review-use-score": true,
    "ai-summary-table-show": false,
    "always-disable-analysis": false,
    "asked-to-enable-desktop-notifications": false,
    "auto-advance-after-submit": true,
    "autoplay-delay": 10000,
    "play.tab": "automatch" as "automatch" | "custom",
    "automatch.size": "9x9" as Size,
    "automatch.speed": "rapid" as JGOFTimeControlSpeed,
    "automatch.game-clock": "flexible" as "exact" | "flexible" | "multiple",
    "automatch.handicaps": "standard" as "enabled" | "standard" | "disabled",
    "automatch.time-control": "fischer" as "fischer" | "byoyomi",
    "automatch.opponent": "human" as "human" | "bot",
    "automatch.bot": 0,
    "automatch.lower-rank-diff": 3,
    "automatch.upper-rank-diff": 3,
    "automatch.show-custom-games": false,
    "automatch.multiple-sizes": { "9x9": false, "13x13": false, "19x19": false },
    "automatch.multiple-speeds": {
        "blitz-fischer": false,
        "blitz-byoyomi": false,
        "rapid-fischer": false,
        "rapid-byoyomi": false,
        "live-fischer": false,
        "live-byoyomi": false,
    },
    "board-labeling": "automatic",
    "chat.show-all-global-channels": true,
    "chat.show-all-group-channels": true,
    "chat.show-all-tournament-channels": true,
    "chat.user-sort-order": "rank",
    "chat-mode": "main",
    "desktop-notifications": true,
    "desktop-notifications-require-interaction": false,
    "dynamic-title": true,
    "function-keys-enabled": false,
    "game-list-threshold": 10,
    "dock-delay": 0, // seconds.
    "double-click-submit-correspondence": false,
    "double-click-submit-live": false,
    "last-move-opacity": 1.0,
    "variation-stone-opacity": 0.6,
    "variation-move-count": 10,
    "visual-undo-request-indicator": true,
    "stone-font-scale": 1.0,
    "goban-theme-black": null as null | string,
    "goban-theme-board": null as null | string,
    "goban-theme-white": null as null | string,
    //"goban-theme-black_stone_url": null as null | string,
    //"goban-theme-white_stone_url": null as null | string,
    "goban-theme-removal-graphic": "square" as "square" | "x",
    "goban-theme-removal-scale": 0.9,
    "goban-theme-custom-board-background": "#DCB35C",
    "goban-theme-custom-board-url": "",
    "goban-theme-custom-board-line": "#000000",
    "goban-theme-custom-black-stone-color": "#000000",
    "goban-theme-custom-black-url": "",
    "goban-theme-custom-white-stone-color": "#ffffff",
    "goban-theme-custom-white-url": "",
    "hide-ranks": false,
    "label-positioning": "all" as LabelPosition,
    "label-positioning-puzzles": "all" as LabelPosition,
    language: "auto",
    "move-tree-numbering": "move-number" as "none" | "move-coordinates" | "move-number",
    "new-game-board-size": 19,
    "notification-timeout": 10,
    "notify-on-incident-report": true,
    "hide-incident-reports": false,
    "hide-claimed-reports": false,
    "show-cm-reports": false,
    "observed-games-page-size": 9,
    "observed-games-viewing": "live",
    "observed-games-filter": {},
    "observed-games-force-list": false,
    "one-click-submit-correspondence": false,
    "one-click-submit-live": true,
    "profanity-filter": { en: true } as { [cc: string]: true },
    "puzzle.randomize.color": true,
    "puzzle.randomize.transform": true,
    "puzzle.zoom": true,
    "rating-graph-always-use": false,
    "rating-graph-plot-by-games": false,
    "show-all-challenges": false,
    "show-unranked-challenges": true,
    "show-ranked-challenges": true,
    "show-19x19-challenges": true,
    "show-13x13-challenges": true,
    "show-9x9-challenges": true,
    "show-other-boardsize-challenges": true,
    "show-rengo-challenges": true,
    "show-handicap-challenges": true,
    "show-move-numbers": true,
    "show-offline-friends": true,
    "show-ratings-in-rating-grid": false,
    "show-seek-graph": false,

    "show-tournament-indicator": true, // implicitly on desktop
    "show-tournament-indicator-on-mobile": false,
    "show-variation-move-numbers": true,
    "show-slow-internet-warning": true,

    "sound-voice-countdown-main": false,
    "sound-voice-countdown": true,

    "sound.volume.master": 1.0,

    "sound.countdown.tick-tock.start": 0,
    "sound.countdown.ten-seconds.start": 10,
    "sound.countdown.five-seconds.start": 10,
    "sound.countdown.every-second.start": 10,
    "sound.countdown.byoyomi-direction": "auto",
    "sound.vibrate-on-stone-placement": true,
    "sound.positional-stone-placement-effect": true,

    "supporter.currency": "auto",
    "supporter.interval": "month",
    "tournaments-tab": "schedule" as
        | "my-tournaments"
        | "schedule"
        | "live"
        | "archive"
        | "correspondence",
    "tournaments-show-all": false,
    "translation-dialog-dismissed": 0,
    "translation-dialog-never-show": false,
    "unicode-filter": false,
    "variations-in-chat-enabled": true,
    "start-in-zen-mode": false,
    "scroll-to-navigate": false,
    "show-empty-chat-notification": true,
    "chat-subscribe-group-chat-unread": true,
    "chat-subscribe-group-mentions": true,
    "chat-subscribe-tournament-chat-unread": true,
    "chat-subscribe-tournament-mentions": true,

    "mute-stream-announcements": false,
    "mute-event-announcements": false,

    "moderator.join-games-anonymously": true,
    "moderator.hide-flags": false,
    "moderator.hide-profile-information": false, // hide extra moderator information
    "moderator.report-quota": 10,
    "moderator.report-settings": {} as {
        [category: string]: {
            priority: number;
            visible: boolean;
        };
    },
    "moderator.report-sort-order": "oldest-first" as "oldest-first" | "newest-first",
    "moderator.hide-player-card-mod-controls": false,

    "table-color-default-on": false,

    "game-history-size-filter": "all",
    "game-history-ranked-filter": "all",

    "help-system-enabled": true,

    "sgf.sort-order": "date_added",
    "sgf.sort-descending": true,

    "analysis.pencil-color": "#004cff",
    "analysis.score-color": "#3ACC2B",

    "gotv.expand-chat-pane": false,
    "gotv.show-gotv-indicator": true,
    "gotv.auto-select-top-stream": true,
    "gotv.allow-mature-streams": false,
    "gotv.selected-languages": [""],
    "gotv.allow-notifications": true,
    "gotv.user-access-token": "",
    "gotv.followed-channels": [] as FollowedChannel[],
    "gotv.notified-streams": [] as { streamId: string; timestamp: number }[],

    "user-history.show-mod-log": false,
    "user-history.warnings-only": false,
};

defaults["profanity-filter"][current_language] = true;

for (const k in defaults) {
    data.setDefault(`preferences.${k as ValidPreference}`, (defaults as any)[k]);
}

type PreferencesType = typeof defaults;
export type ValidPreference = keyof typeof defaults;

export function get<KeyT extends ValidPreference>(key: KeyT): PreferencesType[KeyT] {
    if (!(key in defaults)) {
        if ((key as string) === "sound-volume") {
            console.error(
                "You have an extension installed that is not using the newer sound system, volume will not be controllable",
            );
            // This should never happen according to the type system, so we have
            // to type it as any in order to suppress an error.
            return 1.0 as any;
        }

        throw new Error(`Undefined default: ${key}`);
    }
    // I can't figure out why TypeScript doesn't like this, but I think it's better
    // to define the type in terms of Preferences instead of DataSchema.
    return data.get(`preferences.${key}`) as any;
}
export function set<KeyT extends ValidPreference>(
    key: KeyT,
    value: PreferencesType[KeyT],
    replication?: data.Replication,
): DataSchema[`preferences.${KeyT}`] {
    return data.set(
        `preferences.${key}`,
        value as any,
        replication,
    ) as DataSchema[`preferences.${KeyT}`];
}
export function setWithoutEmit<KeyT extends ValidPreference>(
    key: KeyT,
    value: PreferencesType[KeyT],
): DataSchema[`preferences.${KeyT}`] {
    return data.setWithoutEmit(
        `preferences.${key}`,
        value as any,
    ) as DataSchema[`preferences.${KeyT}`];
}
export function watch<KeyT extends ValidPreference>(
    key: KeyT,
    cb: (d: PreferencesType[KeyT]) => void,
    call_on_undefined?: boolean,
    dont_call_immediately?: boolean,
): void {
    data.watch(`preferences.${key}`, cb as any, call_on_undefined, dont_call_immediately);
}
export function unwatch<KeyT extends ValidPreference>(
    key: KeyT,
    cb: (d: PreferencesType[KeyT]) => void,
): void {
    data.unwatch(`preferences.${key}`, cb as any);
}

export function dump(): void {
    data.dump("preferences.", true);
}

export function getSelectedThemes(): GobanSelectedThemes {
    let default_plain = getWindowWidth() * (window.devicePixelRatio || 1) <= 768;
    if (data.get("user").anonymous || data.get("user").id > 1618000) {
        default_plain = true;
    }

    let board = get("goban-theme-board") || (default_plain ? "Plain" : "Kaya");
    //let white = get("goban-theme-white") || (default_plain ? "Plain" : "Plain");
    //let black = get("goban-theme-black") || (default_plain ? "Plain" : "Plain");
    let white = get("goban-theme-white") || (default_plain ? "Plain" : "Shell");
    let black = get("goban-theme-black") || (default_plain ? "Plain" : "Slate");
    const removal_graphic = get("goban-theme-removal-graphic");
    const removal_scale = get("goban-theme-removal-scale");

    if (!(board in Goban.THEMES["board"])) {
        board = default_plain ? "Plain" : "Kaya";
    }
    if (!(white in Goban.THEMES["white"])) {
        //white = default_plain ? "Plain" : "Plain";
        white = default_plain ? "Plain" : "Shell";
    }
    if (!(black in Goban.THEMES["black"])) {
        console.log("Theme ", black, "didn't exist, so resetting");
        //black = default_plain ? "Plain" : "Plain";
        black = default_plain ? "Plain" : "Slate";
    }

    return {
        board: board,
        white: white,
        black: black,
        "removal-graphic": removal_graphic as any,
        "removal-scale": removal_scale,
    };
}

export function watchSelectedThemes(cb: (themes: GobanSelectedThemes) => void) {
    let dont_call_right_away = true;
    const call_cb = () => {
        if (dont_call_right_away) {
            return;
        }

        cb(getSelectedThemes());
    };

    dont_call_right_away = false;
    const keys: (keyof PreferencesType)[] = [
        "goban-theme-board",
        "goban-theme-black",
        "goban-theme-white",
        "goban-theme-removal-graphic",
        "goban-theme-removal-scale",
        "goban-theme-custom-board-background",
        "goban-theme-custom-board-url",
        "goban-theme-custom-board-line",
        "goban-theme-custom-black-stone-color",
        "goban-theme-custom-black-url",
        "goban-theme-custom-white-stone-color",
        "goban-theme-custom-white-url",
    ];

    for (const key of keys) {
        watch(key, call_cb);
    }

    return {
        remove: () => {
            for (const key of keys) {
                unwatch(key, call_cb);
            }
        },
    };
}

/**
 * A custom React hook that returns a state variable and a function that can be
 * used to set both the state and the preference at the same time.
 *
 * @param key a preference (as one would use in `preferences.get(key)`)
 */
export function usePreference<KeyT extends ValidPreference>(
    key: KeyT,
): [PreferencesType[KeyT], (v: PreferencesType[KeyT]) => void] {
    const [value, stateSetter] = React.useState(get(key));

    const setStateAndPreference = (v: PreferencesType[KeyT]) => {
        stateSetter(v);
        set(key, v);
    };

    React.useEffect(() => {
        const cb = (v: PreferencesType[KeyT]) => {
            stateSetter(v);
        };
        watch(key, cb);
        return () => {
            unwatch(key, cb);
        };
    }, [key]);

    return [value, setStateAndPreference];
}

function migrate() {
    function migrate_key(from: string, to: keyof PreferencesType) {
        try {
            if (data.get(from as keyof DataSchema, null) !== null) {
                set(to, data.get(from as any) || "");
                data.remove(from as any);
            }
        } catch (e) {
            console.log(e);
        }
    }

    // Migrate old goban theme preferences to a consistent place
    // Introduced 2024-08-06, safe for removal 2025-03-01
    migrate_key("custom.black", "goban-theme-custom-black-stone-color");
    migrate_key("custom.white", "goban-theme-custom-white-stone-color");
    migrate_key("custom.board", "goban-theme-custom-board-background");
    migrate_key("custom.line", "goban-theme-custom-board-line");
    migrate_key("custom.url", "goban-theme-custom-board-url");
    migrate_key("custom.black_stone_url", "goban-theme-custom-black-url");
    migrate_key("custom.white_stone_url", "goban-theme-custom-white-url");
    migrate_key("preferences.goban-theme-black_stone_url", "goban-theme-custom-black-url");
    migrate_key("preferences.goban-theme-white_stone_url", "goban-theme-custom-white-url");
}

try {
    migrate();
} catch (e) {
    console.error(e);
}
