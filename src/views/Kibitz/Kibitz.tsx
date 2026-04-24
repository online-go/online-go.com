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
import * as data from "@/lib/data";
import { alert } from "@/lib/swal_config";
import { interpolate, pgettext } from "@/lib/translate";
import type {
    KibitzDebugState,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import { KibitzDebugPanel } from "./KibitzDebugPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage } from "./KibitzRoomStage";
import { KibitzSharedStreamPanel } from "./KibitzSharedStreamPanel";
import { KibitzPresence } from "./KibitzPresence";
import { KibitzVariationList } from "./KibitzVariationList";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzController } from "./KibitzController";
import { KibitzGamePickerOverlay } from "./KibitzGamePickerOverlay";
import { KibitzMobileGamePicker } from "./KibitzMobileGamePicker";
import "./Kibitz.css";

type SecondaryPaneMode = "hidden" | "small" | "equal";
type MobileCompanionPanel = "chat" | "vote" | "compare";
type MobileOverlayMode = "rooms" | "create-room" | "change-board" | null;
type KibitzGamePickerMode = "create-room" | "change-board" | null;
interface PendingPostedVariation {
    gameId: number;
    creatorId: number;
    from?: number;
    moves?: string;
    title?: string;
}

const MOBILE_LAYOUT_MEDIA_QUERY = "(max-width: 1000px)";
const MOBILE_SPLIT_STORAGE_KEY = "kibitz-mobile-split-ratio";
const DEFAULT_MOBILE_SPLIT_RATIO = 0.56;
const MIN_MOBILE_SPLIT_RATIO = 0.36;
const MAX_MOBILE_SPLIT_RATIO = 0.78;

function clampMobileSplitRatio(value: number): number {
    return Math.min(MAX_MOBILE_SPLIT_RATIO, Math.max(MIN_MOBILE_SPLIT_RATIO, value));
}

function formatMobileMatchup(
    room: KibitzRoom | KibitzRoomSummary | null | undefined,
): { firstPlayer: string; secondPlayer: string } | null {
    const game = room?.current_game;

    if (!game) {
        return null;
    }

    return {
        firstPlayer: game.black.username,
        secondPlayer: game.white.username,
    };
}

export function Kibitz(): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const controllerRef = React.useRef<KibitzController | null>(null);

    if (!controllerRef.current || controllerRef.current.destroyed) {
        controllerRef.current = new KibitzController();
    }

    const controller = controllerRef.current;
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
    const [permissions, setPermissions] = React.useState(controller.permissions);
    const [mobileCompanionPanel, setMobileCompanionPanel] =
        React.useState<MobileCompanionPanel>("chat");
    const [mobileCompareController, setMobileCompareController] =
        React.useState<GobanController | null>(null);
    const [mobileOverlayMode, setMobileOverlayMode] = React.useState<MobileOverlayMode>(null);
    const [isMobileLayout, setIsMobileLayout] = React.useState(
        () => window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches,
    );
    const [mobileSplitRatio, setMobileSplitRatio] = React.useState(() => {
        const stored = window.localStorage.getItem(MOBILE_SPLIT_STORAGE_KEY);
        const parsed = stored ? Number.parseFloat(stored) : NaN;

        if (Number.isFinite(parsed)) {
            return clampMobileSplitRatio(parsed);
        }

        return DEFAULT_MOBILE_SPLIT_RATIO;
    });
    const [mobileViewerCountFlash, setMobileViewerCountFlash] = React.useState(false);
    const [visibleVariationIds, setVisibleVariationIds] = React.useState<string[]>([]);
    const [variationColorIndexes, setVariationColorIndexes] = React.useState<
        Record<string, number>
    >({});
    const [variationFocusRequestId, setVariationFocusRequestId] = React.useState(0);
    const [pendingPostedVariation, setPendingPostedVariation] =
        React.useState<PendingPostedVariation | null>(null);
    const mobileShellRef = React.useRef<HTMLDivElement | null>(null);
    const mobileDividerRef = React.useRef<HTMLDivElement | null>(null);
    const previousMobileViewerCountRef = React.useRef<number | null>(null);
    const mobileDragStateRef = React.useRef<{
        pointerId: number;
        startY: number;
        startRatio: number;
    } | null>(null);
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

    React.useEffect(() => {
        if (!isMobileLayout) {
            return;
        }

        window.localStorage.setItem(MOBILE_SPLIT_STORAGE_KEY, String(mobileSplitRatio));
    }, [isMobileLayout, mobileSplitRatio]);

    React.useEffect(() => {
        const stopDrag = () => {
            mobileDragStateRef.current = null;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };

        const onPointerMove = (event: PointerEvent) => {
            const dragState = mobileDragStateRef.current;
            const shell = mobileShellRef.current;

            if (!dragState || !shell) {
                return;
            }

            const shellRect = shell.getBoundingClientRect();
            if (shellRect.height <= 0) {
                return;
            }

            const ratioDelta = (event.clientY - dragState.startY) / shellRect.height;
            setMobileSplitRatio(clampMobileSplitRatio(dragState.startRatio + ratioDelta));
            event.preventDefault();
        };

        const onPointerUp = (event: PointerEvent) => {
            const dragState = mobileDragStateRef.current;
            if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
            }

            if (mobileDividerRef.current?.hasPointerCapture?.(event.pointerId)) {
                mobileDividerRef.current.releasePointerCapture(event.pointerId);
            }

            stopDrag();
        };

        window.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
            stopDrag();
        };
    }, []);

    React.useEffect(() => {
        if (!isMobileLayout) {
            mobileDragStateRef.current = null;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }
    }, [isMobileLayout]);

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
        controller.on("permissions-changed", setPermissions);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("proposals-changed", setProposals);
            controller.off("variations-changed", setVariations);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.off("permissions-changed", setPermissions);
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

        void controller.selectRoom(nextRoomId);
    }, [controller, navigate, roomId]);

    const onSelectRoom = React.useCallback(
        (nextRoomId: string) => {
            if (isMobileLayout) {
                setMobileCompanionPanel("chat");
                setMobileOverlayMode(null);
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

    const onConfirmClearSecondaryPane = React.useCallback(() => {
        void alert
            .fire({
                customClass: {
                    confirmButton: "reject",
                    cancelButton: "",
                },
                text: pgettext(
                    "Confirmation text for clearing the secondary kibitz pane preview",
                    "Clear this variation? Any variation that isn't shared will be lost.",
                ),
                confirmButtonText: pgettext(
                    "Confirmation button for clearing the secondary kibitz pane preview",
                    "Clear",
                ),
                cancelButtonText: pgettext(
                    "Cancel button for clearing the secondary kibitz pane preview",
                    "Cancel",
                ),
                showCancelButton: true,
                focusConfirm: true,
            })
            .then(({ value: confirmed }) => {
                if (confirmed) {
                    onClearPreview();
                }
            });
    }, [onClearPreview]);

    const onOpenVariation = React.useCallback(
        (variationId: string) => {
            setVisibleVariationIds((previous) =>
                previous.includes(variationId) ? previous : [...previous, variationId],
            );
            setVariationColorIndexes((previous) => {
                if (variationId in previous) {
                    return previous;
                }

                return {
                    ...previous,
                    [variationId]: Object.keys(previous).length,
                };
            });
            setVariationFocusRequestId((previous) => previous + 1);
            controller.openVariation(variationId);
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [controller, isMobileLayout],
    );
    const onToggleVariation = React.useCallback(
        (variationId: string) => {
            setVisibleVariationIds((previous) => {
                if (previous.includes(variationId)) {
                    const next = previous.filter((id) => id !== variationId);

                    if (secondaryPane.variation_id === variationId) {
                        controller.clearPreviewGame();
                    }

                    return next;
                }

                setVariationColorIndexes((previousColorIndexes) => {
                    if (variationId in previousColorIndexes) {
                        return previousColorIndexes;
                    }

                    return {
                        ...previousColorIndexes,
                        [variationId]: Object.keys(previousColorIndexes).length,
                    };
                });
                setVariationFocusRequestId((previousFocusRequestId) => previousFocusRequestId + 1);
                controller.openVariation(variationId);
                if (isMobileLayout) {
                    setMobileCompanionPanel("compare");
                }
                return [...previous, variationId];
            });
        },
        [controller, isMobileLayout, secondaryPane.variation_id],
    );
    const onCreateVariation = React.useCallback(() => {
        controller.startVariationFromCurrentBoard();
        if (isMobileLayout) {
            setMobileOverlayMode(null);
            setMobileCompanionPanel("compare");
        }
    }, [controller, isMobileLayout]);
    const onCreateVariationFromPostedVariation = React.useCallback(
        (variation: KibitzVariationSummary) => {
            controller.startVariationFromPostedVariation(variation);
            if (isMobileLayout) {
                setMobileOverlayMode(null);
                setMobileCompanionPanel("compare");
            }
        },
        [controller, isMobileLayout],
    );
    const onSetSecondaryPaneMode = React.useCallback((nextMode: SecondaryPaneMode) => {
        setPendingSecondaryPaneMode(nextMode);
    }, []);

    const [pickerMode, setPickerMode] = React.useState<KibitzGamePickerMode>(null);

    const onOpenCreateRoom = React.useCallback(() => {
        if (isMobileLayout) {
            setMobileOverlayMode("create-room");
            return;
        }

        setPickerMode("create-room");
    }, [isMobileLayout]);

    const onOpenChangeBoard = React.useCallback(() => {
        if (isMobileLayout) {
            setMobileOverlayMode("change-board");
            return;
        }

        setPickerMode("change-board");
    }, [isMobileLayout]);

    const handleOpenChangeBoard = permissions.can_change_board_directly
        ? onOpenChangeBoard
        : undefined;

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
    const selectedVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    React.useEffect(() => {
        setVisibleVariationIds((previous) =>
            previous.filter((variationId) =>
                variations.some((variation) => variation.id === variationId),
            ),
        );
    }, [variations]);
    const proposalBackedPreview = Boolean(
        secondaryPane.preview_game_id &&
        roomProposals.some(
            (proposal) => proposal.proposed_game.game_id === secondaryPane.preview_game_id,
        ),
    );
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryPane.preview_game_id)
            ?.current_game ??
        roomProposals.find(
            (proposal) => proposal.proposed_game.game_id === secondaryPane.preview_game_id,
        )?.proposed_game;
    const secondaryBoardGame = previewGame ?? secondaryPane.variation_source_game;
    const hasCompareTarget = Boolean(
        secondaryPane.variation_id || (secondaryPane.preview_game_id && !proposalBackedPreview),
    );
    const mobileCompareBoardLabel = selectedVariation
        ? pgettext("Label for the active mobile kibitz variation board", "Variation shown")
        : secondaryPane.variation_source_game
          ? pgettext("Label for the active mobile kibitz draft board", "New variation")
          : pgettext("Label for the active mobile kibitz preview board", "Preview");
    const mobileCompareBoardTitle =
        selectedVariation?.title ??
        secondaryBoardGame?.title ??
        pgettext("Fallback title for the active mobile kibitz compare board", "Board preview");

    const onPostVariation = React.useCallback(
        (boardController: GobanController, sourceGameId: number | undefined) => {
            if (resolvedRoom) {
                const posted = controller.postVariation(
                    resolvedRoom.id,
                    boardController,
                    sourceGameId,
                );
                const currentUser = data.get("config.user") as
                    | { id?: number; anonymous?: boolean }
                    | undefined;

                if (posted && currentUser?.id != null && posted.game_id != null) {
                    setPendingPostedVariation({
                        gameId: posted.game_id,
                        creatorId: currentUser.id,
                        from: posted.from,
                        moves: posted.moves,
                        title: posted.name,
                    });
                }
            }
        },
        [controller, resolvedRoom],
    );

    React.useEffect(() => {
        if (!pendingPostedVariation) {
            return;
        }

        const postedVariation = variations.find(
            (variation) =>
                variation.game_id === pendingPostedVariation.gameId &&
                variation.creator.id === pendingPostedVariation.creatorId &&
                variation.analysis_from === pendingPostedVariation.from &&
                variation.analysis_moves === pendingPostedVariation.moves &&
                variation.title === pendingPostedVariation.title,
        );

        if (!postedVariation) {
            return;
        }

        setPendingPostedVariation(null);
        onOpenVariation(postedVariation.id);
    }, [onOpenVariation, pendingPostedVariation, variations]);

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
                    visibleVariationIds={visibleVariationIds}
                    selectedVariationId={secondaryPane.variation_id}
                    variationColorIndexes={variationColorIndexes}
                    onRecallVariation={onOpenVariation}
                    onToggleVariation={onToggleVariation}
                />
            )}
            {queuedRoomProposals.length > 0 ? (
                <KibitzProposalQueue proposals={queuedRoomProposals} />
            ) : null}
        </>
    );

    React.useEffect(() => {
        // Reset mobile UI state on layout-mode changes and room switches.
        // Both desktop and mobile use the same reset; the dead branch noted
        // in code review has been collapsed.
        setMobileCompanionPanel("chat");
        setMobileOverlayMode(null);
    }, [isMobileLayout, resolvedRoom?.id]);

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
        setMobileOverlayMode((mode) => (mode === "rooms" ? null : "rooms"));
    }, []);

    const onCloseMobileOverlay = React.useCallback(() => {
        setMobileOverlayMode(null);
    }, []);

    const onMobileDividerPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!isMobileLayout) {
                return;
            }

            const shell = mobileShellRef.current;
            if (!shell) {
                return;
            }

            event.preventDefault();
            mobileDragStateRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startRatio: mobileSplitRatio,
            };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            document.body.style.userSelect = "none";
            document.body.style.cursor = "ns-resize";
        },
        [isMobileLayout, mobileSplitRatio],
    );

    const resolvedRoomUsers = resolvedRoom ? controller.getRoomUsers(resolvedRoom.id) : [];
    const mobileMatchup = formatMobileMatchup(resolvedRoom);
    const roomUsersById = React.useMemo(
        () =>
            Object.fromEntries(
                rooms.map((room) => [room.id, controller.getRoomUsers(room.id)]),
            ) as Record<string, ReturnType<typeof controller.getRoomUsers>>,
        [controller, rooms],
    );

    React.useEffect(() => {
        if (!resolvedRoom) {
            setMobileViewerCountFlash(false);
            previousMobileViewerCountRef.current = null;
            return;
        }

        if (!isMobileLayout) {
            setMobileViewerCountFlash(false);
            previousMobileViewerCountRef.current = resolvedRoom.viewer_count;
            return;
        }

        if (previousMobileViewerCountRef.current == null) {
            previousMobileViewerCountRef.current = resolvedRoom.viewer_count;
            return;
        }

        if (previousMobileViewerCountRef.current === resolvedRoom.viewer_count) {
            return;
        }

        const previousViewerCount = previousMobileViewerCountRef.current;
        previousMobileViewerCountRef.current = resolvedRoom.viewer_count;

        if (resolvedRoom.viewer_count <= previousViewerCount) {
            setMobileViewerCountFlash(false);
            return;
        }

        setMobileViewerCountFlash(true);
        const timeout = window.setTimeout(() => {
            setMobileViewerCountFlash(false);
        }, 700);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [isMobileLayout, resolvedRoom?.id, resolvedRoom?.viewer_count]);

    const pickerOverlay = pickerMode ? (
        <KibitzGamePickerOverlay
            mode={pickerMode}
            rooms={rooms}
            currentRoom={resolvedRoom}
            onClose={onClosePicker}
            onCreateRoom={async (game, roomName, description) => {
                const nextRoomId = await controller.createRoom(game, roomName, description);
                setPickerMode(null);
                if (nextRoomId) {
                    void navigate(`/kibitz/${nextRoomId}`);
                }
            }}
            onChangeBoard={(game) => {
                if (!resolvedRoom) {
                    return;
                }

                void controller.changeBoard(resolvedRoom.id, game);
                setPickerMode(null);
            }}
            onJoinRoom={(nextRoomId) => {
                setPickerMode(null);
                void navigate(`/kibitz/${nextRoomId}`);
            }}
        />
    ) : null;

    if (!resolvedRoom) {
        const emptyMessage = pgettext(
            "Kibitz placeholder shown in panels when no rooms exist",
            "Create a Kibitz room to start watching a game with friends.",
        );
        return (
            <div className="Kibitz">
                {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
                <div className="Kibitz-layout">
                    <div className="Kibitz-left-rail">
                        <KibitzRoomList
                            rooms={rooms}
                            activeRoomId=""
                            onSelectRoom={onSelectRoom}
                            onCreateRoom={onOpenCreateRoom}
                        />
                    </div>
                    <div className="Kibitz-main">
                        <div className="Kibitz-content">
                            <div className="Kibitz-empty-stage">
                                <p>{emptyMessage}</p>
                            </div>
                            <div className="Kibitz-sidebar no-active-proposal">
                                <div className="Kibitz-sidebar-proposal-slot" />
                                <div />
                                <div className="Kibitz-footer-panels" />
                            </div>
                        </div>
                    </div>
                </div>
                {pickerOverlay}
            </div>
        );
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
                    <KibitzPresence room={resolvedRoom} users={resolvedRoomUsers} />
                </div>
                <div className="Kibitz-main">
                    {isMobileLayout ? (
                        <div className="Kibitz-mobile-room-shell">
                            <button
                                type="button"
                                className="Kibitz-mobile-room-bar"
                                onClick={onToggleMobileRooms}
                                aria-expanded={mobileOverlayMode !== null}
                            >
                                <div className="mobile-room-header-title">{resolvedRoom.title}</div>
                                {mobileMatchup ? (
                                    <div className="mobile-room-header-matchup">
                                        <span className="mobile-room-header-matchup-first">
                                            {mobileMatchup.firstPlayer}{" "}
                                            <span className="mobile-room-header-matchup-black-dot">
                                                ●
                                            </span>
                                        </span>
                                        <span className="mobile-room-header-matchup-second">
                                            <span className="mobile-room-header-matchup-vs">
                                                {pgettext(
                                                    "Prefix for the second player in the mobile kibitz room header matchup",
                                                    "vs",
                                                )}
                                            </span>{" "}
                                            <span className="mobile-room-header-matchup-second-name">
                                                {mobileMatchup.secondPlayer}
                                            </span>{" "}
                                            <span className="mobile-room-header-matchup-white-dot">
                                                ○
                                            </span>
                                        </span>
                                    </div>
                                ) : null}
                                <div
                                    className={
                                        "mobile-room-header-meta" +
                                        (mobileViewerCountFlash
                                            ? " mobile-room-header-meta-flash"
                                            : "")
                                    }
                                >
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
                            {mobileOverlayMode ? (
                                <>
                                    <button
                                        type="button"
                                        className="Kibitz-mobile-overlay-backdrop"
                                        onClick={onCloseMobileOverlay}
                                        aria-label={pgettext(
                                            "Aria label for closing the mobile kibitz overlay",
                                            "Close overlay",
                                        )}
                                    />
                                    <div className="Kibitz-mobile-overlay-panel" role="dialog">
                                        {mobileOverlayMode === "rooms" ? (
                                            <div className="Kibitz-mobile-overlay-scroll">
                                                <KibitzRoomList
                                                    rooms={rooms}
                                                    activeRoomId={resolvedRoom.id}
                                                    roomUsersById={roomUsersById}
                                                    onSelectRoom={onSelectRoom}
                                                    onCreateRoom={onOpenCreateRoom}
                                                    onCreateVariation={onCreateVariation}
                                                    onChangeBoard={handleOpenChangeBoard}
                                                />
                                            </div>
                                        ) : (
                                            <KibitzMobileGamePicker
                                                key={mobileOverlayMode}
                                                mode={mobileOverlayMode}
                                                rooms={rooms}
                                                currentRoom={resolvedRoom}
                                                onClose={onCloseMobileOverlay}
                                                onBackToMenu={() => {
                                                    setMobileOverlayMode("rooms");
                                                }}
                                                onCreateRoom={async (
                                                    game,
                                                    roomName,
                                                    description,
                                                ) => {
                                                    const nextRoomId = await controller.createRoom(
                                                        game,
                                                        roomName,
                                                        description,
                                                    );
                                                    setMobileOverlayMode(null);
                                                    if (nextRoomId) {
                                                        void navigate(`/kibitz/${nextRoomId}`);
                                                    }
                                                }}
                                                onChangeBoard={(game) => {
                                                    if (!resolvedRoom) {
                                                        return;
                                                    }

                                                    void controller.changeBoard(
                                                        resolvedRoom.id,
                                                        game,
                                                    );
                                                    setMobileOverlayMode(null);
                                                }}
                                                onJoinRoom={(nextRoomId) => {
                                                    setMobileOverlayMode(null);
                                                    void navigate(`/kibitz/${nextRoomId}`);
                                                }}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : null}
                            <div className="Kibitz-mobile-shell" ref={mobileShellRef}>
                                <div
                                    className="Kibitz-mobile-top-pane"
                                    style={{ flexBasis: `${mobileSplitRatio * 100}%` }}
                                >
                                    <KibitzRoomStage
                                        room={resolvedRoom}
                                        rooms={rooms}
                                        proposals={roomProposals}
                                        variations={variations}
                                        visibleVariationIds={visibleVariationIds}
                                        variationColorIndexes={variationColorIndexes}
                                        secondaryPane={secondaryPane}
                                        onClearPreview={onClearPreview}
                                        onPostVariation={onPostVariation}
                                        onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                                        onChangeBoard={undefined}
                                        onCreateVariation={onCreateVariation}
                                        onCreateVariationFromPostedVariation={
                                            onCreateVariationFromPostedVariation
                                        }
                                        variationFocusRequestId={variationFocusRequestId}
                                        isMobileLayout={true}
                                        mobileCompanionPanel={mobileCompanionPanel}
                                        mobileHasActiveVote={Boolean(activeProposal)}
                                        onSelectMobileCompanionPanel={onSelectMobileCompanionPanel}
                                        onOpenMobileRooms={onToggleMobileRooms}
                                        onMobileCompareControllerChange={setMobileCompareController}
                                    />
                                </div>
                                <div
                                    ref={mobileDividerRef}
                                    className="Kibitz-mobile-divider"
                                    role="separator"
                                    aria-orientation="horizontal"
                                    aria-label={pgettext(
                                        "Aria label for the mobile kibitz draggable divider",
                                        "Resize board and panel",
                                    )}
                                    onPointerDown={onMobileDividerPointerDown}
                                />
                                <div className="Kibitz-mobile-bottom-pane">
                                    <div
                                        className={
                                            "Kibitz-sidebar" +
                                            (activeProposal
                                                ? " has-active-proposal"
                                                : " no-active-proposal")
                                        }
                                    >
                                        <div className="Kibitz-mobile-panel-surface">
                                            {mobileCompanionPanel === "chat" ? (
                                                <KibitzSharedStreamPanel
                                                    mode="live"
                                                    room={resolvedRoom}
                                                    items={stream}
                                                    variations={variations}
                                                    onOpenVariation={onOpenVariation}
                                                    onSendMessage={() => undefined}
                                                    isMobileLayout={true}
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
                                                    {mobileCompareController &&
                                                    secondaryPane.variation_source_game_id !=
                                                        null ? (
                                                        <div className="Kibitz-mobile-compare-tools">
                                                            <div className="mobile-board-analyze-row">
                                                                <GobanAnalyzeButtonBar
                                                                    controller={
                                                                        mobileCompareController
                                                                    }
                                                                    showBackToGame={false}
                                                                    showConditionalPlannerButton={
                                                                        false
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="mobile-board-compose-row">
                                                                <KibitzVariationComposer
                                                                    controller={
                                                                        mobileCompareController
                                                                    }
                                                                    onSubmit={(controller) =>
                                                                        onPostVariation(
                                                                            controller,
                                                                            secondaryPane.variation_source_game_id,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {hasCompareTarget ? (
                                                        <div className="Kibitz-mobile-panel-note">
                                                            <div className="Kibitz-mobile-board-meta">
                                                                <div className="mobile-board-meta-copy">
                                                                    <div className="mobile-board-meta-label">
                                                                        {mobileCompareBoardLabel}
                                                                    </div>
                                                                    <div className="mobile-board-meta-title">
                                                                        {mobileCompareBoardTitle}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="mobile-board-clear-button"
                                                                    onClick={
                                                                        onConfirmClearSecondaryPane
                                                                    }
                                                                >
                                                                    {pgettext(
                                                                        "Button label for clearing the active mobile kibitz compare board",
                                                                        "Clear",
                                                                    )}
                                                                </button>
                                                                {selectedVariation ? (
                                                                    <button
                                                                        type="button"
                                                                        className="mobile-board-clear-button"
                                                                        onClick={() =>
                                                                            onCreateVariationFromPostedVariation(
                                                                                selectedVariation,
                                                                            )
                                                                        }
                                                                    >
                                                                        {pgettext(
                                                                            "Button label for starting a new editable Kibitz variation from a posted variation",
                                                                            "Create variation from here",
                                                                        )}
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    <div className="Kibitz-footer-panels">
                                                        {variationPanels}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="Kibitz-content">
                            <KibitzRoomStage
                                room={resolvedRoom}
                                rooms={rooms}
                                proposals={roomProposals}
                                variations={variations}
                                visibleVariationIds={visibleVariationIds}
                                variationColorIndexes={variationColorIndexes}
                                secondaryPane={secondaryPane}
                                onClearPreview={onClearPreview}
                                onPostVariation={onPostVariation}
                                onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                                onChangeBoard={handleOpenChangeBoard}
                                onCreateVariation={onCreateVariation}
                                onCreateVariationFromPostedVariation={
                                    onCreateVariationFromPostedVariation
                                }
                                variationFocusRequestId={variationFocusRequestId}
                                isMobileLayout={false}
                                mobileCompanionPanel={mobileCompanionPanel}
                                mobileHasActiveVote={Boolean(activeProposal)}
                                onSelectMobileCompanionPanel={onSelectMobileCompanionPanel}
                                onOpenMobileRooms={undefined}
                                onMobileCompareControllerChange={undefined}
                            />
                            <div
                                className={
                                    "Kibitz-sidebar" +
                                    (activeProposal
                                        ? " has-active-proposal"
                                        : " no-active-proposal")
                                }
                            >
                                <div className="Kibitz-sidebar-proposal-slot">
                                    <KibitzProposalBar
                                        proposal={activeProposal}
                                        onVote={onVoteProposal}
                                    />
                                </div>
                                <KibitzSharedStreamPanel
                                    mode="live"
                                    room={resolvedRoom}
                                    items={stream}
                                    variations={variations}
                                    onOpenVariation={onOpenVariation}
                                    onSendMessage={() => undefined}
                                    isMobileLayout={false}
                                    compact={Boolean(activeProposal)}
                                />
                                <div className="Kibitz-footer-panels">{variationPanels}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {pickerOverlay}
        </div>
    );
}
