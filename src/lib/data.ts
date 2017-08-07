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

import {LocalData, deserialise_data, serialise_data} from "compatibility/LocalData";
import {TypedEventEmitter} from 'TypedEventEmitter';

let defaults: Partial<LocalData> = {};
let store: Partial<LocalData> = {};
let event_emitter = new TypedEventEmitter<LocalData>();
let last_id = 0;


export function set<K extends keyof LocalData>(key: K, value: LocalData[K] | undefined): LocalData[K] {
    if (value === undefined) {
        remove(key);
        return value;
    }

    store[key] = value;
    try {
        localStorage.setItem(`ogs.${key}`, (serialise_data[key] || JSON.stringify)(value));
    } catch (e) {
        console.error(e);
    }

    event_emitter.emit(key, value);
    return value;
}

export function setDefault<K extends keyof LocalData>(key: K, value: LocalData[K]): LocalData[K] {
    defaults[key] = value;
    if (!(key in store)) {
        event_emitter.emit(key, value);
    }
    return value;
}

export function remove<K extends keyof LocalData>(key: K): LocalData[K] {
    event_emitter.emit(key, defaults[key]);

    try {
        localStorage.removeItem(`ogs.${key}`);
    } catch (e) {
        console.error(e);
    }
    if (key in store) {
        let val = store[key];
        delete store[key];
        return val;
    }
}

export function removeAll(): void {
    let keys = [];
    for (let key in store) {
        keys.push(key);
    }
    for (let key of keys) {
        try {
            remove(key);
        } catch (e) {
            console.error(e);
        }
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

export function watch<K extends keyof LocalData>(key: K, cb: (data: LocalData[K]) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void {
    event_emitter.on(key, cb);

    let val = get(key);
    if (!dont_call_immediately && (val != undefined || call_on_undefined)) {
        cb(val);
    }
}

export function unwatch<K extends keyof LocalData>(key: K, cb: (data: LocalData[K]) => void): void {
    event_emitter.off(key, cb);
}

export function dump(key_prefix: string = "", strip_prefix?: boolean) {
    if (!key_prefix) {
        key_prefix = "";
    }
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
                store[key] = (deserialise_data[key] || JSON.parse)(item);
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


export default window["data"] = {
    set                 : set,
    get                 : get,
    setDefault          : setDefault,
    remove              : remove,
    removeAll           : removeAll,
    watch               : watch,
    unwatch             : unwatch,
    dump                : dump,
};
