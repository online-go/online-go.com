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
import { act, render } from "@testing-library/react";
import * as data from "@/lib/data";
import type { ConfigSchema } from "@/lib/data_schema";
import { AvailabilityNotice } from "./AvailabilityNotice";

/** The peer review block arrives bundled inside the main ui/config object. */
function setConfig(cfg: { enabled: boolean; available: boolean }) {
    data.set("config", {
        peer_review: { ...cfg, min_reviewer_rank: 15 },
    } as Partial<ConfigSchema> as ConfigSchema);
}

beforeEach(() => {
    data.remove("config");
});

test("says nothing until the config has loaded", () => {
    const { container } = render(<AvailabilityNotice />);
    expect(container.querySelector(".AvailabilityNotice")).toBeNull();
});

test("says nothing while live", () => {
    setConfig({ enabled: true, available: true });
    const { container } = render(<AvailabilityNotice />);
    expect(container.querySelector(".AvailabilityNotice")).toBeNull();
});

test("tells a moderator the feature is dark", () => {
    setConfig({ enabled: false, available: true });
    const { container } = render(<AvailabilityNotice />);
    expect(container.querySelector(".AvailabilityNotice")).toHaveTextContent("dark");
});

test("tells an ordinary player the feature is not open", () => {
    setConfig({ enabled: false, available: false });
    const { container } = render(<AvailabilityNotice />);
    expect(container.querySelector(".AvailabilityNotice")).toHaveTextContent("not open");
});

test("follows a config refresh after mounting", () => {
    const { container } = render(<AvailabilityNotice />);
    act(() => setConfig({ enabled: false, available: false }));
    expect(container.querySelector(".AvailabilityNotice")).toHaveTextContent("not open");
});
