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
/**
 * This is service worker file for online-go.com
 *
 * TODO update the resource list after webpack or gulp
 * TODO make cache version from build version hash tag or date？
 */

import { Precacher } from "./service_worker/precacher";
import { Router } from "./service_worker/router";
import * as Strategy from './service_worker/strategy';

// TODO this name should change with every webpack build
const cacheName = 'v1';

const precacher = new Precacher({cacheName});

// the html
precacher.precacheAndRoute([
    location.origin,
].filter(s => s));

const router = new Router();

// this variable should came from one build
const cacheFirstParam: Parameters<typeof Strategy.cacheFirst>[0] = {
    cacheName,
};
const networkFirstParam: Parameters<typeof Strategy.networkFirst>[0] = {
    cacheName,
};
const staleWhileRevalidateParam: Parameters<typeof Strategy.staleWhileRevalidate>[0] = {
    cacheName,
};

// register cdn
router.registerRoute(
    (req: Request) => /^https\:\/\/cdn\.online\-go\.com/.test(req.url) && req.method.toUpperCase() === 'GET',
    Strategy.cacheFirst(cacheFirstParam)
);

// register api
router.registerRoute(
    (req: Request) => new RegExp(location.hostname).test(req.url) && /api/.test(req.url) && req.method.toUpperCase() === 'GET',
    Strategy.networkFirst(cacheFirstParam)
);

router.registerRoute(
    (req: Request) => new RegExp(location.hostname).test(req.url) && !(/api/.test(req.url)) && req.method.toUpperCase() === 'GET',
    Strategy.staleWhileRevalidate(networkFirstParam)
);

// router.registerRoute(
//     url => /\.js$/.test(url) && new RegExp(location.hostname).test(url), Strategy.networkFirst(networkFirstParam));
// router.registerRoute(
//     url => /\.json$/.test(url) && new RegExp(location.hostname).test(url), Strategy.networkFirst(networkFirstParam));
// router.registerRoute(
//     url => /\.css$/.test(url) && new RegExp(location.hostname).test(url), Strategy.networkFirst(networkFirstParam));

// router.registerRoute(/\.wasm$/, Strategy.networkFirst(networkFirstParam));
// router.registerRoute('/', Strategy.networkFirst(networkFirstParam));

