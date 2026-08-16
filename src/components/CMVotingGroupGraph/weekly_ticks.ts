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

// The most dated labels that fit across these graphs without colliding.  They are
// as narrow as a graph in a table cell, so this is a tighter budget than a full
// width chart would allow.
export const MAX_WEEKLY_TICKS = 10;

/**
 * The `tickValues` interval for a weekly x-axis covering `period` days.
 *
 * The graphs plot one point per week, so ticks land on week boundaries.  Labelling
 * every week stops fitting once the period runs past a couple of months, so longer
 * periods label every second week, every third, and so on.
 */
export function weeklyTickInterval(period: number): string {
    const weeks = Math.ceil(period / 7);
    const every = Math.max(1, Math.ceil(weeks / MAX_WEEKLY_TICKS));

    return every === 1 ? "every week" : `every ${every} weeks`;
}
