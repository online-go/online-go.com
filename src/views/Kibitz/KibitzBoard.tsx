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
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { PersistentElement } from "@/components/PersistentElement";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import { logKibitzVariationDebug, summarizeKibitzMoveTreeNode } from "./kibitzVariationDebug";
import "./KibitzBoard.css";

declare global {
    interface Window {
        __kibitzLifecycleRing?: Array<Record<string, unknown>>;
    }
}

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

function recordKibitzLifecycleEvent(message: string, details: Record<string, unknown> = {}): void {
    if (typeof window === "undefined") {
        return;
    }

    const ring = window.__kibitzLifecycleRing ?? [];
    ring.push({
        sequence: ring.length > 0 ? Number(ring[ring.length - 1]?.sequence ?? 0) + 1 : 1,
        timestamp: Date.now(),
        message,
        ...details,
    });

    while (ring.length > 300) {
        ring.shift();
    }

    window.__kibitzLifecycleRing = ring;
}

const MAX_INITIAL_RESIZE_RETRIES = 60;
const MAX_BOARD_HOST_READY_RAF_ATTEMPTS = 120;
const BOARD_HOST_READY_SLOW_RETRY_MS = 250;
const MAX_BOARD_HOST_READY_SLOW_RETRIES = 20;

export type BoardHostReadinessReason = "missing-host" | "detached" | "zero-size" | "ready";

export interface BoardHostReadiness {
    ready: boolean;
    reason: BoardHostReadinessReason;
    width: number;
    height: number;
    connected: boolean;
}

type FullBoardHostReadiness = BoardHostReadiness & {
    gobanContainerReady: boolean;
};

export function getBoardHostReadiness(host: HTMLElement | null): BoardHostReadiness {
    if (!host) {
        return {
            ready: false,
            reason: "missing-host",
            width: 0,
            height: 0,
            connected: false,
        };
    }

    const connected = host.isConnected;
    const width = host.clientWidth;
    const height = host.clientHeight;

    if (!connected) {
        return {
            ready: false,
            reason: "detached",
            width,
            height,
            connected,
        };
    }

    if (width <= 0 || height <= 0) {
        return {
            ready: false,
            reason: "zero-size",
            width,
            height,
            connected,
        };
    }

    return {
        ready: true,
        reason: "ready",
        width,
        height,
        connected,
    };
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

export function shouldConnectKibitzBoardToGame(
    boardRole: "main" | "secondary" | "variation" | "preview",
    connectToGame: boolean,
): boolean {
    return boardRole === "main" && connectToGame;
}

function isGobanStillUsable(
    goban: GobanController["goban"] | null | undefined,
): goban is GobanController["goban"] {
    if (!goban) {
        return false;
    }

    const gobanElement = goban as unknown as {
        parent?: HTMLElement | null;
        destroyed?: boolean;
        renderer?: { destroyed?: boolean };
    };

    return Boolean(
        gobanElement.parent?.isConnected &&
        !gobanElement.destroyed &&
        !gobanElement.renderer?.destroyed,
    );
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
    const boardHostRef = React.useRef<HTMLDivElement>(null);
    const gobanContainerRef = React.useRef<HTMLDivElement>(null);
    const gobanDiv = React.useRef<HTMLDivElement>(
        (() => {
            const element = document.createElement("div");
            element.className = "Goban";
            return element;
        })(),
    );
    const controllerRef = React.useRef<GobanController | null>(null);
    const controllerEpochRef = React.useRef(0);
    const controllerPublishedRef = React.useRef(false);
    const resizeDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
    const initialResizeRetryCountRef = React.useRef(0);
    const initialResizeRetryTimedOutRef = React.useRef(false);
    const pendingInitialResizeRetryRef = React.useRef<{
        frame1: number | null;
        frame2: number | null;
    } | null>(null);
    const onResizeRef = React.useRef<(no_debounce?: boolean) => void>(() => {});
    const [goban, setGoban] = React.useState<GobanController["goban"] | null>(null);
    const [boardHostReadyKey, setBoardHostReadyKey] = React.useState<string | null>(null);
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
    const effectiveConnectToGame = shouldConnectKibitzBoardToGame(boardRole, connectToGame);
    const hasExplicitSize = typeof size === "number";
    const explicitSizeReady = !hasExplicitSize || (Number.isFinite(size) && size > 0);
    const shouldDeferGobanContainer =
        boardRole === "secondary" && hasExplicitSize && !explicitSizeReady;
    const displaySize = hasExplicitSize && Number.isFinite(size) && size > 0 ? size : undefined;
    const boardHostReadinessKey = React.useMemo(
        () =>
            [
                boardRole,
                gameId ?? "none",
                currentRoomGameId ?? "none",
                isMobile ? "mobile" : "desktop",
                effectiveConnectToGame ? "connect" : "no-connect",
                width,
                height,
                interactive ? "interactive" : "static",
                showLabels ? "labels" : "no-labels",
                fitMode,
                respectContainerBounds ? "respect" : "no-respect",
                restoreToOfficialTailOnLoad ? "restore" : "no-restore",
            ].join("|"),
        [
            boardRole,
            effectiveConnectToGame,
            currentRoomGameId,
            fitMode,
            gameId,
            height,
            interactive,
            isMobile,
            restoreToOfficialTailOnLoad,
            respectContainerBounds,
            showLabels,
            width,
        ],
    );

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

    React.useLayoutEffect(() => {
        if (goban) {
            return;
        }

        let disposed = false;
        let readinessFrame: number | null = null;
        let slowRetryTimer: number | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let rafAttemptCount = 0;
        let slowRetryCount = 0;
        let timeoutLogged = false;
        let abandonedLogged = false;
        let slowRecoveryActive = false;
        let readySignaled = false;
        let lastReadiness = getFullBoardHostReadiness();

        function getFullBoardHostReadiness(): FullBoardHostReadiness {
            const readiness = getBoardHostReadiness(boardHostRef.current);
            const gobanContainer = gobanContainerRef.current;
            const gobanWrapper = gobanDiv.current.parentElement;
            const gobanContainerReady =
                Boolean(gobanContainer?.isConnected) &&
                Boolean(gobanWrapper?.isConnected) &&
                Boolean(gobanWrapper?.classList.contains("Goban")) &&
                Boolean(gobanContainer?.classList.contains("goban-container")) &&
                Boolean(gobanContainer && gobanContainer.parentElement === boardHostRef.current) &&
                Boolean(gobanWrapper && gobanWrapper.parentElement === gobanContainer) &&
                gobanDiv.current.parentElement === gobanWrapper;

            return {
                ...readiness,
                ready: readiness.ready && gobanContainerReady,
                gobanContainerReady,
            };
        }

        const clearReadinessWatchers = () => {
            if (readinessFrame !== null) {
                window.cancelAnimationFrame(readinessFrame);
                readinessFrame = null;
            }

            if (slowRetryTimer !== null) {
                window.clearTimeout(slowRetryTimer);
                slowRetryTimer = null;
            }

            resizeObserver?.disconnect();
            resizeObserver = null;
        };

        const logHostReadyTimeout = (readiness: FullBoardHostReadiness) => {
            if (timeoutLogged) {
                return;
            }

            timeoutLogged = true;
            logKibitzVariationDebug("kibitz-board:host-ready-raf-timeout", {
                role,
                gameId,
                currentRoomGameId,
                className: typeof className === "string" ? className : null,
                size: size ?? null,
                width: readiness.width,
                height: readiness.height,
                connected: readiness.connected,
                reason: readiness.reason,
                attempts: rafAttemptCount,
            });
        };

        const logHostReadyAbandoned = () => {
            if (abandonedLogged) {
                return;
            }

            abandonedLogged = true;
            logKibitzVariationDebug("kibitz-board:host-ready-abandoned", {
                role,
                gameId,
                currentRoomGameId,
                className: typeof className === "string" ? className : null,
                size: size ?? null,
                lastReason: lastReadiness.reason,
                lastWidth: lastReadiness.width,
                lastHeight: lastReadiness.height,
                connected: lastReadiness.connected,
                rafAttempts: MAX_BOARD_HOST_READY_RAF_ATTEMPTS,
                slowRetries: slowRetryCount,
            });
        };

        const maybeMarkBoardHostReady = (
            source: "raf" | "resize-observer" | "slow-retry",
        ): boolean => {
            if (disposed || readySignaled || controllerRef.current) {
                return true;
            }

            const readiness = getFullBoardHostReadiness();
            lastReadiness = readiness;

            if (!readiness.ready) {
                return false;
            }

            readySignaled = true;
            clearReadinessWatchers();

            if (source !== "raf" || slowRecoveryActive) {
                logKibitzVariationDebug("kibitz-board:host-ready-slow-recovered", {
                    role,
                    gameId,
                    currentRoomGameId,
                    className: typeof className === "string" ? className : null,
                    size: size ?? null,
                    reason: source,
                    slowRetryCount,
                    width: readiness.width,
                    height: readiness.height,
                    gobanContainerReady: readiness.gobanContainerReady,
                });
            }

            setBoardHostReadyKey(boardHostReadinessKey);
            return true;
        };

        const scheduleSlowRetry = () => {
            if (disposed || readySignaled) {
                return;
            }

            if (slowRetryCount >= MAX_BOARD_HOST_READY_SLOW_RETRIES) {
                clearReadinessWatchers();
                logHostReadyAbandoned();
                return;
            }

            slowRetryTimer = window.setTimeout(() => {
                slowRetryTimer = null;

                if (disposed || readySignaled) {
                    return;
                }

                slowRetryCount += 1;
                if (maybeMarkBoardHostReady("slow-retry")) {
                    return;
                }

                scheduleSlowRetry();
            }, BOARD_HOST_READY_SLOW_RETRY_MS);
        };

        const startSlowRecovery = (readiness: FullBoardHostReadiness) => {
            if (disposed || readySignaled) {
                return;
            }

            slowRecoveryActive = true;
            lastReadiness = readiness;

            if (typeof window.ResizeObserver === "function" && boardHostRef.current) {
                resizeObserver = new ResizeObserver(() => {
                    maybeMarkBoardHostReady("resize-observer");
                });
                resizeObserver.observe(boardHostRef.current);
            }

            scheduleSlowRetry();
        };

        const checkBoardHostReady = () => {
            if (disposed || readySignaled || controllerRef.current) {
                return;
            }

            const readiness = getFullBoardHostReadiness();
            lastReadiness = readiness;

            if (readiness.ready) {
                maybeMarkBoardHostReady("raf");
                return;
            }

            rafAttemptCount += 1;

            if (rafAttemptCount >= MAX_BOARD_HOST_READY_RAF_ATTEMPTS) {
                logHostReadyTimeout(readiness);
                clearReadinessWatchers();
                startSlowRecovery(readiness);
                return;
            }

            readinessFrame = window.requestAnimationFrame(checkBoardHostReady);
        };

        readinessFrame = window.requestAnimationFrame(checkBoardHostReady);

        return () => {
            disposed = true;
            clearReadinessWatchers();
        };
    }, [boardHostReadinessKey, goban, role, gameId, currentRoomGameId, className, size]);

    const cancelPendingInitialResizeRetry = React.useCallback(() => {
        const pendingRetry = pendingInitialResizeRetryRef.current;
        if (!pendingRetry) {
            return;
        }

        if (pendingRetry.frame1 !== null) {
            window.cancelAnimationFrame(pendingRetry.frame1);
        }

        if (pendingRetry.frame2 !== null) {
            window.cancelAnimationFrame(pendingRetry.frame2);
        }

        pendingInitialResizeRetryRef.current = null;
    }, []);

    const scheduleInitialResizeRetry = React.useCallback(() => {
        if (pendingInitialResizeRetryRef.current) {
            return;
        }

        if (initialResizeRetryCountRef.current >= MAX_INITIAL_RESIZE_RETRIES) {
            if (initialResizeRetryTimedOutRef.current) {
                return;
            }

            initialResizeRetryTimedOutRef.current = true;
            logKibitzVariationDebug("kibitz-board:initial-resize-retry-timeout", {
                role: boardRole,
                gameId,
                isMobile,
            });
            return;
        }

        initialResizeRetryCountRef.current += 1;
        const scheduledControllerEpoch = controllerEpochRef.current;
        const scheduledController = controllerRef.current;

        const pendingRetry = {
            frame1: null as number | null,
            frame2: null as number | null,
        };
        pendingInitialResizeRetryRef.current = pendingRetry;

        pendingRetry.frame1 = window.requestAnimationFrame(() => {
            pendingRetry.frame1 = null;

            pendingRetry.frame2 = window.requestAnimationFrame(() => {
                pendingRetry.frame2 = null;
                pendingInitialResizeRetryRef.current = null;

                if (
                    scheduledController &&
                    controllerEpochRef.current !== scheduledControllerEpoch
                ) {
                    recordKibitzLifecycleEvent("kibitz-board:delayed-callback-skip-destroyed", {
                        role: boardRole,
                        gameId,
                        currentRoomGameId,
                        reason: "initial-resize-retry",
                        scheduledControllerEpoch,
                        currentControllerEpoch: controllerEpochRef.current,
                        scheduledControllerGameId:
                            scheduledController?.goban.config?.game_id ?? null,
                        currentControllerGameId:
                            controllerRef.current?.goban.config?.game_id ?? null,
                    });
                    return;
                }

                if (
                    scheduledController &&
                    (!isGobanStillUsable(scheduledController.goban) ||
                        controllerRef.current !== scheduledController)
                ) {
                    recordKibitzLifecycleEvent("kibitz-board:delayed-callback-skip-destroyed", {
                        role: boardRole,
                        gameId,
                        currentRoomGameId,
                        reason: "initial-resize-retry",
                        scheduledControllerEpoch,
                        currentControllerEpoch: controllerEpochRef.current,
                        scheduledControllerGameId:
                            scheduledController?.goban.config?.game_id ?? null,
                        currentControllerGameId:
                            controllerRef.current?.goban.config?.game_id ?? null,
                    });
                    return;
                }

                onResizeRef.current(true);
            });
        });
    }, [boardRole, currentRoomGameId, gameId, isMobile]);

    const recenterGoban = React.useCallback(
        (gobanController: GobanController["goban"]) => {
            const container = gobanContainerRef.current;
            const gobanElement = gobanDiv.current;

            if (!container || !gobanController || !gobanElement) {
                return;
            }

            const metrics = gobanController.computeMetrics();
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const scale =
                fitMode === "contain" && metrics.width > 0 && metrics.height > 0
                    ? Math.min(containerWidth / metrics.width, containerHeight / metrics.height)
                    : 1;
            const scaledWidth = metrics.width * scale;

            gobanElement.style.transformOrigin = "top left";
            gobanElement.style.transform = scale === 1 ? "" : `scale(${scale})`;
            gobanElement.style.top = "0px";
            gobanElement.style.left = `${Math.ceil((containerWidth - scaledWidth) / 2)}px`;
        },
        [fitMode],
    );

    const onResize = React.useCallback(
        (no_debounce: boolean = false) => {
            const gobanController = goban;
            const gobanElement = gobanDiv.current;
            const container = gobanContainerRef.current;

            if (!isGobanStillUsable(gobanController) || !gobanElement || !container) {
                return;
            }

            if (resizeDebounceRef.current) {
                clearTimeout(resizeDebounceRef.current);
                resizeDebounceRef.current = null;
            }

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            if (
                !Number.isFinite(containerWidth) ||
                !Number.isFinite(containerHeight) ||
                containerWidth <= 0 ||
                containerHeight <= 0
            ) {
                if (no_debounce) {
                    scheduleInitialResizeRetry();
                }
                return;
            }

            initialResizeRetryCountRef.current = 0;
            cancelPendingInitialResizeRetry();

            const targetDisplayWidth = respectContainerBounds
                ? Math.min(containerWidth, containerHeight || containerWidth)
                : containerWidth;

            gobanController.setLastMoveOpacity(preferences.get("last-move-opacity"));
            if (no_debounce) {
                gobanController.setSquareSizeBasedOnDisplayWidth(targetDisplayWidth);
                recenterGoban(gobanController);
            } else {
                const scheduledControllerEpoch = controllerEpochRef.current;
                const scheduledController = gobanController;
                resizeDebounceRef.current = setTimeout(() => {
                    if (
                        controllerEpochRef.current !== scheduledControllerEpoch ||
                        !isGobanStillUsable(scheduledController) ||
                        controllerRef.current?.goban !== scheduledController
                    ) {
                        recordKibitzLifecycleEvent("kibitz-board:delayed-callback-skip-destroyed", {
                            role: boardRole,
                            gameId,
                            currentRoomGameId,
                            reason: "resize-debounce",
                            scheduledControllerEpoch,
                            currentControllerEpoch: controllerEpochRef.current,
                            scheduledControllerGameId: scheduledController?.config?.game_id ?? null,
                            currentControllerGameId:
                                controllerRef.current?.goban.config?.game_id ?? null,
                        });
                        return;
                    }

                    onResizeRef.current(true);
                }, 10);
            }
        },
        [
            cancelPendingInitialResizeRetry,
            boardRole,
            currentRoomGameId,
            gameId,
            goban,
            recenterGoban,
            respectContainerBounds,
            scheduleInitialResizeRetry,
            isGobanStillUsable,
        ],
    );

    React.useEffect(() => {
        onResizeRef.current = onResize;
    }, [onResize]);

    React.useEffect(() => {
        if (!goban) {
            return;
        }

        initialResizeRetryCountRef.current = 0;
        initialResizeRetryTimedOutRef.current = false;

        let cancelled = false;
        let frame1 = 0;
        let frame2 = 0;

        frame1 = window.requestAnimationFrame(() => {
            frame2 = window.requestAnimationFrame(() => {
                if (cancelled) {
                    return;
                }

                onResize(true);
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame1);
            window.cancelAnimationFrame(frame2);
        };
    }, [goban, onResize, size]);

    React.useEffect(() => cancelPendingInitialResizeRetry, [cancelPendingInitialResizeRetry]);

    React.useEffect(() => {
        return () => {
            if (resizeDebounceRef.current) {
                clearTimeout(resizeDebounceRef.current);
                resizeDebounceRef.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        if (boardHostReadyKey !== boardHostReadinessKey) {
            return;
        }

        const labelPosition = preferences.get("label-positioning");
        const config: GobanRendererConfig = {
            board_div: gobanDiv.current,
            interactive,
            // Subscribe to game chat so the kibitz room's game pane can
            // surface what players are saying. Kibitz users count as
            // spectators on the watched game while subscribed.
            connect_to_chat: effectiveConnectToGame,
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
            game_id: effectiveConnectToGame ? gameId : undefined,
            move_tree: moveTreeRef.current,
            width,
            height,
        };

        controllerEpochRef.current += 1;
        controllerRef.current?.destroy();
        controllerRef.current = new GobanController(config);
        controllerEpochRef.current += 1;
        controllerPublishedRef.current = false;
        if (!effectiveConnectToGame) {
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
        controllerPublishedRef.current = true;

        return () => {
            if (controllerPublishedRef.current) {
                onReady?.(null);
            }
            controllerPublishedRef.current = false;
            recordKibitzLifecycleEvent("kibitz-board:destroy", {
                role: boardRole,
                gameId,
                currentRoomGameId,
                controllerGameId: controllerRef.current?.goban.config?.game_id ?? null,
                controllerEpoch: controllerEpochRef.current,
            });
            if (resizeDebounceRef.current) {
                clearTimeout(resizeDebounceRef.current);
                resizeDebounceRef.current = null;
            }
            cancelPendingInitialResizeRetry();
            clearPendingLiveMoveRestore();
            controllerRef.current?.goban.off("cur_move", captureCurrentMovePath);
            controllerRef.current?.goban.off("move-made", restorePendingLiveMoveCursor);
            controllerRef.current?.goban.off("load", handleLoad);
            controllerEpochRef.current += 1;
            controllerRef.current?.destroy();
            controllerRef.current = null;
            setGoban(null);
        };
    }, [
        gameId,
        effectiveConnectToGame,
        currentRoomGameId,
        isMobile,
        width,
        height,
        interactive,
        onReady,
        restoreToOfficialTailOnLoad,
        role,
        showLabels,
        boardHostReadyKey,
        boardHostReadinessKey,
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
                    effectiveConnectToGame &&
                    gameId != null &&
                    requestedHydrationGameIdRef.current !== gameId
                ) {
                    requestedHydrationGameIdRef.current = gameId;
                    logKibitzVariationDebug("main-board:hydrate-request", {
                        reason,
                        role: boardRole,
                        gameId,
                    });
                    // The controller is already connected through OGSConnectivity.
                    // Defer to its normal load/gamedata path instead of sending a
                    // second raw connect here, which can race a still-hydrating board.
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
        effectiveConnectToGame,
        currentRoomGameId,
        isMobile,
        restoreToOfficialTailOnLoad,
        role,
    ]);

    React.useEffect(() => {
        if (!goban || !size || size <= 0) {
            return;
        }

        let cancelled = false;
        let frame1 = 0;
        let frame2 = 0;
        const scheduledController = goban;
        const scheduledControllerEpoch = controllerEpochRef.current;

        frame1 = window.requestAnimationFrame(() => {
            frame2 = window.requestAnimationFrame(() => {
                if (
                    cancelled ||
                    controllerEpochRef.current !== scheduledControllerEpoch ||
                    !isGobanStillUsable(scheduledController) ||
                    controllerRef.current?.goban !== scheduledController
                ) {
                    if (!cancelled) {
                        recordKibitzLifecycleEvent("kibitz-board:delayed-callback-skip-destroyed", {
                            role: boardRole,
                            gameId,
                            currentRoomGameId,
                            reason: "post-mount-redraw",
                            scheduledControllerEpoch,
                            currentControllerEpoch: controllerEpochRef.current,
                            scheduledControllerGameId: scheduledController?.config?.game_id ?? null,
                            currentControllerGameId:
                                controllerRef.current?.goban.config?.game_id ?? null,
                        });
                    }
                    return;
                }

                scheduledController.redraw(true);
                scheduledController.move_tree_redraw?.(true);
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame1);
            window.cancelAnimationFrame(frame2);
        };
    }, [boardRole, currentRoomGameId, gameId, goban, size]);

    React.useEffect(() => {
        if (!shouldDeferGobanContainer) {
            return;
        }

        logKibitzVariationDebug("kibitz-board:defer-goban-container-invalid-size", {
            role: boardRole,
            size,
        });
    }, [boardRole, shouldDeferGobanContainer, size]);

    if (shouldDeferGobanContainer) {
        return (
            <div
                className={"KibitzBoard" + (className ? ` ${className}` : "")}
                data-kibitz-board-pending-size="true"
                style={{
                    width: "100%",
                    height: "100%",
                    flex: "0 0 auto",
                }}
                aria-hidden="true"
            />
        );
    }

    return (
        <div
            ref={boardHostRef}
            className={"KibitzBoard" + (className ? ` ${className}` : "")}
            style={
                displaySize
                    ? {
                          width: `${displaySize}px`,
                          height: `${displaySize}px`,
                          flex: "0 0 auto",
                      }
                    : undefined
            }
        >
            <div ref={gobanContainerRef} className="goban-container">
                <OgsResizeDetector onResize={onResize} targetRef={gobanContainerRef} />
                <PersistentElement className="Goban" elt={gobanDiv.current} />
            </div>
        </div>
    );
}
