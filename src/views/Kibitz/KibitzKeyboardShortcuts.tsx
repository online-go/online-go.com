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
import { generateGobanHook, useGobanController } from "@/components/GobanView";
import { getGameKeyboardShortcutGroup } from "@/views/Game/game_keyboard_shortcuts";

const NAVIGATION = getGameKeyboardShortcutGroup("navigation");

const useMode = generateGobanHook((goban) => goban?.mode ?? "play", ["mode"]);

/**
 * Move navigation keys for the board in the center: the Game page's
 * Navigation group, bound to whichever controller the center shows. Rendered
 * inside GobanView so it can read that controller from context.
 */
export function KibitzKeyboardShortcuts(): React.ReactElement {
    const controller = useGobanController();
    // Rebuilt when the mode changes so `when` guards are re-evaluated.
    const mode = useMode(controller.goban);
    const bindings = React.useMemo(
        () =>
            NAVIGATION.shortcuts
                .filter((entry) => !entry.when || entry.when(controller))
                .map((entry) => ({
                    shortcut: entry.shortcut,
                    action: () => entry.action(controller),
                })),
        [controller, mode],
    );
    return (
        <>
            {bindings.map(({ shortcut, action }) => (
                <KBShortcut key={shortcut} shortcut={shortcut} action={action} />
            ))}
        </>
    );
}
