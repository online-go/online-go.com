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
import { GobanController } from "@/lib/GobanController";
import { interpolate, pgettext } from "@/lib/translate";
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
import { KibitzController } from "./KibitzController";
import { KibitzGamePickerOverlay } from "./KibitzGamePickerOverlay";
import "./Kibitz.css";

type SecondaryPaneMode = "hidden" | "small" | "equal";
type MobileCompanionPanel = "chat" | "vote" | "compare";
type KibitzGamePickerMode = "create-room" | "change-board" | null;

const MOBILE_LAYOUT_MEDIA_QUERY = "(max-width: 1000px)";

function formatMobileMatchup(
    room: KibitzRoom | KibitzRoomSummary | null | undefined,
): string | null {
    const game = room?.current_game;

    if (!game) {
        return null;
    }

    return interpolate(pgettext("Mobile kibitz room matchup label", "{{black}} vs {{white}}"), {
        black: game.black.username,
        white: game.white.username,
    });
}

export function Kibitz(): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const controllerRef = React.useRef<KibitzController | null>(null);
    const pendingScrollRequestIdRef = React.useRef(0);

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
    const [pendingScrollVariationRequest, setPendingScrollVariationRequest] = React.useState<{
        variationId: string;
        requestId: number;
    } | null>(null);
    const [pendingSecondaryPaneMode, setPendingSecondaryPaneMode] =
        React.useState<SecondaryPaneMode | null>(null);
    const [debug, setDebug] = React.useState<KibitzDebugState>(controller.debug);
    const [mobileCompanionPanel, setMobileCompanionPanel] =
        React.useState<MobileCompanionPanel>("chat");
    const [mobileRoomsOpen, setMobileRoomsOpen] = React.useState(false);
    const [isMobileLayout, setIsMobileLayout] = React.useState(
        () => window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches,
    );
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY);
        const sync = (event?: MediaQueryListEvent) => {
            setIsMobileLayout(event?.matches ?? mediaQuery.matches);
        };

        sync();
        mediaQuery.addEventListener("change", sync);

        return () => {
            mediaQuery.removeEventListener("change", sync);
        };
    }, []);

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
            if (isMobileLayout) {
                setMobileCompanionPanel("chat");
                setMobileRoomsOpen(false);
            }
            void navigate(`/kibitz/${nextRoomId}`);
        },
        [isMobileLayout, navigate],
    );

    const onClearPreview = React.useCallback(() => {
        controller.clearPreviewGame();
        if (isMobileLayout) {
            setMobileCompanionPanel("chat");
            setPendingSecondaryPaneMode("hidden");
        }
    }, [controller, isMobileLayout]);

    const onOpenVariation = React.useCallback(
        (variationId: string) => {
            controller.openVariation(variationId);
            setPendingScrollVariationRequest({
                variationId,
                requestId: ++pendingScrollRequestIdRef.current,
            });
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
                setPendingSecondaryPaneMode("equal");
            }
        },
        [controller, isMobileLayout],
    );
    const onCreateVariation = React.useCallback(() => {
        controller.startVariationFromCurrentBoard();
        if (isMobileLayout) {
            setMobileCompanionPanel("compare");
            setPendingSecondaryPaneMode("equal");
        }
    }, [controller, isMobileLayout]);
    const onScrolledToVariation = React.useCallback(() => {
        setPendingScrollVariationRequest(null);
    }, []);
    const onSetSecondaryPaneMode = React.useCallback((nextMode: SecondaryPaneMode) => {
        setPendingSecondaryPaneMode(nextMode);
    }, []);

    const [pickerMode, setPickerMode] = React.useState<KibitzGamePickerMode>(null);

    const onOpenCreateRoom = React.useCallback(() => {
        setPickerMode("create-room");
    }, []);

    const onOpenChangeBoard = React.useCallback(() => {
        setPickerMode("change-board");
    }, []);

    const onClosePicker = React.useCallback(() => {
        setPickerMode(null);
    }, []);

    React.useEffect(() => {
        if (!pendingSecondaryPaneMode) {
            return;
        }

        if (pendingSecondaryPaneMode === currentSecondaryPaneMode) {
            setPendingSecondaryPaneMode(null);
            return;
        }

        controller.setSecondaryPaneMode(pendingSecondaryPaneMode);
        setPendingSecondaryPaneMode(null);
    }, [controller, currentSecondaryPaneMode, pendingSecondaryPaneMode]);

    const onVoteProposal = React.useCallback(
        (proposalId: string, choice: "change" | "keep") => {
            controller.voteOnProposal(proposalId, choice);
        },
        [controller],
    );

    const resolvedRoom = activeRoom ?? rooms.find((room) => room.id === roomId) ?? rooms[0];
    const currentGameId = resolvedRoom?.current_game?.game_id ?? null;
    const roomProposals = proposals.filter((proposal) => proposal.room_id === resolvedRoom?.id);
    const activeProposal = roomProposals.find((proposal) => proposal.status === "active");
    const queuedRoomProposals = roomProposals.filter((proposal) => proposal.status !== "active");
    const proposalBackedPreview = Boolean(
        secondaryPane.preview_game_id &&
            roomProposals.some(
                (proposal) => proposal.proposed_game.game_id === secondaryPane.preview_game_id,
            ),
    );
    const hasCompareTarget = Boolean(
        secondaryPane.variation_id || (secondaryPane.preview_game_id && !proposalBackedPreview),
    );

    const onPostVariation = React.useCallback(
        (boardController: GobanController) => {
            if (resolvedRoom) {
                controller.postVariation(resolvedRoom.id, boardController);
            }
        },
        [controller, resolvedRoom],
    );

    const onSendMessage = React.useCallback(
        (text: string) => {
            if (resolvedRoom) {
                controller.sendMessage(resolvedRoom.id, text);
            }
        },
        [controller, resolvedRoom],
    );

    const variationPanels = (
        <>
            {variations.length === 0 ? (
                <div className="Kibitz-footer-empty">
                    {pgettext(
                        "Compact empty state shown below the kibitz room stream when there are no variations or queued proposals",
                        "No variations yet. Watch next queue empty.",
                    )}
                </div>
            ) : (
                <KibitzVariationList
                    variations={variations}
                    currentGameId={currentGameId}
                    onOpenVariation={onOpenVariation}
                />
            )}
            {queuedRoomProposals.length > 0 ? (
                <KibitzProposalQueue proposals={queuedRoomProposals} />
            ) : null}
        </>
    );

    React.useEffect(() => {
        if (!isMobileLayout) {
            setMobileCompanionPanel("chat");
            setMobileRoomsOpen(false);
            return;
        }

        setMobileCompanionPanel("chat");
        setMobileRoomsOpen(false);
    }, [isMobileLayout, resolvedRoom?.id]);

    React.useEffect(() => {
        if (!isMobileLayout) {
            return;
        }

        if (mobileCompanionPanel === "compare" && !hasCompareTarget) {
            setMobileCompanionPanel("chat");
            if (currentSecondaryPaneMode !== "hidden") {
                setPendingSecondaryPaneMode("hidden");
            }
        }
    }, [currentSecondaryPaneMode, hasCompareTarget, isMobileLayout, mobileCompanionPanel]);

    const onSelectMobileCompanionPanel = React.useCallback(
        (panel: MobileCompanionPanel) => {
            setMobileCompanionPanel(panel);

            if (!isMobileLayout) {
                return;
            }

            if (panel === "compare") {
                if (hasCompareTarget) {
                    setPendingSecondaryPaneMode("equal");
                }
                return;
            }

            if (currentSecondaryPaneMode !== "hidden") {
                setPendingSecondaryPaneMode("hidden");
            }
        },
        [currentSecondaryPaneMode, hasCompareTarget, isMobileLayout],
    );

    const onToggleMobileRooms = React.useCallback(() => {
        setMobileRoomsOpen((open) => !open);
    }, []);

    const resolvedRoomUsers = resolvedRoom ? controller.getRoomUsers(resolvedRoom.id) : [];
    const mobileMatchup = formatMobileMatchup(resolvedRoom);
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
                        onCreateRoom={onOpenCreateRoom}
                    />
                    <KibitzPresence mode={mode} room={resolvedRoom} users={resolvedRoomUsers} />
                </div>
                <div className="Kibitz-main">
                    {isMobileLayout ? (
                        <>
                            <button
                                type="button"
                                className="Kibitz-mobile-room-bar"
                                onClick={onToggleMobileRooms}
                                aria-expanded={mobileRoomsOpen}
                            >
                                <div className="mobile-room-header-title">{resolvedRoom.title}</div>
                                {mobileMatchup ? (
                                    <div className="mobile-room-header-matchup">
                                        {mobileMatchup}
                                    </div>
                                ) : null}
                                <div className="mobile-room-header-meta">
                                    <span
                                        className="mobile-room-viewer-icon"
                                        title={interpolate(
                                            pgettext(
                                                "Tooltip for the viewer count shown in the mobile kibitz room header",
                                                "{{count}} people here",
                                            ),
                                            { count: resolvedRoom.viewer_count },
                                        )}
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            focusable="false"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M8 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1c-2.7 0-5 1.4-5 3.2V14h10v-1.8C13 10.4 10.7 9 8 9Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </span>
                                    <span className="mobile-room-viewer-count">
                                        {resolvedRoom.viewer_count}
                                    </span>
                                </div>
                            </button>
                            {mobileRoomsOpen ? (
                                <div className="Kibitz-mobile-rooms-drawer">
                                    <KibitzRoomList
                                        rooms={rooms}
                                        activeRoomId={resolvedRoom.id}
                                        roomUsersById={roomUsersById}
                                        onSelectRoom={onSelectRoom}
                                        onCreateRoom={onOpenCreateRoom}
                                        onCreateVariation={onCreateVariation}
                                        onChangeBoard={onOpenChangeBoard}
                                    />
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    <div className="Kibitz-content">
                        <KibitzRoomStage
                            mode={mode}
                            room={resolvedRoom}
                            rooms={rooms}
                            proposals={roomProposals}
                            variations={variations}
                            secondaryPane={secondaryPane}
                            onClearPreview={onClearPreview}
                            onPostVariation={onPostVariation}
                            onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                            onChangeBoard={isMobileLayout ? undefined : onOpenChangeBoard}
                            onCreateVariation={isMobileLayout ? undefined : onCreateVariation}
                            isMobileLayout={isMobileLayout}
                            mobileCompanionPanel={mobileCompanionPanel}
                            mobileVoteHasAlert={Boolean(activeProposal)}
                            hasCompareTarget={hasCompareTarget}
                            onSelectMobileCompanionPanel={onSelectMobileCompanionPanel}
                        />
                        <div
                            className={
                                "Kibitz-sidebar" +
                                (activeProposal ? " has-active-proposal" : " no-active-proposal")
                            }
                        >
                            {isMobileLayout ? (
                                <>
                                    <div className="Kibitz-mobile-panel-surface">
                                        {mobileCompanionPanel === "chat" ? (
                                            <KibitzRoomStream
                                                mode={mode}
                                                room={resolvedRoom}
                                                items={stream}
                                                variations={variations}
                                                onOpenVariation={onOpenVariation}
                                                onSendMessage={onSendMessage}
                                                scrollToVariationId={
                                                    pendingScrollVariationRequest?.variationId ??
                                                    null
                                                }
                                                scrollToVariationRequestId={
                                                    pendingScrollVariationRequest?.requestId ?? null
                                                }
                                                onScrolledToVariation={onScrolledToVariation}
                                                compact={true}
                                            />
                                        ) : null}
                                        {mobileCompanionPanel === "vote" ? (
                                            <div className="Kibitz-mobile-panel Kibitz-mobile-vote-panel">
                                                {activeProposal ? (
                                                    <KibitzProposalBar
                                                        proposal={activeProposal}
                                                        onVote={onVoteProposal}
                                                    />
                                                ) : (
                                                    <div className="Kibitz-mobile-panel-empty">
                                                        {pgettext(
                                                            "Empty state shown in the mobile kibitz vote panel when no vote is active",
                                                            "No live vote right now.",
                                                        )}
                                                    </div>
                                                )}
                                                {queuedRoomProposals.length > 0 ? (
                                                    <KibitzProposalQueue
                                                        proposals={queuedRoomProposals}
                                                    />
                                                ) : null}
                                            </div>
                                        ) : null}
                                        {mobileCompanionPanel === "compare" ? (
                                            <div className="Kibitz-mobile-panel Kibitz-mobile-compare-panel">
                                                {hasCompareTarget ? (
                                                    <div className="Kibitz-mobile-panel-note">
                                                        {pgettext(
                                                            "Helper text shown in the mobile kibitz compare panel",
                                                            "Comparison board is active above. Variations and queue stay here.",
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="Kibitz-mobile-panel-empty">
                                                        {pgettext(
                                                            "Empty state shown in the mobile kibitz compare panel",
                                                            "Open a variation or preview to compare here.",
                                                        )}
                                                    </div>
                                                )}
                                                <div className="Kibitz-footer-panels">
                                                    {variationPanels}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            ) : (
                                <>
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
                                        scrollToVariationId={
                                            pendingScrollVariationRequest?.variationId ?? null
                                        }
                                        scrollToVariationRequestId={
                                            pendingScrollVariationRequest?.requestId ?? null
                                        }
                                        onScrolledToVariation={onScrolledToVariation}
                                        compact={Boolean(activeProposal)}
                                    />
                                    <div className="Kibitz-footer-panels">{variationPanels}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {pickerMode ? (
                <KibitzGamePickerOverlay
                    mode={pickerMode}
                    rooms={rooms}
                    currentRoom={resolvedRoom}
                    onClose={onClosePicker}
                    onCreateRoom={(game, roomName, description) => {
                        const nextRoomId = controller.createRoom(game, roomName, description);
                        setPickerMode(null);
                        if (nextRoomId) {
                            void navigate(`/kibitz/${nextRoomId}`);
                        }
                    }}
                    onChangeBoard={(game) => {
                        if (!resolvedRoom) {
                            return;
                        }

                        controller.changeBoard(resolvedRoom.id, game);
                        setPickerMode(null);
                    }}
                    onJoinRoom={(nextRoomId) => {
                        setPickerMode(null);
                        void navigate(`/kibitz/${nextRoomId}`);
                    }}
                />
            ) : null}
        </div>
    );
}
