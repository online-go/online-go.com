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
import { WaitTime } from "./WaitTime";
import { waitBucket } from "./wait_time";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    interpolate: (s: string, p: Record<string, unknown>) =>
        s.replace(/{{(\w+)}}/g, (_m, k) => String(p[k])),
    ngettext: (s: string, p: string, n: number) => (n === 1 ? s : p),
}));

test("buckets follow the 24, 36 and 48 hour thresholds", () => {
    expect(waitBucket(0)).toBe("fresh");
    expect(waitBucket(23.9)).toBe("fresh");
    expect(waitBucket(24)).toBe("aging");
    expect(waitBucket(36)).toBe("late");
    expect(waitBucket(48)).toBe("overdue");
});

test("shows hours under a day and days from a day on, with the bucket class", () => {
    const now = Date.now();
    const threeHours = new Date(now - 3 * 3600 * 1000).toISOString();
    const { container, rerender } = render(<WaitTime since={threeHours} now={now} />);
    expect(container.querySelector(".WaitTime.wait-fresh")).toHaveTextContent("3 hours");
    const twoDays = new Date(now - 50 * 3600 * 1000).toISOString();
    rerender(<WaitTime since={twoDays} now={now} />);
    expect(container.querySelector(".WaitTime.wait-overdue")).toHaveTextContent("2 days");
});
