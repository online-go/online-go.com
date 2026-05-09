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
import { KIBITZ_HELP_FLOW_IDS } from "./HelpFlows/KibitzHelpFlows";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTriggers } from "./HelpFlows/useKibitzHelpTriggers";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { KibitzGamePickerOverlay } from "./KibitzGamePickerOverlay";
import { KibitzMobileGamePicker } from "./KibitzMobileGamePicker";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { getKibitzAccessPolicyForUser, isKibitzAccessBlockedForUser } from "./kibitzAnalysisPolicy";
import {
    getKibitzBlockedRoomFollowupMessage,
    getKibitzBlockedRoomMessage,
} from "./kibitzAnalysisPolicyCopy";
import { useCurrentKibitzUser } from "./useCurrentKibitzUser";
import "./Kibitz.css";

type SecondaryPaneMode = "hidden" | "small" | "equal";
type MobileCompanionPanel = "chat" | "vote" | "compare";
type MobileOverlayMode = "rooms" | "room-settings" | "create-room" | "change-board" | null;
type KibitzGamePickerMode = "create-room" | "change-board" | null;
interface PendingPostedVariation {
    pendingId: string;
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
        id: `game-chat:${roomId}:${gameId}:${line.channel ?? "game"}:${line.chat_id}`,
        room_id: roomId,
        source: "game-chat",
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

function assignVisibleVariationColorIndexes(
    previous: Record<string, number>,
    visibleVariationIds: string[],
): Record<string, number> {
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

        const freeIndex = KIBITZ_VARIATION_COLORS.findIndex((_, index) => !taken.has(index));
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
    const [accessBlocked, setAccessBlocked] = React.useState(controller.access_blocked);
    const currentUser = useCurrentKibitzUser();
    const canManageRoom = permissions.can_edit_room || Boolean(currentUser?.is_moderator);
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
    const desktopRoomListTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomList);
    const mobileRoomTitleTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileRoomTitle);
    const mobileRoomMenuTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileRoomMenu);
    const desktopMainBoardTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopMainBoard);
    const desktopVariationsTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopVariations);
    const desktopStreamTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopStream);
    const mobileMainBoardTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileMainBoard);
    const mobilePanelSwitcherTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobilePanelSwitcher);
    const mobileVariationsTabTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileVariationsTab);
    const mobileVariationsPanelTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.mobileVariationsPanel,
    );
    const mobileVariationBoardTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.mobileVariationBoard,
    );
    const desktopVariationBoardTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.desktopVariationBoard,
    );
    const mobileVariationActionsTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.mobileVariationActions,
    );
    const desktopVariationActionsTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.desktopVariationActions,
    );
    const blockedVariationFlashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const mobileShellRef = React.useRef<HTMLDivElement | null>(null);
    const mobileDividerRef = React.useRef<HTMLDivElement | null>(null);
    const previousMobileViewerCountRef = React.useRef<number | null>(null);
    const previousMobileViewerRoomIdRef = React.useRef<string | null>(null);
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
    const [pickerMode, setPickerMode] = React.useState<KibitzGamePickerMode>(null);

    React.useEffect(() => {
        controller.on("rooms-changed", setRooms);
        controller.on("room-changed", setActiveRoom);
        controller.on("stream-changed", setStream);
        controller.on("proposals-changed", setProposals);
        controller.on("variations-changed", setVariations);
        controller.on("secondary-pane-changed", setSecondaryPane);
        controller.on("debug-changed", setDebug);
        controller.on("permissions-changed", setPermissions);
        controller.on("access-changed", setAccessBlocked);

        setRooms(controller.rooms);
        setActiveRoom(controller.active_room);
        setStream(controller.stream);
        setProposals(controller.proposals);
        setVariations(controller.variations);
        setSecondaryPane(controller.secondary_pane);
        setDebug(controller.debug);
        setPermissions(controller.permissions);
        setAccessBlocked(controller.access_blocked);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("proposals-changed", setProposals);
            controller.off("variations-changed", setVariations);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.off("permissions-changed", setPermissions);
            controller.off("access-changed", setAccessBlocked);
        };
    }, [controller]);

    const defaultRoomId = rooms[0]?.id ?? null;
    const blockedRoomIds = React.useMemo(() => {
        if (!currentUser) {
            return new Set<string>();
        }

        const blockedIds = new Set<string>();
        for (const room of rooms) {
            if (isKibitzAccessBlockedForUser(currentUser, room.current_game)) {
                blockedIds.add(room.id);
            }
        }
        return blockedIds;
    }, [currentUser, rooms]);
    const selectedRoom =
        activeRoom ??
        (roomId ? (rooms.find((room) => room.id === roomId) ?? null) : (rooms[0] ?? null));
    const selectedRoomPolicy = React.useMemo(
        () => getKibitzAccessPolicyForUser(currentUser, selectedRoom?.current_game),
        [currentUser, selectedRoom?.current_game],
    );
    const isSelectedRoomBlocked = !selectedRoomPolicy.allowed;
    const isBlockedRoom = Boolean(accessBlocked?.room_id === roomId || isSelectedRoomBlocked);
    const resolvedRoom = isBlockedRoom
        ? null
        : (activeRoom ??
          (roomId ? (rooms.find((room) => room.id === roomId) ?? null) : (rooms[0] ?? null)));

    React.useEffect(() => {
        if (roomId || !defaultRoomId) {
            return;
        }

        void navigate(`/kibitz/${defaultRoomId}`, { replace: true });
    }, [defaultRoomId, navigate, roomId]);

    React.useEffect(() => {
        if (!roomId) {
            return;
        }

        if (isSelectedRoomBlocked) {
            controller.setAccessBlocked({
                room_id: roomId,
                room_title: selectedRoom?.title ?? roomId,
            });
            return;
        }

        if (activeRoom?.id === roomId || accessBlocked?.room_id === roomId) {
            if (accessBlocked?.room_id === roomId) {
                controller.setAccessBlocked(null);
            }
            return;
        }

        void controller.selectRoom(roomId);
    }, [
        accessBlocked?.room_id,
        activeRoom?.id,
        controller,
        isSelectedRoomBlocked,
        roomId,
        selectedRoom?.title,
    ]);

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

    const selectedVariation = displayedVariations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    const kibitzHelpTriggers = useKibitzHelpTriggers({
        isMobileLayout,
        room: resolvedRoom,
        flowReadiness: {
            [KIBITZ_HELP_FLOW_IDS.mobileFirstRun]:
                Boolean(mobileRoomTitleTarget?.active()) &&
                Boolean(mobileMainBoardTarget?.active()) &&
                Boolean(mobilePanelSwitcherTarget?.active()) &&
                Boolean(mobileVariationsTabTarget?.active()),
            [KIBITZ_HELP_FLOW_IDS.desktopFirstRun]:
                Boolean(desktopRoomListTarget?.active()) &&
                Boolean(desktopMainBoardTarget?.active()) &&
                Boolean(desktopVariationsTarget?.active()) &&
                Boolean(desktopStreamTarget?.active()),
            [KIBITZ_HELP_FLOW_IDS.mobileFirstVariations]: Boolean(
                mobileVariationsPanelTarget?.active(),
            ),
            [KIBITZ_HELP_FLOW_IDS.desktopFirstVariations]: Boolean(
                desktopVariationsTarget?.active(),
            ),
            [KIBITZ_HELP_FLOW_IDS.mobilePostedVariation]: Boolean(
                mobileVariationBoardTarget?.active(),
            ),
            [KIBITZ_HELP_FLOW_IDS.desktopPostedVariation]: Boolean(
                desktopVariationBoardTarget?.active(),
            ),
            [KIBITZ_HELP_FLOW_IDS.draftFromPostedVariation]: Boolean(
                (isMobileLayout
                    ? mobileVariationActionsTarget
                    : desktopVariationActionsTarget
                )?.active(),
            ),
            [KIBITZ_HELP_FLOW_IDS.roomBoardChange]: isMobileLayout
                ? Boolean(mobileMainBoardTarget?.active())
                : Boolean(desktopMainBoardTarget?.active()),
        },
        pickerOpen: Boolean(pickerMode),
        mobileOverlayOpen: mobileOverlayMode != null,
    });

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
            const isNewlyOpened = !visibleVariationIds.includes(variationId);

            if (isNewlyOpened && visibleVariationIds.length >= MAX_VISIBLE_VARIATIONS) {
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

            if (!visibleVariationIds.includes(variationId)) {
                const nextVisibleVariationIds = [...visibleVariationIds, variationId];
                setVisibleVariationIds(nextVisibleVariationIds);
                setVariationColorIndexes((previous) =>
                    assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
                );
            }
            if (focusVariation) {
                setVariationFocusRequestId((previous) => previous + 1);
            }
            controller.openVariation(variationId);
            if (isNewlyOpened) {
                kibitzHelpTriggers.notePostedVariationOpened();
            }
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [controller, isMobileLayout, kibitzHelpTriggers, visibleVariationIds],
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
                setVariationColorIndexes((previous) =>
                    assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
                );

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
            setVariationColorIndexes((previous) =>
                assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
            );
            setVariationFocusRequestId((previous) => previous + 1);
            controller.openVariation(variationId);
            kibitzHelpTriggers.noteDesktopVariationMadeVisible();
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [
            controller,
            displayedVariations,
            isMobileLayout,
            secondaryPane.variation_id,
            kibitzHelpTriggers,
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
            kibitzHelpTriggers.noteDraftStartedFromPostedVariation();
            if (isMobileLayout) {
                setMobileOverlayMode(null);
                setMobileCompanionPanel("compare");
            }
        },
        [controller, isMobileLayout, kibitzHelpTriggers],
    );
    const onSetSecondaryPaneMode = React.useCallback((nextMode: SecondaryPaneMode) => {
        setPendingSecondaryPaneMode(nextMode);
    }, []);

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

        // Full rebuild — used for the initial sync (chat_log may already be
        // populated from a prior subscriber) and for "chat-reset" (goban
        // emits this on bulk wipes). Per-message updates take the
        // incremental paths below to avoid scanning the whole log on every
        // chat event.
        const rebuildGameVariations = () => {
            const next: KibitzVariationSummary[] = [];
            for (const line of goban.chat_log) {
                const variation = mapGameChatLineToVariation(resolvedRoom.id, line, goban.game_id);
                if (variation) {
                    next.push(variation);
                }
            }
            setGameVariations(next);
        };

        const onGameChat = (line?: protocol.GameChatLine) => {
            if (!line) {
                return;
            }
            const variation = mapGameChatLineToVariation(resolvedRoom.id, line, goban.game_id);
            if (!variation) {
                return;
            }
            // Goban doesn't dedupe "chat" emissions itself (GameChat.tsx
            // maintains its own dedupe table for the same reason), so guard
            // against double-appending the same variation on replay edges.
            setGameVariations((current) =>
                current.some((v) => v.id === variation.id) ? current : [...current, variation],
            );
        };

        const onGameChatRemove = (obj?: { chat_ids?: string[] }) => {
            const ids = obj?.chat_ids;
            if (!ids || ids.length === 0) {
                return;
            }
            const removed = new Set(ids);
            setGameVariations((current) => {
                const next = current.filter((v) => !removed.has(v.id));
                return next.length === current.length ? current : next;
            });
        };

        goban.on("chat", onGameChat);
        goban.on("chat-remove", onGameChatRemove);
        goban.on("chat-reset", rebuildGameVariations);
        rebuildGameVariations();

        return () => {
            goban.off("chat", onGameChat);
            goban.off("chat-remove", onGameChatRemove);
            goban.off("chat-reset", rebuildGameVariations);
        };
    }, [mainBoardController, resolvedRoom]);

    React.useEffect(() => {
        setVisibleVariationIds((previous) =>
            previous.filter((variationId) =>
                displayedVariations.some((variation) => variation.id === variationId),
            ),
        );
    }, [displayedVariations]);
    React.useLayoutEffect(() => {
        setVariationColorIndexes((previous) => {
            return assignVisibleVariationColorIndexes(previous, visibleVariationIds);
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

                const creatorId =
                    typeof currentUser?.id === "number"
                        ? currentUser.id
                        : typeof currentUser?.id === "string"
                          ? Number(currentUser.id)
                          : NaN;

                if (posted && Number.isFinite(creatorId) && posted.game_id != null) {
                    setPendingPostedVariation({
                        pendingId: posted.kibitz_pending_id ?? "",
                        gameId: posted.game_id,
                        creatorId,
                        from: posted.from,
                        moves: posted.moves,
                        title: posted.name,
                    });
                }
            }
        },
        [controller, currentUser, resolvedRoom],
    );

    React.useEffect(() => {
        if (!pendingPostedVariation) {
            return;
        }

        const postedVariation = displayedVariations.find(
            (variation) => variation.client_pending_id === pendingPostedVariation.pendingId,
        );

        const fallbackVariation = displayedVariations.find(
            (variation) =>
                variation.game_id === pendingPostedVariation.gameId &&
                variation.creator.id === pendingPostedVariation.creatorId &&
                variation.analysis_from === pendingPostedVariation.from &&
                variation.analysis_moves === pendingPostedVariation.moves &&
                variation.title === pendingPostedVariation.title,
        );
        const matchedVariation = postedVariation ?? fallbackVariation;

        if (!matchedVariation) {
            return;
        }

        setPendingPostedVariation(null);
        onOpenVariation(matchedVariation.id, true);
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
                    helpTargetId={KIBITZ_HELP_TARGETS.desktopVariationList}
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

            if (panel === "compare") {
                kibitzHelpTriggers.noteMobileVariationsPanelOpened();
            }

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
        [currentSecondaryPaneMode, hasCompareTarget, isMobileLayout, kibitzHelpTriggers],
    );

    const onToggleMobileRooms = React.useCallback(() => {
        setMobileOverlayMode((mode) => (mode === "rooms" ? null : "rooms"));
    }, []);

    const onToggleMobileRoomSettings = React.useCallback(() => {
        setMobileOverlayMode((mode) => (mode === "room-settings" ? null : "room-settings"));
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
    const canOpenRoomSettings = canManageRoom || Boolean(handleOpenChangeBoard);
    const mobileMatchup = formatMobileMatchup(resolvedRoom);
    React.useEffect(() => {
        if (!resolvedRoom) {
            setMobileViewerCountFlash(false);
            previousMobileViewerCountRef.current = null;
            previousMobileViewerRoomIdRef.current = null;
            return;
        }

        if (previousMobileViewerRoomIdRef.current !== resolvedRoom.id) {
            previousMobileViewerRoomIdRef.current = resolvedRoom.id;
            previousMobileViewerCountRef.current = resolvedRoom.viewer_count;
            setMobileViewerCountFlash(false);
            return;
        }

        if (!isMobileLayout) {
            setMobileViewerCountFlash(false);
            previousMobileViewerCountRef.current = resolvedRoom.viewer_count;
            return;
        }

        if (previousMobileViewerCountRef.current == null) {
            previousMobileViewerRoomIdRef.current = resolvedRoom.id;
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
                if (nextRoomId) {
                    setPickerMode(null);
                    void navigate(`/kibitz/${nextRoomId}`);
                }
                return nextRoomId;
            }}
            onChangeBoard={(game) => {
                if (!resolvedRoom) {
                    return false;
                }

                return controller.changeBoard(resolvedRoom.id, game).then((success) => {
                    if (success) {
                        setPickerMode(null);
                    }

                    return success;
                });
            }}
            onJoinRoom={(nextRoomId) => {
                setPickerMode(null);
                void navigate(`/kibitz/${nextRoomId}`);
            }}
        />
    ) : null;

    if (isBlockedRoom) {
        const blockedTitle = accessBlocked?.room_title ?? selectedRoom?.title ?? roomId ?? "";
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
                            onCreateVariation={onCreateVariation}
                            blockedRoomIds={blockedRoomIds}
                        />
                    </div>
                    <div className="Kibitz-main">
                        <div className="Kibitz-content">
                            <div className="Kibitz-empty-stage">
                                <p>{getKibitzBlockedRoomMessage(blockedTitle)}</p>
                                <p>{getKibitzBlockedRoomFollowupMessage()}</p>
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
                            blockedRoomIds={blockedRoomIds}
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
                        onSelectRoom={onSelectRoom}
                        onCreateRoom={onOpenCreateRoom}
                        blockedRoomIds={blockedRoomIds}
                        helpTargetId={KIBITZ_HELP_TARGETS.desktopRoomList}
                    />
                    <KibitzPresence room={resolvedRoom} users={resolvedRoomUsers} />
                </div>
                <div className="Kibitz-main">
                    {isMobileLayout ? (
                        <div className="Kibitz-mobile-room-shell">
                            <div
                                className={
                                    "Kibitz-mobile-room-header" +
                                    (canOpenRoomSettings ? " has-settings" : "")
                                }
                            >
                                <button
                                    type="button"
                                    className="Kibitz-mobile-room-bar"
                                    ref={mobileRoomTitleTarget?.ref}
                                    style={{
                                        backgroundColor: "var(--card-background-color)",
                                        backgroundImage: "none",
                                    }}
                                    onClick={onToggleMobileRooms}
                                    aria-expanded={mobileOverlayMode === "rooms"}
                                >
                                    <div className="mobile-room-header-title">
                                        {resolvedRoom.title}
                                    </div>
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
                                {canOpenRoomSettings ? (
                                    <button
                                        type="button"
                                        className="Kibitz-mobile-room-settings-button"
                                        ref={mobileRoomMenuTarget?.ref}
                                        onClick={onToggleMobileRoomSettings}
                                        aria-expanded={
                                            mobileOverlayMode === "room-settings" ||
                                            mobileOverlayMode === "change-board"
                                        }
                                        aria-label={pgettext(
                                            "Aria label for opening room settings in mobile Kibitz",
                                            "Room settings",
                                        )}
                                    >
                                        <i className="fa fa-gear" aria-hidden="true" />
                                    </button>
                                ) : null}
                            </div>
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
                                                    onSelectRoom={onSelectRoom}
                                                    onCreateRoom={onOpenCreateRoom}
                                                    onCreateVariation={onCreateVariation}
                                                    blockedRoomIds={blockedRoomIds}
                                                />
                                            </div>
                                        ) : mobileOverlayMode === "room-settings" ? (
                                            <div className="Kibitz-mobile-room-settings-panel">
                                                <KibitzRoomSettingsPopover
                                                    room={resolvedRoom}
                                                    canEditRoom={canManageRoom}
                                                    canDeleteRoom={permissions.can_delete_room}
                                                    canChangeBoard={Boolean(handleOpenChangeBoard)}
                                                    isMobileLayout={true}
                                                    onClose={onCloseMobileOverlay}
                                                    onRequestChangeBoard={() => {
                                                        setMobileOverlayMode("change-board");
                                                    }}
                                                    onDeleteRoom={handleDeleteRoom}
                                                    onSaveRoomDetails={async (title, description) =>
                                                        controller.updateRoomDetails(
                                                            resolvedRoom.id,
                                                            title,
                                                            description,
                                                        )
                                                    }
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
                                                    setMobileOverlayMode(
                                                        mobileOverlayMode === "change-board"
                                                            ? "room-settings"
                                                            : "rooms",
                                                    );
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
                                                    if (nextRoomId) {
                                                        setMobileOverlayMode(null);
                                                        void navigate(`/kibitz/${nextRoomId}`);
                                                    }
                                                    return nextRoomId;
                                                }}
                                                onChangeBoard={(game) => {
                                                    if (!resolvedRoom) {
                                                        return false;
                                                    }

                                                    return controller
                                                        .changeBoard(resolvedRoom.id, game)
                                                        .then((success) => {
                                                            if (success) {
                                                                setMobileOverlayMode(null);
                                                            }

                                                            return success;
                                                        });
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
                                        canEditRoom={canManageRoom}
                                        canDeleteRoom={permissions.can_delete_room}
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
                                canEditRoom={canManageRoom}
                                canDeleteRoom={permissions.can_delete_room}
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
                                    "Kibitz-sidebar has-stream-spacer" +
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
                                <div className="Kibitz-sidebar-stream-spacer" aria-hidden="true" />
                                <div
                                    className="Kibitz-footer-panels"
                                    ref={desktopVariationsTarget?.ref}
                                >
                                    {variationPanels}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {pickerOverlay}
        </div>
    );
}
