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

import {deepCompare} from "misc";


export function api1ify(path) {
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

export const api1 = api1ify;

let initialized = false;
function initialize() {
    if (initialized) {
        return;
    }
    initialized = true;

    function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            let cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                let cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: (xhr, settings) => {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        }
    });
}


let requests_in_flight = {};
let last_request_id: number = 0;
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestFunction {
    (url: string): Promise<any>;
    (url: string, id_or_data: number | any): Promise<any>;
    (url: string, id: number, data: any): Promise<any>;
}

export function request(method: Method): RequestFunction {
    return (url, ...rest) => {
        initialize();

        let id: number | string | undefined;
        let data: any;
        switch (typeof rest[0]) {
            case "number":
            case "string":
                id = rest[0];
                data = rest[1] || {};
                break;
            case "object":
                id = undefined;
                data = rest[0];
                break;
            case "undefined":
                id = undefined;
                data = {};
                break;
        }
        if (url.indexOf("%%") < 0 && id !== undefined) {
            console.warn("Url doesn't contain an id but one was given.", url, id);
            console.trace();
        }
        if (url.indexOf("%%") >= 0 && id === undefined) {
            console.error("Url contains an id but none was given.", url);
            console.trace();
        }

        let real_url: string = ((typeof(id) === "number" && isFinite(id)) || (typeof(id) === 'string')) ? url.replace("%%", id.toString()) : url;
        let real_data: any;
        real_data = data;

        for (let req_id in requests_in_flight) {
            let req = requests_in_flight[req_id];
            if (req.promise && (req.url === real_url) && (method === req.type) && deepCompare(req.data, real_data)) {
                //console.log("Duplicate in flight request, chaining");
                return req.promise;
            }
        }

        let request_id = ++last_request_id;
        let traceback = new Error();

        requests_in_flight[request_id] = {
            type: method,
            url: real_url,
            data: real_data,
        };


        requests_in_flight[request_id].promise = new Promise((resolve, reject) => {
            let opts = {
                url: api1ify(real_url),
                type: method,
                data: undefined,
                dataType: "json",
                contentType: "application/json",
                success: (res) => {
                    delete requests_in_flight[request_id];
                    resolve(res);
                },
                error: (err) => {
                    delete requests_in_flight[request_id];
                    if (err.status !== 0) { /* Ignore aborts */
                        console.warn(api1ify(real_url), err.status, err.statusText);
                        console.warn(traceback.stack);
                    }
                    console.error(err);
                    reject(err);
                }
            };
            if (real_data) {
                if ((real_data instanceof Blob) || (Array.isArray(real_data) && real_data[0] instanceof Blob)) {
                    opts.data = new FormData();
                    if (real_data instanceof Blob) {
                        opts.data.append("file", real_data);
                    } else {
                        for (let file of (real_data as Array<Blob>)) {
                            opts.data.append("file", file);
                        }
                    }
                    (opts as any).processData = false;
                    (opts as any).contentType = false;
                } else {
                    if (method === "GET") {
                        opts.data = real_data;
                    } else {
                        opts.data = JSON.stringify(real_data);
                    }
                }
            }

            requests_in_flight[request_id].request = $.ajax(opts);
        });

        return requests_in_flight[request_id].promise;
    };
}

export const get = request("GET");
export const post = request("POST");
export const put = request("PUT");
export const patch = request("PATCH");
export const del = request("DELETE");

export function abort_requests_in_flight(url, method?: Method) {
    for (let id in requests_in_flight) {
        let req = requests_in_flight[id];
        if ((req.url === url) && (!method || method === req.type)) {
            req.request.abort();
        }
    }
}
