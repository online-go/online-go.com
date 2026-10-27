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
import { AvailabilityNotice } from "./AvailabilityNotice";
import { fetchConfig } from "./api";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
}));
jest.mock("./api", () => ({
    fetchConfig: jest.fn(),
}));

const mockedFetchConfig = fetchConfig as jest.MockedFunction<typeof fetchConfig>;

async function renderWith(cfg: { enabled: boolean; available: boolean }) {
    mockedFetchConfig.mockResolvedValue({ ...cfg, min_reviewer_rank: 15 });
    const result = render(<AvailabilityNotice />);
    await act(async () => {
        await Promise.resolve();
    });
    return result;
}

test("says nothing while live", async () => {
    const { container } = await renderWith({ enabled: true, available: true });
    expect(container.querySelector(".AvailabilityNotice")).toBeNull();
});

test("tells a moderator the feature is dark", async () => {
    const { container } = await renderWith({ enabled: false, available: true });
    expect(container.querySelector(".AvailabilityNotice")).toHaveTextContent("dark");
});

test("tells an ordinary player the feature is not open", async () => {
    const { container } = await renderWith({ enabled: false, available: false });
    expect(container.querySelector(".AvailabilityNotice")).toHaveTextContent("not open");
});
