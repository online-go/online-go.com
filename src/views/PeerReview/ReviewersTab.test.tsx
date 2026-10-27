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
import { ReviewersTab } from "./ReviewersTab";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (_c: string, s: string) => s,
    interpolate: (s: string, p: Record<string, unknown>) =>
        s.replace(/{{(\w+)}}/g, (_m, k) => String(p[k])),
}));
jest.mock("@/components/PaginatedTable", () => ({
    PaginatedTable: (props: { orderBy: string[] }) => (
        <div data-testid="table" data-order={props.orderBy[0]} />
    ),
}));

test("sort buttons flip direction and remount the table with the new order", () => {
    render(<ReviewersTab />);
    expect(screen.getByTestId("table").getAttribute("data-order")).toBe("-completed");
    fireEvent.click(screen.getByRole("button", { name: /Score/ }));
    expect(screen.getByTestId("table").getAttribute("data-order")).toBe("-score");
    fireEvent.click(screen.getByRole("button", { name: /Score/ }));
    expect(screen.getByTestId("table").getAttribute("data-order")).toBe("score");
});
