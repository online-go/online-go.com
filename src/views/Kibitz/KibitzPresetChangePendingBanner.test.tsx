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
        expect(screen.getByText(/Next game in 0:18/)).toBeInTheDocument();
    });

    it("counts down each second", () => {
        const effectiveAt = new Date("2026-05-11T12:00:20Z").toISOString();
        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(screen.getByText(/0:20/)).toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText(/0:19/)).toBeInTheDocument();
    });

    it("stops the interval after the deadline passes", () => {
        const setIntervalSpy = jest.spyOn(window, "setInterval");
        const clearIntervalSpy = jest.spyOn(window, "clearInterval");
        const effectiveAt = new Date("2026-05-11T12:00:01Z").toISOString();

        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
        expect(screen.getByText(/Waiting for the next game/)).toBeInTheDocument();

        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });

    it("renders a waiting message once the deadline passes", () => {
        const effectiveAt = new Date("2026-05-11T11:59:59Z").toISOString();
        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);
        expect(screen.getByText(/Waiting for the next game/)).toBeInTheDocument();
        expect(screen.queryByText(/\d+s/)).toBeNull();
    });

    it("updates when the server changes the deadline", () => {
        const { rerender } = render(
            <KibitzPresetChangePendingBanner changeEffectiveAt="2026-05-11T12:00:10Z" />,
        );
        expect(screen.getByText(/0:10/)).toBeInTheDocument();
        rerender(<KibitzPresetChangePendingBanner changeEffectiveAt="2026-05-11T12:00:30Z" />);
        expect(screen.getByText(/0:30/)).toBeInTheDocument();
    });

    it("does not show a countdown for an invalid deadline", () => {
        render(<KibitzPresetChangePendingBanner changeEffectiveAt="invalid" />);
        expect(screen.queryByRole("timer")).toBeNull();
    });

    it("does not create an interval when the deadline is already past", () => {
        const setIntervalSpy = jest.spyOn(window, "setInterval");
        const effectiveAt = new Date("2026-05-11T11:59:59Z").toISOString();

        render(<KibitzPresetChangePendingBanner changeEffectiveAt={effectiveAt} />);

        expect(setIntervalSpy).not.toHaveBeenCalled();

        setIntervalSpy.mockRestore();
    });
});
