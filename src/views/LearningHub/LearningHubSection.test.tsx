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

// ./sections must load before ./LearningHubSection. Loading the base class
// first starts a circular import in which the section classes extend it
// before it is defined.
import "./sections";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import * as data from "@/lib/data";
import { LearningHubSection } from "./LearningHubSection";
import { LearningPageProperties } from "./LearningPage";

class TestSection extends LearningHubSection {}

function StubPage(props: LearningPageProperties) {
    return <div data-testid="page">{props.curPage}</div>;
}

const PAGES = Array.from({ length: 6 }, () => StubPage);

function renderSection(page: string | undefined): string | null {
    render(
        <TestSection page={page} title="Test" nextSection="" section="rules-intro" pages={PAGES} />,
    );
    return screen.getByTestId("page").textContent;
}

describe("LearningHubSection page selection", () => {
    beforeEach(() => {
        data.remove("learning-hub.rules-intro");
    });

    describe("with pages 0 and 1 completed", () => {
        beforeEach(() => {
            data.set("learning-hub.rules-intro", { 0: true, 1: true });
        });

        test.each([
            ["4It", "4"],
            ["5~~", "5"],
            ["3     poti sa vezi cum se rezolva: ca nu stiu", "3"],
            ["1.5", "1"],
        ])("uses the integer prefix of %j", (page, expected) => {
            expect(renderSection(page)).toBe(expected);
        });

        test.each([
            ["abc", "2"],
            ["-1", "2"],
            ["6", "2"],
            ["99", "2"],
        ])("falls back to the first uncompleted page for %j", (page, expected) => {
            expect(renderSection(page)).toBe(expected);
        });

        test("shows page 0 when it is requested, although it is completed", () => {
            expect(renderSection("0")).toBe("0");
        });

        test("shows the last valid page", () => {
            expect(renderSection("5")).toBe("5");
        });

        test("shows the first uncompleted page when no page is given", () => {
            expect(renderSection(undefined)).toBe("2");
        });
    });

    describe("with no progress", () => {
        test("shows page 0 when no page is given", () => {
            expect(renderSection(undefined)).toBe("0");
        });

        test("shows page 0 for a page with no number", () => {
            expect(renderSection("abc")).toBe("0");
        });
    });
});
