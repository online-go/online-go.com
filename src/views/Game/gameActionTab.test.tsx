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

import { GobanViewTab } from "@/components/GobanView";
import { BarAction, gameActionTab } from "./gameActionTab";

const base: BarAction = {
    id: "game-info",
    icon: "info",
    label: "Game information",
    bar: { align: "right", order: 20, priority: 1 },
    menuOrder: 300,
    dockOrder: 60,
    kind: "action",
    onClick: () => undefined,
};

test("an action becomes an action tab with its title, align and priority", () => {
    const el = gameActionTab(base);
    expect(el.type).toBe(GobanViewTab);
    expect(el.props).toMatchObject({
        id: "game-info",
        type: "action",
        align: "right",
        priority: 1,
        title: "Game information",
    });
});

test("a toggle becomes a toggle tab that holds its panel", () => {
    const el = gameActionTab(
        {
            ...base,
            id: "game-moderator",
            kind: "toggle",
            defaultVisible: true,
            bar: { align: "right", order: 30 },
        },
        "panel",
    );
    expect(el.props).toMatchObject({ type: "toggle", defaultVisible: true, children: "panel" });
});
