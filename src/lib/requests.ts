/*
 * Copyright (C)  Online-Go.com
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

import { deepCompare } from "misc";

/**
 * If a non-absolute path is provided, appends "/api/v1/" to the input.
 *
 * @param path a path or a URL
 */
export function api1ify(path: string) {
    if (path.indexOf("/api/v") === 0) {
        return path;
    }
    if (path.indexOf("/") === 0) {
        return path;
    }
    if (path.indexOf("://") > 0) {
        return path;
    }

    return `/api/v1/${path}`;
}

/** alias for api1ify */
export const api1 = api1ify;

let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    initialized = true;

    function csrfSafeMethod(method) {
        return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
    }
    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: (xhr, settings) => {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        },
    });
}

interface Request {
    method: Method;
    url: string;
    data: object;
    promise?: Promise<any>;
    request?: JQueryXHR;
}

const requests_in_flight: { [id: string]: Request } = {};
let last_request_id = 0;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestFunction {
    (url: string, data?: object): Promise<any>;
}

function request(method: Method): RequestFunction {
    return (url: string, data?: object) => {
        initialize();
        url = api1ify(url);

        for (const req_id in requests_in_flight) {
            const req = requests_in_flight[req_id];
            if (
                req.promise &&
                req.url === url &&
                method === req.method &&
                deepCompare(req.data, data)
            ) {
                //console.log("Duplicate in flight request, chaining");
                return req.promise;
            }
        }

        const request_id = ++last_request_id;
        const traceback = new Error();

        requests_in_flight[request_id] = {
            method,
            url,
            data,
        };

        requests_in_flight[request_id].promise = new Promise((resolve, reject) => {
            const opts: JQueryAjaxSettings = {
                method,
                url,
                data: undefined,
                dataType: "json",
                contentType: "application/json",
                success: (res) => {
                    delete requests_in_flight[request_id];
                    resolve(res);
                },
                error: (err) => {
                    delete requests_in_flight[request_id];
                    if (err.status !== 0) {
                        /* Ignore aborts */
                        console.warn(url, err.status, err.statusText);
                        console.warn(traceback.stack);
                    }
                    reject(err);
                },
            };
            if (data) {
                if (data instanceof Blob || (Array.isArray(data) && data[0] instanceof Blob)) {
                    opts.data = new FormData();
                    if (data instanceof Blob) {
                        opts.data.append("file", data);
                    } else {
                        for (const file of data as Array<Blob>) {
                            opts.data.append("file", file);
                        }
                    }
                    opts.processData = false;
                    opts.contentType = false;
                } else {
                    if (method === "GET") {
                        opts.data = data;
                    } else {
                        opts.data = JSON.stringify(data);
                    }
                }
            }

            requests_in_flight[request_id].request = $.ajax(opts);
        });

        return requests_in_flight[request_id].promise;
    };
}

/** Returns the cookie value for a given key */
export function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Fetches data using the GET method.
 * @param url the URL for the request. If a relative path is passed, /api/vi/
 *     will be appended.
 * @param [data] providing data is optional. This is used as the request payload
 *     in JSON format.
 * @returns a Promise that resolves with the response payload.
 */
export const get = request("GET");
/**
 * Fetches data using the POST method.
 * @param url the URL for the request. If a relative path is passed, /api/vi/
 *     will be appended.
 * @param [data] providing data is optional. This is used as the request payload
 *     in JSON format.
 * @returns a Promise that resolves with the response payload.
 */
export const post = request("POST");
/**
 * Fetches data using the PUT method.
 * @param url the URL for the request. If a relative path is passed, /api/vi/
 *     will be appended.
 * @param [data] providing data is optional. This is used as the request payload
 *     in JSON format.
 * @returns a Promise that resolves with the response payload.
 */
export const put = request("PUT");
/**
 * Fetches data using the PATCH method.
 * @param url the URL for the request. If a relative path is passed, /api/vi/
 *     will be appended.
 * @param [data] providing data is optional. This is used as the request payload
 *     in JSON format.
 * @returns a Promise that resolves with the response payload.
 */
export const patch = request("PATCH");
/**
 * Fetches data using the DELETE method.
 * @param url the URL for the request. If a relative path is passed, /api/vi/
 *     will be appended.
 * @param [data] providing data is optional. This is used as the request payload
 *     in JSON format.
 * @returns a Promise that resolves with the response payload.
 */
export const del = request("DELETE");

/**
 * Cancels any requests using the specified URL and method.
 * @param url the URL for the request.
 * @param [method] providing a method is optional.  If no method is provided,
 *     all requests to the URL will be cancelled.
 */
export function abort_requests_in_flight(url: string, method?: Method): void {
    for (const id in requests_in_flight) {
        const req = requests_in_flight[id];
        if (req.url === url && (!method || method === req.method)) {
            req.request.abort();
        }
    }
}
