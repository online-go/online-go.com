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

type KibitzBoardSizeDebugWindow = Window &
    typeof globalThis & {
        debug?: unknown;
        __kibitzBoardSizeRing?: Array<Record<string, unknown>>;
    };

let kibitzBoardSizeSequence = 0;

function cloneDebugDetails(details: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!details) {
        return {};
    }

    try {
        return structuredClone(details) as Record<string, unknown>;
    } catch {
        try {
            return JSON.parse(JSON.stringify(details)) as Record<string, unknown>;
        } catch {
            return details;
        }
    }
}

export function isKibitzBoardSizeDebugEnabled(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const debugWindow = window as KibitzBoardSizeDebugWindow;
    const debugConfig = debugWindow.debug as
        | {
              kibitz_board_size?: boolean;
          }
        | undefined;
    if (debugConfig?.kibitz_board_size === true) {
        return true;
    }

    const stored = debugWindow.localStorage?.getItem("ogs.debug.kibitz_board_size");
    return stored === "1";
}

export function isKibitzBoardSizeVerboseDebugEnabled(): boolean {
    if (!isKibitzBoardSizeDebugEnabled() || typeof window === "undefined") {
        return false;
    }

    const debugWindow = window as KibitzBoardSizeDebugWindow;
    const debugConfig = debugWindow.debug as
        | {
              kibitz_board_size_verbose?: boolean;
          }
        | undefined;
    if (debugConfig?.kibitz_board_size_verbose === true) {
        return true;
    }

    const stored = debugWindow.localStorage?.getItem("ogs.debug.kibitz_board_size.verbose");
    return stored === "1";
}

export function getKibitzElementMetrics(
    element: HTMLElement | null,
): Record<string, unknown> | null {
    if (!element) {
        return null;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return {
        rectLeft: rect.left,
        rectTop: rect.top,
        rectWidth: rect.width,
        rectHeight: rect.height,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        transform: style.transform,
        position: style.position,
        display: style.display,
        overflow: style.overflow,
    };
}

export function recordKibitzBoardSizeEvent(
    message: string,
    details: Record<string, unknown> = {},
): void {
    if (!isKibitzBoardSizeDebugEnabled() || typeof window === "undefined") {
        return;
    }

    const debugWindow = window as KibitzBoardSizeDebugWindow;
    const ring = debugWindow.__kibitzBoardSizeRing ?? [];
    ring.push({
        sequence: ++kibitzBoardSizeSequence,
        timestamp: Date.now(),
        message,
        ...cloneDebugDetails(details),
    });

    while (ring.length > 400) {
        ring.shift();
    }

    debugWindow.__kibitzBoardSizeRing = ring;
    // DevTools helper: copy(window.__kibitzBoardSizeRing)
}
