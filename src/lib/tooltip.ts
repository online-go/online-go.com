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

let current_tooltip: HTMLElement | undefined;

function clearTooltip() {
    if (current_tooltip) {
        current_tooltip.remove();
        current_tooltip = undefined;
    }
}

export default function tooltip(event: React.MouseEvent | React.TouchEvent) {
    const target = event.target as HTMLElement;
    const title = target.getAttribute("title") || target.getAttribute("data-title");
    const X = (event.nativeEvent as any).pageX + 10;
    const Y = (event.nativeEvent as any).pageY + 10;

    if (event.type === "click") {
        if (current_tooltip) {
            clearTooltip();
        } else {
            current_tooltip = document.createElement("div");
            current_tooltip.className = "ogs-tooltip";
            current_tooltip.textContent = title || "";
            current_tooltip.style.left = `${X}px`;
            current_tooltip.style.top = `${Y}px`;
            document.body.appendChild(current_tooltip);
        }
    } else if (event.type === "mouseover") {
        clearTooltip();
        current_tooltip = document.createElement("div");
        current_tooltip.className = "ogs-tooltip";
        current_tooltip.textContent = title || "";
        current_tooltip.style.left = `${X}px`;
        current_tooltip.style.top = `${Y}px`;
        document.body.appendChild(current_tooltip);
    } else if (event.type === "mouseout") {
        clearTooltip();
    } else if (event.type === "mousemove") {
        if (current_tooltip) {
            current_tooltip.style.left = `${X}px`;
            current_tooltip.style.top = `${Y}px`;
        }
    } else {
        console.warn("Unhandled event type: ", event.type);
    }
}
