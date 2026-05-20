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
import { type GobanRendererConfig } from "goban";
import { GobanController } from "@/lib/GobanController";
import { socket } from "@/lib/sockets";
import type { KibitzWatchedGame } from "@/models/kibitz";
import type { KibitzCurrentGameBaseSnapshot } from "./KibitzRoomStage";
import { captureCurrentGameBaseSnapshotFromController } from "./kibitzCurrentGameBaseSnapshot";
import { logKibitzVariationDebug } from "./kibitzVariationDebug";

const BROKER_RECONNECT_DELAYS_MS = [0, 50, 250, 1000] as const;

interface UseKibitzCurrentGameBaseBrokerOptions {
    enabled: boolean;
    roomId: string | null | undefined;
    game: KibitzWatchedGame | null | undefined;
    currentLiveTailMoveNumber: number;
    visibleMainBoardMounted: boolean;
    onSnapshot: (snapshot: KibitzCurrentGameBaseSnapshot) => void;
}

function parseBoardDimensions(game: KibitzWatchedGame | null | undefined): {
    width: number;
    height: number;
} {
    const boardSize = game?.board_size;
    if (!boardSize) {
        return { width: 19, height: 19 };
    }

    const [width, height] = boardSize.split("x").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height };
    }

    return { width: 19, height: 19 };
}

function sendGameConnect(gameId: number): void {
    socket.send("game/connect", {
        game_id: gameId,
        chat: true,
    });
}

export function useKibitzCurrentGameBaseBroker({
    enabled,
    roomId,
    game,
    currentLiveTailMoveNumber,
    visibleMainBoardMounted,
    onSnapshot,
}: UseKibitzCurrentGameBaseBrokerOptions): void {
    const onSnapshotRef = React.useRef(onSnapshot);
    const currentLiveTailMoveNumberRef = React.useRef(currentLiveTailMoveNumber);
    const scheduledTimeoutIdsRef = React.useRef<number[]>([]);
    const scheduledRafIdsRef = React.useRef<number[]>([]);
    const controllerEpochRef = React.useRef(0);
    const activeControllerRef = React.useRef<GobanController | null>(null);
    const currentRoomIdRef = React.useRef(roomId ?? null);
    const currentGameIdRef = React.useRef(game?.game_id ?? null);

    React.useEffect(() => {
        onSnapshotRef.current = onSnapshot;
    }, [onSnapshot]);

    React.useEffect(() => {
        currentLiveTailMoveNumberRef.current = currentLiveTailMoveNumber;
    }, [currentLiveTailMoveNumber]);

    React.useEffect(() => {
        currentRoomIdRef.current = roomId ?? null;
    }, [roomId]);

    React.useEffect(() => {
        currentGameIdRef.current = game?.game_id ?? null;
    }, [game?.game_id]);

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

    const scheduleAnimationFrame = React.useCallback((callback: FrameRequestCallback): number => {
        if (typeof window.requestAnimationFrame === "function") {
            return window.requestAnimationFrame(callback);
        }

        return window.setTimeout(() => {
            callback(window.performance.now());
        }, 16);
    }, []);

    const scheduleReconnectBurst = React.useCallback(
        (reason: string, gameId: number) => {
            clearScheduledReconnects();

            for (const delay of BROKER_RECONNECT_DELAYS_MS) {
                const timeoutId = window.setTimeout(() => {
                    sendGameConnect(gameId);
                    logKibitzVariationDebug("room-base-broker:reconnect", {
                        reason,
                        delay,
                        roomId,
                        gameId,
                    });
                }, delay);
                scheduledTimeoutIdsRef.current.push(timeoutId);
            }

            const firstRafId = scheduleAnimationFrame(() => {
                sendGameConnect(gameId);
                const secondRafId = scheduleAnimationFrame(() => {
                    sendGameConnect(gameId);
                });
                scheduledRafIdsRef.current.push(secondRafId);
            });
            scheduledRafIdsRef.current.push(firstRafId);
        },
        [clearScheduledReconnects, roomId, scheduleAnimationFrame],
    );

    React.useEffect(() => {
        const activeGame = enabled && !visibleMainBoardMounted ? game : null;
        if (!activeGame) {
            clearScheduledReconnects();
            return;
        }

        const brokerContainer = document.createElement("div");
        brokerContainer.setAttribute("aria-hidden", "true");
        brokerContainer.style.position = "absolute";
        brokerContainer.style.width = "1px";
        brokerContainer.style.height = "1px";
        brokerContainer.style.overflow = "hidden";
        brokerContainer.style.pointerEvents = "none";
        brokerContainer.style.opacity = "0";
        brokerContainer.style.left = "-10000px";
        brokerContainer.style.top = "0";
        document.body.appendChild(brokerContainer);

        const { width, height } = parseBoardDimensions(activeGame);
        const config: GobanRendererConfig = {
            board_div: brokerContainer,
            interactive: false,
            connect_to_chat: false,
            game_id: activeGame.game_id,
            width,
            height,
            square_size: "auto",
        };
        const controller = new GobanController(config);
        let cancelled = false;
        const controllerEpoch = controllerEpochRef.current + 1;
        controllerEpochRef.current = controllerEpoch;
        activeControllerRef.current = controller;

        const isCurrentController = () =>
            controllerEpochRef.current === controllerEpoch &&
            activeControllerRef.current === controller &&
            currentRoomIdRef.current === roomId &&
            currentGameIdRef.current === activeGame.game_id &&
            controller.goban.parent?.isConnected;

        logKibitzVariationDebug("room-base-broker:create", {
            roomId,
            gameId: activeGame.game_id,
            enabled,
            visibleMainBoardMounted,
        });

        const sync = (reason: string) => {
            if (cancelled || !isCurrentController()) {
                return;
            }

            const snapshot = captureCurrentGameBaseSnapshotFromController(
                controller,
                activeGame,
                "room-base-broker",
                currentLiveTailMoveNumberRef.current,
            );

            if (!snapshot) {
                logKibitzVariationDebug("room-base-broker:not-ready", {
                    reason,
                    roomId,
                    gameId: activeGame.game_id,
                    currentLiveTailMoveNumber: currentLiveTailMoveNumberRef.current,
                });
                return;
            }

            onSnapshotRef.current(snapshot);
            logKibitzVariationDebug("room-base-broker:snapshot", {
                reason,
                roomId,
                gameId: snapshot.gameId,
                trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
                currentLiveTailMoveNumber: currentLiveTailMoveNumberRef.current,
            });
        };

        const onLoad = () => sync("load");
        const onGameData = () => sync("gamedata");
        const onLastOfficialMove = () => sync("last_official_move");
        const onMoveMade = () => sync("move-made");

        controller.goban.on("load", onLoad);
        controller.goban.on("gamedata", onGameData);
        controller.goban.on("last_official_move", onLastOfficialMove);
        controller.goban.on("move-made", onMoveMade);
        sync("mount");

        return () => {
            cancelled = true;
            controllerEpochRef.current += 1;
            if (activeControllerRef.current === controller) {
                activeControllerRef.current = null;
            }
            controller.goban.off("load", onLoad);
            controller.goban.off("gamedata", onGameData);
            controller.goban.off("last_official_move", onLastOfficialMove);
            controller.goban.off("move-made", onMoveMade);
            controller.destroy();
            brokerContainer.remove();
            clearScheduledReconnects();
            if (activeGame.game_id != null) {
                scheduleReconnectBurst("room-base-broker-cleanup", activeGame.game_id);
            }
            logKibitzVariationDebug("room-base-broker:destroy", {
                roomId,
                gameId: activeGame.game_id,
            });
        };
    }, [
        clearScheduledReconnects,
        enabled,
        game?.board_size,
        game?.game_id,
        roomId,
        scheduleReconnectBurst,
        visibleMainBoardMounted,
    ]);
}
