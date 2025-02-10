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

import React from "react";
import { EventEmitter } from "eventemitter3";

interface Events {
    resize: () => void;
}

const resize_emitter = new EventEmitter<Events>();

if (!window.ResizeObserver) {
    window.onresize = () => {
        resize_emitter.emit("resize");
    };
}

interface OgsResizeDetectorProps {
    onResize: () => void;
    targetRef: React.RefObject<HTMLElement | null>;
}

/**
 * Some OGS users have browsers (mostly Safari <12) that don't support
 * ResizeObserver. This class is a wrapper that calls based on a change of
 * window size (which should only happen on orientation changes for mobile
 * devices, I think). It's not a perfect solution as it doesn't detect resizes
 * stemming from dom reflows, but it's better than nothing and is probably good
 * enough.
 */
export function OgsResizeDetector(props: OgsResizeDetectorProps): React.ReactElement {
    React.useEffect(() => {
        let width = -1;
        let height = -1;

        if (window.ResizeObserver) {
            const t = props.targetRef.current;
            let debounce: ReturnType<typeof setTimeout> | null = null;
            let doOnResizeAgain = false;

            const observer = new ResizeObserver(() => {
                if (props.onResize) {
                    const new_width = props.targetRef.current?.offsetWidth ?? window.innerWidth;
                    const new_height = props.targetRef.current?.offsetHeight ?? window.innerHeight;

                    if (new_width === width && new_height === height) {
                        return;
                    }

                    width = new_width;
                    height = new_height;

                    if (debounce) {
                        doOnResizeAgain = true;
                    } else {
                        props.onResize();
                        debounce = setTimeout(() => {
                            if (doOnResizeAgain) {
                                props.onResize();
                            }
                            debounce = null;
                            doOnResizeAgain = false;
                        }, 1);
                    }
                }
            });
            if (props.targetRef.current) {
                observer.observe(props.targetRef.current);
            }
            return () => {
                if (debounce) {
                    clearTimeout(debounce);
                }
                if (t) {
                    observer.unobserve(t);
                }
                observer.disconnect();
            };
        } else {
            // No ResizeObserver
            let debounce: ReturnType<typeof setTimeout> | null = null;

            const cb = () => {
                if (!debounce) {
                    debounce = setTimeout(() => {
                        debounce = null;
                        if (props.onResize) {
                            props.onResize();
                        }
                    }, 50);
                }
            };

            resize_emitter.on("resize", cb);
            return () => {
                if (debounce) {
                    clearTimeout(debounce);
                }
                resize_emitter.off("resize", cb);
            };
        }
    }, [props.onResize, props.targetRef.current]);

    return <React.Fragment />;
}
