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

import { getEm10Width, isTouchOnlyDevice, onTouchOnlyDeviceChange } from "./device";

type Listener = (ev: { matches: boolean }) => void;

function installMatchMedia(matches: boolean) {
    const listeners: Listener[] = [];
    const matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: (_: string, cb: Listener) => listeners.push(cb),
        removeEventListener: (_: string, cb: Listener) => {
            const i = listeners.indexOf(cb);
            if (i >= 0) {
                listeners.splice(i, 1);
            }
        },
    }));
    Object.defineProperty(window, "matchMedia", { configurable: true, value: matchMedia });
    return { matchMedia, listeners };
}

afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    document.documentElement.style.fontSize = "";
    document.getElementById("em10")?.remove();
});

function installEm10Probe(offsetWidth: number) {
    const probe = document.createElement("div");
    probe.id = "em10";
    Object.defineProperty(probe, "offsetWidth", { configurable: true, value: offsetWidth });
    document.body.appendChild(probe);
}

test("getEm10Width measures the em probe, so a clamped minimum font size does not inflate it", () => {
    // Chromium reports the clamped size through getComputedStyle while
    // em and rem lengths keep the unclamped size.
    document.documentElement.style.fontSize = "20px";
    installEm10Probe(160);

    expect(getEm10Width()).toBe(160);
});

test("getEm10Width follows a root font-size change that fires no resize event", () => {
    document.documentElement.style.fontSize = "20px";
    expect(getEm10Width()).toBe(200);

    document.documentElement.style.fontSize = "16px";
    expect(getEm10Width()).toBe(160);
});

test("assumes a keyboard when matchMedia is unavailable", () => {
    expect(isTouchOnlyDevice()).toBe(false);
    expect(typeof onTouchOnlyDeviceChange(() => {})).toBe("function");
});

test("reports touch-only devices from the hover and pointer media query", () => {
    const { matchMedia } = installMatchMedia(true);
    expect(isTouchOnlyDevice()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith("(any-hover: none) and (any-pointer: coarse)");

    installMatchMedia(false);
    expect(isTouchOnlyDevice()).toBe(false);
});

test("notifies when a pointing device is attached and stops after unsubscribe", () => {
    const { listeners } = installMatchMedia(true);
    const callback = jest.fn();
    const unsubscribe = onTouchOnlyDeviceChange(callback);

    expect(listeners).toHaveLength(1);
    listeners[0]({ matches: false });
    expect(callback).toHaveBeenCalledWith(false);

    unsubscribe();
    expect(listeners).toHaveLength(0);
});
