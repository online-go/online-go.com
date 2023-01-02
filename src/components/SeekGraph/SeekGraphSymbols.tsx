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

import { ChallengePointStyle } from "./SeekGraphPalettes";

/**  Draws a square centered on the point (x,y) */
export function drawChallengeSquare(
    x: number,
    y: number,
    size: number,
    style: ChallengePointStyle,
    ctx: CanvasRenderingContext2D,
) {
    ctx.save();
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    const sx = x - size / 2;
    const sy = y - size / 2;
    ctx.fillRect(sx, sy, size, size);
    ctx.strokeRect(sx, sy, size, size);
    ctx.restore();
}

/**  Draws a circle centered on the point (x,y) */
export function drawChallengeCircle(
    x: number,
    y: number,
    radius: number,
    style: ChallengePointStyle,
    ctx: CanvasRenderingContext2D,
) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

/** Draws an equilateral triangle with side length 'size', centered vertically inside the square with side length 'size' centered on the point (x,y) */
export function drawChallengeTriangle(
    x: number,
    y: number,
    size: number,
    style: ChallengePointStyle,
    ctx: CanvasRenderingContext2D,
) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    // The difference in height between a unit square and a unit equilateral triangle is (2 - √3) / 2
    // split this evenly to get ~0.067
    const margin = 0.067 * size;
    const s = size / 2;
    ctx.moveTo(x, y - s + margin);
    ctx.lineTo(x + s, y + s - margin);
    ctx.lineTo(x - s, y + s - margin);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

/** Draws a rounded rectangle centered on the point (x,y) */
// Based on https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
export function drawLegendKey(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    style: ChallengePointStyle,
    ctx: CanvasRenderingContext2D,
) {
    const tx = x - width / 2;
    const ty = y - height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tx + radius, ty);
    ctx.lineTo(tx + width - radius, ty);
    ctx.quadraticCurveTo(tx + width, ty, tx + width, ty + radius);
    ctx.lineTo(tx + width, ty + height - radius);
    ctx.quadraticCurveTo(tx + width, ty + height, tx + width - radius, ty + height);
    ctx.lineTo(tx + radius, ty + height);
    ctx.quadraticCurveTo(tx, ty + height, tx, ty + height - radius);
    ctx.lineTo(tx, ty + radius);
    ctx.quadraticCurveTo(tx, ty, tx + radius, ty);
    ctx.closePath();
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
