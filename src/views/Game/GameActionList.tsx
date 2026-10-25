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
import { GameAction } from "./GameAction";
import { GameActionRow } from "./GameActionRow";

/** The labelled list of game actions given to GobanView as `actionDock`:
 *  the actions with a `dockOrder`, in that order. It renders the rows with
 *  no wrapper: GobanView lays them out as the dock or as the list at the
 *  end of the mobile scroll. */
export function GameActionList({ actions }: { actions: GameAction[] }): React.ReactElement {
    return (
        <>
            {actions
                .filter((a): a is GameAction & { dockOrder: number } => a.dockOrder !== undefined)
                .sort((a, b) => a.dockOrder - b.dockOrder)
                .map((a) => (
                    <GameActionRow key={a.id} action={a} />
                ))}
        </>
    );
}
