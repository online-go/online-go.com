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
import { KBShortcut } from "@/components/KBShortcut";
import { useGobanController } from "@/components/GobanView";
import type { GobanController } from "@/lib/GobanController";

const NAVIGATION_SHORTCUTS: ReadonlyArray<{
    shortcut: string;
    action: (controller: GobanController) => void;
}> = [
    { shortcut: "left", action: (c) => c.previousMove() },
    { shortcut: "right", action: (c) => c.nextMove() },
    { shortcut: "page-up", action: (c) => c.previous10Moves() },
    { shortcut: "page-down", action: (c) => c.forwardTenMoves() },
    { shortcut: "home", action: (c) => c.gotoFirstMove() },
    { shortcut: "end", action: (c) => c.gotoLastMove() },
    { shortcut: "up", action: (c) => c.nextBranchUp() },
    { shortcut: "down", action: (c) => c.nextBranchDown() },
];

/**
 * Move navigation keys for the board in the center, the same bindings the
 * Game page uses. Rendered inside GobanView so it binds to whichever
 * controller the center shows.
 */
export function KibitzKeyboardShortcuts(): React.ReactElement {
    const controller = useGobanController();
    return (
        <>
            {NAVIGATION_SHORTCUTS.map(({ shortcut, action }) => (
                <KBShortcut key={shortcut} shortcut={shortcut} action={() => action(controller)} />
            ))}
        </>
    );
}
