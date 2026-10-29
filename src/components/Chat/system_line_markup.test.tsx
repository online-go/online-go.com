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
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { system_line_markup } from "./system_line_markup";

function renderLine(text: string, links?: unknown[]) {
    return render(
        <MemoryRouter>
            <div data-testid="line">{system_line_markup(text, links)}</div>
        </MemoryRouter>,
    );
}

test("links the named span and keeps the rest of the line", () => {
    renderLine("The watched game changed to Alice vs Bob", [
        { text: "Alice vs Bob", href: "/game/1050" },
    ]);

    expect(screen.getByRole("link", { name: "Alice vs Bob" })).toHaveAttribute(
        "href",
        "/game/1050",
    );
    expect(screen.getByTestId("line")).toHaveTextContent(
        "The watched game changed to Alice vs Bob",
    );
});

test("refuses links that leave the site", () => {
    renderLine("Go to Alice vs Bob now", [
        { text: "Alice vs Bob", href: "https://example.com/" },
        { text: "now", href: "//example.com/" },
    ]);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("line")).toHaveTextContent("Go to Alice vs Bob now");
});

test("leaves the line as text when the link text is not in it", () => {
    renderLine("The game was cancelled", [{ text: "Alice vs Bob", href: "/game/1050" }]);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("line")).toHaveTextContent("The game was cancelled");
});

test("links several spans in the order they appear", () => {
    renderLine("Alice won by Resignation in Alice vs Bob", [
        { text: "Alice vs Bob", href: "/game/1050" },
        { text: "Alice", href: "/player/7" },
    ]);

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/player/7", "/game/1050"]);
    expect(screen.getByTestId("line")).toHaveTextContent(
        "Alice won by Resignation in Alice vs Bob",
    );
});
