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

import {Publisher} from "pubsub";

let defaults = {};
let store = {};



type LocalData = any;
let publisher = new Publisher<LocalData>();
export class Subscription<K extends keyof LocalData> extends publisher.Subscription<K> {
    protected new_subscriber(channel: K): void {
        let value = get(channel);
        if (value !== undefined) {
            this.callback(channel, value);
        }
    }
}



export function set(key: string, value: any): any {
    if (typeof(value) === "undefined") {
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
export function setDefault(key: string, value: any): any {
    defaults[key] = value;
    if (!(key in store)) {
        publisher.publish(key, value);
    }
    return value;
}
export function remove(key: string): any {
    try {
        localStorage.removeItem(`ogs.${key}`);
    } catch (e) {
        console.error(e);
    }
    if (key in store) {
        let val = store[key];
        delete store[key];
        publisher.publish(key, defaults[key]);
        return val;
    }
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

export function get(key: string, default_value?: any): any {
    if (key in store) {
        return store[key];
    }
    if (key in defaults) {
        return defaults[key];
    }
    return default_value;
}

export function dump(key_prefix?: string, strip_prefix?: boolean) {
    if (!key_prefix) {
        key_prefix = "";
    }
    let ret = {};

    let keys = Object.keys(store).concat(Object.keys(defaults));

    let last_key = null;
    keys.sort().map((key) => {
        if (last_key === key) {
            return;
        }
        last_key = key;
        if (key.indexOf(key_prefix) === 0) {
            let k = strip_prefix ? key.substr(key_prefix.length) : key;
            ret[k] = {"union": get(key), value: store[key], "default": defaults[key]};
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
                if (typeof(item) === "undefined") {
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
