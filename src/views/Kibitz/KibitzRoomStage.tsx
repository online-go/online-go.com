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
import type { GobanConfig, GobanModes, MoveTree, MoveTreeJson } from "goban";
import { Resizable } from "@/components/Resizable";
import { KBShortcut } from "@/components/KBShortcut";
import { Player } from "@/components/Player";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import { close_all_popovers, popover } from "@/lib/popover";
import { alert } from "@/lib/swal_config";
import { pgettext } from "@/lib/translate";
import type {
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzRoomUser,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import { cloneOfficialTrunkMoveTreeJson } from "./kibitzCurrentGameBaseSnapshot";
import { KibitzBoard } from "./KibitzBoard";
import { KibitzBoardControls } from "./KibitzBoardControls";
import { KibitzDividerHandle } from "./KibitzDividerHandle";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { KibitzNodeText } from "./KibitzNodeText";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
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
import "./KibitzRoomStage.css";

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
    onCreateVariation?: () => void;
    onCreateVariationFromPostedVariation?: (variation: KibitzVariationSummary) => void;
    variationFocusRequestId: number;
    isMobileLayout?: boolean;
    mobileCompanionPanel?: "chat" | "vote" | "compare";
    mobileHasActiveVote?: boolean;
    onSelectMobileCompanionPanel?: (panel: "chat" | "vote" | "compare") => void;
    onOpenMobileRooms?: () => void;
    onMobileCompareControllerChange?: (controller: GobanController | null) => void;
    onMainBoardControllerChange?: (controller: GobanController | null) => void;
}

function useSquareFitSize<T extends HTMLElement>(
    layoutKey: string,
    constrainToParentHeight = false,
) {
    const [element, setElement] = React.useState<T | null>(null);
    const [size, setSize] = React.useState(0);
    const ref = React.useCallback((node: T | null) => {
        setElement(node);
    }, []);

    React.useLayoutEffect(() => {
        if (!element) {
            setSize(0);
            return;
        }

        let raf = 0;

        const measure = () => {
            const parent = element.parentElement;
            const parentStyle = parent ? window.getComputedStyle(parent) : null;
            const rowGap = Number.parseFloat(parentStyle?.rowGap ?? parentStyle?.gap ?? "0") || 0;
            const visibleChildren = parent
                ? Array.from(parent.children).filter(
                      (child): child is HTMLElement =>
                          child instanceof HTMLElement && child.offsetParent !== null,
                  )
                : [];
            const reservedHeight = visibleChildren.reduce((total, child) => {
                if (child === element || child.classList.contains("board-content-spacer")) {
                    return total;
                }

                return total + child.getBoundingClientRect().height;
            }, 0);
            const fallbackHeight = Math.max(
                0,
                (parent?.clientHeight ?? 0) -
                    reservedHeight -
                    rowGap * Math.max(0, visibleChildren.length - 1),
            );
            const slotRect = element.getBoundingClientRect();
            const slotWidth = Math.floor(slotRect.width || element.clientWidth || 0);
            const slotHeight = Math.floor(slotRect.height || element.clientHeight || 0);
            const usableHeight = constrainToParentHeight
                ? fallbackHeight > 0
                    ? Math.min(slotHeight || fallbackHeight, fallbackHeight)
                    : slotHeight
                : Math.max(slotHeight, fallbackHeight);
            const nextSize = Math.max(0, Math.floor(Math.min(slotWidth, usableHeight)));
            setSize((previousSize) => (previousSize === nextSize ? previousSize : nextSize));
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
    }, [constrainToParentHeight, element, layoutKey]);

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

export type KibitzBoardLoadConfig = Record<string, unknown> & {
    move_tree?: MoveTreeJson;
    moves?: GobanConfig["moves"];
};

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

export interface KibitzCurrentGameBaseSnapshot {
    gameId: number;
    roomId?: string | null;
    trunkTailMoveNumber: number;
    moveTreeId: number | string | null;
    movePath: string;
    source: "main-board" | "room-base-broker" | "game-details";
    config: KibitzBoardLoadConfig;
}

interface TrackedBoardControllerContext {
    controller: GobanController | null;
    epoch: number;
    roomId: string | null;
    gameId: number | null;
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

function cloneMoveTreeJson(moveTree: MoveTreeJson): MoveTreeJson {
    return JSON.parse(JSON.stringify(moveTree)) as MoveTreeJson;
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

export function getRequiredSnapshotMoveForVariation(
    variation: KibitzVariationSummary,
    _sourceGame: KibitzWatchedGame | null | undefined,
): number | null {
    if (typeof variation.analysis_from !== "number" || !Number.isFinite(variation.analysis_from)) {
        return null;
    }

    // The snapshot only needs the anchor move where the variation branches off.
    // The branch continuation itself is supplied by the variation payload.
    return variation.analysis_from;
}

export function getRequiredVariationSnapshotMoveNumber(
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
): number | null {
    const requiredSnapshotMoves = [
        getRequiredSnapshotMoveForVariation(selectedVariation, sourceGame),
        ...visibleVariations.map((variation) =>
            getRequiredSnapshotMoveForVariation(variation, sourceGame),
        ),
    ];

    const validRequiredSnapshotMoves = requiredSnapshotMoves.filter(
        (moveNumber): moveNumber is number => moveNumber != null,
    );

    if (validRequiredSnapshotMoves.length !== requiredSnapshotMoves.length) {
        return null;
    }

    return Math.max(...validRequiredSnapshotMoves);
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

export function captureRoomBaseSnapshotForVariation(
    currentGameBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    secondaryBoardController: GobanController,
    selectedVariation: KibitzVariationSummary,
    visibleVariations: readonly KibitzVariationSummary[],
    sourceGame: KibitzWatchedGame | null | undefined,
): SecondaryVariationBaseSnapshot | null {
    if (!currentGameBaseSnapshot || !sourceGame) {
        return null;
    }

    if (currentGameBaseSnapshot.gameId !== selectedVariation.game_id) {
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

    scheduleVisibleBoardRedrawWhenReady(controller, "secondary", "snapshot-load");
}

function renderInlineAvatar(
    user: KibitzRoomUser | null | undefined,
    className: string,
    iconClassName: string,
): React.ReactElement {
    return (
        <KibitzUserAvatar
            user={user}
            size={16}
            className={className}
            iconClassName={iconClassName}
        />
    );
}

function renderRichPlayerBadge(
    user: KibitzRoomUser | null | undefined,
    fallbackName: string | undefined,
): React.ReactElement {
    return (
        <div className="player-badge">
            {renderInlineAvatar(user, "stage-avatar", "stage-avatar-image")}
            {user ? (
                <Player user={user} flag rank noextracontrols />
            ) : (
                <span className="player-name">{fallbackName}</span>
            )}
        </div>
    );
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
                    logKibitzVariationDebug("visible-goban:redraw-stale-controller", {
                        role,
                        reason,
                        expectedSize: options?.expectedSize ?? null,
                        measuredElement: summarizeElementForDebug(controller?.goban.parent ?? null),
                        parentChain: summarizeParentChain(controller?.goban.parent ?? null),
                    });
                    return;
                }

                const container = controller?.goban.parent ?? null;
                const measuredElement = summarizeElementForDebug(container);
                const parentChain = summarizeParentChain(container);
                const detached = !container || !container.isConnected || parentChain.length <= 1;
                if (detached) {
                    const width = container?.clientWidth ?? 0;
                    const height = container?.clientHeight ?? 0;
                    logKibitzVariationDebug("visible-goban:redraw-detached", {
                        role,
                        reason,
                        width,
                        height,
                        expectedSize: options?.expectedSize ?? null,
                        measuredElement,
                        parentChain,
                    });
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
                        logKibitzVariationDebug("visible-goban:redraw-deferred-zero-size", {
                            role,
                            reason,
                            width,
                            height,
                            expectedSize: options?.expectedSize ?? null,
                            measuredElement: summarizeElementForDebug(container),
                            parentChain: summarizeParentChain(container),
                        });
                        if (!expectedSizeReady) {
                            options?.onDeferred?.();
                        }
                    }
                    if (remainingAttempts > 0) {
                        scheduleAttempt(remainingAttempts - 1);
                    }
                    return;
                }

                const currentMoveNumber = controller?.goban.engine?.cur_move?.move_number ?? null;
                const officialTailMoveNumber =
                    getOfficialTrunkTail(controller?.goban.engine?.move_tree)?.move_number ?? null;

                logKibitzVariationDebug("visible-goban:redraw-request", {
                    role,
                    reason,
                    width,
                    height,
                    currentMoveNumber,
                    officialTailMoveNumber,
                });

                controller?.goban.move_tree_redraw(true);
                controller?.goban.redraw(true);
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
    onCreateVariation,
    onCreateVariationFromPostedVariation,
    variationFocusRequestId,
    isMobileLayout = false,
    mobileCompanionPanel,
    mobileHasActiveVote = false,
    onSelectMobileCompanionPanel,
    onOpenMobileRooms,
    onMobileCompareControllerChange,
    onMainBoardControllerChange,
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
        [canDeleteRoom, canEditRoom, onChangeBoard, onDeleteRoom, onSaveRoomDetails, room],
    );
    const selectedVariationGameId = selectedVariation?.game_id ?? null;
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
            const context = secondaryBoardControllerContextRef.current;
            return Boolean(
                controller &&
                context &&
                context.controller === controller &&
                context.epoch === secondaryBoardControllerEpochRef.current &&
                context.roomId === currentRoomIdRef.current &&
                context.gameId === expectedSecondaryBoardGameId &&
                !isDetachedBoardController(controller),
            );
        },
        [expectedSecondaryBoardGameId, isDetachedBoardController],
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
    const pendingSecondaryMoveTreeRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const pendingMainBoardVisibleRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const pendingSecondaryBoardVisibleRedrawCancelRef = React.useRef<(() => void) | null>(null);
    const lastMainBoardOfficialTailMoveNumberRef = React.useRef(mainGame?.move_number ?? 0);
    const [mainBoardSlotRef, mainBoardSize] = useSquareFitSize<HTMLDivElement>(
        `main-${secondaryPaneSize}`,
    );
    const [secondaryBoardSlotRef, secondaryBoardSize] = useSquareFitSize<HTMLDivElement>(
        `secondary-${secondaryPaneSize}-${secondaryPane.variation_id ?? ""}-${secondaryPane.preview_game_id ?? ""}`,
    );
    const [mobileBoardSlotRef, mobileBoardSize] = useSquareFitSize<HTMLDivElement>(
        `mobile-${secondaryPane.variation_id ?? ""}-${secondaryPane.preview_game_id ?? ""}-${secondaryPane.variation_source_game_id ?? ""}-${mobileCompanionPanel ?? ""}`,
        true,
    );
    const visibleSecondaryBoardSize = isMobileLayout ? mobileBoardSize : secondaryBoardSize;
    const secondaryBoardSizeReady = Number.isFinite(secondaryBoardSize) && secondaryBoardSize > 0;
    const mobileBoardSizeReady = Number.isFinite(mobileBoardSize) && mobileBoardSize > 0;
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
                controllerConnected: Boolean(controllerParent?.isConnected),
                controllerMeasuredElement: summarizeElementForDebug(controllerParent),
                controllerParentChain: summarizeParentChain(controllerParent),
                moveTreeContainerWidth: moveTreeContainer?.clientWidth ?? null,
                moveTreeContainerHeight: moveTreeContainer?.clientHeight ?? null,
                moveTreeContainerConnected: Boolean(moveTreeContainer?.isConnected),
                secondaryBoardKey,
                secondaryMoveTreeKey,
                secondaryBoardRemountNonce,
            };
        },
        [
            expectedSecondaryBoardGameId,
            secondaryBoardKey,
            secondaryBoardRemountNonce,
            secondaryMoveTreeKey,
        ],
    );
    const setSecondaryBoardController = React.useCallback(
        (controller: GobanController | null) => {
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
            if (!isCurrentMainBoardController(mainBoardController)) {
                logKibitzVariationDebug("visible-goban:redraw-stale-controller", {
                    role: "main",
                    reason,
                    controllerPresent: Boolean(mainBoardController),
                });
                return;
            }

            pendingMainBoardVisibleRedrawCancelRef.current?.();
            pendingMainBoardVisibleRedrawCancelRef.current = scheduleVisibleBoardRedrawWhenReady(
                mainBoardController,
                "main",
                reason,
                {
                    expectedSize: mainBoardSize,
                    isControllerCurrent: () => isCurrentMainBoardController(mainBoardController),
                    onDetached: () => {
                        if (
                            mainBoardControllerContextRef.current?.controller ===
                            mainBoardController
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
        room.id,
        selectedVariation?.game_id,
        selectedVariation?.id,
        visibleVariationApplyKey,
        variationFocusRequestId,
        currentGameBaseSnapshot?.gameId,
        currentGameBaseSnapshot?.trunkTailMoveNumber,
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
        if (!mainBoardController) {
            return;
        }

        if (!isCurrentMainBoardController(mainBoardController)) {
            return;
        }

        const goban = mainBoardController.goban;
        let disposed = false;

        const syncMainBoardState = (reason: string): void => {
            if (disposed || !isCurrentMainBoardController(mainBoardController)) {
                return;
            }

            const currentEngine = goban.engine;
            const officialTail = getOfficialTrunkTail(currentEngine.move_tree);
            const officialTailMoveNumber = officialTail?.move_number ?? 0;
            const currentMoveNumber = currentEngine.cur_move?.move_number ?? 0;
            const currentMoveId = currentEngine.cur_move?.id ?? null;

            setMainBoardOfficialTailMoveNumber((previousTailMoveNumber) =>
                previousTailMoveNumber === officialTailMoveNumber
                    ? previousTailMoveNumber
                    : officialTailMoveNumber,
            );
            logKibitzVariationDebug("main-board:state", {
                reason,
                role: "main",
                gameId: currentRoomGameId,
                currentRoomGameId,
                currentMove: summarizeKibitzMoveTreeNode(currentEngine.cur_move),
                currentMoveNumber,
                currentMoveId,
                officialTail: summarizeKibitzMoveTreeNode(officialTail),
                officialTailMoveNumber,
                lastOfficialMove: summarizeKibitzMoveTreeNode(currentEngine.last_official_move),
                lastOfficialMoveNumber: currentEngine.last_official_move?.move_number ?? null,
                lastOfficialMoveId: currentEngine.last_official_move?.id ?? null,
            });
            scheduleMainBoardVisibleRedraw(reason);
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

        goban.on("load", onLoad);
        goban.on("gamedata", onGameData);
        goban.on("last_official_move", onLastOfficialMove);
        goban.on("move-made", onMoveMade);
        syncMainBoardState("controller-create");

        return () => {
            disposed = true;
            goban.off("load", onLoad);
            goban.off("gamedata", onGameData);
            goban.off("last_official_move", onLastOfficialMove);
            goban.off("move-made", onMoveMade);
        };
    }, [currentRoomGameId, mainBoardController, scheduleMainBoardVisibleRedraw]);

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

            const variationsToApply = getVariationsToApply(selectedVariation, visibleVariations);

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
            const alreadyAppliedDesiredState =
                snapshotInstalled &&
                currentSecondaryTailMoveNumber === snapshot.trunkTailMoveNumber &&
                lastAppliedSecondaryVariationKeyRef.current === desiredApplyKey;
            const needsSnapshotLoad =
                !alreadyAppliedDesiredState &&
                (secondaryVariationTreeDirtyRef.current ||
                    !snapshotInstalled ||
                    currentSecondaryTailMoveNumber < snapshot.trunkTailMoveNumber);

            logVariationStage("reload-or-apply:state", {
                reason,
                currentSecondaryTailMoveNumber,
                snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                snapshotInstalled,
                desiredApplyKey,
                alreadyAppliedDesiredState,
                needsSnapshotLoad,
            });

            if (alreadyAppliedDesiredState) {
                logVariationStage("reload-or-apply:already-applied-skip", {
                    reason,
                    desiredApplyKey,
                    currentSecondaryTailMoveNumber,
                    snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
                    snapshotInstalled,
                });
                scheduleSecondaryBoardVisibleRedraw("already-applied-skip");
                return true;
            }

            if (needsSnapshotLoad) {
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
            const requiredSnapshotMoveNumber = getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                visibleVariations,
                selectedVariationSourceGame,
            );
            if (requiredSnapshotMoveNumber == null) {
                logVariationStage("try:missing-analysis-from", {
                    reason,
                    selectedVariationAnalysisFrom: selectedVariation.analysis_from ?? null,
                    visibleVariationAnalysisFroms: visibleVariations.map((variation) => ({
                        id: variation.id,
                        analysisFrom: variation.analysis_from ?? null,
                    })),
                });
                return false;
            }
            const currentLiveTailMoveNumber = Math.max(
                mainBoardOfficialTailMoveNumber,
                currentGameBaseSnapshot?.trunkTailMoveNumber ?? 0,
            );

            let baseSnapshot = secondaryVariationBaseSnapshotRef.current;
            const canReuseSnapshot =
                baseSnapshot != null &&
                baseSnapshot.controller === secondaryBoardController &&
                baseSnapshot.gameId === selectedVariation.game_id &&
                baseSnapshot.trunkTailMoveNumber >= requiredSnapshotMoveNumber &&
                baseSnapshot.trunkTailMoveNumber >= currentLiveTailMoveNumber;
            const snapshotInstalled =
                baseSnapshot != null &&
                baseSnapshot.controller === secondaryBoardController &&
                baseSnapshot.gameId === selectedVariation.game_id &&
                isSecondaryVariationBaseSnapshotInstalled(
                    baseSnapshot,
                    secondaryBoardController,
                    secondaryVariationBaseInstalledRef.current,
                );

            logVariationStage("try:snapshot-state", {
                reason,
                requiredSnapshotMoveNumber,
                currentLiveTailMoveNumber,
                canReuseSnapshot,
                snapshotInstalled,
            });

            if (canReuseSnapshot && secondaryVariationTreeDirtyRef.current) {
                return reloadBaseThenApplyVisibleVariations(reason);
            }

            if (canReuseSnapshot && !secondaryVariationTreeDirtyRef.current) {
                if (!snapshotInstalled) {
                    return reloadBaseThenApplyVisibleVariations(`${reason}:snapshot-not-installed`);
                }

                const loadedBaseSnapshot = baseSnapshot;
                if (!loadedBaseSnapshot) {
                    return reloadBaseThenApplyVisibleVariations(`${reason}:missing-base-snapshot`);
                }

                return applyVisibleVariationsToLoadedBase(
                    buildSecondaryVariationApplyKey({
                        selectedGameId: selectedVariation.game_id,
                        snapshotTailMoveNumber: loadedBaseSnapshot.trunkTailMoveNumber,
                        visibleVariationKey: visibleVariationApplyKey,
                        selectedVariationId: selectedVariation.id,
                        variationFocusRequestId,
                    }),
                );
            }

            if (secondaryVariationTreeDirtyRef.current) {
                logVariationStage("try:dirty-without-snapshot", { reason });
                return false;
            }

            const pendingBaseLoad = pendingSecondaryVariationBaseLoadRef.current;
            if (isCurrentPendingSecondarySnapshotLoad(pendingBaseLoad)) {
                logVariationStage("try:pending-snapshot-load", { reason });
                return false;
            }

            if (
                !isSecondaryVariationSnapshotReady(
                    secondaryBoardController,
                    selectedVariation,
                    visibleVariations,
                    selectedVariationSourceGame,
                )
            ) {
                const mainBoardSnapshot = captureMainBoardBaseSnapshotForVariation(
                    mainBoardController,
                    secondaryBoardController,
                    selectedVariation,
                    visibleVariations,
                    selectedVariationSourceGame,
                );

                if (mainBoardSnapshot) {
                    secondaryVariationBaseSnapshotRef.current = mainBoardSnapshot;
                    lastAppliedSecondaryVariationKeyRef.current = null;
                    logVariationStage("try:main-board-snapshot", {
                        reason,
                        requiredSnapshotMoveNumber,
                        mainTailMoveNumber: mainBoardSnapshot.trunkTailMoveNumber,
                    });
                    return reloadBaseThenApplyVisibleVariations("main-board-snapshot");
                }

                const roomBaseSnapshot = captureRoomBaseSnapshotForVariation(
                    currentGameBaseSnapshot,
                    secondaryBoardController,
                    selectedVariation,
                    visibleVariations,
                    selectedVariationSourceGame,
                );

                if (roomBaseSnapshot) {
                    secondaryVariationBaseSnapshotRef.current = roomBaseSnapshot;
                    lastAppliedSecondaryVariationKeyRef.current = null;
                    logVariationStage("try:room-base-snapshot", {
                        reason,
                        requiredSnapshotMoveNumber,
                        roomBaseTailMoveNumber: roomBaseSnapshot.trunkTailMoveNumber,
                        roomBaseSource: currentGameBaseSnapshot?.source ?? null,
                    });
                    return reloadBaseThenApplyVisibleVariations("room-base-snapshot");
                }

                logVariationStage("try:snapshot-not-ready", {
                    reason,
                    requiredSnapshotMoveNumber,
                    currentGameBaseSnapshot: currentGameBaseSnapshot
                        ? {
                              gameId: currentGameBaseSnapshot.gameId,
                              trunkTailMoveNumber: currentGameBaseSnapshot.trunkTailMoveNumber,
                              source: currentGameBaseSnapshot.source,
                          }
                        : null,
                });
                return false;
            }

            baseSnapshot = captureSecondaryVariationBaseSnapshot(
                secondaryBoardController,
                selectedVariation.game_id,
                selectedVariation,
                visibleVariations,
                selectedVariationSourceGame,
                secondaryVariationTreeDirtyRef.current,
                secondaryVariationBaseHydrationRef.current,
            );

            if (!baseSnapshot) {
                logVariationStage("try:capture-failed", { reason });
                return false;
            }

            secondaryVariationBaseSnapshotRef.current = baseSnapshot;
            lastAppliedSecondaryVariationKeyRef.current = null;
            logVariationStage("try:capture-succeeded", {
                reason,
                baseSnapshot: summarizeSecondaryVariationSnapshot(baseSnapshot),
            });
            return reloadBaseThenApplyVisibleVariations(reason);
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
        mainBoardController,
        mainBoardOfficialTailMoveNumber,
        currentGameBaseSnapshot,
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
            return;
        }

        const goban = secondaryBoardController.goban;
        let applyingDraftBase = false;
        let disposed = false;
        const tryApplyDraftBaseVariation = (): boolean => {
            if (disposed || applyingDraftBase) {
                return true;
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
                logKibitzVariationDebug("draft-base:anchor-not-ready", {
                    selectedVariationId: selectedVariation?.id ?? null,
                    selectedGameId: selectedVariation?.game_id ?? null,
                    variationId: draftBaseVariation.id,
                    analysisFrom: draftBaseVariation.analysis_from,
                    officialTailMoveNumber:
                        getOfficialTrunkTailMoveNumber(secondaryBoardController),
                    currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                });
                return false;
            }

            applyingDraftBase = true;
            appliedDraftBaseRef.current = markDraftBaseApplied(
                secondaryBoardController,
                draftBaseVariation.id,
            );
            logKibitzVariationDebug("draft-base:reserve-apply", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
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
                });
                return true;
            } catch (error) {
                appliedDraftBaseRef.current = clearDraftBaseAppliedState();
                logKibitzVariationDebug("draft-base:apply-failed", {
                    variationId: draftBaseVariation.id,
                    error,
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
            });
            void tryApplyDraftBaseVariation();
        };

        const onGameData = () => {
            logKibitzVariationDebug("draft-base:event-gamedata", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
            });
            void tryApplyDraftBaseVariation();
        };

        const onLastOfficialMove = () => {
            logKibitzVariationDebug("draft-base:event-last-official-move", {
                variationId: draftBaseVariation.id,
                currentMoveTreeId: secondaryBoardController.goban.engine?.move_tree?.id ?? null,
                appliedMoveTreeId: appliedDraftBaseRef.current.moveTreeId,
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
            pendingSecondaryMoveTreeRedrawCancelRef.current?.();
            pendingSecondaryMoveTreeRedrawCancelRef.current = null;
        };
    }, [
        draftBaseVariation,
        secondaryBoardController,
        secondaryPane.preview_game_id,
        secondaryPane.variation_source_game_id,
        variationColorIndexes,
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
    const displayedBlack = mainGame?.black.username;
    const displayedWhite = mainGame?.white.username;
    const displayedMoveNumber = mainGame?.move_number;
    const mobileCompareActive = Boolean(isMobileLayout && mobileCompanionPanel === "compare");
    const mobileCompareTargetActive = Boolean(
        mobileCompareActive && (selectedVariation || secondaryBoardGame),
    );
    const mobileBoardTotalMoves = mobileCompareTargetActive
        ? (selectedVariation?.move_count ?? previewDisplayedMoveNumber)
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
        const renderPreviewBoard = Boolean(mobileCompareTargetActive && secondaryBoardGame);
        const renderVariationBoard = Boolean(mobileCompareTargetActive && selectedVariation);
        const mobileBoardController = mobileCompareTargetActive
            ? secondaryBoardController
            : mainBoardController;

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
                            } else if (renderVariationBoard) {
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
                        {renderMainBoard ? (
                            <KibitzBoard
                                key={`main-${room.id}-${mainGame?.game_id ?? "none"}-mobile`}
                                role="main"
                                gameId={mainGame?.game_id}
                                currentRoomGameId={currentRoomGameId}
                                isMobile={true}
                                {...boardDimensionsOf(mainGame)}
                                className="mobile-main-board-surface"
                                size={mobileBoardSize}
                                fitMode="contain"
                                respectContainerBounds={true}
                                restoreToOfficialTailOnLoad={true}
                                onReady={setMainBoardController}
                            />
                        ) : null}
                        {renderPreviewBoard ? (
                            mobileBoardSizeReady ? (
                                <KibitzBoard
                                    key={secondaryBoardKey}
                                    gameId={secondaryGameId}
                                    currentRoomGameId={currentRoomGameId}
                                    isMobile={true}
                                    {...boardDimensionsOf(secondaryBoardGame)}
                                    className="mobile-secondary-board-surface"
                                    size={mobileBoardSize}
                                    interactive={isDraftingVariation}
                                    fitMode="contain"
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
                            )
                        ) : null}
                        {renderVariationBoard ? (
                            mobileBoardSizeReady ? (
                                <KibitzBoard
                                    key={secondaryBoardKey}
                                    gameId={selectedVariation?.game_id}
                                    currentRoomGameId={currentRoomGameId}
                                    isMobile={true}
                                    {...boardDimensionsOf(selectedVariationSourceGame)}
                                    className="mobile-secondary-board-surface"
                                    size={mobileBoardSize}
                                    interactive={false}
                                    fitMode="contain"
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
                            )
                        ) : null}
                        {mobileCompareActive && !mobileCompareTargetActive ? (
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
                        {!renderMainBoard &&
                        !renderPreviewBoard &&
                        !renderVariationBoard &&
                        !(mobileCompareActive && !mobileCompareTargetActive) ? (
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
                    <div className="players player-pair">
                        {renderRichPlayerBadge(mainGame?.black, displayedBlack)}
                        <span className="player-vs">
                            {pgettext("Versus label shown between players in kibitz", "vs")}
                        </span>
                        {renderRichPlayerBadge(mainGame?.white, displayedWhite)}
                    </div>
                    <div className="board-subtitle">
                        {mainGame ? (
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
                                            connectToGame={
                                                !(
                                                    !isMobileLayout &&
                                                    mainBoardController != null &&
                                                    secondaryBoardGame?.game_id ===
                                                        currentRoomGameId
                                                )
                                            }
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
                                            connectToGame={
                                                !(
                                                    !isMobileLayout &&
                                                    mainBoardController != null &&
                                                    selectedVariation?.game_id === currentRoomGameId
                                                )
                                            }
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
