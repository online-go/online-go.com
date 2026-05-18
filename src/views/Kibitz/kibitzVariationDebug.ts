/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

type KibitzVariationDebugWindow = Window &
    typeof globalThis & {
        debug?: {
            kibitz_variation?: boolean;
        };
    };

function kibitzVariationDebugEnabled(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const debugWindow = window as KibitzVariationDebugWindow;
    if (debugWindow.debug?.kibitz_variation) {
        return true;
    }

    const stored = debugWindow.localStorage?.getItem("ogs.debug.kibitz_variation");
    return stored === "true" || stored === "1";
}

function formatKibitzVariationDebugMessage(message: string): string {
    return `[kibitz_variation] ${message}`;
}

export function logKibitzVariationDebug(message: string, details?: unknown): void {
    if (!kibitzVariationDebugEnabled()) {
        return;
    }

    console.log(formatKibitzVariationDebugMessage(message), details);
}

export function warnKibitzVariationDebug(message: string, details?: unknown): void {
    console.warn(formatKibitzVariationDebugMessage(message), details);
}
