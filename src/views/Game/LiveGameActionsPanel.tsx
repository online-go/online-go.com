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
import { GameActionsArgs, useGameActions } from "./useGameActions";
import { GameActionsPanel } from "./GameActionsPanel";

interface LiveGameActionsPanelProps {
    args: GameActionsArgs;
    onClose?: () => void;
}

/**
 * The "..." menu as shown in its popover. popover() renders in a separate
 * React root, so a list of actions made in the game page would be a copy
 * from the moment the menu opened. This runs useGameActions inside the
 * popover root, so the rows that follow the goban (undo requests, resign
 * or cancel) stay live while the menu is open.
 */
export function LiveGameActionsPanel({
    args,
    onClose,
}: LiveGameActionsPanelProps): React.ReactElement {
    const actions = useGameActions(args);
    return <GameActionsPanel actions={actions} onClose={onClose} />;
}
