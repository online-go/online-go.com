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

class Device {
    is_mobile: boolean;
    width: number;
    height: number;

    constructor() {
        this.height = screen.height;
        this.width = screen.width;
        this.is_mobile = this.width < 600;
    }
}

export default new Device();

let em10_width: number | undefined;
let document_body_width = window.innerWidth || document.body.clientWidth;
// on resize, we need to recompute the display width
window.addEventListener("resize", () => {
    //document_body_width = document.body.clientWidth;
    document_body_width = window.innerWidth || document.body.clientWidth;
    em10_width = undefined;
    if (!em10_width) {
        em10_width = parseInt(getComputedStyle(document.documentElement).fontSize, 10) * 10;
    }
});

export function getWindowWidth(): number {
    return document_body_width;
    //return $(window).width() || document_body_width;
}

export function getEm10Width(): number {
    if (!em10_width) {
        em10_width = parseInt(getComputedStyle(document.documentElement).fontSize, 10) * 10;
    }
    return em10_width;
}
