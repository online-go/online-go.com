/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";

test("renders nothing when the variation is not on the board", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={null} />);
    expect(container).toBeEmptyDOMElement();
});

test("exposes the colour index so the swatch can be identified", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={2} />);
    const swatch = container.querySelector(".KibitzVariationSwatch");
    expect(swatch).not.toBeNull();
    expect(swatch?.getAttribute("data-color-index")).toBe("2");
});

test("ignores an index outside the colour list", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={99} />);
    expect(container).toBeEmptyDOMElement();
});
