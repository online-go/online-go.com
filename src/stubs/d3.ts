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

// Mock d3 for tests
export const select = jest.fn(() => ({
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    ease: jest.fn().mockReturnThis(),
}));

export const scaleLinear = jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
}));

export const scaleTime = jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
}));

export const line = jest.fn(() => ({
    x: jest.fn().mockReturnThis(),
    y: jest.fn().mockReturnThis(),
}));

export const area = jest.fn(() => ({
    x: jest.fn().mockReturnThis(),
    y0: jest.fn().mockReturnThis(),
    y1: jest.fn().mockReturnThis(),
}));

export const axisBottom = jest.fn(() => ({
    scale: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
}));

export const axisLeft = jest.fn(() => ({
    scale: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
}));

export const format = jest.fn((_specifier: string) => (value: any) => String(value));

export const timeFormat = jest.fn((_specifier: string) => (value: any) => String(value));

export const extent = jest.fn(() => [0, 100]);

export const max = jest.fn((array: any[]) => Math.max(...array));

export const min = jest.fn((array: any[]) => Math.min(...array));

export const bisector = jest.fn(() => ({
    left: jest.fn(() => 0),
}));

export const brush = jest.fn(() => ({
    extent: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
}));

export const zoom = jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
}));

export const event = {
    transform: { x: 0, y: 0, k: 1 },
};

export default {
    select,
    scaleLinear,
    scaleTime,
    line,
    area,
    axisBottom,
    axisLeft,
    format,
    timeFormat,
    extent,
    max,
    min,
    bisector,
    brush,
    zoom,
    event,
};
