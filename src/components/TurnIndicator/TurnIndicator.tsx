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
import { notification_manager } from "@/components/Notifications";

export function TurnIndicator(): React.ReactElement {
    const [count, setCount] = React.useState<number | undefined>(0);
    const [total, setTotal] = React.useState<number | undefined>(0);

    React.useEffect(() => {
        notification_manager.event_emitter.on("turn-count", setCount);
        notification_manager.event_emitter.on("total-count", setTotal);

        return () => {
            notification_manager.event_emitter.off("turn-count", setCount);
            notification_manager.event_emitter.off("total-count", setTotal);
        };
    }, []);

    return (
        <span
            className="TurnIndicator"
            onAuxClick={(e) => notification_manager.advanceToNextBoard(e)}
            onClick={(e) => notification_manager.advanceToNextBoard(e)}
        >
            <span
                className={
                    (total || 0) > 0
                        ? (count || 0) > 0
                            ? "active count"
                            : "inactive count"
                        : "count"
                }
            >
                <span>{count}</span>
            </span>
        </span>
    );
}
