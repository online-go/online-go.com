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
 *          No replication is performed. This is the same as not passing this parameter.
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

import { TypedEventEmitter } from "TypedEventEmitter";
import { DataSchema } from "data_schema";
import { protocol } from "goban";

interface DataEvents {
    remote_data_sync_complete: never;
}

export const events = new TypedEventEmitter<DataEvents>();

export enum Replication {
    NONE = 0x0, // No replication of this change
    LOCAL_OVERWRITES_REMOTE = 0x1, // Locally set data will overwrite remotely set data, but if not set will default to remotely set data
    REMOTE_OVERWRITES_LOCAL = 0x2, // Remotely set data will overwrite locally set data
    REMOTE_ONLY = 0x4, // Remotely set data, but do not update our local value
}

const defaults: Partial<DataSchema> = {};
const store: Partial<DataSchema> = {};

const event_emitter = new TypedEventEmitter<DataSchema>();

//  Note that as well as "without emit", this is "without remote storage" as well.
// (you cant set-remote-storage-without-emit)
export function setWithoutEmit<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    value: DataSchema[KeyT] | undefined,
): DataSchema[KeyT] | undefined {
    if (value === undefined) {
        remove(key);
        return value;
    }

    store[key] = value;
    safeLocalStorageSet(`ogs.${key}`, JSON.stringify(value));

    return value;
}

export function set<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    value: DataSchema[KeyT] | undefined,
    replication?: Replication,
): typeof value {
    if (replication !== Replication.REMOTE_ONLY) {
        setWithoutEmit(key, value);
    }
    if (replication && store["config.user"] && !store["config.user"].anonymous) {
        remote_set(key, value, replication);
    }
    emitForKey(key);
    return value;
}

function emitForKey<KeyT extends Extract<keyof DataSchema, string>>(key: KeyT): void {
    event_emitter.emit(key, get(key));
}

export function setDefault<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    value: DataSchema[KeyT],
): DataSchema[KeyT] {
    defaults[key] = value;
    if (!(key in store) && !(key in remote_store)) {
        event_emitter.emit(key, value);
    }
    return value;
}

export function remove<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    replication?: Replication,
): void {
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
    const hits: Partial<DataSchema> = {};

    Object.keys(store).map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            hits[key as keyof DataSchema] = key;
        }
    });

    for (const key in hits) {
        safeLocalStorageRemove(`ogs.${key}`);
        delete store[key as keyof DataSchema];
        emitForKey(key as keyof DataSchema);
    }
}

export function removeAll(): void {
    const keys: (keyof DataSchema)[] = [];
    for (const key in store) {
        keys.push(key as keyof DataSchema);
    }
    for (const key of keys) {
        try {
            remove(key);
        } catch (e) {
            console.error(e);
        }
    }
}

export function get(key: "user"): DataSchema["user"];
export function get<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
): DataSchema[KeyT] | undefined;
export function get<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    default_value: DataSchema[KeyT],
): DataSchema[KeyT];
export function get<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT | "user",
    default_value?: undefined | DataSchema[KeyT],
): DataSchema[KeyT] | DataSchema["user"] | undefined {
    if (key in store) {
        return store[key] as DataSchema[KeyT];
    }
    if (remote_get(key)) {
        return remote_get(key) as DataSchema[KeyT];
    }
    if (key in defaults) {
        return defaults[key] as DataSchema[KeyT];
    }
    return default_value;
}

export function watch<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    cb: (data: DataSchema[KeyT] | undefined) => void,
    call_on_undefined?: boolean,
    dont_call_immediately?: boolean,
): void {
    event_emitter.on(key, cb);

    const val = get(key);

    // The != can possibly be changed to !==, but I don't want to touch it
    // without further investigation.
    // eslint-disable-next-line eqeqeq
    if (!dont_call_immediately && (val != undefined || call_on_undefined)) {
        cb(val);
    }
}

export function unwatch<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    cb: (data: DataSchema[KeyT] | undefined) => void,
): void {
    event_emitter.off(key, cb);
}

export function dump(key_prefix: string = "", strip_prefix?: boolean) {
    if (!key_prefix) {
        key_prefix = "";
    }
    const ret: any = {};
    const remote_values: any = {};
    for (const k in remote_store) {
        remote_values[k] = remote_store[k as keyof DataSchema]?.value;
    }
    const data = Object.assign({}, defaults, remote_values, store);
    const keys = Object.keys(data);

    keys.sort().map((key: string) => {
        if (key.indexOf(key_prefix) === 0) {
            const k = strip_prefix ? key.substr(key_prefix.length) : key;
            ret[k] = {
                union: data[key],
                value: store[key as keyof DataSchema],
                default: defaults[key as keyof DataSchema],
                remote: remote_get(key as keyof DataSchema),
            };
        }
    });
    console.table(ret);
}

export function getPrefix(key_prefix: string = "", strip_prefix?: boolean): { [key: string]: any } {
    if (!key_prefix) {
        key_prefix = "";
    }
    const ret: any = {};
    const remote_values: any = {};
    for (const k in remote_store) {
        remote_values[k] = remote_store[k as keyof DataSchema]?.value;
    }
    const data = Object.assign({}, defaults, remote_values, store);
    const keys = Object.keys(data);

    keys.sort().map((key) => {
        if (key.indexOf(key_prefix) === 0) {
            const k = strip_prefix ? key.substr(key_prefix.length) : key;
            ret[k] = data[key];
        }
    });
    return ret;
}

function safeLocalStorageSet(key: string, value: any) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(
            `Failed to save setting ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`,
        );
    }
}

function safeLocalStorageRemove(key: string) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn(
            `Failed to remove ${key}, LocalStorage is probably disabled. If you are using Safari, the most likely cause of this is being in Private Browsing Mode.`,
        );
    }
}

/* Load previously saved data from localStorage */
try {
    for (let i = 0; i < localStorage.length; ++i) {
        let key = localStorage.key(i);
        if (key?.indexOf("ogs.") === 0) {
            key = key.substr(4);
            try {
                const item = localStorage.getItem(`ogs.${key}`);
                if (item) {
                    store[key as keyof DataSchema] = JSON.parse(item);
                }
            } catch (e) {
                console.error(
                    `Data storage system failed to load ${key}. Value was: `,
                    typeof localStorage.getItem(`ogs.${key}`),
                    localStorage.getItem(`ogs.${key}`),
                );
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
 * by a "last-to-write" strategy. The order of updates for different keys is
 * not guaranteed, however if the same key is updated multiple times, the last
 * update will win.
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

import ITC from "ITC";
import { socket } from "sockets";

type RemoteStorableValue =
    | number
    | string
    | boolean
    | undefined
    | { [key: string]: RemoteStorableValue };

interface RemoteKV {
    key: string;
    value: RemoteStorableValue;
    replication: Replication;
    modified?: string;
}

let remote_store: { [key in keyof DataSchema]?: RemoteKV } = {};
let wal: { [key: string]: { key: string; value?: any; replication: Replication } } = {};
let wal_currently_processing: { [k: string]: boolean } = {};
let last_modified = "2000-01-01T00:00:00.000Z";
let loaded_user_id: number | null = null; // user id we've currently loaded data for

function remote_set(
    key: keyof DataSchema,
    value: RemoteStorableValue,
    replication: Replication,
): void {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        throw new Error("user is not authenticated");
    }

    if (remote_store[key]?.value === value && remote_store[key]?.replication === replication) {
        return;
    }

    remote_store[key] = { key, value, replication };
    _enqueue_set(user.id, key, value, replication);
    safeLocalStorageSet(
        `ogs-remote-storage-store.${user.id}.${key}`,
        JSON.stringify(remote_store[key]),
    );
}

function remote_remove(key: keyof DataSchema, replication: Replication): void {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        throw new Error("user is not authenticated");
    }

    if (remote_get(key) === undefined) {
        return;
    }

    delete remote_store[key];
    _enqueue_remove(user.id, key, replication);
    safeLocalStorageRemove(`ogs-remote-storage-store.${user.id}.${key}`);
}

function remote_get(key: keyof DataSchema): RemoteStorableValue {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        return undefined;
    }

    return remote_store[key]?.value;
}

// Our write ahead log ensures that if we have a connection problem while we
// are writing a value to our remote storage, we retry when we re-establish
// our connection. This is a "last to write wins" system.

function _enqueue_set(
    user_id: number,
    key: string,
    value: RemoteStorableValue,
    replication: Replication,
): void {
    const entry = { key, value, replication };
    safeLocalStorageSet(`ogs-remote-storage-wal.${user_id}.${key}`, JSON.stringify(entry));
    wal[key] = entry;
    _process_write_ahead_log(user_id);
}

function _enqueue_remove(user_id: number, key: string, replication: Replication): void {
    const entry = { key, replication };
    safeLocalStorageSet(`ogs-remote-storage-wal.${user_id}.${key}`, JSON.stringify(entry));
    wal[key] = entry;
    _process_write_ahead_log(user_id);
}

function _process_write_ahead_log(user_id: number): void {
    for (const data_key in wal) {
        const kv = wal[data_key];

        if (wal_currently_processing[kv.key]) {
            // already writing this key. We'll check when we return from our
            // current write to see if it's changed since our write, and
            // re-write if necessary.
            continue;
        }

        wal_currently_processing[kv.key] = true;
        let cb_already_called = false;

        const cb = (
            res:
                | { error?: string | undefined; retry?: boolean | undefined }
                | { error?: undefined; success: true },
        ) => {
            /* I believe this might happen in some cases where the connection
             * has reset, I'm not entirely sure though. anoek - 2024-01-10 */
            if (cb_already_called) {
                return;
            }
            cb_already_called = true;

            if (loaded_user_id !== user_id) {
                console.warn(
                    "User changed while we were synchronizing our remote storage write ahead log, bailing from further updates.",
                );
                return;
            }

            delete wal_currently_processing[kv.key];

            if (res.error) {
                console.error(res.error);
                // unexpected errors (internal exceptions) will set a retry flag, in which case
                // we should retry this after a short while.
                if (res.retry) {
                    setTimeout(
                        () => _process_write_ahead_log(user_id),
                        3000 + 3000 * Math.random(),
                    );
                    return;
                }
                // otherwise, this was an error such as we've set too many keys
                // or the key/data is too long.  In those cases, we want to
                // just dump this attempt from our wal so the client doesn't
                // keep trying to send updates to the server which will never
                // succeed.
                console.error("... couldn't retry!");
            }

            if (wal[data_key].value !== kv.value || wal[data_key].replication !== kv.replication) {
                // if we updated the value since we wrote, re-write
                _process_write_ahead_log(user_id);
            } else {
                // else value has been written, remove from wal
                safeLocalStorageRemove(`ogs-remote-storage-wal.${user_id}.${kv.key}`);
                delete wal[kv.key];
                remote_sync();
            }
        };

        if ("value" in kv) {
            socket.send(
                "remote_storage/set",
                {
                    key: kv.key,
                    value: kv.value,
                    replication: kv.replication as unknown as protocol.RemoteStorageReplication,
                },
                cb,
            );
        } else {
            socket.send(
                "remote_storage/remove",
                {
                    key: kv.key,
                    replication: kv.replication as unknown as protocol.RemoteStorageReplication,
                },
                cb,
            );
        }
    }
}
// When we get disconnected from the server, reset our write ahead processing state
// so we retry everything that's in our wal when we reconnect
socket.on("disconnect", () => {
    wal_currently_processing = {};
});

let currently_synchronizing = false;
let need_another_synchronization_call = false;

function remote_sync() {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        return;
    }

    if (currently_synchronizing) {
        need_another_synchronization_call = true;
        return;
    }

    currently_synchronizing = true;
    need_another_synchronization_call = false;

    socket.send(
        "remote_storage/sync",
        {
            since: last_modified,
        },
        (ret) => {
            if ("error" in ret && ret.error) {
                console.error(ret.error);
            } else {
                // success
            }
            currently_synchronizing = false;
            if (need_another_synchronization_call) {
                remote_sync();
            }
        },
    );
}
// When we get disconnected from the server, reset the our remote_sync state in the
// event that we were mid-sync
socket.on("disconnect", () => {
    currently_synchronizing = false;
    need_another_synchronization_call = false;
});

// we'll get this when a client updates a value. We'll then send a request to the
// server for any new updates since the last update we got.
ITC.register("remote_storage/sync_needed", () => {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        console.error(
            "User is not logged in but received remote_storage/sync_needed for some reason, ignoring",
        );
        return;
    }

    remote_sync();
});

// After we've sent a synchronization request, we'll get these update messages
// for each key that's been updated since the timestamp we sent
socket.on("remote_storage/update", (row) => {
    const user = store["config.user"];

    if (!user || user.anonymous) {
        console.error(
            "User is not logged in but received remote_storage/update for some reason, ignoring",
        );
        return;
    }

    const current_data_value = get(row.key as keyof DataSchema);

    const replication_mode: Replication = row.replication as any;
    if (replication_mode === Replication.REMOTE_OVERWRITES_LOCAL) {
        setWithoutEmit(row.key as keyof DataSchema, row.value);
    }

    (remote_store as any)[row.key] = row;
    safeLocalStorageSet(`ogs-remote-storage-store.${user.id}.${row.key}`, JSON.stringify(row));

    if (last_modified < row.modified) {
        safeLocalStorageSet(`ogs-remote-storage-last-modified.${user.id}`, row.modified);
        last_modified = row.modified;
    }

    if (get(row.key as keyof DataSchema) !== current_data_value) {
        // if our having updated locally changes what get
        // evaluates to, emit an update for that data key
        emitForKey(row.key as keyof DataSchema);
    }
});

socket.on("remote_storage/sync_complete", () => {
    events.emit("remote_data_sync_complete");
});

// Whenever we connect to the server, process anything pending in our WAL and synchronize
socket.on("connect", () => {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        return;
    }

    // wait a tick for other connect handlers to fire, this includes our
    // authentication handler which we need to trigger before we do anything.
    setTimeout(() => {
        _process_write_ahead_log(user.id);
        remote_sync();
    }, 1);
});

function load_from_local_storage_and_sync() {
    const user = store["config.user"];
    if (!user || user.anonymous) {
        return;
    }

    if (loaded_user_id === user.id) {
        return;
    }
    loaded_user_id = user.id;

    remote_store = {};
    wal = {};
    wal_currently_processing = {};
    last_modified = "2000-01-01T00:00:00.000Z";

    try {
        const store_prefix = `ogs-remote-storage-store.${user.id}.`;
        const wal_prefix = `ogs-remote-storage-wal.${user.id}.`;
        const last_modified_key = `ogs-remote-storage-last-modified.${user.id}`;

        for (let i = 0; i < localStorage.length; ++i) {
            const full_key = localStorage.key(i);

            if (full_key?.indexOf(store_prefix) === 0) {
                const key = full_key.substr(store_prefix.length) as keyof DataSchema;
                try {
                    remote_store[key] = JSON.parse(
                        localStorage.getItem(full_key) as string,
                    ) as RemoteKV;
                    if (remote_store[key]?.replication === Replication.REMOTE_OVERWRITES_LOCAL) {
                        store[key] = remote_store[key]?.value;
                        emitForKey(key as keyof DataSchema);
                    }
                } catch (e) {
                    console.error(`Error loading remote storage key ${full_key}, removing`, e);
                    localStorage.removeItem(full_key);
                }
            }
            if (full_key?.indexOf(wal_prefix) === 0) {
                const key = full_key.substr(wal_prefix.length);
                try {
                    wal[key] = JSON.parse(localStorage.getItem(full_key) as string);
                } catch (e) {
                    console.error(`Error loading WAL key ${full_key}, removing`, e);
                    localStorage.removeItem(full_key);
                }
            }
            if (full_key === last_modified_key) {
                last_modified = localStorage.getItem(full_key) as string;
            }
        }
    } catch (e) {
        console.error(e);
    }

    if (socket.connected) {
        // we do a sync when we connect to the server, so we don't need to
        // worry about syncing again here.
        _process_write_ahead_log(user.id);
        remote_sync();
    }
}

// Here we load from local storage but don't actually sync because we're not connected yet

// The sync comes later when the socket connects.

// We don't call immediately, because we need to wait till main.tsx has loaded the correct config from cached.config
// (until that happens, the `config` values in local storage are for the prior user)

watch(
    "user",
    load_from_local_storage_and_sync,
    /* call on undefined */ false,
    /* don't call immediately */ true,
);
