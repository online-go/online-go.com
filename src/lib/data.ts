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

/* Usage:
 *
 * That data module is an interface that aids with storing local and remote
 * data. It is the underlying storage mechanism for the `preferences` system
 * which adds key name checking and ensures default values are set.
 *
 * The main methods are get, set, remove, setDefault, watch and unwatch
 *
 *   set(key, value, replication?)
 *       Sets the key value pair locally and optionally replicates the value to
 *       other devices used by the player. The replication parameter is
 *       described below.
 *
 *   remove(key, replication?)
 *       Removes the key value pair locally and optionally replicates the
 *       removal of the key to other devices used by the player. The
 *       replication parameter is described below.
 *
 *   setDefault(key, value)
 *       Sets a prioritized default value to be returned by get if no other
 *       value for the key is available, see get for more details on
 *       prioritization.
 *
 *   get(key, default_value?)
 *       This computes and returns the appropriate value for the given key.
 *       The value of a key can reside in several places. We check in order
 *       and return the first defined value we find.
 *
 *          If the value has been locally set (via set), that value is used.
 *          Else if the value has been set remotely, that value is used
 *          Else if the value has a default value set by setDefault, that value is used
 *          Else the default_value is returned, which may be undefined.
 *
 *   watch(key, cb: (value) => void, call_on_undefined?, dont_call_immediately?)
 *      When the value of a key (as determined by get(key) changes for any
 *      reason to some defined value, the callback is called with the new
 *      value. If you want the callback to be called even if the value is
 *      undefined, pass true for call_on_undefined. Normally, the callback
 *      is immediately called when you call watch to avoid having to duplicate
 *      a get and a watch statement, however if this behavior is not desired,
 *      pass true for the value of dont_call_immediately.
 *
 *   unwatch(key, cb: (value) => void)
 *      Removes a callback from being called when key is updated
 *
 *
 *   REPLICATION
 *
 *   The optional set and remove `replication` parameter can be set to one of
 *   the following values if replication to other devices used by the currently
 *   authenticated player is desired. (Note that if the user is not logged in,
 *   no replication will take place.)
 *
 *   values for replication:
 *
 *      Replication.NONE
 *          No replication is performed. This is the same as not passing this paramter.
 *
 *          When to use: When you don't want the value replicated to other devices
 *
 *
 *      Replication.LOCAL_OVERWRITES_REMOTE
 *          Replicate the value set/remove, however if the other device has already
 *          set the given value locally, use that value instead of the replicated value.
 *
 *          When to use: When you want to update an account wide default value, but
 *             not override any per-device defaults
 *
 *      Replication.REMOTE_OVERWRITES_LOCAL
 *          Replicate the value set/remove and overwrite the locally set values on
 *          other devices.
 *
 *          When to use: When you all devices and tabs to have the same value
 *
 *      Replication.REMOTE_ONLY
 *          Replicate the value set/remove but do not set/remove the local value
 *
 *          When to use: When you want to update the account wide default value, but
 *             not override any per-device defaults, including the current device
 *
 */


import { TypedEventEmitter } from 'TypedEventEmitter';
import { GroupList, ActiveTournamentList } from './types';

interface Events {
    [name:string]: any;
}

export enum Replication {
    NONE                    = 0x0, // No replication of this change
    LOCAL_OVERWRITES_REMOTE = 0x1, // Locally set data will overwrite remotely set data, but if not set will default to remotely set data
    REMOTE_OVERWRITES_LOCAL = 0x2, // Remotely set data will overwrite locally set data
    REMOTE_ONLY             = 0x4, // Remotely set data, but do not update our local value
}

let defaults = {};
let store = {};
let event_emitter = new TypedEventEmitter<Events>();


export function setWithoutEmit(key: string, value: any | undefined): any {
    if (value === undefined) {
        remove(key);
        return value;
    }

    store[key] = value;
    safeLocalStorageSet(`ogs.${key}`, JSON.stringify(value));

    return value;
}

export function set(key: string, value: any | undefined, replication?: Replication): any {
    if (replication !== Replication.REMOTE_ONLY) {
        setWithoutEmit(key, value);
    }
    if (replication && store["config.user"] && !store["config.user"].anonymous) {
        remote_set(key, value, replication);
    }
    emitForKey(key);
    return value;
}

function emitForKey(key: string): void {
    event_emitter.emit(key, get(key));
}

export function setDefault(key: string, value: any): any {
    defaults[key] = value;
    if (!(key in store) && !(key in remote_store)) {
        event_emitter.emit(key, value);
    }
    return value;
}

export function remove(key: string, replication?: Replication): void {
    if (replication && store["config.user"] && !store["config.user"].anonymous) {
        remote_remove(key, replication);
    }

    if (replication !== Replication.REMOTE_ONLY) {
        safeLocalStorageRemove(`ogs.${key}`);
        delete store[key];
    }
    emitForKey(key);
}

export function removePrefix(key_prefix: string): any {
    let hits = {};

    Object.keys(store).map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            hits[key] = key;
        }
    });

    for (let key in hits) {
        safeLocalStorageRemove(`ogs.${key}`);
        delete store[key];
        emitForKey(key);
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
    if (remote_get(key)) {
        return remote_get(key);
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
            ret[k] = {"union": data[key], value: store[key], "default": defaults[key], remote: remote_get(key)};
        }
    });
    console.table(ret);
}

export function getPrefix(key_prefix:string = "", strip_prefix?: boolean):{[key:string]: any} {
    if (!key_prefix) {
        key_prefix = "";
    }
    let ret = {};
    let data = Object.assign({}, defaults, store);
    let keys = Object.keys(data);

    keys.sort().map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            let k = strip_prefix ? key.substr(key_prefix.length) : key;
            ret[k] = data[key];
        }
    });
    return ret;
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`Failed to save setting ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`);
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn(`Failed to remove ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`);
    }
}


/* Load previously saved data from localStorage */

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



/**********************/
/*** REMOTE STORAGE ***/
/**********************/

/*
 * The remote storage subsystem works by maintaining a local copy of remote
 * data, storing the last timestamp of an updated value (as managed by the
 * server), and synchronizes data by sending updates to the server and
 * retrieving any updated data since the last timestamp we have. We also
 * maintain a write-ahead-log of any changes this client has made, and replay
 * those sets/removes when we re-establish a connection. Conflicts are resolved
 * by a "last-to-write" strategy.
 *
 * Every device will have a copy of all remote data stored. Lookups are fast,
 * but may be stale.
 *
 * Because some devices don't support localStorage (namely some browsers when
 * operating in private browsing mode, eg Safari), every time that device
 * connects to the server in a fresh browser instance, the entire remote
 * storage data will be downloaded. For other devices that have localStorage,
 * only updated data will be downloaded.
 */


import ITC from 'ITC';
import { termination_socket } from 'sockets';

type RemoteStorableValue = number | string | boolean | undefined | {[key:string]: RemoteStorableValue};

interface RemoteKV {
    key: string;
    value: RemoteStorableValue;
    replication: Replication;
    modified?: string;
}

let remote_store:{[key:string]: RemoteKV} = {};
let wal:{[key:string]: {key: string, value?: any, replication: Replication}} = {};
let wal_currently_processing:{[k:string]: boolean} = {};
let last_modified:string = "2000-01-01T00:00:00.000Z";
let loaded_user_id:number | null = null; // user id we've currently loaded data for

function remote_set(key:string, value:RemoteStorableValue, replication: Replication):void {
    let user = store["config.user"];
    if (!user || user.anonymous) {
        throw new Error('user is not authenticated');
    }

    if (remote_store[key]?.value === value && remote_store[key]?.replication === replication) {
        return;
    }

    remote_store[key] = { key, value, replication };
    _enqueue_set(user.id, key, value, replication);
    safeLocalStorageSet(`ogs-remote-storage-store.${user.id}.${key}`, JSON.stringify(remote_store[key]));
}

function remote_remove(key:string, replication: Replication):void {
    let user = store["config.user"];
    if (!user || user.anonymous) {
        throw new Error('user is not authenticated');
    }

    if (remote_get(key) === undefined) {
        return;
    }

    delete remote_store[key];
    _enqueue_remove(user.id, key, replication);
    safeLocalStorageRemove(`ogs-remote-storage-store.${user.id}.${key}`);
}

function remote_get(key:string):RemoteStorableValue {
    let user = store["config.user"];
    if (!user || user.anonymous) {
        return undefined;
    }

    return remote_store[key]?.value;
}


// Our write ahead log ensures that if we have a connection problem while we
// are writing a value to our remote storage, we retry when we re-establish
// our connection. This is a "last to write wins" system.

function _enqueue_set(user_id:number, key:string, value: RemoteStorableValue, replication: Replication):void {
    let entry = {key, value, replication};
    safeLocalStorageSet(`ogs-remote-storage-wal.${user_id}.${key}`, JSON.stringify(entry));
    wal[key] = entry;
    _process_write_ahead_log(user_id);
}

function _enqueue_remove(user_id:number, key:string, replication: Replication):void {
    let entry = {key, replication};
    safeLocalStorageSet(`ogs-remote-storage-wal.${user_id}.${key}`, JSON.stringify(entry));
    wal[key] = entry;
    _process_write_ahead_log(user_id);
}


function _process_write_ahead_log(user_id:number):void {
    for (let data_key in wal) {
        let kv = wal[data_key];

        if (wal_currently_processing[kv.key]) {
            // already writing this key. We'll check when we return from our
            // current write to see if it's changed since our write, and
            // re-write if necessary.
            continue;
        }

        wal_currently_processing[kv.key] = true;

        let cb = () => {
            delete wal_currently_processing[kv.key];
            if (wal[data_key].value !== kv.value || wal[data_key].replication !== kv.replication) {
                // if we updated the value since we wrote, re-write
                _process_write_ahead_log(user_id);
            } else {
                // welse we're all set, value has been written, remove from wal
                safeLocalStorageRemove(`ogs-remote-storage-wal.${user_id}.${kv.key}`);
                delete wal[kv.key];
                remote_sync();
            }
        };

        if ('value' in kv) {
            termination_socket.send('remote_storage/set', {key: kv.key, value: kv.value, replication: kv.replication}, cb);
        } else {
            termination_socket.send('remote_storage/remove', {key: kv.key, replication: kv.replication}, cb);
        }
    }
}


let currently_synchronizing = false;
let need_another_synchronization_call = false;

function remote_sync() {
    let user = store['config.user'];
    if (!user || user.anonymous) {
        return;
    }

    if (currently_synchronizing) {
        need_another_synchronization_call = true;
        return;
    }

    currently_synchronizing = true;
    need_another_synchronization_call = false;

    termination_socket.send('remote_storage/sync', last_modified, (ret) => {
        if (ret.error) {
            console.error(ret.error);
        } else {
            // success
        }
        currently_synchronizing = false;
        if (need_another_synchronization_call) {
            remote_sync();
        }
    });
}

// Whenever we connect to the server, process anything pending in our WAL and synchronize
termination_socket.on('connect', () => {
    let user = store['config.user'];
    if (!user || user.anonymous) {
        return;
    }

    // wait a tick for other connect handlers to fire, this includes our
    // authentication handler which we need to trigger before we do anything.
    setTimeout(() => {
        remote_sync();
    }, 1);
});

// When we get disconnected from the server, reset the state we used to track
// what actions were in flight
termination_socket.on('disconnect', () => {
    wal_currently_processing = {};
    currently_synchronizing = false;
    need_another_synchronization_call = false;
});

// we'll get this when a client updates a value. We'll then send a request to the
// server for any new updates since the last update we got.
ITC.register('remote_storage/sync_needed', () => {
    let user = store['config.user'];
    if (!user || user.anonymous) {
        console.error("User is not logged in but received remote_storage/sync_needed for some reason, ignoring");
        return;
    }

    remote_sync();
});

// After we've sent a synchronization request, we'll get these update messages
// for each key that's updated since the timestamp we sent
termination_socket.on('remote_storage/update', (row:RemoteKV) => {
    let user = store['config.user'];
    if (!user || user.anonymous) {
        console.error("User is not logged in but received remote_storage/update for some reason, ignoring");
        return;
    }

    let current_data_value = get(row.key);

    if (row.replication === Replication.REMOTE_OVERWRITES_LOCAL) {
        store[row.key] = row.value;
    }

    remote_store[row.key] = row;
    safeLocalStorageSet(`ogs-remote-storage-store.${user.id}.${row.key}`, JSON.stringify(row));

    if (last_modified < row.modified) {
        safeLocalStorageSet(`ogs-remote-storage-last-modified.${user.id}`, row.modified);
        last_modified = row.modified;
    }

    if (get(row.key) !== current_data_value) {
        // if our having updated locally changes what get
        // evaluates to, emit an update for that data key
        emitForKey(row.key);
    }
});


function load_from_local_storage_and_sync() {
    let user = store['config.user'];
    if (!user || user.anonymous) {
        return;
    }

    if (loaded_user_id === user.id) {
        return;
    }
    loaded_user_id = user.id;

    remote_store = {};
    /* if we're currently processing stuff, I don't think this is safe if we
     * were to change users in mid sync.. but I don't think we do that without
     * refreshing.  */
    wal = {};
    wal_currently_processing = {};
    last_modified = "2000-01-01T00:00:00.000Z";

    try {
        const store_prefix = `ogs-remote-storage-store.${user.id}.`;
        const wal_prefix = `ogs-remote-storage-wal.${user.id}.`;
        const last_modified_key = `ogs-remote-storage-last-modified.${user.id}`;

        for (let i = 0; i < localStorage.length; ++i) {
            let full_key = localStorage.key(i);

            if (full_key.indexOf(store_prefix) === 0) {
                let key = full_key.substr(store_prefix.length);
                try {
                    remote_store[key] = JSON.parse(localStorage.getItem(full_key)) as RemoteKV;
                } catch (e) {
                    console.error(`Error loading remote storage key ${full_key}, removing`, e);
                    localStorage.removeItem(full_key);
                }
            }
            if (full_key.indexOf(wal_prefix) === 0) {
                let key = full_key.substr(wal_prefix.length);
                try {
                    wal[key] = JSON.parse(localStorage.getItem(full_key));
                } catch (e) {
                    console.error(`Error loading WAL key ${full_key}, removing`, e);
                    localStorage.removeItem(full_key);
                }
            }
            if (full_key === last_modified_key) {
                last_modified = localStorage.getItem(full_key);
            }
        }
    } catch (e) {
        console.error(e);
    }

    _process_write_ahead_log(user.id);
    remote_sync();
}


load_from_local_storage_and_sync();
watch('config.user', load_from_local_storage_and_sync);
