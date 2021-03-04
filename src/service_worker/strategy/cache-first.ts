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
export interface CacheFirstParam {
    fetchOptions?: RequestInit;
    cacheName?: string;
    matchOptions?: CacheQueryOptions;
}
export function cacheFirst({
    fetchOptions,
    cacheName = 'runtime-cache',
    matchOptions
}: CacheFirstParam = { cacheName: 'runtime-cache'} ) {
    return async(request: Request) => {
        let cache: Cache;
        let response: Response;
        let requestClone = request.clone();

        try {
            // match cache first
            cache = await caches.open(cacheName);
            response = await cache.match(request, matchOptions);
        } catch (e) {
            console.log('cache-first error', e);
        }
        // if cannot match fetch resource
        if (response == null) {
            response = await fetch(request, fetchOptions);
            const clone = response.clone();
            // 将请求响应结果存入本地缓存
            if (cache) {
                if (response.status === 200) {
                    cache.put(requestClone, clone);
                }
            }

        }

        return response;
    };
}
