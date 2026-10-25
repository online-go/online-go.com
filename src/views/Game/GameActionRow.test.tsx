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
import { GameAction } from "./GameAction";
import { GameActionRow } from "./GameActionRow";
import { UndoIcon } from "./UndoIcon";

function action(overrides: Partial<GameAction>): GameAction {
    return {
        id: "a",
        icon: "info",
        label: "Info",
        bar: null,
        kind: "action",
        ...overrides,
    } as GameAction;
}

// Host containers (the dock, the mobile list, the "..." menu) size the
// row's first child as its icon and clip the label. They must not reach
// into a composite icon such as UndoIcon, so the icon is one element and the
// label is a separate, marked element.
test("a composite icon is the row's single first child, before the label", () => {
    const { container } = render(
        <GameActionRow
            action={action({ icon: <UndoIcon badge="question" />, label: "Request undo" })}
        />,
    );
    const row = container.querySelector(".GameActionRow")!;
    expect(row.children).toHaveLength(2);
    const [icon, label] = Array.from(row.children);
    expect(icon).toHaveClass("UndoIcon");
    expect(icon.querySelector(".fa-undo")).not.toBeNull();
    expect(icon.querySelector(".UndoIcon-badge.fa-question")).not.toBeNull();
    expect(label).toHaveClass("GameActionRow-label");
    expect(label.textContent).toBe("Request undo");
});

test("a Font Awesome icon is the row's first child, before the label", () => {
    const { container } = render(<GameActionRow action={action({ icon: "gear" })} />);
    const row = container.querySelector(".GameActionRow")!;
    const [icon, label] = Array.from(row.children);
    expect(icon.tagName).toBe("I");
    expect(icon).toHaveClass("fa", "fa-gear");
    expect(label).toHaveClass("GameActionRow-label");
});
