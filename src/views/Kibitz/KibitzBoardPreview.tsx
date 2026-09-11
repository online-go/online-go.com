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
import type { GobanRendererConfig, MoveTreeJson } from "goban";
import { GobanContainer } from "@/components/GobanContainer";
import { GobanController } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import { labelConfig } from "./useKibitzGobans";
import "./KibitzBoardPreview.css";

interface KibitzBoardPreviewProps {
    /** Identifies which game is being previewed. Not used to connect to a
     *  live game -- callers that already have `moveTree` data render it
     *  directly, and callers without it get a blank board. */
    gameId?: number;
    width?: number;
    height?: number;
    moveTree?: MoveTreeJson;
    /** Encoded move path (see `GobanEngine.followPath`) to jump to once
     *  `moveTree` has loaded. */
    movePath?: string;
    showLabels?: boolean;
    /** Fixed pixel size for a thumbnail. When omitted, the board fills its
     *  container. */
    size?: number;
    fitMode?: "native" | "contain";
    className?: string;
}

/**
 * A small, non-interactive, non-connected board used for previews: a
 * proposed game's thumbnail, an expanded proposal preview, or the game
 * picker's board preview. Renders `moveTree` statically -- it never opens a
 * socket connection to a live game.
 */
export function KibitzBoardPreview({
    gameId,
    width = 19,
    height = 19,
    moveTree,
    movePath,
    showLabels = true,
    size,
    fitMode = "native",
    className,
}: KibitzBoardPreviewProps): React.ReactElement {
    const [controller, setController] = React.useState<GobanController | null>(null);

    React.useEffect(() => {
        const config: GobanRendererConfig = {
            board_div: document.createElement("div"),
            interactive: false,
            connect_to_chat: false,
            ...labelConfig(showLabels),
            variation_stone_opacity: preferences.get("variation-stone-opacity"),
            last_move_opacity: preferences.get("last-move-opacity"),
            stone_font_scale: preferences.get("stone-font-scale"),
            square_size: "auto",
            move_tree: moveTree,
            width,
            height,
        };
        const next = new GobanController(config);

        const jumpToMovePath = () => {
            if (!movePath) {
                return;
            }
            next.goban.engine.followPath(0, movePath);
            next.goban.redraw(true);
        };

        next.goban.on("load", jumpToMovePath);
        jumpToMovePath();
        setController(next);

        return () => {
            next.goban.off("load", jumpToMovePath);
            next.destroy();
            setController(null);
        };
    }, [gameId, width, height, moveTree, movePath, showLabels]);

    const style: React.CSSProperties | undefined = size
        ? { width: `${size}px`, height: `${size}px`, flex: "0 0 auto" }
        : undefined;

    return (
        <div
            className={"KibitzBoardPreview" + (className ? ` ${className}` : "")}
            data-testid="KibitzBoardPreview"
            data-game-id={gameId}
            style={style}
        >
            {controller ? (
                <GobanContainer goban={controller.goban} fitMode={fitMode} respectContainerBounds />
            ) : null}
        </div>
    );
}
