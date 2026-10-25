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
import "./GameSidebarPanels.css";

interface GameActionsPanelProps {
    /** The game actions; the panel shows the ones with a `menuOrder`. */
    actions: GameAction[];
    /** The panel is shown in a popover; each row closes it after it runs. */
    onClose?: () => void;
}

/** The "..." menu: the actions with a `menuOrder`, in that order. A divider
 *  follows the last row of each `menuSection`. */
export function GameActionsPanel({ actions, onClose }: GameActionsPanelProps): React.ReactElement {
    const rows = actions
        .filter((a): a is GameAction & { menuOrder: number } => a.menuOrder !== undefined)
        .sort((a, b) => a.menuOrder - b.menuOrder);
    return (
        <div className="GameSidebarPanel GameActionsPanel">
            {rows.map((a, i) => {
                const next = rows[i + 1];
                const divider = !!a.menuSection && !!next && next.menuSection !== a.menuSection;
                return (
                    <React.Fragment key={a.id}>
                        <GameActionRow action={a} onDone={onClose} />
                        {divider && <hr />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
