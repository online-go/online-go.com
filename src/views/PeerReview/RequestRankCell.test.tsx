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
import { RequestRankCell } from "./RequestRankCell";

test("a professional ranking renders as a pro rank, not a dan rank", () => {
    const { container } = render(<RequestRankCell rank={37} professional />);
    expect(container.textContent).toBe("1p");
});

test("an amateur rank renders with tenths and the provisional marker", () => {
    const { container } = render(<RequestRankCell rank={25.3} provisional />);
    expect(container.textContent).toBe("4.7k?");
});
