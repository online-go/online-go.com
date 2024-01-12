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

import React, { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { DragOverlay, useDndContext } from "@dnd-kit/core";
import type { DropAnimation } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Draggable } from "./Draggable";

const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
        return [
            { transform: CSS.Transform.toString(transform.initial) },
            {
                transform: CSS.Transform.toString({
                    ...transform.final,
                    scaleX: 0.94,
                    scaleY: 0.94,
                }),
            },
        ];
    },
    sideEffects({ active, dragOverlay }) {
        active.node.style.opacity = "0";

        const button = dragOverlay.node.querySelector("button");

        if (button) {
            button.animate(
                [
                    {
                        boxShadow:
                            "-1px 0 15px 0 rgba(34, 33, 81, 0.01), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)",
                    },
                    {
                        boxShadow:
                            "-1px 0 15px 0 rgba(34, 33, 81, 0), 0px 15px 15px 0 rgba(34, 33, 81, 0)",
                    },
                ],
                {
                    duration: 250,
                    easing: "ease",
                    fill: "forwards",
                },
            );
        }

        return () => {
            active.node.style.opacity = "";
        };
    },
};

interface Props {
    axis?: ComponentProps<typeof Draggable>["axis"];
    dropAnimation?: DropAnimation | null;
}

export function DraggableOverlay({ axis, dropAnimation = dropAnimationConfig }: Props) {
    const { active } = useDndContext();

    return createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
            {active ? <Draggable axis={axis} dragging dragOverlay /> : null}
        </DragOverlay>,
        document.body,
    );
}
