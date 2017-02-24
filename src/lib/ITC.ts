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

/* Inter tab communications library */
import {comm_socket} from "sockets";

let registrations = {};

comm_socket.on("itc", (obj) => {
    if (obj.event in registrations) {
        for (let i = 0; i < registrations[obj.event].length; ++i) {
            registrations[obj.event][i](obj.data);
        }
    }
});

export default {
    register: (event, cb) => {
        if (!(event in registrations)) {
            registrations[event] = [];
        }
        registrations[event].push(cb);
    },
    send: (event, data) => {
        comm_socket.send("itc", {"event": event, "data": data});
    }
};
