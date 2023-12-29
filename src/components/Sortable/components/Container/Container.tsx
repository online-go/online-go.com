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

import * as React from "react";

import { forwardRef } from "react";
import classNames from "classnames";

import { Handle, Remove } from "../Item";

export interface Props {
    children: React.ReactNode;
    columns?: number;
    label?: string;
    style?: React.CSSProperties;
    horizontal?: boolean;
    hover?: boolean;
    handleProps?: React.HTMLAttributes<any>;
    scrollable?: boolean;
    shadow?: boolean;
    placeholder?: boolean;
    unstyled?: boolean;
    fixed?: boolean;
    onClick?(): void;
    onRemove?(): void;
}

export const Container = forwardRef<HTMLDivElement, Props>(
    (
        {
            children,
            columns = 1,
            handleProps,
            horizontal,
            hover,
            onClick,
            onRemove,
            label,
            placeholder,
            style,
            scrollable,
            shadow,
            unstyled,
            fixed,
            ...props
        }: Props,
        ref,
    ) => {
        const Component = onClick ? "button" : "div";

        return (
            <Component
                {...props}
                ref={ref as (element: HTMLElement | null) => void}
                style={
                    {
                        ...style,
                        "--columns": columns,
                    } as React.CSSProperties
                }
                className={classNames(
                    "Container",
                    unstyled && "unstyled",
                    horizontal && "horizontal",
                    hover && "hover",
                    placeholder && "placeholder",
                    scrollable && "scrollable",
                    shadow && "shadow",
                )}
                onClick={onClick}
                tabIndex={onClick ? 0 : undefined}
            >
                {label ? (
                    <div className={"Header"}>
                        {label}
                        {!fixed ? (
                            <div className={"Actions"}>
                                {onRemove ? <Remove onClick={onRemove} /> : undefined}
                                <Handle {...handleProps} />
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {placeholder ? children : <ul>{children}</ul>}
            </Component>
        );
    },
);
