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
        // call handler to get result
        // then act according to res
        let res = handler(event.request);
        // res is Promise
        if (res instanceof Promise) {
            let promise = res.then(response => {
                // if res.resolve is not Response Object，throw Errors
                if (!(response instanceof Response)) {
                    throw Error('Response Error');
                }
                return response;
            })
                // Promise caetch, return http code 500 Response
                .catch((e) => {
                    return new Response('Service Worker Error', {status: 500});
                });

            event.respondWith(promise);
            return;
        }

        // this if is wrap in try catch, so if synchronize logic error
        // this function call will just do nothing
        // the resource will go browser default fetch

        if (res instanceof Response) {
            event.respondWith(res);
        }
    } catch (e) {}
}
