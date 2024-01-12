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

import React from "react";
import { useDroppable, UniqueIdentifier } from "@dnd-kit/core";
import classNames from "classnames";

import { droppable } from "./droppable-svg";

interface Props {
    children: React.ReactNode;
    dragging: boolean;
    id: UniqueIdentifier;
}

export function Droppable({ children, id, dragging }: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                "Droppable",
                isOver && "over",
                dragging && "dragging",
                children && "dropped",
            )}
            aria-label="Droppable region"
        >
            {children}
            {droppable}
        </div>
    );
}
