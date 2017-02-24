/*
 * Copyright (C) 2012-2017  Online-Go.com
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
let last_request_id = 0;

export function request(type: string, url: string, data: any): Promise<any> {
    initialize();

    for (let id in requests_in_flight) {
        let req = requests_in_flight[id];
        if (req.promise && (req.url === url) && (type === req.type) && deepCompare(req.data, data)) {
            //console.log("Duplicate in flight request, chaining");
            return req.promise;
        }
    }

    let request_id = ++last_request_id;
    let traceback = new Error();

    requests_in_flight[request_id] = {
        type: type,
        url: url,
        data: data,
    };


    requests_in_flight[request_id].promise = new Promise((resolve, reject) => {
        let opts = {
            url: api1ify(url),
            type: type,
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
                    console.warn(api1ify(url), err.status, err.statusText);
                    console.warn(traceback.stack);
                }
                console.error(err);
                reject(err);
            }
        };
        if (data) {
            if ((data instanceof Blob) || (Array.isArray(data) && data[0] instanceof Blob)) {
                opts.data = new FormData();
                if (data instanceof Blob) {
                    opts.data.append("file", data);
                } else {
                    for (let file of (data as Array<Blob>)) {
                        opts.data.append("file", file);
                    }
                }
                (opts as any).processData = false;
                (opts as any).contentType = false;
            } else {
                if (type === "GET") {
                    opts.data = data;
                } else {
                    opts.data = JSON.stringify(data);
                }
            }
        }

        requests_in_flight[request_id].request = $.ajax(opts);
    });

    return requests_in_flight[request_id].promise;
}

export function get(url: string, data?: any): Promise<any> { return request("GET", url, data); }
export function post(url: string, data: any): Promise<any> { return request("POST", url, data); }
export function put(url: string, data: any): Promise<any> { return request("PUT", url, data); }
export function patch(url: string, data: any): Promise<any> { return request("PATCH", url, data); }
export function del(url: string): Promise<any> { return request("DELETE", url, null); }
export function abort_requests_in_flight(url, type?) {
    for (let id in requests_in_flight) {
        let req = requests_in_flight[id];
        if ((req.url === url) && (!type || type === req.type)) {
            req.request.abort();
        }
    }
}
