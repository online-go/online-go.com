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
import { Player } from "@/components/Player";
import { PlayerDetails } from "@/components/Player/PlayerDetails";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import { GobanControllerContext } from "@/components/GobanView";
import { popover } from "@/lib/popover";
import { toast } from "@/lib/toast";
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import { type GobanConfig, type GobanRendererConfig, type MoveTreeJson, protocol } from "goban";
import type {
    KibitzDebugState,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzRoomUser,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import { KibitzDebugPanel } from "./KibitzDebugPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage, type KibitzCurrentGameBaseSnapshot } from "./KibitzRoomStage";
import { KibitzSharedStreamPanel } from "./KibitzSharedStreamPanel";
import { KibitzPresence } from "./KibitzPresence";
import { KibitzPresencePanel } from "./KibitzPresencePanel";
import { KibitzPresetChangePendingBanner } from "./KibitzPresetChangePendingBanner";
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
import { useKibitzCurrentGameConnectionKeeper } from "./useKibitzCurrentGameConnectionKeeper";
import { getKibitzAccessPolicyForUser, isKibitzAccessBlockedForUser } from "./kibitzAnalysisPolicy";
import { getVisiblePostedVariations } from "./kibitzVariationQuickList";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import {
    getKibitzBlockedRoomFollowupMessage,
    getKibitzBlockedRoomMessage,
} from "./kibitzAnalysisPolicyText";
import { logKibitzVariationDebug, summarizeKibitzMoveTreeNode } from "./kibitzVariationDebug";
import { useCurrentKibitzUser } from "./useCurrentKibitzUser";
import "./Kibitz.css";

type SecondaryPaneMode = "hidden" | "small" | "equal";
type MobileCompanionPanel = "chat" | "vote" | "compare";
type MobileOverlayMode =
    | "rooms"
    | "presence"
    | "room-settings"
    | "create-room"
    | "change-board"
    | null;
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
const DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY = "kibitz.desktop.sidebar_width_px";
const DESKTOP_SIDEBAR_MIN_NARROW_PX = 288;
const DESKTOP_SIDEBAR_MIN_COMFORTABLE_PX = 336;
const DESKTOP_STAGE_MIN_PX = 512;
const DESKTOP_SIDEBAR_MAX_RATIO = 0.48;
const DESKTOP_SIDEBAR_KEYBOARD_STEP_PX = 24;
const DESKTOP_SIDEBAR_KEYBOARD_LARGE_STEP_PX = 72;
const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;
const VARIATION_LIMIT_TOAST_MS = 1800;
const VARIATION_LIMIT_FLASH_MS = 900;
const CURRENT_GAME_BASE_SNAPSHOT_TOAST_MS = 1800;

interface KibitzSnapshotGameDetails {
    id: number;
    width: number;
    height: number;
    name: string;
    gamedata: {
        moves: unknown[];
    };
}

function cloneMoveTreeJson(moveTree: MoveTreeJson): MoveTreeJson {
    return JSON.parse(JSON.stringify(moveTree)) as MoveTreeJson;
}

function moveTreeIdAsNumber(moveTreeId: number | string | null): number | undefined {
    return typeof moveTreeId === "number" ? moveTreeId : undefined;
}

function isCurrentGameBaseSnapshotUsable(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    game: KibitzWatchedGame | null | undefined,
): snapshot is KibitzCurrentGameBaseSnapshot {
    if (!snapshot || !game) {
        return false;
    }

    if (snapshot.gameId !== game.game_id) {
        return false;
    }

    const expectedMoveNumber = game.move_number ?? 0;
    return snapshot.trunkTailMoveNumber >= expectedMoveNumber;
}

function captureCurrentGameBaseSnapshotFromController(
    controller: GobanController | null,
    game: KibitzWatchedGame | null | undefined,
    source: KibitzCurrentGameBaseSnapshot["source"] = "main-board",
): KibitzCurrentGameBaseSnapshot | null {
    if (!controller || !game) {
        return null;
    }

    const { engine } = controller.goban;
    const officialTail = getMoveTreeTrunkTail(engine.move_tree);
    const expectedMoveNumber = game.move_number ?? 0;

    if (!officialTail || officialTail.move_number < expectedMoveNumber) {
        return null;
    }

    return {
        gameId: game.game_id,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: game.game_id,
            moves: undefined,
            move_tree: cloneMoveTreeJson(engine.move_tree.toJson() as MoveTreeJson),
        },
    };
}

async function fetchCurrentGameBaseSnapshot(
    game: KibitzWatchedGame,
): Promise<KibitzCurrentGameBaseSnapshot | null> {
    const details = (await get(`games/${game.game_id}`)) as KibitzSnapshotGameDetails;
    if (!details?.gamedata?.moves) {
        return null;
    }

    const boardDiv = document.createElement("div");
    const config: GobanRendererConfig & { moves?: GobanConfig["moves"] } = {
        board_div: boardDiv,
        interactive: false,
        connect_to_chat: false,
        connect_to_game: false,
        width: details.width,
        height: details.height,
        moves: details.gamedata.moves as GobanConfig["moves"],
    };
    const snapshotController = new GobanController(config as GobanRendererConfig);

    try {
        const { engine } = snapshotController.goban;
        const officialTail = getMoveTreeTrunkTail(engine.move_tree);
        const expectedMoveNumber = Math.max(game.move_number ?? 0, details.gamedata.moves.length);

        if (!officialTail || officialTail.move_number < expectedMoveNumber) {
            logKibitzVariationDebug("current-game-base-snapshot:fetch-not-ready", {
                gameId: game.game_id,
                expectedMoveNumber,
                officialTailMoveNumber: officialTail?.move_number ?? null,
                fetchedMoveCount: details.gamedata.moves.length,
            });
            return null;
        }

        return {
            gameId: game.game_id,
            trunkTailMoveNumber: officialTail.move_number,
            moveTreeId: engine.move_tree?.id ?? null,
            movePath: officialTail.getMoveStringToThisPoint(),
            source: "game-details",
            config: {
                ...(engine.config as Record<string, unknown>),
                game_id: game.game_id,
                moves: undefined,
                move_tree: cloneMoveTreeJson(engine.move_tree.toJson() as MoveTreeJson),
            },
        };
    } finally {
        snapshotController.destroy();
    }
}

function chooseFresherCurrentGameBaseSnapshot(
    previous: KibitzCurrentGameBaseSnapshot | null,
    next: KibitzCurrentGameBaseSnapshot,
): KibitzCurrentGameBaseSnapshot {
    if (!previous || previous.gameId !== next.gameId) {
        return next;
    }

    return previous.trunkTailMoveNumber >= next.trunkTailMoveNumber ? previous : next;
}

export function pruneVisibleVariationIdsForGame(
    variations: KibitzVariationSummary[],
    visibleVariationIds: string[],
    gameId: number | null,
): string[] {
    if (gameId == null) {
        return visibleVariationIds;
    }

    const variationGameIds = new Map(
        variations.map((variation) => [variation.id, variation.game_id]),
    );

    return visibleVariationIds.filter(
        (variationId) => variationGameIds.get(variationId) === gameId,
    );
}

function clampMobileSplitRatio(value: number): number {
    return Math.min(MAX_MOBILE_SPLIT_RATIO, Math.max(MIN_MOBILE_SPLIT_RATIO, value));
}

function getDesktopSidebarWidthBoundsPx(contentWidth: number): { min: number; max: number } {
    const min =
        contentWidth >= 1100 ? DESKTOP_SIDEBAR_MIN_COMFORTABLE_PX : DESKTOP_SIDEBAR_MIN_NARROW_PX;

    const maxSidebar = Math.min(
        contentWidth * DESKTOP_SIDEBAR_MAX_RATIO,
        contentWidth - DESKTOP_STAGE_MIN_PX,
    );

    if (!Number.isFinite(contentWidth) || contentWidth <= 0) {
        return { min, max: min };
    }

    if (maxSidebar <= min) {
        return {
            min,
            max: Math.max(DESKTOP_SIDEBAR_MIN_NARROW_PX, Math.floor(contentWidth * 0.42)),
        };
    }

    return { min, max: Math.round(maxSidebar) };
}

export function clampDesktopSidebarWidthPx(width: number, contentWidth: number): number {
    const { min: minSidebar, max: maxSidebar } = getDesktopSidebarWidthBoundsPx(contentWidth);

    if (!Number.isFinite(width) || contentWidth <= 0) {
        return minSidebar;
    }

    return Math.min(maxSidebar, Math.max(minSidebar, Math.round(width)));
}

function formatMobileMatchup(
    room: KibitzRoom | KibitzRoomSummary | null | undefined,
): { black: KibitzRoomUser; white: KibitzRoomUser } | null {
    const game = room?.current_game;

    if (!game) {
        return null;
    }

    return {
        black: game.black,
        white: game.white,
    };
}

function renderMobileHeaderAvatar(user: KibitzRoomUser): React.ReactElement {
    return (
        <button
            type="button"
            className="mobile-room-header-matchup-avatar-button"
            onClick={(event) => openMobileHeaderPlayerPopover(event, user)}
            aria-label={user.username}
        >
            <KibitzUserAvatar
                user={user}
                size={64}
                className="mobile-room-header-matchup-avatar"
                iconClassName="mobile-room-header-matchup-avatar-image"
            />
        </button>
    );
}

function renderMobileHeaderPlayer(
    user: KibitzRoomUser,
    stoneColor: "black" | "white",
): React.ReactElement {
    const contents = (
        <>
            {stoneColor === "black" && (
                <span
                    className={`mobile-room-header-player-stone mobile-room-header-player-stone-${stoneColor}`}
                    aria-hidden="true"
                />
            )}
            <Player user={user} flag rank noextracontrols />
            {stoneColor === "white" && (
                <span
                    className={`mobile-room-header-player-stone mobile-room-header-player-stone-${stoneColor}`}
                    aria-hidden="true"
                />
            )}
        </>
    );

    return (
        <span className={`mobile-room-header-player mobile-room-header-player-${stoneColor}`}>
            {contents}
        </span>
    );
}

function openMobileHeaderPlayerPopover(
    event: React.MouseEvent<HTMLButtonElement>,
    user: KibitzRoomUser,
): void {
    event.preventDefault();
    event.stopPropagation();

    popover({
        elt: <PlayerDetails playerId={user.id} />,
        below: event.currentTarget,
        minWidth: 240,
        minHeight: 250,
    });
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
    const [currentGameBaseSnapshot, setCurrentGameBaseSnapshot] =
        React.useState<KibitzCurrentGameBaseSnapshot | null>(null);
    const [currentGameBaseSnapshotLoadingGameId, setCurrentGameBaseSnapshotLoadingGameId] =
        React.useState<number | null>(null);
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
    const [desktopSidebarWidthPx, setDesktopSidebarWidthPx] = React.useState<number | null>(() => {
        const stored = window.localStorage.getItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY);
        const parsed = stored ? Number.parseFloat(stored) : NaN;

        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    });
    const [desktopContentWidthPx, setDesktopContentWidthPx] = React.useState(0);
    const [isDesktopSidebarDragging, setIsDesktopSidebarDragging] = React.useState(false);
    const [mobileViewerCountFlash, setMobileViewerCountFlash] = React.useState(false);
    const [visibleVariationIds, setVisibleVariationIds] = React.useState<string[]>([]);
    const [variationColorIndexes, setVariationColorIndexes] = React.useState<
        Record<string, number>
    >({});
    const [variationFocusRequestId, setVariationFocusRequestId] = React.useState(0);
    const [cachedGamesVersion, setCachedGamesVersion] = React.useState(0);
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
    const desktopContentRef = React.useRef<HTMLDivElement | null>(null);
    const [desktopContentEl, setDesktopContentEl] = React.useState<HTMLDivElement | null>(null);
    const desktopContentCallbackRef = React.useCallback((el: HTMLDivElement | null) => {
        desktopContentRef.current = el;
        setDesktopContentEl(el);
    }, []);
    const desktopSidebarRef = React.useRef<HTMLDivElement | null>(null);
    const desktopSidebarResizerRef = React.useRef<HTMLDivElement | null>(null);
    const previousMobileViewerCountRef = React.useRef<number | null>(null);
    const previousMobileViewerRoomIdRef = React.useRef<string | null>(null);
    const desktopSidebarWidthPxRef = React.useRef<number | null>(null);
    const desktopSidebarDragStateRef = React.useRef<{
        pointerId: number;
        contentRight: number;
        contentWidth: number;
    } | null>(null);
    const mobileDragStateRef = React.useRef<{
        pointerId: number;
        startY: number;
        startRatio: number;
    } | null>(null);
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);
    const handleCachedGamesChanged = React.useCallback(() => {
        setCachedGamesVersion((previous) => previous + 1);
    }, []);

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

    desktopSidebarWidthPxRef.current = desktopSidebarWidthPx;

    const setAndStoreDesktopSidebarWidthPx = React.useCallback((width: number | null) => {
        setDesktopSidebarWidthPx(width);

        if (width === null) {
            window.localStorage.removeItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    }, []);

    const getCurrentDesktopSidebarWidthPx = React.useCallback(() => {
        if (desktopSidebarWidthPx !== null) {
            return desktopSidebarWidthPx;
        }

        const sidebarRect = desktopSidebarRef.current?.getBoundingClientRect();
        return sidebarRect?.width ?? 0;
    }, [desktopSidebarWidthPx]);

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
        const stopDesktopDrag = (pointerId?: number) => {
            const resizer = desktopSidebarResizerRef.current;

            if (pointerId !== undefined && resizer?.hasPointerCapture?.(pointerId)) {
                resizer.releasePointerCapture(pointerId);
            }

            desktopSidebarDragStateRef.current = null;
            setIsDesktopSidebarDragging(false);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };

        const onPointerMove = (event: PointerEvent) => {
            const dragState = desktopSidebarDragStateRef.current;

            if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
            }

            const rawWidth = dragState.contentRight - event.clientX;
            const nextWidth = clampDesktopSidebarWidthPx(rawWidth, dragState.contentWidth);

            setAndStoreDesktopSidebarWidthPx(nextWidth);
            event.preventDefault();
        };

        const onPointerUp = (event: PointerEvent) => {
            const dragState = desktopSidebarDragStateRef.current;

            if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
            }

            stopDesktopDrag(event.pointerId);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
            stopDesktopDrag();
        };
    }, [setAndStoreDesktopSidebarWidthPx]);

    React.useEffect(() => {
        if (!isMobileLayout) {
            return;
        }

        desktopSidebarDragStateRef.current = null;
        setIsDesktopSidebarDragging(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
    }, [isMobileLayout]);

    React.useEffect(() => {
        if (!desktopContentEl || typeof ResizeObserver === "undefined") {
            return;
        }

        const syncContentWidth = (contentWidth: number) => {
            if (contentWidth <= 0) {
                return;
            }

            setDesktopContentWidthPx((previousWidth) =>
                previousWidth === contentWidth ? previousWidth : contentWidth,
            );

            const currentWidth = desktopSidebarWidthPxRef.current;
            if (currentWidth === null) {
                return;
            }

            const clamped = clampDesktopSidebarWidthPx(currentWidth, contentWidth);

            if (clamped !== currentWidth) {
                setAndStoreDesktopSidebarWidthPx(clamped);
            }
        };

        syncContentWidth(desktopContentEl.getBoundingClientRect().width);

        const resizeObserver = new ResizeObserver(([entry]) => {
            syncContentWidth(entry.contentRect.width);
        });

        resizeObserver.observe(desktopContentEl);

        return () => {
            resizeObserver.disconnect();
        };
    }, [desktopContentEl, setAndStoreDesktopSidebarWidthPx]);

    React.useEffect(() => {
        if (mobileOverlayMode === "rooms") {
            void controller.refreshRoomDirectory();
        }
    }, [controller, mobileOverlayMode]);

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
        controller.on("cached-games-changed", handleCachedGamesChanged);
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
            controller.off("cached-games-changed", handleCachedGamesChanged);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.off("permissions-changed", setPermissions);
            controller.off("access-changed", setAccessBlocked);
        };
    }, [controller, handleCachedGamesChanged]);

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
    const currentGameId = resolvedRoom?.current_game?.game_id ?? null;
    const pickerOpen = Boolean(
        pickerMode || mobileOverlayMode === "create-room" || mobileOverlayMode === "change-board",
    );
    useKibitzCurrentGameConnectionKeeper({
        roomId: resolvedRoom?.id ?? null,
        currentGameId,
        isLive: Boolean(resolvedRoom?.current_game?.live),
        pickerOpen,
        enabled: Boolean(resolvedRoom),
        debugSource: "KibitzInner",
        boardController: mainBoardController,
    });
    React.useEffect(() => {
        setCurrentGameBaseSnapshot((previous) =>
            previous?.gameId === currentGameId ? previous : null,
        );
    }, [currentGameId]);

    React.useEffect(() => {
        const game = resolvedRoom?.current_game;
        if (!game || !mainBoardController) {
            return;
        }

        const goban = mainBoardController.goban;
        let disposed = false;

        const syncSnapshotFromMainBoard = (reason: string) => {
            if (disposed) {
                return;
            }

            const snapshot = captureCurrentGameBaseSnapshotFromController(
                mainBoardController,
                game,
            );
            if (!snapshot) {
                const officialTail = getMoveTreeTrunkTail(goban.engine.move_tree);
                logKibitzVariationDebug("current-game-base-snapshot:main-not-ready", {
                    reason,
                    gameId: game.game_id,
                    expectedMoveNumber: game.move_number ?? 0,
                    officialTailMoveNumber: officialTail?.move_number ?? null,
                    currentMoveNumber: goban.engine.cur_move?.move_number ?? null,
                });
                return;
            }

            logKibitzVariationDebug("current-game-base-snapshot:main-ready", {
                reason,
                gameId: snapshot.gameId,
                trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
                moveTreeId: snapshot.moveTreeId,
            });
            setCurrentGameBaseSnapshot((previous) =>
                chooseFresherCurrentGameBaseSnapshot(previous, snapshot),
            );
        };

        const onLoad = () => syncSnapshotFromMainBoard("load");
        const onGameData = () => syncSnapshotFromMainBoard("gamedata");
        const onLastOfficialMove = () => syncSnapshotFromMainBoard("last_official_move");
        const onMoveMade = () => syncSnapshotFromMainBoard("move-made");

        goban.on("load", onLoad);
        goban.on("gamedata", onGameData);
        goban.on("last_official_move", onLastOfficialMove);
        goban.on("move-made", onMoveMade);
        syncSnapshotFromMainBoard("mount");

        return () => {
            disposed = true;
            goban.off("load", onLoad);
            goban.off("gamedata", onGameData);
            goban.off("last_official_move", onLastOfficialMove);
            goban.off("move-made", onMoveMade);
        };
    }, [mainBoardController, resolvedRoom?.current_game]);

    React.useEffect(() => {
        const game = resolvedRoom?.current_game;
        if (!game) {
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        let cancelled = false;
        setCurrentGameBaseSnapshotLoadingGameId(game.game_id);

        void fetchCurrentGameBaseSnapshot(game)
            .then((snapshot) => {
                if (cancelled) {
                    return;
                }

                if (snapshot) {
                    logKibitzVariationDebug("current-game-base-snapshot:fetch-ready", {
                        gameId: snapshot.gameId,
                        trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
                        moveTreeId: snapshot.moveTreeId,
                    });
                    setCurrentGameBaseSnapshot((previous) =>
                        chooseFresherCurrentGameBaseSnapshot(previous, snapshot),
                    );
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    logKibitzVariationDebug("current-game-base-snapshot:fetch-failed", {
                        gameId: game.game_id,
                        error,
                    });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setCurrentGameBaseSnapshotLoadingGameId((loadingGameId) =>
                        loadingGameId === game.game_id ? null : loadingGameId,
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [resolvedRoom?.current_game?.game_id]);

    const getCurrentGameBaseSnapshotForVariation = React.useCallback(
        (reason: string): KibitzCurrentGameBaseSnapshot | null => {
            const game = resolvedRoom?.current_game;
            if (!game) {
                return null;
            }

            const cachedSnapshot = currentGameBaseSnapshot;
            const cachedSnapshotForLog: KibitzCurrentGameBaseSnapshot | null =
                currentGameBaseSnapshot;
            const mainBoardSnapshot = captureCurrentGameBaseSnapshotFromController(
                mainBoardController,
                game,
            );
            if (mainBoardSnapshot) {
                setCurrentGameBaseSnapshot((previous) =>
                    chooseFresherCurrentGameBaseSnapshot(previous, mainBoardSnapshot),
                );
                return mainBoardSnapshot;
            }

            if (isCurrentGameBaseSnapshotUsable(cachedSnapshot, game)) {
                return cachedSnapshot;
            }

            logKibitzVariationDebug("current-game-base-snapshot:not-ready-for-variation", {
                reason,
                gameId: game.game_id,
                expectedMoveNumber: game.move_number ?? 0,
                cachedSnapshot: cachedSnapshotForLog
                    ? {
                          gameId: cachedSnapshotForLog.gameId,
                          trunkTailMoveNumber: cachedSnapshotForLog.trunkTailMoveNumber,
                          source: cachedSnapshotForLog.source,
                      }
                    : null,
                loadingGameId: currentGameBaseSnapshotLoadingGameId,
            });
            return null;
        },
        [
            currentGameBaseSnapshot,
            currentGameBaseSnapshotLoadingGameId,
            mainBoardController,
            resolvedRoom?.current_game,
        ],
    );

    const showCurrentGameBaseNotReadyToast = React.useCallback(() => {
        toast(
            <div>
                {pgettext(
                    "Notice shown when Kibitz is still loading the base game before creating a variation",
                    "Preparing the board. Try again in a moment.",
                )}
            </div>,
            CURRENT_GAME_BASE_SNAPSHOT_TOAST_MS,
        );
    }, []);
    const activePostedVariations = React.useMemo(
        () => getVisiblePostedVariations(displayedVariations, visibleVariationIds),
        [displayedVariations, visibleVariationIds],
    );
    const activeVariationGameIds = React.useMemo(
        () => [...new Set(activePostedVariations.map((variation) => variation.game_id))],
        [activePostedVariations],
    );
    React.useEffect(() => {
        void controller.ensureGamesCached(activeVariationGameIds);
    }, [activeVariationGameIds, controller]);
    const variationGameById = React.useMemo(() => {
        const next = new Map<number, KibitzWatchedGame>();

        const addGame = (game: KibitzWatchedGame | undefined | null) => {
            if (game) {
                next.set(game.game_id, game);
            }
        };

        addGame(resolvedRoom?.current_game);

        for (const room of rooms) {
            addGame(room.current_game);
        }

        for (const proposal of proposals) {
            addGame(proposal.proposed_game);
        }

        for (const variation of activePostedVariations) {
            addGame(controller.getCachedGame(variation.game_id));
        }

        return next;
    }, [
        activePostedVariations,
        cachedGamesVersion,
        controller,
        proposals,
        resolvedRoom?.current_game,
        rooms,
    ]);
    const activePostedVariationIds = React.useMemo(
        () => new Set(activePostedVariations.map((variation) => variation.id)),
        [activePostedVariations],
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
        const nextVisibleVariation =
            activePostedVariations.find(
                (variation) =>
                    currentVariation != null && variation.game_id === currentVariation.game_id,
            ) ?? activePostedVariations[0];

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
        activePostedVariations,
        isMobileLayout,
        secondaryPane.variation_id,
    ]);

    const onOpenVariation = React.useCallback(
        (variationId: string, focusVariation: boolean = false) => {
            const isAlreadyVisibleInState = visibleVariationIds.includes(variationId);
            const isAlreadyVisibleInQuickList = activePostedVariationIds.has(variationId);
            const shouldLimitOpening =
                !isAlreadyVisibleInQuickList &&
                activePostedVariations.length >= MAX_VISIBLE_VARIATIONS;

            if (shouldLimitOpening) {
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

            const nextVisibleVariationIds = isAlreadyVisibleInState
                ? visibleVariationIds
                : [...visibleVariationIds, variationId];

            if (nextVisibleVariationIds !== visibleVariationIds) {
                setVisibleVariationIds(nextVisibleVariationIds);
                setVariationColorIndexes((previous) =>
                    assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
                );
            }
            if (focusVariation) {
                setVariationFocusRequestId((previous) => previous + 1);
            }
            controller.openVariation(variationId);
            if (!isAlreadyVisibleInState) {
                kibitzHelpTriggers.noteDesktopVariationMadeVisible();
                kibitzHelpTriggers.notePostedVariationOpened();
            }
            if (isMobileLayout) {
                setMobileCompanionPanel("compare");
            }
        },
        [
            activePostedVariations.length,
            activePostedVariationIds,
            controller,
            isMobileLayout,
            kibitzHelpTriggers,
            visibleVariationIds,
        ],
    );
    const onToggleVariation = React.useCallback(
        (variationId: string) => {
            const toggledVariation = displayedVariations.find(
                (variation) => variation.id === variationId,
            );
            if (!toggledVariation) {
                return;
            }

            const nextVisibleVariationIds = visibleVariationIds.filter((id) => id !== variationId);
            if (nextVisibleVariationIds.length === visibleVariationIds.length) {
                return;
            }

            setVisibleVariationIds(nextVisibleVariationIds);
            setVariationColorIndexes((previous) =>
                assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
            );

            if (secondaryPane.variation_id === variationId) {
                const nextVisibleVariations = nextVisibleVariationIds
                    .map((id) => displayedVariations.find((variation) => variation.id === id))
                    .filter((variation): variation is KibitzVariationSummary => variation != null);
                const nextActiveVariation =
                    nextVisibleVariations.find(
                        (variation) => variation.game_id === toggledVariation.game_id,
                    ) ?? nextVisibleVariations[0];

                if (nextActiveVariation) {
                    setVariationFocusRequestId((previous) => previous + 1);
                    controller.openVariation(nextActiveVariation.id);
                } else {
                    controller.clearPreviewGame();
                }
            }
        },
        [controller, displayedVariations, secondaryPane.variation_id, visibleVariationIds],
    );

    React.useLayoutEffect(() => {
        setVariationColorIndexes((previous) => {
            return assignVisibleVariationColorIndexes(previous, visibleVariationIds);
        });
    }, [visibleVariationIds]);

    React.useEffect(() => {
        return () => {
            if (blockedVariationFlashTimerRef.current) {
                clearTimeout(blockedVariationFlashTimerRef.current);
                blockedVariationFlashTimerRef.current = null;
            }
        };
    }, []);
    const logMainBoardState = React.useCallback(
        (reason: string) => {
            const controller = mainBoardController;
            const room = resolvedRoom;
            const game = room?.current_game;

            if (!controller || !game) {
                return;
            }

            const { engine } = controller.goban;
            const officialTail = getMoveTreeTrunkTail(engine.move_tree);

            logKibitzVariationDebug("new-variation:main-board-state", {
                reason,
                roomId: room.id,
                gameId: game.game_id,
                currentMove: summarizeKibitzMoveTreeNode(engine.cur_move),
                currentMoveNumber: engine.cur_move?.move_number ?? null,
                officialTail: summarizeKibitzMoveTreeNode(officialTail),
                officialTailMoveNumber: officialTail?.move_number ?? null,
                lastOfficialMove: summarizeKibitzMoveTreeNode(engine.last_official_move),
                lastOfficialMoveNumber: engine.last_official_move?.move_number ?? null,
            });
        },
        [mainBoardController, resolvedRoom],
    );
    const onCreateVariation = React.useCallback(() => {
        logMainBoardState("new-variation");
        const snapshot = getCurrentGameBaseSnapshotForVariation("new-variation");
        if (!snapshot) {
            showCurrentGameBaseNotReadyToast();
            return;
        }

        controller.startVariationFromCurrentBoard(
            snapshot.config.move_tree,
            snapshot.movePath,
            moveTreeIdAsNumber(snapshot.moveTreeId),
        );
        if (isMobileLayout) {
            setMobileOverlayMode(null);
            setMobileCompanionPanel("compare");
        }
    }, [
        controller,
        getCurrentGameBaseSnapshotForVariation,
        isMobileLayout,
        logMainBoardState,
        showCurrentGameBaseNotReadyToast,
    ]);
    const onCreateVariationFromPostedVariation = React.useCallback(
        (variation: KibitzVariationSummary) => {
            logMainBoardState("new-variation-from-posted-variation");
            const snapshot =
                variation.game_id === currentGameId
                    ? getCurrentGameBaseSnapshotForVariation("new-variation-from-posted")
                    : null;

            if (variation.game_id === currentGameId && !snapshot) {
                showCurrentGameBaseNotReadyToast();
                return;
            }

            controller.startVariationFromPostedVariation(
                variation,
                snapshot?.config.move_tree,
                snapshot?.movePath,
                moveTreeIdAsNumber(snapshot?.moveTreeId ?? null),
            );
            kibitzHelpTriggers.noteDraftStartedFromPostedVariation();
            if (isMobileLayout) {
                setMobileOverlayMode(null);
                setMobileCompanionPanel("compare");
            }
        },
        [
            controller,
            currentGameId,
            getCurrentGameBaseSnapshotForVariation,
            isMobileLayout,
            kibitzHelpTriggers,
            logMainBoardState,
            showCurrentGameBaseNotReadyToast,
        ],
    );
    const onSetSecondaryPaneMode = React.useCallback((nextMode: SecondaryPaneMode) => {
        setPendingSecondaryPaneMode(nextMode);
    }, []);

    const onDesktopSidebarResizerPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isMobileLayout) {
                return;
            }

            const content = desktopContentRef.current;
            if (!content) {
                return;
            }

            const contentRect = content.getBoundingClientRect();
            if (contentRect.width <= 0) {
                return;
            }

            event.preventDefault();

            desktopSidebarDragStateRef.current = {
                pointerId: event.pointerId,
                contentRight: contentRect.right,
                contentWidth: contentRect.width,
            };

            event.currentTarget.setPointerCapture?.(event.pointerId);
            setIsDesktopSidebarDragging(true);
            document.body.style.userSelect = "none";
            document.body.style.cursor = "ew-resize";
        },
        [isMobileLayout],
    );

    const onDesktopSidebarResizerKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isMobileLayout) {
                return;
            }

            const content = desktopContentRef.current;
            if (!content) {
                return;
            }

            const contentRect = content.getBoundingClientRect();
            const contentWidth = contentRect.width;

            if (contentWidth <= 0) {
                return;
            }

            const currentWidth = getCurrentDesktopSidebarWidthPx();
            const step = event.shiftKey
                ? DESKTOP_SIDEBAR_KEYBOARD_LARGE_STEP_PX
                : DESKTOP_SIDEBAR_KEYBOARD_STEP_PX;
            const stopGlobalShortcutPropagation = () => {
                event.preventDefault();
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation();
            };

            if (event.key === "ArrowLeft") {
                stopGlobalShortcutPropagation();
                setAndStoreDesktopSidebarWidthPx(
                    clampDesktopSidebarWidthPx(currentWidth + step, contentWidth),
                );
                return;
            }

            if (event.key === "ArrowRight") {
                stopGlobalShortcutPropagation();
                setAndStoreDesktopSidebarWidthPx(
                    clampDesktopSidebarWidthPx(currentWidth - step, contentWidth),
                );
                return;
            }

            if (event.key === "Home") {
                stopGlobalShortcutPropagation();
                setAndStoreDesktopSidebarWidthPx(clampDesktopSidebarWidthPx(0, contentWidth));
                return;
            }

            if (event.key === "End") {
                stopGlobalShortcutPropagation();
                setAndStoreDesktopSidebarWidthPx(
                    clampDesktopSidebarWidthPx(contentWidth, contentWidth),
                );
                return;
            }

            if (event.key === "Enter" || event.key === "Escape") {
                stopGlobalShortcutPropagation();
                setAndStoreDesktopSidebarWidthPx(null);
            }
        },
        [getCurrentDesktopSidebarWidthPx, isMobileLayout, setAndStoreDesktopSidebarWidthPx],
    );

    const desktopContentClassName =
        "Kibitz-content" + (desktopSidebarWidthPx !== null ? " has-custom-sidebar-width" : "");
    const desktopContentStyle =
        desktopSidebarWidthPx !== null
            ? ({
                  "--kibitz-sidebar-width": `${desktopSidebarWidthPx}px`,
              } as React.CSSProperties)
            : undefined;
    const desktopSidebarWidthBounds = getDesktopSidebarWidthBoundsPx(desktopContentWidthPx);
    const desktopSidebarCurrentWidth = clampDesktopSidebarWidthPx(
        getCurrentDesktopSidebarWidthPx(),
        desktopContentWidthPx,
    );
    const desktopSidebarResizer = (
        <div
            ref={desktopSidebarResizerRef}
            className={
                "Kibitz-page-sidebar-resizer" + (isDesktopSidebarDragging ? " is-dragging" : "")
            }
            role="separator"
            aria-orientation="vertical"
            aria-label={pgettext(
                "Aria label for resizing the Kibitz right sidebar",
                "Resize chat and variations column",
            )}
            aria-valuenow={desktopSidebarCurrentWidth}
            aria-valuemin={desktopSidebarWidthBounds.min}
            aria-valuemax={desktopSidebarWidthBounds.max}
            tabIndex={0}
            onPointerDown={onDesktopSidebarResizerPointerDown}
            onKeyDown={onDesktopSidebarResizerKeyDown}
            onDoubleClick={() => setAndStoreDesktopSidebarWidthPx(null)}
        />
    );

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

    const isPresetWithNoGame = Boolean(resolvedRoom?.preset && !resolvedRoom.current_game?.game_id);
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
            <KibitzVariationList
                variations={activePostedVariations}
                currentGameId={currentGameId}
                gameById={variationGameById}
                selectedVariationId={secondaryPane.variation_id}
                variationFocusRequestId={variationFocusRequestId}
                variationColorIndexes={variationColorIndexes}
                blockedVariationFlashId={blockedVariationFlashId}
                onRecallVariation={(variationId) => onOpenVariation(variationId, true)}
                onHideVariation={onToggleVariation}
                helpTargetId={KIBITZ_HELP_TARGETS.desktopVariationList}
            />
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

    const onToggleMobilePresence = React.useCallback(() => {
        setMobileOverlayMode((mode) => (mode === "presence" ? null : "presence"));
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
                        <div
                            className={desktopContentClassName}
                            ref={desktopContentCallbackRef}
                            style={desktopContentStyle}
                        >
                            <div className="Kibitz-empty-stage">
                                <p>{getKibitzBlockedRoomMessage(blockedTitle)}</p>
                                <p>{getKibitzBlockedRoomFollowupMessage()}</p>
                            </div>
                            <div
                                className="Kibitz-sidebar no-active-proposal"
                                ref={desktopSidebarRef}
                            >
                                {desktopSidebarResizer}
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
                        <div
                            className={desktopContentClassName}
                            ref={desktopContentCallbackRef}
                            style={desktopContentStyle}
                        >
                            <div className="Kibitz-empty-stage">
                                <p>{emptyMessage}</p>
                            </div>
                            <div
                                className="Kibitz-sidebar no-active-proposal"
                                ref={desktopSidebarRef}
                            >
                                {desktopSidebarResizer}
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
                    {resolvedRoom.preset?.selection_status === "change_pending" &&
                        resolvedRoom.preset.change_effective_at && (
                            <KibitzPresetChangePendingBanner
                                changeEffectiveAt={resolvedRoom.preset.change_effective_at}
                            />
                        )}
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
                                    className="Kibitz-mobile-room-title-button"
                                    ref={mobileRoomTitleTarget?.ref}
                                    onClick={onToggleMobileRooms}
                                    aria-expanded={mobileOverlayMode === "rooms"}
                                >
                                    <span className="mobile-room-header-title">
                                        {resolvedRoom.title}
                                    </span>
                                    <i
                                        className="fa fa-chevron-down mobile-room-header-title-chevron"
                                        aria-hidden="true"
                                    />
                                </button>
                                {mobileMatchup ? (
                                    <div className="mobile-room-header-matchup">
                                        <span className="mobile-room-header-matchup-avatar mobile-room-header-matchup-avatar-black">
                                            {renderMobileHeaderAvatar(mobileMatchup.black)}
                                        </span>
                                        <span className="mobile-room-header-matchup-content">
                                            <span className="mobile-room-header-matchup-first">
                                                {renderMobileHeaderPlayer(
                                                    mobileMatchup.black,
                                                    "black",
                                                )}
                                            </span>
                                            <span className="mobile-room-header-matchup-second">
                                                <span className="mobile-room-header-matchup-second-name">
                                                    {renderMobileHeaderPlayer(
                                                        mobileMatchup.white,
                                                        "white",
                                                    )}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="mobile-room-header-matchup-avatar mobile-room-header-matchup-avatar-white">
                                            {renderMobileHeaderAvatar(mobileMatchup.white)}
                                        </span>
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    className={
                                        "mobile-room-header-meta" +
                                        (mobileViewerCountFlash
                                            ? " mobile-room-header-meta-flash"
                                            : "")
                                    }
                                    onClick={onToggleMobilePresence}
                                    aria-expanded={mobileOverlayMode === "presence"}
                                    aria-label={interpolate(
                                        pgettext(
                                            "Aria label for opening mobile kibitz room presence",
                                            "Show {{count}} people in this room",
                                        ),
                                        { count: resolvedRoom.viewer_count },
                                    )}
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
                                        ) : mobileOverlayMode === "presence" ? (
                                            <div className="Kibitz-mobile-presence-panel">
                                                <KibitzPresencePanel
                                                    room={resolvedRoom}
                                                    users={resolvedRoomUsers}
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
                                    {isPresetWithNoGame ? (
                                        <div className="KibitzPresetEmptyState">
                                            {pgettext(
                                                "Shown in a kibitz preset room when no eligible live game is currently being watched",
                                                "Looking for a suitable live game.",
                                            )}
                                        </div>
                                    ) : (
                                        <KibitzRoomStage
                                            room={resolvedRoom}
                                            rooms={rooms}
                                            variationGameById={variationGameById}
                                            currentGameBaseSnapshot={currentGameBaseSnapshot}
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
                                            onSelectMobileCompanionPanel={
                                                onSelectMobileCompanionPanel
                                            }
                                            onOpenMobileRooms={onToggleMobileRooms}
                                            onMobileCompareControllerChange={
                                                setMobileCompareController
                                            }
                                            onMainBoardControllerChange={setMainBoardController}
                                        />
                                    )}
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
                                                        variations={activePostedVariations}
                                                        currentGameId={currentGameId}
                                                        variationGameById={variationGameById}
                                                        queuedRoomProposals={queuedRoomProposals}
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
                                                        onHideVariation={onToggleVariation}
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
                        <div
                            className={desktopContentClassName}
                            ref={desktopContentCallbackRef}
                            style={desktopContentStyle}
                        >
                            {isPresetWithNoGame ? (
                                <div className="KibitzPresetEmptyState">
                                    {pgettext(
                                        "Shown in a kibitz preset room when no eligible live game is currently being watched",
                                        "Looking for a suitable live game.",
                                    )}
                                </div>
                            ) : (
                                <KibitzRoomStage
                                    room={resolvedRoom}
                                    rooms={rooms}
                                    variationGameById={variationGameById}
                                    currentGameBaseSnapshot={currentGameBaseSnapshot}
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
                            )}
                            <div
                                className={
                                    "Kibitz-sidebar has-stream-spacer" +
                                    (activeProposal
                                        ? " has-active-proposal"
                                        : " no-active-proposal")
                                }
                                ref={desktopSidebarRef}
                            >
                                {desktopSidebarResizer}
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
