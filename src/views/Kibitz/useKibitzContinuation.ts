/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
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
import { get } from "@/lib/requests";
import { socket } from "@/lib/sockets";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary, KibitzWatchedGame } from "@/models/kibitz";
import { useGameKibitzRooms } from "@/views/Game/useGameKibitzRooms";
import type { KibitzController } from "./KibitzController";
import { isKibitzRoomTitleTakenError } from "./kibitzAnalysisPolicyText";

export function getKibitzContinuationTitle(game: KibitzWatchedGame): string {
    return `${game.black.username} vs ${game.white.username} · #${game.game_id}`;
}

export function findKibitzContinuationRoom(
    rooms: KibitzRoomSummary[],
    title: string,
): KibitzRoomSummary | null {
    return rooms.find((room) => room.kind === "user" && room.title === title) ?? null;
}

export interface KibitzContinuationState {
    actionTitle: string;
    continuationRoom: KibitzRoomSummary | null;
    gameTitle: string;
    creating: boolean;
    visible: boolean;
    onActivate: () => Promise<void>;
}

export function useKibitzContinuation(params: {
    controller: KibitzController;
    room: KibitzRoomSummary | null;
    canCreate: boolean;
    blocked: boolean;
    navigateToRoom: (roomId: string) => void;
    onError: () => void;
}): KibitzContinuationState {
    const { controller, room, canCreate, blocked, navigateToRoom, onError } = params;
    const game = room?.current_game;
    const gameId = game?.game_id;
    const title = game ? getKibitzContinuationTitle(game) : "";
    const preset = room?.kind === "preset";
    const rooms = useGameKibitzRooms(gameId, !preset || blocked);
    const liveContinuationRoom = findKibitzContinuationRoom(rooms, title);
    const [titleTakenRoom, setTitleTakenRoom] = React.useState<KibitzRoomSummary | null>(null);
    const [creating, setCreating] = React.useState(false);
    const sourceRef = React.useRef({ roomId: room?.id ?? null, gameId });
    const announcedRoomsRef = React.useRef(new Set<string>());

    sourceRef.current = { roomId: room?.id ?? null, gameId };

    React.useEffect(() => {
        setTitleTakenRoom(null);
        setCreating(false);
    }, [room?.id, gameId]);

    React.useEffect(() => {
        if (!titleTakenRoom) {
            return;
        }
        const clearTransientRoom = () => setTitleTakenRoom(null);
        socket.on("connect", clearTransientRoom);
        return () => {
            socket.off("connect", clearTransientRoom);
        };
    }, [titleTakenRoom]);

    const continuationRoom =
        liveContinuationRoom ??
        (titleTakenRoom &&
        titleTakenRoom.current_game_id === gameId &&
        titleTakenRoom.title === title
            ? titleTakenRoom
            : null);

    const onActivate = React.useCallback(async () => {
        if (!room || !game || !gameId || blocked) {
            return;
        }
        if (continuationRoom) {
            navigateToRoom(continuationRoom.id);
            return;
        }
        if (!canCreate || creating) {
            return;
        }

        setCreating(true);
        try {
            const currentRooms = (await get("kibitz/rooms", {
                game: gameId,
            })) as KibitzRoomSummary[];
            if (sourceRef.current.roomId !== room.id || sourceRef.current.gameId !== gameId) {
                return;
            }
            const currentMatch = findKibitzContinuationRoom(currentRooms ?? [], title);
            if (currentMatch) {
                setTitleTakenRoom(currentMatch);
                return;
            }

            const newRoomId = await controller.createRoom(game, title, "", {
                select: false,
                beforeSelectRoom: (continuationRoomId) => {
                    const latestSource = sourceRef.current;
                    if (latestSource.roomId !== room.id || latestSource.gameId !== gameId) {
                        return;
                    }

                    const announcementKey = `${room.id}:${gameId}:${continuationRoomId}`;
                    if (!announcedRoomsRef.current.has(announcementKey)) {
                        announcedRoomsRef.current.add(announcementKey);
                        controller.postContinuationRoomAnnouncement(
                            room.id,
                            gameId,
                            continuationRoomId,
                            title,
                        );
                    }
                },
            });
            if (!newRoomId) {
                onError();
                return;
            }

            const latestSource = sourceRef.current;
            if (latestSource.roomId !== room.id || latestSource.gameId !== gameId) {
                return;
            }
            navigateToRoom(newRoomId);
        } catch (error) {
            if (isKibitzRoomTitleTakenError(error)) {
                try {
                    const currentRooms = (await get("kibitz/rooms", {
                        game: gameId,
                    })) as KibitzRoomSummary[];
                    if (
                        sourceRef.current.roomId !== room.id ||
                        sourceRef.current.gameId !== gameId
                    ) {
                        return;
                    }
                    const currentMatch = findKibitzContinuationRoom(currentRooms ?? [], title);
                    if (currentMatch) {
                        setTitleTakenRoom(currentMatch);
                        return;
                    }
                } catch {
                    // The ordinary create error remains visible if refresh also fails.
                }
            }
            onError();
        } finally {
            setCreating(false);
        }
    }, [
        blocked,
        canCreate,
        continuationRoom,
        controller,
        creating,
        game,
        gameId,
        navigateToRoom,
        onError,
        room?.id,
        title,
    ]);

    const actionTitle = continuationRoom
        ? interpolate(
              pgettext(
                  "Action that joins a Kibitz continuation room, including its viewers",
                  "Join continuation room (%s)",
              ),
              [String(continuationRoom.viewer_count)],
          )
        : pgettext(
              "Action that creates a room to continue watching a Kibitz preset game",
              "Continue in new room",
          );

    return {
        actionTitle: creating
            ? pgettext("Disabled Kibitz continuation room action while creating", "Creating room…")
            : actionTitle,
        continuationRoom,
        gameTitle: game?.title ?? "",
        creating,
        visible: Boolean(preset && game && canCreate && !blocked),
        onActivate,
    };
}
