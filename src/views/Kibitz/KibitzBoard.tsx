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
import { GobanRendererConfig, type MoveTree, type MoveTreeJson } from "goban";
import { GobanContainer } from "@/components/GobanContainer/GobanContainer";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
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
    moveTree?: MoveTreeJson;
    movePath?: string;
    onReady?: (controller: GobanController | null) => void;
}

export function getMovePathToRestore(
    currentMovePath: string | undefined,
    sourceMovePath: string | undefined,
    preferSourceMovePath: boolean,
): string | undefined {
    if (preferSourceMovePath) {
        return sourceMovePath ?? currentMovePath ?? undefined;
    }

    return currentMovePath ?? sourceMovePath ?? undefined;
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
    moveTree,
    movePath,
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
    const moveTreeRef = React.useRef(moveTree);
    const sourceMovePathRef = React.useRef(movePath);
    const currentMovePathRef = React.useRef(movePath);
    const preferSourceMovePathRef = React.useRef(false);
    const currentMoveNodeRef = React.useRef<MoveTree | undefined>(undefined);
    const pendingLiveMoveRestoreRef = React.useRef<{
        node: MoveTree;
        path: string;
        timeout: ReturnType<typeof setTimeout>;
    } | null>(null);
    const restoringBoardRef = React.useRef(false);

    React.useEffect(() => {
        moveTreeRef.current = moveTree;
    }, [moveTree]);

    React.useEffect(() => {
        sourceMovePathRef.current = movePath;
        currentMovePathRef.current = movePath;
        preferSourceMovePathRef.current = false;
    }, [movePath]);

    React.useEffect(() => {
        const labelPosition = preferences.get("label-positioning");
        const config: GobanRendererConfig = {
            board_div: gobanDiv.current,
            interactive,
            // Subscribe to game chat so the kibitz room's game pane can
            // surface what players are saying. Kibitz users count as
            // spectators on the watched game while subscribed.
            connect_to_chat: true,
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
            move_tree: moveTreeRef.current,
            width,
            height,
        };

        controllerRef.current?.destroy();
        controllerRef.current = new GobanController(config);

        const hasRestorableBoardState = Boolean(moveTreeRef.current || sourceMovePathRef.current);

        const clearPendingLiveMoveRestore = () => {
            const pending = pendingLiveMoveRestoreRef.current;
            if (!pending) {
                return;
            }

            clearTimeout(pending.timeout);
            pendingLiveMoveRestoreRef.current = null;
        };

        const captureCurrentMovePath = (move?: MoveTree) => {
            if (restoringBoardRef.current || !controllerRef.current) {
                return;
            }

            const { engine } = controllerRef.current.goban;
            const currentMove = move ?? engine.cur_move;
            const previousMove = currentMoveNodeRef.current;
            const officialMove = engine.last_official_move;
            const isPossibleLiveMoveJumpToParent =
                previousMove &&
                !previousMove.trunk &&
                previousMove.parent?.id === officialMove.id &&
                currentMove.id === officialMove.id;

            if (isPossibleLiveMoveJumpToParent) {
                const path = previousMove.getMoveStringToThisPoint();
                pendingLiveMoveRestoreRef.current = {
                    node: previousMove,
                    path,
                    timeout: setTimeout(() => {
                        if (pendingLiveMoveRestoreRef.current?.node.id !== previousMove.id) {
                            return;
                        }

                        pendingLiveMoveRestoreRef.current = null;
                        currentMoveNodeRef.current = engine.cur_move;
                        currentMovePathRef.current = engine.cur_move.getMoveStringToThisPoint();
                        preferSourceMovePathRef.current = false;
                    }, 0),
                };
                return;
            }

            if (pendingLiveMoveRestoreRef.current) {
                return;
            }

            currentMoveNodeRef.current = currentMove;
            currentMovePathRef.current =
                controllerRef.current.goban.engine.cur_move.getMoveStringToThisPoint();
            preferSourceMovePathRef.current = false;
        };

        const restorePendingLiveMoveCursor = () => {
            const pending = pendingLiveMoveRestoreRef.current;
            if (!pending || !controllerRef.current) {
                return;
            }

            clearPendingLiveMoveRestore();
            restoringBoardRef.current = true;
            try {
                controllerRef.current.goban.engine.jumpTo(pending.node);
                controllerRef.current.goban.redraw(true);
                currentMoveNodeRef.current = pending.node;
                currentMovePathRef.current = pending.path;
                preferSourceMovePathRef.current = false;
            } finally {
                restoringBoardRef.current = false;
            }
        };

        const restoreBoardState = (movePathToRestore?: string) => {
            if (!controllerRef.current) {
                return;
            }

            // Anchor the board's official move to the live trunk before we
            // apply any variation path. That keeps incoming socket moves
            // aligned with the current game instead of treating the loaded
            // board root as move 0.
            const liveTrunkTail = getMoveTreeTrunkTail(
                controllerRef.current.goban.engine.move_tree,
            );
            if (liveTrunkTail) {
                controllerRef.current.goban.engine.jumpTo(liveTrunkTail);
                controllerRef.current.goban.engine.setLastOfficialMove();
            }
            if (movePathToRestore) {
                controllerRef.current.goban.engine.followPath(0, movePathToRestore);
            }
            controllerRef.current.goban.redraw(true);
            const restoredMovePath =
                controllerRef.current.goban.engine.cur_move.getMoveStringToThisPoint();
            currentMoveNodeRef.current = controllerRef.current.goban.engine.cur_move;
            currentMovePathRef.current = restoredMovePath;
            preferSourceMovePathRef.current =
                movePathToRestore !== undefined && restoredMovePath !== movePathToRestore;
        };

        const handleLoad = () => {
            if (!hasRestorableBoardState) {
                return;
            }

            const movePathToRestore = getMovePathToRestore(
                currentMovePathRef.current,
                sourceMovePathRef.current,
                preferSourceMovePathRef.current,
            );
            restoringBoardRef.current = true;
            try {
                restoreBoardState(movePathToRestore);
            } finally {
                restoringBoardRef.current = false;
            }
        };

        if (hasRestorableBoardState) {
            controllerRef.current.goban.on("cur_move", captureCurrentMovePath);
            controllerRef.current.goban.on("move-made", restorePendingLiveMoveCursor);
            controllerRef.current.goban.on("load", handleLoad);
            handleLoad();
        }
        setGoban(controllerRef.current.goban);
        onReady?.(controllerRef.current);

        return () => {
            onReady?.(null);
            clearPendingLiveMoveRestore();
            controllerRef.current?.goban.off("cur_move", captureCurrentMovePath);
            controllerRef.current?.goban.off("move-made", restorePendingLiveMoveCursor);
            controllerRef.current?.goban.off("load", handleLoad);
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
