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

export function NetworkStatus(): JSX.Element {
    const [hidden, setHidden] = React.useState(true);

    React.useEffect(() => {
        const show = () => setHidden(false);
        const hide = () => setHidden(true);

        socket.on("latency", hide);
        socket.on("timeout", show);
        socket.on("disconnect", show);

        return () => {
            socket.off("latency", hide);
            socket.off("timeout", show);
            socket.off("disconnect", show);
        };
    }, []);

    return (
        <div className={"NetworkStatus" + (hidden ? " hidden" : "")}>
            <i className="fa fa-2x fa-ban" />
            <i className="fa fa-wifi" />
        </div>
    );
}
