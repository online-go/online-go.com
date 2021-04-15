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
 * Synchronisation is done by a call to data.set() to provide the updated value locally
 *  => all gets should be done with data.get(), using the locally stored value.
 *
 * Remove will immediately remove our local copy of the key and clear the value
 * from other devices.
 *
 * Remote storage only returns meaningful values when the user is authenticated,
 * otherwise all gets will return undefined.
 *
 *
 * KNOWN BUGS:
 *
 *   Right now we set our local state so we can access it immediately, however
 *   if the send doesn't happen correctly we can end up with clients being out
 *   of sync with one client having the local state set but the remote storage
 *   having never received that data. I think we *do* want the local set to happen
 *   immediately for UI convenience, which means I think the item on the TODO to
 *   fix this is to have persistent queue for sets and removes that gets retried
 *   when we reconnect to the server.
 */


type StorableValue = number | string | boolean | undefined | {[key:string]: StorableValue};

export function set(key:string, value:StorableValue):Promise<void> {
    let user = data.get('config.user');
    if (user.anonymous) {
        return Promise.reject('user is not authenticated');
    }

    data.set(`remote-storage.${user.id}.${key}`, value);

    return new Promise<void>((resolve, reject) => {
        termination_socket.send('remote_storage/set', {key, value}, (res:any) => {
            if (res.error) {
                reject(res.error);
            } else {
                resolve();
            }
        });
    });
}

export function remove(key:string):Promise<void> {
    let user = data.get('config.user');
    if (user.anonymous) {
        return Promise.reject('user is not authenticated');
    }

    return new Promise<void>((resolve, reject) => {
        termination_socket.send('remote_storage/remove', {key}, (res:any) => {
            if (res.error) {
                reject(res.error);
            } else {
                resolve();
            }
        });
    });
}



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

    /* Set the local version of this key, so that data.get gets this value, and watches fire */

    data.set(row.key, row.value, true /* don't try to re-persist remotely this! */);

    let last_modified = data.get(`remote-storage.last-modified.${user.id}`);
    if (!last_modified || last_modified < row.modified) {
        data.set(`remote-storage.last-modified.${user.id}`, row.modified);
    }
});

// Whenever we connect or reconnect to the server, sync
termination_socket.on('connect', () => {
    let user = data.get('config.user');
    if (user.anonymous) {
        return;
    }

    // wait a tick for other connect handlers to fire, this includes our
    // authentication handler which we need to trigger before we do anything.
    setTimeout(() => {
        let last_modified = data.get(`remote-storage.last-modified.${user.id}`, "2000-01-01T00:00:00.000Z") ;
        termination_socket.send('remote_storage/sync', last_modified);
    }, 1);
});
