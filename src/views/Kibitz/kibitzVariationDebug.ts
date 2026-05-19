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
        kibitzVariationDebugLog?: KibitzVariationDebugEntry[];
        dumpKibitzVariationDebugLog?: () => void;
    };

interface KibitzVariationDebugEntry {
    sequence: number;
    timestamp: number;
    level: "log" | "warn";
    message: string;
    details?: unknown;
}

let debugSequence = 0;

export function isKibitzVariationDebugEnabled(): boolean {
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

function cloneDebugDetails(details: unknown): unknown {
    if (details == null) {
        return details;
    }

    try {
        return structuredClone(details);
    } catch {
        try {
            return JSON.parse(JSON.stringify(details)) as unknown;
        } catch {
            return details;
        }
    }
}

function recordKibitzVariationDebugEntry(
    level: KibitzVariationDebugEntry["level"],
    message: string,
    details?: unknown,
): KibitzVariationDebugEntry {
    const entry: KibitzVariationDebugEntry = {
        sequence: ++debugSequence,
        timestamp: Date.now(),
        level,
        message,
        details: cloneDebugDetails(details),
    };

    if (typeof window !== "undefined") {
        const debugWindow = window as KibitzVariationDebugWindow;
        const log = debugWindow.kibitzVariationDebugLog ?? [];
        log.push(entry);

        if (log.length > 300) {
            log.splice(0, log.length - 300);
        }

        debugWindow.kibitzVariationDebugLog = log;
        debugWindow.dumpKibitzVariationDebugLog = () => {
            console.log(JSON.stringify(debugWindow.kibitzVariationDebugLog ?? [], null, 2));
        };
    }

    return entry;
}

export function logKibitzVariationDebug(message: string, details?: unknown): void {
    if (!isKibitzVariationDebugEnabled()) {
        return;
    }

    const entry = recordKibitzVariationDebugEntry("log", message, details);
    console.log(formatKibitzVariationDebugMessage(message), entry.details);
}

export function warnKibitzVariationDebug(message: string, details?: unknown): void {
    const entry = recordKibitzVariationDebugEntry("warn", message, details);
    console.warn(formatKibitzVariationDebugMessage(message), entry.details);
}
