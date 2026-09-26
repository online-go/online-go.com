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

import * as React from "react";

/* Matches $hamburger-cutoff in 00_constants.css */
const HAMBURGER_MEDIA_QUERY = "(max-width: 900px)";

/* A swipe that opens the menu must start this close to the left edge. */
const EDGE_ZONE_PX = 32;

/* Horizontal travel needed before the swipe takes effect. */
const SWIPE_DISTANCE_PX = 60;

/**
 * Opens the mobile menu with a swipe to the right that starts at the left
 * edge of the screen, and closes it with a swipe to the left. Only active
 * at the hamburger width. Touches that another handler has consumed (for
 * example the board's draw tool, which calls preventDefault) are ignored.
 */
export function useMenuSwipe(open: boolean, setOpen: (open: boolean) => void): void {
    const open_ref = React.useRef(open);
    const set_open_ref = React.useRef(setOpen);
    open_ref.current = open;
    set_open_ref.current = setOpen;

    React.useEffect(() => {
        let start: { x: number; y: number } | null = null;

        const onTouchStart = (ev: TouchEvent) => {
            start = null;
            if (ev.touches.length !== 1 || !window.matchMedia(HAMBURGER_MEDIA_QUERY).matches) {
                return;
            }
            const touch = ev.touches[0];
            if (!open_ref.current && touch.clientX > EDGE_ZONE_PX) {
                return;
            }
            start = { x: touch.clientX, y: touch.clientY };
        };

        const onTouchMove = (ev: TouchEvent) => {
            if (!start) {
                return;
            }
            if (ev.defaultPrevented || ev.touches.length !== 1) {
                start = null;
                return;
            }
            const touch = ev.touches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) < SWIPE_DISTANCE_PX) {
                return;
            }
            if (Math.abs(dx) > 2 * Math.abs(dy)) {
                if (!open_ref.current && dx > 0) {
                    set_open_ref.current(true);
                } else if (open_ref.current && dx < 0) {
                    set_open_ref.current(false);
                }
            }
            start = null;
        };

        const onTouchEnd = () => {
            start = null;
        };

        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("touchcancel", onTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchcancel", onTouchEnd);
        };
    }, []);
}
