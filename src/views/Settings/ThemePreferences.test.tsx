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
import { fireEvent, render, screen } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import { ThemePreferences } from "./ThemePreferences";

jest.mock("@/components/MiniGoban", () => ({ MiniGoban: () => null }));
jest.mock("@/components/GobanThemePicker", () => ({
    GobanBlackThemePicker: () => null,
    GobanWhiteThemePicker: () => null,
    GobanBoardThemePicker: () => null,
    GobanCustomBoardPicker: () => null,
    GobanCustomWhitePicker: () => null,
    GobanCustomBlackPicker: () => null,
}));
jest.mock("./GobanThemeImportExport", () => ({ GobanThemeImportExport: () => null }));

describe("layout pickers", () => {
    afterEach(() => {
        preferences.set("goban-view-action-buttons", "bar");
        preferences.set("game.chat-column", false);
        preferences.set("goban-view-mobile-scroll", false);
        preferences.set("goban-view-move-controls", "docked");
        preferences.set("goban-view-board-alignment", "container");
    });

    test("all five layout settings show as pickers", () => {
        render(<ThemePreferences />);
        for (const name of [
            "Action buttons",
            "Chat column",
            "Scrolling layout",
            "Move controls",
            "Board alignment",
        ]) {
            expect(screen.getByRole("radiogroup", { name })).not.toBeNull();
        }
    });

    test("the pickers show in the order action buttons, move controls, chat column, scrolling layout, board alignment", () => {
        render(<ThemePreferences />);
        const names = screen
            .getAllByRole("radiogroup")
            .map((group) => group.getAttribute("aria-labelledby"))
            .map((id) => document.getElementById(id!)?.textContent);
        expect(names).toEqual([
            "Action buttons",
            "Move controls",
            "Chat column",
            "Scrolling layout",
            "Board alignment",
        ]);
    });

    test("the move controls picker uses the desktop drawings", () => {
        render(<ThemePreferences />);
        const group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group.querySelectorAll("svg.wide")).toHaveLength(2);
    });

    test("each picker stores its preference", () => {
        render(<ThemePreferences />);

        fireEvent.click(screen.getByRole("radio", { name: "Right side" }));
        fireEvent.click(screen.getByRole("radio", { name: "Left column" }));
        fireEvent.click(screen.getByRole("radio", { name: "Scrolls" }));
        fireEvent.click(screen.getByRole("radio", { name: "Under the board" }));
        fireEvent.click(screen.getByRole("radio", { name: "Center with sidebar" }));

        expect(preferences.get("goban-view-action-buttons")).toBe("dock");
        expect(preferences.get("game.chat-column")).toBe(true);
        expect(preferences.get("goban-view-mobile-scroll")).toBe(true);
        expect(preferences.get("goban-view-move-controls")).toBe("under-board");
        expect(preferences.get("goban-view-board-alignment")).toBe("group");
    });

    test("board alignment is no longer a dropdown", () => {
        render(<ThemePreferences />);
        // The picker's own title is visually hidden (sr-only) since the
        // wrapping PreferenceLine shows the title instead.
        const titles = screen.getAllByText("Board alignment");
        const visible_titles = titles.filter((title) => !title.classList.contains("sr-only"));
        expect(visible_titles).toHaveLength(1);
        expect(visible_titles[0]).toHaveClass("PreferenceLineTitle");
    });
});
