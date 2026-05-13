/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import { KibitzPresetChangePendingBanner } from "./KibitzPresetChangePendingBanner";

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
}));

describe("KibitzPresetChangePendingBanner", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-11T12:00:00Z"));
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it("renders the remaining seconds rounded up", () => {
        const effectiveAt = new Date("2026-05-11T12:00:18Z").toISOString();
        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(screen.getByText(/Switching to a new game in 18s/)).toBeInTheDocument();
    });

    it("counts down each second", () => {
        const effectiveAt = new Date("2026-05-11T12:00:20Z").toISOString();
        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(screen.getByText(/20s/)).toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText(/19s/)).toBeInTheDocument();
    });

    it("renders 'switching...' text once the deadline passes", () => {
        const effectiveAt = new Date("2026-05-11T11:59:59Z").toISOString();
        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(screen.getByText(/Switching/)).toBeInTheDocument();
        expect(screen.queryByText(/\d+s/)).toBeNull();
    });
});
