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
import { GobanRendererConfig } from "goban";
import { GobanContainer } from "@/components/GobanContainer/GobanContainer";
import { GobanController } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import "./KibitzBoard.css";

interface KibitzBoardProps {
    gameId?: number;
    width?: number;
    height?: number;
    className?: string;
    size?: number;
    interactive?: boolean;
    showLabels?: boolean;
    fitMode?: "native" | "contain";
    respectContainerBounds?: boolean;
    onReady?: (controller: GobanController | null) => void;
}

export function KibitzBoard({
    gameId,
    width = 19,
    height = 19,
    className,
    size,
    interactive = false,
    showLabels = true,
    fitMode = "native",
    respectContainerBounds = false,
    onReady,
}: KibitzBoardProps): React.ReactElement {
    const gobanDiv = React.useRef<HTMLDivElement>(
        (() => {
            const element = document.createElement("div");
            element.className = "Goban";
            return element;
        })(),
    );
    const controllerRef = React.useRef<GobanController | null>(null);
    const [goban, setGoban] = React.useState<GobanController["goban"] | null>(null);

    React.useEffect(() => {
        const labelPosition = preferences.get("label-positioning");
        const themes = preferences.getSelectedThemes();
        const config: GobanRendererConfig = {
            board_div: gobanDiv.current,
            interactive,
            connect_to_chat: false,
            draw_top_labels:
                showLabels && (labelPosition === "all" || labelPosition.indexOf("top") >= 0),
            draw_left_labels:
                showLabels && (labelPosition === "all" || labelPosition.indexOf("left") >= 0),
            draw_right_labels:
                showLabels && (labelPosition === "all" || labelPosition.indexOf("right") >= 0),
            draw_bottom_labels:
                showLabels && (labelPosition === "all" || labelPosition.indexOf("bottom") >= 0),
            variation_stone_opacity: preferences.get("variation-stone-opacity"),
            stone_font_scale: preferences.get("stone-font-scale"),
            square_size: "auto",
            game_id: gameId,
            width,
            height,
        };

        controllerRef.current?.destroy();
        controllerRef.current = new GobanController(config);
        controllerRef.current.goban.setTheme(
            {
                ...themes,
                board: "Kaya",
            },
            false,
        );
        gobanDiv.current.style.setProperty("background-color", "#DCB35C", "important");
        gobanDiv.current.style.setProperty("background-image", "none", "important");
        gobanDiv.current.style.setProperty("box-shadow", "none", "important");
        setGoban(controllerRef.current.goban);
        onReady?.(controllerRef.current);

        return () => {
            onReady?.(null);
            controllerRef.current?.destroy();
            controllerRef.current = null;
            setGoban(null);
        };
    }, [gameId, width, height, interactive, onReady, showLabels]);

    return (
        <div
            className={"KibitzBoard" + (className ? ` ${className}` : "")}
            style={
                size
                    ? {
                          width: `${size}px`,
                          height: `${size}px`,
                          flex: "0 0 auto",
                      }
                    : undefined
            }
        >
            {goban ? (
                <GobanContainer
                    goban={goban}
                    verticalAlign="top"
                    sizingMode={respectContainerBounds ? "min" : "width"}
                    fitMode={fitMode}
                    respectContainerBounds={respectContainerBounds}
                />
            ) : null}
        </div>
    );
}
