/*
 * Copyright (C) 2012-2021  Online-Go.com
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

import * as remote_storage from "remote_storage";
import { TypedEventEmitter } from 'TypedEventEmitter';
import { GroupList, ActiveTournamentList } from './types';

interface Events {
    [name:string]: any;
}

let defaults = {};
let store = {};
let event_emitter = new TypedEventEmitter<Events>();
let remote_persisting = false;
let to_be_persisted = {}; // not-yet confirmed-persisted key value pairs

// keys in this list will be persisted remotely when written by set()
const remote_persist_list = new Set([
    "theme"
]);

// (note - setWithoutEmit, which is effectively setWithoutEmitAndWithoutRemotePersist ;), does not do any remote persisting,
//         because the only use case for setWithoutEmit immediately goes and then sets them all again anyhow, in main.tsx.)

export function setWithoutEmit(key: string, value: any | undefined): any {
    if (value === undefined) {
        remove(key);
        return value;
    }

    store[key] = value;
    try {
        localStorage.setItem(`ogs.${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn(`Failed to save setting ogs.${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`);
    }

    return value;
}

export function set(key: string, value: any | undefined): any {
    _set(key, value, false); // external callers don't get to decide what is persisted
}

function _set(key: string, value: any | undefined, disable_remote_persist: boolean) {
    setWithoutEmit(key, value);
    event_emitter.emit(key, value);

    if (remote_persist_list.has(key) && !disable_remote_persist) {
        if (!remote_persisting) {
            // we're not already underway persisting something, so we have to first read the remote values, then update and write back the new...
            // ... taking into account that we might get asked to persist more values while this is happening...
            remote_persisting = true;
            to_be_persisted[key] = value;
            remote_storage.get("persisted-local-storage").then(
                (remote_values) => {
                    remote_values = remote_values || {};
                    for (const persist_item in to_be_persisted) {
                        remote_values[persist_item] = to_be_persisted[persist_item]; // overwriting the new values to be written into the current remote hash
                    }
                    remote_storage.set("persisted-local-storage", remote_values).then(
                        () => {
                            if (!remote_persisting) { // remote_persisting could be true if another set() came in while the remote_storage.set() was in flight... in which case we still have new values to write.
                                to_be_persisted = {};
                            }
                        },
                        (err) => { console.error("error persisting local data:", to_be_persisted, err); }
                    );
                    remote_persisting = false;
                    // note, we can end up with two remote_storage.set calls in parallel, if a new set() comes in while the above remote_storage.set is still in flight
                },
                (err) => { remote_persisting = false; console.error("error getting persisted local storage values while trying to write", to_be_persisted, err); }
            );
        } else {
            // in this case we are in the process of "remote_persisting", waiting for the remote_storage.get to come back, so we just add the new value to be saved
            to_be_persisted[key] = value;
        }
    }
    return value;
}

export function setDefault(key: string, value: any): any {
    defaults[key] = value;
    if (!(key in store)) {
        event_emitter.emit(key, value);
    }
    return value;
}

export function remove(key: string): any {
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

export function removePrefix(key_prefix: string): any {
    let hits = {};

    Object.keys(store).map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            hits[key] = key;
        }
    });

    for (let key in hits) {
        localStorage.removeItem(`ogs.${key}`);
        delete store[key];
        event_emitter.emit(key, defaults[key]);
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

export function get(key: "cached.groups", default_value?: GroupList): GroupList;
export function get(key: "cached.active_tournaments", default_value?: ActiveTournamentList): ActiveTournamentList;
export function get(key: string, default_value?: any): any | undefined;
export function get(key, default_value?): any | undefined {
    if (key in store) {
        return store[key];
    }
    if (key in defaults) {
        return defaults[key];
    }
    return default_value;
}

export function watch(key: "cached.groups", cb: (data: GroupList) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void;
export function watch(key: "cached.active_tournaments", cb: (data: ActiveTournamentList) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void;
export function watch(key: string, cb: (data: any) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void;
export function watch(key, cb, call_on_undefined?: boolean, dont_call_immediately?: boolean): void {
    event_emitter.on(key, cb);

    let val = get(key);
    if (!dont_call_immediately && (val != undefined || call_on_undefined)) {
        cb(val);
    }
}

export function unwatch(key: "cached.groups", cb: (data: GroupList) => void): void;
export function unwatch(key: "cached.active_tournaments", cb: (data: ActiveTournamentList) => void): void;
export function unwatch(key: string, cb: (data: any) => void): void;
export function unwatch(key, cb): void {
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

// initialize local data store from localStorage
try {
    for (let i = 0; i < localStorage.length; ++i) {
        let key = localStorage.key(i);
        if (key.indexOf("ogs.") === 0) {
            key = key.substr(4);
            try {
                let item = localStorage.getItem(`ogs.${key}`);
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

// update local data store from persisted values (which may have been modified by other devices)

try {
    remote_storage.get('persisted-local-storage')
    .then(
        (persisted) => {
            for (const key in persisted as {}) {
                _set(key, persisted[key], true /* don't try to remote persist this value we just read from remote! */);
            }
        },
        (err) => { console.error("Error retrieving persisted local storage settings:", err); }
    );
} catch (e) {
    console.error(e);
}

