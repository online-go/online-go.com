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

import * as React from "react";
import { _ } from "translate";
import { socket } from "sockets";

//interface NetworkStatusProps {}

// Don't warn about the network for this amount of time
const INITIAL_CONNECTION_TIME = 6000;

export function NetworkStatus(): JSX.Element {
    const [state, setState] = React.useState("connected");

    React.useEffect(() => {
        const clear = () => {
            setState("connected");
        };
        const timeout = () => {
            setState("timeout");
        };
        const disconnected = () => {
            setState("disconnected");
        };

        socket.on("latency", clear);
        socket.on("timeout", timeout);
        socket.on("disconnect", disconnected);

        const check_startup_connection = setTimeout(() => {
            if (!socket.connected) {
                setState("disconnected");
            }
        }, INITIAL_CONNECTION_TIME);

        return () => {
            socket.off("latency", clear);
            socket.off("timeout", timeout);
            socket.off("disconnect", disconnected);
            clearTimeout(check_startup_connection);
        };
    }, []);

    // let's leave this here - it might be handy if someone is having problems
    console.log("Network status: ", state);

    if (state === "connected") {
        return null;
    }

    return (
        // This funky little thing builds an icon that is intended to say
        // "no wifi!", by superimposing a large "ban" icon over a normal sized
        // "wifi" icon.
        // That is a achieved by the accompanying css - which also causes
        // the whole thing to be hidden if `hidden` is true.
        <div className={"NetworkStatus " + state}>
            <span className="icon">
                <i className="fa fa-2x fa-ban" />
                <i className="fa fa-wifi" />
            </span>

            <span>
                {(state === "timeout" || null) && _("Slow internet")}
                {(state === "disconnected" || null) && _("Disconnected")}
            </span>
        </div>
    );
}
