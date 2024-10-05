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

import * as data from "@/lib/data";
import cached from "@/lib/cached";
import { get } from "@/lib/requests";
import { errorLogger } from "@/lib/misc";
import ITC from "@/lib/ITC";
import { alert } from "@/lib/swal_config";

ITC.register("logout", (device_uuid: string) => {
    if (device_uuid !== data.get("device.uuid", "")) {
        alert.fire("This device has been logged out remotely").then(logout).catch(logout);
    }
});

export function logout() {
    get("/api/v0/logout")
        .then((config) => {
            data.set(cached.config, config);
            window.location.href = "/sign-in";
        })
        .catch(errorLogger);
}

export function logoutOtherDevices() {
    void alert
        .fire({
            text: "Logout of other devices you are logged in to?",
            showCancelButton: true,
        })
        .then(({ value: accept }) => {
            if (accept) {
                ITC.send("logout", data.get("device.uuid"));
                void alert.fire("Other devices have been logged out");
            }
        });
}

export function logoutAndClearLocalData() {
    try {
        get("/api/v0/logout")
            .then(() => {
                window.location.href = "/";
            })
            .catch(errorLogger);
    } catch (e) {
        console.warn(e);
    }

    try {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    } catch (e) {
        console.warn(e);
    }

    try {
        localStorage.clear();
    } catch (e) {
        console.warn(e);
    }
}
