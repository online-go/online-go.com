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
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import { GobanControllerContext } from "@/components/GobanView";
import { toast } from "@/lib/toast";
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import { type GobanConfig, type GobanRendererConfig, protocol } from "goban";
import type {
    KibitzDebugState,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import { KibitzDebugPanel } from "./KibitzDebugPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage } from "./KibitzRoomStage";
import type { MobileBoardResizeOwner } from "./KibitzRoomStage";
import { KibitzMobileMainGameScoreboard } from "./KibitzMobileMainGameScoreboard";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
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
import { useKibitzCurrentGameBaseBroker } from "./useKibitzCurrentGameBaseBroker";
import {
    getKibitzAccessPolicyForUser,
    isKibitzAccessBlockedForUser,
    isLoggedInKibitzUser,
} from "./kibitzAnalysisPolicy";
import { getVisiblePostedVariations } from "./kibitzVariationQuickList";
import { type KibitzBoardTransientDragController } from "./KibitzBoard";
import {
    getKibitzBlockedRoomFollowupMessage,
    getKibitzBlockedRoomMessage,
} from "./kibitzAnalysisPolicyText";
import {
    isKibitzBoardSizeDebugEnabled,
    isKibitzBoardSizeVerboseDebugEnabled,
    recordKibitzBoardSizeEvent,
} from "./kibitzBoardSizeDebug";
import {
    describeBoardSurfaceFromHostRect,
    describeGobanContainerFromContainerRect,
    describeGobanContentFromMetrics,
    describeMobileResizeDividerGeometry,
    describeMobileResizeGeometrySnapshot,
    describeMobileResizeShellGeometry,
    compareMobileGeometryToTarget,
    computeMobileBoardGeometry,
    computeMobileResizeAppliedTarget,
    firstPositiveFinite,
    measureSquareFitLayout,
    resolveMobileResizeBaselineGobanContentSize,
    shouldAcceptStableMobileGeometryMeasurement,
    shouldCommitMobileSplitRatioUpdate,
    type MobileResizeAppliedTarget,
    type MobileResizeLifecycleState,
    type StableMobileBoardGeometrySnapshot,
} from "./kibitzBoardSizing";
import {
    isKibitzVariationDebugEnabled,
    logKibitzVariationDebug,
    summarizeKibitzMoveTreeNode,
} from "./kibitzVariationDebug";
import { useCurrentKibitzUser } from "./useCurrentKibitzUser";
import {
    captureCurrentGameBaseSnapshotFromController,
    chooseFresherCurrentGameBaseSnapshot,
} from "./kibitzCurrentGameBaseSnapshot";
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

export const MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX = 3;

export function shouldActivateMobileDividerDrag(deltaY: number): boolean {
    return Math.abs(deltaY) >= MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX;
}

export function isMobileDividerPointerUpNoop(
    activeGestureState: "armed" | "active" | null,
): boolean {
    return activeGestureState !== "active";
}

type MobileResizeNativeSizingConfig = {
    boardWidth: number;
    boardHeight: number;
    showLabels: boolean;
};

const DEFAULT_MOBILE_RESIZE_NATIVE_SIZING: MobileResizeNativeSizingConfig = {
    boardWidth: 19,
    boardHeight: 19,
    showLabels: true,
};

function getMobileResizeNativeSizingConfig(
    controller: KibitzBoardTransientDragController | null | undefined,
): MobileResizeNativeSizingConfig {
    return controller?.getNativeSizingConfig() ?? DEFAULT_MOBILE_RESIZE_NATIVE_SIZING;
}

function buildMobileResizeGeometrySnapshot(params: {
    shellRect?: Pick<DOMRect, "width" | "height"> | null;
    boardSizingSlotRect?: Pick<DOMRect, "width" | "height"> | null;
    boardSurfaceRect?: Pick<DOMRect, "width" | "height"> | null;
    gobanContainerRect?: Pick<DOMRect, "width" | "height"> | null;
    gobanMetrics?: { width: number; height: number } | null;
    dividerRatio?: number | null;
    startDividerRatio?: number | null;
    targetDividerRatio?: number | null;
}) {
    // Legacy fields still exist alongside this block; this is the explicit vocabulary.
    return describeMobileResizeGeometrySnapshot({
        shell:
            params.shellRect != null
                ? describeMobileResizeShellGeometry(params.shellRect.width, params.shellRect.height)
                : undefined,
        boardSizingSlot:
            params.boardSizingSlotRect != null
                ? {
                      boardSizingSlotWidth: params.boardSizingSlotRect.width,
                      boardSizingSlotHeight: params.boardSizingSlotRect.height,
                  }
                : undefined,
        boardSurface: describeBoardSurfaceFromHostRect(params.boardSurfaceRect ?? null),
        gobanContainer: describeGobanContainerFromContainerRect(params.gobanContainerRect ?? null),
        gobanContent: describeGobanContentFromMetrics(params.gobanMetrics ?? null),
        divider:
            params.dividerRatio != null ||
            params.startDividerRatio != null ||
            params.targetDividerRatio != null
                ? describeMobileResizeDividerGeometry({
                      dividerRatio: params.dividerRatio ?? null,
                      startDividerRatio: params.startDividerRatio ?? null,
                      targetDividerRatio: params.targetDividerRatio ?? null,
                  })
                : undefined,
    });
}

export interface VisibleMainBoardHydrationState {
    roomId: string | null;
    gameId: number | null;
    officialTailMoveNumber: number;
    expectedMoveNumber: number;
    hasMoveTree: boolean;
    hydrated: boolean;
}

export function createVisibleMainBoardHydrationState(params: {
    roomId: string | null;
    gameId: number | null;
    expectedMoveNumber: number;
}): VisibleMainBoardHydrationState {
    return {
        roomId: params.roomId,
        gameId: params.gameId,
        officialTailMoveNumber: 0,
        expectedMoveNumber: params.expectedMoveNumber,
        hasMoveTree: false,
        hydrated: false,
    };
}

export function applyVisibleMainBoardHydrationReport(
    previous: VisibleMainBoardHydrationState,
    report: {
        roomId: string;
        gameId: number | null;
        officialTailMoveNumber: number;
        expectedMoveNumber: number;
        hasMoveTree: boolean;
        hydrated: boolean;
    },
    currentRoomId: string | null,
    currentGameId: number | null,
): VisibleMainBoardHydrationState {
    if (report.roomId !== currentRoomId || report.gameId !== currentGameId) {
        return previous;
    }

    const next: VisibleMainBoardHydrationState = {
        roomId: report.roomId,
        gameId: report.gameId,
        officialTailMoveNumber: report.officialTailMoveNumber,
        expectedMoveNumber: report.expectedMoveNumber,
        hasMoveTree: report.hasMoveTree,
        hydrated: report.hydrated,
    };

    if (
        previous.roomId === next.roomId &&
        previous.gameId === next.gameId &&
        previous.officialTailMoveNumber === next.officialTailMoveNumber &&
        previous.expectedMoveNumber === next.expectedMoveNumber &&
        previous.hasMoveTree === next.hasMoveTree &&
        previous.hydrated === next.hydrated
    ) {
        return previous;
    }

    return next;
}

export function isVisibleMainBoardMounted(params: {
    mobileCompareActive: boolean;
    mainBoardController: GobanController | null;
    isCurrentMainBoardController: boolean;
    visibleMainBoardHydration: VisibleMainBoardHydrationState;
    roomId: string | null;
    gameId: number | null;
    currentExpectedMoveNumber: number;
    isCurrentGameLive: boolean;
}): boolean {
    const hydration = params.visibleMainBoardHydration;

    if (
        params.isCurrentGameLive &&
        params.currentExpectedMoveNumber === 0 &&
        hydration.officialTailMoveNumber === 0
    ) {
        return false;
    }

    return Boolean(
        !params.mobileCompareActive &&
        params.mainBoardController &&
        params.isCurrentMainBoardController &&
        hydration.roomId === params.roomId &&
        hydration.gameId === params.gameId &&
        hydration.hydrated &&
        hydration.expectedMoveNumber >= params.currentExpectedMoveNumber &&
        (params.currentExpectedMoveNumber === 0
            ? hydration.hasMoveTree
            : hydration.officialTailMoveNumber >= params.currentExpectedMoveNumber),
    );
}

export function isMainBoardSafeForReconnect(params: {
    mainBoardController: GobanController | null;
    currentGame: KibitzWatchedGame | null | undefined;
    currentGameBaseSnapshotTailMoveNumber: number;
    mainBoardOfficialTailMoveNumber: number;
    mainBoardCurrentMoveNumber: number;
    mainBoardLastOfficialMoveNumber: number;
}): boolean {
    const requiredMoveNumber = Math.max(
        params.currentGame?.move_number ?? 0,
        params.currentGameBaseSnapshotTailMoveNumber,
    );

    if (params.currentGame?.live && requiredMoveNumber === 0) {
        return false;
    }

    return Boolean(
        !params.mainBoardController ||
        !params.currentGame?.live ||
        (params.mainBoardOfficialTailMoveNumber >= requiredMoveNumber &&
            params.mainBoardCurrentMoveNumber >= requiredMoveNumber &&
            params.mainBoardLastOfficialMoveNumber >= requiredMoveNumber),
    );
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
const STREAMER_MODE_STORAGE_KEY = "kibitz.desktop.streamer_mode";
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

function moveTreeIdAsNumber(moveTreeId: number | string | null): number | undefined {
    return typeof moveTreeId === "number" ? moveTreeId : undefined;
}

export function isLiveGameMoveNumberKnown(game: KibitzWatchedGame | null | undefined): boolean {
    return typeof game?.move_number === "number" && game.move_number > 0;
}

export function isLiveRootSnapshotAllowed(params: {
    game: KibitzWatchedGame | null | undefined;
    snapshotTailMoveNumber: number;
    source: "visible-main-board" | "game-details";
    fetchedMoveCount?: number | null;
}): boolean {
    const { game, snapshotTailMoveNumber, source, fetchedMoveCount } = params;

    if (!game?.live) {
        return true;
    }

    if (snapshotTailMoveNumber > 0) {
        return true;
    }

    if (source === "game-details" && fetchedMoveCount === 0) {
        return true;
    }

    return false;
}

export function isCurrentGameBaseSnapshotUsable(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    game: KibitzWatchedGame | null | undefined,
    roomId: string | null | undefined,
): snapshot is KibitzCurrentGameBaseSnapshot {
    if (!snapshot || !game) {
        return false;
    }

    if (!roomId || snapshot.roomId !== roomId) {
        return false;
    }

    if (snapshot.gameId !== game.game_id) {
        return false;
    }

    const expectedMoveNumber = game.move_number ?? 0;

    if (
        game.live &&
        expectedMoveNumber === 0 &&
        !isLiveRootSnapshotAllowed({
            game,
            snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
            source: snapshot.source === "main-board" ? "visible-main-board" : "game-details",
            fetchedMoveCount: snapshot.fetchedMoveCount ?? null,
        })
    ) {
        return false;
    }

    return snapshot.trunkTailMoveNumber >= expectedMoveNumber;
}

function currentGameBoardDimensionsOf(game: KibitzWatchedGame | null | undefined): {
    width: number | null;
    height: number | null;
} {
    if (!game?.board_size) {
        return { width: null, height: null };
    }

    const [width, height] = game.board_size.split("x").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height };
    }

    return { width: null, height: null };
}

export async function fetchCurrentGameBaseSnapshot(
    game: KibitzWatchedGame,
    roomId: string | null,
): Promise<KibitzCurrentGameBaseSnapshot | null> {
    const details = (await get(`games/${game.game_id}`)) as KibitzSnapshotGameDetails;
    if (!details?.gamedata?.moves) {
        return null;
    }

    const boardDiv = document.createElement("div");
    boardDiv.setAttribute("aria-hidden", "true");
    boardDiv.style.position = "absolute";
    boardDiv.style.width = "1px";
    boardDiv.style.height = "1px";
    boardDiv.style.overflow = "hidden";
    boardDiv.style.pointerEvents = "none";
    boardDiv.style.opacity = "0";
    boardDiv.style.left = "-10000px";
    boardDiv.style.top = "0";
    let snapshotController: GobanController | null = null;
    const config: GobanRendererConfig & { moves?: GobanConfig["moves"] } = {
        board_div: boardDiv,
        interactive: false,
        connect_to_chat: false,
        width: details.width,
        height: details.height,
        moves: details.gamedata.moves as GobanConfig["moves"],
    };

    try {
        // captureCurrentGameBaseSnapshotFromController rejects controllers whose
        // board element is not in the document, so the div must be attached for
        // the short lifetime of this controller.
        document.body.appendChild(boardDiv);
        snapshotController = new GobanController(config as GobanRendererConfig);
        const fetchedMoveCount = details.gamedata.moves.length;
        const expectedMoveNumber = Math.max(game.move_number ?? 0, details.gamedata.moves.length);
        const snapshot = captureCurrentGameBaseSnapshotFromController(
            snapshotController,
            game,
            roomId,
            "game-details",
            expectedMoveNumber,
        );

        if (!snapshot) {
            const officialTail = getMoveTreeTrunkTail(snapshotController.goban.engine.move_tree);
            logKibitzVariationDebug("current-game-base-snapshot:fetch-not-ready", {
                gameId: game.game_id,
                expectedMoveNumber,
                fetchedMoveCount,
                roomMoveNumber: game.move_number ?? 0,
                officialTailMoveNumber: officialTail?.move_number ?? null,
            });
            return null;
        }

        snapshot.fetchedMoveCount = fetchedMoveCount;
        logKibitzVariationDebug("current-game-base-snapshot:fetch-ready", {
            gameId: snapshot.gameId,
            trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
            moveTreeId: snapshot.moveTreeId,
            fetchedMoveCount,
            roomMoveNumber: game.move_number ?? 0,
        });

        return snapshot;
    } finally {
        try {
            snapshotController?.destroy();
        } catch (error) {
            logKibitzVariationDebug("current-game-base-snapshot:cleanup-error", {
                gameId: game.game_id,
                roomId,
                error,
            });
        }
        boardDiv.remove();
    }
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

function getHorizontalInsetPx(element: HTMLElement | null): number {
    if (!element) {
        return 0;
    }

    const style = window.getComputedStyle(element);
    const paddingLeft = Number.parseFloat(style.paddingLeft ?? "0") || 0;
    const paddingRight = Number.parseFloat(style.paddingRight ?? "0") || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth ?? "0") || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth ?? "0") || 0;

    return Math.max(0, paddingLeft + paddingRight + borderLeft + borderRight);
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
    const isLoggedInUser = isLoggedInKibitzUser(currentUser);
    const canOpenCreateRoomFlow = isLoggedInUser;
    const createRoomSignInHref = `/sign-in#${location.pathname}${location.search}`;
    const [mobileCompanionPanel, setMobileCompanionPanel] =
        React.useState<MobileCompanionPanel>("chat");
    const [mobileCompareController, setMobileCompareController] =
        React.useState<GobanController | null>(null);
    // Lifted from KibitzRoomStage so we can provide it via GobanControllerContext
    // around KibitzSharedStreamPanel — that's how the panel's game pane reads
    // the watched game's chat (off goban.chat_log via the existing context hook)
    // instead of incorrectly trying to join a comm-server Redis channel.
    const [mainBoardController, setMainBoardControllerState] =
        React.useState<GobanController | null>(null);
    const [visibleMainBoardHydration, setVisibleMainBoardHydration] =
        React.useState<VisibleMainBoardHydrationState>(() =>
            createVisibleMainBoardHydrationState({
                roomId: null,
                gameId: null,
                expectedMoveNumber: 0,
            }),
        );
    const mainBoardControllerEpochRef = React.useRef(0);
    const mainBoardControllerContextRef = React.useRef<{
        controller: GobanController;
        epoch: number;
        roomId: string | null;
        gameId: number | null;
    } | null>(null);
    const currentRoomIdRef = React.useRef<string | null>(null);
    const currentRoomGameIdRef = React.useRef<number | null>(null);
    const currentGameMoveNumberRef = React.useRef(0);
    const visibleMainBoardHydrationRef = React.useRef(visibleMainBoardHydration);
    const [currentGameBaseSnapshot, setCurrentGameBaseSnapshot] =
        React.useState<KibitzCurrentGameBaseSnapshot | null>(null);
    const [currentGameBaseSnapshotLoadingGameId, setCurrentGameBaseSnapshotLoadingGameId] =
        React.useState<number | null>(null);
    const currentGameBaseSnapshotRef = React.useRef<KibitzCurrentGameBaseSnapshot | null>(null);
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
    const pendingMobileSplitRatioRef = React.useRef<number | null>(null);
    const mobileSplitRatioRafRef = React.useRef<number | null>(null);
    const lastCommittedMobileSplitRatioRef = React.useRef(mobileSplitRatio);
    const mobileDividerMoveDebugPendingRef = React.useRef<Record<string, unknown> | null>(null);
    const [mobileDividerDragging, setMobileDividerDragging] = React.useState(false);
    const previousMobileDividerDraggingRef = React.useRef(false);
    const [desktopSidebarWidthPx, setDesktopSidebarWidthPx] = React.useState<number | null>(() => {
        const stored = window.localStorage.getItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY);
        const parsed = stored ? Number.parseFloat(stored) : NaN;

        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    });
    const [streamerMode, setStreamerMode] = React.useState(() => {
        if (window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches) {
            return false;
        }

        return window.sessionStorage.getItem(STREAMER_MODE_STORAGE_KEY) === "true";
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
        gestureState: "armed" | "active";
        stableGeometry: StableMobileBoardGeometrySnapshot | null;
        lastAppliedTarget: MobileResizeAppliedTarget | null;
        lastCommittedTarget: MobileResizeAppliedTarget | null;
        legacyDiagnostics: {
            startedAt: number;
            shellWidth: number;
            shellHeight: number;
            outerBoardSlotMaxWidth: number;
            boardSlotMaxWidth: number;
            transientBoardWindowMaxSize: number;
            reservedBoardVerticalSpace: number;
            startWindowWidth: number;
            startWindowHeight: number;
            startLayoutSize: number;
            startWindowSize: number;
            startedAtHorizontalMax: boolean;
            topPaneElement: HTMLDivElement | null;
            boardSlotElement: HTMLDivElement | null;
            boardWindowElement: HTMLElement | null;
            cachedMetricsWidth: number | null;
            cachedMetricsHeight: number | null;
        };
    } | null>(null);
    const activeMobileBoardTransientDragControllerRef = React.useRef<{
        owner: MobileBoardResizeOwner;
        controller: KibitzBoardTransientDragController;
    } | null>(null);
    const lastAppliedMobileResizeTargetRef = React.useRef<MobileResizeAppliedTarget | null>(null);
    const lastCommittedMobileResizeTargetRef = React.useRef<MobileResizeAppliedTarget | null>(null);
    const pendingMobileResizeTargetRef = React.useRef<MobileResizeAppliedTarget | null>(null);
    const stableMobileBoardGeometryRef = React.useRef<StableMobileBoardGeometrySnapshot | null>(
        null,
    );
    const mobileResizeLifecycleStateRef = React.useRef<MobileResizeLifecycleState>("idle");
    const mobileDividerFastVisualLogAtRef = React.useRef(0);
    const mobileBoardSizeRef = React.useRef<number | null>(null);
    const handleMobileBoardTransientDragControllerChange = React.useCallback(
        (owner: MobileBoardResizeOwner, controller: KibitzBoardTransientDragController | null) => {
            if (controller) {
                activeMobileBoardTransientDragControllerRef.current = { owner, controller };
                return;
            }

            if (activeMobileBoardTransientDragControllerRef.current?.owner === owner) {
                activeMobileBoardTransientDragControllerRef.current = null;
            }
        },
        [],
    );
    const getActiveMobileBoardTransientDragController = React.useCallback(
        () => activeMobileBoardTransientDragControllerRef.current?.controller ?? null,
        [],
    );
    const handleMobileBoardSizeChange = React.useCallback((size: number | null) => {
        mobileBoardSizeRef.current = size;
    }, []);
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);
    const handleCachedGamesChanged = React.useCallback(() => {
        setCachedGamesVersion((previous) => previous + 1);
    }, []);

    const measureStableMobileBoardGeometry = React.useCallback(
        (
            source: StableMobileBoardGeometrySnapshot["source"],
        ): StableMobileBoardGeometrySnapshot | null => {
            const shell = mobileShellRef.current;
            const boardHostElement = shell?.querySelector(
                ".Kibitz-mobile-board-host",
            ) as HTMLElement | null;
            const boardSizingSlotElement = shell?.querySelector(
                ".mobile-board-fit-slot",
            ) as HTMLElement | null;
            const boardSurfaceElement = boardSizingSlotElement;
            const gobanContainerElement = shell?.querySelector(
                ".mobile-board-fit-slot .goban-container",
            ) as HTMLElement | null;
            const gobanContentElement = gobanContainerElement?.querySelector(
                ".Goban",
            ) as HTMLElement | null;

            const shellRect = shell?.getBoundingClientRect() ?? null;
            const boardSizingSlotRect = boardSizingSlotElement?.getBoundingClientRect() ?? null;
            const boardSurfaceMeasuredRect = boardSurfaceElement?.getBoundingClientRect() ?? null;
            const gobanContainerRect = gobanContainerElement?.getBoundingClientRect() ?? null;
            const gobanContentRect = gobanContentElement?.getBoundingClientRect() ?? null;
            const boardSizingSlotMetrics =
                boardSizingSlotElement != null
                    ? measureSquareFitLayout(boardSizingSlotElement, true)
                    : null;
            const boardSurfaceRect = boardSurfaceMeasuredRect;
            const gobanContentSize = firstPositiveFinite(
                gobanContentRect?.width ?? null,
                gobanContentRect?.height ?? null,
            );
            const snapshot: StableMobileBoardGeometrySnapshot | null =
                shellRect != null &&
                boardSurfaceRect != null &&
                gobanContainerRect != null &&
                shellRect.width > 0 &&
                shellRect.height > 0 &&
                boardSurfaceRect.width > 0 &&
                boardSurfaceRect.height > 0 &&
                gobanContainerRect.width > 0 &&
                gobanContainerRect.height > 0
                    ? {
                          measuredAt: Date.now(),
                          shell: {
                              shellWidth: shellRect.width,
                              shellHeight: shellRect.height,
                          },
                          boardSizingSlot:
                              boardSizingSlotRect != null
                                  ? {
                                        boardSizingSlotWidth: boardSizingSlotRect.width,
                                        boardSizingSlotHeight: boardSizingSlotRect.height,
                                    }
                                  : undefined,
                          boardSurface: {
                              boardSurfaceWidth: boardSurfaceRect.width,
                              boardSurfaceHeight: boardSurfaceRect.height,
                          },
                          gobanContainer: {
                              gobanContainerWidth: gobanContainerRect.width,
                              gobanContainerHeight: gobanContainerRect.height,
                              gobanContainerSize: Math.min(
                                  gobanContainerRect.width,
                                  gobanContainerRect.height,
                              ),
                          },
                          gobanContent: {
                              gobanContentWidth: firstPositiveFinite(
                                  gobanContentRect?.width ?? null,
                              ),
                              gobanContentHeight: firstPositiveFinite(
                                  gobanContentRect?.height ?? null,
                              ),
                              gobanContentSize,
                              nativeGobanContentSize: gobanContentSize,
                          },
                          divider: {
                              dividerRatio: mobileSplitRatio,
                          },
                          derived: {
                              horizontalInset: Math.max(
                                  0,
                                  Math.round(
                                      ((boardSizingSlotRect?.width ?? shellRect.width) -
                                          (boardSurfaceRect?.width ?? 0)) /
                                          2,
                                  ),
                              ),
                              horizontalInsetPx: Math.max(
                                  0,
                                  Math.round(
                                      ((boardSizingSlotRect?.width ?? shellRect.width) -
                                          (boardSurfaceRect?.width ?? 0)) /
                                          2,
                                  ),
                              ),
                              verticalInsetPx: Math.max(
                                  0,
                                  Math.round(
                                      (boardSizingSlotMetrics?.fallbackHeight ?? 0) -
                                          (boardSizingSlotMetrics?.usableHeight ??
                                              boardSurfaceRect?.height ??
                                              0),
                                  ),
                              ),
                              reservedHeight: Math.max(
                                  0,
                                  boardSizingSlotMetrics?.reservedHeight ?? 0,
                              ),
                              boardVerticalChrome: Math.max(
                                  0,
                                  boardSizingSlotMetrics?.reservedHeight ?? 0,
                              ),
                          },
                          source,
                      }
                    : null;

            if (
                !shouldAcceptStableMobileGeometryMeasurement({
                    lifecycleState: mobileResizeLifecycleStateRef.current,
                    snapshot,
                })
            ) {
                if (isKibitzBoardSizeDebugEnabled() && isKibitzBoardSizeVerboseDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-geometry:stable-measurement-rejected", {
                        reason:
                            mobileResizeLifecycleStateRef.current !== "idle"
                                ? "transient-active"
                                : snapshot == null
                                  ? "missing-rect"
                                  : "zero-size",
                        lifecycleState: mobileResizeLifecycleStateRef.current,
                        hasShell: Boolean(shellRect),
                        hasBoardSizingSlot: Boolean(boardSizingSlotRect),
                        hasBoardSurface: Boolean(boardSurfaceRect),
                        hasGobanContainer: Boolean(gobanContainerRect),
                        hasGobanContent: Boolean(gobanContentRect),
                        boardSurfaceOuterWidth:
                            boardHostElement?.getBoundingClientRect().width ?? null,
                        boardSurfaceOuterHeight:
                            boardHostElement?.getBoundingClientRect().height ?? null,
                        boardSizingSlotMetrics: boardSizingSlotMetrics
                            ? {
                                  reservedHeight: boardSizingSlotMetrics.reservedHeight,
                                  rowGap: boardSizingSlotMetrics.rowGap,
                                  visibleChildrenCount: boardSizingSlotMetrics.visibleChildrenCount,
                                  fallbackHeight: boardSizingSlotMetrics.fallbackHeight,
                                  usableHeight: boardSizingSlotMetrics.usableHeight,
                                  nextSize: boardSizingSlotMetrics.nextSize,
                              }
                            : null,
                    });
                }
                return null;
            }

            stableMobileBoardGeometryRef.current = snapshot;
            if (isKibitzBoardSizeDebugEnabled() && isKibitzBoardSizeVerboseDebugEnabled()) {
                recordKibitzBoardSizeEvent("mobile-geometry:stable-measured", {
                    source,
                    lifecycleState: mobileResizeLifecycleStateRef.current,
                    geometry: snapshot,
                });
            }
            return snapshot;
        },
        [mobileSplitRatio],
    );

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
        lastCommittedMobileSplitRatioRef.current = mobileSplitRatio;
    }, [mobileSplitRatio]);

    React.useLayoutEffect(() => {
        if (!isMobileLayout || mobileDividerDragging) {
            return;
        }

        mobileResizeLifecycleStateRef.current = "idle";
        const snapshot = measureStableMobileBoardGeometry("stable-observer");
        if (!snapshot) {
            return;
        }

        const nativeSizing = getMobileResizeNativeSizingConfig(
            getActiveMobileBoardTransientDragController(),
        );
        const computed = computeMobileBoardGeometry({
            shellWidth: snapshot.shell.shellWidth,
            shellHeight: snapshot.shell.shellHeight,
            dividerRatio: snapshot.divider.dividerRatio,
            boardSizingSlotWidth: snapshot.boardSizingSlot?.boardSizingSlotWidth ?? 0,
            outerBoardSlotWidth: snapshot.boardSizingSlot?.boardSizingSlotWidth ?? 0,
            horizontalInsetPx:
                snapshot.derived.horizontalInsetPx ?? snapshot.derived.horizontalInset,
            squareFitReservedHeight:
                snapshot.derived.reservedHeight ?? snapshot.derived.boardVerticalChrome,
            squareFitExtraReservedHeight: snapshot.derived.verticalInsetPx ?? 0,
            reservedHeight: snapshot.derived.reservedHeight ?? snapshot.derived.boardVerticalChrome,
            verticalInsetPx: snapshot.derived.verticalInsetPx ?? 0,
            devicePixelRatio: window.devicePixelRatio,
        });
        const computedTarget = computeMobileResizeAppliedTarget({
            stableGeometry: snapshot,
            targetDividerRatio: snapshot.divider.dividerRatio,
            ...nativeSizing,
        });
        const comparison = compareMobileGeometryToTarget({
            target: computedTarget,
            actual: snapshot,
        });
        const message = comparison.matched
            ? "mobile-geometry:start-model-match"
            : "mobile-geometry:start-model-mismatch";
        if (isKibitzBoardSizeDebugEnabled() && isKibitzBoardSizeVerboseDebugEnabled()) {
            recordKibitzBoardSizeEvent(message, {
                stable: snapshot,
                computedAtStartRatio: computed,
                deltas: comparison.deltas,
                mismatchType: comparison.mismatchType,
                legacyDiagnostics: {
                    steadyMeasurementUsedAsAuthority: false,
                },
            });
        }

        const committedTarget = lastCommittedMobileResizeTargetRef.current;
        if (
            committedTarget &&
            mobileResizeLifecycleStateRef.current === "idle" &&
            stableMobileBoardGeometryRef.current != null
        ) {
            const postSettleComparison = compareMobileGeometryToTarget({
                target: committedTarget,
                actual: snapshot,
            });
            if (isKibitzBoardSizeDebugEnabled()) {
                recordKibitzBoardSizeEvent(
                    postSettleComparison.matched
                        ? "mobile-geometry:post-settle-match"
                        : "mobile-geometry:post-settle-mismatch",
                    {
                        committedTarget,
                        actualStableGeometry: snapshot,
                        deltas: postSettleComparison.deltas,
                        tolerancePx: 1.5,
                        mismatchType: postSettleComparison.mismatchType,
                    },
                );
            }
            lastCommittedMobileResizeTargetRef.current = null;
        }
    }, [isMobileLayout, measureStableMobileBoardGeometry, mobileDividerDragging]);

    React.useEffect(() => {
        const wasDragging = previousMobileDividerDraggingRef.current;
        if (wasDragging && !mobileDividerDragging) {
            const shell = mobileShellRef.current;
            shell?.classList.remove("mobile-divider-dragging");
            shell?.style.removeProperty("--kibitz-mobile-drag-ratio");
            shell?.style.removeProperty("--kibitz-mobile-drag-board-size");
            recordKibitzBoardSizeEvent("mobile-divider:drag-active-end", {
                mobileDividerDragging,
            });
        }

        previousMobileDividerDraggingRef.current = mobileDividerDragging;
    }, [mobileDividerDragging]);

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

        const commitPendingMobileSplitRatio = (reason: "raf" | "pointerup-flush") => {
            const pending = pendingMobileSplitRatioRef.current;
            pendingMobileSplitRatioRef.current = null;
            mobileDividerMoveDebugPendingRef.current = null;

            if (pending == null) {
                return;
            }

            const previousRatio = lastCommittedMobileSplitRatioRef.current;
            if (
                !shouldCommitMobileSplitRatioUpdate({
                    currentRatio: previousRatio,
                    pendingRatio: pending,
                })
            ) {
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:raf-skip-same-ratio", {
                        reason,
                        previousRatio,
                        pendingRatio: pending,
                    });
                }
                return;
            }

            lastCommittedMobileSplitRatioRef.current = pending;
            recordKibitzBoardSizeEvent("mobile-divider:raf-commit", {
                reason,
                previousRatio,
                nextRatio: pending,
            });
            setMobileSplitRatio(pending);
        };

        const updateTransientDragVisuals = (
            target: MobileResizeAppliedTarget,
        ): MobileResizeAppliedTarget | null => {
            const controller = getActiveMobileBoardTransientDragController();
            const appliedTarget = controller?.applyTransientDragTarget(target) ?? null;

            if (!appliedTarget) {
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:drag-target-not-applied", {
                        reason: controller ? "controller-rejected-target" : "missing-controller",
                        pointerId: mobileDragStateRef.current?.pointerId ?? null,
                        dividerRatio: target.dividerRatio,
                        boardSurfaceWidth: target.boardSurfaceWidth,
                        boardSurfaceHeight: target.boardSurfaceHeight,
                        gobanContainerSize: target.gobanContainer.size,
                        activePreviewContentSize: target.activePreviewContent.size,
                        nativeBackingContentSize:
                            target.activePreviewContent.nativeBackingContentSize ?? null,
                        transformScale: target.activePreviewContent.transformScale ?? null,
                    });
                }

                return null;
            }

            const shell = mobileShellRef.current;
            if (!shell) {
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:drag-target-not-applied", {
                        reason: "missing-shell",
                        pointerId: mobileDragStateRef.current?.pointerId ?? null,
                        dividerRatio: target.dividerRatio,
                        boardSurfaceWidth: target.boardSurfaceWidth,
                        boardSurfaceHeight: target.boardSurfaceHeight,
                        gobanContainerSize: target.gobanContainer.size,
                        activePreviewContentSize: target.activePreviewContent.size,
                        nativeBackingContentSize:
                            target.activePreviewContent.nativeBackingContentSize ?? null,
                        transformScale: target.activePreviewContent.transformScale ?? null,
                    });
                }

                return null;
            }

            shell.style.setProperty(
                "--kibitz-mobile-drag-ratio",
                String(appliedTarget.dividerRatio),
            );
            shell.style.setProperty(
                "--kibitz-mobile-drag-board-size",
                `${appliedTarget.boardSurfaceWidth}px`,
            );

            lastAppliedMobileResizeTargetRef.current = appliedTarget;
            if (isKibitzBoardSizeDebugEnabled() && isKibitzBoardSizeVerboseDebugEnabled()) {
                recordKibitzBoardSizeEvent("mobile-divider:drag-target-applied", {
                    pointerId: mobileDragStateRef.current?.pointerId ?? null,
                    dividerRatio: appliedTarget.dividerRatio,
                    geometry: {
                        boardSurface: {
                            boardSurfaceWidth: appliedTarget.boardSurfaceWidth,
                            boardSurfaceHeight: appliedTarget.boardSurfaceHeight,
                        },
                        gobanContainer: {
                            gobanContainerWidth: appliedTarget.gobanContainerWidth,
                            gobanContainerHeight: appliedTarget.gobanContainerHeight,
                        },
                        gobanContent: {
                            previewGobanContentSize: appliedTarget.previewGobanContentSize,
                            predictedNativeGobanContentSize:
                                appliedTarget.predictedNativeGobanContentSize,
                        },
                    },
                    legacyDiagnostics: {
                        visualSize: appliedTarget.legacyVisualSize,
                        usingRestingMaxGeometry: appliedTarget.usingRestingMaxGeometry,
                    },
                });
            }

            const now = Date.now();
            if (
                isKibitzBoardSizeDebugEnabled() &&
                now - mobileDividerFastVisualLogAtRef.current >= 120
            ) {
                mobileDividerFastVisualLogAtRef.current = now;
                const dragState = mobileDragStateRef.current;
                const legacyDiagnostics = dragState?.legacyDiagnostics ?? null;
                recordKibitzBoardSizeEvent("mobile-divider:drag-fast-visual-size", {
                    pointerId: dragState?.pointerId ?? null,
                    nextRatio: target.dividerRatio,
                    visualBoardSize: target.boardSurfaceWidth,
                    usingRestingMaxGeometry: target.usingRestingMaxGeometry,
                    heightLimitedSize: target.boardSurfaceHeight,
                    transientBoardWindowMaxSize:
                        legacyDiagnostics?.transientBoardWindowMaxSize ?? null,
                    outerBoardSlotMaxWidth: legacyDiagnostics?.outerBoardSlotMaxWidth ?? null,
                    boardSlotMaxWidth: legacyDiagnostics?.boardSlotMaxWidth ?? null,
                    reservedBoardVerticalSpace:
                        legacyDiagnostics?.reservedBoardVerticalSpace ?? null,
                    startWindowWidth: legacyDiagnostics?.startWindowWidth ?? null,
                    startWindowHeight: legacyDiagnostics?.startWindowHeight ?? null,
                    startLayoutSize: legacyDiagnostics?.startLayoutSize ?? null,
                    startWindowSize: legacyDiagnostics?.startWindowSize ?? null,
                    cachedMetricsWidth: legacyDiagnostics?.cachedMetricsWidth ?? null,
                    cachedMetricsHeight: legacyDiagnostics?.cachedMetricsHeight ?? null,
                    geometry: buildMobileResizeGeometrySnapshot({
                        shellRect:
                            legacyDiagnostics?.shellWidth != null &&
                            legacyDiagnostics.shellHeight != null
                                ? {
                                      width: legacyDiagnostics.shellWidth,
                                      height: legacyDiagnostics.shellHeight,
                                  }
                                : null,
                        boardSizingSlotRect: legacyDiagnostics?.boardSlotElement
                            ? legacyDiagnostics.boardSlotElement.getBoundingClientRect()
                            : null,
                        boardSurfaceRect: {
                            width: target.boardSurfaceWidth,
                            height: target.boardSurfaceHeight,
                        },
                        gobanContainerRect: {
                            width: target.gobanContainerWidth,
                            height: target.gobanContainerHeight,
                        },
                        gobanMetrics:
                            legacyDiagnostics?.cachedMetricsWidth != null &&
                            legacyDiagnostics.cachedMetricsHeight != null
                                ? {
                                      width: legacyDiagnostics.cachedMetricsWidth,
                                      height: legacyDiagnostics.cachedMetricsHeight,
                                  }
                                : null,
                        dividerRatio: target.dividerRatio,
                        startDividerRatio: dragState?.startRatio ?? null,
                        targetDividerRatio: target.dividerRatio,
                    }),
                });
            }

            return appliedTarget;
        };

        const measureSteadyMobileBoardSize = () => {
            const boardSlotElement =
                mobileDragStateRef.current?.legacyDiagnostics.boardSlotElement ?? null;
            const metrics = boardSlotElement
                ? measureSquareFitLayout(boardSlotElement, true)
                : null;
            return {
                metrics,
                steadyMeasuredSize: metrics?.nextSize ?? null,
            };
        };

        const onPointerMove = (event: PointerEvent) => {
            const dragState = mobileDragStateRef.current;

            if (!dragState) {
                return;
            }

            const legacyDiagnostics = dragState.legacyDiagnostics;

            const deltaY = event.clientY - dragState.startY;
            if (dragState.gestureState !== "active") {
                if (!shouldActivateMobileDividerDrag(deltaY)) {
                    if (isKibitzBoardSizeDebugEnabled() && isKibitzBoardSizeVerboseDebugEnabled()) {
                        recordKibitzBoardSizeEvent("mobile-divider:armed-move-ignored", {
                            pointerId: event.pointerId,
                            deltaY,
                            thresholdPx: MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX,
                            gestureState: "armed",
                        });
                    }
                    event.preventDefault();
                    return;
                }

                const targetDividerRatio = clampMobileSplitRatio(
                    dragState.startRatio + deltaY / legacyDiagnostics.shellHeight,
                );
                const stableGeometry =
                    dragState.stableGeometry ?? stableMobileBoardGeometryRef.current ?? null;
                if (!stableGeometry) {
                    event.preventDefault();
                    return;
                }

                const controller = getActiveMobileBoardTransientDragController();
                const currentMetrics = controller?.measureCurrentGobanMetrics() ?? null;
                const baselineGobanContentSize = resolveMobileResizeBaselineGobanContentSize({
                    stableGeometry,
                    currentMetricsWidth: currentMetrics?.width ?? null,
                    currentMetricsHeight: currentMetrics?.height ?? null,
                });
                if (!baselineGobanContentSize || baselineGobanContentSize <= 0) {
                    if (isKibitzBoardSizeDebugEnabled()) {
                        recordKibitzBoardSizeEvent(
                            "mobile-geometry:stable-missing-content-metric",
                            {
                                pointerId: event.pointerId,
                                gestureState: "armed",
                                targetDividerRatio,
                                stableGeometry,
                                currentMetrics,
                            },
                        );
                    }
                    event.preventDefault();
                    return;
                }

                const nativeSizing = getMobileResizeNativeSizingConfig(controller);
                const target = computeMobileResizeAppliedTarget({
                    stableGeometry,
                    targetDividerRatio,
                    ...nativeSizing,
                    baselineGobanContentSize,
                });
                if (!target) {
                    if (isKibitzBoardSizeDebugEnabled()) {
                        recordKibitzBoardSizeEvent(
                            "mobile-geometry:stable-missing-content-metric",
                            {
                                pointerId: event.pointerId,
                                gestureState: "armed",
                                targetDividerRatio,
                                stableGeometry,
                                currentMetrics,
                                reason: "target-computation-failed",
                            },
                        );
                    }
                    event.preventDefault();
                    return;
                }

                const beginResult = controller?.beginTransientDrag(
                    legacyDiagnostics.transientBoardWindowMaxSize,
                ) ?? {
                    metricsWidth: null,
                    metricsHeight: null,
                };
                dragState.gestureState = "active";
                mobileResizeLifecycleStateRef.current = "active";
                legacyDiagnostics.cachedMetricsWidth = beginResult.metricsWidth;
                legacyDiagnostics.cachedMetricsHeight = beginResult.metricsHeight;
                setMobileDividerDragging(true);
                const shell = mobileShellRef.current;
                shell?.classList.add("mobile-divider-dragging");
                mobileDividerFastVisualLogAtRef.current = 0;
                pendingMobileSplitRatioRef.current = targetDividerRatio;
                pendingMobileResizeTargetRef.current = target;
                updateTransientDragVisuals(target);
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:drag-active-start", {
                        pointerId: event.pointerId,
                        deltaY,
                        thresholdPx: MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX,
                        startDividerRatio: dragState.startRatio,
                        targetDividerRatio,
                        activeMobileBoardOwner:
                            activeMobileBoardTransientDragControllerRef.current?.owner ?? null,
                        hasActiveMobileBoardTransientController: Boolean(
                            activeMobileBoardTransientDragControllerRef.current?.controller,
                        ),
                        gestureState: "active",
                        geometry: buildMobileResizeGeometrySnapshot({
                            shellRect:
                                legacyDiagnostics.shellWidth != null &&
                                legacyDiagnostics.shellHeight != null
                                    ? {
                                          width: legacyDiagnostics.shellWidth,
                                          height: legacyDiagnostics.shellHeight,
                                      }
                                    : null,
                            boardSizingSlotRect: legacyDiagnostics.boardSlotElement
                                ? legacyDiagnostics.boardSlotElement.getBoundingClientRect()
                                : null,
                            boardSurfaceRect:
                                target.boardSurfaceWidth != null &&
                                target.boardSurfaceHeight != null
                                    ? {
                                          width: target.boardSurfaceWidth,
                                          height: target.boardSurfaceHeight,
                                      }
                                    : null,
                            gobanContainerRect:
                                target.gobanContainerWidth != null &&
                                target.gobanContainerHeight != null
                                    ? {
                                          width: target.gobanContainerWidth,
                                          height: target.gobanContainerHeight,
                                      }
                                    : null,
                            gobanMetrics:
                                beginResult.metricsWidth != null &&
                                beginResult.metricsHeight != null
                                    ? {
                                          width: beginResult.metricsWidth,
                                          height: beginResult.metricsHeight,
                                      }
                                    : null,
                            dividerRatio: dragState.startRatio,
                            startDividerRatio: dragState.startRatio,
                            targetDividerRatio,
                        }),
                    });
                }
            }

            const ratioDelta = deltaY / legacyDiagnostics.shellHeight;
            const nextRatio = clampMobileSplitRatio(dragState.startRatio + ratioDelta);
            const previousPending =
                pendingMobileSplitRatioRef.current ?? lastCommittedMobileSplitRatioRef.current;
            const stableGeometry =
                dragState.stableGeometry ?? stableMobileBoardGeometryRef.current ?? null;
            if (!stableGeometry) {
                event.preventDefault();
                return;
            }
            const controller = getActiveMobileBoardTransientDragController();
            const currentMetrics = controller?.measureCurrentGobanMetrics() ?? null;
            const nativeSizing = getMobileResizeNativeSizingConfig(controller);
            const target = computeMobileResizeAppliedTarget({
                stableGeometry,
                targetDividerRatio: nextRatio,
                ...nativeSizing,
                baselineGobanContentSize: resolveMobileResizeBaselineGobanContentSize({
                    stableGeometry,
                    currentMetricsWidth: currentMetrics?.width ?? null,
                    currentMetricsHeight: currentMetrics?.height ?? null,
                }),
            });
            if (!target) {
                event.preventDefault();
                return;
            }
            if (
                !shouldCommitMobileSplitRatioUpdate({
                    currentRatio: previousPending,
                    pendingRatio: nextRatio,
                })
            ) {
                pendingMobileSplitRatioRef.current = nextRatio;
                pendingMobileResizeTargetRef.current = target;
                const reappliedTarget = updateTransientDragVisuals(target);
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:raf-reapply-same-ratio", {
                        reason: "same-ratio-active-correction",
                        pointerId: event.pointerId,
                        previousRatio: previousPending,
                        pendingRatio: nextRatio,
                        applied: reappliedTarget != null,
                        boardSurfaceWidth: target.boardSurfaceWidth,
                        boardSurfaceHeight: target.boardSurfaceHeight,
                        gobanContainerSize: target.gobanContainer.size,
                        activePreviewContentSize: target.activePreviewContent.size,
                        nativeBackingContentSize:
                            target.activePreviewContent.nativeBackingContentSize ?? null,
                        transformScale: target.activePreviewContent.transformScale ?? null,
                    });
                }
                event.preventDefault();
                return;
            }

            if (isKibitzBoardSizeDebugEnabled()) {
                mobileDividerMoveDebugPendingRef.current = {
                    pointerId: event.pointerId,
                    clientY: event.clientY,
                    startY: dragState.startY,
                    shellRectHeight: legacyDiagnostics.shellHeight,
                    rawRatioDelta: ratioDelta,
                    nextRatio,
                    previousRatio: previousPending,
                    visualBoardSize: target.boardSurfaceWidth,
                };
            }

            pendingMobileSplitRatioRef.current = nextRatio;
            pendingMobileResizeTargetRef.current = target;
            updateTransientDragVisuals(target);

            if (mobileSplitRatioRafRef.current === null) {
                mobileSplitRatioRafRef.current = window.requestAnimationFrame(() => {
                    mobileSplitRatioRafRef.current = null;
                    const pendingTarget = pendingMobileResizeTargetRef.current;
                    if (!pendingTarget) {
                        return;
                    }
                    updateTransientDragVisuals(pendingTarget);
                    const details = mobileDividerMoveDebugPendingRef.current;
                    mobileDividerMoveDebugPendingRef.current = null;
                    if (details) {
                        recordKibitzBoardSizeEvent("mobile-divider:move", details);
                    }
                    commitPendingMobileSplitRatio("raf");
                });
            }
            event.preventDefault();
        };

        const onPointerUp = (event: PointerEvent) => {
            const dragState = mobileDragStateRef.current;
            if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
            }

            const legacyDiagnostics = dragState.legacyDiagnostics;

            if (mobileDividerRef.current?.hasPointerCapture?.(event.pointerId)) {
                mobileDividerRef.current.releasePointerCapture(event.pointerId);
            }

            if (mobileSplitRatioRafRef.current !== null) {
                window.cancelAnimationFrame(mobileSplitRatioRafRef.current);
                mobileSplitRatioRafRef.current = null;
            }

            if (isMobileDividerPointerUpNoop(dragState.gestureState)) {
                mobileDragStateRef.current = null;
                lastAppliedMobileResizeTargetRef.current = null;
                pendingMobileResizeTargetRef.current = null;
                mobileResizeLifecycleStateRef.current = "idle";
                pendingMobileSplitRatioRef.current = null;
                mobileDividerMoveDebugPendingRef.current = null;
                mobileDividerFastVisualLogAtRef.current = 0;
                document.body.style.userSelect = "";
                document.body.style.cursor = "";
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:pointer-up-noop", {
                        pointerId: event.pointerId,
                        startDividerRatio: dragState.startRatio,
                        finalDividerRatio: dragState.startRatio,
                        gestureState: "armed",
                        reason: "no-active-drag",
                        geometry: buildMobileResizeGeometrySnapshot({
                            shellRect:
                                legacyDiagnostics.shellWidth != null &&
                                legacyDiagnostics.shellHeight != null
                                    ? {
                                          width: legacyDiagnostics.shellWidth,
                                          height: legacyDiagnostics.shellHeight,
                                      }
                                    : null,
                            boardSizingSlotRect: legacyDiagnostics.boardSlotElement
                                ? legacyDiagnostics.boardSlotElement.getBoundingClientRect()
                                : null,
                            boardSurfaceRect:
                                legacyDiagnostics.startWindowWidth != null &&
                                legacyDiagnostics.startWindowHeight != null
                                    ? {
                                          width: legacyDiagnostics.startWindowWidth,
                                          height: legacyDiagnostics.startWindowHeight,
                                      }
                                    : null,
                            gobanContainerRect:
                                legacyDiagnostics.startWindowSize != null
                                    ? {
                                          width: legacyDiagnostics.startWindowSize,
                                          height: legacyDiagnostics.startWindowSize,
                                      }
                                    : null,
                            gobanMetrics:
                                legacyDiagnostics.cachedMetricsWidth != null &&
                                legacyDiagnostics.cachedMetricsHeight != null
                                    ? {
                                          width: legacyDiagnostics.cachedMetricsWidth,
                                          height: legacyDiagnostics.cachedMetricsHeight,
                                      }
                                    : null,
                            dividerRatio: dragState.startRatio,
                            startDividerRatio: dragState.startRatio,
                        }),
                    });
                    recordKibitzBoardSizeEvent("mobile-resize:noop-summary", {
                        pointerId: event.pointerId,
                        reason: "no-active-drag",
                        startDividerRatio: dragState.startRatio,
                    });
                }
                return;
            }

            const appliedTarget = lastAppliedMobileResizeTargetRef.current;
            if (!appliedTarget) {
                mobileDragStateRef.current = null;
                lastAppliedMobileResizeTargetRef.current = null;
                pendingMobileResizeTargetRef.current = null;
                pendingMobileSplitRatioRef.current = null;
                mobileDividerMoveDebugPendingRef.current = null;
                mobileDividerFastVisualLogAtRef.current = 0;
                document.body.style.userSelect = "";
                document.body.style.cursor = "";
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("mobile-divider:pointer-up-missing-target", {
                        pointerId: event.pointerId,
                        hadActiveDrag: true,
                        activeMobileBoardOwner:
                            activeMobileBoardTransientDragControllerRef.current?.owner ?? null,
                        hasActiveMobileBoardTransientController: Boolean(
                            activeMobileBoardTransientDragControllerRef.current?.controller,
                        ),
                        reason: "missing-last-applied-target",
                    });
                }
                stopDrag();
                return;
            }

            const steadyMeasurement = measureSteadyMobileBoardSize();
            if (
                isKibitzBoardSizeDebugEnabled() &&
                isKibitzBoardSizeVerboseDebugEnabled() &&
                steadyMeasurement
            ) {
                recordKibitzBoardSizeEvent("mobile-divider:release-measurement-diagnostic", {
                    pointerId: event.pointerId,
                    usedAsAuthority: false,
                    legacyDiagnostics: {
                        steadyMeasuredSize: steadyMeasurement.steadyMeasuredSize,
                        targetBoardSurfaceWidth: appliedTarget.boardSurfaceWidth,
                        targetBoardSurfaceHeight: appliedTarget.boardSurfaceHeight,
                        deltaWidth:
                            (steadyMeasurement.steadyMeasuredSize ?? 0) -
                            appliedTarget.boardSurfaceWidth,
                    },
                });
            }

            if (isKibitzBoardSizeDebugEnabled()) {
                recordKibitzBoardSizeEvent("mobile-divider:pointer-up-commit-target", {
                    pointerId: event.pointerId,
                    dividerRatio: appliedTarget.dividerRatio,
                    source: "last-applied-target",
                    activeMobileBoardOwner:
                        activeMobileBoardTransientDragControllerRef.current?.owner ?? null,
                    hasActiveMobileBoardTransientController: Boolean(
                        activeMobileBoardTransientDragControllerRef.current?.controller,
                    ),
                    geometry: {
                        boardSurface: {
                            boardSurfaceWidth: appliedTarget.boardSurfaceWidth,
                            boardSurfaceHeight: appliedTarget.boardSurfaceHeight,
                        },
                        gobanContainer: {
                            gobanContainerWidth: appliedTarget.gobanContainerWidth,
                            gobanContainerHeight: appliedTarget.gobanContainerHeight,
                        },
                        gobanContent: {
                            previewGobanContentSize: appliedTarget.previewGobanContentSize,
                            predictedNativeGobanContentSize:
                                appliedTarget.predictedNativeGobanContentSize ?? null,
                        },
                    },
                });
            }
            commitPendingMobileSplitRatio("pointerup-flush");
            getActiveMobileBoardTransientDragController()?.finishTransientDragFromAppliedTarget(
                appliedTarget,
            );
            lastCommittedMobileResizeTargetRef.current = appliedTarget;
            lastAppliedMobileResizeTargetRef.current = null;
            pendingMobileResizeTargetRef.current = null;
            mobileResizeLifecycleStateRef.current = "idle";
            setMobileDividerDragging(false);
            stopDrag();
            if (isKibitzBoardSizeDebugEnabled()) {
                recordKibitzBoardSizeEvent("mobile-divider:pointer-up", {
                    pointerId: event.pointerId,
                    finalRatio: appliedTarget.dividerRatio,
                    gestureState: "active",
                    hadActiveDrag: true,
                });
                recordKibitzBoardSizeEvent("mobile-resize:summary", {
                    pointerId: event.pointerId,
                    startedAt: legacyDiagnostics.startedAt,
                    endedAt: Date.now(),
                    durationMs: Date.now() - legacyDiagnostics.startedAt,
                    startDividerRatio: dragState.startRatio,
                    committedDividerRatio: appliedTarget.dividerRatio,
                    startGeometry: {
                        boardSurfaceWidth: legacyDiagnostics.startWindowWidth,
                        boardSurfaceHeight: legacyDiagnostics.startWindowHeight,
                        gobanContainerSize: legacyDiagnostics.startWindowSize,
                        gobanContentSize: legacyDiagnostics.cachedMetricsWidth,
                    },
                    finalTarget: {
                        boardSurfaceWidth: appliedTarget.boardSurfaceWidth,
                        boardSurfaceHeight: appliedTarget.boardSurfaceHeight,
                        gobanContainerSize: appliedTarget.gobanContainerWidth,
                        predictedNativeGobanContentSize:
                            appliedTarget.predictedNativeGobanContentSize,
                    },
                    postSettle: {
                        matched: null,
                        maxDeltaPx: null,
                        verified: false,
                    },
                    invariantViolations: [],
                });
            }
        };

        window.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        return () => {
            if (mobileSplitRatioRafRef.current !== null) {
                window.cancelAnimationFrame(mobileSplitRatioRafRef.current);
                mobileSplitRatioRafRef.current = null;
            }
            pendingMobileSplitRatioRef.current = null;
            pendingMobileResizeTargetRef.current = null;
            mobileDividerMoveDebugPendingRef.current = null;
            mobileDividerFastVisualLogAtRef.current = 0;
            lastAppliedMobileResizeTargetRef.current = null;
            setMobileDividerDragging(false);
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
    const currentGameMoveNumber = resolvedRoom?.current_game?.move_number ?? 0;
    const currentGameBoardDimensions = React.useMemo(
        () => currentGameBoardDimensionsOf(resolvedRoom?.current_game),
        [resolvedRoom?.current_game?.board_size],
    );
    const currentGameWidth = currentGameBoardDimensions.width;
    const currentGameHeight = currentGameBoardDimensions.height;
    const currentGameSnapshotTarget = React.useMemo(() => {
        const game = resolvedRoom?.current_game;

        if (!resolvedRoom?.id || !game || currentGameId == null) {
            return null;
        }

        return {
            roomId: resolvedRoom.id,
            game,
            gameId: currentGameId,
            moveNumber: currentGameMoveNumber,
            width: currentGameWidth,
            height: currentGameHeight,
        };
    }, [
        currentGameHeight,
        currentGameId,
        currentGameMoveNumber,
        currentGameWidth,
        resolvedRoom?.id,
        resolvedRoom?.current_game?.board_size,
        resolvedRoom?.current_game?.game_id,
        resolvedRoom?.current_game?.move_number,
    ]);
    // Synced during render so the refs hold the live room/game before any
    // child mount effect fires. Child boards register via setMainBoardController
    // from their own mount effects (which run before this component's effects),
    // and that registration captures these refs into the controller context.
    // Updating in useEffect would leave the refs null at registration time,
    // permanently mismatching every isCurrentMainBoardController check.
    currentRoomIdRef.current = resolvedRoom?.id ?? null;
    currentRoomGameIdRef.current = currentGameId;
    currentGameMoveNumberRef.current = currentGameMoveNumber;

    React.useEffect(() => {
        visibleMainBoardHydrationRef.current = visibleMainBoardHydration;
    }, [visibleMainBoardHydration]);

    React.useEffect(() => {
        setVisibleMainBoardHydration(
            createVisibleMainBoardHydrationState({
                roomId: resolvedRoom?.id ?? null,
                gameId: currentGameId,
                expectedMoveNumber: currentGameMoveNumberRef.current,
            }),
        );
    }, [currentGameId, resolvedRoom?.id]);

    const setMainBoardController = React.useCallback((controller: GobanController | null) => {
        mainBoardControllerEpochRef.current += 1;
        mainBoardControllerContextRef.current = controller
            ? {
                  controller,
                  epoch: mainBoardControllerEpochRef.current,
                  roomId: currentRoomIdRef.current,
                  gameId: currentRoomGameIdRef.current,
              }
            : null;
        setMainBoardControllerState(controller);
        if (!controller) {
            setVisibleMainBoardHydration(
                createVisibleMainBoardHydrationState({
                    roomId: currentRoomIdRef.current,
                    gameId: currentRoomGameIdRef.current,
                    expectedMoveNumber: currentGameMoveNumberRef.current,
                }),
            );
        }
    }, []);
    const isCurrentMainBoardController = React.useCallback(
        (controller: GobanController | null | undefined) => {
            const context = mainBoardControllerContextRef.current;
            return Boolean(
                controller &&
                context &&
                context.controller === controller &&
                context.epoch === mainBoardControllerEpochRef.current &&
                context.roomId === currentRoomIdRef.current &&
                context.gameId === currentRoomGameIdRef.current &&
                controller.goban.parent?.isConnected,
            );
        },
        [],
    );
    const handleMainBoardHydrationChange = React.useCallback(
        (state: {
            roomId: string;
            gameId: number | null;
            officialTailMoveNumber: number;
            expectedMoveNumber: number;
            hasMoveTree: boolean;
            hydrated: boolean;
        }) => {
            setVisibleMainBoardHydration((previous) =>
                applyVisibleMainBoardHydrationReport(
                    previous,
                    state,
                    currentRoomIdRef.current,
                    currentRoomGameIdRef.current,
                ),
            );
        },
        [],
    );
    const roomLiveMoveNumber = resolvedRoom?.current_game?.move_number ?? 0;
    const mobileCompareActive = Boolean(isMobileLayout && mobileCompanionPanel === "compare");
    const mainBoardControllerFresh = Boolean(
        mainBoardController && isCurrentMainBoardController(mainBoardController),
    );
    const currentExpectedMoveNumber = resolvedRoom?.current_game?.move_number ?? 0;
    const currentGameIsLive = Boolean(resolvedRoom?.current_game?.live);
    const visibleMainBoardMounted = isVisibleMainBoardMounted({
        mobileCompareActive,
        mainBoardController,
        isCurrentMainBoardController: mainBoardControllerFresh,
        visibleMainBoardHydration,
        roomId: resolvedRoom?.id ?? null,
        gameId: currentGameId,
        currentExpectedMoveNumber,
        isCurrentGameLive: currentGameIsLive,
    });
    const currentGameBaseSnapshotFreshnessMoveNumber = React.useMemo(() => {
        const liveTailFromRoom = resolvedRoom?.current_game?.move_number ?? 0;
        const cachedSnapshotTail =
            currentGameBaseSnapshot?.gameId === currentGameId &&
            currentGameBaseSnapshot?.roomId === resolvedRoom?.id
                ? currentGameBaseSnapshot.trunkTailMoveNumber
                : 0;

        return Math.max(liveTailFromRoom, cachedSnapshotTail);
    }, [
        currentGameBaseSnapshot?.gameId,
        currentGameBaseSnapshot?.trunkTailMoveNumber,
        currentGameBaseSnapshot?.roomId,
        currentGameId,
        resolvedRoom?.id,
        resolvedRoom?.current_game?.move_number,
    ]);
    const pickerOpen = Boolean(
        pickerMode || mobileOverlayMode === "create-room" || mobileOverlayMode === "change-board",
    );
    const mainBoardOfficialTailMoveNumber = mainBoardController
        ? (getMoveTreeTrunkTail(mainBoardController.goban.engine.move_tree)?.move_number ?? 0)
        : 0;
    const mainBoardCurrentMoveNumber = mainBoardController
        ? (mainBoardController.goban.engine.cur_move?.move_number ?? 0)
        : 0;
    const mainBoardLastOfficialMoveNumber = mainBoardController
        ? (mainBoardController.goban.engine.last_official_move?.move_number ?? 0)
        : 0;
    const mainBoardSafeForReconnect = isMainBoardSafeForReconnect({
        mainBoardController,
        currentGame: resolvedRoom?.current_game,
        currentGameBaseSnapshotTailMoveNumber: currentGameBaseSnapshot?.trunkTailMoveNumber ?? 0,
        mainBoardOfficialTailMoveNumber,
        mainBoardCurrentMoveNumber,
        mainBoardLastOfficialMoveNumber,
    });

    useKibitzCurrentGameConnectionKeeper({
        roomId: resolvedRoom?.id ?? null,
        currentGameId,
        currentLiveTailMoveNumber: roomLiveMoveNumber,
        isLive: currentGameIsLive,
        pickerOpen,
        enabled: Boolean(resolvedRoom),
        debugSource: "KibitzInner",
        boardController: mainBoardController,
        allowReconnect: mainBoardSafeForReconnect,
    });
    const acceptCurrentGameBaseSnapshot = React.useCallback(
        (snapshot: KibitzCurrentGameBaseSnapshot) => {
            const currentRoomId = currentRoomIdRef.current;
            const currentRoomGameId = currentRoomGameIdRef.current;
            if (
                currentRoomId == null ||
                currentRoomGameId == null ||
                snapshot.roomId !== currentRoomId ||
                snapshot.gameId !== currentRoomGameId
            ) {
                logKibitzVariationDebug("current-game-base-snapshot:stale-rejected", {
                    snapshotGameId: snapshot.gameId,
                    snapshotSource: snapshot.source,
                    snapshotRoomId: snapshot.roomId ?? null,
                    currentRoomId,
                    currentRoomGameId,
                });
                return;
            }

            setCurrentGameBaseSnapshot((previous) =>
                chooseFresherCurrentGameBaseSnapshot(previous, snapshot),
            );
        },
        [],
    );
    useKibitzCurrentGameBaseBroker({
        enabled:
            isMobileLayout &&
            Boolean(resolvedRoom?.current_game?.game_id) &&
            !visibleMainBoardMounted,
        roomId: resolvedRoom?.id ?? null,
        game: resolvedRoom?.current_game ?? null,
        currentSnapshotFreshnessMoveNumber: currentGameBaseSnapshotFreshnessMoveNumber,
        visibleMainBoardMounted,
        onSnapshot: acceptCurrentGameBaseSnapshot,
    });
    React.useEffect(() => {
        setCurrentGameBaseSnapshot((previous) =>
            previous?.gameId === currentGameId && previous?.roomId === resolvedRoom?.id
                ? previous
                : null,
        );
    }, [currentGameId, resolvedRoom?.id]);

    React.useEffect(() => {
        const game = resolvedRoom?.current_game;
        if (!game || !mainBoardController || !isCurrentMainBoardController(mainBoardController)) {
            return;
        }

        const goban = mainBoardController.goban;
        let disposed = false;
        const roomIdAtStart = resolvedRoom.id;
        const gameIdAtStart = game.game_id;

        const syncSnapshotFromMainBoard = (reason: string) => {
            if (
                disposed ||
                !isCurrentMainBoardController(mainBoardController) ||
                currentRoomIdRef.current !== roomIdAtStart ||
                currentRoomGameIdRef.current !== gameIdAtStart
            ) {
                return;
            }

            const snapshot = captureCurrentGameBaseSnapshotFromController(
                mainBoardController,
                game,
                resolvedRoom.id,
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

            if (game.live && (game.move_number ?? 0) === 0 && snapshot.trunkTailMoveNumber === 0) {
                logKibitzVariationDebug("current-game-base-snapshot:main-root-live-rejected", {
                    reason,
                    gameId: game.game_id,
                    roomMoveNumber: game.move_number ?? 0,
                    snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    moveTreeId: snapshot.moveTreeId,
                });
                return;
            }

            logKibitzVariationDebug("current-game-base-snapshot:main-ready", {
                reason,
                gameId: snapshot.gameId,
                trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
                moveTreeId: snapshot.moveTreeId,
            });
            acceptCurrentGameBaseSnapshot(snapshot);
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
    }, [isCurrentMainBoardController, mainBoardController, resolvedRoom]);

    React.useEffect(() => {
        currentGameBaseSnapshotRef.current = currentGameBaseSnapshot;
    }, [currentGameBaseSnapshot]);

    React.useEffect(() => {
        const target = currentGameSnapshotTarget;
        const existingSnapshotForLog: KibitzCurrentGameBaseSnapshot | null =
            currentGameBaseSnapshotRef.current;

        if (!target) {
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        const existingSnapshotTailMoveNumber = existingSnapshotForLog?.trunkTailMoveNumber ?? 0;
        const rootLiveSnapshotRejected =
            existingSnapshotForLog?.gameId === target.gameId &&
            target.game.live &&
            target.moveNumber === 0 &&
            existingSnapshotTailMoveNumber === 0;

        if (rootLiveSnapshotRejected) {
            logKibitzVariationDebug(
                "current-game-base-snapshot:fetch-root-live-main-snapshot-rejected",
                {
                    roomId: target.roomId,
                    gameId: target.gameId,
                    roomMoveNumber: target.moveNumber,
                    snapshotTailMoveNumber: existingSnapshotTailMoveNumber,
                    moveTreeId: existingSnapshotForLog?.moveTreeId ?? null,
                },
            );
        }

        const existingSnapshotUsable = isCurrentGameBaseSnapshotUsable(
            existingSnapshotForLog,
            target.game,
            target.roomId,
        );

        if (existingSnapshotUsable && existingSnapshotForLog) {
            logKibitzVariationDebug("current-game-base-snapshot:fetch-skip-already-fresh", {
                roomId: target.roomId,
                gameId: target.gameId,
                expectedMoveNumber: target.moveNumber,
                snapshotTailMoveNumber: existingSnapshotForLog.trunkTailMoveNumber,
                moveTreeId: existingSnapshotForLog.moveTreeId,
            });
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        const game = target.game;
        if (!game) {
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        let cancelled = false;
        const roomIdAtStart = target.roomId;
        setCurrentGameBaseSnapshotLoadingGameId(target.gameId);

        void fetchCurrentGameBaseSnapshot(game, target.roomId)
            .then((snapshot) => {
                if (cancelled || currentRoomIdRef.current !== roomIdAtStart) {
                    return;
                }

                if (snapshot) {
                    acceptCurrentGameBaseSnapshot(snapshot);
                }
            })
            .catch((error) => {
                if (!cancelled && currentRoomIdRef.current === roomIdAtStart) {
                    logKibitzVariationDebug("current-game-base-snapshot:fetch-failed", {
                        gameId: target.gameId,
                        error,
                    });
                }
            })
            .finally(() => {
                if (!cancelled && currentRoomIdRef.current === roomIdAtStart) {
                    setCurrentGameBaseSnapshotLoadingGameId((loadingGameId) =>
                        loadingGameId === target.gameId ? null : loadingGameId,
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [acceptCurrentGameBaseSnapshot, currentGameSnapshotTarget]);

    const getCurrentGameBaseSnapshotForVariation = React.useCallback(
        (reason: string): KibitzCurrentGameBaseSnapshot | null => {
            const game = resolvedRoom?.current_game;
            if (!game) {
                return null;
            }

            const cachedSnapshot = currentGameBaseSnapshot;
            const cachedSnapshotForLog: KibitzCurrentGameBaseSnapshot | null =
                currentGameBaseSnapshot;
            const controllerContext = mainBoardControllerContextRef.current;
            const mainBoardControllerFresh = isCurrentMainBoardController(mainBoardController);
            const cachedSnapshotUsable = isCurrentGameBaseSnapshotUsable(
                cachedSnapshot,
                game,
                resolvedRoom.id,
            );

            if (mainBoardControllerFresh) {
                const mainBoardSnapshot = captureCurrentGameBaseSnapshotFromController(
                    mainBoardController,
                    game,
                    resolvedRoom.id,
                );
                if (mainBoardSnapshot) {
                    if (
                        game.live &&
                        (game.move_number ?? 0) === 0 &&
                        mainBoardSnapshot.trunkTailMoveNumber === 0
                    ) {
                        logKibitzVariationDebug(
                            "current-game-base-snapshot:main-root-live-rejected",
                            {
                                reason,
                                gameId: game.game_id,
                                roomMoveNumber: game.move_number ?? 0,
                                snapshotTailMoveNumber: mainBoardSnapshot.trunkTailMoveNumber,
                                moveTreeId: mainBoardSnapshot.moveTreeId,
                            },
                        );
                        return cachedSnapshot;
                    }
                    const acceptedSnapshot = chooseFresherCurrentGameBaseSnapshot(
                        cachedSnapshot,
                        mainBoardSnapshot,
                    );
                    acceptCurrentGameBaseSnapshot(mainBoardSnapshot);
                    return acceptedSnapshot;
                }
            } else {
                const logMessage = controllerContext
                    ? "current-game-base-snapshot:stale-main-controller"
                    : "current-game-base-snapshot:missing-main-controller-context";
                logKibitzVariationDebug(logMessage, {
                    reason,
                    gameId: game.game_id,
                    diagnostic: {
                        controllerProvided: Boolean(mainBoardController),
                        contextPresent: Boolean(controllerContext),
                        controllerMatches: Boolean(
                            controllerContext &&
                            controllerContext.controller === mainBoardController,
                        ),
                        epochMatches: Boolean(
                            controllerContext &&
                            controllerContext.epoch === mainBoardControllerEpochRef.current,
                        ),
                        roomIdMatches: Boolean(
                            controllerContext &&
                            controllerContext.roomId === currentRoomIdRef.current,
                        ),
                        gameIdMatches: Boolean(
                            controllerContext &&
                            controllerContext.gameId === currentRoomGameIdRef.current,
                        ),
                        parentConnected: Boolean(mainBoardController?.goban.parent?.isConnected),
                        contextRoomId: controllerContext?.roomId ?? null,
                        contextGameId: controllerContext?.gameId ?? null,
                        liveRoomId: currentRoomIdRef.current,
                        liveGameId: currentRoomGameIdRef.current,
                    },
                    fallbackSnapshot: cachedSnapshotUsable
                        ? {
                              gameId: cachedSnapshot.gameId,
                              trunkTailMoveNumber: cachedSnapshot.trunkTailMoveNumber,
                              source: cachedSnapshot.source,
                          }
                        : null,
                });

                if (cachedSnapshotUsable) {
                    return cachedSnapshot;
                }
            }

            if (cachedSnapshotUsable) {
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
            acceptCurrentGameBaseSnapshot,
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
    React.useEffect(() => {
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, streamerMode ? "true" : "false");
    }, [streamerMode]);

    React.useEffect(() => {
        if (isMobileLayout && streamerMode) {
            setStreamerMode(false);
        }
    }, [isMobileLayout, streamerMode]);
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
                    if (isKibitzVariationDebugEnabled()) {
                        logKibitzVariationDebug("kibitz-post-variation:pending-local-state", {
                            pendingId: posted.kibitz_pending_id ?? "",
                            gameId: posted.game_id,
                            creatorId,
                            from: posted.from ?? null,
                            moveCount: posted.moves?.length ?? null,
                            title: posted.name ?? null,
                        });
                    }
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

            const topPaneElement = shell.querySelector(
                ".Kibitz-mobile-top-pane",
            ) as HTMLDivElement | null;
            const boardSlotElement = shell.querySelector(
                ".mobile-board-fit-slot",
            ) as HTMLDivElement | null;
            const boardWindowElement = shell.querySelector(
                ".mobile-secondary-board-surface",
            ) as HTMLElement | null;
            const boardHostElement = shell.querySelector(
                ".Kibitz-mobile-board-host",
            ) as HTMLElement | null;
            const shellRect = shell.getBoundingClientRect();
            const boardSlotMetrics = boardSlotElement
                ? measureSquareFitLayout(boardSlotElement, true)
                : null;
            const outerBoardSlotMaxWidth = Math.floor(
                boardSlotMetrics?.slotWidth ??
                    boardSlotElement?.parentElement?.clientWidth ??
                    shellRect.width ??
                    0,
            );
            const boardWindowRect = boardWindowElement?.getBoundingClientRect();
            const boardHostRect = boardHostElement?.getBoundingClientRect();
            const availableSlotWidthCap = Math.max(
                0,
                Math.floor(boardSlotElement?.clientWidth ?? outerBoardSlotMaxWidth),
            );
            const boardSlotMaxWidth = availableSlotWidthCap || outerBoardSlotMaxWidth;
            const reservedBoardVerticalSpace = Math.max(0, boardSlotMetrics?.reservedHeight ?? 0);
            const horizontalInset = Math.max(
                0,
                Math.floor(
                    getHorizontalInsetPx(boardHostElement) +
                        getHorizontalInsetPx(boardWindowElement),
                ),
            );
            const transientBoardWindowMaxSize = Math.max(
                0,
                outerBoardSlotMaxWidth - horizontalInset,
            );
            const startLayoutSize = Math.max(
                0,
                boardSlotMaxWidth || boardSlotMetrics?.nextSize || 0,
            );
            const startWindowSize = Math.max(
                0,
                Math.floor(
                    boardWindowRect?.width ?? boardHostRect?.width ?? transientBoardWindowMaxSize,
                ),
            );
            const startWindowWidth = Math.max(
                0,
                Math.floor(boardWindowRect?.width ?? startWindowSize),
            );
            const startWindowHeight = Math.max(
                0,
                Math.floor(boardWindowRect?.height ?? startWindowSize),
            );
            const metricsWidth = Math.max(
                0,
                Math.floor(boardWindowRect?.width ?? startWindowWidth),
            );
            const metricsHeight = Math.max(
                0,
                Math.floor(boardWindowRect?.height ?? startWindowHeight),
            );
            const startedAtHorizontalMax =
                transientBoardWindowMaxSize != null &&
                Math.abs(startWindowWidth - transientBoardWindowMaxSize) <= 1 &&
                startWindowHeight > startWindowWidth;
            if (isKibitzBoardSizeDebugEnabled()) {
                recordKibitzBoardSizeEvent("mobile-divider:pointer-down", {
                    pointerId: event.pointerId,
                    startClientY: event.clientY,
                    startDividerRatio: mobileSplitRatio,
                    activeMobileBoardOwner:
                        activeMobileBoardTransientDragControllerRef.current?.owner ?? null,
                    hasActiveMobileBoardTransientController: Boolean(
                        activeMobileBoardTransientDragControllerRef.current?.controller,
                    ),
                    gestureState: "armed",
                    geometry: buildMobileResizeGeometrySnapshot({
                        shellRect,
                        boardSizingSlotRect:
                            boardSlotMetrics != null
                                ? {
                                      width: boardSlotMetrics.slotWidth,
                                      height: boardSlotMetrics.slotHeight,
                                  }
                                : null,
                        boardSurfaceRect: boardWindowRect ?? boardHostRect ?? null,
                        gobanContainerRect: boardWindowRect ?? null,
                        gobanMetrics:
                            metricsWidth != null && metricsHeight != null
                                ? {
                                      width: metricsWidth,
                                      height: metricsHeight,
                                  }
                                : null,
                        dividerRatio: mobileSplitRatio,
                        startDividerRatio: mobileSplitRatio,
                    }),
                    legacyDiagnostics: {
                        shellRectHeight: shellRect.height,
                        shellRectWidth: shellRect.width,
                        boardSlotMaxWidth,
                        outerBoardSlotMaxWidth,
                        availableSlotWidthCap,
                        transientBoardWindowMaxSize,
                        horizontalInset,
                        boardWindowRectWidth: boardWindowRect?.width ?? null,
                        boardWindowRectHeight: boardWindowRect?.height ?? null,
                        startWindowWidth,
                        startWindowHeight,
                        startLayoutSize,
                        startWindowSize,
                        startedAtHorizontalMax,
                        reservedBoardVerticalSpace,
                        currentGobanMetricsWidth: metricsWidth,
                        currentGobanMetricsHeight: metricsHeight,
                    },
                });
            }
            event.preventDefault();
            lastAppliedMobileResizeTargetRef.current = null;
            const initialStableGeometry = measureStableMobileBoardGeometry("initial-capture");
            mobileResizeLifecycleStateRef.current = "armed";
            mobileDragStateRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startRatio: mobileSplitRatio,
                gestureState: "armed",
                stableGeometry: initialStableGeometry ?? stableMobileBoardGeometryRef.current,
                lastAppliedTarget: null,
                lastCommittedTarget: null,
                legacyDiagnostics: {
                    startedAt: Date.now(),
                    shellWidth: shellRect.width,
                    shellHeight: shellRect.height,
                    outerBoardSlotMaxWidth,
                    boardSlotMaxWidth,
                    transientBoardWindowMaxSize,
                    reservedBoardVerticalSpace,
                    startWindowWidth,
                    startWindowHeight,
                    startLayoutSize,
                    startWindowSize,
                    startedAtHorizontalMax,
                    topPaneElement,
                    boardSlotElement,
                    boardWindowElement,
                    cachedMetricsWidth: metricsWidth,
                    cachedMetricsHeight: metricsHeight,
                },
            };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            document.body.style.userSelect = "none";
            document.body.style.cursor = "ns-resize";
        },
        [isMobileLayout, mobileSplitRatio],
    );

    const resolvedRoomUsers = resolvedRoom ? controller.getRoomUsers(resolvedRoom.id) : [];
    const canOpenRoomSettings = canManageRoom || Boolean(handleOpenChangeBoard);
    const effectiveStreamerMode =
        streamerMode && !isMobileLayout && Boolean(resolvedRoom) && !isBlockedRoom;
    const kibitzClassName = `Kibitz${effectiveStreamerMode ? " is-streamer-mode" : ""}`;
    const mobileMatchup = resolvedRoom?.current_game ?? null;
    React.useEffect(() => {
        document.body.classList.toggle("kibitz-streamer-mode", effectiveStreamerMode);

        return () => {
            document.body.classList.remove("kibitz-streamer-mode");
        };
    }, [effectiveStreamerMode]);
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
            canOpenCreateRoomFlow={canOpenCreateRoomFlow}
            signInHref={createRoomSignInHref}
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
            <div className={kibitzClassName}>
                {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
                <div className="Kibitz-layout">
                    <div className="Kibitz-left-rail">
                        <KibitzRoomList
                            rooms={rooms}
                            activeRoomId=""
                            onSelectRoom={onSelectRoom}
                            onCreateRoom={onOpenCreateRoom}
                            canOpenCreateRoomFlow={canOpenCreateRoomFlow}
                            signInHref={createRoomSignInHref}
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
            <div className={kibitzClassName}>
                {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
                <div className="Kibitz-layout">
                    <div className="Kibitz-left-rail">
                        <KibitzRoomList
                            rooms={rooms}
                            activeRoomId=""
                            onSelectRoom={onSelectRoom}
                            onCreateRoom={onOpenCreateRoom}
                            canOpenCreateRoomFlow={canOpenCreateRoomFlow}
                            signInHref={createRoomSignInHref}
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
        <div className={kibitzClassName}>
            {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
            <div className="Kibitz-layout">
                <div className="Kibitz-left-rail">
                    <KibitzRoomList
                        rooms={rooms}
                        activeRoomId={resolvedRoom.id}
                        onSelectRoom={onSelectRoom}
                        onCreateRoom={onOpenCreateRoom}
                        canOpenCreateRoomFlow={canOpenCreateRoomFlow}
                        signInHref={createRoomSignInHref}
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
                                    <KibitzMobileMainGameScoreboard
                                        controller={mainBoardController}
                                        game={mobileMatchup}
                                        isMainBoardVisible={!mobileCompareActive}
                                        isInteractionPaused={mobileDividerDragging}
                                    />
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
                                                    canOpenCreateRoomFlow={canOpenCreateRoomFlow}
                                                    signInHref={createRoomSignInHref}
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
                                                canOpenCreateRoomFlow={canOpenCreateRoomFlow}
                                                signInHref={createRoomSignInHref}
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
                            <div
                                className={
                                    "Kibitz-mobile-shell" +
                                    (mobileDividerDragging ? " mobile-divider-dragging" : "")
                                }
                                ref={mobileShellRef}
                            >
                                <div
                                    className="Kibitz-mobile-top-pane"
                                    style={
                                        mobileDividerDragging
                                            ? undefined
                                            : { flexBasis: `${mobileSplitRatio * 100}%` }
                                    }
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
                                            mobileDividerDragging={mobileDividerDragging}
                                            onMobileBoardTransientDragControllerChange={
                                                handleMobileBoardTransientDragControllerChange
                                            }
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
                                            onMainBoardHydrationChange={
                                                handleMainBoardHydrationChange
                                            }
                                            onMobileBoardSizeChange={handleMobileBoardSizeChange}
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
                                    mobileDividerDragging={mobileDividerDragging}
                                    onMobileBoardTransientDragControllerChange={
                                        handleMobileBoardTransientDragControllerChange
                                    }
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
                                    streamerMode={streamerMode}
                                    onStreamerModeChange={setStreamerMode}
                                    mobileCompanionPanel={mobileCompanionPanel}
                                    mobileHasActiveVote={Boolean(activeProposal)}
                                    onSelectMobileCompanionPanel={onSelectMobileCompanionPanel}
                                    onOpenMobileRooms={undefined}
                                    onMobileCompareControllerChange={undefined}
                                    onMainBoardControllerChange={setMainBoardController}
                                    onMainBoardHydrationChange={handleMainBoardHydrationChange}
                                    onMobileBoardSizeChange={handleMobileBoardSizeChange}
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
