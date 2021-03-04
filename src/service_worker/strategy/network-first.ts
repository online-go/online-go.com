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

export function networkFirst({
    fetchOptions,
    cacheName,
    matchOptions,
}: CacheFirstParam = { cacheName: 'runtime-cache'}) {
    return async(request: Request) => {
        let requestClone = request.clone();
        try {
            // make fetch first
            let response = await fetch(request, fetchOptions);
            if (response.status === 200) {
                // after fetch success store to cache
                const cacheResponse = async() => {
                    const clone = response.clone();
                    let cache = await caches.open(cacheName);
                    await cache.put(requestClone, clone);
                };
                // cache action, no need to block the return
                cacheResponse();
                return response;
            }
        } catch (e) {
            // if fetch fail return cache
            let cache = await caches.open(cacheName);
            return cache.match(requestClone, matchOptions);
        }
    };
}
