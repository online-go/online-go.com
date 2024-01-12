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

// Code sourced from react-dndkit-multiple-containers example
// https://codesandbox.io/p/sandbox/react-dndkit-multiple-containers-6wydy9?file=%2Fsrc%2Fexamples%2FSortable%2FMultipleContainers.tsx%3A240%2C1

import React, { forwardRef } from "react";
import classNames from "classnames";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";

import { Handle } from "../Item/components/Handle";

import { draggable, draggableHorizontal, draggableVertical } from "./draggable-svg";

export enum Axis {
    All,
    Vertical,
    Horizontal,
}

interface Props {
    axis?: Axis;
    dragOverlay?: boolean;
    dragging?: boolean;
    handle?: boolean;
    label?: string;
    listeners?: DraggableSyntheticListeners;
    style?: React.CSSProperties;
    buttonStyle?: React.CSSProperties;
    transform?: Transform | null;
}

export const Draggable = forwardRef<HTMLButtonElement, Props>(function Draggable(
    {
        axis,
        dragOverlay,
        dragging,
        handle,
        label,
        listeners,
        transform,
        style,
        buttonStyle,
        ...props
    },
    ref,
) {
    return (
        <div
            className={classNames(
                "Draggable",
                dragOverlay && "dragOverlay",
                dragging && "dragging",
                handle && "handle",
            )}
            style={
                {
                    ...style,
                    "--translate-x": `${transform?.x ?? 0}px`,
                    "--translate-y": `${transform?.y ?? 0}px`,
                } as React.CSSProperties
            }
        >
            <button
                {...props}
                aria-label="Draggable"
                data-cypress="draggable-item"
                {...(handle ? {} : listeners)}
                tabIndex={handle ? -1 : undefined}
                ref={ref}
                style={buttonStyle}
            >
                {axis === Axis.Vertical
                    ? draggableVertical
                    : axis === Axis.Horizontal
                      ? draggableHorizontal
                      : draggable}
                {handle ? <Handle {...(handle ? listeners : {})} /> : null}
            </button>
            {label ? <label>{label}</label> : null}
        </div>
    );
});
