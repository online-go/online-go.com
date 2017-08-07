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



// The translation function tables for AJAX requests. These translate data from the
// server's loosely-typed schemas to our strongly-typed ones.
type TranslateToServerType = {[type in keyof URLData]: {[url in keyof URLData[type]]?: (data: URLData[type][url]) => any}};
type TranslateFromServerType = {[type in keyof URLResult]: {[url in keyof URLResult[type]]?: (result: any) => URLResult[type][url]}};

export const translate_to_server: TranslateToServerType = {
    GET: {},
    POST: {},
    PUT: {},
    PATCH: {},
    DELETE: {},
};
export const translate_from_server: TranslateFromServerType = {
    GET: {},
    POST: {},
    PUT: {},
    PATCH: {},
    DELETE: {},
};
