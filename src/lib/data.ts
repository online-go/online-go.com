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

import {Player} from "data/Player";
import {Publisher} from "pubsub";

export interface LocalData {
    "user": Player;
    "config.user": any;
    "friends": Array<any>;
    "ad-override": boolean;
    "email-banner-dismissed": boolean;
    "theme": "dark" | "light";
    "announcements.cleared": {[announcement: string]: number};
    "chat.joined": {[channel: string]: boolean};
    "chat.active_channel": string;
    [name: string]: any;
}

let defaults: Partial<LocalData> = {};
let store: Partial<LocalData> = {};



let publisher = new Publisher<LocalData>();
export class Subscription<K extends keyof LocalData> extends publisher.Subscription<K> {
    protected new_subscriber(channel: K): void {
        let value = get(channel);
        if (value !== undefined) {
            this.callback(channel, value);
        }
    }
}



export function set<K extends keyof LocalData>(key: K, value: LocalData[K] | undefined): LocalData[K] {
    if (value === undefined) {
        remove(key);
        return value;
    }

    store[key] = value;
    try {
        localStorage.setItem(`ogs.${key}`, JSON.stringify(value));
    } catch (e) {
        console.error(e);
    }

    publisher.publish(key, value);
    return value;
}
export function setDefault<K extends keyof LocalData>(key: K, value: LocalData[K]): LocalData[K] {
    defaults[key] = value;
    if (!(key in store)) {
        publisher.publish(key, value);
    }
    return value;
}
export function remove<K extends keyof LocalData>(key: K): LocalData[K] {
    try {
        localStorage.removeItem(`ogs.${key}`);
    } catch (e) {
        console.error(e);
    }
    let val: LocalData[K] | undefined = get(key);
    delete store[key];
    publisher.publish(key, defaults[key]);
    return val;
}
export function removeAll(): void {
    let keys = [];
    for (let key in store) {
        keys.push(key);
    }
    for (let key of keys) {
        remove(key);
    }
}

export function get<K extends keyof LocalData>(key: K, default_value?: LocalData[K]): LocalData[K] | undefined {
    if (key in store) {
        return store[key];
    }
    if (key in defaults) {
        return defaults[key];
    }
    return default_value;
}

export function ensureDefaultAndGet<K extends keyof LocalData>(key: K): LocalData[K] | undefined {
    if (!(key in defaults)) {
        throw new Error(`Undefined default: ${key}`);
    }
    return get(key);
}

export function dump(key_prefix: string = "", strip_prefix?: boolean) {
    let ret = {};
    let data = Object.assign({}, defaults, store);
    let keys = Object.keys(data);

    keys.sort().map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            let k = strip_prefix ? key.substr(key_prefix.length) : key;
            ret[k] = {"union": data[key], value: store[key], "default": defaults[key]};
        }
    });
    console.table(ret);
}


try {
    for (let i = 0; i < localStorage.length; ++i) {
        let key = localStorage.key(i);
        if (key.indexOf("ogs.") === 0) {
            key = key.substr(4);
            try {
                let item = localStorage.getItem(`ogs.${key}`);
                if (item === "undefined") {
                    localStorage.removeItem(`ogs.${key}`);
                    continue;
                }
                store[key] = JSON.parse(item);
            } catch (e) {
                console.error(`Data storage system failed to load ${key}. Value was: `, typeof(localStorage.getItem(`ogs.${key}`)), localStorage.getItem(`ogs.${key}`));
                console.error(e);
                localStorage.removeItem(`ogs.${key}`);
            }
        }
    }
} catch (e) {
    console.error(e);
}
