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

import { render } from "@testing-library/react";
import * as React from "react";
import { GameKeyboardShortcutsModal } from "./GameKeyboardShortcutsModal";
import { GAME_KEYBOARD_SHORTCUT_GROUPS, shortcutKeyNames } from "./game_keyboard_shortcuts";

test("lists every shortcut the Game page binds", () => {
    const { container } = render(<GameKeyboardShortcutsModal />);

    const rows = container.querySelectorAll("tbody tr");
    const expected = GAME_KEYBOARD_SHORTCUT_GROUPS.flatMap((group) => group.shortcuts);
    expect(rows.length).toBe(expected.length);

    for (const entry of expected) {
        const description = Array.from(container.querySelectorAll(".shortcut-description")).find(
            (el) => el.textContent === entry.description(),
        );
        expect(description).toBeDefined();
    }
});

test("renders modifier combinations as separate key caps", () => {
    const { container } = render(<GameKeyboardShortcutsModal />);

    const row = Array.from(container.querySelectorAll("tbody tr")).find(
        (tr) => tr.querySelector(".shortcut-description")?.textContent === "Toggle zen mode",
    );
    expect(row).toBeDefined();

    const keys = Array.from(row!.querySelectorAll("kbd")).map((kbd) => kbd.textContent);
    expect(keys).toEqual(["Shift", "Z"]);
});

test("shortcutKeyNames maps tokens to readable names", () => {
    expect(shortcutKeyNames("page-up")).toEqual(["Page Up"]);
    expect(shortcutKeyNames("ctrl-c")).toEqual(["Ctrl", "C"]);
    expect(shortcutKeyNames("f10")).toEqual(["F10"]);
    expect(shortcutKeyNames("escape")).toEqual(["Esc"]);
});
