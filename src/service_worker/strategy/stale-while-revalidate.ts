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
import { CacheFirstParam } from "./cache-first";

export function staleWhileRevalidate({
     fetchOptions,
     cacheName = 'runtime-cache',
     matchOptions
 }: CacheFirstParam = {cacheName: 'runtime-cache'}) {
    // read cache first
    return async(request: Request) => {
        let cache: Cache;
        let response: Response;

        try {
            cache = await caches.open(cacheName);
            response = await cache.match(request, matchOptions);
        } catch (e) {}

        const fetchAndCatch = async() => {
            let requestClone = request.clone();
            let response = await fetch(request, fetchOptions);
            const clone = response.clone();
            // cache response
            if (cache && response.status === 200) {
                await cache.put(requestClone, clone);
            }
            return response;
        };
        // make fetch and cache response
        let promise = fetchAndCatch();

        // if read cache success, return cache directly, and wait until fetch then cache new fetch result
        if (response) {
            promise.catch(e => {});
            return response;
        }
        // if read cache fail return fetch
        return promise;
    };
}
