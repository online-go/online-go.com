/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import * as data from "data";
import cached from "cached";
import { get } from "requests";
import { errorLogger, ignore } from "misc";
import ITC from "ITC";
import swal from "sweetalert2";

ITC.register("logout", (device_uuid: string) => {
    if (device_uuid !== data.get("device.uuid", "")) {
        swal("This device has been logged out remotely").then(logout).catch(logout);
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
    swal({
        text: "Logout of other devices you are logged in to?",
        showCancelButton: true,
    })
        .then(() => {
            ITC.send("logout", data.get("device.uuid"));
            swal("Other devices have been logged out").then(ignore).catch(ignore);
        })
        .catch(ignore);
    //get("/api/v0/logout?everywhere=1").then(console.log).catch(errorAlerter);
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
