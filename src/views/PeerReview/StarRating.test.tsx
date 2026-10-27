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
import { StarRating } from "./StarRating";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (_c: string, s: string) => s,
    interpolate: (s: string, p: Record<string, unknown>) =>
        s.replace(/{{(\w+)}}/g, (_m, k) => String(p[k])),
}));

test("clicking a star reports its value and marks stars up to it", () => {
    const onChange = jest.fn();
    render(<StarRating value={2} onChange={onChange} />);
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    expect(stars[1]).toBeChecked();
    fireEvent.click(stars[3]);
    expect(onChange).toHaveBeenCalledWith(4);
});

test("read-only renders no inputs and shows the value", () => {
    const { container } = render(<StarRating value={3} readOnly />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(container.querySelectorAll(".StarRating .star.filled")).toHaveLength(3);
});
