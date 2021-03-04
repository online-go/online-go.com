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

export function respond(event: SWEvent.FetchEvent, handler: (req: Request) => Promise<Response> | Response) {
    try {
        // 执行响应处理方法，根据返回结果进行兜底
        let res = handler(event.request);
        // 异步的响应结果兜底
        if (res instanceof Promise) {
            let promise = res.then(response => {
                // 如果返回结果非 Response 对象，抛出错误
                if (!(response instanceof Response)) {
                    throw Error('返回结果异常');
                }
                return response;
            })
                // 异步响应错误处理，即直接返回状态码为 500 Response 对象
                .catch((e) => {
                    return new Response('Service Worker 出错', {status: 500});
                });

            event.respondWith(promise);
            return;
        }

        // 同步响应如果出现任何错误
        // 可以选择不调用 event.respondWith(r)
        // 让资源请求继续走浏览器默认的请求流程

        if (res instanceof Response) {
            event.respondWith(res);
        }
    } catch (e) {}
}
