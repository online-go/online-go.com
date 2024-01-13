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

interface Dimensions {
    height?: number;
    width?: number;
}

type RefProxy<T extends HTMLElement = any> = {
    (node: T | null): void;
    current?: T | null;
};

export function useResizeDetector<T extends HTMLElement = any>(): {
    height?: number;
    width?: number;
    ref: RefProxy<T>;
} {
    const [size, setSize] = React.useState<Dimensions>({});
    const [refElement, setRefElement] = React.useState<T | null>(null);

    const refProxy: RefProxy<T> = React.useMemo(
        () =>
            new Proxy(
                (node: T) => {
                    if (node !== refElement) {
                        setRefElement(node);
                    }
                },
                {
                    get(target: any, prop: string) {
                        if (prop === "current") {
                            return refElement;
                        }
                        return target[prop];
                    },
                    set(target, prop, value) {
                        if (prop === "current") {
                            setRefElement(value);
                        } else {
                            target[prop] = value;
                        }
                        return true;
                    },
                },
            ),
        [refElement],
    );

    React.useEffect(() => {
        if (window.ResizeObserver && refElement) {
            let debounce: ReturnType<typeof setTimeout> | null = null;
            let doOnResizeAgain = false;

            const onResize = (entry: ResizeObserverEntry) => {
                console.log({
                    width: entry?.contentRect?.width,
                    height: entry?.contentRect?.height,
                });
                setSize({ width: entry?.contentRect?.width, height: entry?.contentRect?.height });
            };

            const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
                if (debounce) {
                    doOnResizeAgain = true;
                } else {
                    onResize(entries[0]);
                    debounce = setTimeout(() => {
                        if (doOnResizeAgain) {
                            onResize(entries[0]);
                        }
                        debounce = null;
                        doOnResizeAgain = false;
                    }, 1);
                }
            });
            if (refElement) {
                observer.observe(refElement);
            }
            return () => {
                if (debounce) {
                    clearTimeout(debounce);
                }
                if (refElement) {
                    observer.unobserve(refElement);
                }
                observer.disconnect();
            };
        }

        return;
    }, [refElement]);

    return { ref: refProxy, ...size };
}
