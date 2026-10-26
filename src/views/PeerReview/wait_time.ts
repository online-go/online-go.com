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

import { interpolate, ngettext } from "@/lib/translate";

export type WaitBucket = "fresh" | "aging" | "late" | "overdue";

/** Colour band for a wait, at the owner's 24, 36 and 48 hour thresholds. */
export function waitBucket(hours: number): WaitBucket {
    if (hours < 24) {
        return "fresh";
    }
    if (hours < 36) {
        return "aging";
    }
    if (hours < 48) {
        return "late";
    }
    return "overdue";
}

/** "3 hours" under a day, "2 days" from a day on. */
export function waitLabel(hours: number): string {
    if (hours < 24) {
        const h = Math.floor(hours);
        return interpolate(ngettext("{{count}} hour", "{{count}} hours", h), { count: h });
    }
    const d = Math.floor(hours / 24);
    return interpolate(ngettext("{{count}} day", "{{count}} days", d), { count: d });
}

export function hoursSince(iso: string, now: number = Date.now()): number {
    return Math.max(0, (now - new Date(iso).getTime()) / 3600000);
}
