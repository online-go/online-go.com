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
import { PreferenceDropdown } from "./SettingsCommon";

const OPTIONS = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
];

function Harness(): React.ReactElement {
    const [, bump] = React.useState(0);
    return (
        <div>
            <button onClick={() => bump((x) => x + 1)}>rerender</button>
            <PreferenceDropdown value="a" options={OPTIONS} onChange={() => {}} />
        </div>
    );
}

/* Safari on iOS delivers touchend and the resulting click to the element
 * that was under the finger at touchstart. If a parent re-render replaces
 * the option elements while the menu is open, a tap between touchstart and
 * touchend lands on a detached node and is lost. */
test("keeps open menu option elements mounted across a parent re-render", () => {
    const { container } = render(<Harness />);
    const control = container.querySelector(".ogs-react-select__control");
    if (!control) {
        throw new Error("control not rendered");
    }
    fireEvent.mouseDown(control, { button: 0 });
    const option = screen.getByText("Beta");
    expect(option.classList.contains("PreferenceDropdown-option")).toBe(true);

    fireEvent.click(screen.getByText("rerender"));

    expect(document.body.contains(option)).toBe(true);
    expect(screen.getByText("Beta")).toBe(option);
});
