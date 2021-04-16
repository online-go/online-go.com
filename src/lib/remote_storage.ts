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

import { TypedEventEmitter } from 'TypedEventEmitter';
import { uuid } from 'misc';
import { termination_socket } from 'sockets';
import ITC from 'ITC';
import * as data from 'data';


/**
 * Usage notes
 *
 * Remote storage stores data on the server and is synchronized to all other
 * devices for the currently logged in player.
 *
 * Set will immediately update our local copy of the key and send the update to
 * the server which will then sychronize to other devices pretty quickly.
 *
 * Get will immediately return the local copy of our key, and relies on our
 * synchronzation system to take care of updating our local copy so it's ready
 * when we need it.
 *
 * Remove will immediately remove our local copy of the key and clear the value
 * from other devices.
 *
 * Remote storage only returns meaningful values when the user is authenticated,
 * otherwise all gets will return undefined.
 *
 */


type StorableValue = number | string | boolean | undefined | {[key:string]: StorableValue};

export function set(key:string, value:StorableValue):void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    if (data.get(`remote-storage.${user.id}.${key}`) === value) {
        return;
    }

    _enqueue_set(user.id, key, value);
    data.set(`remote-storage.${user.id}.${key}`, value);
}

export function get(key:string):StorableValue {
    let user = data.get('config.user');
    if (user.anonymous) {
        return undefined;
    }

    return data.get(`remote-storage.${user.id}.${key}`);
}

export function remove(key:string):void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    if (data.get(`remote-storage.${user.id}.${key}`) === undefined) {
        return;
    }

    _enqueue_remove(user.id, key);
    data.remove(`remote-storage.${user.id}.${key}`);
}

export function watch(key: string, cb: (d: any) => void, call_on_undefined?: boolean, dont_call_immediately?: boolean): void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    data.watch(`remote-storage.${user.id}.${key}`, cb, call_on_undefined, dont_call_immediately);
}
export function unwatch(key: string, cb: (d: any) => void): void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    data.unwatch(`remote-storage.${user.id}.${key}`, cb);
}
export function dump(): void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    data.dump(`remote-storage.${user.id}.`, true);
}

export function dumpWAL(): void {
    let user = data.get('config.user');
    if (user.anonymous) {
        throw new Error('user is not authenticated');
    }

    data.dump(`remote-storage.wal.${user.id}.`, true);
}


// Our write ahead log ensures that if we have a connection problem while we
// are writing a value to our remote storage, we retry when we re-establish
// our connection. This is a "last to write wins" system.

function _enqueue_set(user_id:number, key:string, value: StorableValue):void {
    data.set(`remote-storage.wal.${user_id}.${key}`, {key: key, value: value});
    _process_write_ahead_log(user_id);
}

function _enqueue_remove(user_id:number, key:string):void {
    data.set(`remote-storage.wal.${user_id}.${key}`, {key: key});
    _process_write_ahead_log(user_id);
}

let currently_processing:{[k:string]: boolean} = {};

function _process_write_ahead_log(user_id:number):void {
    let wal = data.getPrefix(`remote-storage.wal.${user_id}.`);


    for (let data_key in wal) {
        let kv = wal[data_key];

        if (currently_processing[kv.key]) {
            // already writing this key. We'll check when we return from our
            // current write to see if it's changed since our write and re-write
            // if necessary.
            continue;
        }

        currently_processing[kv.key] = true;

        let cb = () => {
            delete currently_processing[kv.key];
            let current_value = get(kv.key);
            if (current_value !== kv.value) { // value updated since we wrote?
                _process_write_ahead_log(user_id); // write the updated value
            } else {
                // otherwise we're done, remove this from the wal
                data.remove(`remote-storage.wal.${user_id}.${kv.key}`);
            }
        };

        if (kv.value) {
            termination_socket.send('remote_storage/set', {key: kv.key, value: kv.value}, cb);
            // this set is not redundant, if we received an update from the server, if we still
            // have something in our WAL we will try and write that out.
            if (data.get(`remote-storage.${user_id}.${kv.key}`) !== kv.value) {
                data.set(`remote-storage.${user_id}.${kv.key}`, kv.value);
            }
        } else {
            termination_socket.send('remote_storage/remove', {key: kv.key}, cb);
            if (data.get(`remote-storage.${user_id}.${kv.key}`) !== undefined) {
                data.remove(`remote-storage.${user_id}.${kv.key}`);
            }
        }
    }
}

termination_socket.on('connect', () => {
    let user = data.get('config.user');
    if (user.anonymous) {
        return;
    }

    // wait a tick for other connect handlers to fire, this includes our
    // authentication handler which we need to trigger before we do anything.
    setTimeout(() => {
        _process_write_ahead_log(user.id);
        let last_modified = data.get(`remote-storage.last-modified.${user.id}`, "2000-01-01T00:00:00.000Z") ;
        termination_socket.send('remote_storage/sync', last_modified);
    }, 1);
});
termination_socket.on('disconnect', () => currently_processing = {});


// we'll get this when a tab updates a value. We'll then send a request to the
// server for any new updates since the last update we got.
ITC.register('remote_storage/sync_needed', () => {
    let user = data.get('config.user');
    if (user.anonymous) {
        console.error("User is not logged in but received remote_storage/sync for some reason, ignoring");
        return;
    }

    let last_modified = data.get(`remote-storage.last-modified.${user.id}`, "2000-01-01T00:00:00.000Z") ;
    termination_socket.send('remote_storage/sync', last_modified);
});

// After we've sent a synchronization request, we'll get these update messages
// for each key that's updated since the timestamp we sent
termination_socket.on('remote_storage/update', (row:{key:string, value: StorableValue, modified: any}) => {
    let user = data.get('config.user');
    if (user.anonymous) {
        console.error("User is not logged in but received remote_storage/update for some reason, ignoring");
        return;
    }

    data.set(`remote-storage.${user.id}.${row.key}`, row.value);
    let last_modified = data.get(`remote-storage.last-modified.${user.id}`);
    if (!last_modified || last_modified < row.modified) {
        data.set(`remote-storage.last-modified.${user.id}`, row.modified);
    }
});
