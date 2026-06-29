/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import type { GobanController } from "@/lib/GobanController";
import { socket } from "@/lib/sockets";
import { logKibitzVariationDebug } from "./kibitzVariationDebug";

const PICKER_CLOSE_RECONNECT_DELAYS_MS = [0, 50, 250, 1000] as const;
const KEEPALIVE_INTERVAL_MS = 20000;

interface UseKibitzCurrentGameConnectionKeeperOptions {
    roomId: string | null | undefined;
    currentGameId: number | null | undefined;
    currentLiveTailMoveNumber?: number;
    isLive: boolean;
    pickerOpen: boolean;
    enabled?: boolean;
    allowReconnect?: boolean;
    debugSource?: string;
    boardController?: GobanController | null;
}

function sendGameConnect(
    gameId: number,
    reason: string,
    debugSource: string,
    roomId: string | null | undefined,
): void {
    logKibitzVariationDebug("kibitz-current-game-keeper:connect", {
        reason,
        debugSource,
        roomId,
        gameId,
    });

    socket.send("game/connect", {
        game_id: gameId,
        chat: true,
    });
}

/**
 * Keeps the Kibitz room's current live game connected independently of any
 * visible Goban instance.
 *
 * This is intentionally Kibitz-local. It compensates for picker previews and
 * Observe mini-gobans that may mount/unmount and send raw game/disconnect for
 * the same game the room is watching.
 *
 * Future improvement:
 * replace this with shared Goban/socket-level ref-counting, where a
 * game/disconnect is only sent when the last owner releases a game_id.
 */
export function useKibitzCurrentGameConnectionKeeper({
    roomId,
    currentGameId,
    currentLiveTailMoveNumber = 0,
    isLive,
    pickerOpen,
    enabled = true,
    allowReconnect = true,
    debugSource = "kibitz-room",
    boardController,
}: UseKibitzCurrentGameConnectionKeeperOptions): void {
    const activeGameId = enabled && isLive && currentGameId != null ? currentGameId : null;
    const activeGameKey = activeGameId != null ? `${roomId ?? "no-room"}:${activeGameId}` : null;
    const currentLiveTailMoveNumberRef = React.useRef(currentLiveTailMoveNumber);
    const previousPickerOpenRef = React.useRef(pickerOpen);
    const previousBoardControllerRef = React.useRef<GobanController | null | undefined>(
        boardController,
    );
    const bootstrapConnectKeyRef = React.useRef<string | null>(null);
    const previousActiveGameKeyRef = React.useRef<string | null>(activeGameKey);
    const scheduledTimeoutIdsRef = React.useRef<number[]>([]);
    const scheduledRafIdsRef = React.useRef<number[]>([]);

    React.useEffect(() => {
        currentLiveTailMoveNumberRef.current = currentLiveTailMoveNumber;
    }, [currentLiveTailMoveNumber]);

    React.useEffect(() => {
        if (previousActiveGameKeyRef.current === activeGameKey) {
            return;
        }

        previousActiveGameKeyRef.current = activeGameKey;
        bootstrapConnectKeyRef.current = null;
    }, [activeGameKey]);

    const canReconnectController = React.useCallback(
        (controller: GobanController | null): boolean => {
            if (!controller) {
                return true;
            }

            const liveTailMoveNumber = currentLiveTailMoveNumberRef.current;
            if (liveTailMoveNumber <= 0) {
                return true;
            }

            const controllerTailMoveNumber =
                controller.goban?.engine?.last_official_move?.move_number ?? 0;
            return controllerTailMoveNumber >= liveTailMoveNumber;
        },
        [],
    );

    const clearScheduledReconnects = React.useCallback(() => {
        for (const timeoutId of scheduledTimeoutIdsRef.current) {
            window.clearTimeout(timeoutId);
        }
        scheduledTimeoutIdsRef.current = [];

        for (const rafId of scheduledRafIdsRef.current) {
            if (typeof window.cancelAnimationFrame === "function") {
                window.cancelAnimationFrame(rafId);
            } else {
                window.clearTimeout(rafId);
            }
        }
        scheduledRafIdsRef.current = [];
    }, []);

    const connect = React.useCallback(
        (reason: string) => {
            if (!allowReconnect) {
                return;
            }

            if (activeGameId == null) {
                return;
            }

            const controllerGameId = boardController?.goban?.config?.game_id ?? null;
            const controllerMatchesActiveGame =
                boardController != null && controllerGameId === activeGameId;
            const shouldBypassReconnectGuard =
                controllerMatchesActiveGame &&
                activeGameKey != null &&
                bootstrapConnectKeyRef.current !== activeGameKey;

            if (
                controllerMatchesActiveGame &&
                !shouldBypassReconnectGuard &&
                !canReconnectController(boardController)
            ) {
                logKibitzVariationDebug("kibitz-current-game-keeper:connect-skipped", {
                    reason,
                    debugSource,
                    roomId,
                    gameId: activeGameId,
                    currentLiveTailMoveNumber: currentLiveTailMoveNumberRef.current,
                    controllerCurrentMoveNumber:
                        boardController.goban?.engine?.cur_move?.move_number ?? null,
                    controllerOfficialTailMoveNumber:
                        boardController.goban?.engine?.last_official_move?.move_number ?? null,
                });
                return;
            }

            sendGameConnect(activeGameId, reason, debugSource, roomId);

            if (shouldBypassReconnectGuard) {
                bootstrapConnectKeyRef.current = activeGameKey;
            }
        },
        [
            activeGameId,
            activeGameKey,
            allowReconnect,
            boardController,
            canReconnectController,
            debugSource,
            roomId,
        ],
    );

    const scheduleAnimationFrame = React.useCallback((callback: FrameRequestCallback): number => {
        if (typeof window.requestAnimationFrame === "function") {
            return window.requestAnimationFrame(callback);
        }

        return window.setTimeout(() => {
            callback(window.performance.now());
        }, 16);
    }, []);

    const scheduleReconnectBurst = React.useCallback(
        (reason: string) => {
            if (!allowReconnect) {
                return;
            }

            if (activeGameId == null) {
                return;
            }

            clearScheduledReconnects();

            for (const delay of PICKER_CLOSE_RECONNECT_DELAYS_MS) {
                const timeoutId = window.setTimeout(() => {
                    connect(`${reason}:${delay}ms`);
                }, delay);
                scheduledTimeoutIdsRef.current.push(timeoutId);
            }

            const firstRafId = scheduleAnimationFrame(() => {
                connect(`${reason}:raf1`);

                const secondRafId = scheduleAnimationFrame(() => {
                    connect(`${reason}:raf2`);
                });
                scheduledRafIdsRef.current.push(secondRafId);
            });
            scheduledRafIdsRef.current.push(firstRafId);
        },
        [activeGameId, allowReconnect, clearScheduledReconnects, connect, scheduleAnimationFrame],
    );

    React.useEffect(() => {
        if (activeGameId == null) {
            bootstrapConnectKeyRef.current = null;
            clearScheduledReconnects();
            return;
        }

        if (!allowReconnect) {
            logKibitzVariationDebug("kibitz-current-game-keeper:skip-root-live-board", {
                debugSource,
                roomId,
                gameId: activeGameId,
                currentLiveTailMoveNumber: currentLiveTailMoveNumberRef.current,
                boardOfficialTailMoveNumber:
                    boardController?.goban?.engine?.last_official_move?.move_number ?? 0,
            });
            clearScheduledReconnects();
            return;
        }

        connect("mount-or-game-change");

        return () => {
            clearScheduledReconnects();
            logKibitzVariationDebug("kibitz-current-game-keeper:release-without-disconnect", {
                debugSource,
                roomId,
                gameId: activeGameId,
            });

            // Do not send game/disconnect here.
            // Future improvement: shared Goban/socket-level ref-counting.
        };
    }, [
        activeGameId,
        allowReconnect,
        boardController,
        clearScheduledReconnects,
        connect,
        debugSource,
        roomId,
    ]);

    React.useEffect(() => {
        if (activeGameId == null) {
            previousPickerOpenRef.current = pickerOpen;
            return;
        }

        if (!allowReconnect) {
            previousPickerOpenRef.current = pickerOpen;
            return;
        }

        const previousPickerOpen = previousPickerOpenRef.current;
        previousPickerOpenRef.current = pickerOpen;

        if (!previousPickerOpen && pickerOpen) {
            clearScheduledReconnects();
            connect("picker-open");
            return;
        }

        if (previousPickerOpen && !pickerOpen) {
            scheduleReconnectBurst("picker-close");
        }
    }, [activeGameId, allowReconnect, connect, pickerOpen, scheduleReconnectBurst]);

    React.useEffect(() => {
        if (activeGameId == null) {
            previousBoardControllerRef.current = boardController;
            return;
        }

        if (!allowReconnect) {
            previousBoardControllerRef.current = boardController;
            return;
        }

        const previousBoardController = previousBoardControllerRef.current;
        previousBoardControllerRef.current = boardController;

        if (previousBoardController !== boardController) {
            scheduleReconnectBurst("main-board-controller-change");
        }
    }, [activeGameId, allowReconnect, boardController, scheduleReconnectBurst]);

    React.useEffect(() => {
        if (activeGameId == null) {
            return;
        }

        if (!allowReconnect) {
            return;
        }

        const onFocus = () => {
            connect("window-focus");
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                connect("document-visible");
            }
        };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [activeGameId, allowReconnect, connect]);

    React.useEffect(() => {
        if (activeGameId == null) {
            return;
        }

        if (!allowReconnect) {
            return;
        }

        const intervalId = window.setInterval(() => {
            connect("interval-keepalive");
        }, KEEPALIVE_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [activeGameId, allowReconnect, connect]);

    React.useEffect(() => {
        return () => {
            clearScheduledReconnects();
        };
    }, [clearScheduledReconnects]);
}
