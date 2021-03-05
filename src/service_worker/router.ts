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
import { match } from "./match";
import { respond } from "./respond";
import { SWEvent } from './interface';

export class Router {
    routes: Array<{
        rule: SWEvent.Rule;
        handler: (req: Request) => Promise<Response> | Response;
    }>;
    constructor() {
        this.routes = [];
        this.initProxy();
    }

    /**
     * register fetch event listener
     */
    initProxy() {
        self.addEventListener('fetch', (event: SWEvent.FetchEvent) => {
            // when proxy fetch request
            // loop registered routes
            // if match, do the strategy
            for (let route of this.routes) {
                // 使用前面封装好的 match 函数进行路由规则匹配
                if (match(route.rule, event.request)) {
                    // 使用前面封装好的 respond 方法执行回调操作
                    respond(event, route.handler);
                    break;
                }
            }
        });
    }

    registerRoute(rule: SWEvent.Rule, handler: (req: Request) => Promise<Response> | Response) {
        this.routes.push({rule, handler});
    }
}
