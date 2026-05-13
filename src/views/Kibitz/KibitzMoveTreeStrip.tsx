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
import { Resizable } from "@/components/Resizable";
import { GobanController } from "@/lib/GobanController";
import "./KibitzMoveTreeStrip.css";

interface KibitzMoveTreeStripProps {
    controller: GobanController | null;
    layoutKey: string;
}

export function KibitzMoveTreeStrip({
    controller,
    layoutKey,
}: KibitzMoveTreeStripProps): React.ReactElement | null {
    const [moveTreeContainer, setMoveTreeContainer] = React.useState<Resizable | null>(null);
    const previousControllerRef = React.useRef<GobanController | null>(null);

    React.useEffect(() => {
        const previousController = previousControllerRef.current;
        const container = moveTreeContainer?.div ?? null;

        if (previousController && previousController !== controller) {
            previousController.setMoveTreeContainer(null);
        }

        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        if (controller && container) {
            controller.setMoveTreeContainer(moveTreeContainer);
            const redrawFrame = window.requestAnimationFrame(() => {
                controller.goban.move_tree_redraw(true);
            });

            previousControllerRef.current = controller;

            return () => {
                window.cancelAnimationFrame(redrawFrame);
                controller.setMoveTreeContainer(null);
            };
        }

        previousControllerRef.current = controller;

        return () => {
            if (controller) {
                controller.setMoveTreeContainer(null);
            }
        };
    }, [controller, layoutKey, moveTreeContainer]);

    const handleMoveTreeContainerRef = React.useCallback((instance: Resizable | null) => {
        setMoveTreeContainer(instance);
    }, []);

    if (!controller) {
        return null;
    }

    return (
        <Resizable
            id="kibitz-mobile-compare-tree-strip"
            className="KibitzMoveTreeStrip"
            onResize={() => controller.goban.move_tree_redraw(true)}
            ref={handleMoveTreeContainerRef}
        />
    );
}
