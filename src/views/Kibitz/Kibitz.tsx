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
import { useNavigate, useParams } from "react-router-dom";
import { pgettext } from "@/lib/translate";
import { KibitzController } from "@/lib/KibitzController";
import type {
    KibitzRoom,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
} from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage } from "./KibitzRoomStage";
import { KibitzRoomStream } from "./KibitzRoomStream";
import { KibitzPresence } from "./KibitzPresence";
import "./Kibitz.css";

export function Kibitz(): React.ReactElement {
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const controllerRef = React.useRef<KibitzController | null>(null);

    if (!controllerRef.current) {
        controllerRef.current = new KibitzController();
    }

    const controller = controllerRef.current;
    const [rooms, setRooms] = React.useState<KibitzRoomSummary[]>(controller.rooms);
    const [activeRoom, setActiveRoom] = React.useState<KibitzRoom | null>(controller.active_room);
    const [stream, setStream] = React.useState<KibitzStreamItem[]>(controller.stream);
    const [secondaryPane, setSecondaryPane] = React.useState<KibitzSecondaryPaneState>(
        controller.secondary_pane,
    );

    React.useEffect(() => {
        controller.on("rooms-changed", setRooms);
        controller.on("room-changed", setActiveRoom);
        controller.on("stream-changed", setStream);
        controller.on("secondary-pane-changed", setSecondaryPane);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("secondary-pane-changed", setSecondaryPane);
        };
    }, [controller]);

    React.useEffect(() => {
        const nextRoomId = roomId ?? controller.default_room_id;

        if (!nextRoomId) {
            return;
        }

        if (!roomId) {
            void navigate(`/kibitz/${nextRoomId}`, { replace: true });
            return;
        }

        controller.selectRoom(nextRoomId);
    }, [controller, navigate, roomId]);

    const onSelectRoom = React.useCallback(
        (nextRoomId: string) => {
            void navigate(`/kibitz/${nextRoomId}`);
        },
        [navigate],
    );

    const onPreviewGame = React.useCallback(
        (gameId: number) => {
            controller.previewGame(gameId);
        },
        [controller],
    );

    const onClearPreview = React.useCallback(() => {
        controller.clearPreviewGame();
    }, [controller]);

    const resolvedRoom = activeRoom ?? rooms.find((room) => room.id === roomId) ?? rooms[0];

    if (!resolvedRoom) {
        return (
            <div className="Kibitz">
                <div className="Kibitz-header">
                    <h1>{pgettext("Title for the kibitz page", "Kibitz")}</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="Kibitz">
            <div className="Kibitz-header">
                <h1>{pgettext("Title for the kibitz page", "Kibitz")}</h1>
            </div>
            <div className="Kibitz-layout">
                <KibitzRoomList
                    rooms={rooms}
                    activeRoomId={resolvedRoom.id}
                    onSelectRoom={onSelectRoom}
                />
                <div className="Kibitz-main">
                    <KibitzRoomStage
                        room={resolvedRoom}
                        rooms={rooms}
                        secondaryPane={secondaryPane}
                        onPreviewGame={onPreviewGame}
                        onClearPreview={onClearPreview}
                    />
                    <div className="Kibitz-sidebar">
                        <KibitzRoomStream room={resolvedRoom} items={stream} />
                        <KibitzPresence room={resolvedRoom} />
                    </div>
                </div>
            </div>
        </div>
    );
}
