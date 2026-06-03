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

export function computeRecenterScale({
    fitMode,
    coordinateSafeInput,
    allowTransientDragScaling = false,
    coordinateSafeInputActiveOverride,
    metricsWidth,
    metricsHeight,
    containerWidth,
    containerHeight,
}: {
    fitMode: "native" | "contain";
    coordinateSafeInput: boolean;
    allowTransientDragScaling?: boolean;
    coordinateSafeInputActiveOverride?: boolean;
    metricsWidth: number;
    metricsHeight: number;
    containerWidth: number;
    containerHeight: number;
}): number {
    const coordinateSafeInputActive =
        coordinateSafeInputActiveOverride ?? (coordinateSafeInput && !allowTransientDragScaling);
    const allowCssTransformScaling = fitMode === "contain" && !coordinateSafeInputActive;

    return allowCssTransformScaling && metricsWidth > 0 && metricsHeight > 0
        ? Math.min(containerWidth / metricsWidth, containerHeight / metricsHeight)
        : 1;
}

export function shouldCommitMobileSplitRatioUpdate({
    currentRatio,
    pendingRatio,
    threshold = 0.001,
}: {
    currentRatio: number;
    pendingRatio: number;
    threshold?: number;
}): boolean {
    return Math.abs(currentRatio - pendingRatio) >= threshold;
}

export function computeTransientDragVisualBoardSize({
    shellHeight,
    nextRatio,
    boardSlotMaxWidth,
    reservedBoardVerticalSpace,
}: {
    shellHeight: number;
    nextRatio: number;
    boardSlotMaxWidth: number;
    reservedBoardVerticalSpace: number;
}): number {
    const topPaneHeight = shellHeight * nextRatio;
    const usableBoardHeight = topPaneHeight - reservedBoardVerticalSpace;

    return Math.max(0, Math.floor(Math.min(boardSlotMaxWidth, usableBoardHeight)));
}

export function computeTransientDragScale(visualSize: number, metricsWidth: number): number {
    if (!Number.isFinite(visualSize) || !Number.isFinite(metricsWidth) || metricsWidth <= 0) {
        return 1;
    }

    return visualSize / metricsWidth;
}

export function computeMeasuredTransientDragContentSize({
    visualSize,
    startWindowSize,
    startContentSize,
}: {
    visualSize: number;
    startWindowSize: number;
    startContentSize: number;
}): number {
    if (
        !Number.isFinite(visualSize) ||
        !Number.isFinite(startWindowSize) ||
        !Number.isFinite(startContentSize) ||
        visualSize <= 0 ||
        startWindowSize <= 0 ||
        startContentSize <= 0
    ) {
        return 0;
    }

    return Math.max(1, startContentSize * (visualSize / startWindowSize));
}

export function firstPositiveFinite(...values: Array<number | null | undefined>): number | null {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            return value;
        }
    }

    return null;
}

function computeMobileScaledPreviewContentSize({
    targetContainerSize,
    maxContainerSize,
    maxPreviewContentSize,
}: {
    targetContainerSize: number;
    maxContainerSize: number;
    maxPreviewContentSize: number;
}): number {
    if (
        !Number.isFinite(targetContainerSize) ||
        !Number.isFinite(maxContainerSize) ||
        !Number.isFinite(maxPreviewContentSize) ||
        targetContainerSize <= 0 ||
        maxContainerSize <= 0 ||
        maxPreviewContentSize <= 0
    ) {
        return Math.max(1, Math.floor(targetContainerSize || 1));
    }

    return Math.min(
        targetContainerSize,
        Math.max(1, Math.round(maxPreviewContentSize * (targetContainerSize / maxContainerSize))),
    );
}

function finiteNumber(value: number | null | undefined, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function floorNonNegative(value: number | null | undefined): number {
    return Math.max(0, Math.floor(finiteNumber(value)));
}

export function withinPx(actual: number, expected: number, tolerancePx = 1.5): boolean {
    return (
        Number.isFinite(actual) &&
        Number.isFinite(expected) &&
        Math.abs(actual - expected) <= tolerancePx
    );
}

export function canClearTransientMobileSizing({
    expectedBoardSize,
    hostRect,
    containerRect,
    gobanRect,
    tolerancePx = 1.5,
}: {
    expectedBoardSize: number;
    hostRect: Pick<DOMRect, "width" | "height"> | null;
    containerRect: Pick<DOMRect, "width" | "height"> | null;
    gobanRect: Pick<DOMRect, "width" | "height"> | null;
    tolerancePx?: number;
}): boolean {
    if (!hostRect || !containerRect || !gobanRect) {
        return false;
    }

    return (
        withinPx(hostRect.width, expectedBoardSize, tolerancePx) &&
        withinPx(hostRect.height, expectedBoardSize, tolerancePx) &&
        withinPx(containerRect.width, expectedBoardSize, tolerancePx) &&
        withinPx(containerRect.height, expectedBoardSize, tolerancePx) &&
        gobanRect.width <= expectedBoardSize + tolerancePx &&
        gobanRect.height <= expectedBoardSize + tolerancePx
    );
}

export function resolveMobileResizeBaselineGobanContentSize({
    stableGeometry,
    currentMetricsWidth,
    currentMetricsHeight,
}: {
    stableGeometry: StableMobileBoardGeometrySnapshot;
    currentMetricsWidth?: number | null;
    currentMetricsHeight?: number | null;
}): number | null {
    return firstPositiveFinite(
        stableGeometry.gobanContent.nativeGobanContentSize,
        stableGeometry.gobanContent.gobanContentSize,
        currentMetricsWidth ?? null,
        currentMetricsHeight ?? null,
    );
}

export function shouldAnimateTransientRelease({
    fromContentSize,
    toContentSize,
}: {
    fromContentSize: number;
    toContentSize: number;
}): boolean {
    const contentDelta = Math.abs(toContentSize - fromContentSize);
    const contentDeltaRatio = contentDelta / Math.max(1, fromContentSize);

    return contentDelta > 3 && contentDeltaRatio > 0.01;
}

export function resolveActualNativeFinalContentSize({
    expectedNativeContentSize,
    actualMetricWidth,
    actualMetricHeight,
}: {
    expectedNativeContentSize: number;
    actualMetricWidth?: number | null;
    actualMetricHeight?: number | null;
}): number {
    return (
        firstPositiveFinite(actualMetricWidth ?? null, actualMetricHeight ?? null) ??
        expectedNativeContentSize
    );
}

export function getExpectedReactBoardSizeFromTarget(target: MobileResizeAppliedTarget): number {
    return target.gobanContainer.size;
}

export function hasReactBoardSizeCaughtUp({
    target,
    expectedReactBoardSize,
    sizePropLatest,
    displaySizeLatest,
    tolerancePx = 1.5,
}: {
    target?: MobileResizeAppliedTarget | null;
    expectedReactBoardSize?: number | null;
    sizePropLatest: number | null;
    displaySizeLatest: number | null;
    tolerancePx?: number;
}): boolean {
    const expected = firstPositiveFinite(
        expectedReactBoardSize ?? null,
        target ? getExpectedReactBoardSizeFromTarget(target) : null,
    );

    if (expected == null) {
        return false;
    }

    const sizePropReady =
        typeof sizePropLatest === "number" &&
        Number.isFinite(sizePropLatest) &&
        Math.abs(sizePropLatest - expected) <= tolerancePx;

    const displaySizeReady =
        typeof displaySizeLatest === "number" &&
        Number.isFinite(displaySizeLatest) &&
        Math.abs(displaySizeLatest - expected) <= tolerancePx;

    return sizePropReady && displaySizeReady;
}

export function shouldPreserveCommittedMobileScaledPresentation({
    committedPresentation,
    coordinateSafeInput,
    fitMode,
}: {
    committedPresentation: { visualScale: number } | null;
    coordinateSafeInput: boolean;
    fitMode: "native" | "contain";
}): boolean {
    return Boolean(committedPresentation && coordinateSafeInput && fitMode === "contain");
}

/**
 * Mobile resize geometry terminology:
 *
 * shell:
 *   The mobile layout area used for divider ratio math.
 *
 * board surface:
 *   The actual rectangular host occupied by the board component.
 *   This can be non-square.
 *
 * goban container:
 *   The square internal container in which the Goban element is positioned.
 *
 * goban content:
 *   The actual Goban element/content size, either native or CSS-previewed.
 *
 * Important:
 *   React sizeProp/displaySize and square-fit values are layout inputs/outputs,
 *   not necessarily the same as the measured board surface or Goban content.
 */
export type MobileResizeShellGeometry = {
    shellWidth: number | null;
    shellHeight: number | null;
};

export type MobileResizeBoardSurfaceGeometry = {
    boardSurfaceWidth: number | null;
    boardSurfaceHeight: number | null;
};

export type MobileResizeGobanContainerGeometry = {
    gobanContainerWidth: number | null;
    gobanContainerHeight: number | null;
};

export type MobileResizeGobanContentGeometry = {
    gobanContentWidth: number | null;
    gobanContentHeight: number | null;
    gobanContentSize: number | null;
};

export type MobileResizeDividerGeometry = {
    dividerRatio?: number | null;
    startDividerRatio?: number | null;
    targetDividerRatio?: number | null;
};

export type MobileResizeGeometrySnapshot = {
    shell?: MobileResizeShellGeometry;
    boardSizingSlot?: {
        boardSizingSlotWidth: number | null;
        boardSizingSlotHeight: number | null;
    };
    boardSurface: MobileResizeBoardSurfaceGeometry;
    gobanContainer: MobileResizeGobanContainerGeometry;
    gobanContent: MobileResizeGobanContentGeometry;
    divider?: MobileResizeDividerGeometry;
};

export type StableMobileBoardGeometrySnapshot = {
    measuredAt: number;
    shell: {
        shellWidth: number;
        shellHeight: number;
    };
    boardSizingSlot?: {
        boardSizingSlotWidth: number;
        boardSizingSlotHeight: number;
    };
    boardSurface: {
        boardSurfaceWidth: number;
        boardSurfaceHeight: number;
    };
    gobanContainer: {
        gobanContainerWidth: number;
        gobanContainerHeight: number;
        gobanContainerSize: number;
    };
    gobanContent: {
        gobanContentWidth: number | null;
        gobanContentHeight: number | null;
        gobanContentSize: number | null;
        nativeGobanContentSize: number | null;
    };
    divider: {
        dividerRatio: number;
    };
    derived: {
        horizontalInset: number;
        boardVerticalChrome: number;
        reservedHeight?: number;
        horizontalInsetPx?: number;
        verticalInsetPx?: number;
    };
    source: "stable-observer" | "initial-capture" | "post-settle";
};

export type MobileResizeLifecycleState =
    | "idle"
    | "armed"
    | "active"
    | "release-settle"
    | "native-handoff"
    | "final-clear";

export function shouldAcceptStableMobileGeometryMeasurement({
    lifecycleState,
    snapshot,
}: {
    lifecycleState: MobileResizeLifecycleState;
    snapshot: StableMobileBoardGeometrySnapshot | null;
}): boolean {
    if (lifecycleState !== "idle") {
        return false;
    }

    if (!snapshot) {
        return false;
    }

    const { shell, boardSurface, gobanContainer } = snapshot;
    return (
        shell.shellWidth > 0 &&
        shell.shellHeight > 0 &&
        boardSurface.boardSurfaceWidth > 0 &&
        boardSurface.boardSurfaceHeight > 0 &&
        gobanContainer.gobanContainerWidth > 0 &&
        gobanContainer.gobanContainerHeight > 0
    );
}

export type MobileGeometryMismatchType =
    | "horizontal-inset"
    | "vertical-chrome"
    | "vertical-fit-slot-mismatch"
    | "square-fit-authority-mismatch"
    | "surface-container-confusion"
    | "content-prediction"
    | "wrong-shell-basis"
    | "unknown"
    | null;

export function compareMobileGeometryToTarget({
    target,
    actual,
    tolerancePx = 1.5,
}: {
    target: MobileResizeAppliedTarget | null;
    actual: StableMobileBoardGeometrySnapshot | null;
    tolerancePx?: number;
}): {
    matched: boolean;
    maxDeltaPx: number;
    mismatchType: MobileGeometryMismatchType;
    deltas: {
        boardSurfaceWidth: number | null;
        boardSurfaceHeight: number | null;
        gobanContainerWidth: number | null;
        gobanContainerHeight: number | null;
        gobanContentSize: number | null;
    };
} {
    if (!target || !actual) {
        return {
            matched: false,
            maxDeltaPx: Number.POSITIVE_INFINITY,
            mismatchType: null,
            deltas: {
                boardSurfaceWidth: null,
                boardSurfaceHeight: null,
                gobanContainerWidth: null,
                gobanContainerHeight: null,
                gobanContentSize: null,
            },
        };
    }

    const boardSurfaceWidthDelta = Math.abs(
        actual.boardSurface.boardSurfaceWidth - target.boardSurface.width,
    );
    const boardSurfaceHeightDelta = Math.abs(
        actual.boardSurface.boardSurfaceHeight - target.boardSurface.height,
    );
    const gobanContainerWidthDelta = Math.abs(
        actual.gobanContainer.gobanContainerWidth - target.gobanContainer.size,
    );
    const gobanContainerHeightDelta = Math.abs(
        actual.gobanContainer.gobanContainerHeight - target.gobanContainer.size,
    );
    const gobanContentSizeDelta =
        actual.gobanContent.nativeGobanContentSize != null
            ? Math.abs(
                  actual.gobanContent.nativeGobanContentSize - target.activePreviewContent.size,
              )
            : null;
    const maxDeltaPx = Math.max(
        boardSurfaceWidthDelta,
        boardSurfaceHeightDelta,
        gobanContainerWidthDelta,
        gobanContainerHeightDelta,
        gobanContentSizeDelta ?? 0,
    );
    const mismatchType = classifyMobileGeometryMismatch({
        target,
        actual,
        tolerancePx,
        deltas: {
            boardSurfaceWidth: boardSurfaceWidthDelta,
            boardSurfaceHeight: boardSurfaceHeightDelta,
            gobanContainerWidth: gobanContainerWidthDelta,
            gobanContainerHeight: gobanContainerHeightDelta,
            gobanContentSize: gobanContentSizeDelta,
        },
    });

    return {
        matched: maxDeltaPx <= tolerancePx,
        maxDeltaPx,
        mismatchType,
        deltas: {
            boardSurfaceWidth: boardSurfaceWidthDelta,
            boardSurfaceHeight: boardSurfaceHeightDelta,
            gobanContainerWidth: gobanContainerWidthDelta,
            gobanContainerHeight: gobanContainerHeightDelta,
            gobanContentSize: gobanContentSizeDelta,
        },
    };
}

export function classifyMobileGeometryMismatch({
    target,
    actual,
    tolerancePx = 1.5,
    deltas,
}: {
    target: MobileResizeAppliedTarget | null;
    actual: StableMobileBoardGeometrySnapshot | null;
    tolerancePx?: number;
    deltas?: {
        boardSurfaceWidth: number | null;
        boardSurfaceHeight: number | null;
        gobanContainerWidth: number | null;
        gobanContainerHeight: number | null;
        gobanContentSize: number | null;
    };
}): MobileGeometryMismatchType {
    if (!target || !actual) {
        return null;
    }

    const boardSurfaceWidthDelta =
        deltas?.boardSurfaceWidth ??
        Math.abs(actual.boardSurface.boardSurfaceWidth - target.boardSurface.width);
    const boardSurfaceHeightDelta =
        deltas?.boardSurfaceHeight ??
        Math.abs(actual.boardSurface.boardSurfaceHeight - target.boardSurface.height);
    const gobanContainerWidthDelta =
        deltas?.gobanContainerWidth ??
        Math.abs(actual.gobanContainer.gobanContainerWidth - target.gobanContainer.size);
    const gobanContainerHeightDelta =
        deltas?.gobanContainerHeight ??
        Math.abs(actual.gobanContainer.gobanContainerHeight - target.gobanContainer.size);
    const gobanContentSizeDelta =
        deltas?.gobanContentSize ??
        (actual.gobanContent.nativeGobanContentSize != null
            ? Math.abs(
                  actual.gobanContent.nativeGobanContentSize - target.activePreviewContent.size,
              )
            : null);

    if (
        boardSurfaceWidthDelta <= tolerancePx &&
        boardSurfaceHeightDelta <= tolerancePx &&
        gobanContainerWidthDelta <= tolerancePx &&
        gobanContainerHeightDelta <= tolerancePx
    ) {
        return gobanContentSizeDelta != null && gobanContentSizeDelta > tolerancePx
            ? "content-prediction"
            : null;
    }

    if (
        boardSurfaceWidthDelta > tolerancePx &&
        boardSurfaceHeightDelta <= tolerancePx &&
        gobanContainerWidthDelta > tolerancePx &&
        gobanContainerHeightDelta <= tolerancePx
    ) {
        return "horizontal-inset";
    }

    if (boardSurfaceHeightDelta > tolerancePx && boardSurfaceWidthDelta <= tolerancePx) {
        return "vertical-fit-slot-mismatch";
    }

    if (
        gobanContainerWidthDelta > tolerancePx &&
        gobanContainerHeightDelta > tolerancePx &&
        boardSurfaceWidthDelta <= tolerancePx
    ) {
        return "square-fit-authority-mismatch";
    }

    if (
        boardSurfaceHeightDelta > tolerancePx &&
        boardSurfaceWidthDelta <= tolerancePx &&
        gobanContainerHeightDelta > tolerancePx &&
        gobanContainerWidthDelta <= tolerancePx
    ) {
        return "vertical-chrome";
    }

    if (
        boardSurfaceWidthDelta > tolerancePx &&
        boardSurfaceHeightDelta > tolerancePx &&
        gobanContainerWidthDelta > tolerancePx &&
        gobanContainerHeightDelta > tolerancePx &&
        Math.abs(boardSurfaceWidthDelta - gobanContainerWidthDelta) <= tolerancePx &&
        Math.abs(boardSurfaceHeightDelta - gobanContainerHeightDelta) <= tolerancePx
    ) {
        return "surface-container-confusion";
    }

    if (
        boardSurfaceWidthDelta > tolerancePx &&
        boardSurfaceHeightDelta > tolerancePx &&
        actual.shell.shellWidth > target.boardSurface.width + tolerancePx
    ) {
        return "wrong-shell-basis";
    }

    if (gobanContentSizeDelta != null && gobanContentSizeDelta > tolerancePx) {
        return "content-prediction";
    }

    return "unknown";
}

export function describeBoardSurfaceFromHostRect(
    rect: Pick<DOMRect, "width" | "height"> | null,
): MobileResizeBoardSurfaceGeometry {
    return {
        boardSurfaceWidth: rect?.width ?? null,
        boardSurfaceHeight: rect?.height ?? null,
    };
}

export function describeGobanContainerFromContainerRect(
    rect: Pick<DOMRect, "width" | "height"> | null,
): MobileResizeGobanContainerGeometry {
    return {
        gobanContainerWidth: rect?.width ?? null,
        gobanContainerHeight: rect?.height ?? null,
    };
}

export function describeGobanContentFromMetrics(
    metrics: {
        width: number;
        height: number;
    } | null,
): MobileResizeGobanContentGeometry {
    const gobanContentWidth = firstPositiveFinite(metrics?.width ?? null);
    const gobanContentHeight = firstPositiveFinite(metrics?.height ?? null);
    const gobanContentSize =
        metrics != null &&
        gobanContentWidth != null &&
        gobanContentHeight != null &&
        Math.abs(gobanContentWidth - gobanContentHeight) <= 1
            ? gobanContentWidth
            : null;

    return {
        gobanContentWidth,
        gobanContentHeight,
        gobanContentSize,
    };
}

export function describeMobileResizeShellGeometry(
    shellWidth: number | null,
    shellHeight: number | null,
): MobileResizeShellGeometry {
    return {
        shellWidth,
        shellHeight,
    };
}

export function describeMobileResizeDividerGeometry({
    dividerRatio,
    startDividerRatio,
    targetDividerRatio,
}: MobileResizeDividerGeometry): MobileResizeDividerGeometry {
    return {
        dividerRatio,
        startDividerRatio,
        targetDividerRatio,
    };
}

export function describeMobileResizeGeometrySnapshot({
    shell,
    boardSizingSlot,
    boardSurface,
    gobanContainer,
    gobanContent,
    divider,
}: {
    shell?: MobileResizeShellGeometry;
    boardSizingSlot?: {
        boardSizingSlotWidth: number | null;
        boardSizingSlotHeight: number | null;
    };
    boardSurface: MobileResizeBoardSurfaceGeometry;
    gobanContainer: MobileResizeGobanContainerGeometry;
    gobanContent: MobileResizeGobanContentGeometry;
    divider?: MobileResizeDividerGeometry;
}): MobileResizeGeometrySnapshot {
    return {
        shell,
        boardSizingSlot,
        boardSurface,
        gobanContainer,
        gobanContent,
        divider,
    };
}

export interface TransientDragGeometryInput {
    visualSize: number;
    startWindowWidth: number;
    startWindowHeight: number;
    startWindowSize: number;
    startContentSize: number;
    metricsWidth: number;
    startedAtHorizontalMax: boolean;
    transientBoardWindowMaxSize: number | null;
}

export interface TransientDragGeometry {
    hostWidth: number;
    hostHeight: number;
    containerWidth: number;
    containerHeight: number;
    contentSize: number;
    transformScale: number;
    gobanLeft: number;
    gobanTop: number;
    dragScale: number;
    usingRestingMaxGeometry: boolean;
}

export interface MobileBoardGeometryInput {
    shellWidth: number;
    shellHeight: number;
    dividerRatio: number;
    boardSizingSlotWidth: number;
    outerBoardSlotWidth?: number;
    horizontalInsetPx?: number;
    squareFitReservedHeight: number;
    squareFitExtraReservedHeight?: number;
    reservedHeight?: number;
    verticalInsetPx?: number;
    minBoardPaneHeight?: number;
    maxBoardPaneHeight?: number;
    devicePixelRatio?: number;
    boardWidth?: number;
    boardHeight?: number;
    showLabels?: boolean;
}

export interface MobileBoardGeometry {
    modelVersion: "mobile-square-surface-v1";
    shell: {
        shellWidth: number;
        shellHeight: number;
    };
    boardPane: {
        boardPaneHeight: number;
        usableBoardHeight: number;
    };
    fitBox: MobileBoardFitBox;
    boardSizingSlot: {
        boardSizingSlotWidth: number;
        boardSizingSlotHeight: number;
    };
    divider: {
        dividerRatio: number;
        boardPaneHeight: number;
    };
    boardSurface: {
        boardSurfaceWidth: number;
        boardSurfaceHeight: number;
    };
    gobanContainer: {
        gobanContainerSize: number;
        gobanContainerWidth: number;
        gobanContainerHeight: number;
        leftInSurface: number;
        topInSurface: number;
        gobanContainerLeft: number;
        gobanContainerTop: number;
    };
    activePreviewContent: {
        size: number;
        leftInContainer: number;
        topInContainer: number;
        leftInSurface: number;
        topInSurface: number;
    };
    nativeFinalContent: {
        size: number;
        leftInContainer: number;
        topInContainer: number;
        leftInSurface: number;
        topInSurface: number;
    };
    gobanContent: {
        predictedNativeGobanContentSize: number;
        previewGobanContentSize: number;
        gobanContentLeft: number;
        gobanContentTop: number;
    };
}

export interface MobileBoardFitBoxInput {
    outerSlotWidth: number;
    horizontalInsetPx: number;
    parentClientHeight: number;
    reservedHeight: number;
    verticalInsetPx: number;
}

export interface MobileBoardFitBox {
    outerSlotWidth: number;
    contentWidth: number;
    parentClientHeight: number;
    reservedHeight: number;
    fallbackHeight: number;
    contentHeight: number;
    boardSize: number;
    horizontalInsetPx: number;
    verticalInsetPx: number;
}

export function computeMobileBoardFitBox(input: MobileBoardFitBoxInput): MobileBoardFitBox {
    const outerSlotWidth = floorNonNegative(input.outerSlotWidth);
    const horizontalInsetPx = floorNonNegative(input.horizontalInsetPx);
    const contentWidth = Math.max(0, outerSlotWidth - horizontalInsetPx * 2);
    const parentClientHeight = floorNonNegative(input.parentClientHeight);
    const reservedHeight = floorNonNegative(input.reservedHeight);
    const verticalInsetPx = floorNonNegative(input.verticalInsetPx);
    const fallbackHeight = Math.max(0, parentClientHeight - reservedHeight);
    const contentHeight = Math.max(0, fallbackHeight - verticalInsetPx);
    const boardSize = Math.max(0, Math.floor(Math.min(contentWidth, contentHeight)));

    return {
        outerSlotWidth,
        contentWidth,
        parentClientHeight,
        reservedHeight,
        fallbackHeight,
        contentHeight,
        boardSize,
        horizontalInsetPx,
        verticalInsetPx,
    };
}

function clampMobileRatio(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function computeMobileBoardGeometry({
    shellWidth,
    shellHeight,
    dividerRatio,
    boardSizingSlotWidth,
    outerBoardSlotWidth,
    horizontalInsetPx,
    squareFitReservedHeight,
    squareFitExtraReservedHeight = 0,
    reservedHeight,
    verticalInsetPx,
    minBoardPaneHeight = 0,
    maxBoardPaneHeight = shellHeight,
    devicePixelRatio: _devicePixelRatio,
    boardWidth = 19,
    boardHeight = 19,
    showLabels = false,
}: MobileBoardGeometryInput): MobileBoardGeometry {
    const safeShellWidth = Math.max(0, shellWidth);
    const safeShellHeight = Math.max(0, shellHeight);
    const safeOuterBoardSlotWidth = Math.max(
        0,
        Math.floor(outerBoardSlotWidth ?? boardSizingSlotWidth),
    );
    const safeBoardSizingSlotWidth = Math.max(0, Math.floor(boardSizingSlotWidth));
    const safeHorizontalInsetPx = Math.max(
        0,
        Math.floor(
            horizontalInsetPx ??
                Math.max(0, Math.floor((safeOuterBoardSlotWidth - safeBoardSizingSlotWidth) / 2)),
        ),
    );
    const safeDividerRatio = clampMobileRatio(dividerRatio);
    const safeReservedHeight = Math.max(0, Math.floor(reservedHeight ?? squareFitReservedHeight));
    const safeVerticalInsetPx = Math.max(
        0,
        Math.floor(verticalInsetPx ?? squareFitExtraReservedHeight),
    );
    const boardPaneHeight = Math.max(
        0,
        Math.floor(
            clamp(safeShellHeight * safeDividerRatio, minBoardPaneHeight, maxBoardPaneHeight),
        ),
    );
    const fitBox = computeMobileBoardFitBox({
        outerSlotWidth: safeOuterBoardSlotWidth,
        horizontalInsetPx: safeHorizontalInsetPx,
        parentClientHeight: boardPaneHeight,
        reservedHeight: safeReservedHeight,
        verticalInsetPx: safeVerticalInsetPx,
    });
    const usableBoardHeight = fitBox.contentHeight;
    const boardSize = fitBox.boardSize;
    const boardSurfaceWidth = fitBox.contentWidth;
    const boardSurfaceHeight = boardSize;
    const gobanContainerSize = boardSize;
    const predictedNativeGobanContentSize = predictNativeGobanContentSize({
        targetSlotSize: gobanContainerSize,
        boardWidth,
        boardHeight,
        showLabels,
    });
    const previewGobanContentSize = predictedNativeGobanContentSize;
    const gobanContainerLeft = Math.max(
        0,
        Math.floor((boardSurfaceWidth - gobanContainerSize) / 2),
    );
    const gobanContentLeft = Math.max(
        0,
        Math.floor((gobanContainerSize - previewGobanContentSize) / 2),
    );

    return {
        modelVersion: "mobile-square-surface-v1",
        shell: {
            shellWidth: safeShellWidth,
            shellHeight: safeShellHeight,
        },
        fitBox,
        boardPane: {
            boardPaneHeight,
            usableBoardHeight,
        },
        boardSizingSlot: {
            boardSizingSlotWidth: safeOuterBoardSlotWidth,
            boardSizingSlotHeight: safeShellHeight,
        },
        divider: {
            dividerRatio: safeDividerRatio,
            boardPaneHeight,
        },
        boardSurface: {
            boardSurfaceWidth,
            boardSurfaceHeight,
        },
        gobanContainer: {
            gobanContainerSize,
            gobanContainerWidth: gobanContainerSize,
            gobanContainerHeight: gobanContainerSize,
            leftInSurface: gobanContainerLeft,
            topInSurface: 0,
            gobanContainerLeft,
            gobanContainerTop: 0,
        },
        activePreviewContent: {
            size: gobanContainerSize,
            leftInContainer: 0,
            topInContainer: 0,
            leftInSurface: gobanContainerLeft,
            topInSurface: 0,
        },
        nativeFinalContent: {
            size: predictedNativeGobanContentSize,
            leftInContainer: gobanContentLeft,
            topInContainer: gobanContentLeft,
            leftInSurface: gobanContainerLeft + gobanContentLeft,
            topInSurface: gobanContentLeft,
        },
        gobanContent: {
            predictedNativeGobanContentSize,
            previewGobanContentSize,
            gobanContentLeft,
            gobanContentTop: gobanContentLeft,
        },
    };
}

export interface MobileResizeAppliedTarget {
    geometrySource: "computeMobileBoardGeometry";
    dividerRatio: number;
    boardSurface: {
        width: number;
        height: number;
    };
    gobanContainer: {
        size: number;
        leftInSurface: number;
        topInSurface: number;
    };
    activePreviewContent: {
        size: number;
        leftInContainer: number;
        topInContainer: number;
        leftInSurface: number;
        topInSurface: number;
        transformScale: number;
        nativeBackingContentSize: number;
        visualScaleExceedsOne: boolean;
    };
    nativeFinalContent: {
        size: number;
        leftInContainer: number;
        topInContainer: number;
        leftInSurface: number;
        topInSurface: number;
    };
    previewGobanContentSize: number;
    predictedNativeGobanContentSize: number | null;
    legacyVisualSize: number;
    legacyFinalWindowSize: number | null;
    usingRestingMaxGeometry: boolean;
    transformScale: number;
    dragScale: number;
    gobanLeft: number;
    gobanTop: number;
    mobileScaledVisualTarget: {
        maxContainerSize: number;
        maxPreviewContentSize: number;
        targetContainerSize: number;
        source: "max-preview-ratio";
    };
    geometry: MobileBoardGeometry;
    boardSurfaceWidth: number;
    boardSurfaceHeight: number;
    gobanContainerWidth: number;
    gobanContainerHeight: number;
}

export interface MobileResizeAppliedTargetInput {
    stableGeometry: StableMobileBoardGeometrySnapshot;
    targetDividerRatio: number;
    boardWidth: number;
    boardHeight: number;
    showLabels: boolean;
    baselineGobanContentSize?: number | null;
}

export function computeMobileResizeAppliedTarget({
    stableGeometry,
    targetDividerRatio,
    boardWidth,
    boardHeight,
    showLabels,
    baselineGobanContentSize,
}: MobileResizeAppliedTargetInput): MobileResizeAppliedTarget | null {
    const boardSizingSlotWidth =
        stableGeometry.boardSizingSlot?.boardSizingSlotWidth ?? stableGeometry.shell.shellWidth;
    const boardSurfaceWidth = stableGeometry.boardSurface.boardSurfaceWidth;
    const horizontalInsetPx = firstPositiveFinite(
        Math.max(0, Math.round((boardSizingSlotWidth - boardSurfaceWidth) / 2)),
        stableGeometry.derived.horizontalInsetPx,
        stableGeometry.derived.horizontalInset,
    );
    const reservedHeight = firstPositiveFinite(
        stableGeometry.derived.reservedHeight,
        stableGeometry.derived.boardVerticalChrome,
    );
    const verticalInsetPx = firstPositiveFinite(stableGeometry.derived.verticalInsetPx, 0);
    const stableMetricsWidth = firstPositiveFinite(
        baselineGobanContentSize,
        stableGeometry.gobanContent.nativeGobanContentSize,
        stableGeometry.gobanContent.gobanContentSize,
    );

    if (!stableMetricsWidth || stableMetricsWidth <= 0) {
        return null;
    }

    const geometry = computeMobileBoardGeometry({
        shellWidth: stableGeometry.shell.shellWidth,
        shellHeight: stableGeometry.shell.shellHeight,
        dividerRatio: targetDividerRatio,
        boardSizingSlotWidth,
        outerBoardSlotWidth: boardSizingSlotWidth,
        horizontalInsetPx: horizontalInsetPx ?? 0,
        reservedHeight: reservedHeight ?? 0,
        verticalInsetPx: verticalInsetPx ?? 0,
        squareFitReservedHeight: reservedHeight ?? 0,
        squareFitExtraReservedHeight: verticalInsetPx ?? 0,
        minBoardPaneHeight: 0,
        maxBoardPaneHeight: stableGeometry.shell.shellHeight,
        devicePixelRatio: 1,
        boardWidth,
        boardHeight,
        showLabels,
    });
    const predictedNativeGobanContentSize =
        geometry.gobanContent.predictedNativeGobanContentSize ?? null;
    const nativeFinalContentSize = Math.min(
        geometry.gobanContainer.gobanContainerSize,
        predictedNativeGobanContentSize ?? geometry.gobanContainer.gobanContainerSize,
    );
    const nativeFinalLeftInContainer = Math.max(
        0,
        Math.floor((geometry.gobanContainer.gobanContainerSize - nativeFinalContentSize) / 2),
    );
    const nativeFinalTopInContainer = nativeFinalLeftInContainer;
    const nativeFinalLeftInSurface =
        geometry.gobanContainer.gobanContainerLeft + nativeFinalLeftInContainer;
    const nativeFinalTopInSurface =
        geometry.gobanContainer.gobanContainerTop + nativeFinalTopInContainer;
    const targetContainerSize = geometry.gobanContainer.gobanContainerSize;
    const maxGeometry = computeMobileBoardGeometry({
        shellWidth: stableGeometry.shell.shellWidth,
        shellHeight: stableGeometry.shell.shellHeight,
        dividerRatio: 1,
        boardSizingSlotWidth,
        outerBoardSlotWidth: boardSizingSlotWidth,
        horizontalInsetPx: horizontalInsetPx ?? 0,
        reservedHeight: reservedHeight ?? 0,
        verticalInsetPx: verticalInsetPx ?? 0,
        squareFitReservedHeight: reservedHeight ?? 0,
        squareFitExtraReservedHeight: verticalInsetPx ?? 0,
        minBoardPaneHeight: 0,
        maxBoardPaneHeight: stableGeometry.shell.shellHeight,
        devicePixelRatio: 1,
        boardWidth,
        boardHeight,
        showLabels,
    });
    const maxContainerSize = maxGeometry.gobanContainer.gobanContainerSize;
    const maxPreviewContentSize = Math.min(
        maxContainerSize,
        maxGeometry.gobanContent.predictedNativeGobanContentSize ?? maxContainerSize,
    );
    const activePreviewContentSize = computeMobileScaledPreviewContentSize({
        targetContainerSize,
        maxContainerSize,
        maxPreviewContentSize,
    });
    const resolvedNativeBackingContentSize = firstPositiveFinite(
        stableGeometry.gobanContent.nativeGobanContentSize,
        stableGeometry.gobanContent.gobanContentSize,
        baselineGobanContentSize,
        activePreviewContentSize,
    );
    const activePreviewTransformScale =
        activePreviewContentSize / (resolvedNativeBackingContentSize ?? stableMetricsWidth);
    const activePreviewLeftInContainer = Math.max(
        0,
        Math.floor((targetContainerSize - activePreviewContentSize) / 2),
    );
    const activePreviewTopInContainer = activePreviewLeftInContainer;
    const activePreviewLeftInSurface =
        geometry.gobanContainer.gobanContainerLeft + activePreviewLeftInContainer;
    const activePreviewTopInSurface =
        geometry.gobanContainer.gobanContainerTop + activePreviewTopInContainer;
    const visualScaleExceedsOne = activePreviewTransformScale > 1.0001;

    return {
        geometrySource: "computeMobileBoardGeometry",
        dividerRatio: geometry.divider.dividerRatio,
        boardSurface: {
            width: geometry.boardSurface.boardSurfaceWidth,
            height: geometry.boardSurface.boardSurfaceHeight,
        },
        gobanContainer: {
            size: geometry.gobanContainer.gobanContainerSize,
            leftInSurface: geometry.gobanContainer.gobanContainerLeft,
            topInSurface: geometry.gobanContainer.gobanContainerTop,
        },
        activePreviewContent: {
            size: activePreviewContentSize,
            leftInContainer: activePreviewLeftInContainer,
            topInContainer: activePreviewTopInContainer,
            leftInSurface: activePreviewLeftInSurface,
            topInSurface: activePreviewTopInSurface,
            transformScale: activePreviewTransformScale,
            nativeBackingContentSize: resolvedNativeBackingContentSize ?? activePreviewContentSize,
            visualScaleExceedsOne,
        },
        nativeFinalContent: {
            size: nativeFinalContentSize,
            leftInContainer: nativeFinalLeftInContainer,
            topInContainer: nativeFinalTopInContainer,
            leftInSurface: nativeFinalLeftInSurface,
            topInSurface: nativeFinalTopInSurface,
        },
        boardSurfaceWidth: geometry.boardSurface.boardSurfaceWidth,
        boardSurfaceHeight: geometry.boardSurface.boardSurfaceHeight,
        gobanContainerWidth: geometry.gobanContainer.gobanContainerSize,
        gobanContainerHeight: geometry.gobanContainer.gobanContainerSize,
        previewGobanContentSize: activePreviewContentSize,
        predictedNativeGobanContentSize,
        legacyVisualSize: geometry.gobanContainer.gobanContainerSize,
        legacyFinalWindowSize: geometry.gobanContainer.gobanContainerWidth,
        usingRestingMaxGeometry: false,
        transformScale: activePreviewTransformScale,
        dragScale:
            geometry.gobanContainer.gobanContainerSize / Math.max(1, geometry.fitBox.contentWidth),
        gobanLeft: activePreviewLeftInContainer,
        gobanTop: activePreviewTopInContainer,
        mobileScaledVisualTarget: {
            maxContainerSize,
            maxPreviewContentSize,
            targetContainerSize,
            source: "max-preview-ratio",
        },
        geometry,
    };
}

/**
 * Compatibility adapter only.
 * Authoritative mobile resize geometry comes from computeMobileBoardGeometry(...).
 * Keep this helper stable for legacy tests, but do not route new behavior through it.
 */
export function computeTransientDragGeometry({
    visualSize,
    startWindowWidth,
    startWindowHeight,
    startWindowSize,
    startContentSize,
    metricsWidth,
    startedAtHorizontalMax,
    transientBoardWindowMaxSize,
}: TransientDragGeometryInput): TransientDragGeometry {
    const isTallRestingHost = startWindowHeight > startWindowWidth;
    const isNearMaxRestingHost =
        transientBoardWindowMaxSize != null &&
        isTallRestingHost &&
        startWindowWidth >= transientBoardWindowMaxSize - 4;
    const usingRestingMaxGeometry =
        Boolean(
            startedAtHorizontalMax &&
            transientBoardWindowMaxSize != null &&
            visualSize >= transientBoardWindowMaxSize,
        ) || Boolean(isNearMaxRestingHost && visualSize >= transientBoardWindowMaxSize);
    const hostWidth = usingRestingMaxGeometry ? startWindowWidth : visualSize;
    const hostHeight = usingRestingMaxGeometry
        ? startWindowHeight
        : visualSize + Math.max(0, startWindowHeight - startWindowWidth);
    const containerWidth = usingRestingMaxGeometry ? startWindowWidth : visualSize;
    const containerHeight = usingRestingMaxGeometry ? startWindowHeight : visualSize;
    const contentSize = usingRestingMaxGeometry
        ? startContentSize
        : computeMeasuredTransientDragContentSize({
              visualSize,
              startWindowSize,
              startContentSize,
          });
    const transformScale = usingRestingMaxGeometry
        ? 1
        : computeTransientDragScale(contentSize, metricsWidth);
    const gobanLeft = Math.max(0, Math.floor((hostWidth - contentSize) / 2));

    return {
        hostWidth,
        hostHeight,
        containerWidth,
        containerHeight,
        contentSize,
        transformScale,
        gobanLeft,
        gobanTop: 0,
        dragScale: hostWidth / startWindowSize,
        usingRestingMaxGeometry,
    };
}

export interface TransientDragReleaseGeometryFromAppliedTargetInput {
    target: MobileResizeAppliedTarget;
    lastVisibleContentSize: number;
    lastVisibleLeftInContainer: number;
    boardWidth: number;
    boardHeight: number;
    showLabels: boolean;
}

export interface TransientDragReleaseGeometryFromAppliedTarget {
    boardSurfaceWidth: number;
    boardSurfaceHeight: number;
    gobanContainerWidth: number;
    gobanContainerHeight: number;
    finalNativeContentSize: number;
    fromContentSize: number;
    toContentSize: number;
    fromContentLeftInContainer: number;
    toContentLeftInContainer: number;
    fromContentTopInContainer: number;
    toContentTopInContainer: number;
    fromContentLeftInSurface: number;
    toContentLeftInSurface: number;
    fromContentTopInSurface: number;
    toContentTopInSurface: number;
    contentDelta: number;
    windowDelta: number;
    targetSource: "last-applied-target";
    boardSurfacePreserved: true;
    fromLeft: number;
    toLeft: number;
}

export function computeTransientDragReleaseGeometryFromAppliedTarget({
    target,
    lastVisibleContentSize,
    lastVisibleLeftInContainer,
    boardWidth,
    boardHeight,
    showLabels,
}: TransientDragReleaseGeometryFromAppliedTargetInput): TransientDragReleaseGeometryFromAppliedTarget {
    const finalNativeContentSize =
        target.nativeFinalContent.size ??
        target.predictedNativeGobanContentSize ??
        predictNativeGobanContentSize({
            targetSlotSize: target.gobanContainer.size,
            boardWidth,
            boardHeight,
            showLabels,
        });
    const toLeft = Math.max(
        0,
        Math.floor((target.gobanContainer.size - finalNativeContentSize) / 2),
    );
    const toTop = toLeft;
    const fromTop = target.activePreviewContent.topInContainer;
    const contentDelta = Math.abs(finalNativeContentSize - lastVisibleContentSize);

    return {
        boardSurfaceWidth: target.boardSurface.width,
        boardSurfaceHeight: target.boardSurface.height,
        gobanContainerWidth: target.gobanContainer.size,
        gobanContainerHeight: target.gobanContainer.size,
        finalNativeContentSize,
        fromContentSize: lastVisibleContentSize,
        toContentSize: finalNativeContentSize,
        fromContentLeftInContainer: lastVisibleLeftInContainer,
        toContentLeftInContainer: toLeft,
        fromContentTopInContainer: fromTop,
        toContentTopInContainer: toTop,
        fromContentLeftInSurface: target.gobanContainer.leftInSurface + lastVisibleLeftInContainer,
        toContentLeftInSurface: target.gobanContainer.leftInSurface + toLeft,
        fromContentTopInSurface: target.gobanContainer.topInSurface + fromTop,
        toContentTopInSurface: target.gobanContainer.topInSurface + toTop,
        contentDelta,
        windowDelta: 0,
        targetSource: "last-applied-target",
        boardSurfacePreserved: true,
        fromLeft: lastVisibleLeftInContainer,
        toLeft,
    };
}

export interface TransientDragReleaseGeometryInput {
    finalWindowSize: number;
    lastVisibleWindowSize: number;
    startWindowWidth: number | null;
    startWindowHeight: number | null;
    usingRestingMaxGeometry: boolean;
}

export interface TransientDragReleaseGeometry {
    settleWindowWidth: number;
    settleWindowHeight: number;
    fromWindowSize: number;
    toWindowSize: number;
    preserveRestingRect: boolean;
}

export function computeTransientDragReleaseGeometry({
    finalWindowSize,
    lastVisibleWindowSize,
    startWindowWidth,
    startWindowHeight,
    usingRestingMaxGeometry,
}: TransientDragReleaseGeometryInput): TransientDragReleaseGeometry {
    const preserveRestingRect =
        usingRestingMaxGeometry &&
        Number.isFinite(startWindowWidth) &&
        Number.isFinite(startWindowHeight) &&
        (startWindowWidth ?? 0) > 0 &&
        (startWindowHeight ?? 0) > 0;
    const settleWindowWidth = preserveRestingRect
        ? (startWindowWidth ?? finalWindowSize)
        : finalWindowSize;
    const settleWindowHeight = preserveRestingRect
        ? (startWindowHeight ?? finalWindowSize)
        : finalWindowSize;
    const fromWindowSize = preserveRestingRect ? settleWindowWidth : lastVisibleWindowSize;
    const toWindowSize = preserveRestingRect ? settleWindowWidth : finalWindowSize;

    return {
        settleWindowWidth,
        settleWindowHeight,
        fromWindowSize,
        toWindowSize,
        preserveRestingRect,
    };
}

export function predictNativeGobanContentSize({
    targetSlotSize,
    boardWidth,
    boardHeight,
    showLabels,
}: {
    targetSlotSize: number;
    boardWidth: number;
    boardHeight: number;
    showLabels: boolean;
}): number {
    const boardUnits = Math.max(boardWidth, boardHeight);
    const labelUnits = showLabels ? 2 : 0;
    const metricUnits = boardUnits + labelUnits;

    if (!Number.isFinite(targetSlotSize) || targetSlotSize <= 0 || metricUnits <= 0) {
        return 0;
    }

    return Math.max(metricUnits, Math.floor(targetSlotSize / metricUnits) * metricUnits);
}

export interface SquareFitLayoutMetrics {
    slotWidth: number;
    slotHeight: number;
    parentClientHeight: number;
    reservedHeight: number;
    visibleChildrenCount: number;
    rowGap: number;
    fallbackHeight: number;
    usableHeight: number;
    nextSize: number;
}

export function computeSquareFitSizeFromMetrics({
    slotWidth,
    slotHeight,
    parentClientHeight,
    reservedHeight,
    visibleChildrenCount,
    rowGap,
    constrainToParentHeight,
}: {
    slotWidth: number;
    slotHeight: number;
    parentClientHeight: number;
    reservedHeight: number;
    visibleChildrenCount: number;
    rowGap: number;
    constrainToParentHeight: boolean;
}): SquareFitLayoutMetrics {
    const fallbackHeight = Math.max(
        0,
        parentClientHeight - reservedHeight - rowGap * Math.max(0, visibleChildrenCount - 1),
    );
    const usableHeight = constrainToParentHeight
        ? fallbackHeight > 0
            ? Math.min(slotHeight || fallbackHeight, fallbackHeight)
            : slotHeight
        : Math.max(slotHeight, fallbackHeight);
    const nextSize = Math.max(0, Math.floor(Math.min(slotWidth, usableHeight)));

    return {
        slotWidth,
        slotHeight,
        parentClientHeight,
        reservedHeight,
        visibleChildrenCount,
        rowGap,
        fallbackHeight,
        usableHeight,
        nextSize,
    };
}

export function measureSquareFitLayout(
    element: HTMLElement,
    constrainToParentHeight: boolean,
): SquareFitLayoutMetrics {
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
    const slotRect = element.getBoundingClientRect();
    const slotWidth = Math.floor(slotRect.width || element.clientWidth || 0);
    const slotHeight = Math.floor(slotRect.height || element.clientHeight || 0);

    return computeSquareFitSizeFromMetrics({
        slotWidth,
        slotHeight,
        parentClientHeight: parent?.clientHeight ?? 0,
        reservedHeight,
        visibleChildrenCount: visibleChildren.length,
        rowGap,
        constrainToParentHeight,
    });
}

export function isKibitzBoardResizeStale({
    scheduledGeneration,
    currentGeneration,
    scheduledControllerEpoch,
    currentControllerEpoch,
    scheduledDisplaySize,
    currentDisplaySize,
    scheduledSize,
    currentSize,
    scheduledContainerWidth,
    scheduledContainerHeight,
    currentContainerWidth,
    currentContainerHeight,
    scheduledFitMode,
    currentFitMode,
    scheduledRespectContainerBounds,
    currentRespectContainerBounds,
}: {
    scheduledGeneration: number;
    currentGeneration: number;
    scheduledControllerEpoch: number;
    currentControllerEpoch: number;
    scheduledDisplaySize: number | null;
    currentDisplaySize: number | null;
    scheduledSize: number | null;
    currentSize: number | null;
    scheduledContainerWidth: number;
    scheduledContainerHeight: number;
    currentContainerWidth: number | null;
    currentContainerHeight: number | null;
    scheduledFitMode: "native" | "contain";
    currentFitMode: "native" | "contain";
    scheduledRespectContainerBounds: boolean;
    currentRespectContainerBounds: boolean;
}): boolean {
    if (
        scheduledGeneration !== currentGeneration ||
        scheduledControllerEpoch !== currentControllerEpoch ||
        currentContainerWidth == null ||
        currentContainerHeight == null ||
        Math.abs(currentContainerWidth - scheduledContainerWidth) > 1 ||
        Math.abs(currentContainerHeight - scheduledContainerHeight) > 1 ||
        scheduledDisplaySize !== currentDisplaySize ||
        scheduledSize !== currentSize ||
        scheduledFitMode !== currentFitMode ||
        scheduledRespectContainerBounds !== currentRespectContainerBounds
    ) {
        return true;
    }

    return false;
}
