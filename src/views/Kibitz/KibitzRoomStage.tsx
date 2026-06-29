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

/* cspell:ignore unhydrated */

import * as React from "react";
import {
    GobanEngine,
    type GobanConfig,
    type GobanEngineConfig,
    type GobanModes,
    type MoveTree,
    type MoveTreeJson,
} from "goban";
import { Resizable } from "@/components/Resizable";
import { KBShortcut } from "@/components/KBShortcut";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import { close_all_popovers, popover } from "@/lib/popover";
import { get } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { pgettext } from "@/lib/translate";
import type {
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import {
    cloneOfficialTrunkMoveTreeJson,
    hydrateMainBoardFromRoomBaseSnapshot,
    restoreMainBoardToOfficialTail,
} from "./kibitzCurrentGameBaseSnapshot";
import { measureSquareFitLayout } from "./kibitzBoardSizing";
import type {
    KibitzBoardLoadConfig,
    KibitzCurrentGameBaseSnapshot,
} from "./kibitzCurrentGameBaseSnapshotTypes";
import { KibitzBoard, type KibitzBoardTransientDragController } from "./KibitzBoard";
import { KibitzBoardControls } from "./KibitzBoardControls";
import { KibitzDividerHandle } from "./KibitzDividerHandle";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import {
    getDesktopMainGameMetadataRowText,
    KibitzDesktopMainGameScoreboard,
} from "./KibitzDesktopMainGameScoreboard";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { KibitzNodeText } from "./KibitzNodeText";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import {
    applyKibitzVariationToController,
    isVariationOfficialAnchorReady,
} from "./kibitzVariationTree";
import {
    isKibitzVariationDebugEnabled,
    logKibitzVariationDebug,
    summarizeKibitzMoveTreeNode,
} from "./kibitzVariationDebug";
import { isKibitzBoardSizeDebugEnabled, recordKibitzBoardSizeEvent } from "./kibitzBoardSizeDebug";
import "./KibitzRoomStage.css";

declare global {
    interface Window {
        __kibitzLifecycleRing?: Array<Record<string, unknown>>;
    }
}

interface KibitzRoomStageProps {
    room: KibitzRoomSummary;
    rooms: KibitzRoomSummary[];
    variationGameById?: ReadonlyMap<number, KibitzWatchedGame>;
    currentGameBaseSnapshot?: KibitzCurrentGameBaseSnapshot | null;
    proposals: KibitzProposal[];
    variations: KibitzVariationSummary[];
    visibleVariationIds: string[];
    variationColorIndexes: Record<string, number>;
    secondaryPane: KibitzSecondaryPaneState;
    onClearPreview: () => void;
    onPostVariation: (controller: GobanController, sourceGameId: number | undefined) => void;
    onSetSecondaryPaneMode: (mode: "hidden" | "small" | "equal") => void;
    onChangeBoard?: () => void;
    canEditRoom?: boolean;
    canDeleteRoom?: boolean;
    onSaveRoomDetails?: (title: string, description: string) => Promise<boolean>;
    onDeleteRoom?: () => Promise<boolean>;
    streamerMode?: boolean;
    onStreamerModeChange?: (enabled: boolean) => void;
    onCreateVariation?: () => void;
    onCreateVariationFromPostedVariation?: (variation: KibitzVariationSummary) => void;
    variationFocusRequestId: number;
    isMobileLayout?: boolean;
    mobileCompanionPanel?: "chat" | "vote" | "compare";
    mobileHasActiveVote?: boolean;
    mobileDividerDragging?: boolean;
    onMobileBoardTransientDragControllerChange?: (
        owner: MobileBoardResizeOwner,
        controller: KibitzBoardTransientDragController | null,
    ) => void;
    onMobileBoardSizeChange?: (size: number | null) => void;
    onSelectMobileCompanionPanel?: (panel: "chat" | "vote" | "compare") => void;
    onOpenMobileRooms?: () => void;
    onMobileCompareControllerChange?: (controller: GobanController | null) => void;
    onMainBoardControllerChange?: (controller: GobanController | null) => void;
    onMainBoardHydrationChange?: (state: {
        roomId: string;
        gameId: number | null;
        officialTailMoveNumber: number;
        expectedMoveNumber: number;
        hasMoveTree: boolean;
        hydrated: boolean;
    }) => void;
}

export type MobileBoardResizeOwner = "main" | "draft" | "variation" | "preview";

interface KibitzSelectedGameDetails {
    id: number;
    width: number;
    height: number;
    name: string;
    gamedata?: Partial<rest_api.games.GameData> & {
        moves?: GobanConfig["moves"];
    };
}

const SELECTED_GAME_NOT_FRESH_RETRY_MS = 30_000;
const SELECTED_GAME_NETWORK_RETRY_MS = 5_000;

export type SelectedGameBaseSnapshotFailureKind =
    | "not-fresh-enough"
    | "missing-moves"
    | "private-or-unavailable"
    | "network-error"
    | "invalid-game-data";

export interface SelectedGameBaseSnapshotFailure {
    gameId: number;
    variationId: string | null;
    requiredMoveNumber: number;
    kind: SelectedGameBaseSnapshotFailureKind;
    createdAt: number;
    retryAfter?: number;
    message?: string;
    details?: Record<string, unknown>;
}

export type SelectedGameSnapshotFailureKey = string;

export function selectedGameSnapshotFailureKey(
    gameId: number,
    requiredMoveNumber: number,
): SelectedGameSnapshotFailureKey {
    return `${gameId}:${requiredMoveNumber}`;
}

export function canRetrySelectedGameSnapshotFailure(
    failure: SelectedGameBaseSnapshotFailure | null | undefined,
): boolean {
    if (!failure) {
        return true;
    }

    switch (failure.kind) {
        case "missing-moves":
        case "private-or-unavailable":
        case "invalid-game-data":
            return false;

        case "not-fresh-enough":
        case "network-error":
            return failure.retryAfter != null && Date.now() >= failure.retryAfter;

        default:
            return false;
    }
}

export function recordSelectedGameSnapshotFailure(
    failures: Map<SelectedGameSnapshotFailureKey, SelectedGameBaseSnapshotFailure>,
    params: {
        gameId: number;
        variationId: string | null;
        requiredMoveNumber: number;
        kind: SelectedGameBaseSnapshotFailureKind;
        retryAfter?: number;
        message?: string;
        details?: Record<string, unknown>;
    },
): SelectedGameBaseSnapshotFailure {
    const failure: SelectedGameBaseSnapshotFailure = {
        gameId: params.gameId,
        variationId: params.variationId,
        requiredMoveNumber: params.requiredMoveNumber,
        kind: params.kind,
        createdAt: Date.now(),
        retryAfter: params.retryAfter,
        message: params.message,
        details: params.details,
    };

    failures.set(selectedGameSnapshotFailureKey(params.gameId, params.requiredMoveNumber), failure);

    return failure;
}

export function clearSelectedGameSnapshotFailure(
    failures: Map<SelectedGameSnapshotFailureKey, SelectedGameBaseSnapshotFailure>,
    gameId: number,
    requiredMoveNumber: number,
): void {
    failures.delete(selectedGameSnapshotFailureKey(gameId, requiredMoveNumber));
}

export function getSelectedGameSnapshotBlockingFailure(
    failures: Map<SelectedGameSnapshotFailureKey, SelectedGameBaseSnapshotFailure>,
    params: {
        gameId: number;
        requiredMoveNumber: number;
    },
): SelectedGameBaseSnapshotFailure | null {
    const failure = failures.get(
        selectedGameSnapshotFailureKey(params.gameId, params.requiredMoveNumber),
    );

    if (!failure) {
        return null;
    }

    return canRetrySelectedGameSnapshotFailure(failure) ? null : failure;
}

function isPrivateOrUnavailableSelectedGameSnapshotError(error: unknown): boolean {
    const status =
        typeof error === "object" && error != null && "status" in error
            ? (error as { status?: unknown }).status
            : undefined;
    const statusText =
        typeof error === "object" && error != null && "statusText" in error
            ? (error as { statusText?: unknown }).statusText
            : undefined;

    return status === 403 || status === 404 || statusText === "Not Found";
}

function getSelectedGameSnapshotErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

export function buildSelectedGameSnapshotFailureFromError(params: {
    error: unknown;
    gameId: number;
    variationId: string | null;
    requiredMoveNumber: number;
}): SelectedGameBaseSnapshotFailure {
    const { error, gameId, variationId, requiredMoveNumber } = params;
    const now = Date.now();

    if (isPrivateOrUnavailableSelectedGameSnapshotError(error)) {
        return {
            gameId,
            variationId,
            requiredMoveNumber,
            kind: "private-or-unavailable",
            createdAt: now,
            message: getSelectedGameSnapshotErrorMessage(error),
            details: {
                status:
                    typeof error === "object" && error != null && "status" in error
                        ? ((error as { status?: unknown }).status ?? null)
                        : null,
                statusText:
                    typeof error === "object" && error != null && "statusText" in error
                        ? ((error as { statusText?: unknown }).statusText ?? null)
                        : null,
            },
        };
    }

    return {
        gameId,
        variationId,
        requiredMoveNumber,
        kind: "network-error",
        createdAt: now,
        retryAfter: now + SELECTED_GAME_NETWORK_RETRY_MS,
        message: getSelectedGameSnapshotErrorMessage(error),
        details: {
            errorName: error instanceof Error ? error.name : typeof error,
        },
    };
}

export function buildSnapshotFromEngine({
    engine,
    gameId,
    roomId,
    source,
    requiredSnapshotMoveNumber,
}: {
    engine: GobanEngine;
    gameId: number;
    roomId: string | null | undefined;
    source: KibitzCurrentGameBaseSnapshot["source"];
    requiredSnapshotMoveNumber: number;
}): KibitzCurrentGameBaseSnapshot | null {
    const officialTail = getMoveTreeTrunkTail(engine.move_tree);
    if (!officialTail || officialTail.move_number < requiredSnapshotMoveNumber) {
        return null;
    }

    return {
        gameId,
        roomId: roomId ?? null,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        fetchedMoveCount: null,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: gameId,
            moves: undefined,
            move_tree: cloneOfficialTrunkMoveTreeJson(engine.move_tree),
        },
    };
}

export function isSelectedGameBaseSnapshotFreshEnough(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    selectedGameId: number | null | undefined,
    requiredSnapshotMoveNumber: number,
): boolean {
    return Boolean(
        snapshot &&
        selectedGameId != null &&
        snapshot.gameId === selectedGameId &&
        snapshot.trunkTailMoveNumber >= requiredSnapshotMoveNumber,
    );
}

export function isSelectedGameBaseSnapshotActiveButStale(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    selectedGameId: number | null | undefined,
    requiredSnapshotMoveNumber: number,
): boolean {
    return Boolean(
        snapshot &&
        selectedGameId != null &&
        snapshot.gameId === selectedGameId &&
        snapshot.trunkTailMoveNumber < requiredSnapshotMoveNumber,
    );
}

type SelectedGameBaseSnapshotFetchResult =
    | {
          kind: "ready";
          snapshot: KibitzCurrentGameBaseSnapshot;
      }
    | {
          kind: "failure";
          failure: {
              kind: SelectedGameBaseSnapshotFailureKind;
              retryAfter?: number;
              message?: string;
              details?: Record<string, unknown>;
          };
      };

export function buildSelectedGameBaseSnapshotFromDetails({
    details,
    gameId,
    roomId,
    requiredSnapshotMoveNumber,
    logDebug,
}: {
    details: KibitzSelectedGameDetails;
    gameId: number;
    roomId: string | null | undefined;
    requiredSnapshotMoveNumber: number;
    logDebug?: (message: string, details?: Record<string, unknown>) => void;
}): SelectedGameBaseSnapshotFetchResult {
    if (!details?.gamedata) {
        return {
            kind: "failure",
            failure: {
                kind: "missing-moves",
                details: {
                    hasDetails: Boolean(details),
                    hasGamedata: Boolean(details?.gamedata),
                },
            },
        };
    }

    if (!Array.isArray(details.gamedata.moves)) {
        return {
            kind: "failure",
            failure: {
                kind: "invalid-game-data",
                message: "Game details did not include gamedata.moves",
                details: {
                    hasDetails: Boolean(details),
                    hasGamedata: Boolean(details.gamedata),
                    movesType: typeof details.gamedata.moves,
                    moveCount: null,
                },
            },
        };
    }

    if (details.gamedata.moves.length === 0 && requiredSnapshotMoveNumber > 0) {
        return {
            kind: "failure",
            failure: {
                kind: "missing-moves",
                message: "Game details did not include enough moves",
                details: {
                    hasDetails: Boolean(details),
                    hasGamedata: Boolean(details.gamedata),
                    movesType: "array",
                    moveCount: 0,
                    requiredMoveNumber: requiredSnapshotMoveNumber,
                },
            },
        };
    }

    if (details.gamedata.moves.length === 0 && requiredSnapshotMoveNumber === 0) {
        logDebug?.("selected-game-base-snapshot:empty-moves-root", {
            selectedGameId: gameId,
            requiredSnapshotMoveNumber,
            moveCount: 0,
        });
    }

    if (
        typeof details.width !== "number" ||
        typeof details.height !== "number" ||
        !Number.isFinite(details.width) ||
        !Number.isFinite(details.height) ||
        details.width <= 0 ||
        details.height <= 0
    ) {
        return {
            kind: "failure",
            failure: {
                kind: "invalid-game-data",
                message: "Game details had invalid board dimensions",
                details: {
                    width: details.width,
                    height: details.height,
                },
            },
        };
    }

    let engine: GobanEngine;

    try {
        const engineConfig = {
            ...details.gamedata,
            game_id: gameId,
            width: details.width,
            height: details.height,
            moves: details.gamedata.moves,
        } as unknown as GobanEngineConfig;
        engine = new GobanEngine(engineConfig);
    } catch (error) {
        return {
            kind: "failure",
            failure: {
                kind: "invalid-game-data",
                message: getSelectedGameSnapshotErrorMessage(error),
                details: {
                    errorName: error instanceof Error ? error.name : typeof error,
                },
            },
        };
    }

    const snapshot = buildSnapshotFromEngine({
        engine,
        gameId,
        roomId,
        source: "selected-game-details",
        requiredSnapshotMoveNumber,
    });

    if (!snapshot) {
        return {
            kind: "failure",
            failure: {
                kind: "not-fresh-enough",
                retryAfter: Date.now() + SELECTED_GAME_NOT_FRESH_RETRY_MS,
                details: {
                    trunkTailMoveNumber: getMoveTreeTrunkTail(engine.move_tree)?.move_number ?? 0,
                    requiredMoveNumber: requiredSnapshotMoveNumber,
                },
            },
        };
    }

    snapshot.fetchedMoveCount = details.gamedata.moves.length;
    return {
        kind: "ready",
        snapshot,
    };
}

async function fetchSelectedGameBaseSnapshot({
    gameId,
    roomId,
    requiredSnapshotMoveNumber,
    logDebug,
}: {
    gameId: number;
    roomId: string | null | undefined;
    requiredSnapshotMoveNumber: number;
    logDebug?: (message: string, details?: Record<string, unknown>) => void;
}): Promise<SelectedGameBaseSnapshotFetchResult> {
    let details: KibitzSelectedGameDetails;

    try {
        details = (await get(`games/${gameId}`)) as KibitzSelectedGameDetails;
    } catch (error) {
        return {
            kind: "failure",
            failure: buildSelectedGameSnapshotFailureFromError({
                error,
                gameId,
                variationId: null,
                requiredMoveNumber: requiredSnapshotMoveNumber,
            }),
        };
    }

    return buildSelectedGameBaseSnapshotFromDetails({
        details,
        gameId,
        roomId,
        requiredSnapshotMoveNumber,
        logDebug,
    });
}

function useSquareFitSize<T extends HTMLElement>(
    layoutKey: string,
    constrainToParentHeight = false,
    debugLabel?: string,
    paused = false,
) {
    const [element, setElement] = React.useState<T | null>(null);
    const [size, setSize] = React.useState(0);
    const sizeRef = React.useRef(0);
    const ref = React.useCallback((node: T | null) => {
        setElement(node);
    }, []);

    React.useEffect(() => {
        sizeRef.current = size;
    }, [size]);

    React.useLayoutEffect(() => {
        if (!element) {
            setSize(0);
            sizeRef.current = 0;
            return;
        }

        if (paused) {
            return;
        }

        let raf = 0;

        const measure = () => {
            const metrics = measureSquareFitLayout(element, constrainToParentHeight);
            const nextSize = metrics.nextSize;
            const previousSize = sizeRef.current;
            if (isKibitzBoardSizeDebugEnabled()) {
                recordKibitzBoardSizeEvent("square-fit:measure", {
                    debugLabel: debugLabel ?? null,
                    layoutKey,
                    constrainToParentHeight,
                    slotWidth: metrics.slotWidth,
                    slotHeight: metrics.slotHeight,
                    parentClientHeight: metrics.parentClientHeight,
                    reservedHeight: metrics.reservedHeight,
                    rowGap: metrics.rowGap,
                    fallbackHeight: metrics.fallbackHeight,
                    usableHeight: metrics.usableHeight,
                    previousSize,
                    nextSize,
                    changed: previousSize !== nextSize,
                });
            }

            if (previousSize !== nextSize) {
                if (isKibitzBoardSizeDebugEnabled()) {
                    recordKibitzBoardSizeEvent("square-fit:size-change", {
                        debugLabel: debugLabel ?? null,
                        previousSize,
                        nextSize,
                        delta: nextSize - previousSize,
                    });
                }
                sizeRef.current = nextSize;
                setSize(nextSize);
            }
        };

        const scheduleMeasure = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };

        const resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(element);
        if (element.parentElement) {
            resizeObserver.observe(element.parentElement);
        }
        window.addEventListener("resize", scheduleMeasure);
        scheduleMeasure();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", scheduleMeasure);
            resizeObserver.disconnect();
        };
    }, [constrainToParentHeight, debugLabel, element, layoutKey, paused]);

    return [ref, size] as const;
}

function boardDimensionsOf(game: { board_size?: `${number}x${number}` } | null | undefined): {
    width?: number;
    height?: number;
} {
    if (!game?.board_size) {
        return {};
    }
    const [w, h] = game.board_size.split("x").map(Number);
    if (Number.isFinite(w) && Number.isFinite(h)) {
        return { width: w, height: h };
    }
    return {};
}

export type KibitzLogicalBoardDimensions = {
    width: number;
    height: number;
};

type KibitzLogicalBoardDimensionsSource =
    | "secondary-board-game"
    | "selected-game-snapshot"
    | "selected-game-cache"
    | "variation"
    | "move-tree";

export interface KibitzResolvedLogicalBoardDimensions extends KibitzLogicalBoardDimensions {
    source: KibitzLogicalBoardDimensionsSource;
    gameId: number | null;
}

function getLogicalBoardDimensionsFromConfig(
    config: Partial<KibitzBoardLoadConfig> | null | undefined,
): KibitzLogicalBoardDimensions | null {
    const width = Number(config?.width);
    const height = Number(config?.height);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null;
    }

    return {
        width,
        height,
    };
}

function getLogicalBoardDimensionsFromWatchedGame(
    game: KibitzWatchedGame | null | undefined,
): KibitzLogicalBoardDimensions | null {
    const dimensions = boardDimensionsOf(game);

    if (
        typeof dimensions.width !== "number" ||
        typeof dimensions.height !== "number" ||
        dimensions.width <= 0 ||
        dimensions.height <= 0
    ) {
        return null;
    }

    return {
        width: dimensions.width,
        height: dimensions.height,
    };
}

function getLogicalBoardDimensionsFromSnapshot(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
): KibitzLogicalBoardDimensions | null {
    return getLogicalBoardDimensionsFromConfig(snapshot?.config);
}

function getLogicalBoardDimensionsFromMoveTree(
    moveTree: unknown | null | undefined,
): KibitzLogicalBoardDimensions | null {
    if (!moveTree || typeof moveTree !== "object") {
        return null;
    }

    const record = moveTree as Record<string, unknown>;
    const directWidth = Number(record.width);
    const directHeight = Number(record.height);
    if (
        Number.isFinite(directWidth) &&
        Number.isFinite(directHeight) &&
        directWidth > 0 &&
        directHeight > 0
    ) {
        return {
            width: directWidth,
            height: directHeight,
        };
    }

    const config = record.config;
    if (config && typeof config === "object") {
        const configRecord = config as Record<string, unknown>;
        const configWidth = Number(configRecord.width);
        const configHeight = Number(configRecord.height);
        if (
            Number.isFinite(configWidth) &&
            Number.isFinite(configHeight) &&
            configWidth > 0 &&
            configHeight > 0
        ) {
            return {
                width: configWidth,
                height: configHeight,
            };
        }
    }

    return null;
}

export function resolveDraftSourceBoardDimensions(params: {
    draftBaseVariation: KibitzVariationSummary | null | undefined;
    variationSourceGameId: number | null | undefined;
    secondaryBoardGame: KibitzWatchedGame | null | undefined;
    selectedGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
    selectedGameBaseSnapshotCache: ReadonlyMap<number, KibitzCurrentGameBaseSnapshot>;
    variationSourceMoveTree?: unknown;
}): KibitzResolvedLogicalBoardDimensions | null {
    const fromSecondaryBoardGame = getLogicalBoardDimensionsFromWatchedGame(
        params.secondaryBoardGame,
    );
    if (fromSecondaryBoardGame) {
        return {
            ...fromSecondaryBoardGame,
            source: "secondary-board-game",
            gameId: params.secondaryBoardGame?.game_id ?? null,
        };
    }

    const sourceGameId = params.variationSourceGameId ?? params.draftBaseVariation?.game_id ?? null;

    if (sourceGameId != null && params.selectedGameBaseSnapshot?.gameId === sourceGameId) {
        const fromSelectedSnapshot = getLogicalBoardDimensionsFromSnapshot(
            params.selectedGameBaseSnapshot,
        );
        if (fromSelectedSnapshot) {
            return {
                ...fromSelectedSnapshot,
                source: "selected-game-snapshot",
                gameId: sourceGameId,
            };
        }
    }

    if (sourceGameId != null) {
        const cachedSnapshot = params.selectedGameBaseSnapshotCache.get(sourceGameId);
        const fromCachedSnapshot = getLogicalBoardDimensionsFromSnapshot(cachedSnapshot);
        if (fromCachedSnapshot) {
            return {
                ...fromCachedSnapshot,
                source: "selected-game-cache",
                gameId: sourceGameId,
            };
        }
    }

    const fromMoveTree = getLogicalBoardDimensionsFromMoveTree(params.variationSourceMoveTree);
    if (fromMoveTree) {
        return {
            ...fromMoveTree,
            source: "move-tree",
            gameId: sourceGameId,
        };
    }

    return null;
}

export function hasBoardDimensions(
    game: { board_size?: `${number}x${number}` } | null | undefined,
): boolean {
    const dimensions = boardDimensionsOf(game);

    return (
        typeof dimensions.width === "number" &&
        dimensions.width > 0 &&
        typeof dimensions.height === "number" &&
        dimensions.height > 0
    );
}

type MobileSecondaryOwner = "none" | "preview" | "draft" | "variation";

export function resolveMobileSecondaryOwner({
    mobileCompareActive,
    selectedVariation,
    isDraftingVariation,
    secondaryGameId,
    secondaryBoardGame,
}: {
    mobileCompareActive: boolean;
    selectedVariation: KibitzVariationSummary | undefined;
    isDraftingVariation: boolean;
    secondaryGameId: number | null | undefined;
    secondaryBoardGame: KibitzWatchedGame | null | undefined;
}): MobileSecondaryOwner {
    if (!mobileCompareActive) {
        return "none";
    }

    if (selectedVariation) {
        return "variation";
    }

    if (isDraftingVariation) {
        return hasBoardDimensions(secondaryBoardGame) ? "draft" : "none";
    }

    if (secondaryGameId != null) {
        return hasBoardDimensions(secondaryBoardGame) ? "preview" : "none";
    }

    return "none";
}

export function resolveSelectedVariationSourceGame(
    selectedVariation: KibitzVariationSummary | undefined,
    mainGame: KibitzWatchedGame | undefined,
    rooms: KibitzRoomSummary[],
    variationGameById: ReadonlyMap<number, KibitzWatchedGame> | undefined,
    fallbackGame: KibitzWatchedGame | undefined,
): KibitzWatchedGame | undefined {
    if (!selectedVariation) {
        return undefined;
    }

    if (mainGame?.game_id === selectedVariation.game_id) {
        return mainGame;
    }

    return (
        rooms.find((candidate) => candidate.current_game?.game_id === selectedVariation.game_id)
            ?.current_game ??
        variationGameById?.get(selectedVariation.game_id) ??
        fallbackGame
    );
}

export function buildSecondaryVariationApplyKey({
    selectedGameId,
    snapshotTailMoveNumber,
    visibleVariationKey,
    selectedVariationId,
    variationFocusRequestId,
}: {
    selectedGameId: number | null | undefined;
    snapshotTailMoveNumber: number | null | undefined;
    visibleVariationKey: string;
    selectedVariationId: string | null | undefined;
    variationFocusRequestId: number;
}): string {
    return [
        selectedGameId ?? "no-game",
        snapshotTailMoveNumber ?? "no-snapshot",
        visibleVariationKey || "no-visible-variations",
        selectedVariationId ?? "no-selected-variation",
        variationFocusRequestId,
    ].join(":");
}

export type SecondaryVariationReloadAction = "skip-already-displayed" | "load-snapshot" | "apply";

export interface SecondaryVariationReloadDecision {
    action: SecondaryVariationReloadAction;
    desiredApplyKeyAlreadyApplied: boolean;
    baseSnapshotInstalled: boolean;
    desiredDirtyStateAlreadyDisplayed: boolean;
    staleDirtyState: boolean;
    needsSnapshotLoad: boolean;
}

export function decideSecondaryVariationReloadAction({
    snapshotInstalled,
    currentSecondaryTailMoveNumber,
    snapshotTailMoveNumber,
    treeDirty,
    desiredApplyKey,
    lastAppliedDesiredApplyKey,
}: {
    snapshotInstalled: boolean;
    currentSecondaryTailMoveNumber: number;
    snapshotTailMoveNumber: number;
    treeDirty: boolean;
    desiredApplyKey: string;
    lastAppliedDesiredApplyKey: string | null;
}): SecondaryVariationReloadDecision {
    const desiredApplyKeyAlreadyApplied = lastAppliedDesiredApplyKey === desiredApplyKey;
    const baseSnapshotInstalled =
        snapshotInstalled && currentSecondaryTailMoveNumber >= snapshotTailMoveNumber;
    const desiredDirtyStateAlreadyDisplayed =
        baseSnapshotInstalled && desiredApplyKeyAlreadyApplied;
    const staleDirtyState = treeDirty && !desiredApplyKeyAlreadyApplied;
    const needsSnapshotLoad =
        !baseSnapshotInstalled ||
        currentSecondaryTailMoveNumber < snapshotTailMoveNumber ||
        staleDirtyState;

    if (desiredDirtyStateAlreadyDisplayed) {
        return {
            action: "skip-already-displayed",
            desiredApplyKeyAlreadyApplied,
            baseSnapshotInstalled,
            desiredDirtyStateAlreadyDisplayed,
            staleDirtyState,
            needsSnapshotLoad: false,
        };
    }

    if (needsSnapshotLoad) {
        return {
            action: "load-snapshot",
            desiredApplyKeyAlreadyApplied,
            baseSnapshotInstalled,
            desiredDirtyStateAlreadyDisplayed,
            staleDirtyState,
            needsSnapshotLoad: true,
        };
    }

    return {
        action: "apply",
        desiredApplyKeyAlreadyApplied,
        baseSnapshotInstalled,
        desiredDirtyStateAlreadyDisplayed,
        staleDirtyState,
        needsSnapshotLoad: false,
    };
}

export function getSelectedVariationBaseSnapshotIdentity({
    selectedVariationGameId,
    selectedGameBaseSnapshot,
    currentGameBaseSnapshot,
}: {
    selectedVariationGameId: number | null | undefined;
    selectedGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
    currentGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
}): string | null {
    if (selectedVariationGameId == null) {
        return null;
    }

    const selectedGameSnapshot =
        selectedGameBaseSnapshot?.gameId === selectedVariationGameId
            ? selectedGameBaseSnapshot
            : currentGameBaseSnapshot?.gameId === selectedVariationGameId
              ? currentGameBaseSnapshot
              : null;

    if (!selectedGameSnapshot) {
        return null;
    }

    return [
        selectedGameSnapshot.gameId,
        selectedGameSnapshot.trunkTailMoveNumber,
        selectedGameSnapshot.moveTreeId ?? "",
    ].join(":");
}

interface TrackedBoardControllerContext {
    controller: GobanController | null;
    epoch: number;
    roomId: string | null;
    gameId: number | null;
    secondaryBoardKey: string | null;
}

interface SecondaryVariationBaseSnapshot {
    controller: GobanController;
    gameId: number;
    trunkTailMoveNumber: number;
    config: KibitzBoardLoadConfig;
}

interface PendingSecondaryVariationBaseLoad {
    controller: GobanController;
    controllerEpoch: number;
    roomId: string | null;
    gameId: number;
    operationId: number;
}

export interface InstalledSecondaryVariationBaseState {
    controller: GobanController | null;
    gameId: number | null;
    trunkTailMoveNumber: number;
    moveTreeId: number | string | null;
}

interface AppliedDraftBaseState {
    controller: GobanController | null;
    variationId: string | null;
    moveTreeId: number | string | null;
    engine: unknown | null;
}

type KibitzSnapshotWithMoveTree = KibitzCurrentGameBaseSnapshot & {
    config: KibitzCurrentGameBaseSnapshot["config"] & {
        move_tree: NonNullable<KibitzCurrentGameBaseSnapshot["config"]["move_tree"]>;
    };
};

function hasSnapshotMoveTree(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
): snapshot is KibitzSnapshotWithMoveTree {
    return Boolean(snapshot?.config?.move_tree);
}

function cloneMoveTreeJson(moveTree: MoveTreeJson): MoveTreeJson {
    return JSON.parse(JSON.stringify(moveTree)) as MoveTreeJson;
}

export function buildDraftBaseSnapshotFromSelectedGameSnapshot({
    selectedGameSnapshot,
    gameId,
    controller,
    cloneMoveTree = cloneMoveTreeJson,
}: {
    selectedGameSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
    gameId: number;
    controller: GobanController;
    cloneMoveTree?: (moveTree: MoveTreeJson) => MoveTreeJson;
}): SecondaryVariationBaseSnapshot | null {
    if (!hasSnapshotMoveTree(selectedGameSnapshot)) {
        return null;
    }

    return {
        controller,
        gameId,
        trunkTailMoveNumber: selectedGameSnapshot.trunkTailMoveNumber,
        config: {
            ...selectedGameSnapshot.config,
            game_id: gameId,
            moves: undefined,
            move_tree: cloneMoveTree(selectedGameSnapshot.config.move_tree),
        },
    };
}

export function getCurrentDraftBaseTreeIdentity(controller: GobanController): {
    moveTreeId: number | string | null;
    engine: unknown | null;
} {
    return {
        moveTreeId: controller.goban.engine?.move_tree?.id ?? null,
        engine: controller.goban.engine ?? null,
    };
}

export function isDraftBaseAlreadyApplied(
    appliedDraftBase: AppliedDraftBaseState,
    controller: GobanController,
    variationId: string,
): boolean {
    const currentTree = getCurrentDraftBaseTreeIdentity(controller);

    return (
        appliedDraftBase.controller === controller &&
        appliedDraftBase.variationId === variationId &&
        appliedDraftBase.moveTreeId === currentTree.moveTreeId &&
        appliedDraftBase.engine === currentTree.engine
    );
}

export function markDraftBaseApplied(
    controller: GobanController,
    variationId: string,
): AppliedDraftBaseState {
    const currentTree = getCurrentDraftBaseTreeIdentity(controller);

    return {
        controller,
        variationId,
        moveTreeId: currentTree.moveTreeId,
        engine: currentTree.engine,
    };
}

export function clearDraftBaseAppliedState(): AppliedDraftBaseState {
    return {
        controller: null,
        variationId: null,
        moveTreeId: null,
        engine: null,
    };
}

export function getOfficialTrunkTail(moveTree: MoveTree | null | undefined): MoveTree | null {
    return getMoveTreeTrunkTail(moveTree);
}

function summarizeSecondaryVariationSnapshot(
    snapshot: SecondaryVariationBaseSnapshot | null,
): Record<string, unknown> | null {
    if (!snapshot) {
        return null;
    }

    return {
        gameId: snapshot.gameId,
        trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
        hasMoveTree: Boolean(snapshot.config.move_tree),
    };
}

function summarizeElementForDebug(
    element: HTMLElement | null | undefined,
): Record<string, unknown> | null {
    if (!element) {
        return null;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return {
        tagName: element.tagName,
        className: typeof element.className === "string" ? element.className : "",
        id: element.id || "",
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
        display: style.display,
        visibility: style.visibility,
        position: style.position,
    };
}

function summarizeParentChain(
    element: HTMLElement | null | undefined,
    depth = 4,
): Array<Record<string, unknown> | null> {
    const result: Array<Record<string, unknown> | null> = [];
    let current = element;

    for (let index = 0; current && index < depth; index += 1) {
        result.push(summarizeElementForDebug(current));
        current = current.parentElement;
    }

    return result;
}

function recordKibitzLifecycleEvent(message: string, details: Record<string, unknown> = {}): void {
    if (typeof window === "undefined") {
        return;
    }

    const ring = window.__kibitzLifecycleRing ?? [];
    ring.push({
        sequence: ring.length > 0 ? Number(ring[ring.length - 1]?.sequence ?? 0) + 1 : 1,
        timestamp: Date.now(),
        message,
        ...details,
    });

    while (ring.length > 300) {
        ring.shift();
    }

    window.__kibitzLifecycleRing = ring;
}

export function getCurrentSecondaryVariationBaseTreeIdentity(controller: GobanController): {
    moveTreeId: number | string | null;
} {
    return {
        moveTreeId: controller.goban.engine?.move_tree?.id ?? null,
    };
}

export function clearInstalledSecondaryVariationBaseState(): InstalledSecondaryVariationBaseState {
    return {
        controller: null,
        gameId: null,
        trunkTailMoveNumber: 0,
        moveTreeId: null,
    };
}

export function isCurrentTrackedSecondaryController(params: {
    controller: GobanController | null;
    context: Pick<
        TrackedBoardControllerContext,
        "controller" | "roomId" | "gameId" | "secondaryBoardKey"
    > | null;
    roomId: string;
    expectedGameId: number | null;
    expectedSecondaryBoardKey: string;
    isDetached: boolean;
}): boolean {
    return Boolean(
        params.controller &&
        params.context &&
        params.context.controller === params.controller &&
        params.context.roomId === params.roomId &&
        params.context.gameId === params.expectedGameId &&
        params.context.secondaryBoardKey === params.expectedSecondaryBoardKey &&
        !params.isDetached,
    );
}

export function isCurrentDraftSecondaryController(params: {
    controller: GobanController | null;
    context: Pick<
        TrackedBoardControllerContext,
        "controller" | "roomId" | "gameId" | "secondaryBoardKey"
    > | null;
    roomId: string;
    expectedGameId: number | null;
    expectedSecondaryBoardKey: string;
    currentSecondaryBoardKey: string;
    isDetached: boolean;
}): boolean {
    return Boolean(
        params.controller &&
        params.context &&
        params.context.controller === params.controller &&
        params.context.roomId === params.roomId &&
        params.context.gameId === params.expectedGameId &&
        params.context.secondaryBoardKey === params.expectedSecondaryBoardKey &&
        params.currentSecondaryBoardKey.startsWith(`room-${params.roomId}-draft-`) &&
        !params.isDetached,
    );
}

export function markInstalledSecondaryVariationBaseState(
    controller: GobanController,
    gameId: number,
): InstalledSecondaryVariationBaseState {
    return {
        controller,
        gameId,
        trunkTailMoveNumber: getOfficialTrunkTailMoveNumber(controller),
        ...getCurrentSecondaryVariationBaseTreeIdentity(controller),
    };
}

export function isSecondaryVariationBaseSnapshotInstalled(
    snapshot: SecondaryVariationBaseSnapshot,
    controller: GobanController,
    installed: InstalledSecondaryVariationBaseState,
): boolean {
    const currentTreeIdentity = getCurrentSecondaryVariationBaseTreeIdentity(controller);

    return (
        installed.controller === controller &&
        installed.gameId === snapshot.gameId &&
        installed.trunkTailMoveNumber >= snapshot.trunkTailMoveNumber &&
        installed.moveTreeId === currentTreeIdentity.moveTreeId &&
        getOfficialTrunkTailMoveNumber(controller) >= snapshot.trunkTailMoveNumber
    );
}

function countMoveTreeBranches(moveTree: MoveTree | null | undefined): number {
    if (!moveTree) {
        return 0;
    }

    return (
        moveTree.branches.length +
        moveTree.branches.reduce((count, branch) => count + countMoveTreeBranches(branch), 0) +
        countMoveTreeBranches(moveTree.trunk_next)
    );
}

export function getOfficialTrunkTailMoveNumber(controller: GobanController): number {
    return getOfficialTrunkTail(controller.goban.engine?.move_tree)?.move_number ?? 0;
}

export function getRequiredBranchAttachMoveForVariation(
    variation: KibitzVariationSummary,
    sourceGame: KibitzWatchedGame | null | undefined,
): number | null {
    const from =
        typeof variation.analysis_from === "number" && Number.isFinite(variation.analysis_from)
            ? variation.analysis_from
            : null;
    if (from == null) {
        return null;
    }
    const sourceGameMoveNumber = sourceGame?.move_number;

    if (sourceGameMoveNumber == null) {
        return from + 1;
    }

    if (sourceGameMoveNumber > from) {
        return from + 1;
    }

    return from;
}

export type KibitzVariationApplySkipReason =
    | "missing-analysis-from"
    | "invalid-analysis-from"
    | "wrong-game"
    | "missing-analysis-moves";

interface KibitzApplicableVisibleVariations {
    selectedVariationValid: boolean;
    selectedVariationSkipReason: KibitzVariationApplySkipReason | null;
    applicableVariations: KibitzVariationSummary[];
    skippedVariations: Array<{
        variation: KibitzVariationSummary;
        reason: KibitzVariationApplySkipReason;
    }>;
}

function getVariationAnalysisFromMoveNumber(variation: KibitzVariationSummary): number | null {
    const moveNumber = variation.analysis_from;

    if (typeof moveNumber !== "number") {
        return null;
    }

    if (!Number.isFinite(moveNumber) || moveNumber < 0) {
        return null;
    }

    return moveNumber;
}

function getVariationApplySkipReason(
    variation: KibitzVariationSummary,
    expectedGameId: number | null | undefined,
): KibitzVariationApplySkipReason | null {
    if (expectedGameId != null && variation.game_id !== expectedGameId) {
        return "wrong-game";
    }

    if (typeof variation.analysis_from !== "number") {
        return "missing-analysis-from";
    }

    if (!Number.isFinite(variation.analysis_from) || variation.analysis_from < 0) {
        return "invalid-analysis-from";
    }

    if (
        typeof variation.analysis_moves !== "string" ||
        variation.analysis_moves.trim().length === 0
    ) {
        return "missing-analysis-moves";
    }

    return null;
}

export function getApplicableVisibleVariations(params: {
    selectedVariation: KibitzVariationSummary;
    visibleVariations: readonly KibitzVariationSummary[];
    sourceGame: KibitzWatchedGame | null | undefined;
}): KibitzApplicableVisibleVariations {
    const selectedVariationSkipReason = getVariationApplySkipReason(
        params.selectedVariation,
        params.selectedVariation.game_id,
    );
    const selectedVariationValid = selectedVariationSkipReason == null;
    const applicableVariations: KibitzVariationSummary[] = [];
    const skippedVariations: KibitzApplicableVisibleVariations["skippedVariations"] = [];
    const expectedVisibleGameId = params.sourceGame?.game_id ?? params.selectedVariation.game_id;

    for (const variation of params.visibleVariations) {
        const reason = getVariationApplySkipReason(variation, expectedVisibleGameId);
        if (reason) {
            skippedVariations.push({ variation, reason });
            continue;
        }

        applicableVariations.push(variation);
    }

    if (!selectedVariationValid) {
        return {
            selectedVariationValid,
            selectedVariationSkipReason,
            applicableVariations,
            skippedVariations,
        };
    }

    return {
        selectedVariationValid,
        selectedVariationSkipReason,
        applicableVariations,
        skippedVariations,
    };
}

export function getRequiredSnapshotMoveForVariation(
    variation: KibitzVariationSummary,
    _sourceGame: KibitzWatchedGame | null | undefined,
): number | null {
    const moveNumber = getVariationAnalysisFromMoveNumber(variation);
    if (moveNumber == null) {
        return null;
    }

    // The snapshot only needs the anchor move where the variation branches off.
    // The branch continuation itself is supplied by the variation payload.
    return moveNumber;
}

export function getRequiredVariationSnapshotMoveNumber(
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
): number | null {
    const selectedVariationValidation = getVariationApplySkipReason(
        selectedVariation,
        selectedVariation.game_id,
    );
    if (selectedVariationValidation) {
        return null;
    }

    const applicableVisibleVariations = getApplicableVisibleVariations({
        selectedVariation,
        visibleVariations,
        sourceGame,
    });

    const requiredSnapshotMoves = [
        getRequiredSnapshotMoveForVariation(selectedVariation, sourceGame),
        ...applicableVisibleVariations.applicableVariations.map((variation) =>
            getRequiredSnapshotMoveForVariation(variation, sourceGame),
        ),
    ].filter((moveNumber): moveNumber is number => moveNumber != null);

    if (requiredSnapshotMoves.length === 0) {
        return null;
    }

    return Math.max(...requiredSnapshotMoves);
}

export function isSecondaryVariationSnapshotReady(
    controller: GobanController,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
): boolean {
    const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
        selectedVariation,
        visibleVariations,
        sourceGame,
    );
    if (requiredSnapshotMoveNumber == null) {
        return false;
    }
    const trunkTailMoveNumber = getOfficialTrunkTailMoveNumber(controller);

    return trunkTailMoveNumber >= requiredSnapshotMoveNumber;
}

export function captureSecondaryVariationBaseSnapshot(
    controller: GobanController,
    gameId: number,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
    isDirty: boolean,
    hydration: { controller: GobanController; gameId: number } | null,
): SecondaryVariationBaseSnapshot | null {
    const engine = controller.goban.engine;
    if (!engine?.move_tree) {
        return null;
    }

    if (isDirty) {
        return null;
    }

    if (hydration?.controller !== controller || hydration.gameId !== gameId) {
        return null;
    }

    if (
        !isSecondaryVariationSnapshotReady(
            controller,
            selectedVariation,
            visibleVariations,
            sourceGame,
        )
    ) {
        return null;
    }

    const config = engine.config as KibitzBoardLoadConfig;
    const moveTree = cloneOfficialTrunkMoveTreeJson(engine.move_tree);
    const trunkTailMoveNumber = getOfficialTrunkTailMoveNumber(controller);

    return {
        controller,
        gameId,
        trunkTailMoveNumber,
        config: {
            ...config,
            moves: undefined,
            move_tree: moveTree,
        },
    };
}

export function captureMainBoardBaseSnapshotForVariation(
    mainBoardController: GobanController | null,
    secondaryBoardController: GobanController,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
): SecondaryVariationBaseSnapshot | null {
    if (!mainBoardController || !sourceGame) {
        return null;
    }

    if (sourceGame.game_id !== selectedVariation.game_id) {
        return null;
    }

    const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
        selectedVariation,
        visibleVariations,
        sourceGame,
    );
    if (requiredSnapshotMoveNumber == null) {
        return null;
    }
    const mainTailMoveNumber = getOfficialTrunkTailMoveNumber(mainBoardController);

    if (mainTailMoveNumber < requiredSnapshotMoveNumber) {
        return null;
    }

    const mainEngine = mainBoardController.goban.engine;
    if (!mainEngine?.move_tree) {
        return null;
    }

    return {
        controller: secondaryBoardController,
        gameId: selectedVariation.game_id,
        trunkTailMoveNumber: mainTailMoveNumber,
        config: {
            ...(mainEngine.config as KibitzBoardLoadConfig),
            game_id: selectedVariation.game_id,
            moves: undefined,
            move_tree: cloneOfficialTrunkMoveTreeJson(mainEngine.move_tree),
        },
    };
}

export function buildSecondaryVariationBaseSnapshotFromCurrentGameSnapshot(
    currentGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    secondaryBoardController: GobanController,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame?: KibitzWatchedGame | null | undefined,
): SecondaryVariationBaseSnapshot | null {
    // This is a cloning/building helper, not the same-game freshness authority.
    // It only checks that the snapshot reaches the variation anchor.
    //
    // Same-game posted variations must first pass
    // getSameGameVariationBaseSnapshotState(...), which enforces that
    // currentGameBaseSnapshot has reached the current live main-board tail.
    if (!currentGameBaseSnapshot) {
        return null;
    }

    if (currentGameBaseSnapshot.gameId !== selectedVariation.game_id) {
        return null;
    }

    if (sourceGame && sourceGame.game_id !== selectedVariation.game_id) {
        return null;
    }

    const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
        selectedVariation,
        visibleVariations,
        sourceGame,
    );
    if (requiredSnapshotMoveNumber == null) {
        return null;
    }

    if (currentGameBaseSnapshot.trunkTailMoveNumber < requiredSnapshotMoveNumber) {
        return null;
    }

    if (!currentGameBaseSnapshot.config.move_tree) {
        return null;
    }

    return {
        controller: secondaryBoardController,
        gameId: selectedVariation.game_id,
        trunkTailMoveNumber: currentGameBaseSnapshot.trunkTailMoveNumber,
        config: {
            ...currentGameBaseSnapshot.config,
            game_id: selectedVariation.game_id,
            moves: undefined,
            move_tree: cloneMoveTreeJson(currentGameBaseSnapshot.config.move_tree),
        },
    };
}

export function captureRoomBaseSnapshotForVariation(
    currentGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    secondaryBoardController: GobanController,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame?: KibitzWatchedGame | null | undefined,
): SecondaryVariationBaseSnapshot | null {
    return buildSecondaryVariationBaseSnapshotFromCurrentGameSnapshot(
        currentGameBaseSnapshot,
        secondaryBoardController,
        selectedVariation,
        visibleVariations,
        sourceGame,
    );
}

export function getSameGameVariationBaseSnapshotState({
    currentGameBaseSnapshot,
    currentRoomGameId,
    selectedVariation,
    requiredSnapshotMoveNumber,
    mainBoardOfficialTailMoveNumber,
}: {
    currentGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
    currentRoomGameId: number | null | undefined;
    selectedVariation: KibitzVariationSummary;
    requiredSnapshotMoveNumber: number;
    mainBoardOfficialTailMoveNumber: number;
}): {
    currentLiveTailMoveNumber: number;
    requiredSameGameBaseTailMoveNumber: number;
    currentGameSnapshotGameId: number | null;
    currentGameSnapshotTailMoveNumber: number | null;
    hasCurrentGameSnapshotMoveTree: boolean;
    snapshotUsable: boolean;
} {
    const currentLiveTailMoveNumber = Math.max(
        mainBoardOfficialTailMoveNumber,
        currentGameBaseSnapshot?.trunkTailMoveNumber ?? 0,
    );
    const requiredSameGameBaseTailMoveNumber = Math.max(
        requiredSnapshotMoveNumber,
        currentLiveTailMoveNumber,
    );
    const currentGameSnapshotGameId = currentGameBaseSnapshot?.gameId ?? null;
    const currentGameSnapshotTailMoveNumber = currentGameBaseSnapshot?.trunkTailMoveNumber ?? null;
    const hasCurrentGameSnapshotMoveTree = Boolean(currentGameBaseSnapshot?.config.move_tree);
    const snapshotUsable =
        selectedVariation.game_id === currentRoomGameId &&
        currentGameSnapshotGameId === currentRoomGameId &&
        hasCurrentGameSnapshotMoveTree &&
        (currentGameSnapshotTailMoveNumber ?? 0) >= requiredSameGameBaseTailMoveNumber;

    return {
        currentLiveTailMoveNumber,
        requiredSameGameBaseTailMoveNumber,
        currentGameSnapshotGameId,
        currentGameSnapshotTailMoveNumber,
        hasCurrentGameSnapshotMoveTree,
        snapshotUsable,
    };
}

function loadSecondaryVariationBaseSnapshot(
    controller: GobanController,
    snapshot: SecondaryVariationBaseSnapshot,
): void {
    const goban = controller.goban;
    const previousMode: GobanModes = goban.mode;
    const previousEngine = goban.engine;
    const debugEnabled = isKibitzVariationDebugEnabled();
    const branchCountBeforeLoad = debugEnabled
        ? countMoveTreeBranches(previousEngine?.move_tree)
        : undefined;

    /*
     * Goban.load preserves the old engine for finished analyze boards when the
     * old tree contains the new tree as a subset. That is useful for ordinary
     * analysis, but posted variation recomposition needs the saved clean trunk
     * to replace a dirty composed tree exactly.
     */
    if (goban.mode === "analyze") {
        goban.mode = "play";
    }

    try {
        recordKibitzLifecycleEvent("secondary-snapshot-load:start", {
            gameId: snapshot.gameId,
            trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
            controllerGameId: controller.goban.config?.game_id ?? null,
            connected: Boolean(controller.goban.parent?.isConnected),
        });
        goban.load({
            ...snapshot.config,
            move_tree: snapshot.config.move_tree
                ? cloneMoveTreeJson(snapshot.config.move_tree)
                : undefined,
        });
    } finally {
        goban.mode = previousMode;
    }

    if (debugEnabled) {
        logKibitzVariationDebug("snapshot-load:result", {
            gameId: snapshot.gameId,
            previousMode,
            engineReplaced: previousEngine !== goban.engine,
            branchCountBeforeLoad,
            branchCountAfterLoad: countMoveTreeBranches(goban.engine?.move_tree),
            officialTail: summarizeKibitzMoveTreeNode(
                getOfficialTrunkTail(goban.engine?.move_tree),
            ),
        });
    }

    recordKibitzLifecycleEvent("secondary-snapshot-load:done", {
        gameId: snapshot.gameId,
        trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
        controllerGameId: controller.goban.config?.game_id ?? null,
        connected: Boolean(controller.goban.parent?.isConnected),
    });
}

function hasUsableMoveTreeContainerSize(container: HTMLElement | null): boolean {
    if (!container) {
        return false;
    }

    const rect = container.getBoundingClientRect();

    return rect.width > 20 && rect.height > 20;
}

function scheduleNoWarpMoveTreeRedrawWhenReady(
    goban: { move_tree_redraw?: (no_warp?: boolean) => void } | null | undefined,
    container: HTMLElement | null,
    attempts = 5,
): () => void {
    let frame1: number | null = null;
    let frame2: number | null = null;
    let cancelled = false;

    const scheduleAttempt = (remainingAttempts: number) => {
        if (cancelled) {
            return;
        }

        frame1 = window.requestAnimationFrame(() => {
            frame1 = null;

            if (cancelled) {
                return;
            }

            frame2 = window.requestAnimationFrame(() => {
                frame2 = null;

                if (cancelled) {
                    return;
                }

                if (container && !hasUsableMoveTreeContainerSize(container)) {
                    if (remainingAttempts > 0) {
                        scheduleAttempt(remainingAttempts - 1);
                    }
                    return;
                }

                goban?.move_tree_redraw?.(true);
            });
        });
    };

    scheduleAttempt(attempts);

    return () => {
        cancelled = true;

        if (frame1 !== null) {
            window.cancelAnimationFrame(frame1);
        }

        if (frame2 !== null) {
            window.cancelAnimationFrame(frame2);
        }
    };
}

function scheduleVisibleBoardRedrawWhenReady(
    controller: GobanController | null | undefined,
    role: "main" | "secondary" | "variation" | "preview",
    reason: string,
    options?: {
        expectedSize?: number | null;
        onDeferred?: () => void;
        onDetached?: (details: {
            width: number;
            height: number;
            measuredElement: Record<string, unknown> | null;
            parentChain: Array<Record<string, unknown> | null>;
        }) => void;
        isControllerCurrent?: () => boolean;
    },
    attempts = 5,
): () => void {
    let frame1: number | null = null;
    let frame2: number | null = null;
    let cancelled = false;
    let deferredLogged = false;
    const debugEnabled = isKibitzVariationDebugEnabled();
    const scheduledController = controller ?? null;
    const scheduledGoban = scheduledController?.goban ?? null;

    recordKibitzLifecycleEvent("visible-goban:redraw-schedule", {
        role,
        reason,
        controllerGameId: scheduledController?.goban.config?.game_id ?? null,
        connected: Boolean(scheduledController?.goban.parent?.isConnected),
        hasCurrentGuard: Boolean(options?.isControllerCurrent),
    });
    if (debugEnabled) {
        const controllerParent = scheduledController?.goban.parent ?? null;
        logKibitzVariationDebug("visible-goban:redraw-schedule", {
            role,
            reason,
            expectedSize: options?.expectedSize ?? null,
            controllerGameId: scheduledController?.goban.config?.game_id ?? null,
            controllerConnected: Boolean(controllerParent?.isConnected),
            controllerMeasuredElement: summarizeElementForDebug(controllerParent),
            controllerParentChain: summarizeParentChain(controllerParent),
            controllerCurrent: options?.isControllerCurrent?.() ?? null,
        });
    }

    const scheduleAttempt = (remainingAttempts: number) => {
        if (cancelled) {
            return;
        }

        frame1 = window.requestAnimationFrame(() => {
            frame1 = null;

            if (cancelled) {
                return;
            }

            frame2 = window.requestAnimationFrame(() => {
                frame2 = null;

                if (cancelled) {
                    return;
                }

                if (options?.isControllerCurrent && !options.isControllerCurrent()) {
                    recordKibitzLifecycleEvent("visible-goban:redraw-skip-stale-controller", {
                        role,
                        reason,
                    });
                    if (debugEnabled) {
                        const controllerParent = scheduledController?.goban.parent ?? null;
                        logKibitzVariationDebug("visible-goban:redraw-stale-controller", {
                            role,
                            reason,
                            expectedSize: options?.expectedSize ?? null,
                            controllerGameId: scheduledController?.goban.config?.game_id ?? null,
                            controllerConnected: Boolean(controllerParent?.isConnected),
                            controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                            controllerParentChain: summarizeParentChain(controllerParent),
                        });
                    }
                    return;
                }

                if (!scheduledController || !scheduledGoban) {
                    recordKibitzLifecycleEvent("visible-goban:redraw-skip-missing-goban", {
                        role,
                        reason,
                    });
                    return;
                }

                if (scheduledController.goban !== scheduledGoban) {
                    recordKibitzLifecycleEvent("visible-goban:redraw-skip-replaced-goban", {
                        role,
                        reason,
                    });
                    return;
                }

                const maybeDestroyedGoban = scheduledGoban as unknown as {
                    destroyed?: boolean;
                    renderer?: { destroyed?: boolean };
                };
                if (maybeDestroyedGoban.destroyed || maybeDestroyedGoban.renderer?.destroyed) {
                    recordKibitzLifecycleEvent("visible-goban:redraw-skip-destroyed", {
                        role,
                        reason,
                    });
                    return;
                }

                const container = scheduledGoban.parent ?? null;
                const measuredElement = summarizeElementForDebug(container);
                const parentChain = summarizeParentChain(container);
                const detached = !container || !container.isConnected || parentChain.length <= 1;
                if (detached) {
                    recordKibitzLifecycleEvent("visible-goban:redraw-skip-detached", {
                        role,
                        reason,
                        hasContainer: Boolean(container),
                        connected: Boolean(container?.isConnected),
                    });
                    const width = container?.clientWidth ?? 0;
                    const height = container?.clientHeight ?? 0;
                    if (debugEnabled) {
                        logKibitzVariationDebug("visible-goban:redraw-detached", {
                            role,
                            reason,
                            width,
                            height,
                            expectedSize: options?.expectedSize ?? null,
                            controllerGameId: scheduledController?.goban.config?.game_id ?? null,
                            controllerConnected: Boolean(container?.isConnected),
                            measuredElement,
                            parentChain,
                        });
                    }
                    options?.onDetached?.({
                        width,
                        height,
                        measuredElement,
                        parentChain,
                    });
                    return;
                }

                const width = container?.clientWidth ?? 0;
                const height = container?.clientHeight ?? 0;
                const expectedSize = options?.expectedSize ?? null;
                const expectedSizeReady =
                    typeof expectedSize === "number" &&
                    Number.isFinite(expectedSize) &&
                    expectedSize > 0;

                if (width <= 0 || height <= 0) {
                    if (!deferredLogged) {
                        deferredLogged = true;
                        if (debugEnabled) {
                            logKibitzVariationDebug("visible-goban:redraw-deferred-zero-size", {
                                role,
                                reason,
                                width,
                                height,
                                expectedSize: options?.expectedSize ?? null,
                                controllerGameId:
                                    scheduledController?.goban.config?.game_id ?? null,
                                controllerConnected: Boolean(container?.isConnected),
                                measuredElement: summarizeElementForDebug(container),
                                parentChain: summarizeParentChain(container),
                            });
                        }
                        if (!expectedSizeReady) {
                            options?.onDeferred?.();
                        }
                    }
                    if (remainingAttempts > 0) {
                        scheduleAttempt(remainingAttempts - 1);
                    }
                    return;
                }

                const currentMoveNumber = scheduledGoban.engine?.cur_move?.move_number ?? null;
                const officialTailMoveNumber =
                    getOfficialTrunkTail(scheduledGoban.engine?.move_tree)?.move_number ?? null;

                recordKibitzLifecycleEvent("visible-goban:redraw-request", {
                    role,
                    reason,
                    controllerGameId: scheduledGoban.config?.game_id ?? null,
                    connected: Boolean(scheduledGoban.parent?.isConnected),
                });
                if (debugEnabled) {
                    logKibitzVariationDebug("visible-goban:redraw-request", {
                        role,
                        reason,
                        width,
                        height,
                        controllerGameId: scheduledGoban.config?.game_id ?? null,
                        controllerConnected: Boolean(scheduledGoban.parent?.isConnected),
                        currentMoveNumber,
                        officialTailMoveNumber,
                    });
                }

                scheduledGoban.move_tree_redraw(true);
                scheduledGoban.redraw(true);
            });
        });
    };

    scheduleAttempt(attempts);

    return () => {
        cancelled = true;

        if (frame1 !== null) {
            window.cancelAnimationFrame(frame1);
        }

        if (frame2 !== null) {
            window.cancelAnimationFrame(frame2);
        }
    };
}

function getVariationColorIndex(
    variationColorIndexes: Record<string, number>,
    variationId: string,
): number | null {
    const value = variationColorIndexes[variationId];
    return typeof value === "number" ? value : null;
}

export function isSelectedVariationVisible(
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
): boolean {
    return visibleVariations.some((variation) => variation.id === selectedVariation.id);
}

export function getVariationsToApply(
    _selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
): KibitzVariationSummary[] {
    const byId = new Map<string, KibitzVariationSummary>();

    for (const variation of visibleVariations) {
        byId.set(variation.id, variation);
    }

    return [...byId.values()];
}

export function KibitzRoomStage({
    room,
    rooms,
    variationGameById,
    currentGameBaseSnapshot,
    proposals,
    variations,
    visibleVariationIds,
    variationColorIndexes,
    secondaryPane,
    onClearPreview,
    onPostVariation,
    onSetSecondaryPaneMode,
    onChangeBoard,
    canEditRoom = false,
    canDeleteRoom = false,
    onSaveRoomDetails,
    onDeleteRoom,
    streamerMode,
    onStreamerModeChange,
    onCreateVariation,
    onCreateVariationFromPostedVariation,
    variationFocusRequestId,
    isMobileLayout = false,
    mobileCompanionPanel,
    mobileHasActiveVote = false,
    mobileDividerDragging = false,
    onMobileBoardTransientDragControllerChange,
    onMobileBoardSizeChange,
    onSelectMobileCompanionPanel,
    onOpenMobileRooms,
    onMobileCompareControllerChange,
    onMainBoardControllerChange,
    onMainBoardHydrationChange,
}: KibitzRoomStageProps): React.ReactElement {
    const mainGame = room.current_game;
    const currentRoomGameId = mainGame?.game_id ?? null;
    const secondaryGameId = secondaryPane.preview_game_id;
    const secondaryPaneSize = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");
    const selectedVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    const draftBaseVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_draft_base_id,
    );
    const isDraftingVariation = secondaryPane.variation_source_game_id != null;
    const desktopRoomTitleTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomTitle);
    const desktopRoomSettingsTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomSettings);
    const desktopMainBoardTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopMainBoard);
    const desktopVariationBoardTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.desktopVariationBoard,
    );
    const desktopVariationActionsTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.desktopVariationActions,
    );
    const mobileMainBoardTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileMainBoard);
    const mobileVariationBoardTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.mobileVariationBoard,
    );
    const mobilePanelSwitcherTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobilePanelSwitcher);
    const mobileVariationsTabTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileVariationsTab);
    const mobileVariationActionsTarget = useKibitzHelpTarget(
        KIBITZ_HELP_TARGETS.mobileVariationActions,
    );
    const openRoomSettings = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            close_all_popovers();
            popover({
                elt: (
                    <KibitzRoomSettingsPopover
                        room={room}
                        canEditRoom={canEditRoom}
                        canDeleteRoom={canDeleteRoom}
                        canChangeBoard={Boolean(onChangeBoard)}
                        isMobileLayout={false}
                        streamerMode={streamerMode}
                        onStreamerModeChange={onStreamerModeChange}
                        onClose={close_all_popovers}
                        onRequestChangeBoard={() => {
                            close_all_popovers();
                            onChangeBoard?.();
                        }}
                        onDeleteRoom={onDeleteRoom ?? (async () => false)}
                        onSaveRoomDetails={onSaveRoomDetails ?? (async () => false)}
                    />
                ),
                below: event.currentTarget,
                minWidth: 220,
                container_class: "KibitzRoomStage-settingsPopoverContainer",
            });
        },
        [
            canDeleteRoom,
            canEditRoom,
            onChangeBoard,
            onDeleteRoom,
            onSaveRoomDetails,
            onStreamerModeChange,
            room,
            streamerMode,
        ],
    );
    const selectedVariationGameId = selectedVariation?.game_id ?? null;
    const [selectedGameBaseSnapshot, setSelectedGameBaseSnapshot] =
        React.useState<KibitzCurrentGameBaseSnapshot | null>(null);
    const [selectedGameBaseSnapshotLoadingGameId, setSelectedGameBaseSnapshotLoadingGameId] =
        React.useState<number | null>(null);
    const selectedGameBaseSnapshotCacheRef = React.useRef<
        Map<number, KibitzCurrentGameBaseSnapshot>
    >(new Map());
    const selectedGameBaseSnapshotFailuresRef = React.useRef<
        Map<SelectedGameSnapshotFailureKey, SelectedGameBaseSnapshotFailure>
    >(new Map());
    const selectedGameBaseSnapshotPendingRef = React.useRef<Set<SelectedGameSnapshotFailureKey>>(
        new Set(),
    );
    const selectedGameBaseSnapshotRequestIdRef = React.useRef(0);
    const selectedVariationGameIdRef = React.useRef<number | null>(selectedVariationGameId);
    React.useEffect(() => {
        selectedVariationGameIdRef.current = selectedVariationGameId;
        setSelectedGameBaseSnapshot((previous) =>
            previous?.gameId === selectedVariationGameId ? previous : null,
        );
        setSelectedGameBaseSnapshotLoadingGameId((previous) =>
            previous === selectedVariationGameId ? previous : null,
        );
        selectedGameBaseSnapshotRequestIdRef.current += 1;
    }, [selectedVariationGameId]);
    const selectedVariationSourceGame = React.useMemo(() => {
        return resolveSelectedVariationSourceGame(
            selectedVariation,
            mainGame,
            rooms,
            variationGameById,
            secondaryPane.variation_source_game,
        );
    }, [
        mainGame,
        rooms,
        secondaryPane.variation_source_game,
        selectedVariation,
        variationGameById,
    ]);
    const visibleVariations = React.useMemo(() => {
        if (selectedVariationGameId == null) {
            return [];
        }

        return visibleVariationIds
            .map((variationId) => variations.find((variation) => variation.id === variationId))
            .filter(
                (variation): variation is KibitzVariationSummary =>
                    variation != null && variation.game_id === selectedVariationGameId,
            );
    }, [selectedVariationGameId, variations, visibleVariationIds]);
    const selectedVariationApplyKey = React.useMemo(() => {
        if (!selectedVariation) {
            return "none";
        }

        return selectedVariation.id;
    }, [selectedVariation]);
    const visibleVariationApplyKey = React.useMemo(
        () => visibleVariations.map((variation) => variation.id).join("\n"),
        [visibleVariations],
    );
    const selectedVariationBaseSnapshotIdentity = React.useMemo(
        () =>
            getSelectedVariationBaseSnapshotIdentity({
                selectedVariationGameId,
                selectedGameBaseSnapshot,
                currentGameBaseSnapshot,
            }),
        [currentGameBaseSnapshot, selectedGameBaseSnapshot, selectedVariationGameId],
    );
    const logSelectedGameSnapshotDebug = React.useCallback(
        (message: string, extra: Record<string, unknown> = {}): void => {
            logKibitzVariationDebug(message, {
                selectedVariationId: selectedVariation?.id ?? null,
                selectedGameId: selectedVariationGameId,
                currentRoomGameId,
                requiredSnapshotMoveNumber:
                    typeof extra.requiredSnapshotMoveNumber === "number"
                        ? extra.requiredSnapshotMoveNumber
                        : null,
                snapshotGameId:
                    typeof extra.snapshotGameId === "number" ? extra.snapshotGameId : null,
                trunkTailMoveNumber:
                    typeof extra.trunkTailMoveNumber === "number"
                        ? extra.trunkTailMoveNumber
                        : null,
                failureKind: typeof extra.failureKind === "string" ? extra.failureKind : null,
                retryAfter: typeof extra.retryAfter === "number" ? extra.retryAfter : null,
                ...extra,
            });
        },
        [currentRoomGameId, selectedVariation?.id, selectedVariationGameId],
    );
    const recordSelectedGameSnapshotFailureForCurrent = React.useCallback(
        (params: {
            gameId: number;
            variationId: string | null;
            requiredMoveNumber: number;
            kind: SelectedGameBaseSnapshotFailureKind;
            retryAfter?: number;
            message?: string;
            details?: Record<string, unknown>;
        }): SelectedGameBaseSnapshotFailure => {
            const failure = recordSelectedGameSnapshotFailure(
                selectedGameBaseSnapshotFailuresRef.current,
                params,
            );
            logSelectedGameSnapshotDebug("selected-game-base-snapshot:failure-recorded", {
                selectedGameId: params.gameId,
                selectedVariationId: params.variationId,
                requiredSnapshotMoveNumber: params.requiredMoveNumber,
                failureKind: params.kind,
                retryAfter: params.retryAfter ?? null,
                message: params.message ?? null,
                details: params.details ?? null,
            });
            return failure;
        },
        [logSelectedGameSnapshotDebug],
    );
    const clearSelectedGameSnapshotFailureForCurrent = React.useCallback(
        (gameId: number, requiredMoveNumber: number): void => {
            clearSelectedGameSnapshotFailure(
                selectedGameBaseSnapshotFailuresRef.current,
                gameId,
                requiredMoveNumber,
            );
        },
        [],
    );
    const getBlockingSelectedGameSnapshotFailure = React.useCallback(
        (gameId: number, requiredMoveNumber: number): SelectedGameBaseSnapshotFailure | null =>
            getSelectedGameSnapshotBlockingFailure(selectedGameBaseSnapshotFailuresRef.current, {
                gameId,
                requiredMoveNumber,
            }),
        [],
    );
    const isSelectedGameSnapshotPending = React.useCallback(
        (gameId: number, requiredMoveNumber: number): boolean =>
            selectedGameBaseSnapshotPendingRef.current.has(
                selectedGameSnapshotFailureKey(gameId, requiredMoveNumber),
            ),
        [],
    );
    const variationColorApplyKey = React.useMemo(() => {
        const selectedColorKey = selectedVariation
            ? `${selectedVariation.id}:${variationColorIndexes[selectedVariation.id] ?? "missing"}`
            : "none";

        return [
            selectedColorKey,
            ...visibleVariations.map(
                (variation) =>
                    `${variation.id}:${variationColorIndexes[variation.id] ?? "missing"}`,
            ),
        ].join("\n");
    }, [selectedVariation?.id, variationColorIndexes, visibleVariations]);
    const requestSelectedGameBaseSnapshotForGame = React.useCallback(
        async (params: {
            gameId: number;
            variationId: string | null;
            requiredSnapshotMoveNumber: number;
            installAsActiveSelectedSnapshot?: boolean;
        }): Promise<KibitzCurrentGameBaseSnapshot | null> => {
            const {
                gameId,
                variationId,
                requiredSnapshotMoveNumber,
                installAsActiveSelectedSnapshot = false,
            } = params;
            const requestKey = selectedGameSnapshotFailureKey(gameId, requiredSnapshotMoveNumber);
            const cachedSnapshot = selectedGameBaseSnapshotCacheRef.current.get(gameId);
            const cachedSnapshotIsFreshEnough =
                cachedSnapshot != null &&
                isSelectedGameBaseSnapshotFreshEnough(
                    cachedSnapshot,
                    gameId,
                    requiredSnapshotMoveNumber,
                );
            if (cachedSnapshotIsFreshEnough) {
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:cache-hit", {
                    selectedVariationId: variationId,
                    selectedGameId: gameId,
                    currentRoomGameId,
                    requiredSnapshotMoveNumber,
                    snapshotGameId: cachedSnapshot.gameId,
                    trunkTailMoveNumber: cachedSnapshot.trunkTailMoveNumber,
                    source: cachedSnapshot.source,
                    failureKind: null,
                    retryAfter: null,
                    installAsActiveSelectedSnapshot,
                });
                clearSelectedGameSnapshotFailureForCurrent(gameId, requiredSnapshotMoveNumber);
                return cachedSnapshot;
            }

            if (cachedSnapshot) {
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:cache-stale", {
                    selectedGameId: gameId,
                    requiredSnapshotMoveNumber,
                    cachedTailMoveNumber: cachedSnapshot.trunkTailMoveNumber,
                    source: cachedSnapshot.source,
                    installAsActiveSelectedSnapshot,
                });
                selectedGameBaseSnapshotCacheRef.current.delete(gameId);
            }

            const blockingFailure = getBlockingSelectedGameSnapshotFailure(
                gameId,
                requiredSnapshotMoveNumber,
            );
            if (blockingFailure) {
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:blocked-by-failure", {
                    selectedGameId: gameId,
                    requiredSnapshotMoveNumber,
                    failureKind: blockingFailure.kind,
                    retryAfter: blockingFailure.retryAfter ?? null,
                    failure: blockingFailure,
                    installAsActiveSelectedSnapshot,
                });
                return null;
            }

            if (selectedGameBaseSnapshotPendingRef.current.has(requestKey)) {
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:already-pending", {
                    selectedGameId: gameId,
                    requiredSnapshotMoveNumber,
                    installAsActiveSelectedSnapshot,
                });
                return null;
            }

            selectedGameBaseSnapshotPendingRef.current.add(requestKey);
            clearSelectedGameSnapshotFailureForCurrent(gameId, requiredSnapshotMoveNumber);
            logSelectedGameSnapshotDebug("selected-game-base-snapshot:request", {
                selectedGameId: gameId,
                requiredSnapshotMoveNumber,
                failureKind: null,
                retryAfter: null,
                installAsActiveSelectedSnapshot,
            });

            try {
                const result = await fetchSelectedGameBaseSnapshot({
                    gameId,
                    roomId: room.id,
                    requiredSnapshotMoveNumber,
                    logDebug: logSelectedGameSnapshotDebug,
                });

                if (result.kind === "failure") {
                    const failure = recordSelectedGameSnapshotFailureForCurrent({
                        gameId,
                        variationId,
                        requiredMoveNumber: requiredSnapshotMoveNumber,
                        kind: result.failure.kind,
                        retryAfter: result.failure.retryAfter,
                        message: result.failure.message,
                        details: result.failure.details,
                    });
                    logSelectedGameSnapshotDebug(
                        `selected-game-base-snapshot:${
                            result.failure.kind === "missing-moves"
                                ? "missing-moves"
                                : result.failure.kind === "not-fresh-enough"
                                  ? "not-fresh-enough"
                                  : "error"
                        }`,
                        {
                            selectedGameId: gameId,
                            requiredSnapshotMoveNumber,
                            failureKind: failure.kind,
                            retryAfter: failure.retryAfter ?? null,
                            trunkTailMoveNumber:
                                (failure.details?.trunkTailMoveNumber as number | undefined) ??
                                null,
                            failure,
                            installAsActiveSelectedSnapshot,
                        },
                    );
                    return null;
                }

                const snapshot = result.snapshot;
                selectedGameBaseSnapshotCacheRef.current.set(gameId, snapshot);
                clearSelectedGameSnapshotFailureForCurrent(gameId, requiredSnapshotMoveNumber);

                logSelectedGameSnapshotDebug("selected-game-base-snapshot:fetched", {
                    selectedGameId: gameId,
                    requiredSnapshotMoveNumber,
                    snapshotGameId: snapshot.gameId,
                    trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
                    source: snapshot.source,
                    failureKind: null,
                    retryAfter: null,
                    installAsActiveSelectedSnapshot,
                });
                return snapshot;
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return null;
                }

                const failure = buildSelectedGameSnapshotFailureFromError({
                    error,
                    gameId,
                    variationId,
                    requiredMoveNumber: requiredSnapshotMoveNumber,
                });
                const recordedFailure = recordSelectedGameSnapshotFailureForCurrent({
                    gameId: failure.gameId,
                    variationId: failure.variationId,
                    requiredMoveNumber: failure.requiredMoveNumber,
                    kind: failure.kind,
                    retryAfter: failure.retryAfter,
                    message: failure.message,
                    details: failure.details,
                });
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:error", {
                    selectedGameId: gameId,
                    requiredSnapshotMoveNumber,
                    failureKind: recordedFailure.kind,
                    retryAfter: recordedFailure.retryAfter ?? null,
                    error: recordedFailure.message ?? getSelectedGameSnapshotErrorMessage(error),
                    failure: recordedFailure,
                    installAsActiveSelectedSnapshot,
                });
                return null;
            } finally {
                selectedGameBaseSnapshotPendingRef.current.delete(requestKey);
            }
        },
        [
            clearSelectedGameSnapshotFailureForCurrent,
            currentRoomGameId,
            getBlockingSelectedGameSnapshotFailure,
            logSelectedGameSnapshotDebug,
            recordSelectedGameSnapshotFailureForCurrent,
            room.id,
        ],
    );
    const requestSelectedGameBaseSnapshot = React.useCallback(
        async (requiredSnapshotMoveNumber: number): Promise<void> => {
            if (selectedVariationGameId == null) {
                return;
            }

            const selectedGameId = selectedVariationGameId;
            const requestId = selectedGameBaseSnapshotRequestIdRef.current + 1;
            selectedGameBaseSnapshotRequestIdRef.current = requestId;
            setSelectedGameBaseSnapshotLoadingGameId(selectedGameId);

            const snapshot = await requestSelectedGameBaseSnapshotForGame({
                gameId: selectedGameId,
                variationId: selectedVariation?.id ?? null,
                requiredSnapshotMoveNumber,
                installAsActiveSelectedSnapshot: true,
            });

            if (
                requestId !== selectedGameBaseSnapshotRequestIdRef.current ||
                selectedVariationGameIdRef.current !== selectedGameId
            ) {
                logSelectedGameSnapshotDebug("selected-game-base-snapshot:stale-result-ignored", {
                    selectedVariationGameId: selectedVariationGameIdRef.current ?? null,
                    requestId,
                    latestRequestId: selectedGameBaseSnapshotRequestIdRef.current,
                    selectedGameId,
                    requiredSnapshotMoveNumber,
                    failureKind: null,
                    retryAfter: null,
                });
                setSelectedGameBaseSnapshotLoadingGameId((current) =>
                    current === selectedGameId ? null : current,
                );
                return;
            }

            if (snapshot) {
                setSelectedGameBaseSnapshot(snapshot);
            }

            setSelectedGameBaseSnapshotLoadingGameId((current) =>
                current === selectedGameId ? null : current,
            );
        },
        [
            logSelectedGameSnapshotDebug,
            requestSelectedGameBaseSnapshotForGame,
            selectedVariation?.id,
            selectedVariationGameId,
        ],
    );
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryGameId)
            ?.current_game ??
        proposals.find((proposal) => proposal.proposed_game.game_id === secondaryGameId)
            ?.proposed_game;
    const secondaryBoardGame = previewGame ?? secondaryPane.variation_source_game;
    const expectedSecondaryBoardGameId =
        selectedVariationGameId ??
        secondaryGameId ??
        secondaryPane.variation_source_game_id ??
        null;
    const previewDisplayedMoveNumber = secondaryBoardGame?.move_number;
    const mainReturnLiveLabel =
        secondaryPaneSize === "equal"
            ? pgettext(
                  "Button label for returning the kibitz main board to the live move in compare mode",
                  "To live",
              )
            : pgettext(
                  "Button label for returning the kibitz main board to the live move",
                  "Back to live",
              );
    const [mainBoardController, setMainBoardControllerState] =
        React.useState<GobanController | null>(null);
    const [mainReturnLiveAvailable, setMainReturnLiveAvailable] = React.useState(false);
    const [mainBoardOfficialTailMoveNumber, setMainBoardOfficialTailMoveNumber] = React.useState(
        mainGame?.move_number ?? 0,
    );
    // Wrap the setter so the parent (KibitzInner) is notified whenever the
    // main board's controller is (re)created. Lets the parent provide it via
    // GobanControllerContext so descendants like KibitzSharedStreamPanel can
    // hook into the watched game's chat without prop drilling.
    React.useEffect(() => {
        currentRoomIdRef.current = room.id;
    }, [room.id]);

    React.useEffect(() => {
        currentRoomGameIdRef.current = currentRoomGameId;
    }, [currentRoomGameId]);

    const setMainBoardController = React.useCallback(
        (controller: GobanController | null) => {
            mainBoardControllerEpochRef.current += 1;
            mainBoardControllerContextRef.current = controller
                ? {
                      controller,
                      epoch: mainBoardControllerEpochRef.current,
                      roomId: currentRoomIdRef.current,
                      gameId: currentRoomGameIdRef.current,
                      secondaryBoardKey: null,
                  }
                : null;
            setMainBoardControllerState(controller);
            onMainBoardControllerChange?.(controller);
        },
        [onMainBoardControllerChange],
    );
    const [secondaryBoardController, setSecondaryBoardControllerState] =
        React.useState<GobanController | null>(null);
    const [secondaryReturnLiveAvailable, setSecondaryReturnLiveAvailable] = React.useState(false);
    const [mobileReturnLiveAvailable, setMobileReturnLiveAvailable] = React.useState(false);
    const [secondaryBoardRemountNonce, bumpSecondaryBoardRemountNonce] = React.useReducer(
        (value: number) => value + 1,
        0,
    );
    const [secondaryMoveTreeContainer, setSecondaryMoveTreeContainer] =
        React.useState<Resizable | null>(null);
    const secondaryMoveTreeContainerRef = React.useRef<Resizable | null>(null);
    const previousSecondaryControllerRef = React.useRef<GobanController | null>(null);
    const mainBoardControllerEpochRef = React.useRef(0);
    const secondaryBoardControllerEpochRef = React.useRef(0);
    const mainBoardControllerContextRef = React.useRef<TrackedBoardControllerContext | null>(null);
    const secondaryBoardControllerContextRef = React.useRef<TrackedBoardControllerContext | null>(
        null,
    );
    const currentRoomIdRef = React.useRef(room.id);
    const currentRoomGameIdRef = React.useRef(currentRoomGameId);
    const mainBoardExpectedMoveNumberRef = React.useRef(mainGame?.move_number ?? 0);
    const mainBoardExpectedGameIdRef = React.useRef(mainGame?.game_id ?? null);
    const mainBoardLastReportedExpectedMoveNumberRef = React.useRef(mainGame?.move_number ?? 0);
    const mainBoardLastReportedExpectedGameIdRef = React.useRef(mainGame?.game_id ?? null);
    const logSecondaryBoardStaleCallback = React.useCallback(
        (reason: string, details: Record<string, unknown> = {}) => {
            logKibitzVariationDebug("secondary-board:stale-callback-ignored", {
                reason,
                roomId: room.id,
                currentRoomGameId,
                selectedVariationId: selectedVariation?.id ?? null,
                selectedGameId: selectedVariationGameId,
                visibleVariationKey: visibleVariationApplyKey,
                controllerEpoch: secondaryBoardControllerEpochRef.current,
                remountNonce: secondaryBoardRemountNonce,
                ...details,
            });
        },
        [
            currentRoomGameId,
            room.id,
            secondaryBoardRemountNonce,
            selectedVariation?.id,
            selectedVariationGameId,
            visibleVariationApplyKey,
        ],
    );
    const requestSecondaryBoardDetachedRemount = React.useCallback(
        (reason: string, details: Record<string, unknown> = {}) => {
            if (isKibitzVariationDebugEnabled()) {
                const controller = secondaryBoardController;
                const controllerParent = controller?.goban.parent ?? null;
                logKibitzVariationDebug("secondary-board:detached-remount-reset", {
                    reason,
                    roomId: room.id,
                    selectedVariationId: selectedVariation?.id ?? null,
                    selectedGameId: selectedVariationGameId,
                    currentRoomGameId,
                    visibleVariationKey: visibleVariationApplyKey,
                    desiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
                    controllerEpoch: secondaryBoardControllerEpochRef.current,
                    controllerGameId: controller?.goban.config?.game_id ?? null,
                    controllerConnected: Boolean(controllerParent?.isConnected),
                    controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                    controllerParentChain: summarizeParentChain(controllerParent),
                    secondaryBoardRemountNonce,
                    ...details,
                });
            }

            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("secondary-board:detached-remount-requested", {
                    reason,
                    roomId: room.id,
                    selectedVariationId: selectedVariation?.id ?? null,
                    selectedGameId: selectedVariationGameId,
                    currentRoomGameId,
                    visibleVariationKey: visibleVariationApplyKey,
                    desiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
                    secondaryBoardRemountNonce,
                    ...details,
                });
            }

            secondaryBoardControllerEpochRef.current += 1;
            secondaryBoardControllerContextRef.current = null;
            secondaryVariationBaseSnapshotRef.current = null;
            secondaryVariationTreeDirtyRef.current = false;
            secondaryVariationBaseInstalledRef.current =
                clearInstalledSecondaryVariationBaseState();
            secondaryVariationBaseHydrationRef.current = null;
            pendingSecondaryVariationBaseLoadRef.current = null;
            suppressSelectedVariationLoadRef.current = false;
            secondaryVariationRetryCountRef.current = 0;
            secondarySnapshotLoadOperationIdRef.current += 1;
            lastAppliedSecondaryVariationKeyRef.current = null;
            pendingSecondaryRedrawReasonRef.current = null;
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
            pendingSecondaryBoardVisibleRedrawCancelRef.current?.();
            pendingSecondaryBoardVisibleRedrawCancelRef.current = null;
            if (secondaryVariationRetryTimeoutRef.current != null) {
                window.clearTimeout(secondaryVariationRetryTimeoutRef.current);
                secondaryVariationRetryTimeoutRef.current = null;
            }
            previousSecondaryControllerRef.current = null;
            setSecondaryReturnLiveAvailable(false);
            setSecondaryBoardControllerState(null);
            bumpSecondaryBoardRemountNonce();
        },
        [
            currentRoomGameId,
            room.id,
            secondaryBoardRemountNonce,
            selectedVariation?.id,
            selectedVariationGameId,
            visibleVariationApplyKey,
        ],
    );
    const isDetachedBoardController = React.useCallback((controller: GobanController | null) => {
        return !controller?.goban.parent || !controller.goban.parent.isConnected;
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
                !isDetachedBoardController(controller),
            );
        },
        [isDetachedBoardController],
    );
    const isCurrentSecondaryBoardController = React.useCallback(
        (controller: GobanController | null | undefined) => {
            const currentSecondaryBoardKey =
                secondaryPane.variation_id != null
                    ? selectedVariationGameId != null
                        ? `room-${room.id}-variation-game-${selectedVariationGameId}-remount-${secondaryBoardRemountNonce}`
                        : `variation-${secondaryPane.variation_id}-remount-${secondaryBoardRemountNonce}`
                    : secondaryPane.variation_source_game_id != null
                      ? `room-${room.id}-draft-${secondaryPane.variation_source_game_id}-${
                            secondaryPane.variation_draft_base_id ?? ""
                        }-${secondaryPane.variation_source_move_tree_id ?? ""}-${
                            secondaryPane.variation_source_move_path ?? ""
                        }-remount-${secondaryBoardRemountNonce}`
                      : secondaryPane.preview_game_id != null
                        ? `room-${room.id}-preview-${secondaryPane.preview_game_id}-remount-${secondaryBoardRemountNonce}`
                        : `room-${room.id}-empty-remount-${secondaryBoardRemountNonce}`;

            return isCurrentTrackedSecondaryController({
                controller: controller ?? null,
                context: secondaryBoardControllerContextRef.current,
                roomId: currentRoomIdRef.current,
                expectedGameId: expectedSecondaryBoardGameId,
                expectedSecondaryBoardKey: currentSecondaryBoardKey,
                isDetached: isDetachedBoardController(controller ?? null),
            });
        },
        [
            expectedSecondaryBoardGameId,
            isDetachedBoardController,
            room.id,
            secondaryBoardRemountNonce,
            secondaryPane.preview_game_id,
            secondaryPane.variation_draft_base_id,
            secondaryPane.variation_id,
            secondaryPane.variation_source_game_id,
            secondaryPane.variation_source_move_path,
            secondaryPane.variation_source_move_tree_id,
            selectedVariationGameId,
        ],
    );
    const secondaryVariationBaseSnapshotRef = React.useRef<SecondaryVariationBaseSnapshot | null>(
        null,
    );
    const secondaryVariationTreeDirtyRef = React.useRef(false);
    const secondaryVariationBaseInstalledRef = React.useRef<InstalledSecondaryVariationBaseState>(
        clearInstalledSecondaryVariationBaseState(),
    );
    const secondaryVariationBaseHydrationRef = React.useRef<{
        controller: GobanController;
        gameId: number;
    } | null>(null);
    const pendingSecondaryVariationBaseLoadRef =
        React.useRef<PendingSecondaryVariationBaseLoad | null>(null);
    const secondarySnapshotLoadOperationIdRef = React.useRef(0);
    const suppressSelectedVariationLoadRef = React.useRef(false);
    const secondaryVariationRetryTimeoutRef = React.useRef<number | null>(null);
    const secondaryVariationRetryCountRef = React.useRef(0);
    const lastAppliedSecondaryVariationKeyRef = React.useRef<string | null>(null);
    const pendingSecondaryRedrawReasonRef = React.useRef<string | null>(null);
    const appliedDraftAnalyzeToolRef = React.useRef<{
        controller: GobanController | null;
        draftKey: string | null;
    }>({
        controller: null,
        draftKey: null,
    });
    const lastVariationFocusRequestRef = React.useRef<{
        variationId: string | null;
        requestId: number;
        visibleVariationKey: string;
    }>({
        variationId: null,
        requestId: -1,
        visibleVariationKey: "",
    });
    const appliedDraftBaseRef = React.useRef<{
        controller: GobanController | null;
        variationId: string | null;
        moveTreeId: number | string | null;
        engine: unknown | null;
    }>({
        controller: null,
        variationId: null,
        moveTreeId: null,
        engine: null,
    });
    const draftBaseSnapshotRef = React.useRef<{
        controller: GobanController | null;
        draftBaseVariationId: string | null;
        gameId: number | null;
        requiredMoveNumber: number;
        snapshot: SecondaryVariationBaseSnapshot | null;
        loadOperationId: number;
    }>({
        controller: null,
        draftBaseVariationId: null,
        gameId: null,
        requiredMoveNumber: 0,
        snapshot: null,
        loadOperationId: 0,
    });
    const pendingDraftBaseSnapshotLoadRef = React.useRef<{
        controller: GobanController;
        draftBaseVariationId: string;
        gameId: number;
        requiredMoveNumber: number;
    } | null>(null);
    const pendingSecondaryMoveTreeRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const pendingMainBoardVisibleRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const pendingSecondaryBoardVisibleRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const lastMainBoardOfficialTailMoveNumberRef = React.useRef(mainGame?.move_number ?? 0);
    const [mainBoardSlotRef, mainBoardSize] = useSquareFitSize<HTMLDivElement>(
        `main-${secondaryPaneSize}`,
        false,
        "main-board-slot",
    );
    const [secondaryBoardSlotRef, secondaryBoardSize] = useSquareFitSize<HTMLDivElement>(
        `secondary-${secondaryPaneSize}-${secondaryPane.variation_id ?? ""}-${secondaryPane.preview_game_id ?? ""}`,
        false,
        "secondary-board-slot",
    );
    const [mobileBoardSlotRef, mobileBoardSize] = useSquareFitSize<HTMLDivElement>(
        `mobile-${secondaryPane.variation_id ?? ""}-${secondaryPane.preview_game_id ?? ""}-${secondaryPane.variation_source_game_id ?? ""}-${mobileCompanionPanel ?? ""}`,
        true,
        "mobile-board-slot",
        mobileDividerDragging,
    );
    const visibleSecondaryBoardSize = isMobileLayout ? mobileBoardSize : secondaryBoardSize;
    const secondaryBoardSizeReady = Number.isFinite(secondaryBoardSize) && secondaryBoardSize > 0;
    const mobileBoardSizeReady = Number.isFinite(mobileBoardSize) && mobileBoardSize > 0;
    const secondaryBoardDimensions = boardDimensionsOf(secondaryBoardGame);
    const secondaryBoardDimensionsReady = hasBoardDimensions(secondaryBoardGame);
    const secondaryMoveTreeKey = React.useMemo(() => {
        if (secondaryPane.variation_id != null) {
            return `variation-${secondaryPane.variation_id}`;
        }

        if (secondaryPane.variation_source_game_id != null) {
            return `draft-${secondaryPane.variation_source_game_id}-${secondaryPane.variation_draft_base_id ?? ""}`;
        }

        if (secondaryPane.preview_game_id != null) {
            return `preview-${secondaryPane.preview_game_id}`;
        }

        return "empty";
    }, [
        secondaryPane.preview_game_id,
        secondaryPane.variation_id,
        secondaryPane.variation_draft_base_id,
        secondaryPane.variation_source_game_id,
    ]);
    const secondaryBoardKey = React.useMemo(() => {
        if (secondaryPane.variation_id != null) {
            return selectedVariationGameId != null
                ? `room-${room.id}-variation-game-${selectedVariationGameId}-remount-${secondaryBoardRemountNonce}`
                : `variation-${secondaryPane.variation_id}-remount-${secondaryBoardRemountNonce}`;
        }

        if (secondaryPane.variation_source_game_id != null) {
            return `room-${room.id}-draft-${secondaryPane.variation_source_game_id}-${
                secondaryPane.variation_draft_base_id ?? ""
            }-${secondaryPane.variation_source_move_tree_id ?? ""}-${
                secondaryPane.variation_source_move_path ?? ""
            }-remount-${secondaryBoardRemountNonce}`;
        }

        if (secondaryPane.preview_game_id != null) {
            return `room-${room.id}-preview-${secondaryPane.preview_game_id}-remount-${secondaryBoardRemountNonce}`;
        }

        return `room-${room.id}-empty-remount-${secondaryBoardRemountNonce}`;
    }, [
        room.id,
        secondaryPane.preview_game_id,
        secondaryPane.variation_id,
        secondaryPane.variation_draft_base_id,
        secondaryPane.variation_source_game_id,
        secondaryPane.variation_source_move_tree_id,
        secondaryPane.variation_source_move_path,
        selectedVariationGameId,
        secondaryBoardRemountNonce,
    ]);
    const mobileCompareActive = Boolean(isMobileLayout && mobileCompanionPanel === "compare");
    React.useEffect(() => {
        onMobileBoardSizeChange?.(mobileBoardSize);
    }, [mobileBoardSize, onMobileBoardSizeChange]);
    const mobileSecondaryOwnerRequested = React.useMemo<
        "draft" | "preview" | "variation" | "none"
    >(() => {
        if (!mobileCompareActive) {
            return "none";
        }

        if (selectedVariation) {
            return "variation";
        }

        if (isDraftingVariation) {
            return "draft";
        }

        if (secondaryGameId != null) {
            return "preview";
        }

        return "none";
    }, [isDraftingVariation, mobileCompareActive, secondaryGameId, selectedVariation]);
    const [mobileDraftSourceSnapshotRefreshNonce, bumpMobileDraftSourceSnapshotRefreshNonce] =
        React.useReducer((value: number) => value + 1, 0);
    const mobileDraftSourceBoardDimensions = React.useMemo(() => {
        if (mobileSecondaryOwnerRequested !== "draft") {
            return null;
        }

        return resolveDraftSourceBoardDimensions({
            draftBaseVariation,
            variationSourceGameId: secondaryPane.variation_source_game_id,
            secondaryBoardGame,
            selectedGameBaseSnapshot,
            selectedGameBaseSnapshotCache: selectedGameBaseSnapshotCacheRef.current,
            variationSourceMoveTree: secondaryPane.variation_source_move_tree,
        });
    }, [
        draftBaseVariation,
        mobileSecondaryOwnerRequested,
        mobileDraftSourceSnapshotRefreshNonce,
        secondaryBoardGame,
        secondaryPane.variation_source_game_id,
        secondaryPane.variation_source_move_tree,
        selectedGameBaseSnapshot,
    ]);
    const mobileSecondaryBoardDimensions = React.useMemo(() => {
        if (mobileSecondaryOwnerRequested === "draft") {
            return mobileDraftSourceBoardDimensions;
        }

        if (mobileSecondaryOwnerRequested === "preview" && secondaryBoardDimensionsReady) {
            return {
                width: secondaryBoardDimensions.width ?? 0,
                height: secondaryBoardDimensions.height ?? 0,
                source: "secondary-board-game" as const,
                gameId: secondaryBoardGame?.game_id ?? secondaryGameId ?? null,
            };
        }

        return null;
    }, [
        mobileDraftSourceBoardDimensions,
        mobileSecondaryOwnerRequested,
        secondaryBoardDimensions.height,
        secondaryBoardDimensions.width,
        secondaryBoardDimensionsReady,
        secondaryBoardGame?.game_id,
        secondaryGameId,
    ]);
    const mobileSecondaryOwner = React.useMemo<MobileSecondaryOwner>(() => {
        if (!mobileCompareActive) {
            return "none";
        }

        if (selectedVariation) {
            return "variation";
        }

        if (
            (mobileSecondaryOwnerRequested === "draft" ||
                mobileSecondaryOwnerRequested === "preview") &&
            mobileSecondaryBoardDimensions
        ) {
            return mobileSecondaryOwnerRequested;
        }

        return "none";
    }, [
        mobileCompareActive,
        mobileSecondaryBoardDimensions,
        mobileSecondaryOwnerRequested,
        selectedVariation,
    ]);
    const mobileSecondaryBoardKey = React.useMemo(() => {
        if (mobileSecondaryOwner === "none") {
            return secondaryBoardKey;
        }

        return `${secondaryBoardKey}-${mobileSecondaryOwner}`;
    }, [mobileSecondaryOwner, secondaryBoardKey]);
    const mobileCompareTargetActive = mobileSecondaryOwner !== "none";
    const mobileBoardRenderSignatureRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        if (!isKibitzBoardSizeDebugEnabled()) {
            return;
        }

        recordKibitzBoardSizeEvent("mobile-board:owner-state", {
            renderMainBoard: Boolean(mainGame && !mobileCompareActive),
            mobileSecondaryOwnerRequested,
            mobileSecondaryOwner,
            mobileCompareActive,
            mobileBoardSize,
            mobileBoardSizeReady,
            selectedVariationId: selectedVariation?.id ?? null,
            selectedVariationGameId: selectedVariation?.game_id ?? null,
        });
    }, [
        mobileBoardSize,
        mobileBoardSizeReady,
        mobileCompareActive,
        mainGame,
        mobileSecondaryOwner,
        mobileSecondaryOwnerRequested,
        selectedVariation?.game_id,
        selectedVariation?.id,
    ]);
    const mobileSecondaryOwnerBlockedReason = React.useMemo<
        "missing-source-game-dimensions" | null
    >(() => {
        if (!mobileCompareActive) {
            return null;
        }

        if (selectedVariation) {
            return null;
        }

        if (
            mobileSecondaryOwnerRequested === "draft" ||
            mobileSecondaryOwnerRequested === "preview"
        ) {
            return mobileSecondaryBoardDimensions ? null : "missing-source-game-dimensions";
        }

        return null;
    }, [
        mobileCompareActive,
        mobileSecondaryBoardDimensions,
        mobileSecondaryOwnerRequested,
        selectedVariation,
    ]);
    const mobileSecondaryOwnerBlocked = mobileSecondaryOwnerBlockedReason != null;
    const previousMobileSecondarySourceDimensionsKeyRef = React.useRef<string | null>(null);
    const previousMobileSecondaryOwnerBlockedKeyRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        if (!mobileSecondaryBoardDimensions) {
            previousMobileSecondarySourceDimensionsKeyRef.current = null;
            return;
        }

        const sourceGameId =
            mobileSecondaryBoardDimensions.gameId ??
            secondaryPane.variation_source_game_id ??
            draftBaseVariation?.game_id ??
            null;
        const sourceKey = `${mobileSecondaryOwnerRequested}:${sourceGameId ?? ""}:${
            mobileSecondaryBoardDimensions.source
        }:${mobileSecondaryBoardDimensions.width}x${mobileSecondaryBoardDimensions.height}`;
        if (previousMobileSecondarySourceDimensionsKeyRef.current === sourceKey) {
            return;
        }

        previousMobileSecondarySourceDimensionsKeyRef.current = sourceKey;
        logKibitzVariationDebug("mobile-secondary-board:source-dimensions", {
            requestedOwner: mobileSecondaryOwnerRequested,
            isDraftingVariation,
            sourceGameId,
            width: mobileSecondaryBoardDimensions.width,
            height: mobileSecondaryBoardDimensions.height,
            source: mobileSecondaryBoardDimensions.source,
        });
    }, [
        draftBaseVariation?.game_id,
        isDraftingVariation,
        mobileSecondaryBoardDimensions,
        mobileSecondaryOwnerRequested,
        secondaryPane.variation_source_game_id,
    ]);
    React.useEffect(() => {
        if (
            !isMobileLayout ||
            !mobileCompareActive ||
            mobileSecondaryOwnerRequested !== "draft" ||
            mobileSecondaryBoardDimensions ||
            !draftBaseVariation ||
            secondaryPane.variation_source_game_id == null
        ) {
            return;
        }

        let disposed = false;
        void requestSelectedGameBaseSnapshotForGame({
            gameId: draftBaseVariation.game_id,
            variationId: draftBaseVariation.id,
            requiredSnapshotMoveNumber:
                typeof draftBaseVariation.analysis_from === "number" &&
                Number.isFinite(draftBaseVariation.analysis_from)
                    ? draftBaseVariation.analysis_from
                    : 0,
            installAsActiveSelectedSnapshot: false,
        }).then((snapshot) => {
            if (disposed || !snapshot) {
                return;
            }

            bumpMobileDraftSourceSnapshotRefreshNonce();
        });

        return () => {
            disposed = true;
        };
    }, [
        draftBaseVariation,
        mobileCompareActive,
        mobileSecondaryBoardDimensions,
        mobileSecondaryOwnerRequested,
        requestSelectedGameBaseSnapshotForGame,
        secondaryPane.variation_source_game_id,
        isMobileLayout,
        mobileDraftSourceSnapshotRefreshNonce,
    ]);
    React.useEffect(() => {
        if (mobileSecondaryOwnerBlockedReason == null) {
            previousMobileSecondaryOwnerBlockedKeyRef.current = null;
            return;
        }

        const blockedKey = `${mobileSecondaryOwnerRequested}:${secondaryGameId ?? ""}:${
            secondaryPane.variation_source_game_id ?? ""
        }:${mobileSecondaryOwnerBlockedReason}`;
        if (previousMobileSecondaryOwnerBlockedKeyRef.current === blockedKey) {
            return;
        }

        previousMobileSecondaryOwnerBlockedKeyRef.current = blockedKey;
        const sourceGameId =
            secondaryPane.variation_source_game_id ?? draftBaseVariation?.game_id ?? null;
        logKibitzVariationDebug("mobile-secondary-board:owner-blocked", {
            requestedOwner: mobileSecondaryOwnerRequested,
            reason: mobileSecondaryOwnerBlockedReason,
            isDraftingVariation,
            sourceGameId,
            secondaryGameId,
            variationSourceGameId: secondaryPane.variation_source_game_id ?? null,
            hasSecondaryBoardGame: Boolean(secondaryBoardGame),
            secondaryBoardGameId: secondaryBoardGame?.game_id ?? null,
            hasSelectedGameSnapshot: selectedGameBaseSnapshot?.gameId === sourceGameId,
            hasSelectedGameSnapshotCache:
                sourceGameId != null && selectedGameBaseSnapshotCacheRef.current.has(sourceGameId),
            hasDraftBaseVariation: Boolean(draftBaseVariation),
            boardSize: mobileSecondaryBoardDimensions
                ? `${mobileSecondaryBoardDimensions.width}x${mobileSecondaryBoardDimensions.height}`
                : null,
        });
    }, [
        draftBaseVariation,
        isDraftingVariation,
        mobileSecondaryOwnerBlockedReason,
        mobileSecondaryOwnerRequested,
        secondaryBoardGame,
        secondaryGameId,
        secondaryPane.variation_source_game_id,
        secondaryPane.preview_game_id,
        mobileSecondaryBoardDimensions,
        selectedGameBaseSnapshot,
    ]);
    const getSecondaryBoardDebugState = React.useCallback(
        (controller: GobanController | null): Record<string, unknown> => {
            const controllerParent = controller?.goban.parent ?? null;
            const moveTreeContainer = secondaryMoveTreeContainerRef.current?.div ?? null;
            return {
                roomId: currentRoomIdRef.current,
                currentRoomGameId: currentRoomGameIdRef.current,
                expectedSecondaryBoardGameId,
                controllerEpoch: secondaryBoardControllerEpochRef.current,
                controllerGameId: controller?.goban.config?.game_id ?? null,
                controllerBoardKey:
                    secondaryBoardControllerContextRef.current?.secondaryBoardKey ?? null,
                controllerConnected: Boolean(controllerParent?.isConnected),
                controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                controllerParentChain: summarizeParentChain(controllerParent),
                moveTreeContainerWidth: moveTreeContainer?.clientWidth ?? null,
                moveTreeContainerHeight: moveTreeContainer?.clientHeight ?? null,
                moveTreeContainerConnected: Boolean(moveTreeContainer?.isConnected),
                secondaryBoardKey,
                mobileSecondaryOwner,
                mobileSecondaryBoardKey,
                secondaryMoveTreeKey,
                secondaryBoardRemountNonce,
            };
        },
        [
            expectedSecondaryBoardGameId,
            mobileSecondaryBoardKey,
            mobileSecondaryOwner,
            secondaryBoardKey,
            secondaryBoardRemountNonce,
            secondaryMoveTreeKey,
        ],
    );
    const setSecondaryBoardController = React.useCallback(
        (controller: GobanController | null) => {
            recordKibitzLifecycleEvent("secondary-board:set-controller", {
                nextControllerPresent: Boolean(controller),
                previousControllerPresent: Boolean(
                    secondaryBoardControllerContextRef.current?.controller,
                ),
                roomId: currentRoomIdRef.current,
                currentRoomGameId: currentRoomGameIdRef.current,
                expectedSecondaryBoardGameId,
                secondaryBoardKey,
                previousEpoch: secondaryBoardControllerEpochRef.current,
            });
            pendingSecondaryBoardVisibleRedrawCancelRef.current?.();
            pendingSecondaryBoardVisibleRedrawCancelRef.current = null;
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
            pendingSecondaryRedrawReasonRef.current = null;
            secondaryBoardControllerEpochRef.current += 1;
            secondarySnapshotLoadOperationIdRef.current += 1;
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug(
                    controller ? "secondary-board:on-ready" : "secondary-board:on-ready-null",
                    getSecondaryBoardDebugState(controller),
                );
            }
            secondaryBoardControllerContextRef.current = controller
                ? {
                      controller,
                      epoch: secondaryBoardControllerEpochRef.current,
                      roomId: currentRoomIdRef.current,
                      gameId: expectedSecondaryBoardGameId,
                      secondaryBoardKey,
                  }
                : null;
            if (controller && isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("secondary-board:remount-controller-ready", {
                    roomId: currentRoomIdRef.current,
                    currentRoomGameId: currentRoomGameIdRef.current,
                    controllerEpoch: secondaryBoardControllerEpochRef.current,
                    controllerGameId: expectedSecondaryBoardGameId,
                    secondaryBoardKey,
                    secondaryMoveTreeKey,
                    secondaryBoardRemountNonce,
                });
            }
            recordKibitzLifecycleEvent("secondary-board:set-controller-done", {
                controllerPresent: Boolean(controller),
                nextEpoch: secondaryBoardControllerEpochRef.current,
                controllerGameId: controller?.goban.config?.game_id ?? null,
                connected: Boolean(controller?.goban.parent?.isConnected),
            });
            setSecondaryBoardControllerState(controller);
        },
        [
            expectedSecondaryBoardGameId,
            getSecondaryBoardDebugState,
            secondaryBoardKey,
            secondaryBoardRemountNonce,
            secondaryMoveTreeKey,
        ],
    );
    const secondaryMoveNavigationShortcuts = secondaryBoardController ? (
        <>
            <KBShortcut shortcut="up" action={secondaryBoardController.nextBranchUp} />
            <KBShortcut shortcut="down" action={secondaryBoardController.nextBranchDown} />
            <KBShortcut shortcut="left" action={secondaryBoardController.previousMove} />
            <KBShortcut shortcut="right" action={secondaryBoardController.nextMove} />
            <KBShortcut shortcut="page-up" action={secondaryBoardController.previous10Moves} />
            <KBShortcut shortcut="page-down" action={secondaryBoardController.forwardTenMoves} />
            <KBShortcut shortcut="home" action={secondaryBoardController.gotoFirstMove} />
            <KBShortcut shortcut="end" action={secondaryBoardController.gotoLastMove} />
        </>
    ) : null;
    const handleSecondaryMoveTreeContainerRef = React.useCallback((instance: Resizable | null) => {
        secondaryMoveTreeContainerRef.current = instance;
        setSecondaryMoveTreeContainer(instance);
    }, []);
    const handleSecondaryMoveTreeResize = React.useCallback(() => {
        if (!isCurrentSecondaryBoardController(secondaryBoardController)) {
            logSecondaryBoardStaleCallback("move-tree-resize", {
                controllerPresent: Boolean(secondaryBoardController),
            });
            return;
        }

        secondaryBoardController?.goban.move_tree_redraw(true);
    }, [isCurrentSecondaryBoardController, secondaryBoardController]);
    const scheduleSecondaryMoveTreeRedraw = React.useCallback(() => {
        pendingSecondaryMoveTreeRedrawCancelRef.current?.();

        const container = secondaryMoveTreeContainer?.div ?? null;
        if (
            !secondaryBoardController ||
            !container ||
            !isCurrentSecondaryBoardController(secondaryBoardController)
        ) {
            if (
                secondaryBoardController &&
                !isCurrentSecondaryBoardController(secondaryBoardController)
            ) {
                logSecondaryBoardStaleCallback("move-tree-redraw", {
                    controllerPresent: true,
                });
            }
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
            return;
        }

        pendingSecondaryMoveTreeRedrawCancelRef.current = scheduleNoWarpMoveTreeRedrawWhenReady(
            secondaryBoardController.goban,
            container,
        );
    }, [isCurrentSecondaryBoardController, secondaryBoardController, secondaryMoveTreeContainer]);
    const scheduleMainBoardVisibleRedraw = React.useCallback(
        (reason: string) => {
            const currentController = mainBoardController;
            if (!currentController || !isCurrentMainBoardController(currentController)) {
                logKibitzVariationDebug("visible-goban:redraw-stale-controller", {
                    role: "main",
                    reason,
                    controllerPresent: Boolean(currentController),
                });
                return;
            }

            const requiredMoveNumber = mainGame?.move_number ?? 0;
            const officialTailMoveNumber = getOfficialTrunkTailMoveNumber(currentController) ?? 0;

            if (requiredMoveNumber > 0 && officialTailMoveNumber < requiredMoveNumber) {
                logKibitzVariationDebug("visible-goban:redraw-deferred-unhydrated", {
                    role: "main",
                    reason,
                    requiredMoveNumber,
                    officialTailMoveNumber,
                    controllerGameId: currentController.goban.config?.game_id ?? null,
                });
                return;
            }

            pendingMainBoardVisibleRedrawCancelRef.current?.();
            pendingMainBoardVisibleRedrawCancelRef.current = scheduleVisibleBoardRedrawWhenReady(
                currentController,
                "main",
                reason,
                {
                    expectedSize: mainBoardSize,
                    isControllerCurrent: () => isCurrentMainBoardController(currentController),
                    onDetached: () => {
                        if (
                            mainBoardControllerContextRef.current?.controller === currentController
                        ) {
                            mainBoardControllerEpochRef.current += 1;
                            mainBoardControllerContextRef.current = null;
                            setMainBoardControllerState(null);
                            onMainBoardControllerChange?.(null);
                        }
                    },
                },
            );
        },
        [
            isCurrentMainBoardController,
            mainBoardController,
            mainBoardSize,
            mainGame?.move_number,
            onMainBoardControllerChange,
        ],
    );
    const scheduleSecondaryBoardVisibleRedraw = React.useCallback(
        (reason: string) => {
            if (!isCurrentSecondaryBoardController(secondaryBoardController)) {
                logSecondaryBoardStaleCallback("visible-redraw", {
                    reason,
                    controllerPresent: Boolean(secondaryBoardController),
                });
                return;
            }

            const currentController = secondaryBoardController;
            if (!currentController) {
                return;
            }

            if (isKibitzVariationDebugEnabled()) {
                const controllerParent = currentController.goban.parent ?? null;
                const moveTreeContainer = secondaryMoveTreeContainerRef.current?.div ?? null;
                logKibitzVariationDebug("secondary-board:visible-redraw-schedule", {
                    reason,
                    roomId: currentRoomIdRef.current,
                    currentRoomGameId,
                    selectedVariationId: selectedVariation?.id ?? null,
                    selectedGameId: selectedVariationGameId,
                    visibleVariationKey: visibleVariationApplyKey,
                    controllerEpoch: secondaryBoardControllerEpochRef.current,
                    controllerGameId: currentController.goban.config?.game_id ?? null,
                    controllerConnected: Boolean(controllerParent?.isConnected),
                    controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                    controllerParentChain: summarizeParentChain(controllerParent),
                    moveTreeContainerWidth: moveTreeContainer?.clientWidth ?? null,
                    moveTreeContainerHeight: moveTreeContainer?.clientHeight ?? null,
                    moveTreeContainerConnected: Boolean(moveTreeContainer?.isConnected),
                    visibleSecondaryBoardSize,
                    secondaryBoardRemountNonce,
                });
            }

            pendingSecondaryBoardVisibleRedrawCancelRef.current?.();
            pendingSecondaryBoardVisibleRedrawCancelRef.current =
                scheduleVisibleBoardRedrawWhenReady(currentController, "secondary", reason, {
                    expectedSize: visibleSecondaryBoardSize,
                    onDeferred: () => {
                        pendingSecondaryRedrawReasonRef.current = reason;
                        logKibitzVariationDebug("visible-goban:redraw-pending-until-size", {
                            role: "secondary",
                            reason,
                            measuredWidth: 0,
                            measuredHeight: 0,
                            expectedSize: visibleSecondaryBoardSize,
                        });
                    },
                    onDetached: (details) => {
                        if (
                            secondaryBoardControllerContextRef.current?.controller ===
                            secondaryBoardController
                        ) {
                            requestSecondaryBoardDetachedRemount("redraw-detached", {
                                reason,
                                selectedVariationId: selectedVariation?.id ?? null,
                                selectedGameId: selectedVariationGameId,
                                currentRoomGameId,
                                visibleVariationKey: visibleVariationApplyKey,
                                desiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
                                ...details,
                            });
                        }
                    },
                    isControllerCurrent: () =>
                        isCurrentSecondaryBoardController(secondaryBoardController),
                });
        },
        [
            currentRoomGameId,
            logSecondaryBoardStaleCallback,
            isCurrentSecondaryBoardController,
            lastAppliedSecondaryVariationKeyRef,
            requestSecondaryBoardDetachedRemount,
            secondaryBoardController,
            selectedVariation?.id,
            selectedVariationGameId,
            visibleSecondaryBoardSize,
            visibleVariationApplyKey,
        ],
    );

    React.useEffect(() => {
        lastAppliedSecondaryVariationKeyRef.current = null;
    }, [
        secondaryBoardController,
        secondaryBoardRemountNonce,
        room.id,
        selectedVariation?.game_id,
        selectedVariation?.id,
        visibleVariationApplyKey,
        variationFocusRequestId,
        selectedVariationBaseSnapshotIdentity,
    ]);

    React.useEffect(() => {
        const pendingReason = pendingSecondaryRedrawReasonRef.current;
        if (!secondaryBoardController || visibleSecondaryBoardSize <= 0 || !pendingReason) {
            return;
        }

        pendingSecondaryRedrawReasonRef.current = null;
        scheduleSecondaryBoardVisibleRedraw(`pending-size-ready:${pendingReason}`);
    }, [scheduleSecondaryBoardVisibleRedraw, secondaryBoardController, visibleSecondaryBoardSize]);

    const clearSecondaryVariationRetryTimeout = React.useCallback(() => {
        if (secondaryVariationRetryTimeoutRef.current != null) {
            window.clearTimeout(secondaryVariationRetryTimeoutRef.current);
            secondaryVariationRetryTimeoutRef.current = null;
        }
    }, []);

    React.useEffect(() => {
        if (isKibitzVariationDebugEnabled()) {
            const controller = secondaryBoardController;
            const controllerParent = controller?.goban.parent ?? null;
            logKibitzVariationDebug("secondary-board:room-change-teardown", {
                roomId: room.id,
                currentRoomGameId,
                selectedVariationId: selectedVariation?.id ?? null,
                selectedGameId: selectedVariationGameId,
                visibleVariationKey: visibleVariationApplyKey,
                controllerEpoch: secondaryBoardControllerEpochRef.current,
                controllerGameId: controller?.goban.config?.game_id ?? null,
                controllerConnected: Boolean(controllerParent?.isConnected),
                controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                controllerParentChain: summarizeParentChain(controllerParent),
                currentRoomGameIdBeforeReset: currentRoomGameIdRef.current,
            });
        }

        mainBoardControllerEpochRef.current += 1;
        secondaryBoardControllerEpochRef.current += 1;
        secondarySnapshotLoadOperationIdRef.current += 1;
        mainBoardControllerContextRef.current = null;
        secondaryBoardControllerContextRef.current = null;
        pendingSecondaryVariationBaseLoadRef.current = null;
        suppressSelectedVariationLoadRef.current = false;
        secondaryVariationRetryCountRef.current = 0;
        secondaryVariationBaseSnapshotRef.current = null;
        secondaryVariationTreeDirtyRef.current = false;
        secondaryVariationBaseInstalledRef.current = clearInstalledSecondaryVariationBaseState();
        secondaryVariationBaseHydrationRef.current = null;
        lastAppliedSecondaryVariationKeyRef.current = null;
        pendingSecondaryRedrawReasonRef.current = null;
        pendingSecondaryMoveTreeRedrawCancelRef.current?.();
        pendingSecondaryMoveTreeRedrawCancelRef.current = null;
        pendingSecondaryBoardVisibleRedrawCancelRef.current?.();
        pendingSecondaryBoardVisibleRedrawCancelRef.current = null;
        clearSecondaryVariationRetryTimeout();
        previousSecondaryControllerRef.current = null;
    }, [clearSecondaryVariationRetryTimeout, currentRoomGameId, room.id]);

    const resetSecondaryVariationBaseState = React.useCallback(
        (reason: string) => {
            secondaryVariationBaseSnapshotRef.current = null;
            secondaryVariationTreeDirtyRef.current = false;
            secondaryVariationBaseInstalledRef.current =
                clearInstalledSecondaryVariationBaseState();
            secondaryVariationBaseHydrationRef.current = null;
            pendingSecondaryVariationBaseLoadRef.current = null;
            suppressSelectedVariationLoadRef.current = false;
            secondaryVariationRetryCountRef.current = 0;
            lastAppliedSecondaryVariationKeyRef.current = null;
            pendingSecondaryRedrawReasonRef.current = null;
            clearSecondaryVariationRetryTimeout();
            logKibitzVariationDebug("main-board:variation-base-reset", {
                reason,
                gameId: currentRoomGameId,
                selectedVariationId: selectedVariation?.id ?? null,
                mainBoardOfficialTailMoveNumber,
            });
        },
        [
            clearSecondaryVariationRetryTimeout,
            currentRoomGameId,
            mainBoardOfficialTailMoveNumber,
            selectedVariation?.id,
        ],
    );

    React.useEffect(() => {
        if (mainBoardController) {
            return;
        }

        const nextTailMoveNumber = mainGame?.move_number ?? 0;
        setMainBoardOfficialTailMoveNumber(nextTailMoveNumber);
        lastMainBoardOfficialTailMoveNumberRef.current = nextTailMoveNumber;
    }, [mainBoardController, mainGame?.game_id, mainGame?.move_number]);

    React.useEffect(() => {
        mainBoardExpectedMoveNumberRef.current = mainGame?.move_number ?? 0;
        mainBoardExpectedGameIdRef.current = mainGame?.game_id ?? null;
    }, [mainGame?.game_id, mainGame?.move_number]);

    const reportMainBoardHydration = React.useCallback(
        (reason: string, expectedMoveNumberOverride?: number) => {
            const currentController = mainBoardController;
            if (!currentController || !isCurrentMainBoardController(currentController)) {
                return;
            }

            const goban = currentController.goban;
            const currentEngine = goban.engine;
            const officialTail = getOfficialTrunkTail(currentEngine.move_tree);
            const officialTailMoveNumber = officialTail?.move_number ?? 0;
            const currentMoveNumber = currentEngine.cur_move?.move_number ?? 0;
            const currentMoveId = currentEngine.cur_move?.id ?? null;
            const expectedMoveNumber =
                expectedMoveNumberOverride ?? mainBoardExpectedMoveNumberRef.current;
            const expectedGameId = mainBoardExpectedGameIdRef.current;
            const hasMoveTree = Boolean(currentEngine.move_tree);
            const liveGame = Boolean(mainGame?.live);
            const rootLiveHydrationBlocked =
                liveGame && expectedMoveNumber === 0 && officialTailMoveNumber === 0;
            const hydrated =
                expectedGameId != null &&
                (expectedMoveNumber > 0
                    ? officialTailMoveNumber >= expectedMoveNumber
                    : !liveGame && hasMoveTree && officialTailMoveNumber === 0);

            setMainBoardOfficialTailMoveNumber((previousTailMoveNumber) =>
                previousTailMoveNumber === officialTailMoveNumber
                    ? previousTailMoveNumber
                    : officialTailMoveNumber,
            );
            logKibitzVariationDebug("main-board:state", {
                reason,
                role: "main",
                gameId: currentRoomGameIdRef.current,
                currentRoomGameId: currentRoomGameIdRef.current,
                currentMove: summarizeKibitzMoveTreeNode(currentEngine.cur_move),
                currentMoveNumber,
                currentMoveId,
                officialTail: summarizeKibitzMoveTreeNode(officialTail),
                officialTailMoveNumber,
                lastOfficialMove: summarizeKibitzMoveTreeNode(currentEngine.last_official_move),
                lastOfficialMoveNumber: currentEngine.last_official_move?.move_number ?? null,
                lastOfficialMoveId: currentEngine.last_official_move?.id ?? null,
                liveGame,
                rootLiveHydrationBlocked,
            });
            onMainBoardHydrationChange?.({
                roomId: room.id,
                gameId: expectedGameId,
                officialTailMoveNumber,
                expectedMoveNumber,
                hasMoveTree,
                hydrated,
            });
            logKibitzVariationDebug("main-board:hydration-state", {
                reason,
                roomId: room.id,
                gameId: expectedGameId,
                officialTailMoveNumber,
                expectedMoveNumber,
                hasMoveTree,
                hydrated,
                liveGame,
                rootLiveHydrationBlocked,
            });
            scheduleMainBoardVisibleRedraw(reason);
        },
        [
            isCurrentMainBoardController,
            mainBoardController,
            mainGame?.live,
            onMainBoardHydrationChange,
            room.id,
            scheduleMainBoardVisibleRedraw,
        ],
    );

    React.useEffect(() => {
        if (!mainBoardController) {
            return;
        }

        if (!isCurrentMainBoardController(mainBoardController)) {
            return;
        }

        let disposed = false;

        const syncMainBoardState = (reason: string): void => {
            if (disposed) {
                return;
            }
            reportMainBoardHydration(reason);
        };

        const onLoad = () => {
            syncMainBoardState("load");
        };
        const onGameData = () => {
            syncMainBoardState("gamedata");
        };
        const onLastOfficialMove = () => {
            syncMainBoardState("last_official_move");
        };
        const onMoveMade = () => {
            syncMainBoardState("move-made");
        };

        mainBoardController.goban.on("load", onLoad);
        mainBoardController.goban.on("gamedata", onGameData);
        mainBoardController.goban.on("last_official_move", onLastOfficialMove);
        mainBoardController.goban.on("move-made", onMoveMade);
        syncMainBoardState("controller-create");

        return () => {
            disposed = true;
            mainBoardController.goban.off("load", onLoad);
            mainBoardController.goban.off("gamedata", onGameData);
            mainBoardController.goban.off("last_official_move", onLastOfficialMove);
            mainBoardController.goban.off("move-made", onMoveMade);
        };
    }, [
        currentRoomGameId,
        mainGame?.game_id,
        mainGame?.move_number,
        mainBoardController,
        reportMainBoardHydration,
        onMainBoardHydrationChange,
        room.id,
        scheduleMainBoardVisibleRedraw,
    ]);

    React.useEffect(() => {
        if (!mainBoardController || !isCurrentMainBoardController(mainBoardController)) {
            return;
        }

        if (
            mainBoardLastReportedExpectedMoveNumberRef.current ===
                mainBoardExpectedMoveNumberRef.current &&
            mainBoardLastReportedExpectedGameIdRef.current === mainBoardExpectedGameIdRef.current
        ) {
            return;
        }

        mainBoardLastReportedExpectedMoveNumberRef.current = mainBoardExpectedMoveNumberRef.current;
        mainBoardLastReportedExpectedGameIdRef.current = mainBoardExpectedGameIdRef.current;
        reportMainBoardHydration("expected-move-changed");
    }, [
        isCurrentMainBoardController,
        mainBoardController,
        mainGame?.game_id,
        mainGame?.move_number,
        reportMainBoardHydration,
    ]);

    React.useEffect(() => {
        if (!isMobileLayout || mobileCompareActive) {
            return;
        }

        const currentController = mainBoardController;
        const controllerGameId = currentController?.goban.config?.game_id ?? null;
        const controllerTailMoveNumber = currentController
            ? getOfficialTrunkTailMoveNumber(currentController)
            : null;
        const snapshotGameId = currentGameBaseSnapshot?.gameId ?? null;
        const snapshotTailMoveNumber = currentGameBaseSnapshot?.trunkTailMoveNumber ?? null;
        const hasMoveTree = Boolean(currentGameBaseSnapshot?.config.move_tree);
        const snapshotTailMoveNumberSafe = snapshotTailMoveNumber ?? 0;
        const requiredMoveNumber = Math.max(mainGame?.move_number ?? 0, snapshotTailMoveNumberSafe);
        const currentMoveNumber = currentController?.goban.engine.cur_move?.move_number ?? 0;
        const lastOfficialMoveNumber =
            currentController?.goban.engine.last_official_move?.move_number ?? 0;
        const trunkFreshEnough =
            currentController != null && controllerTailMoveNumber != null
                ? controllerTailMoveNumber >= requiredMoveNumber
                : false;
        const currentMoveRestored =
            currentMoveNumber >= requiredMoveNumber && lastOfficialMoveNumber >= requiredMoveNumber;

        if (isKibitzVariationDebugEnabled()) {
            logKibitzVariationDebug("main-board:broker-hydrate:consider", {
                reason: "mobile-main-return",
                gameId: currentRoomGameId,
                currentRoomGameId,
                requiredMoveNumber,
                controllerGameId,
                controllerTailMoveNumber,
                currentMoveNumber,
                lastOfficialMoveNumber,
                snapshotGameId,
                snapshotTailMoveNumber,
                hasMoveTree,
                trunkFreshEnough,
                currentMoveRestored,
            });
        }

        if (!currentController) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "missing-controller",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (currentRoomGameId == null) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "missing-room-game",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (controllerGameId !== currentRoomGameId) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "controller-game-mismatch",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (!currentGameBaseSnapshot) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "snapshot-missing",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (snapshotGameId !== currentRoomGameId) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "snapshot-game-mismatch",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (!hasMoveTree) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "snapshot-missing-move-tree",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (trunkFreshEnough && !currentMoveRestored) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:restore-tail:attempt", {
                    reason: "mobile-main-return",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    currentMoveNumber,
                    lastOfficialMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                });
            }

            const restoredTail = restoreMainBoardToOfficialTail(currentController);
            if (!restoredTail) {
                if (isKibitzVariationDebugEnabled()) {
                    logKibitzVariationDebug("main-board:broker-hydrate:error", {
                        reason: "mobile-main-return",
                        error: "restore-returned-null",
                        gameId: currentRoomGameId,
                        currentRoomGameId,
                        requiredMoveNumber,
                        controllerGameId,
                        controllerTailMoveNumber,
                        currentMoveNumber,
                        lastOfficialMoveNumber,
                        snapshotGameId,
                        snapshotTailMoveNumber,
                        hasMoveTree,
                    });
                }
                return;
            }

            reportMainBoardHydration("mobile-main-return-restore-tail", requiredMoveNumber);
            scheduleMainBoardVisibleRedraw("mobile-main-return-restore-tail");

            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:restore-tail:done", {
                    reason: "mobile-main-return",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    currentMoveNumber: currentController.goban.engine.cur_move?.move_number ?? null,
                    officialTailMoveNumber: getOfficialTrunkTailMoveNumber(currentController),
                    lastOfficialMoveNumber:
                        currentController.goban.engine.last_official_move?.move_number ?? null,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (trunkFreshEnough && currentMoveRestored) {
            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:skip", {
                    reason: "mobile-main-return",
                    skipReason: "controller-already-ready",
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    currentMoveNumber,
                    lastOfficialMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                });
            }
            return;
        }

        if (isKibitzVariationDebugEnabled()) {
            logKibitzVariationDebug("main-board:broker-hydrate:load", {
                gameId: currentRoomGameId,
                requiredMoveNumber,
                snapshotTailMoveNumber,
            });
        }

        try {
            const restoredTail = hydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: currentController,
                currentGame: mainGame,
                currentRoomGameId,
                requiredMoveNumber,
                roomBaseSnapshot: currentGameBaseSnapshot,
            });

            if (!restoredTail) {
                logKibitzVariationDebug("main-board:broker-hydrate:error", {
                    gameId: currentRoomGameId,
                    currentRoomGameId,
                    requiredMoveNumber,
                    controllerGameId,
                    controllerTailMoveNumber,
                    snapshotGameId,
                    snapshotTailMoveNumber,
                    hasMoveTree,
                    error: "hydrate-returned-null",
                });
                return;
            }

            scheduleMainBoardVisibleRedraw("broker-hydrate");

            if (isKibitzVariationDebugEnabled()) {
                logKibitzVariationDebug("main-board:broker-hydrate:done", {
                    gameId: currentRoomGameId,
                    restored: true,
                    currentMoveNumber: currentController.goban.engine.cur_move?.move_number ?? null,
                    officialTailMoveNumber: getOfficialTrunkTailMoveNumber(currentController),
                    lastOfficialMoveNumber:
                        currentController.goban.engine.last_official_move?.move_number ?? null,
                });
            }
        } catch (error) {
            logKibitzVariationDebug("main-board:broker-hydrate:error", {
                gameId: currentRoomGameId,
                currentRoomGameId,
                requiredMoveNumber,
                controllerGameId,
                controllerTailMoveNumber,
                snapshotGameId,
                snapshotTailMoveNumber,
                hasMoveTree,
                error,
            });
        }
    }, [
        currentGameBaseSnapshot,
        currentRoomGameId,
        isMobileLayout,
        mainBoardController,
        mainGame?.move_number,
        mobileCompareActive,
        scheduleMainBoardVisibleRedraw,
    ]);

    React.useEffect(() => {
        const currentController = mainBoardController;
        const snapshot = currentGameBaseSnapshot;

        if (!currentController || currentRoomGameId == null || !snapshot) {
            return;
        }

        if (!isCurrentMainBoardController(currentController)) {
            return;
        }

        const controllerGameId = Number(currentController.goban.config?.game_id ?? 0) || null;
        const controllerTailMoveNumber = getOfficialTrunkTailMoveNumber(currentController);
        const currentMoveNumber = currentController.goban.engine.cur_move?.move_number ?? 0;
        const lastOfficialMoveNumber =
            currentController.goban.engine.last_official_move?.move_number ?? 0;
        const snapshotGameId = snapshot.gameId ?? null;
        const snapshotTailMoveNumber = snapshot.trunkTailMoveNumber ?? 0;
        const hasMoveTree = Boolean(snapshot.config.move_tree);
        const requiredMoveNumber = Math.max(mainGame?.move_number ?? 0, snapshotTailMoveNumber);
        const trunkFreshEnough = controllerTailMoveNumber >= requiredMoveNumber;
        const currentMoveRestored =
            currentMoveNumber >= requiredMoveNumber && lastOfficialMoveNumber >= requiredMoveNumber;

        logKibitzVariationDebug("main-board:snapshot-hydrate:consider", {
            reason: "current-game-snapshot-ready",
            isMobileLayout,
            mobileCompareActive,
            currentRoomGameId,
            controllerGameId,
            controllerTailMoveNumber,
            currentMoveNumber,
            lastOfficialMoveNumber,
            snapshotGameId,
            snapshotTailMoveNumber,
            roomMoveNumber: mainGame?.move_number ?? 0,
            requiredMoveNumber,
            trunkFreshEnough,
            currentMoveRestored,
            hasMoveTree,
        });

        if (controllerGameId !== currentRoomGameId) {
            return;
        }

        if (snapshotGameId !== currentRoomGameId || !hasMoveTree) {
            return;
        }

        if (trunkFreshEnough && !currentMoveRestored) {
            logKibitzVariationDebug("main-board:restore-tail:attempt", {
                currentRoomGameId,
                controllerTailMoveNumber,
                currentMoveNumber,
                lastOfficialMoveNumber,
                snapshotTailMoveNumber,
                requiredMoveNumber,
            });

            const restoredTail = restoreMainBoardToOfficialTail(currentController);
            if (!restoredTail) {
                logKibitzVariationDebug("main-board:snapshot-hydrate:error", {
                    currentRoomGameId,
                    controllerTailMoveNumber,
                    currentMoveNumber,
                    lastOfficialMoveNumber,
                    snapshotTailMoveNumber,
                    requiredMoveNumber,
                    error: "restore-returned-null",
                });
                return;
            }

            reportMainBoardHydration("current-game-snapshot-restore-tail", requiredMoveNumber);
            scheduleMainBoardVisibleRedraw("current-game-snapshot-restore-tail");

            logKibitzVariationDebug("main-board:restore-tail:done", {
                currentRoomGameId,
                restored: true,
                currentMoveNumber: currentController.goban.engine.cur_move?.move_number ?? null,
                officialTailMoveNumber: getOfficialTrunkTailMoveNumber(currentController),
                lastOfficialMoveNumber:
                    currentController.goban.engine.last_official_move?.move_number ?? null,
            });
            return;
        }

        if (snapshotTailMoveNumber <= controllerTailMoveNumber) {
            return;
        }

        const restoredTail = hydrateMainBoardFromRoomBaseSnapshot({
            mainBoardController: currentController,
            currentGame: mainGame,
            currentRoomGameId,
            requiredMoveNumber,
            roomBaseSnapshot: snapshot,
        });

        if (!restoredTail) {
            logKibitzVariationDebug("main-board:snapshot-hydrate:error", {
                currentRoomGameId,
                controllerTailMoveNumber,
                snapshotTailMoveNumber,
                requiredMoveNumber,
                error: "hydrate-returned-null",
            });
            return;
        }

        reportMainBoardHydration("current-game-snapshot-hydrate", requiredMoveNumber);
        scheduleMainBoardVisibleRedraw("current-game-snapshot-hydrate");

        logKibitzVariationDebug("main-board:snapshot-hydrate:done", {
            currentRoomGameId,
            restored: true,
            currentMoveNumber: currentController.goban.engine.cur_move?.move_number ?? null,
            officialTailMoveNumber: getOfficialTrunkTailMoveNumber(currentController),
            snapshotTailMoveNumber,
        });
    }, [
        currentGameBaseSnapshot,
        currentGameBaseSnapshot?.gameId,
        currentGameBaseSnapshot?.trunkTailMoveNumber,
        currentRoomGameId,
        isCurrentMainBoardController,
        isMobileLayout,
        mainBoardController,
        mainGame,
        mainGame?.move_number,
        mobileCompareActive,
        reportMainBoardHydration,
        scheduleMainBoardVisibleRedraw,
    ]);

    React.useEffect(() => {
        if (!mainBoardController || currentRoomGameId == null) {
            return;
        }

        if (selectedVariationGameId !== currentRoomGameId) {
            lastMainBoardOfficialTailMoveNumberRef.current = mainBoardOfficialTailMoveNumber;
            return;
        }

        const previousTailMoveNumber = lastMainBoardOfficialTailMoveNumberRef.current;
        if (mainBoardOfficialTailMoveNumber <= previousTailMoveNumber) {
            return;
        }

        lastMainBoardOfficialTailMoveNumberRef.current = mainBoardOfficialTailMoveNumber;
        logKibitzVariationDebug("main-board:official-tail-advanced", {
            gameId: currentRoomGameId,
            selectedVariationId: selectedVariation?.id ?? null,
            previousTailMoveNumber,
            nextTailMoveNumber: mainBoardOfficialTailMoveNumber,
        });
        resetSecondaryVariationBaseState("main-official-tail-advanced");
    }, [
        currentRoomGameId,
        mainBoardController,
        mainBoardOfficialTailMoveNumber,
        currentGameBaseSnapshot,
        resetSecondaryVariationBaseState,
        selectedVariation?.game_id,
        selectedVariation?.id,
    ]);

    React.useEffect(() => {
        return () => {
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
            pendingMainBoardVisibleRedrawCancelRef.current?.();
            pendingMainBoardVisibleRedrawCancelRef.current = null;
            pendingSecondaryBoardVisibleRedrawCancelRef.current?.();
            pendingSecondaryBoardVisibleRedrawCancelRef.current = null;
        };
    }, []);

    React.useEffect(() => {
        const previousController = previousSecondaryControllerRef.current;
        const container = secondaryMoveTreeContainer?.div ?? null;

        if (previousController && previousController !== secondaryBoardController) {
            previousController.setMoveTreeContainer(null);
        }
        previousSecondaryControllerRef.current = secondaryBoardController;

        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            container.scrollLeft = 0;
            container.scrollTop = 0;
        }

        if (secondaryBoardController && container) {
            secondaryBoardController.setMoveTreeContainer(secondaryMoveTreeContainer);
            scheduleSecondaryMoveTreeRedraw();

            return () => {
                pendingSecondaryMoveTreeRedrawCancelRef.current?.();
                pendingSecondaryMoveTreeRedrawCancelRef.current = null;
                secondaryBoardController.setMoveTreeContainer(null);
            };
        }

        return () => {
            if (secondaryBoardController) {
                secondaryBoardController.setMoveTreeContainer(null);
            }
        };
    }, [
        scheduleSecondaryMoveTreeRedraw,
        secondaryBoardController,
        secondaryMoveTreeContainer,
        secondaryMoveTreeKey,
    ]);

    React.useEffect(() => {
        secondaryVariationBaseSnapshotRef.current = null;
        secondaryVariationTreeDirtyRef.current = false;
        secondaryVariationBaseInstalledRef.current = clearInstalledSecondaryVariationBaseState();
        secondaryVariationBaseHydrationRef.current = null;
        pendingSecondaryVariationBaseLoadRef.current = null;
        suppressSelectedVariationLoadRef.current = false;
        secondaryVariationRetryCountRef.current = 0;
        lastAppliedSecondaryVariationKeyRef.current = null;
        pendingSecondaryRedrawReasonRef.current = null;
        clearSecondaryVariationRetryTimeout();
    }, [clearSecondaryVariationRetryTimeout, secondaryBoardController, selectedVariationGameId]);

    React.useEffect(() => {
        appliedDraftBaseRef.current = clearDraftBaseAppliedState();
        draftBaseSnapshotRef.current = {
            controller: null,
            draftBaseVariationId: null,
            gameId: null,
            requiredMoveNumber: 0,
            snapshot: null,
            loadOperationId: draftBaseSnapshotRef.current.loadOperationId + 1,
        };
        pendingDraftBaseSnapshotLoadRef.current = null;
    }, [
        secondaryBoardKey,
        secondaryPane.variation_draft_base_id,
        secondaryPane.variation_source_game_id,
    ]);

    React.useEffect(() => {
        secondaryVariationRetryCountRef.current = 0;
        clearSecondaryVariationRetryTimeout();
    }, [
        clearSecondaryVariationRetryTimeout,
        selectedVariationApplyKey,
        selectedVariationSourceGame?.move_number,
    ]);

    React.useEffect(() => {
        if (!selectedVariation || !secondaryBoardController || secondaryPane.preview_game_id) {
            return;
        }

        const goban = secondaryBoardController.goban;
        let disposed = false;
        let applyingVariation = false;
        const maxBaseRetryCount = 30;
        const baseRetryDelayMs = 100;
        let loggedBaseRetryTimeout = false;

        const isCurrentSecondaryLoadController = (): boolean => {
            const context = secondaryBoardControllerContextRef.current;
            return Boolean(
                secondaryBoardController &&
                context &&
                context.controller === secondaryBoardController &&
                context.roomId === currentRoomIdRef.current &&
                context.gameId === expectedSecondaryBoardGameId &&
                !isDetachedBoardController(secondaryBoardController),
            );
        };

        const isCurrentPendingSecondarySnapshotLoad = (
            pendingLoad: PendingSecondaryVariationBaseLoad | null,
        ): pendingLoad is PendingSecondaryVariationBaseLoad => {
            return Boolean(
                pendingLoad &&
                pendingLoad.controller === secondaryBoardController &&
                pendingLoad.roomId === currentRoomIdRef.current &&
                pendingLoad.gameId === selectedVariationGameId &&
                pendingLoad.operationId === secondarySnapshotLoadOperationIdRef.current &&
                isCurrentSecondaryLoadController(),
            );
        };

        const warnVariationApplyTimeout = (reason: string): void => {
            console.warn("Kibitz variation apply timed out", {
                reason,
                selectedVariationId: selectedVariation.id,
                gameId: selectedVariation.game_id,
                analysisFrom: selectedVariation.analysis_from,
                moveCount: selectedVariation.move_count,
                sourceGameMoveNumber: selectedVariationSourceGame?.move_number,
                trunkTailMoveNumber: getOfficialTrunkTailMoveNumber(secondaryBoardController),
                hasBaseSnapshot: Boolean(secondaryVariationBaseSnapshotRef.current),
                treeDirty: secondaryVariationTreeDirtyRef.current,
                suppressLoad: suppressSelectedVariationLoadRef.current,
                pendingSnapshotLoad: Boolean(pendingSecondaryVariationBaseLoadRef.current),
                retryCount: secondaryVariationRetryCountRef.current,
            });
        };

        const logVariationStage = (
            message: string,
            extra: Record<string, unknown> | (() => Record<string, unknown>) = {},
        ) => {
            if (!isKibitzVariationDebugEnabled()) {
                return;
            }

            logKibitzVariationDebug(message, {
                selectedVariationId: selectedVariation.id,
                selectedGameId: selectedVariation.game_id,
                currentRoomGameId,
                visibleVariationIds: visibleVariations.map((variation) => variation.id),
                visibleVariationKey: visibleVariationApplyKey,
                variationFocusRequestId,
                mainBoardOfficialTailMoveNumber,
                treeDirty: secondaryVariationTreeDirtyRef.current,
                suppressLoad: suppressSelectedVariationLoadRef.current,
                pendingSnapshotLoad: Boolean(pendingSecondaryVariationBaseLoadRef.current),
                retryCount: secondaryVariationRetryCountRef.current,
                baseSnapshot: summarizeSecondaryVariationSnapshot(
                    secondaryVariationBaseSnapshotRef.current,
                ),
                currentMove: summarizeKibitzMoveTreeNode(goban.engine.cur_move),
                officialTail: summarizeKibitzMoveTreeNode(
                    getOfficialTrunkTail(goban.engine.move_tree),
                ),
                ...(typeof extra === "function" ? extra() : extra),
            });
        };

        const applyVisibleVariationsToLoadedBase = (desiredApplyKey: string): boolean => {
            if (!isCurrentSecondaryLoadController()) {
                logSecondaryBoardStaleCallback("apply", { desiredApplyKey });
                return false;
            }

            if (disposed || applyingVariation || secondaryVariationTreeDirtyRef.current) {
                logVariationStage("apply:blocked", {
                    disposed,
                    applyingVariation,
                });
                return false;
            }

            const variationApplication = getApplicableVisibleVariations({
                selectedVariation,
                visibleVariations,
                sourceGame: selectedVariationSourceGame,
            });

            for (const skippedVariation of variationApplication.skippedVariations) {
                logVariationStage("apply:skip-malformed-visible-variation", {
                    selectedVariationId: selectedVariation.id,
                    skippedVariationId: skippedVariation.variation.id,
                    gameId: skippedVariation.variation.game_id,
                    analysisFrom: skippedVariation.variation.analysis_from ?? null,
                    reason: skippedVariation.reason,
                });
            }

            if (!variationApplication.selectedVariationValid) {
                logVariationStage("try:selected-variation-invalid", {
                    selectedVariationId: selectedVariation.id,
                    gameId: selectedVariation.game_id,
                    analysisFrom: selectedVariation.analysis_from ?? null,
                    analysisMoves:
                        typeof selectedVariation.analysis_moves === "string"
                            ? selectedVariation.analysis_moves
                            : null,
                    reason: variationApplication.selectedVariationSkipReason,
                });
                return true;
            }

            const variationsToApply = getVariationsToApply(
                selectedVariation,
                variationApplication.applicableVariations,
            );

            logVariationStage("apply:start", () => ({
                variationsToApply: variationsToApply.map((variation) => ({
                    id: variation.id,
                    analysisFrom: variation.analysis_from,
                    moveCount: variation.move_count,
                })),
            }));

            const preparedVariations: Array<{
                variation: KibitzVariationSummary;
                colorIndex: number;
                isSelected: boolean;
            }> = [];

            for (const variation of variationsToApply) {
                const colorIndex = getVariationColorIndex(variationColorIndexes, variation.id);
                if (colorIndex == null) {
                    logVariationStage("apply:missing-color", {
                        variationId: variation.id,
                    });
                    return false;
                }

                if (!isVariationOfficialAnchorReady(secondaryBoardController, variation)) {
                    logVariationStage("apply:anchor-not-ready", {
                        variationId: variation.id,
                        analysisFrom: variation.analysis_from,
                        officialTailMoveNumber:
                            getOfficialTrunkTailMoveNumber(secondaryBoardController),
                    });
                    return false;
                }

                preparedVariations.push({
                    variation,
                    colorIndex,
                    isSelected: variation.id === selectedVariation.id,
                });
            }

            secondaryVariationTreeDirtyRef.current = preparedVariations.length > 0;
            applyingVariation = true;
            suppressSelectedVariationLoadRef.current = true;

            try {
                let selectedEndpoint: MoveTree | null = null;

                for (const { variation, colorIndex, isSelected } of preparedVariations) {
                    logVariationStage("apply:variation", {
                        variationId: variation.id,
                        analysisFrom: variation.analysis_from,
                        colorIndex,
                        isSelected,
                    });
                    const applied = applyKibitzVariationToController(
                        secondaryBoardController,
                        variation,
                        colorIndex,
                        isSelected,
                    );
                    logVariationStage("apply:variation-result", () => ({
                        variationId: variation.id,
                        endpoint: summarizeKibitzMoveTreeNode(applied.endpoint),
                    }));

                    if (isSelected) {
                        selectedEndpoint = applied.endpoint;
                    }
                }

                const selectedVisible = isSelectedVariationVisible(
                    selectedVariation,
                    visibleVariations,
                );

                if (selectedVisible && !selectedEndpoint) {
                    logVariationStage("apply:selected-missing-endpoint");
                    return false;
                }

                if (selectedEndpoint) {
                    goban.engine.jumpTo(selectedEndpoint);
                    lastVariationFocusRequestRef.current = {
                        variationId: selectedVariation.id,
                        requestId: variationFocusRequestId,
                        visibleVariationKey: visibleVariationApplyKey,
                    };
                } else {
                    const officialTail = getOfficialTrunkTail(goban.engine.move_tree);
                    if (officialTail) {
                        goban.engine.jumpTo(officialTail);
                    }
                }

                if (!selectedVariation.analysis_line_tree && selectedVisible) {
                    if (selectedVariation.analysis_marks) {
                        goban.setMarks(selectedVariation.analysis_marks);
                    }
                    goban.pen_marks = selectedVariation.analysis_pen_marks
                        ? [...selectedVariation.analysis_pen_marks]
                        : [];
                } else if (!selectedVisible) {
                    goban.setMarks({});
                    goban.pen_marks = [];
                }

                goban.redraw(true);
                scheduleSecondaryBoardVisibleRedraw("apply:done");
                scheduleSecondaryMoveTreeRedraw();
                clearSecondaryVariationRetryTimeout();
                secondaryVariationRetryCountRef.current = 0;
                lastAppliedSecondaryVariationKeyRef.current = desiredApplyKey;
                logVariationStage("apply:done", () => ({
                    selectedEndpoint: summarizeKibitzMoveTreeNode(selectedEndpoint),
                    nextTreeDirty: secondaryVariationTreeDirtyRef.current,
                    desiredApplyKey,
                }));
                return true;
            } finally {
                applyingVariation = false;
                suppressSelectedVariationLoadRef.current = false;
            }
        };

        const reloadBaseThenApplyVisibleVariations = (reason: string): boolean => {
            if (!isCurrentSecondaryLoadController()) {
                logSecondaryBoardStaleCallback("reload-or-apply", { reason });
                return false;
            }

            logVariationStage("reload-or-apply:start", { reason });
            if (disposed || applyingVariation) {
                logVariationStage("reload-or-apply:blocked", {
                    reason,
                    disposed,
                    applyingVariation,
                });
                return false;
            }

            const snapshot = secondaryVariationBaseSnapshotRef.current;
            if (
                !snapshot ||
                snapshot.controller !== secondaryBoardController ||
                snapshot.gameId !== selectedVariation.game_id
            ) {
                logVariationStage("reload-or-apply:no-snapshot", { reason });
                return false;
            }

            const currentSecondaryTailMoveNumber =
                getOfficialTrunkTailMoveNumber(secondaryBoardController);
            const desiredApplyKey = buildSecondaryVariationApplyKey({
                selectedGameId: selectedVariation.game_id,
                snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                visibleVariationKey: visibleVariationApplyKey,
                selectedVariationId: selectedVariation.id,
                variationFocusRequestId,
            });
            const snapshotInstalled = isSecondaryVariationBaseSnapshotInstalled(
                snapshot,
                secondaryBoardController,
                secondaryVariationBaseInstalledRef.current,
            );
            const reloadDecision = decideSecondaryVariationReloadAction({
                snapshotInstalled,
                currentSecondaryTailMoveNumber,
                snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                treeDirty: secondaryVariationTreeDirtyRef.current,
                desiredApplyKey,
                lastAppliedDesiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
            });

            logVariationStage("reload-or-apply:state", {
                reason,
                currentSecondaryTailMoveNumber,
                snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                snapshotInstalled,
                desiredApplyKey,
                lastAppliedDesiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
                treeDirty: secondaryVariationTreeDirtyRef.current,
                desiredApplyKeyAlreadyApplied: reloadDecision.desiredApplyKeyAlreadyApplied,
                baseSnapshotInstalled: reloadDecision.baseSnapshotInstalled,
                desiredDirtyStateAlreadyDisplayed: reloadDecision.desiredDirtyStateAlreadyDisplayed,
                staleDirtyState: reloadDecision.staleDirtyState,
                needsSnapshotLoad: reloadDecision.needsSnapshotLoad,
                action: reloadDecision.action,
            });

            if (reloadDecision.action === "skip-already-displayed") {
                logVariationStage("reload-or-apply:desired-dirty-state-skip", {
                    reason,
                    desiredApplyKey,
                    currentSecondaryTailMoveNumber,
                    snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    snapshotInstalled,
                    lastAppliedDesiredApplyKey: lastAppliedSecondaryVariationKeyRef.current,
                    treeDirty: secondaryVariationTreeDirtyRef.current,
                });
                scheduleSecondaryBoardVisibleRedraw("desired-dirty-state-skip");
                scheduleSecondaryMoveTreeRedraw();
                return true;
            }

            if (reloadDecision.action === "load-snapshot") {
                const operationId = secondarySnapshotLoadOperationIdRef.current + 1;
                secondarySnapshotLoadOperationIdRef.current = operationId;
                pendingSecondaryVariationBaseLoadRef.current = {
                    controller: secondaryBoardController,
                    controllerEpoch: secondaryBoardControllerEpochRef.current,
                    roomId: currentRoomIdRef.current,
                    gameId: selectedVariation.game_id,
                    operationId,
                };
                suppressSelectedVariationLoadRef.current = true;
                logVariationStage("reload-or-apply:load-snapshot", {
                    reason,
                    currentSecondaryTailMoveNumber,
                    snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    snapshotInstalled,
                    desiredApplyKey,
                    operationId,
                });
                loadSecondaryVariationBaseSnapshot(secondaryBoardController, snapshot);
                const pendingBaseLoad = pendingSecondaryVariationBaseLoadRef.current;
                if (isCurrentPendingSecondarySnapshotLoad(pendingBaseLoad)) {
                    scheduleBaseRetry(`waiting-for-snapshot-load:${reason}`);
                } else {
                    logVariationStage("reload-or-apply:snapshot-load-completed", { reason });
                }
                return true;
            }

            const applied = applyVisibleVariationsToLoadedBase(desiredApplyKey);
            if (applied) {
                return true;
            }

            return false;
        };

        const tryApplyVariationWhenReady = (reason: string): boolean => {
            if (!isCurrentSecondaryLoadController()) {
                logSecondaryBoardStaleCallback("try", { reason });
                return false;
            }

            logVariationStage("try:start", { reason });
            const variationApplication = getApplicableVisibleVariations({
                selectedVariation,
                visibleVariations,
                sourceGame: selectedVariationSourceGame,
            });
            const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                visibleVariations,
                selectedVariationSourceGame,
            );
            if (requiredSnapshotMoveNumber == null) {
                for (const skippedVariation of variationApplication.skippedVariations) {
                    logVariationStage("apply:skip-malformed-visible-variation", {
                        selectedVariationId: selectedVariation.id,
                        skippedVariationId: skippedVariation.variation.id,
                        gameId: skippedVariation.variation.game_id,
                        analysisFrom: skippedVariation.variation.analysis_from ?? null,
                        reason: skippedVariation.reason,
                    });
                }
                logVariationStage("try:selected-variation-invalid", {
                    reason,
                    selectedVariationId: selectedVariation.id,
                    gameId: selectedVariation.game_id,
                    analysisFrom: selectedVariation.analysis_from ?? null,
                    analysisMoves:
                        typeof selectedVariation.analysis_moves === "string"
                            ? selectedVariation.analysis_moves
                            : null,
                    selectedVariationValid: variationApplication.selectedVariationValid,
                    selectedVariationSkipReason: variationApplication.selectedVariationSkipReason,
                });
                return true;
            }

            if (selectedVariation.game_id !== currentRoomGameId) {
                const selectedGameSnapshot = selectedGameBaseSnapshot;
                const selectedGameSnapshotUsable = isSelectedGameBaseSnapshotFreshEnough(
                    selectedGameSnapshot,
                    selectedVariation.game_id,
                    requiredSnapshotMoveNumber,
                );

                if (selectedGameSnapshot != null && selectedGameSnapshotUsable) {
                    const selectedGameBase = captureRoomBaseSnapshotForVariation(
                        selectedGameSnapshot,
                        secondaryBoardController,
                        selectedVariation,
                        visibleVariations,
                        selectedVariationSourceGame,
                    );

                    if (selectedGameBase) {
                        secondaryVariationBaseSnapshotRef.current = selectedGameBase;
                        lastAppliedSecondaryVariationKeyRef.current = null;
                        logVariationStage("try:selected-game-snapshot", {
                            reason,
                            requiredSnapshotMoveNumber,
                            selectedGameId: selectedVariation.game_id,
                            selectedGameTailMoveNumber: selectedGameSnapshot.trunkTailMoveNumber,
                        });
                        return reloadBaseThenApplyVisibleVariations("selected-game-snapshot");
                    }
                }

                if (
                    selectedGameSnapshot != null &&
                    isSelectedGameBaseSnapshotActiveButStale(
                        selectedGameSnapshot,
                        selectedVariation.game_id,
                        requiredSnapshotMoveNumber,
                    )
                ) {
                    logKibitzVariationDebug("selected-game-base-snapshot:active-stale", {
                        reason,
                        selectedVariationId: selectedVariation.id,
                        selectedGameId: selectedVariation.game_id,
                        currentRoomGameId,
                        requiredSnapshotMoveNumber,
                        snapshotGameId: selectedGameSnapshot.gameId,
                        trunkTailMoveNumber: selectedGameSnapshot.trunkTailMoveNumber,
                        source: selectedGameSnapshot.source,
                    });
                    setSelectedGameBaseSnapshot((current) =>
                        current?.gameId === selectedVariation.game_id ? null : current,
                    );
                }

                const selectedGameSnapshotFailure = getBlockingSelectedGameSnapshotFailure(
                    selectedVariation.game_id,
                    requiredSnapshotMoveNumber,
                );
                if (selectedGameSnapshotFailure) {
                    logVariationStage("try:selected-game-snapshot-failed", {
                        reason,
                        requiredSnapshotMoveNumber,
                        selectedGameId: selectedVariation.game_id,
                        failureKind: selectedGameSnapshotFailure.kind,
                        retryAfter: selectedGameSnapshotFailure.retryAfter ?? null,
                        failure: selectedGameSnapshotFailure,
                    });
                    return false;
                }

                if (
                    isSelectedGameSnapshotPending(
                        selectedVariation.game_id,
                        requiredSnapshotMoveNumber,
                    )
                ) {
                    logVariationStage("try:selected-game-snapshot-pending", {
                        reason,
                        requiredSnapshotMoveNumber,
                        selectedGameId: selectedVariation.game_id,
                        currentRoomGameId,
                    });
                    return true;
                }

                void requestSelectedGameBaseSnapshot(requiredSnapshotMoveNumber);
                logVariationStage("try:selected-game-snapshot-needed", {
                    reason,
                    requiredSnapshotMoveNumber,
                    selectedGameId: selectedVariation.game_id,
                    currentRoomGameId,
                });
                return true;
            }

            const sameGameBaseState = getSameGameVariationBaseSnapshotState({
                currentGameBaseSnapshot,
                currentRoomGameId,
                selectedVariation,
                requiredSnapshotMoveNumber,
                mainBoardOfficialTailMoveNumber,
            });

            if (selectedVariation.game_id === currentRoomGameId) {
                const snapshot = currentGameBaseSnapshot;

                logVariationStage("try:current-game-snapshot-state", {
                    reason,
                    requiredSnapshotMoveNumber,
                    requiredSameGameBaseTailMoveNumber:
                        sameGameBaseState.requiredSameGameBaseTailMoveNumber,
                    currentLiveTailMoveNumber: sameGameBaseState.currentLiveTailMoveNumber,
                    mainBoardOfficialTailMoveNumber,
                    currentGameSnapshotGameId: sameGameBaseState.currentGameSnapshotGameId,
                    currentGameSnapshotTailMoveNumber:
                        sameGameBaseState.currentGameSnapshotTailMoveNumber,
                    hasCurrentGameSnapshotMoveTree:
                        sameGameBaseState.hasCurrentGameSnapshotMoveTree,
                    snapshotUsable: sameGameBaseState.snapshotUsable,
                });

                if (!sameGameBaseState.snapshotUsable) {
                    logVariationStage("try:current-game-snapshot-wait", {
                        reason,
                        requiredSnapshotMoveNumber,
                        requiredSameGameBaseTailMoveNumber:
                            sameGameBaseState.requiredSameGameBaseTailMoveNumber,
                        currentLiveTailMoveNumber: sameGameBaseState.currentLiveTailMoveNumber,
                        mainBoardOfficialTailMoveNumber,
                        currentGameSnapshotGameId: sameGameBaseState.currentGameSnapshotGameId,
                        currentGameSnapshotTailMoveNumber:
                            sameGameBaseState.currentGameSnapshotTailMoveNumber,
                        hasCurrentGameSnapshotMoveTree:
                            sameGameBaseState.hasCurrentGameSnapshotMoveTree,
                    });
                    return false;
                }

                if (!snapshot) {
                    return false;
                }

                const currentGameBase = buildSecondaryVariationBaseSnapshotFromCurrentGameSnapshot(
                    snapshot,
                    secondaryBoardController,
                    selectedVariation,
                    visibleVariations,
                    selectedVariationSourceGame,
                );

                if (!currentGameBase) {
                    logVariationStage("try:current-game-snapshot-build-failed", {
                        reason,
                        requiredSnapshotMoveNumber,
                        requiredSameGameBaseTailMoveNumber:
                            sameGameBaseState.requiredSameGameBaseTailMoveNumber,
                        currentGameSnapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    });
                    return false;
                }

                const previousSecondaryBaseSnapshot = secondaryVariationBaseSnapshotRef.current;
                const baseChanged =
                    previousSecondaryBaseSnapshot?.controller !== secondaryBoardController ||
                    previousSecondaryBaseSnapshot?.gameId !== currentGameBase.gameId ||
                    previousSecondaryBaseSnapshot?.trunkTailMoveNumber !==
                        currentGameBase.trunkTailMoveNumber;

                secondaryVariationBaseSnapshotRef.current = currentGameBase;

                if (baseChanged) {
                    lastAppliedSecondaryVariationKeyRef.current = null;
                }

                logVariationStage("try:current-game-snapshot", {
                    reason,
                    requiredSnapshotMoveNumber,
                    requiredSameGameBaseTailMoveNumber:
                        sameGameBaseState.requiredSameGameBaseTailMoveNumber,
                    currentLiveTailMoveNumber: sameGameBaseState.currentLiveTailMoveNumber,
                    selectedGameId: selectedVariation.game_id,
                    currentRoomGameId,
                    currentGameSnapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    previousSecondaryBaseTailMoveNumber:
                        previousSecondaryBaseSnapshot?.trunkTailMoveNumber ?? null,
                    baseChanged,
                });
                return reloadBaseThenApplyVisibleVariations("current-game-snapshot");
            }

            return false;
        };

        const scheduleBaseRetry = (reason: string) => {
            if (
                disposed ||
                secondaryVariationRetryTimeoutRef.current != null ||
                !isCurrentSecondaryLoadController()
            ) {
                if (!isCurrentSecondaryLoadController()) {
                    logSecondaryBoardStaleCallback("retry-schedule", { reason });
                }
                return;
            }

            const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                visibleVariations,
                selectedVariationSourceGame,
            );
            if (
                requiredSnapshotMoveNumber != null &&
                selectedVariation.game_id !== currentRoomGameId
            ) {
                const selectedGameSnapshotFailure = getBlockingSelectedGameSnapshotFailure(
                    selectedVariation.game_id,
                    requiredSnapshotMoveNumber,
                );
                if (selectedGameSnapshotFailure) {
                    if (selectedGameSnapshotFailure.retryAfter == null) {
                        return;
                    }

                    const retryDelay = Math.max(
                        0,
                        selectedGameSnapshotFailure.retryAfter - Date.now(),
                    );
                    secondaryVariationRetryTimeoutRef.current = window.setTimeout(() => {
                        secondaryVariationRetryTimeoutRef.current = null;
                        if (disposed) {
                            return;
                        }

                        secondaryVariationRetryCountRef.current += 1;
                        if (!tryApplyVariationWhenReady(`retry:${reason}`)) {
                            scheduleBaseRetry(reason);
                        }
                    }, retryDelay);
                    return;
                }
            }

            if (secondaryVariationRetryCountRef.current >= maxBaseRetryCount) {
                if (!loggedBaseRetryTimeout) {
                    loggedBaseRetryTimeout = true;
                    warnVariationApplyTimeout(reason);
                }
                return;
            }

            secondaryVariationRetryTimeoutRef.current = window.setTimeout(() => {
                secondaryVariationRetryTimeoutRef.current = null;
                if (disposed) {
                    return;
                }

                secondaryVariationRetryCountRef.current += 1;
                if (!tryApplyVariationWhenReady(`retry:${reason}`)) {
                    scheduleBaseRetry(reason);
                }
            }, baseRetryDelayMs);
        };

        const onLoad = () => {
            const pendingBaseLoad = pendingSecondaryVariationBaseLoadRef.current;
            if (disposed || !isCurrentSecondaryLoadController()) {
                if (isCurrentPendingSecondarySnapshotLoad(pendingBaseLoad)) {
                    logVariationStage("event:load:continuation-missed");
                } else if (!disposed) {
                    logSecondaryBoardStaleCallback("event-load");
                }
                return;
            }

            if (isCurrentPendingSecondarySnapshotLoad(pendingBaseLoad)) {
                logVariationStage("event:load:snapshot-complete");
                const loadedSnapshot = secondaryVariationBaseSnapshotRef.current;
                if (!loadedSnapshot) {
                    logVariationStage("event:load:snapshot-missing");
                    scheduleBaseRetry("snapshot-load-snapshot-missing");
                    return;
                }

                pendingSecondaryVariationBaseLoadRef.current = null;
                suppressSelectedVariationLoadRef.current = false;
                secondaryVariationTreeDirtyRef.current = false;
                secondaryVariationBaseInstalledRef.current =
                    markInstalledSecondaryVariationBaseState(
                        secondaryBoardController,
                        selectedVariation.game_id,
                    );

                if (
                    !applyVisibleVariationsToLoadedBase(
                        buildSecondaryVariationApplyKey({
                            selectedGameId: selectedVariation.game_id,
                            snapshotTailMoveNumber: loadedSnapshot.trunkTailMoveNumber,
                            visibleVariationKey: visibleVariationApplyKey,
                            selectedVariationId: selectedVariation.id,
                            variationFocusRequestId,
                        }),
                    )
                ) {
                    scheduleBaseRetry("snapshot-load-apply-failed");
                } else {
                    clearSecondaryVariationRetryTimeout();
                    secondaryVariationRetryCountRef.current = 0;
                }
                return;
            }

            if (suppressSelectedVariationLoadRef.current) {
                logVariationStage("event:load:suppressed");
                return;
            }

            if (secondaryVariationTreeDirtyRef.current) {
                logVariationStage("event:load:dirty-ignored");
                if (!disposed) {
                    logSecondaryBoardStaleCallback("event-load");
                }
                return;
            }
            logVariationStage("event:load:source-hydration");
            secondaryVariationTreeDirtyRef.current = false;
            secondaryVariationBaseHydrationRef.current = {
                controller: secondaryBoardController,
                gameId: selectedVariation.game_id,
            };
            secondaryVariationBaseInstalledRef.current = markInstalledSecondaryVariationBaseState(
                secondaryBoardController,
                selectedVariation.game_id,
            );

            if (!tryApplyVariationWhenReady("load")) {
                scheduleBaseRetry("load-not-ready");
            }
        };

        const onBaseMaybeReady = () => {
            if (
                disposed ||
                suppressSelectedVariationLoadRef.current ||
                !isCurrentSecondaryLoadController()
            ) {
                if (!disposed && !suppressSelectedVariationLoadRef.current) {
                    logSecondaryBoardStaleCallback("event-base-maybe-ready");
                }
                return;
            }

            logVariationStage("event:base-maybe-ready");
            if (
                !secondaryVariationTreeDirtyRef.current &&
                isSecondaryVariationSnapshotReady(
                    secondaryBoardController,
                    selectedVariation,
                    visibleVariations,
                    selectedVariationSourceGame,
                )
            ) {
                secondaryVariationBaseHydrationRef.current = {
                    controller: secondaryBoardController,
                    gameId: selectedVariation.game_id,
                };
            }

            if (!tryApplyVariationWhenReady("base-maybe-ready")) {
                scheduleBaseRetry("base-maybe-ready-not-ready");
            }
        };

        goban.on("load", onLoad);
        goban.on("gamedata", onBaseMaybeReady);
        goban.on("last_official_move", onBaseMaybeReady);

        if (goban.engine?.last_official_move) {
            onBaseMaybeReady();
        }

        return () => {
            disposed = true;
            clearSecondaryVariationRetryTimeout();
            goban.off("load", onLoad);
            goban.off("gamedata", onBaseMaybeReady);
            goban.off("last_official_move", onBaseMaybeReady);
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
            const pendingBaseLoad = pendingSecondaryVariationBaseLoadRef.current;
            if (
                pendingBaseLoad?.controller === secondaryBoardController &&
                pendingBaseLoad.gameId === selectedVariation.game_id
            ) {
                pendingSecondaryVariationBaseLoadRef.current = null;
                suppressSelectedVariationLoadRef.current = false;
            }
        };
    }, [
        clearSecondaryVariationRetryTimeout,
        currentRoomGameId,
        mainBoardController,
        mainBoardOfficialTailMoveNumber,
        currentGameBaseSnapshot,
        selectedGameBaseSnapshot,
        selectedGameBaseSnapshotLoadingGameId,
        secondaryBoardController,
        secondaryMoveTreeContainer,
        secondaryPane.preview_game_id,
        selectedVariationSourceGame,
        selectedVariationApplyKey,
        visibleVariationApplyKey,
        variationColorApplyKey,
        variationFocusRequestId,
        scheduleSecondaryBoardVisibleRedraw,
        scheduleSecondaryMoveTreeRedraw,
    ]);

    React.useEffect(() => {
        if (
            !draftBaseVariation ||
            !secondaryBoardController ||
            secondaryPane.preview_game_id == null ||
            secondaryPane.variation_source_game_id == null
        ) {
            appliedDraftBaseRef.current = clearDraftBaseAppliedState();
            pendingDraftBaseSnapshotLoadRef.current = null;
            return;
        }

        const goban = secondaryBoardController.goban;
        let applyingDraftBase = false;
        let disposed = false;
        const requiredSnapshotMoveNumber =
            typeof draftBaseVariation.analysis_from === "number" &&
            Number.isFinite(draftBaseVariation.analysis_from)
                ? draftBaseVariation.analysis_from
                : null;

        const getDraftBaseDebugDetails = (): Record<string, unknown> => ({
            variationId: draftBaseVariation.id,
            gameId: draftBaseVariation.game_id,
            currentRoomGameId,
            analysisFrom: draftBaseVariation.analysis_from ?? null,
            officialTailMoveNumber: getOfficialTrunkTailMoveNumber(secondaryBoardController),
            controllerEpoch: secondaryBoardControllerEpochRef.current,
            secondaryBoardKey,
            currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
        });

        const isCurrentDraftController = (): boolean =>
            isCurrentDraftSecondaryController({
                controller: secondaryBoardController,
                context: secondaryBoardControllerContextRef.current,
                roomId: currentRoomIdRef.current,
                expectedGameId: secondaryPane.variation_source_game_id ?? null,
                expectedSecondaryBoardKey: secondaryBoardKey,
                currentSecondaryBoardKey: secondaryBoardKey,
                isDetached: isDetachedBoardController(secondaryBoardController),
            });

        const ensureDraftBaseSnapshotLoaded = async (reason: string): Promise<boolean> => {
            if (disposed || !isCurrentDraftController()) {
                logKibitzVariationDebug("draft-base:stale-controller", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                });
                return false;
            }

            if (requiredSnapshotMoveNumber == null) {
                logKibitzVariationDebug("draft-base:snapshot-needed", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                    failureKind: "missing-analysis-from",
                });
                return false;
            }

            const currentTailMoveNumber = getOfficialTrunkTailMoveNumber(secondaryBoardController);
            if (currentTailMoveNumber >= requiredSnapshotMoveNumber) {
                logKibitzVariationDebug("draft-base:anchor-ready", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                });
                return true;
            }

            const pendingLoad = pendingDraftBaseSnapshotLoadRef.current;
            if (
                pendingLoad &&
                pendingLoad.controller === secondaryBoardController &&
                pendingLoad.draftBaseVariationId === draftBaseVariation.id &&
                pendingLoad.gameId === draftBaseVariation.game_id &&
                pendingLoad.requiredMoveNumber === requiredSnapshotMoveNumber
            ) {
                return false;
            }

            logKibitzVariationDebug("draft-base:snapshot-needed", {
                reason,
                ...getDraftBaseDebugDetails(),
            });

            const loadOperationId = draftBaseSnapshotRef.current.loadOperationId + 1;
            draftBaseSnapshotRef.current = {
                controller: secondaryBoardController,
                draftBaseVariationId: draftBaseVariation.id,
                gameId: draftBaseVariation.game_id,
                requiredMoveNumber: requiredSnapshotMoveNumber,
                snapshot: null,
                loadOperationId,
            };
            pendingDraftBaseSnapshotLoadRef.current = {
                controller: secondaryBoardController,
                draftBaseVariationId: draftBaseVariation.id,
                gameId: draftBaseVariation.game_id,
                requiredMoveNumber: requiredSnapshotMoveNumber,
            };

            const roomBaseSnapshot =
                draftBaseVariation.game_id === currentRoomGameId
                    ? captureRoomBaseSnapshotForVariation(
                          currentGameBaseSnapshot,
                          secondaryBoardController,
                          draftBaseVariation,
                          [],
                          secondaryPane.variation_source_game,
                      )
                    : null;

            if (roomBaseSnapshot) {
                logKibitzVariationDebug("draft-base:load-snapshot", {
                    reason,
                    source: "room-base",
                    ...getDraftBaseDebugDetails(),
                    snapshotGameId: roomBaseSnapshot.gameId,
                    trunkTailMoveNumber: roomBaseSnapshot.trunkTailMoveNumber,
                });
                loadSecondaryVariationBaseSnapshot(secondaryBoardController, roomBaseSnapshot);
                draftBaseSnapshotRef.current = {
                    controller: secondaryBoardController,
                    draftBaseVariationId: draftBaseVariation.id,
                    gameId: draftBaseVariation.game_id,
                    requiredMoveNumber: requiredSnapshotMoveNumber,
                    snapshot: roomBaseSnapshot,
                    loadOperationId,
                };
                pendingDraftBaseSnapshotLoadRef.current = null;
                logKibitzVariationDebug("draft-base:snapshot-load-complete", {
                    reason,
                    source: "room-base",
                    ...getDraftBaseDebugDetails(),
                    snapshotGameId: roomBaseSnapshot.gameId,
                    trunkTailMoveNumber: roomBaseSnapshot.trunkTailMoveNumber,
                });
                return true;
            }

            const cachedSnapshot = selectedGameBaseSnapshotCacheRef.current.get(
                draftBaseVariation.game_id,
            );
            if (
                cachedSnapshot &&
                isSelectedGameBaseSnapshotFreshEnough(
                    cachedSnapshot,
                    draftBaseVariation.game_id,
                    requiredSnapshotMoveNumber,
                )
            ) {
                logKibitzVariationDebug("draft-base:selected-game-snapshot-cache-hit", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                    snapshotGameId: cachedSnapshot.gameId,
                    trunkTailMoveNumber: cachedSnapshot.trunkTailMoveNumber,
                });
            } else {
                logKibitzVariationDebug("draft-base:selected-game-snapshot-request", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                });
            }

            const selectedGameSnapshot = await requestSelectedGameBaseSnapshotForGame({
                gameId: draftBaseVariation.game_id,
                variationId: draftBaseVariation.id,
                requiredSnapshotMoveNumber,
                installAsActiveSelectedSnapshot: false,
            });

            if (disposed || draftBaseSnapshotRef.current.loadOperationId !== loadOperationId) {
                logKibitzVariationDebug("draft-base:stale-controller", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                    loadOperationId,
                });
                return false;
            }

            pendingDraftBaseSnapshotLoadRef.current = null;

            if (!selectedGameSnapshot) {
                const failure = getBlockingSelectedGameSnapshotFailure(
                    draftBaseVariation.game_id,
                    requiredSnapshotMoveNumber,
                );
                logKibitzVariationDebug("draft-base:selected-game-snapshot-failed", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                    failureKind: failure?.kind ?? null,
                    retryAfter: failure?.retryAfter ?? null,
                    failure,
                });
                return false;
            }

            const draftBaseSnapshot = buildDraftBaseSnapshotFromSelectedGameSnapshot({
                selectedGameSnapshot,
                gameId: draftBaseVariation.game_id,
                controller: secondaryBoardController,
            });

            if (!draftBaseSnapshot) {
                logKibitzVariationDebug("draft-base:selected-game-snapshot-missing-move-tree", {
                    reason,
                    ...getDraftBaseDebugDetails(),
                    selectedGameId: draftBaseVariation.game_id,
                    snapshotGameId: selectedGameSnapshot.gameId,
                    trunkTailMoveNumber: selectedGameSnapshot.trunkTailMoveNumber,
                    hasConfig: Boolean(selectedGameSnapshot?.config),
                    hasMoveTree: Boolean(selectedGameSnapshot?.config?.move_tree),
                });
                recordSelectedGameSnapshotFailureForCurrent({
                    gameId: draftBaseVariation.game_id,
                    variationId: draftBaseVariation.id,
                    requiredMoveNumber: requiredSnapshotMoveNumber,
                    kind: "invalid-game-data",
                    message: "Selected-game snapshot did not include a move tree",
                    details: {
                        hasDetails: Boolean(selectedGameSnapshot),
                        hasConfig: Boolean(selectedGameSnapshot?.config),
                        hasMoveTree: Boolean(selectedGameSnapshot?.config?.move_tree),
                        snapshotGameId: selectedGameSnapshot?.gameId ?? null,
                        trunkTailMoveNumber: selectedGameSnapshot?.trunkTailMoveNumber ?? null,
                    },
                });
                return false;
            }

            logKibitzVariationDebug("draft-base:load-snapshot", {
                reason,
                source: "selected-game-snapshot",
                ...getDraftBaseDebugDetails(),
                snapshotGameId: draftBaseSnapshot.gameId,
                trunkTailMoveNumber: draftBaseSnapshot.trunkTailMoveNumber,
            });
            loadSecondaryVariationBaseSnapshot(secondaryBoardController, draftBaseSnapshot);
            draftBaseSnapshotRef.current = {
                controller: secondaryBoardController,
                draftBaseVariationId: draftBaseVariation.id,
                gameId: draftBaseVariation.game_id,
                requiredMoveNumber: requiredSnapshotMoveNumber,
                snapshot: draftBaseSnapshot,
                loadOperationId,
            };
            logKibitzVariationDebug("draft-base:snapshot-load-complete", {
                reason,
                source: "selected-game-snapshot",
                ...getDraftBaseDebugDetails(),
                snapshotGameId: draftBaseSnapshot.gameId,
                trunkTailMoveNumber: draftBaseSnapshot.trunkTailMoveNumber,
            });
            return true;
        };

        const tryApplyDraftBaseVariation = (): boolean => {
            if (disposed || applyingDraftBase) {
                return true;
            }

            if (!isCurrentDraftController()) {
                logKibitzVariationDebug("draft-base:stale-controller", {
                    reason: "apply",
                    ...getDraftBaseDebugDetails(),
                });
                return false;
            }

            if (requiredSnapshotMoveNumber == null) {
                logKibitzVariationDebug("draft-base:snapshot-needed", {
                    reason: "apply",
                    ...getDraftBaseDebugDetails(),
                    failureKind: "missing-analysis-from",
                });
                return false;
            }

            if (
                isDraftBaseAlreadyApplied(
                    appliedDraftBaseRef.current,
                    secondaryBoardController,
                    draftBaseVariation.id,
                )
            ) {
                logKibitzVariationDebug("draft-base:skip-already-applied", {
                    variationId: draftBaseVariation.id,
                    appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                    currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                    appliedEngineMatches:
                        appliedDraftBaseRef.current.engine ===
                        secondaryBoardController.goban.engine,
                });
                return true;
            }

            const colorIndex = getVariationColorIndex(variationColorIndexes, draftBaseVariation.id);
            if (colorIndex == null) {
                return false;
            }

            if (!isVariationOfficialAnchorReady(secondaryBoardController, draftBaseVariation)) {
                logKibitzVariationDebug("draft-base:snapshot-needed", {
                    reason: "anchor-not-ready",
                    ...getDraftBaseDebugDetails(),
                });
                void ensureDraftBaseSnapshotLoaded("anchor-not-ready").then((loaded) => {
                    if (!loaded || disposed) {
                        return;
                    }

                    void tryApplyDraftBaseVariation();
                });
                return false;
            }

            logKibitzVariationDebug("draft-base:anchor-ready", {
                reason: "apply",
                ...getDraftBaseDebugDetails(),
            });
            applyingDraftBase = true;
            appliedDraftBaseRef.current = markDraftBaseApplied(
                secondaryBoardController,
                draftBaseVariation.id,
            );
            logKibitzVariationDebug("draft-base:apply-start", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                ...getDraftBaseDebugDetails(),
            });
            try {
                const applied = applyKibitzVariationToController(
                    secondaryBoardController,
                    draftBaseVariation,
                    colorIndex,
                    true,
                );
                if (!applied.endpoint) {
                    appliedDraftBaseRef.current = clearDraftBaseAppliedState();
                    logKibitzVariationDebug("draft-base:apply-failed", {
                        variationId: draftBaseVariation.id,
                        reason: "no-endpoint",
                    });
                    return false;
                }

                goban.engine.jumpTo(applied.endpoint);
                goban.redraw(true);
                scheduleSecondaryMoveTreeRedraw();
                logKibitzVariationDebug("draft-base:apply-done", {
                    variationId: draftBaseVariation.id,
                    endpointMoveNumber: applied.endpoint.move_number,
                    currentMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                    ...getDraftBaseDebugDetails(),
                });
                return true;
            } catch (error) {
                appliedDraftBaseRef.current = clearDraftBaseAppliedState();
                logKibitzVariationDebug("draft-base:apply-failed", {
                    variationId: draftBaseVariation.id,
                    error,
                    ...getDraftBaseDebugDetails(),
                });
                return false;
            } finally {
                applyingDraftBase = false;
            }
        };

        const onBaseMaybeReady = () => {
            void tryApplyDraftBaseVariation();
        };

        const onLoad = () => {
            logKibitzVariationDebug("draft-base:event-load", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                ...getDraftBaseDebugDetails(),
            });
            void tryApplyDraftBaseVariation();
        };

        const onGameData = () => {
            logKibitzVariationDebug("draft-base:event-gamedata", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                ...getDraftBaseDebugDetails(),
            });
            void tryApplyDraftBaseVariation();
        };

        const onLastOfficialMove = () => {
            logKibitzVariationDebug("draft-base:event-last-official-move", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
                ...getDraftBaseDebugDetails(),
            });
            void tryApplyDraftBaseVariation();
        };
        goban.on("load", onLoad);
        goban.on("gamedata", onGameData);
        goban.on("last_official_move", onLastOfficialMove);
        onBaseMaybeReady();

        return () => {
            disposed = true;
            goban.off("load", onLoad);
            goban.off("gamedata", onGameData);
            goban.off("last_official_move", onLastOfficialMove);
            pendingDraftBaseSnapshotLoadRef.current = null;
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
        };
    }, [
        draftBaseVariation,
        currentGameBaseSnapshot,
        currentRoomGameId,
        secondaryBoardController,
        secondaryBoardKey,
        secondaryPane.preview_game_id,
        secondaryPane.variation_source_game_id,
        secondaryPane.variation_source_game,
        getBlockingSelectedGameSnapshotFailure,
        variationColorIndexes,
        requestSelectedGameBaseSnapshotForGame,
        scheduleSecondaryMoveTreeRedraw,
    ]);

    React.useEffect(() => {
        const draftKey =
            secondaryPane.variation_source_game_id != null
                ? `${secondaryPane.preview_game_id ?? ""}-${secondaryPane.variation_source_game_id}-${secondaryPane.variation_draft_base_id ?? ""}`
                : null;

        if (
            !isDraftingVariation ||
            !secondaryBoardController ||
            secondaryPane.preview_game_id == null ||
            secondaryPane.variation_source_game_id == null
        ) {
            appliedDraftAnalyzeToolRef.current = {
                controller: secondaryBoardController,
                draftKey: null,
            };
            return;
        }

        if (
            appliedDraftAnalyzeToolRef.current.controller === secondaryBoardController &&
            appliedDraftAnalyzeToolRef.current.draftKey === draftKey
        ) {
            return;
        }

        const goban = secondaryBoardController.goban;
        let applyingDraftAnalyzeTool = false;
        const apply = () => {
            if (applyingDraftAnalyzeTool) {
                return;
            }

            applyingDraftAnalyzeTool = true;
            try {
                secondaryBoardController.setAnalyzeTool("stone", "alternate");
                appliedDraftAnalyzeToolRef.current = {
                    controller: secondaryBoardController,
                    draftKey,
                };
            } finally {
                applyingDraftAnalyzeTool = false;
            }
        };

        const onLoad = () => {
            apply();
        };
        goban.on("load", onLoad);

        if (goban.engine?.last_official_move) {
            apply();
        }

        return () => {
            goban.off("load", onLoad);
        };
    }, [
        isDraftingVariation,
        secondaryBoardController,
        secondaryPane.preview_game_id,
        secondaryPane.variation_draft_base_id,
        secondaryPane.variation_source_game_id,
    ]);

    const displayedTitle = mainGame?.title;
    const mainGameMetadata = mainBoardController
        ? getDesktopMainGameMetadataRowText(
              mainBoardController.goban?.engine?.time_control ?? null,
              mainBoardController.goban?.engine?.config as { handicap?: number | null } | undefined,
          )
        : null;
    const displayedMoveNumber = mainGame?.move_number;
    const mobileBoardTotalMoves = mobileCompareTargetActive
        ? mobileSecondaryOwner === "variation"
            ? (selectedVariation?.move_count ?? previewDisplayedMoveNumber)
            : previewDisplayedMoveNumber
        : displayedMoveNumber;
    const liveMainBoardOfficialTailMoveNumber = mainBoardController
        ? getOfficialTrunkTailMoveNumber(mainBoardController)
        : mainBoardOfficialTailMoveNumber;

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

    const handleCreateVariation = React.useCallback(() => {
        logKibitzVariationDebug("main-board:new-variation-click", {
            gameId: currentRoomGameId,
            selectedVariationId: selectedVariation?.id ?? null,
            mainBoardOfficialTailMoveNumber: liveMainBoardOfficialTailMoveNumber,
        });
        onCreateVariation?.();
    }, [
        currentRoomGameId,
        liveMainBoardOfficialTailMoveNumber,
        onCreateVariation,
        selectedVariation?.id,
    ]);

    const handleCreateVariationFromPostedVariation = React.useCallback(
        (variation: KibitzVariationSummary) => {
            logKibitzVariationDebug("main-board:new-variation-click", {
                gameId: currentRoomGameId,
                selectedVariationId: variation.id,
                selectedGameId: variation.game_id,
                mainBoardOfficialTailMoveNumber: liveMainBoardOfficialTailMoveNumber,
            });
            if (onCreateVariationFromPostedVariation) {
                onCreateVariationFromPostedVariation(variation);
                return;
            }

            onCreateVariation?.();
        },
        [
            currentRoomGameId,
            liveMainBoardOfficialTailMoveNumber,
            onCreateVariation,
            onCreateVariationFromPostedVariation,
        ],
    );

    React.useEffect(() => {
        onMobileCompareControllerChange?.(
            mobileCompareActive
                ? mobileCompareTargetActive
                    ? secondaryBoardController
                    : mainBoardController
                : null,
        );

        return () => {
            onMobileCompareControllerChange?.(null);
        };
    }, [
        mainBoardController,
        mobileCompareActive,
        mobileCompareTargetActive,
        onMobileCompareControllerChange,
        secondaryBoardController,
    ]);

    if (isMobileLayout) {
        const renderMainBoard = Boolean(mainGame && !mobileCompareActive);
        const mobileBoardController = mobileCompareTargetActive
            ? secondaryBoardController
            : mainBoardController;
        const getMobileResizeBoardProps = (owner: MobileBoardResizeOwner) => ({
            isMobile: true,
            size: mobileBoardSize,
            fitMode: "contain" as const,
            respectContainerBounds: true,
            coordinateSafeInput: true,
            allowTransientDragScaling: mobileDividerDragging,
            onTransientDragControllerChange:
                onMobileBoardTransientDragControllerChange != null
                    ? (controller: KibitzBoardTransientDragController | null) =>
                          onMobileBoardTransientDragControllerChange(owner, controller)
                    : undefined,
        });
        const recordMobileBoardRender = (
            boardKind: "main" | "draft" | "preview" | "posted-variation",
            resizeOwner: MobileBoardResizeOwner,
            interactive: boolean,
            gameIdForRender: number | undefined,
        ) => {
            if (!isKibitzBoardSizeDebugEnabled()) {
                return;
            }

            const signature = [
                boardKind,
                interactive ? "interactive" : "static",
                gameIdForRender ?? "none",
                mobileBoardSize,
                mobileBoardSizeReady ? "ready" : "pending",
                mobileSecondaryOwnerRequested,
                mobileSecondaryOwner,
                resizeOwner,
                renderMainBoard ? "main" : "secondary",
            ].join("|");

            if (mobileBoardRenderSignatureRef.current === signature) {
                return;
            }

            mobileBoardRenderSignatureRef.current = signature;
            recordKibitzBoardSizeEvent("mobile-board:render", {
                boardKind,
                size: mobileBoardSize,
                sizeReady: mobileBoardSizeReady,
                fitMode: "contain",
                interactive,
                gameId: gameIdForRender ?? null,
                currentRoomGameId,
                resizeOwner,
                hasTransientDragControllerCallback: Boolean(
                    onMobileBoardTransientDragControllerChange,
                ),
            });
        };

        return (
            <div className="KibitzRoomStage KibitzRoomStage-mobile">
                <div
                    className={
                        "Kibitz-mobile-board-host" +
                        (mobileCompareActive ? " is-compare" : " is-main")
                    }
                >
                    <div
                        className={
                            "mobile-board-fit-slot" +
                            (renderMainBoard && onOpenMobileRooms
                                ? " mobile-board-fit-slot-openable"
                                : "")
                        }
                        ref={(node) => {
                            mobileBoardSlotRef(node);
                            if (renderMainBoard) {
                                mobileMainBoardTarget?.ref(node);
                            } else if (mobileCompareTargetActive) {
                                mobileVariationBoardTarget?.ref(node);
                            }
                        }}
                        onClick={renderMainBoard ? onOpenMobileRooms : undefined}
                        role={renderMainBoard && onOpenMobileRooms ? "button" : undefined}
                        tabIndex={renderMainBoard && onOpenMobileRooms ? 0 : undefined}
                        aria-label={
                            renderMainBoard && onOpenMobileRooms
                                ? pgettext(
                                      "Aria label for opening the mobile kibitz room drawer from the main board",
                                      "Open room drawer",
                                  )
                                : undefined
                        }
                        onKeyDown={
                            renderMainBoard && onOpenMobileRooms
                                ? (event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          onOpenMobileRooms();
                                      }
                                  }
                                : undefined
                        }
                    >
                        {renderMainBoard
                            ? (recordMobileBoardRender("main", "main", false, mainGame?.game_id),
                              (
                                  <KibitzBoard
                                      key={`main-${room.id}-${mainGame?.game_id ?? "none"}-mobile`}
                                      role="main"
                                      gameId={mainGame?.game_id}
                                      currentRoomGameId={currentRoomGameId}
                                      {...boardDimensionsOf(mainGame)}
                                      className="mobile-main-board-surface"
                                      restoreToOfficialTailOnLoad={true}
                                      onReady={setMainBoardController}
                                      {...getMobileResizeBoardProps("main")}
                                  />
                              ))
                            : null}
                        {mobileSecondaryOwnerRequested === "preview" ||
                        mobileSecondaryOwnerRequested === "draft" ? (
                            mobileBoardSizeReady ? (
                                mobileSecondaryBoardDimensions ? (
                                    mobileSecondaryOwner === "draft" ? (
                                        (recordMobileBoardRender(
                                            "draft",
                                            "draft",
                                            true,
                                            mobileSecondaryBoardDimensions.gameId ??
                                                secondaryBoardGame?.game_id ??
                                                secondaryGameId ??
                                                secondaryPane.variation_source_game_id,
                                        ),
                                        (
                                            <KibitzBoard
                                                key={mobileSecondaryBoardKey}
                                                gameId={
                                                    mobileSecondaryBoardDimensions.gameId ??
                                                    secondaryBoardGame?.game_id ??
                                                    secondaryGameId ??
                                                    secondaryPane.variation_source_game_id
                                                }
                                                currentRoomGameId={currentRoomGameId}
                                                connectToGame={false}
                                                width={mobileSecondaryBoardDimensions.width}
                                                height={mobileSecondaryBoardDimensions.height}
                                                className="mobile-secondary-board-surface"
                                                interactive={true}
                                                moveTree={secondaryPane.variation_source_move_tree}
                                                movePath={secondaryPane.variation_source_move_path}
                                                onReady={setSecondaryBoardController}
                                                {...getMobileResizeBoardProps("draft")}
                                            />
                                        ))
                                    ) : (
                                        (recordMobileBoardRender(
                                            "preview",
                                            "preview",
                                            false,
                                            mobileSecondaryBoardDimensions.gameId ??
                                                secondaryBoardGame?.game_id ??
                                                secondaryGameId ??
                                                secondaryPane.variation_source_game_id,
                                        ),
                                        (
                                            <KibitzBoard
                                                key={mobileSecondaryBoardKey}
                                                gameId={
                                                    mobileSecondaryBoardDimensions.gameId ??
                                                    secondaryBoardGame?.game_id ??
                                                    secondaryGameId ??
                                                    secondaryPane.variation_source_game_id
                                                }
                                                currentRoomGameId={currentRoomGameId}
                                                connectToGame={false}
                                                width={mobileSecondaryBoardDimensions.width}
                                                height={mobileSecondaryBoardDimensions.height}
                                                className="mobile-secondary-board-surface"
                                                interactive={false}
                                                moveTree={secondaryPane.variation_source_move_tree}
                                                movePath={secondaryPane.variation_source_move_path}
                                                onReady={setSecondaryBoardController}
                                                {...getMobileResizeBoardProps("preview")}
                                            />
                                        ))
                                    )
                                ) : (
                                    <div
                                        className="secondary-board-empty-state"
                                        data-kibitz-board-pending-size="true"
                                        aria-hidden="true"
                                    />
                                )
                            ) : (
                                <div
                                    className="secondary-board-empty-state"
                                    data-kibitz-board-pending-size="true"
                                    aria-hidden="true"
                                />
                            )
                        ) : null}
                        {mobileSecondaryOwner === "variation" ? (
                            mobileBoardSizeReady ? (
                                (recordMobileBoardRender(
                                    "posted-variation",
                                    "variation",
                                    false,
                                    selectedVariation?.game_id,
                                ),
                                (
                                    <KibitzBoard
                                        key={mobileSecondaryBoardKey}
                                        gameId={selectedVariation?.game_id}
                                        currentRoomGameId={currentRoomGameId}
                                        connectToGame={false}
                                        {...boardDimensionsOf(selectedVariationSourceGame)}
                                        className="mobile-secondary-board-surface"
                                        interactive={false}
                                        moveTree={secondaryPane.variation_source_move_tree}
                                        movePath={secondaryPane.variation_source_move_path}
                                        onReady={setSecondaryBoardController}
                                        {...getMobileResizeBoardProps("variation")}
                                    />
                                ))
                            ) : (
                                <div
                                    className="secondary-board-empty-state"
                                    data-kibitz-board-pending-size="true"
                                    aria-hidden="true"
                                />
                            )
                        ) : null}
                        {mobileSecondaryOwnerBlocked ? (
                            <div className="secondary-board-empty-state">
                                <div className="secondary-board-empty-message">
                                    {pgettext(
                                        "Mobile Kibitz placeholder while a variation board is preparing",
                                        "Preparing board...",
                                    )}
                                </div>
                            </div>
                        ) : null}
                        {mobileCompareActive &&
                        !mobileCompareTargetActive &&
                        !mobileSecondaryOwnerBlocked ? (
                            <div className="secondary-board-empty-state mobile-compare-empty-state">
                                <button
                                    type="button"
                                    className="xs primary kibitz-create-variation-button"
                                    onClick={handleCreateVariation}
                                >
                                    {pgettext(
                                        "Button label for opening Kibitz variation creation",
                                        "Create variation",
                                    )}
                                </button>
                                <div className="secondary-board-empty-message mobile-compare-empty-hint">
                                    {pgettext(
                                        "Hint for the mobile kibitz compare board before a variation is selected",
                                        "Or select a posted variation below",
                                    )}
                                </div>
                            </div>
                        ) : null}
                        {!renderMainBoard && !mobileCompareTargetActive ? (
                            <div className="secondary-board-empty-state">
                                <div className="secondary-board-empty-message">
                                    {pgettext(
                                        "Placeholder for the mobile kibitz board area before a board is available",
                                        "Board will render here",
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div className="mobile-board-controls-row" ref={mobilePanelSwitcherTarget?.ref}>
                        <button
                            type="button"
                            className={
                                "kibitz-mobile-transport-button kibitz-mobile-stage-panel-button mobile-board-controls-toggle" +
                                (mobileCompanionPanel === "compare" ? " active" : "")
                            }
                            ref={mobileVariationsTabTarget?.ref}
                            onClick={() =>
                                onSelectMobileCompanionPanel?.(
                                    mobileCompanionPanel === "compare" ? "chat" : "compare",
                                )
                            }
                            aria-pressed={mobileCompanionPanel === "compare"}
                        >
                            <span className="kibitz-mobile-transport-label">
                                {mobileCompanionPanel === "compare"
                                    ? pgettext(
                                          "Mobile kibitz transport-row toggle label",
                                          "Main board",
                                      )
                                    : pgettext(
                                          "Mobile kibitz transport-row toggle label",
                                          "To Variations",
                                      )}
                            </span>
                        </button>
                        <div className="mobile-board-controls-transport">
                            <KibitzBoardControls
                                controller={mobileBoardController}
                                variant="minimal"
                                totalMoves={mobileBoardTotalMoves}
                                showReturnLiveButton={false}
                                onReturnLiveVisibilityChange={setMobileReturnLiveAvailable}
                            />
                        </div>
                        <div className="mobile-board-controls-panels">
                            {/* Back to live is intentionally only exposed in chat mode on mobile;
                                compare mode keeps the right column reserved for New variation. */}
                            {mobileReturnLiveAvailable && mobileCompanionPanel !== "compare" ? (
                                <button
                                    type="button"
                                    className="kibitz-mobile-transport-button kibitz-mobile-stage-panel-button primary mobile-board-controls-return-live"
                                    onClick={() => mobileBoardController?.gotoLastMove()}
                                >
                                    <span className="kibitz-mobile-transport-label">
                                        {pgettext(
                                            "Mobile kibitz transport-row action for returning to the latest move",
                                            "Back to live",
                                        )}
                                    </span>
                                </button>
                            ) : null}
                            {mobileHasActiveVote ? (
                                <button
                                    type="button"
                                    className={
                                        "kibitz-mobile-transport-button kibitz-mobile-stage-panel-button" +
                                        (mobileCompanionPanel === "vote" ? " active" : "")
                                    }
                                    onClick={() => onSelectMobileCompanionPanel?.("vote")}
                                >
                                    <span className="kibitz-mobile-transport-label">
                                        {pgettext(
                                            "Mobile kibitz transport-row panel button label",
                                            "Vote",
                                        )}
                                    </span>
                                </button>
                            ) : null}
                            {mobileCompareActive &&
                            mobileCompareTargetActive &&
                            !isDraftingVariation ? (
                                <button
                                    type="button"
                                    className="kibitz-mobile-transport-button kibitz-mobile-stage-panel-button primary mobile-board-controls-new-variation"
                                    ref={mobileVariationActionsTarget?.ref}
                                    onClick={() => {
                                        if (
                                            selectedVariation &&
                                            onCreateVariationFromPostedVariation
                                        ) {
                                            handleCreateVariationFromPostedVariation(
                                                selectedVariation,
                                            );
                                            return;
                                        }

                                        handleCreateVariation();
                                    }}
                                >
                                    <span className="kibitz-mobile-transport-label">
                                        {pgettext(
                                            "Mobile kibitz transport-row action for starting a new variation",
                                            "New variation",
                                        )}
                                    </span>
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="KibitzRoomStage">
            <div className="room-stage-header">
                <div className="board-title-row">
                    <div className="board-titleRowMain">
                        <button
                            type="button"
                            className="board-settings-button"
                            onClick={openRoomSettings}
                            ref={desktopRoomSettingsTarget?.ref}
                            aria-label={pgettext(
                                "Aria label for opening room settings in Kibitz",
                                "Room settings",
                            )}
                        >
                            <i className="fa fa-gear" aria-hidden="true" />
                        </button>
                        <div className="board-title" ref={desktopRoomTitleTarget?.ref}>
                            {room.title}
                        </div>
                    </div>
                    <KibitzDesktopMainGameScoreboard
                        controller={mainBoardController}
                        game={mainGame}
                    />
                    <div className="board-subtitle">
                        {mainGame ? (
                            <>
                                <a
                                    className="board-subtitle-link"
                                    href={`/game/${mainGame.game_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={pgettext(
                                        "Aria label for opening the original game from Kibitz",
                                        "Open original game",
                                    )}
                                >
                                    {displayedTitle}
                                </a>
                                {mainGameMetadata ? (
                                    <span className="board-subtitle-meta">
                                        <span className="board-subtitle-meta-line">
                                            {mainGameMetadata.timeText}
                                        </span>
                                        <span className="board-subtitle-meta-line">
                                            {mainGameMetadata.handicapText}
                                        </span>
                                    </span>
                                ) : null}
                            </>
                        ) : (
                            pgettext(
                                "Placeholder when no main game is loaded in a kibitz room",
                                "No main board selected yet",
                            )
                        )}
                    </div>
                </div>
            </div>
            <div className={`KibitzRoomStage-boards secondary-pane-${secondaryPaneSize}`}>
                <div className="board-panel main-board">
                    <div className="panel-body">
                        {mainGame ? (
                            <div
                                className={
                                    "board-content " +
                                    (isDraftingVariation
                                        ? "board-content-draft"
                                        : "board-content-preview")
                                }
                            >
                                <div
                                    className="board-fit-slot"
                                    ref={(node) => {
                                        mainBoardSlotRef(node);
                                        desktopMainBoardTarget?.ref(node);
                                    }}
                                >
                                    <KibitzBoard
                                        key={`main-${room.id}-${mainGame.game_id}`}
                                        role="main"
                                        gameId={mainGame.game_id}
                                        currentRoomGameId={currentRoomGameId}
                                        isMobile={false}
                                        {...boardDimensionsOf(mainGame)}
                                        className="main-board-surface"
                                        size={mainBoardSize}
                                        respectContainerBounds={true}
                                        restoreToOfficialTailOnLoad={true}
                                        onReady={setMainBoardController}
                                    />
                                </div>
                                <div
                                    className={
                                        "main-board-transport-row" +
                                        (secondaryPaneSize === "hidden" &&
                                        mainGame &&
                                        onCreateVariation
                                            ? " has-new-variation"
                                            : "")
                                    }
                                >
                                    <div className="board-actions board-actions-inline board-actions-right main-board-return-live-action">
                                        <button
                                            type="button"
                                            className={
                                                "kibitz-return-live-button" +
                                                (secondaryPaneSize === "equal" ? " compact" : "") +
                                                (mainReturnLiveAvailable ? "" : " is-hidden")
                                            }
                                            onClick={() => mainBoardController?.gotoLastMove()}
                                            aria-hidden={!mainReturnLiveAvailable}
                                            tabIndex={mainReturnLiveAvailable ? 0 : -1}
                                        >
                                            {mainReturnLiveLabel}
                                        </button>
                                    </div>
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={mainBoardController}
                                            variant="minimal"
                                            totalMoves={displayedMoveNumber}
                                            showReturnLiveButton={false}
                                            onReturnLiveVisibilityChange={
                                                setMainReturnLiveAvailable
                                            }
                                        />
                                    </div>
                                    {secondaryPaneSize === "hidden" &&
                                    mainGame &&
                                    onCreateVariation ? (
                                        <div className="board-actions board-actions-inline board-actions-left main-board-new-variation-action">
                                            <button
                                                type="button"
                                                className="kibitz-move-control create-variation-button"
                                                onClick={handleCreateVariation}
                                            >
                                                {pgettext(
                                                    "Button label for opening Kibitz variation creation",
                                                    "New variation",
                                                )}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                {secondaryPaneSize === "equal" ? (
                                    <div className="main-board-analyze-spacer" aria-hidden="true" />
                                ) : null}
                                {secondaryPaneSize === "equal" ? (
                                    <div className="main-board-compose-spacer" aria-hidden="true" />
                                ) : null}
                                {secondaryPaneSize === "equal" ? (
                                    <div
                                        className="main-board-variation-spacer"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                {secondaryPaneSize !== "equal" ? (
                                    <div className="board-content-spacer" aria-hidden="true" />
                                ) : null}
                            </div>
                        ) : (
                            <div className="secondary-board-empty-state">
                                <div className="secondary-board-empty-message">
                                    {pgettext(
                                        "Placeholder for the primary kibitz goban area before the board is wired up",
                                        "Shared board will render here",
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    className={
                        "board-panel secondary-board" +
                        (secondaryPane.collapsed ? " collapsed" : "")
                    }
                >
                    <div className="panel-body">
                        {secondaryPane.collapsed ? (
                            pgettext(
                                "Placeholder when the secondary board is collapsed in kibitz",
                                "Secondary pane is collapsed",
                            )
                        ) : secondaryGameId ? (
                            <div className="board-content board-content-variation">
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    {secondaryBoardSizeReady ? (
                                        <KibitzBoard
                                            key={secondaryBoardKey}
                                            gameId={secondaryGameId}
                                            currentRoomGameId={currentRoomGameId}
                                            isMobile={false}
                                            connectToGame={false}
                                            {...boardDimensionsOf(secondaryBoardGame)}
                                            className="secondary-board-surface"
                                            size={secondaryBoardSize}
                                            interactive={secondaryPaneSize === "equal"}
                                            respectContainerBounds={true}
                                            moveTree={secondaryPane.variation_source_move_tree}
                                            movePath={secondaryPane.variation_source_move_path}
                                            onReady={setSecondaryBoardController}
                                        />
                                    ) : (
                                        <div
                                            className="secondary-board-empty-state"
                                            data-kibitz-board-pending-size="true"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="secondary-board-return-live-action">
                                        {secondaryReturnLiveAvailable ? (
                                            <button
                                                type="button"
                                                className="kibitz-return-live-button"
                                                onClick={() =>
                                                    secondaryBoardController?.gotoLastMove()
                                                }
                                            >
                                                {pgettext(
                                                    "Button label for returning the kibitz board to the live move",
                                                    "Back to live",
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={previewDisplayedMoveNumber}
                                            onReturnLiveVisibilityChange={
                                                setSecondaryReturnLiveAvailable
                                            }
                                        />
                                    </div>
                                    <div className="board-actions board-actions-inline">
                                        <button
                                            type="button"
                                            className="preview-action-button clear-preview symbol-button"
                                            onClick={onConfirmClearSecondaryPane}
                                            aria-label={pgettext(
                                                "Aria label for closing the preview game in the secondary kibitz pane",
                                                "Clear",
                                            )}
                                            title={pgettext(
                                                "Tooltip label for closing the preview game in the secondary kibitz pane",
                                                "Clear",
                                            )}
                                        >
                                            X
                                        </button>
                                    </div>
                                </div>
                                {isDraftingVariation &&
                                secondaryPaneSize === "equal" &&
                                secondaryBoardController ? (
                                    <div className="secondary-board-analyze-row">
                                        <GobanAnalyzeButtonBar
                                            controller={secondaryBoardController}
                                            showBackToGame={false}
                                            showConditionalPlannerButton={false}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        key={secondaryMoveTreeKey}
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        onResize={handleSecondaryMoveTreeResize}
                                        ref={handleSecondaryMoveTreeContainerRef}
                                    />
                                ) : null}
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-node-text-row">
                                        <KibitzNodeText
                                            controller={secondaryBoardController}
                                            editable={isDraftingVariation}
                                        />
                                    </div>
                                ) : null}
                                {isDraftingVariation &&
                                secondaryPaneSize === "equal" &&
                                secondaryBoardController ? (
                                    <div className="secondary-board-compose-row">
                                        <KibitzVariationComposer
                                            controller={secondaryBoardController}
                                            onSubmit={(controller) =>
                                                onPostVariation(
                                                    controller,
                                                    secondaryPane.variation_source_game_id,
                                                )
                                            }
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize !== "equal" ? (
                                    <div className="board-content-spacer" aria-hidden="true" />
                                ) : null}
                            </div>
                        ) : selectedVariation ? (
                            <div className="board-content board-content-posted-variation">
                                <div
                                    className="board-fit-slot"
                                    ref={(node) => {
                                        secondaryBoardSlotRef(node);
                                        desktopVariationBoardTarget?.ref(node);
                                    }}
                                >
                                    {secondaryBoardSizeReady ? (
                                        <KibitzBoard
                                            key={secondaryBoardKey}
                                            gameId={selectedVariation?.game_id}
                                            currentRoomGameId={currentRoomGameId}
                                            isMobile={false}
                                            connectToGame={false}
                                            {...boardDimensionsOf(selectedVariationSourceGame)}
                                            className="secondary-board-surface"
                                            size={secondaryBoardSize}
                                            interactive={false}
                                            respectContainerBounds={true}
                                            moveTree={secondaryPane.variation_source_move_tree}
                                            movePath={secondaryPane.variation_source_move_path}
                                            onReady={setSecondaryBoardController}
                                        />
                                    ) : (
                                        <div
                                            className="secondary-board-empty-state"
                                            data-kibitz-board-pending-size="true"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="secondary-board-return-live-action">
                                        {secondaryReturnLiveAvailable ? (
                                            <button
                                                type="button"
                                                className="kibitz-return-live-button"
                                                onClick={() =>
                                                    secondaryBoardController?.gotoLastMove()
                                                }
                                            >
                                                {pgettext(
                                                    "Button label for returning the kibitz board to the live move",
                                                    "Back to live",
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={selectedVariation.move_count}
                                            onReturnLiveVisibilityChange={
                                                setSecondaryReturnLiveAvailable
                                            }
                                        />
                                    </div>
                                    <div className="board-actions board-actions-inline board-actions-left">
                                        {secondaryPaneSize === "equal" &&
                                        onCreateVariationFromPostedVariation ? (
                                            <button
                                                type="button"
                                                className="kibitz-move-control create-variation-button"
                                                ref={desktopVariationActionsTarget?.ref}
                                                onClick={() =>
                                                    handleCreateVariationFromPostedVariation(
                                                        selectedVariation,
                                                    )
                                                }
                                            >
                                                {pgettext(
                                                    "Button label for starting a new editable Kibitz variation from a posted variation",
                                                    "New variation",
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        key={secondaryMoveTreeKey}
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        onResize={handleSecondaryMoveTreeResize}
                                        ref={handleSecondaryMoveTreeContainerRef}
                                    />
                                ) : null}
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-node-text-row">
                                        <KibitzNodeText
                                            controller={secondaryBoardController}
                                            editable={false}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize !== "equal" ? (
                                    <div className="board-content-spacer" aria-hidden="true" />
                                ) : null}
                            </div>
                        ) : (
                            <div className="secondary-board-empty-state">
                                <div className="secondary-board-empty-message">
                                    {pgettext(
                                        "Placeholder for the secondary kibitz goban area before the board is wired up",
                                        "Preview or variation board will render here",
                                    )}
                                </div>
                                {mainGame && onCreateVariation ? (
                                    <button
                                        type="button"
                                        className="xs primary kibitz-create-variation-button"
                                        onClick={handleCreateVariation}
                                    >
                                        {pgettext(
                                            "Button label for opening Kibitz variation creation",
                                            "Create variation",
                                        )}
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {secondaryMoveNavigationShortcuts}
            <KibitzDividerHandle secondaryPane={secondaryPane} onSetMode={onSetSecondaryPaneMode} />
        </div>
    );
}
