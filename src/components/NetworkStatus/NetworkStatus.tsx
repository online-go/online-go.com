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
import { useLocation } from "react-router-dom";
import { _ } from "translate";
import { socket } from "sockets";

//interface NetworkStatusProps {}

// Don't warn about the network for this amount of time
const INITIAL_CONNECTION_TIME = 6000;

type NetworkStatusState = "connected" | "went-away" | "disconnected" | "timeout";

export function NetworkStatus(): JSX.Element {
    const [state, setState] = React.useState<NetworkStatusState>("connected");

    const stateRef = React.useRef(state);

    const location = useLocation();
    const on_game_page = location.pathname.includes("/game/");

    React.useEffect(() => {
        stateRef.current = state; // needed so we can refer to the current value in the async timer below
    }, [state]);

    React.useEffect(() => {
        const clear = () => {
            setState("connected");
        };
        const timeout = () => {
            setState("timeout");
            console.log("Network status timeout: ", socket.options.timeout_delay);
        };
        const disconnected = (code: number) => {
            // When the socket comes up again, a fresh `latency` will clear this
            setState(code === 1001 ? "went-away" : "disconnected");
        };

        socket.on("latency", clear);
        socket.on("timeout", timeout);
        socket.on("disconnect", disconnected);

        const check_startup_connection = setTimeout(() => {
            if (!socket.connected && stateRef.current !== "went-away") {
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

    if (state === "connected" || state === "went-away") {
        return null;
    }

    return (
        // We don't show this if they're 'connected' (see above, return null)
        <div className={"NetworkStatus" + (on_game_page ? "" : " non-game")}>
            {/* This funky little thing builds an icon that is intended to say "no wifi!",
                by superimposing a large "ban" icon over a normal sized "wifi" icon. */}
            <span className="icon">
                <i className="fa fa-2x fa-ban" />
                <i className="fa fa-wifi" />
            </span>
            {on_game_page && (
                <span>
                    {(state === "timeout" || null) && _("Slow internet")}
                    {(state === "disconnected" || null) && _("Disconnected")}
                </span>
            )}
        </div>
    );
}
