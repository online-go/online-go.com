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
import { GobanControllerContext } from "@/components/GobanView";
import * as data from "@/lib/data";
import { toast } from "@/lib/toast";
import { interpolate, pgettext } from "@/lib/translate";
import { protocol } from "goban";
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
import { KibitzMobileComparePanel } from "./KibitzMobileComparePanel";
import type { KibitzController } from "./KibitzController";
import { KIBITZ_VARIATION_COLORS } from "./kibitzVariationTree";
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

interface KibitzInnerProps {
    controller: KibitzController;
}

const MOBILE_LAYOUT_MEDIA_QUERY = "(max-width: 1000px)";
const MOBILE_SPLIT_STORAGE_KEY = "kibitz-mobile-split-ratio";
const DEFAULT_MOBILE_SPLIT_RATIO = 0.56;
const MIN_MOBILE_SPLIT_RATIO = 0.36;
const MAX_MOBILE_SPLIT_RATIO = 0.78;
const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;
const VARIATION_LIMIT_TOAST_MS = 1800;
const VARIATION_LIMIT_FLASH_MS = 900;

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

function mapGameChatLineToVariation(
    roomId: string,
    line: protocol.GameChatLine,
    fallbackGameId: number | undefined,
): KibitzVariationSummary | null {
    if (typeof line.body !== "object" || line.body === null || line.body.type !== "analysis") {
        return null;
    }

    const analysisBody = line.body as {
        type: "analysis";
        name?: string;
        from?: number;
        moves?: string;
        marks?: Record<string, string>;
        pen_marks?: KibitzVariationSummary["analysis_pen_marks"];
        line_tree?: KibitzVariationSummary["analysis_line_tree"];
        game_id?: number;
    };

    const gameId =
        typeof analysisBody.game_id === "number" && Number.isFinite(analysisBody.game_id)
            ? analysisBody.game_id
            : typeof fallbackGameId === "number" && Number.isFinite(fallbackGameId)
              ? fallbackGameId
              : null;
    if (!gameId || gameId <= 0) {
        return null;
    }

    return {
        id: line.chat_id,
        room_id: roomId,
        game_id: gameId,
        creator: {
            id: line.player_id,
            username: line.username ?? "",
            ranking: 0,
            professional: false,
            ui_class: "",
        },
        created_at: line.date * 1000,
        viewer_count: 0,
        current_viewers: [],
        title: analysisBody.name,
        analysis_from: analysisBody.from,
        analysis_moves: analysisBody.moves,
        analysis_marks: analysisBody.marks,
        analysis_pen_marks: analysisBody.pen_marks,
        analysis_line_tree: analysisBody.line_tree,
    };
}

export function KibitzInner({ controller }: KibitzInnerProps): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
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
    // Lifted from KibitzRoomStage so we can provide it via GobanControllerContext
    // around KibitzSharedStreamPanel — that's how the panel's game pane reads
    // the watched game's chat (off goban.chat_log via the existing context hook)
    // instead of incorrectly trying to join a comm-server Redis channel.
    const [mainBoardController, setMainBoardController] = React.useState<GobanController | null>(
        null,
    );
    const [gameVariations, setGameVariations] = React.useState<KibitzVariationSummary[]>([]);
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
    const [blockedVariationFlashId, setBlockedVariationFlashId] = React.useState<string | null>(
        null,
    );
    const [pendingPostedVariation, setPendingPostedVariation] =
        React.useState<PendingPostedVariation | null>(null);
    const blockedVariationFlashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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

        setRooms(controller.rooms);
        setActiveRoom(controller.active_room);
        setStream(controller.stream);
        setProposals(controller.proposals);
        setVariations(controller.variations);
        setSecondaryPane(controller.secondary_pane);
        setDebug(controller.debug);
        setPermissions(controller.permissions);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("proposals-changed", setProposals);
            controller.off("variations-changed", setVariations);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.off("permissions-changed", setPermissions);
        };
    }, [controller]);

    const defaultRoomId = rooms[0]?.id ?? null;

    React.useEffect(() => {
        if (roomId || !defaultRoomId) {
            return;
        }

        void navigate(`/kibitz/${defaultRoomId}`, { replace: true });
    }, [defaultRoomId, navigate, roomId]);

    React.useEffect(() => {
        if (!roomId || activeRoom?.id === roomId) {
            return;
        }

        void controller.selectRoom(roomId);
    }, [activeRoom?.id, controller, roomId]);

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

    const displayedVariations = React.useMemo(() => {
        const merged = [...variations, ...gameVariations];
        merged.sort((left, right) => {
            if (left.created_at === right.created_at) {
                return left.id.localeCompare(right.id);
            }
            return left.created_at - right.created_at;
        });

        const seen = new Set<string>();
        const next: KibitzVariationSummary[] = [];
        for (const variation of merged) {
            if (seen.has(variation.id)) {
                continue;
            }
            seen.add(variation.id);
            next.push(variation);
        }
        return next;
    }, [gameVariations, variations]);

    const onClearPreview = React.useCallback(() => {
        const currentVariation = displayedVariations.find(
            (variation) => variation.id === secondaryPane.variation_id,
        );
        const visibleVariations = visibleVariationIds
            .map((variationId) =>
                displayedVariations.find((variation) => variation.id === variationId),
            )
            .filter((variation): variation is KibitzVariationSummary => variation != null);
        const nextVisibleVariation =
            visibleVariations.find(
                (variation) =>
                    currentVariation != null && variation.game_id === currentVariation.game_id,
            ) ?? visibleVariations[0];

        if (nextVisibleVariation) {
            setVariationFocusRequestId((previous) => previous + 1);
            controller.openVariation(nextVisibleVariation.id);
        } else {
            controller.clearPreviewGame();
            if (isMobileLayout) {
                setMobileCompanionPanel("chat");
                setPendingSecondaryPaneMode("hidden");
            }
        }
    }, [
        controller,
        displayedVariations,
        isMobileLayout,
        secondaryPane.variation_id,
        visibleVariationIds,
    ]);

    const onOpenVariation = React.useCallback(
        (variationId: string, focusVariation: boolean = false) => {
            if (
                !visibleVariationIds.includes(variationId) &&
                visibleVariationIds.length >= MAX_VISIBLE_VARIATIONS
            ) {
                if (blockedVariationFlashTimerRef.current) {
                    clearTimeout(blockedVariationFlashTimerRef.current);
                }
                setBlockedVariationFlashId(variationId);
                blockedVariationFlashTimerRef.current = setTimeout(() => {
                    setBlockedVariationFlashId(null);
                    blockedVariationFlashTimerRef.current = null;
                }, VARIATION_LIMIT_FLASH_MS);
                toast(
                    <div>
                        {pgettext(
                            "Warning shown when too many Kibitz variations are already visible",
                            "Hide one variation before showing another.",
                        )}
                    </div>,
                    VARIATION_LIMIT_TOAST_MS,
                );
                return;
            }

            setVisibleVariationIds((previous) => {
                if (previous.includes(variationId)) {
                    return previous;
                }

                if (previous.length >= MAX_VISIBLE_VARIATIONS) {
                    return previous;
                }

                return [...previous, variationId];
            });
            if (focusVariation) {
                setVariationFocusRequestId((previous) => previous + 1);
            }
            controller.openVariation(variationId);
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [controller, isMobileLayout, visibleVariationIds],
    );
    const onToggleVariation = React.useCallback(
        (variationId: string) => {
            const isVisible = visibleVariationIds.includes(variationId);
            if (!isVisible && visibleVariationIds.length >= MAX_VISIBLE_VARIATIONS) {
                if (blockedVariationFlashTimerRef.current) {
                    clearTimeout(blockedVariationFlashTimerRef.current);
                }
                setBlockedVariationFlashId(variationId);
                blockedVariationFlashTimerRef.current = setTimeout(() => {
                    setBlockedVariationFlashId(null);
                    blockedVariationFlashTimerRef.current = null;
                }, VARIATION_LIMIT_FLASH_MS);
                toast(
                    <div>
                        {pgettext(
                            "Warning shown when too many Kibitz variations are already visible",
                            "Hide one variation before showing another.",
                        )}
                    </div>,
                    VARIATION_LIMIT_TOAST_MS,
                );
                return;
            }

            if (isVisible) {
                const nextVisibleVariationIds = visibleVariationIds.filter(
                    (id) => id !== variationId,
                );
                setVisibleVariationIds(nextVisibleVariationIds);

                if (secondaryPane.variation_id === variationId) {
                    const hiddenVariation = displayedVariations.find(
                        (variation) => variation.id === variationId,
                    );
                    const nextVisibleVariations = nextVisibleVariationIds
                        .map((id) => displayedVariations.find((variation) => variation.id === id))
                        .filter(
                            (variation): variation is KibitzVariationSummary => variation != null,
                        );
                    const nextActiveVariation =
                        nextVisibleVariations.find(
                            (variation) => variation.game_id === hiddenVariation?.game_id,
                        ) ?? nextVisibleVariations[0];

                    if (nextActiveVariation) {
                        setVariationFocusRequestId((previous) => previous + 1);
                        controller.openVariation(nextActiveVariation.id);
                    } else {
                        controller.clearPreviewGame();
                    }
                }

                return;
            }

            const nextVisibleVariationIds = [...visibleVariationIds, variationId];
            setVisibleVariationIds(nextVisibleVariationIds);
            setVariationFocusRequestId((previous) => previous + 1);
            controller.openVariation(variationId);
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [
            controller,
            displayedVariations,
            isMobileLayout,
            secondaryPane.variation_id,
            visibleVariationIds,
        ],
    );

    React.useEffect(() => {
        return () => {
            if (blockedVariationFlashTimerRef.current) {
                clearTimeout(blockedVariationFlashTimerRef.current);
                blockedVariationFlashTimerRef.current = null;
            }
        };
    }, []);
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
    React.useEffect(() => {
        const goban = mainBoardController?.goban;
        if (!goban || !resolvedRoom) {
            setGameVariations([]);
            return;
        }

        const syncGameVariations = () => {
            const next: KibitzVariationSummary[] = [];
            for (const line of goban.chat_log) {
                const variation = mapGameChatLineToVariation(resolvedRoom.id, line, goban.game_id);
                if (variation) {
                    next.push(variation);
                }
            }
            setGameVariations(next);
        };

        goban.on("chat", syncGameVariations);
        goban.on("chat-remove", syncGameVariations);
        goban.on("chat-reset", syncGameVariations);
        syncGameVariations();

        return () => {
            goban.off("chat", syncGameVariations);
            goban.off("chat-remove", syncGameVariations);
            goban.off("chat-reset", syncGameVariations);
        };
    }, [mainBoardController, resolvedRoom]);

    const selectedVariation = displayedVariations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    React.useEffect(() => {
        setVisibleVariationIds((previous) =>
            previous.filter((variationId) =>
                displayedVariations.some((variation) => variation.id === variationId),
            ),
        );
    }, [displayedVariations]);
    React.useEffect(() => {
        setVariationColorIndexes((previous) => {
            const next: Record<string, number> = {};
            const taken = new Set<number>();

            for (const variationId of visibleVariationIds) {
                const previousIndex = previous[variationId];
                if (
                    typeof previousIndex === "number" &&
                    previousIndex >= 0 &&
                    previousIndex < MAX_VISIBLE_VARIATIONS &&
                    !taken.has(previousIndex)
                ) {
                    next[variationId] = previousIndex;
                    taken.add(previousIndex);
                    continue;
                }

                const freeIndex = KIBITZ_VARIATION_COLORS.findIndex(
                    (_, index) => !taken.has(index),
                );
                const colorIndex = freeIndex >= 0 ? freeIndex : 0;
                next[variationId] = colorIndex;
                taken.add(colorIndex);
            }

            const previousKeys = Object.keys(previous);
            const nextKeys = Object.keys(next);
            if (
                previousKeys.length === nextKeys.length &&
                previousKeys.every((key) => next[key] === previous[key])
            ) {
                return previous;
            }

            return next;
        });
    }, [visibleVariationIds]);
    const hasCompareTarget = Boolean(
        secondaryPane.variation_id ||
        (secondaryPane.preview_game_id &&
            !roomProposals.some(
                (proposal) => proposal.proposed_game.game_id === secondaryPane.preview_game_id,
            )),
    );

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

        const postedVariation = displayedVariations.find(
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
        onOpenVariation(postedVariation.id, true);
    }, [displayedVariations, onOpenVariation, pendingPostedVariation]);

    const variationPanels = (
        <>
            {displayedVariations.length === 0 ? (
                <div className="Kibitz-footer-empty">
                    {pgettext(
                        "Compact empty state shown below the kibitz room stream when there are no variations or queued proposals",
                        "No variations yet. Watch next queue empty.",
                    )}
                </div>
            ) : (
                <KibitzVariationList
                    variations={displayedVariations}
                    currentGameId={currentGameId}
                    visibleVariationIds={visibleVariationIds}
                    selectedVariationId={secondaryPane.variation_id}
                    variationFocusRequestId={variationFocusRequestId}
                    variationColorIndexes={variationColorIndexes}
                    blockedVariationFlashId={blockedVariationFlashId}
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

    const handleDeleteRoom = React.useCallback(async (): Promise<boolean> => {
        if (!resolvedRoom) {
            return false;
        }

        const deleted = await controller.deleteRoom(resolvedRoom.id);
        if (!deleted) {
            return false;
        }

        setPickerMode(null);
        void navigate("/kibitz");
        return true;
    }, [controller, navigate, resolvedRoom]);

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
                                style={{
                                    backgroundColor: "var(--card-background-color)",
                                    backgroundImage: "none",
                                }}
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
                                        variations={displayedVariations}
                                        visibleVariationIds={visibleVariationIds}
                                        variationColorIndexes={variationColorIndexes}
                                        secondaryPane={secondaryPane}
                                        onClearPreview={onClearPreview}
                                        onPostVariation={onPostVariation}
                                        onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                                        onChangeBoard={undefined}
                                        canEditRoom={permissions.can_edit_room}
                                        onSaveRoomDetails={async (title, description) =>
                                            controller.updateRoomDetails(
                                                resolvedRoom.id,
                                                title,
                                                description,
                                            )
                                        }
                                        onDeleteRoom={handleDeleteRoom}
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
                                        onMainBoardControllerChange={setMainBoardController}
                                    />
                                </div>
                                <div
                                    ref={mobileDividerRef}
                                    className="Kibitz-mobile-divider"
                                    style={{ background: "var(--mobile-room-bar-bg)" }}
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
                                        <div
                                            className="Kibitz-mobile-panel-surface"
                                            style={{
                                                background: "var(--card-background-color)",
                                            }}
                                        >
                                            {mobileCompanionPanel === "chat" ? (
                                                <GobanControllerContext.Provider
                                                    value={mainBoardController}
                                                >
                                                    <KibitzSharedStreamPanel
                                                        mode="live"
                                                        room={resolvedRoom}
                                                        items={stream}
                                                        variations={displayedVariations}
                                                        onOpenVariation={onOpenVariation}
                                                        onSendMessage={() => undefined}
                                                        isMobileLayout={true}
                                                        compact={true}
                                                    />
                                                </GobanControllerContext.Provider>
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
                                                <div
                                                    className="Kibitz-mobile-panel Kibitz-mobile-compare-panel"
                                                    style={{
                                                        background: "var(--card-background-color)",
                                                    }}
                                                >
                                                    <KibitzMobileComparePanel
                                                        controller={mobileCompareController}
                                                        room={resolvedRoom}
                                                        variations={displayedVariations}
                                                        queuedRoomProposals={queuedRoomProposals}
                                                        visibleVariationIds={visibleVariationIds}
                                                        variationColorIndexes={
                                                            variationColorIndexes
                                                        }
                                                        blockedVariationFlashId={
                                                            blockedVariationFlashId
                                                        }
                                                        secondaryPane={secondaryPane}
                                                        selectedVariation={
                                                            selectedVariation ?? null
                                                        }
                                                        isDraftingVariation={
                                                            secondaryPane.variation_source_game_id !=
                                                            null
                                                        }
                                                        variationFocusRequestId={
                                                            variationFocusRequestId
                                                        }
                                                        onOpenVariation={onOpenVariation}
                                                        onToggleVariation={onToggleVariation}
                                                        onPostVariation={onPostVariation}
                                                        onDiscardDraft={onClearPreview}
                                                    />
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
                                variations={displayedVariations}
                                visibleVariationIds={visibleVariationIds}
                                variationColorIndexes={variationColorIndexes}
                                secondaryPane={secondaryPane}
                                onClearPreview={onClearPreview}
                                onPostVariation={onPostVariation}
                                onSetSecondaryPaneMode={onSetSecondaryPaneMode}
                                onChangeBoard={handleOpenChangeBoard}
                                canEditRoom={permissions.can_edit_room}
                                onSaveRoomDetails={async (title, description) =>
                                    controller.updateRoomDetails(
                                        resolvedRoom.id,
                                        title,
                                        description,
                                    )
                                }
                                onDeleteRoom={handleDeleteRoom}
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
                                onMainBoardControllerChange={setMainBoardController}
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
                                <GobanControllerContext.Provider value={mainBoardController}>
                                    <KibitzSharedStreamPanel
                                        mode="live"
                                        room={resolvedRoom}
                                        items={stream}
                                        variations={displayedVariations}
                                        onOpenVariation={onOpenVariation}
                                        onSendMessage={() => undefined}
                                        isMobileLayout={false}
                                        compact={Boolean(activeProposal)}
                                    />
                                </GobanControllerContext.Provider>
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
