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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { KibitzController } from "@/lib/KibitzController";
import { pgettext } from "@/lib/translate";
import type {
    KibitzDebugState,
    KibitzMode,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
} from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import { KibitzDebugPanel } from "./KibitzDebugPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage } from "./KibitzRoomStage";
import { KibitzRoomStream } from "./KibitzRoomStream";
import { KibitzPresence } from "./KibitzPresence";
import { KibitzVariationList } from "./KibitzVariationList";
import "./Kibitz.css";

export function Kibitz(): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const controllerRef = React.useRef<KibitzController | null>(null);

    if (!controllerRef.current) {
        controllerRef.current = new KibitzController();
    }

    const controller = controllerRef.current;
    const [mode] = React.useState<KibitzMode>(controller.mode);
    const [rooms, setRooms] = React.useState<KibitzRoomSummary[]>(controller.rooms);
    const [activeRoom, setActiveRoom] = React.useState<KibitzRoom | null>(controller.active_room);
    const [stream, setStream] = React.useState<KibitzStreamItem[]>(controller.stream);
    const [proposals, setProposals] = React.useState<KibitzProposal[]>(controller.proposals);
    const [variations, setVariations] = React.useState(controller.variations);
    const [secondaryPane, setSecondaryPane] = React.useState<KibitzSecondaryPaneState>(
        controller.secondary_pane,
    );
    const [debug, setDebug] = React.useState<KibitzDebugState>(controller.debug);
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);

    React.useEffect(() => {
        controller.on("rooms-changed", setRooms);
        controller.on("room-changed", setActiveRoom);
        controller.on("stream-changed", setStream);
        controller.on("proposals-changed", setProposals);
        controller.on("variations-changed", setVariations);
        controller.on("secondary-pane-changed", setSecondaryPane);
        controller.on("debug-changed", setDebug);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("proposals-changed", setProposals);
            controller.off("variations-changed", setVariations);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.destroy();
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

    const onOpenVariation = React.useCallback(
        (variationId: string) => {
            controller.openVariation(variationId);
        },
        [controller],
    );

    const onIncreaseSecondaryPaneSize = React.useCallback(() => {
        controller.increaseSecondaryPaneSize();
    }, [controller]);

    const onDecreaseSecondaryPaneSize = React.useCallback(() => {
        controller.decreaseSecondaryPaneSize();
    }, [controller]);

    const onVoteProposal = React.useCallback(
        (proposalId: string, choice: "change" | "keep") => {
            controller.voteOnProposal(proposalId, choice);
        },
        [controller],
    );

    const resolvedRoom = activeRoom ?? rooms.find((room) => room.id === roomId) ?? rooms[0];
    const roomProposals = proposals.filter((proposal) => proposal.room_id === resolvedRoom?.id);
    const activeProposal = roomProposals.find((proposal) => proposal.status === "active");

    const onProposePreview = React.useCallback(() => {
        if (resolvedRoom) {
            controller.proposePreviewedGame(resolvedRoom.id);
        }
    }, [controller, resolvedRoom]);

    const onSendMessage = React.useCallback(
        (text: string) => {
            if (resolvedRoom) {
                controller.sendMessage(resolvedRoom.id, text);
            }
        },
        [controller, resolvedRoom],
    );

    if (!resolvedRoom) {
        return <div className="Kibitz" />;
    }

    return (
        <div className="Kibitz">
            {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
            <div className="Kibitz-layout">
                <div className="Kibitz-left-rail">
                    <KibitzRoomList
                        rooms={rooms}
                        activeRoomId={resolvedRoom.id}
                        onSelectRoom={onSelectRoom}
                    />
                    <KibitzPresence
                        mode={mode}
                        room={resolvedRoom}
                        users={controller.getRoomUsers(resolvedRoom.id)}
                    />
                </div>
                <div className="Kibitz-main">
                    <KibitzProposalBar proposal={activeProposal} onVote={onVoteProposal} />
                    <div className="Kibitz-content">
                        <KibitzRoomStage
                            mode={mode}
                            room={resolvedRoom}
                            rooms={rooms}
                            proposals={roomProposals}
                            variations={variations}
                            secondaryPane={secondaryPane}
                            onPreviewGame={onPreviewGame}
                            onClearPreview={onClearPreview}
                            onProposePreview={onProposePreview}
                            onIncreaseSecondaryPaneSize={onIncreaseSecondaryPaneSize}
                            onDecreaseSecondaryPaneSize={onDecreaseSecondaryPaneSize}
                        />
                        <div className="Kibitz-sidebar">
                            <KibitzRoomStream
                                mode={mode}
                                room={resolvedRoom}
                                items={stream}
                                variations={variations}
                                onOpenVariation={onOpenVariation}
                                onSendMessage={onSendMessage}
                            />
                            <div className="Kibitz-footer-panels">
                                {variations.length === 0 && roomProposals.length === 0 ? (
                                    <div className="Kibitz-footer-empty">
                                        {pgettext(
                                            "Compact empty state shown below the kibitz room stream when there are no variations or queued proposals",
                                            "No variations yet. Watch next queue empty.",
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {variations.length > 0 ? (
                                            <KibitzVariationList
                                                variations={variations}
                                                onOpenVariation={onOpenVariation}
                                            />
                                        ) : null}
                                        {roomProposals.length > 0 ? (
                                            <KibitzProposalQueue proposals={roomProposals} />
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
