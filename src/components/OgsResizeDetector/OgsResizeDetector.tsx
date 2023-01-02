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
import ReactResizeDetector from "react-resize-detector";
import { TypedEventEmitter } from "TypedEventEmitter";

interface Events {
    resize: void;
}

const resize_emitter = new TypedEventEmitter<Events>();

if (!window.ResizeObserver) {
    window.onresize = () => {
        resize_emitter.emit("resize");
    };
}

/**
 * Some OGS users have browsers (mostly Safari <12) that don't support
 * ResizeObserver. This class is a wrapper that calls based on a change of
 * window size (which should only happen on orientation changes for mobile
 * devices, I think). It's not a perfect solution as it doesn't detect resizes
 * stemming from dom reflows, but it's better than nothing and is probably good
 * enough.
 */
export function OgsResizeDetector(props: ReactResizeDetector["props"]): JSX.Element {
    React.useEffect(() => {
        if (window.ResizeObserver) {
            return;
        }

        let debounce = null;

        const cb = () => {
            if (!debounce) {
                debounce = setTimeout(() => {
                    debounce = null;
                    props.onResize();
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
    }, []);

    if (window.ResizeObserver) {
        return <ReactResizeDetector {...props} />;
    }

    return <React.Fragment />;
}
