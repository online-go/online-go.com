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
import { socket } from "sockets";

//interface NetworkStatusProps {}

// Don't warn about the network for this amount of time
const INITIAL_CONNECTION_TIME = 6000;

export function NetworkStatus(): JSX.Element {
    // Note: we start "hidden" so that it doesn't flash up while
    // making the initial connection.
    const [hidden, setHidden] = React.useState(true);

    React.useEffect(() => {
        const show = () => setHidden(false);
        const hide = () => setHidden(true);

        socket.on("latency", hide);
        socket.on("timeout", show);
        socket.on("disconnect", show);

        const check_startup_connection = setTimeout(() => {
            if (!socket.connected) {
                setHidden(false);
            }
        }, INITIAL_CONNECTION_TIME);

        return () => {
            socket.off("latency", hide);
            socket.off("timeout", show);
            socket.off("disconnect", show);
            clearTimeout(check_startup_connection);
        };
    }, []);

    // let's leave this here - it might be handy if someone is having problems
    console.log("Network status: ", hidden ? "connected" : "warn");

    return (
        // This funky little thing builds an icon that is intended to say
        // "no wifi!", by superimposing a large "ban" icon over a normal sized
        // "wifi" icon.
        // That is a achieved by the accompanying css - which also causes
        // the whole thing to be hidden if `hidden` is true.
        <div className={"NetworkStatus" + (hidden ? " hidden" : "")}>
            <i className="fa fa-2x fa-ban" />
            <i className="fa fa-wifi" />
        </div>
    );
}
