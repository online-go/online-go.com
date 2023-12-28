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

import React, { useEffect } from "react";
import classNames from "classnames";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";

import { Handle, Remove } from "./components";

export interface Props {
    dragOverlay?: boolean;
    color?: string;
    disabled?: boolean;
    dragging?: boolean;
    handle?: boolean;
    handleProps?: any;
    _height?: number; // came with example code, but appears to be not implemented, so renamed _
    index?: number;
    fadeIn?: boolean;
    transform?: Transform | null;
    listeners?: DraggableSyntheticListeners;
    sorting?: boolean;
    style?: React.CSSProperties;
    transition?: string | null;
    wrapperStyle?: React.CSSProperties;
    value: React.ReactNode;
    onRemove?(): void;
    renderItem?(args: {
        dragOverlay: boolean;
        dragging: boolean;
        sorting: boolean;
        index: number | undefined;
        fadeIn: boolean;
        listeners: DraggableSyntheticListeners;
        ref: React.Ref<HTMLElement>;
        style: React.CSSProperties | undefined;
        transform: Props["transform"];
        transition: Props["transition"];
        value: Props["value"];
    }): React.ReactElement;
}

export const Item = React.memo(
    React.forwardRef<HTMLLIElement, Props>(
        (
            {
                color,
                dragOverlay,
                dragging,
                disabled,
                fadeIn,
                handle,
                handleProps,
                _height,
                index,
                listeners,
                onRemove,
                renderItem,
                sorting,
                style,
                transition,
                transform,
                value,
                wrapperStyle,
                ...props
            },
            ref,
        ) => {
            useEffect(() => {
                if (!dragOverlay) {
                    return;
                }

                document.body.style.cursor = "grabbing";

                return () => {
                    document.body.style.cursor = "";
                };
            }, [dragOverlay]);

            return renderItem ? (
                renderItem({
                    dragOverlay: Boolean(dragOverlay),
                    dragging: Boolean(dragging),
                    sorting: Boolean(sorting),
                    index,
                    fadeIn: Boolean(fadeIn),
                    listeners,
                    ref,
                    style,
                    transform,
                    transition,
                    value,
                })
            ) : (
                <li
                    className={classNames(
                        "Wrapper",
                        fadeIn && "fadeIn",
                        sorting && "sorting",
                        dragOverlay && "dragOverlay",
                    )}
                    style={
                        {
                            ...wrapperStyle,
                            transition: [transition, wrapperStyle?.transition]
                                .filter(Boolean)
                                .join(", "),
                            "--translate-x": transform ? `${Math.round(transform.x)}px` : undefined,
                            "--translate-y": transform ? `${Math.round(transform.y)}px` : undefined,
                            "--scale-x": transform?.scaleX ? `${transform.scaleX}` : undefined,
                            "--scale-y": transform?.scaleY ? `${transform.scaleY}` : undefined,
                            "--index": index,
                            "--color": color,
                        } as React.CSSProperties
                    }
                    ref={ref}
                >
                    <div
                        className={classNames(
                            "Item",
                            dragging && "dragging",
                            handle && "withHandle",
                            dragOverlay && "dragOverlay",
                            disabled && "disabled",
                            color && "color",
                        )}
                        style={style}
                        data-cypress="draggable-item"
                        {...(!handle ? listeners : undefined)}
                        {...props}
                        tabIndex={!handle ? 0 : undefined}
                    >
                        <span className={"Actions"}>
                            {onRemove ? <Remove className={"Remove"} onClick={onRemove} /> : null}
                            {handle ? <Handle {...handleProps} {...listeners} /> : null}
                        </span>
                        {value}
                    </div>
                </li>
            );
        },
    ),
);
