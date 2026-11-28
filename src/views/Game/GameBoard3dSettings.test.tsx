/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { act, fireEvent, render, screen } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import { GameBoard3dSettings } from "./GameBoard3dSettings";

describe("GameBoard3dSettings", () => {
    afterEach(() => {
        preferences.set("board-renderer-3d", false);
        preferences.set("board-renderer-3d-rotation", 0);
    });

    it("shows the 3D options only while 3D is on", () => {
        preferences.set("board-renderer-3d", false);
        render(<GameBoard3dSettings />);
        expect(screen.queryByRole("group")).toBeNull();

        act(() => preferences.set("board-renderer-3d", true));
        expect(screen.getByRole("group")).toBeTruthy();
        expect(screen.getByLabelText("Style")).toBeTruthy();
        expect(screen.getByLabelText("Table and bowls")).toBeTruthy();
        expect(screen.queryByText("Studio")).toBeNull();
    });

    it("rotates the view a quarter turn at a time", () => {
        preferences.set("board-renderer-3d", true);
        preferences.set("board-renderer-3d-rotation", 270);
        render(<GameBoard3dSettings />);
        fireEvent.click(screen.getByRole("button", { name: "Rotate the view a quarter turn" }));
        expect(preferences.get("board-renderer-3d-rotation")).toBe(0);
    });

    it("turns V and drag on by default", () => {
        expect(preferences.defaults["board-renderer-3d-mouse-orbit"]).toBe(true);
    });
});
