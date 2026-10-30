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
import { RankRangeSlider } from "./RankRangeSlider";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (_c: string, s: string) => s,
    interpolate: (s: string, p: Record<string, unknown>) =>
        s.replace(/{{(\w+)}}/g, (_m, k) => String(p[k])),
}));

test("handles cannot cross and stay inside the allowed range", () => {
    const onChange = jest.fn();
    render(
        <RankRangeSlider min={10} max={20} allowedMin={5} allowedMax={26} onChange={onChange} />,
    );
    const [weakest, strongest] = screen.getAllByRole("slider") as HTMLInputElement[];
    expect(weakest.min).toBe("5");
    expect(strongest.max).toBe("26");
    fireEvent.change(weakest, { target: { value: "25" } });
    expect(onChange).toHaveBeenLastCalledWith(20, 20);
    fireEvent.change(strongest, { target: { value: "8" } });
    expect(onChange).toHaveBeenLastCalledWith(10, 10);
});
