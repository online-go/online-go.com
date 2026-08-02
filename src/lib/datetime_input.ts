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

/* `<input type="datetime-local">` carries no timezone: its value is a local
 * wall-clock string of the form YYYY-MM-DDTHH:mm. These helpers convert between
 * that format and Date, staying in local time throughout. Callers convert to UTC
 * at the point they send a value to the server. */

function pad(value: number, length: number): string {
    return String(value).padStart(length, "0");
}

/** Formats a Date for an `<input type="datetime-local">` value.
 *  An invalid Date yields "", which renders the input empty. */
export function toDatetimeLocalValue(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
    const time = `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`;

    return `${day}T${time}`;
}

/** Parses an `<input type="datetime-local">` value as local wall-clock time.
 *  An empty value, or one that cannot be parsed, yields undefined, which both
 *  callers treat as "no date chosen". */
export function fromDatetimeLocalValue(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
}
