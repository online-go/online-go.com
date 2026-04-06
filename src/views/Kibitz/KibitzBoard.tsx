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
import type { KibitzWatchedGame } from "@/models/kibitz";
import "./KibitzBoard.css";

interface KibitzBoardProps {
    gameId?: number;
    json?: KibitzWatchedGame["mock_game_data"];
    className?: string;
    onReady?: (controller: GobanController | null) => void;
}

type KibitzBoardConfig = Partial<GobanRendererConfig> &
    NonNullable<KibitzWatchedGame["mock_game_data"]>;

export function KibitzBoard({
    gameId,
    json,
    className,
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
        const configJson = json as KibitzBoardConfig | undefined;
        const themes = preferences.getSelectedThemes();
        const config: GobanRendererConfig = {
            board_div: gobanDiv.current,
            interactive: false,
            connect_to_chat: false,
            draw_top_labels: labelPosition === "all" || labelPosition.indexOf("top") >= 0,
            draw_left_labels: labelPosition === "all" || labelPosition.indexOf("left") >= 0,
            draw_right_labels: labelPosition === "all" || labelPosition.indexOf("right") >= 0,
            draw_bottom_labels: labelPosition === "all" || labelPosition.indexOf("bottom") >= 0,
            variation_stone_opacity: preferences.get("variation-stone-opacity"),
            stone_font_scale: preferences.get("stone-font-scale"),
            square_size: "auto",
            game_id: gameId,
            width: configJson?.width ?? 19,
            height: configJson?.height ?? 19,
            ...(configJson ?? {}),
        };

        controllerRef.current?.destroy();
        controllerRef.current = new GobanController(config);
        (controllerRef.current.goban as any).setTheme(
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
    }, [gameId, json, onReady]);

    return (
        <div className={"KibitzBoard" + (className ? ` ${className}` : "")}>
            {goban ? <GobanContainer goban={goban} /> : null}
        </div>
    );
}
