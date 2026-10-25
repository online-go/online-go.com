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

/**
 * The content width of an element, kept current with a ResizeObserver.
 * Before the first measurement, and where ResizeObserver is missing, it
 * is the window width. The element is read after every render, so an
 * element that mounts after the first render is still observed.
 */
export function useRootWidth(ref: React.RefObject<HTMLElement | null>): number {
    const [width, setWidth] = React.useState(() => window.innerWidth || 1);
    const [element, setElement] = React.useState<HTMLElement | null>(null);

    React.useLayoutEffect(() => {
        if (ref.current !== element) {
            setElement(ref.current);
        }
    });

    React.useLayoutEffect(() => {
        if (!element || typeof ResizeObserver !== "function") {
            const onResize = () => setWidth(window.innerWidth || 1);
            window.addEventListener("resize", onResize);
            return () => window.removeEventListener("resize", onResize);
        }
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;
            if (rect && rect.width > 0 && rect.height > 0) {
                setWidth(Math.round(rect.width));
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);

    return width;
}
