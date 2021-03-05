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
import { SWEvent } from "./interface";
import { cacheFirst } from "./strategy";
import { Router } from './router';

export interface PrecacherResourceItem {
    url: string;
    cacheKey: string;
    revision?: string;
}

export class Precacher {
    cacheName: string;
    searchKey: string;
    resources: Array<PrecacherResourceItem>;
    hasAdded: boolean = false;
    constructor({
        cacheName = 'precache',
        searchKey = 'precache_url_revision'
    }) {
        this.cacheName = cacheName;
        this.searchKey = searchKey;
        this.resources = [];
        this.initEventListener();
    }

    initEventListener() {
        // in `install` callback cache then resources
        self.addEventListener('install', (event: SWEvent.InstallEvent) => {
            event.waitUntil(
                // cache new/change resources
                cacheResources(this.cacheName, this.resources)
            );
        });
        // in `activate` callback clean old resources
        self.addEventListener('activate', (event: SWEvent.ActivateEvent) => {
            console.log('service worker activate', location.href, location.hostname);
            event.waitUntil(
                // clean old cache
                clearOldResources(this.cacheName, this.resources)
            );
        });
    }

    precache(resources: Array<PrecacherResourceItem | string>) {
        for (let resource of resources) {
            // 格式化资源信息
            let res = formatResource(this.searchKey, resource);
            this.resources.push(res);
        }
    }

    addRoute() {
        // addRoute() should call only once
        if (this.hasAdded) {
            return;
        }
        this.hasAdded = true;

        const cacheFirstHandler = cacheFirst({
            cacheName: this.cacheName
        });

        const router = new Router();
        router.registerRoute(
            request => {
                return this.resources.some(
                    resource => resource.url === request.url
                );
            },
            request => {
                for (let resource of this.resources) {
                    if (resource.url === request.url) {
                        return cacheFirstHandler(new Request(resource.cacheKey));
                    }
                }
            }
        );
    }
    precacheAndRoute(resources: Array<PrecacherResourceItem | string>) {
        this.precache(resources);
        this.addRoute();
    }
}

async function cacheResources(cacheName: string, resources: Array<PrecacherResourceItem>) {
    let urls = resources.map(resource => resource.cacheKey);
    // open CacheStorage
    let cache = await caches.open(cacheName);
    // get all keys
    let requests = await cache.keys();
    // get cached resource URL
    let cachedURLs = requests.map(request => request.url);
    // get new resource without cache URL
    let updateURLs = urls.filter(url => !cachedURLs.includes(url));
    // call cache.addAll() to cache new resources
    await cache.addAll(updateURLs);
}

function formatResource(searchKey: string, resource: string | PrecacherResourceItem) {
    let originURL: URL;
    let cacheKeyURL: URL;
    // if resource is string type, means it's unique
    // so use url as key to cache
    if (typeof resource === 'string') {
        originURL = new URL(resource, location.href);
        cacheKeyURL = new URL(resource, location.href);
    }
    // if resource is object
    // use revision to generate cache key
    else {
        originURL = new URL(resource.url, location.href);
        cacheKeyURL = new URL(resource.url, location.href);
        cacheKeyURL.searchParams.set(searchKey, resource.revision);
    }

    return {
        url: originURL.href,
        cacheKey: cacheKeyURL.href
    };
}

async function clearOldResources(cacheName: string, resources: Array<PrecacherResourceItem>) {
    let urls = resources.map(resource => resource.cacheKey);
    // open CacheStorage
    let cache = await caches.open(cacheName);
    // get all keys
    let requests = await cache.keys();
    // get cached resource URL
    let cachedURLs = requests.map(request => request.url);
    // get old resource not passing by resources param
    let oldURLs = cachedURLs.filter(url => !urls.includes(url));
    // call cache.delete() to delete old resource
    await Promise.all(oldURLs.map(url => cache.delete(url)));
}
