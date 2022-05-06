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

import * as React from "react";
import { notification_manager } from "Notifications";
import { Experiment, Variant, Default } from "Experiment";

export function TurnIndicator(): JSX.Element {
    const [count, setCount] = React.useState(0);
    const [total, setTotal] = React.useState(0);

    React.useEffect(() => {
        notification_manager.event_emitter.on("turn-count", setCount);
        notification_manager.event_emitter.on("total-count", setTotal);

        return () => {
            notification_manager.event_emitter.off("turn-count", setCount);
            notification_manager.event_emitter.off("total-count", setTotal);
        };
    }, []);

    return (
        <Experiment name="v6">
            <Variant value="enabled">
                <span
                    className="TurnIndicatorV6"
                    onAuxClick={(e) => notification_manager.advanceToNextBoard(e)}
                    onClick={(e) => notification_manager.advanceToNextBoard(e)}
                >
                    <i className={`ogs-goban ${count > 0 ? "active" : ""}`} />
                    <span className="count">{count}</span>
                </span>
            </Variant>
            <Default>
                <span
                    className="TurnIndicator"
                    onAuxClick={(e) => notification_manager.advanceToNextBoard(e)}
                    onClick={(e) => notification_manager.advanceToNextBoard(e)}
                >
                    <span
                        className={
                            total > 0 ? (count > 0 ? "active count" : "inactive count") : "count"
                        }
                    >
                        <span>{count}</span>
                    </span>
                </span>
            </Default>
        </Experiment>
    );
}
