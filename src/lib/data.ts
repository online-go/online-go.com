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

let defaults = {};
let store = {};
let listeners = {};
let last_id = 0;

export class Listener {
    key: string;
    id: number;
    cb: (data: any, key?: string) => void;
    remove_callbacks: Array<() => void>;

    constructor(key: string, cb: (data: any, key?: string) => void) {
        this.key = key;
        this.cb = cb;
        this.id = ++last_id;
        this.remove_callbacks = [];
    }

    onRemove(fn: () => void): void {
        this.remove_callbacks.push(fn);
    }

    remove() {
        delete listeners[this.key][this.id];
        for (let cb of this.remove_callbacks) {
            try {
                cb();
            } catch (e) {
                console.error(e);
            }
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
    if (key in listeners) {
        for (let id in listeners[key]) {
            listeners[key][id].cb(value, key);
        }
    }
    return value;
}
export function setDefault(key: string, value: any): any {
    defaults[key] = value;
    if (!(key in store)) {
        if (key in listeners) {
            for (let id in listeners[key]) {
                listeners[key][id].cb(value, key);
            }
        }
    }
    return value;
}
export function remove(key: string): any {
    if (key in listeners) {
        for (let id in listeners[key]) {
            try {
                if (key in defaults) {
                    listeners[key][id].cb(defaults[key], key);
                } else {
                    listeners[key][id].cb(undefined, key);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
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
export function get(key: string, _default?: any): any {
    if (key in store) {
        return store[key];
    }
    if (key in defaults) {
        return defaults[key];
    }
    return _default;
}
export function ensureDefaultAndGet(key: string): any {
    if (!(key in defaults)) {
        throw new Error(`Undefined default: ${key}`);
    }
    return get(key);
}
export function watch(key: string, cb: (data: any, key?: string) => void, call_on_undefined?: boolean): Listener {
    let listener = new Listener(key, cb);
    if (!(key in listeners)) {
        listeners[key] = {};
    }
    listeners[key][listener.id] = listener;

    let val = get(key);
    if (val != undefined || call_on_undefined) {
        cb(val, key);
    }

    return listener;
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


export default window["data"] = {
    set                 : set,
    get                 : get,
    ensureDefaultAndGet : ensureDefaultAndGet,
    setDefault          : setDefault,
    remove              : remove,
    removeAll           : removeAll,
    watch               : watch,
    dump                : dump,
};
