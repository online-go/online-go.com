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

import { deepCompare } from "@/lib/misc";

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

interface OgsRequest {
    method: Method;
    url: string;
    data?: object;
    promise?: Promise<any>;
    controller: AbortController;
    signal: AbortSignal;
}

const requests_in_flight: { [id: string]: OgsRequest } = {};
let last_request_id = 0;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestFunction {
    (url: string, data?: object): Promise<any>;
}

function request(method: Method): RequestFunction {
    const csrf_safe = /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
    const cacheable = /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

    return async (url: string, data?: object): Promise<any> => {
        url = api1ify(url);

        for (const req_id in requests_in_flight) {
            const req = requests_in_flight[req_id];
            if (
                req.promise &&
                req.url === url &&
                method === req.method &&
                deepCompare(req.data, data)
            ) {
                //console.log(`Duplicate in flight request: ${url} , chaining`);
                return req.promise;
            }
        }

        const request_id = ++last_request_id;
        const traceback = new Error();

        const controller = new AbortController();
        const signal = controller.signal;

        requests_in_flight[request_id] = {
            method,
            url,
            data,
            controller,
            signal,
        };

        requests_in_flight[request_id].promise = new Promise((resolve, reject) => {
            let prepared_data: string | FormData | undefined;
            const headers: Headers = new Headers();
            headers.append("Accept", "application/json");

            if (!csrf_safe) {
                headers.append("X-CSRFToken", getCookie("csrftoken"));
            }

            if (data) {
                if (data instanceof Blob || (Array.isArray(data) && data[0] instanceof Blob)) {
                    prepared_data = new FormData();
                    if (data instanceof Blob) {
                        prepared_data.append("file", data);
                    } else {
                        for (const file of data as Array<Blob>) {
                            prepared_data.append("file", file);
                        }
                    }
                } else {
                    if (method === "GET") {
                        url +=
                            (url.indexOf("?") >= 0 ? "&" : "?") +
                            Object.keys(data)
                                .map((k) => `${k}=` + encodeURIComponent((data as any)[k]))
                                .join("&");
                    } else {
                        prepared_data = JSON.stringify(data);
                        headers.append("Content-Type", "application/json");
                    }
                }
            }

            const same_origin = url.indexOf("://") < 0 || url.indexOf(window.location.origin) === 0;

            fetch(url, {
                signal,
                method,
                credentials: same_origin ? "include" : undefined,
                mode: same_origin ? (csrf_safe ? "no-cors" : "cors") : undefined,
                cache: cacheable ? "default" : "no-cache",
                body: prepared_data as any,
                headers,
            })
                .then((res) => {
                    delete requests_in_flight[request_id];

                    const onJson = (data: any) => {
                        if (res.status >= 200 && res.status < 300) {
                            if (res.status === 204) {
                                resolve({});
                            } else {
                                resolve(data);
                            }
                        } else {
                            console.error(res.status, url, data);
                            console.error(traceback.stack);
                            reject(data);
                        }
                    };

                    const errorHandler = () => {
                        reject(res.statusText);
                    };

                    const data_or_promise = res.json();

                    if (data_or_promise instanceof Promise) {
                        data_or_promise.then(onJson).catch(errorHandler);
                    } else {
                        onJson(data_or_promise);
                    }
                })
                .catch((err) => {
                    delete requests_in_flight[request_id];
                    if (err.name !== "AbortError") {
                        console.error(err.name, url);
                        console.error(traceback.stack);
                    }
                    reject(err);
                });
        });

        return requests_in_flight[request_id].promise;
    };
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
export function abort_requests_in_flight(url: string, method?: Method): boolean {
    let aborted = false;
    url = api1ify(url);

    for (const request_id in requests_in_flight) {
        const req = requests_in_flight[request_id];
        if (req.url === url && (!method || method === req.method)) {
            console.log("Aborting request", url);
            req.controller.abort();
            aborted = true;
            delete requests_in_flight[request_id];
        }
    }

    return aborted;
}

export function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
