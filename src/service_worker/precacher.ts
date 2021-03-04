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
        // 存储资源信息的列表
        this.resources = [];
        // 初始化事件监听
        this.initEventListener();
    }

    initEventListener() {
        // 在 `install` 事件回调执行预缓存资源加载
        self.addEventListener('install', (event: SWEvent.InstallEvent) => {
            event.waitUntil(
                // 缓存新增/变化的资源
                cacheResources(this.cacheName, this.resources)
            );
        });
        // 添加 activate 事件监听清理旧资源
        self.addEventListener('activate', (event: SWEvent.ActivateEvent) => {
            console.log('service worker activate', location.href, location.hostname);
            event.waitUntil(
                // 清理旧缓存
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
        // addRoute() 方法只需执行一次
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
    // 将 precache() 和 addRoute() 合成一个方法
    precacheAndRoute(resources: Array<PrecacherResourceItem | string>) {
        this.precache(resources);
        this.addRoute();
    }
}

async function cacheResources(cacheName: string, resources: Array<PrecacherResourceItem>) {
    let urls = resources.map(resource => resource.cacheKey);
    // 首先打开并缓存 CacheStorage 对象
    let cache = await caches.open(cacheName);
    // 获取已存储的所有资源键值信息
    let requests = await cache.keys();
    // 获取已存储的资源 URL
    let cachedURLs = requests.map(request => request.url);
    // 找出新增资源里面未存储过的资源 URL
    let updateURLs = urls.filter(url => !cachedURLs.includes(url));
    // 最后调用 cache.addAll() 缓存新增资源
    await cache.addAll(updateURLs);
}

function formatResource(searchKey: string, resource: string | PrecacherResourceItem) {
    let originURL: URL;
    let cacheKeyURL: URL;
    // 当资源信息为字符串时，说明资源 URL 已经具有唯一性
    // 因此可以直接拿 URL 作为资源的存储键值
    if (typeof resource === 'string') {
        originURL = new URL(resource, location.href);
        cacheKeyURL = new URL(resource, location.href);
    }
    // 当资源信息为对象时，需要使用 revision 来生成资源存储键值
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
    // 首先打开并缓存 CacheStorage 对象
    let cache = await caches.open(cacheName);
    // 获取已存储的所有资源键值信息
    let requests = await cache.keys();
    // 找出新增的 URL
    // 获取已存储的资源 URL
    let cachedURLs = requests.map(request => request.url);
    // 找出不在资源列表信息当中的 URL
    let oldURLs = cachedURLs.filter(url => !urls.includes(url));
    // 最后调用 cache.delete() 删除旧资源
    await Promise.all(oldURLs.map(url => cache.delete(url)));
}
