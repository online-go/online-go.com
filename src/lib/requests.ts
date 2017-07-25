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
import {URLCommunication, URLData, URLResult} from "data/Communication";
import {translate_from_server, translate_to_server} from "compatibility/Communication";



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

export function request<T extends keyof URLCommunication, U extends keyof URLCommunication[T]>(type: T, url: U, id?: number, data?: URLData[T][U]): Promise<URLResult[T][U]> {
    initialize();

    let real_url: string = isFinite(id) ? url.replace("%%", id.toString()) : url;
    let real_data: any;
    if (url in translate_to_server) {
        real_data = translate_to_server[type][url](data);
    }
    else {
        real_data = data;
    }

    for (let id in requests_in_flight) {
        let req = requests_in_flight[id];
        if (req.promise && (req.url === real_url) && (type === req.type) && deepCompare(req.data, real_data)) {
            //console.log("Duplicate in flight request, chaining");
            return req.promise;
        }
    }

    let request_id = ++last_request_id;
    let traceback = new Error();

    requests_in_flight[request_id] = {
        type: type,
        url: real_url,
        data: real_data,
    };


    requests_in_flight[request_id].promise = new Promise((resolve, reject) => {
        let opts = {
            url: api1ify(real_url),
            type: type,
            data: undefined,
            dataType: "json",
            contentType: "application/json",
            success: (res) => {
                delete requests_in_flight[request_id];
                if (url in translate_from_server) {
                    resolve(translate_from_server[type][url](res));
                }
                else {
                    resolve(res);
                }
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
                if (type === "GET") {
                    opts.data = real_data;
                } else {
                    opts.data = JSON.stringify(real_data);
                }
            }
        }

        requests_in_flight[request_id].request = $.ajax(opts);
    });

    return requests_in_flight[request_id].promise;
}

export function get<K extends keyof URLCommunication["GET"]>(url: K, id?: number, data?: URLData["GET"][K]): Promise<URLResult["GET"][K]> {
    return request("GET", url, id, data);
}
export function post<K extends keyof URLCommunication["POST"]>(url: K, id?: number, data?: URLData["POST"][K]): Promise<URLResult["POST"][K]> {
    return request("POST", url, id, data);
}
export function put<K extends keyof URLCommunication["PUT"]>(url: K, id?: number, data?: URLData["PUT"][K]): Promise<URLResult["PUT"][K]> {
    return request("PUT", url, id, data);
}
export function patch<K extends keyof URLCommunication["PATCH"]>(url: K, id?: number, data?: URLData["PATCH"][K]): Promise<URLResult["PATCH"][K]> {
    return request("PATCH", url, id, data);
}
export function del<K extends keyof URLCommunication["DELETE"]>(url: K, id?: number, data?: URLData["DELETE"][K]): Promise<URLResult["DELETE"][K]> {
    return request("DELETE", url, id, data);
}
export function abort_requests_in_flight(url, type?) {
    for (let id in requests_in_flight) {
        let req = requests_in_flight[id];
        if ((req.url === url) && (!type || type === req.type)) {
            req.request.abort();
        }
    }
}
