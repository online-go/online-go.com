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

type StorableValue = number | string | boolean | undefined | {[key:string]: StorableValue};

export function set(key:string, value:StorableValue):Promise<void> {
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

export function get(key:string):Promise<StorableValue> {
    return new Promise<StorableValue>((resolve, reject) => {
        termination_socket.send('remote_storage/get', {key}, (res:any) => {
            if (res.error) {
                try {
                    if (res.error.indexOf("not found") > 0) {
                        resolve(undefined);
                    } else {
                        reject(res.error);
                    }
                } catch(err) {
                    reject(res.error);
                }
            } else {
                resolve(res.value);
            }
        });
    });
}

export function remove(key:string):Promise<void> {
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

