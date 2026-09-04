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

import { selectVisibleTabs, TabBarSlot } from "./util";

interface Tab extends TabBarSlot {
    id: string;
}

const BUTTON = 40;
const GAP = 8;

const settings: Tab = { id: "settings", align: "left" };
const analyze: Tab = { id: "analyze", align: "left" };
const estimate: Tab = { id: "estimate", align: "left", priority: 3 };
const undo: Tab = { id: "undo", align: "center" };
const link: Tab = { id: "link", align: "right", priority: 2 };
const info: Tab = { id: "info", align: "right", priority: 1 };
const more: Tab = { id: "more", align: "right" };

const tabs = [settings, analyze, estimate, undo, link, info, more];

/** Width of `n` buttons in one group. */
const group = (n: number) => n * BUTTON + (n - 1) * GAP;

const ids = (result: Tab[]) => result.map((t) => t.id);

describe("selectVisibleTabs", () => {
    test("shows every tab when the bar cannot be measured", () => {
        expect(ids(selectVisibleTabs(tabs, 0, 0, GAP))).toEqual(ids(tabs));
    });

    test("always shows the required tabs, even with no room", () => {
        expect(ids(selectVisibleTabs(tabs, 0, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "undo",
            "more",
        ]);
    });

    test("shows all tabs when everything fits", () => {
        const width = group(3) + group(1) + group(3);
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual(ids(tabs));
    });

    test("drops the lowest priority tab first", () => {
        const width = group(3) + group(1) + group(3) - 1;
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "estimate",
            "undo",
            "link",
            "more",
        ]);
    });

    test("keeps the highest priority tab when only one fits", () => {
        const width = group(3) + group(1) + group(1);
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "estimate",
            "undo",
            "more",
        ]);
    });

    test("keeps the order of the input", () => {
        const reordered = [info, more, link, settings, estimate, analyze, undo];
        const width = group(3) + group(1) + group(3);
        expect(ids(selectVisibleTabs(reordered, width, BUTTON, GAP))).toEqual(ids(reordered));
    });
});
