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

// The types of data that is transmitted between the client and server in
// Ajax requests. The URLData type is the type of information that we send
// to the server, while the URLResultType is the type of the server's
// response to us.
export type URLCommunication = URLData | URLResult;
export interface URLData {
    GET: {[url: string]: any};
    POST: {[url: string]: any};
    PUT: {[url: string]: any};
    PATCH: {[url: string]: any};
    DELETE: {[url: string]: any};
}
export interface URLResult {
    GET: {[url: string]: any};
    POST: {[url: string]: any};
    PUT: {[url: string]: any};
    PATCH: {[url: string]: any};
    DELETE: {[url: string]: any};
}
