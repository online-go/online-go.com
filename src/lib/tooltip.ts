/*
 * Copyright (C) 2012-2020  Online-Go.com
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

let current_tooltip = null;

function clearTooltip() {
    if (current_tooltip) {
        current_tooltip.remove();
        current_tooltip = null;
    }
}

export default function tooltip(event) {
    const target = $(event.target);
    const title = target.attr("title") || target.attr("data-title");
    const X = event.nativeEvent.pageX + 10;
    const Y = event.nativeEvent.pageY + 10;

    if (event.type === "click") {
        if (current_tooltip) {
            clearTooltip();
        } else {
            current_tooltip = $("<div class='ogs-tooltip'>").text(title).css({ left: X, top: Y });
            $("body").append(current_tooltip);
        }
    } else if (event.type === "mouseover") {
        clearTooltip();
        current_tooltip = $("<div class='ogs-tooltip'>").text(title).css({ left: X, top: Y });
        $("body").append(current_tooltip);
    } else if (event.type === "mouseout") {
        clearTooltip();
    } else if (event.type === "mousemove") {
        if (current_tooltip) {
            current_tooltip.css({ left: X, top: Y });
        }
    } else {
        console.warn("Unhandled event type: ", event.type);
    }
}
