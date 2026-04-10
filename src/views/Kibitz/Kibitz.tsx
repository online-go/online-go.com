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

type SecondaryPaneMode = "hidden" | "small" | "equal";

export function Kibitz(): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const controllerRef = React.useRef<KibitzController | null>(null);

    if (!controllerRef.current || controllerRef.current.destroyed) {
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
    const [pendingSecondaryPaneMode, setPendingSecondaryPaneMode] =
        React.useState<SecondaryPaneMode | null>(null);
    const [debug, setDebug] = React.useState<KibitzDebugState>(controller.debug);
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);

    const currentSecondaryPaneMode: SecondaryPaneMode = secondaryPane.collapsed
        ? "hidden"
        : (secondaryPane.size ?? "small");

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
        if (mode !== "demo") {
            return;
        }

        const syncDemoState = () => {
            setRooms(controller.rooms);
            setActiveRoom(controller.active_room);
            setStream(controller.stream);
            setProposals(controller.proposals);
            setVariations(controller.variations);
            setSecondaryPane(controller.secondary_pane);
            setDebug(controller.debug);
        };

        syncDemoState();
        const timer = window.setInterval(syncDemoState, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [controller, mode]);

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

    const onClearPreview = React.useCallback(() => {
        controller.clearPreviewGame();
    }, [controller]);

    const onOpenVariation = React.useCallback(
        (variationId: string) => {
            controller.openVariation(variationId);
        },
        [controller],
    );

    const onSetSecondaryPaneMode = React.useCallback((nextMode: SecondaryPaneMode) => {
        setPendingSecondaryPaneMode(nextMode);
    }, []);

    React.useEffect(() => {
        if (!pendingSecondaryPaneMode || pendingSecondaryPaneMode === currentSecondaryPaneMode) {
            if (pendingSecondaryPaneMode && pendingSecondaryPaneMode === currentSecondaryPaneMode) {
                setPendingSecondaryPaneMode(null);
            }
            return;
        }

        if (pendingSecondaryPaneMode === "hidden") {
            controller.decreaseSecondaryPaneSize();
            return;
        }

        if (pendingSecondaryPaneMode === "small") {
            if (currentSecondaryPaneMode === "hidden") {
                controller.increaseSecondaryPaneSize();
            } else {
                controller.decreaseSecondaryPaneSize();
            }
            return;
        }

        if (pendingSecondaryPaneMode === "equal") {
            controller.increaseSecondaryPaneSize();
        }
    }, [controller, currentSecondaryPaneMode, pendingSecondaryPaneMode]);

    const onVoteProposal = React.useCallback(
        (proposalId: string, choice: "change" | "keep") => {
            controller.voteOnProposal(proposalId, choice);
        },
        [controller],
    );

    const resolvedRoom = activeRoom ?? rooms.find((room) => room.id === roomId) ?? rooms[0];
    const roomProposals = proposals.filter((proposal) => proposal.room_id === resolvedRoom?.id);
    const activeProposal = roomProposals.find((proposal) => proposal.status === "active");
    const queuedRoomProposals = roomProposals.filter((proposal) => proposal.status !== "active");

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

    const resolvedRoomUsers = resolvedRoom ? controller.getRoomUsers(resolvedRoom.id) : [];
    const roomUsersById = React.useMemo(
        () =>
            Object.fromEntries(
                rooms.map((room) => [room.id, controller.getRoomUsers(room.id)]),
            ) as Record<string, ReturnType<typeof controller.getRoomUsers>>,
        [controller, rooms, activeRoom, stream],
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
                        roomUsersById={roomUsersById}
                        onSelectRoom={onSelectRoom}
                    />
                    <KibitzPresence mode={mode} room={resolvedRoom} users={resolvedRoomUsers} />
                </div>
                <div className="Kibitz-main">
                    <div className="Kibitz-content">
                        <KibitzRoomStage
                            mode={mode}
                            room={resolvedRoom}
                            rooms={rooms}
                            proposals={roomProposals}
                            variations={variations}
                            secondaryPane={secondaryPane}
                            onClearPreview={onClearPreview}
                            onProposePreview={onProposePreview}
                            onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                        />
                        <div
                            className={
                                "Kibitz-sidebar" +
                                (activeProposal ? " has-active-proposal" : " no-active-proposal")
                            }
                        >
                            <div className="Kibitz-sidebar-proposal-slot">
                                <KibitzProposalBar
                                    proposal={activeProposal}
                                    onVote={onVoteProposal}
                                />
                            </div>
                            <KibitzRoomStream
                                mode={mode}
                                room={resolvedRoom}
                                items={stream}
                                variations={variations}
                                onOpenVariation={onOpenVariation}
                                onSendMessage={onSendMessage}
                            />
                            <div className="Kibitz-footer-panels">
                                {variations.length === 0 && queuedRoomProposals.length === 0 ? (
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
                                        {queuedRoomProposals.length > 0 ? (
                                            <KibitzProposalQueue proposals={queuedRoomProposals} />
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
