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
import { render } from "@testing-library/react";
import * as preferences from "@/lib/preferences";

// The live board preview is irrelevant to these tests (it needs a full goban
// renderer); stub it so we only exercise the settings controls.
jest.mock("@/components/MiniGoban", () => ({
    MiniGoban: () => null,
}));

import { AccessibilityPreferences } from "./AccessibilityPreferences";

describe("AccessibilityPreferences", () => {
    afterEach(() => {
        preferences.set("accessibility.last-move-crosshair", false);
    });

    test("color and thickness controls are hidden when the crosshair is disabled", () => {
        preferences.set("accessibility.last-move-crosshair", false);
        const { container } = render(<AccessibilityPreferences />);
        expect(container.querySelector('input[type="color"]')).toBeNull();
        expect(container.querySelector('input[type="range"]')).toBeNull();
    });

    test("color and thickness controls are shown when the crosshair is enabled", () => {
        preferences.set("accessibility.last-move-crosshair", true);
        const { container } = render(<AccessibilityPreferences />);
        expect(container.querySelector('input[type="color"]')).not.toBeNull();
        expect(container.querySelector('input[type="range"]')).not.toBeNull();
    });
});
