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
import { socket } from "@/lib/sockets";
import { logKibitzVariationDebug, summarizeKibitzMoveTreeNode } from "./kibitzVariationDebug";
import "./KibitzBoard.css";

interface KibitzBoardProps {
    role?: "main" | "secondary" | "variation" | "preview";
    gameId?: number;
    currentRoomGameId?: number | null;
    isMobile?: boolean;
    connectToGame?: boolean;
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
    restoreToOfficialTailOnLoad?: boolean;
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

export function refreshLastOfficialMoveFromTrunk(controller: GobanController): MoveTree | null {
    const { engine } = controller.goban;
    const liveTrunkTail = getMoveTreeTrunkTail(engine.move_tree);

    if (!liveTrunkTail) {
        return null;
    }

    const moveToRestore = engine.cur_move;
    engine.jumpTo(liveTrunkTail);
    engine.setLastOfficialMove();

    if (moveToRestore.id !== liveTrunkTail.id) {
        engine.jumpTo(moveToRestore);
    }

    return liveTrunkTail;
}

export function restoreToOfficialTail(controller: GobanController): MoveTree | null {
    const { engine } = controller.goban;
    const officialTail = getMoveTreeTrunkTail(engine.move_tree);

    if (!officialTail || officialTail.move_number <= 0) {
        return null;
    }

    engine.jumpTo(officialTail);
    engine.setLastOfficialMove();
    controller.goban.redraw(true);

    return officialTail;
}

export function shouldRestoreToOfficialTailForGame(
    currentMoveNumber: number | null | undefined,
    restoredOfficialTailForGameId: number | null,
    gameId: number | undefined,
): boolean {
    if (gameId == null) {
        return false;
    }

    return restoredOfficialTailForGameId !== gameId || currentMoveNumber === 0;
}

export interface RestoredOfficialTailRef {
    gameId: number;
    moveNumber: number;
    nodeId?: string | number | null;
}

export function shouldRestoreMainBoardToOfficialTail({
    gameId,
    currentMoveNumber,
    currentMoveNodeId,
    officialTailMoveNumber,
    lastRestored,
}: {
    gameId: number | null | undefined;
    currentMoveNumber: number;
    currentMoveNodeId?: string | number | null;
    officialTailMoveNumber: number;
    lastRestored: RestoredOfficialTailRef | null;
}): boolean {
    if (gameId == null || officialTailMoveNumber <= 0) {
        return false;
    }

    if (!lastRestored || lastRestored.gameId !== gameId) {
        return true;
    }

    if (currentMoveNumber === 0) {
        return true;
    }

    const officialTailAdvanced = officialTailMoveNumber > lastRestored.moveNumber;
    const userWasAtPreviouslyRestoredTail =
        currentMoveNumber === lastRestored.moveNumber ||
        (currentMoveNodeId != null && currentMoveNodeId === lastRestored.nodeId);

    return officialTailAdvanced && userWasAtPreviouslyRestoredTail;
}

export function KibitzBoard({
    role,
    gameId,
    currentRoomGameId,
    isMobile = false,
    connectToGame = true,
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
    restoreToOfficialTailOnLoad = false,
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
    const requestedHydrationGameIdRef = React.useRef<number | null>(null);
    const restoredOfficialTailRef = React.useRef<RestoredOfficialTailRef | null>(null);
    const boardRole = role ?? (restoreToOfficialTailOnLoad ? "main" : "secondary");

    React.useEffect(() => {
        moveTreeRef.current = moveTree;
    }, [moveTree]);

    React.useEffect(() => {
        sourceMovePathRef.current = movePath;
        currentMovePathRef.current = movePath;
        preferSourceMovePathRef.current = false;
    }, [movePath]);

    React.useEffect(() => {
        requestedHydrationGameIdRef.current = null;
        restoredOfficialTailRef.current = null;
    }, [gameId]);

    React.useEffect(() => {
        const labelPosition = preferences.get("label-positioning");
        const config: GobanRendererConfig = {
            board_div: gobanDiv.current,
            interactive,
            // Subscribe to game chat so the kibitz room's game pane can
            // surface what players are saying. Kibitz users count as
            // spectators on the watched game while subscribed.
            connect_to_chat: connectToGame,
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
            game_id: connectToGame ? gameId : undefined,
            move_tree: moveTreeRef.current,
            width,
            height,
        };

        controllerRef.current?.destroy();
        controllerRef.current = new GobanController(config);
        if (!connectToGame) {
            logKibitzVariationDebug("kibitz-board:connect-suppressed", {
                role: boardRole,
                gameId,
                currentRoomGameId,
                isMobile,
            });
        }

        const logBoardState = (reason: string, extra: Record<string, unknown> = {}) => {
            const currentController = controllerRef.current;
            if (!currentController) {
                return;
            }

            const currentEngine = currentController.goban.engine;
            const officialTail = getMoveTreeTrunkTail(currentEngine.move_tree);

            logKibitzVariationDebug("main-board:state", {
                reason,
                role: boardRole,
                gameId,
                currentRoomGameId,
                isMobile,
                restoreToOfficialTailOnLoad,
                currentMove: summarizeKibitzMoveTreeNode(currentEngine.cur_move),
                currentMoveNumber: currentEngine.cur_move?.move_number ?? null,
                currentMoveId: currentEngine.cur_move?.id ?? null,
                officialTail: summarizeKibitzMoveTreeNode(officialTail),
                officialTailMoveNumber: officialTail?.move_number ?? null,
                officialTailId: officialTail?.id ?? null,
                lastOfficialMove: summarizeKibitzMoveTreeNode(currentEngine.last_official_move),
                lastOfficialMoveNumber: currentEngine.last_official_move?.move_number ?? null,
                lastOfficialMoveId: currentEngine.last_official_move?.id ?? null,
                ...extra,
            });
        };

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

            // Anchor the official move before applying/restoring a variation path.
            refreshLastOfficialMoveFromTrunk(controllerRef.current);
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
        if (restoreToOfficialTailOnLoad) {
            logBoardState("controller-create");
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
    }, [
        gameId,
        connectToGame,
        currentRoomGameId,
        isMobile,
        width,
        height,
        interactive,
        onReady,
        restoreToOfficialTailOnLoad,
        role,
        showLabels,
    ]);

    React.useEffect(() => {
        if (!goban || !restoreToOfficialTailOnLoad || !controllerRef.current) {
            return;
        }

        const boardRole = role ?? "main";
        const logBoardState = (reason: string, extra: Record<string, unknown> = {}) => {
            const currentController = controllerRef.current;
            if (!currentController) {
                return;
            }

            const currentEngine = currentController.goban.engine;
            const officialTail = getMoveTreeTrunkTail(currentEngine.move_tree);

            logKibitzVariationDebug("main-board:state", {
                reason,
                role: boardRole,
                gameId,
                restoreToOfficialTailOnLoad,
                currentMove: summarizeKibitzMoveTreeNode(currentEngine.cur_move),
                currentMoveNumber: currentEngine.cur_move?.move_number ?? null,
                officialTail: summarizeKibitzMoveTreeNode(officialTail),
                officialTailMoveNumber: officialTail?.move_number ?? null,
                lastOfficialMove: summarizeKibitzMoveTreeNode(currentEngine.last_official_move),
                lastOfficialMoveNumber: currentEngine.last_official_move?.move_number ?? null,
                ...extra,
            });
        };

        const handleRestoreToOfficialTail = (reason: string) => {
            if (!controllerRef.current) {
                return;
            }

            if (restoringBoardRef.current) {
                return;
            }

            const currentEngine = controllerRef.current.goban.engine;
            const currentMoveNumber = currentEngine.cur_move?.move_number ?? null;
            const currentMoveNodeId = currentEngine.cur_move?.id ?? null;
            const officialTail = getMoveTreeTrunkTail(currentEngine.move_tree);
            const officialTailMoveNumber = officialTail?.move_number ?? 0;
            const officialTailNodeId = officialTail?.id ?? null;
            if (
                !shouldRestoreMainBoardToOfficialTail({
                    gameId,
                    currentMoveNumber: currentMoveNumber ?? 0,
                    currentMoveNodeId,
                    officialTailMoveNumber,
                    lastRestored: restoredOfficialTailRef.current,
                })
            ) {
                logBoardState(`${reason}:restore-skipped`, {
                    currentMoveNumber,
                    currentMoveNodeId,
                    officialTailMoveNumber,
                    officialTailNodeId,
                    lastRestored: restoredOfficialTailRef.current,
                });
                return;
            }

            logBoardState(`${reason}:restore-attempt`);
            restoringBoardRef.current = true;
            try {
                const restoredTail = restoreToOfficialTail(controllerRef.current);
                logBoardState(`${reason}:restore-result`, {
                    restored: Boolean(restoredTail),
                    restoredTailMoveNumber: restoredTail?.move_number ?? null,
                    restoredTailId: restoredTail?.id ?? null,
                });

                if (
                    !restoredTail &&
                    connectToGame &&
                    gameId != null &&
                    requestedHydrationGameIdRef.current !== gameId
                ) {
                    requestedHydrationGameIdRef.current = gameId;
                    logKibitzVariationDebug("main-board:hydrate-request", {
                        reason,
                        role: boardRole,
                        gameId,
                    });
                    socket.send("game/connect", {
                        game_id: gameId,
                        chat: true,
                    });
                } else if (restoredTail && gameId != null) {
                    restoredOfficialTailRef.current = {
                        gameId,
                        moveNumber: restoredTail.move_number,
                        nodeId: restoredTail.id,
                    };
                }
            } finally {
                restoringBoardRef.current = false;
            }
        };

        const onLoad = () => {
            handleRestoreToOfficialTail("load");
        };
        const onGameData = () => {
            handleRestoreToOfficialTail("gamedata");
        };
        const onLastOfficialMove = () => {
            handleRestoreToOfficialTail("last_official_move");
        };
        const onMoveMade = () => {
            logBoardState("move-made");
            handleRestoreToOfficialTail("move-made");
        };

        goban.on("load", onLoad);
        goban.on("gamedata", onGameData);
        goban.on("last_official_move", onLastOfficialMove);
        goban.on("move-made", onMoveMade);
        handleRestoreToOfficialTail("mount");

        return () => {
            goban.off("load", onLoad);
            goban.off("gamedata", onGameData);
            goban.off("last_official_move", onLastOfficialMove);
            goban.off("move-made", onMoveMade);
        };
    }, [
        gameId,
        goban,
        connectToGame,
        currentRoomGameId,
        isMobile,
        restoreToOfficialTailOnLoad,
        role,
    ]);

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
