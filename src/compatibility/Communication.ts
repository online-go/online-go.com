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

import {URLData, URLResult} from "data/Communication";

// Translate data from the server's loosely-typed schemas to our strongly-typed ones.
// There are two places where communication with the server happens: the request
// module and the sockets module. We deal first with requests. The interfaces
// URLDataType and URLResultType declare the type of the data that will be fed to
// and returned from an HTTP Ajax request. The translation functions then translate
// to and from the server's format.



// The translation function tables.
type TranslateToServerType = {[url in keyof URLData]?: (data: URLData[url]) => any};
type TranslateFromServerType = {[url in keyof URLResult]?: (result: any) => URLResult[url]};

export const translate_to_server: TranslateToServerType = {
};
export const translate_from_server: TranslateFromServerType = {
};
