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

import { GobanController } from "@/lib/GobanController";
import {
    getMovePathToRestore,
    shouldConnectKibitzBoardToGame,
    shouldRestoreMainBoardToOfficialTail,
    refreshLastOfficialMoveFromTrunk,
    restoreToOfficialTail,
    shouldRestoreToOfficialTailForGame,
} from "./KibitzBoard";
import {
    describeBoardSurfaceFromHostRect,
    describeGobanContainerFromContainerRect,
    describeGobanContentFromMetrics,
    describeMobileResizeDividerGeometry,
    describeMobileResizeGeometrySnapshot,
    describeMobileResizeShellGeometry,
    computeRecenterScale,
    firstPositiveFinite,
    computeMobileBoardFitBox,
    computeMobileBoardGeometry,
    computeMobileResizeAppliedTarget,
    computeTransientDragReleaseGeometryFromAppliedTarget,
    computeTransientDragReleaseGeometry,
    compareMobileGeometryToTarget,
    classifyMobileGeometryMismatch,
    isKibitzBoardResizeStale,
    predictNativeGobanContentSize,
    resolveMobileResizeBaselineGobanContentSize,
    resolveActualNativeFinalContentSize,
    shouldAnimateTransientRelease,
    shouldCommitMobileSplitRatioUpdate,
    shouldPreserveCommittedMobileScaledPresentation,
    computeTransientDragVisualBoardSize,
    computeTransientDragScale,
    computeMeasuredTransientDragContentSize,
    getExpectedReactBoardSizeFromTarget,
    hasReactBoardSizeCaughtUp,
    withinPx,
    canClearTransientMobileSizing,
    type MobileResizeAppliedTarget,
} from "./kibitzBoardSizing";
import { applyCommittedMobileScaledPresentation } from "./KibitzBoard";

describe("getMovePathToRestore", () => {
    it("uses the original source path when the current restore path is blank and the source is preferred", () => {
        expect(getMovePathToRestore("", "aa", true)).toBe("aa");
    });

    it("keeps a blank current path when it is authoritative", () => {
        expect(getMovePathToRestore("", "aa", false)).toBe("");
    });

    it("falls back to the current path when there is no source path to restore", () => {
        expect(getMovePathToRestore("bb", undefined, true)).toBe("bb");
    });
});

describe("shouldConnectKibitzBoardToGame", () => {
    it("allows only the main board to live-connect", () => {
        expect(shouldConnectKibitzBoardToGame("main", true)).toBe(true);
        expect(shouldConnectKibitzBoardToGame("main", false)).toBe(false);
        expect(shouldConnectKibitzBoardToGame("secondary", true)).toBe(false);
        expect(shouldConnectKibitzBoardToGame("secondary", false)).toBe(false);
    });
});

describe("computeRecenterScale", () => {
    it("keeps coordinate-safe input unscaled", () => {
        expect(
            computeRecenterScale({
                fitMode: "contain",
                coordinateSafeInput: true,
                allowTransientDragScaling: false,
                containerWidth: 374,
                containerHeight: 374,
                metricsWidth: 357,
                metricsHeight: 357,
            }),
        ).toBe(1);
    });

    it("allows temporary contain-scaling during transient drag", () => {
        expect(
            computeRecenterScale({
                fitMode: "contain",
                coordinateSafeInput: true,
                allowTransientDragScaling: true,
                containerWidth: 374,
                containerHeight: 374,
                metricsWidth: 357,
                metricsHeight: 357,
            }),
        ).toBeCloseTo(374 / 357);
    });

    it("still contain-scales non-coordinate-safe boards", () => {
        expect(
            computeRecenterScale({
                fitMode: "contain",
                coordinateSafeInput: false,
                allowTransientDragScaling: false,
                containerWidth: 374,
                containerHeight: 374,
                metricsWidth: 357,
                metricsHeight: 357,
            }),
        ).toBeCloseTo(374 / 357);
    });
});

describe("isKibitzBoardResizeStale", () => {
    it("flags callbacks whose target state changed before they fire", () => {
        expect(
            isKibitzBoardResizeStale({
                scheduledGeneration: 1,
                currentGeneration: 2,
                scheduledControllerEpoch: 1,
                currentControllerEpoch: 2,
                scheduledDisplaySize: 366,
                currentDisplaySize: 369,
                scheduledSize: 366,
                currentSize: 369,
                scheduledContainerWidth: 366,
                scheduledContainerHeight: 366,
                currentContainerWidth: 369,
                currentContainerHeight: 369,
                scheduledFitMode: "contain",
                currentFitMode: "contain",
                scheduledRespectContainerBounds: true,
                currentRespectContainerBounds: true,
            }),
        ).toBe(true);
    });
});

describe("shouldCommitMobileSplitRatioUpdate", () => {
    it("skips repeated clamped divider updates", () => {
        expect(
            shouldCommitMobileSplitRatioUpdate({
                currentRatio: 0.36,
                pendingRatio: 0.3604,
            }),
        ).toBe(false);

        expect(
            shouldCommitMobileSplitRatioUpdate({
                currentRatio: 0.36,
                pendingRatio: 0.37,
            }),
        ).toBe(true);
    });
});

describe("computeTransientDragVisualBoardSize", () => {
    it("derives the visual drag board size from the active pointer target", () => {
        expect(
            computeTransientDragVisualBoardSize({
                shellHeight: 600,
                nextRatio: 0.5,
                boardSlotMaxWidth: 400,
                reservedBoardVerticalSpace: 100,
            }),
        ).toBe(200);
    });
});

describe("computeTransientDragScale", () => {
    it("uses the continuous visual size during live drag", () => {
        expect(computeTransientDragScale(269, 210)).toBeCloseTo(269 / 210);
        expect(computeTransientDragScale(233, 210)).toBeCloseTo(233 / 210);
    });
});

describe("computeMeasuredTransientDragContentSize", () => {
    it("scales measured drag content proportionally from the start window", () => {
        expect(
            computeMeasuredTransientDragContentSize({
                visualSize: 227,
                startWindowSize: 310,
                startContentSize: 294,
            }),
        ).toBeCloseTo(294 * (227 / 310));
    });
});

describe("firstPositiveFinite", () => {
    it("skips zero and returns the first positive finite value", () => {
        expect(firstPositiveFinite(0, null, -3, 225, 240)).toBe(225);
        expect(firstPositiveFinite(0, 0, null, undefined)).toBeNull();
    });
});

describe("final clear post-commit helpers", () => {
    it("accepts matching 374 content-box rectangles", () => {
        expect(
            canClearTransientMobileSizing({
                expectedBoardSize: 374,
                hostRect: { width: 374, height: 374 } as Pick<DOMRect, "width" | "height">,
                containerRect: { width: 374, height: 374 } as Pick<DOMRect, "width" | "height">,
                gobanRect: { width: 374, height: 374 } as Pick<DOMRect, "width" | "height">,
            }),
        ).toBe(true);
    });

    it("rejects a mixed 382 target against a 374 resting box", () => {
        expect(
            canClearTransientMobileSizing({
                expectedBoardSize: 382,
                hostRect: { width: 374, height: 382 } as Pick<DOMRect, "width" | "height">,
                containerRect: { width: 374, height: 382 } as Pick<DOMRect, "width" | "height">,
                gobanRect: { width: 375, height: 375 } as Pick<DOMRect, "width" | "height">,
            }),
        ).toBe(false);
    });

    it("checks values within tolerance", () => {
        expect(withinPx(374, 374, 1.5)).toBe(true);
        expect(withinPx(374.4, 374, 1.5)).toBe(true);
        expect(withinPx(377, 374, 1.5)).toBe(false);
    });
});

describe("mobile resize geometry terminology", () => {
    it("maps the current DOM measurements into named geometry fields", () => {
        const shell = describeMobileResizeShellGeometry(390, 640);
        const boardSizingSlot = {
            boardSizingSlotWidth: 382,
            boardSizingSlotHeight: 640,
        };
        const boardSurface = describeBoardSurfaceFromHostRect({
            width: 374,
            height: 382,
        } as Pick<DOMRect, "width" | "height">);
        const gobanContainer = describeGobanContainerFromContainerRect({
            width: 374,
            height: 374,
        } as Pick<DOMRect, "width" | "height">);
        const gobanContent = describeGobanContentFromMetrics({
            width: 360,
            height: 360,
        });
        const divider = describeMobileResizeDividerGeometry({
            dividerRatio: 0.42,
            startDividerRatio: 0.4,
            targetDividerRatio: 0.45,
        });

        expect(
            describeMobileResizeGeometrySnapshot({
                shell,
                boardSizingSlot,
                boardSurface,
                gobanContainer,
                gobanContent,
                divider,
            }),
        ).toEqual({
            shell: {
                shellWidth: 390,
                shellHeight: 640,
            },
            boardSizingSlot: {
                boardSizingSlotWidth: 382,
                boardSizingSlotHeight: 640,
            },
            boardSurface: {
                boardSurfaceWidth: 374,
                boardSurfaceHeight: 382,
            },
            gobanContainer: {
                gobanContainerWidth: 374,
                gobanContainerHeight: 374,
            },
            gobanContent: {
                gobanContentWidth: 360,
                gobanContentHeight: 360,
                gobanContentSize: 360,
            },
            divider: {
                dividerRatio: 0.42,
                startDividerRatio: 0.4,
                targetDividerRatio: 0.45,
            },
        });
    });

    it("treats zero goban content metrics as missing", () => {
        expect(
            describeGobanContentFromMetrics({
                width: 0,
                height: 0,
            }),
        ).toEqual({
            gobanContentWidth: null,
            gobanContentHeight: null,
            gobanContentSize: null,
        });
    });
});

describe("resolveMobileResizeBaselineGobanContentSize", () => {
    it("skips zero stable content and falls back to current metrics", () => {
        expect(
            resolveMobileResizeBaselineGobanContentSize({
                stableGeometry: {
                    measuredAt: 1,
                    shell: {
                        shellWidth: 394,
                        shellHeight: 640,
                    },
                    boardSizingSlot: {
                        boardSizingSlotWidth: 382,
                        boardSizingSlotHeight: 640,
                    },
                    boardSurface: {
                        boardSurfaceWidth: 374,
                        boardSurfaceHeight: 382,
                    },
                    gobanContainer: {
                        gobanContainerWidth: 374,
                        gobanContainerHeight: 374,
                        gobanContainerSize: 374,
                    },
                    gobanContent: {
                        gobanContentWidth: null,
                        gobanContentHeight: null,
                        gobanContentSize: 0,
                        nativeGobanContentSize: 0,
                    },
                    divider: {
                        dividerRatio: 0.5,
                    },
                    derived: {
                        horizontalInset: 8,
                        boardVerticalChrome: 8,
                    },
                    source: "stable-observer" as const,
                },
                currentMetricsWidth: 225,
                currentMetricsHeight: 225,
            }),
        ).toBe(225);
    });
});

describe("shouldAnimateTransientRelease", () => {
    it("skips tiny content deltas", () => {
        expect(
            shouldAnimateTransientRelease({
                fromContentSize: 326,
                toContentSize: 323,
            }),
        ).toBe(false);

        expect(
            shouldAnimateTransientRelease({
                fromContentSize: 326,
                toContentSize: 315,
            }),
        ).toBe(true);
    });
});

describe("resolveActualNativeFinalContentSize", () => {
    it("prefers the actual measured Goban size when available", () => {
        expect(
            resolveActualNativeFinalContentSize({
                expectedNativeContentSize: 323,
                actualMetricWidth: 315,
                actualMetricHeight: 315,
            }),
        ).toBe(315);

        expect(
            resolveActualNativeFinalContentSize({
                expectedNativeContentSize: 323,
                actualMetricWidth: null,
                actualMetricHeight: null,
            }),
        ).toBe(323);
    });
});

describe("react board size catch-up", () => {
    const target = {
        geometrySource: "computeMobileBoardGeometry" as const,
        dividerRatio: 0.5,
        boardSurface: {
            width: 382,
            height: 382,
        },
        gobanContainer: {
            size: 382,
            leftInSurface: 0,
            topInSurface: 0,
        },
        activePreviewContent: {
            size: 382,
            leftInContainer: 0,
            topInContainer: 0,
            leftInSurface: 0,
            topInSurface: 0,
            transformScale: 1,
            nativeBackingContentSize: 382,
            visualScaleExceedsOne: false,
        },
        nativeFinalContent: {
            size: 380,
            leftInContainer: 1,
            topInContainer: 1,
            leftInSurface: 1,
            topInSurface: 1,
        },
        previewGobanContentSize: 382,
        predictedNativeGobanContentSize: 380,
        legacyVisualSize: 382,
        legacyFinalWindowSize: 382,
        usingRestingMaxGeometry: false,
        transformScale: 1,
        dragScale: 1,
        gobanLeft: 0,
        gobanTop: 0,
        mobileScaledVisualTarget: {
            maxContainerSize: 382,
            maxPreviewContentSize: 380,
            targetContainerSize: 382,
            source: "max-preview-ratio",
        },
        geometry: computeMobileBoardGeometry({
            shellWidth: 390,
            shellHeight: 744,
            dividerRatio: 0.6019354838709677,
            boardSizingSlotWidth: 382,
            squareFitReservedHeight: 36,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
        }),
        boardSurfaceWidth: 382,
        boardSurfaceHeight: 382,
        gobanContainerWidth: 382,
        gobanContainerHeight: 382,
    } satisfies MobileResizeAppliedTarget;

    it("uses the goban container size as the expected react board size", () => {
        expect(getExpectedReactBoardSizeFromTarget(target)).toBe(382);
    });

    it("treats stale 331px size props as not caught up for a 382px target", () => {
        expect(
            hasReactBoardSizeCaughtUp({
                target,
                sizePropLatest: 331,
                displaySizeLatest: 331,
            }),
        ).toBe(false);
    });

    it("treats matching 382px size props as caught up", () => {
        expect(
            hasReactBoardSizeCaughtUp({
                target,
                sizePropLatest: 382,
                displaySizeLatest: 382,
            }),
        ).toBe(true);
    });
});

describe("committed mobile scaled presentation", () => {
    it("preserves committed mobile scaled presentation only in mobile contain mode", () => {
        expect(
            shouldPreserveCommittedMobileScaledPresentation({
                committedPresentation: {
                    visualScale: 1.31905,
                },
                coordinateSafeInput: true,
                fitMode: "contain",
            }),
        ).toBe(true);

        expect(
            shouldPreserveCommittedMobileScaledPresentation({
                committedPresentation: null,
                coordinateSafeInput: true,
                fitMode: "contain",
            }),
        ).toBe(false);

        expect(
            shouldPreserveCommittedMobileScaledPresentation({
                committedPresentation: {
                    visualScale: 1.31905,
                },
                coordinateSafeInput: true,
                fitMode: "native",
            }),
        ).toBe(false);
    });

    it("applies committed mobile scaled presentation styles directly", () => {
        const host = document.createElement("div");
        const container = document.createElement("div");
        const goban = document.createElement("div");

        applyCommittedMobileScaledPresentation({
            host,
            container,
            gobanElement: goban,
            committedPresentation: {
                boardSurfaceWidth: 382,
                boardSurfaceHeight: 298,
                gobanContainerSize: 298,
                gobanContainerLeftInSurface: 42,
                gobanContainerTopInSurface: 0,
                nativeBackingContentSize: 210,
                visualContentSize: 277,
                visualLeftInContainer: 10,
                visualTopInContainer: 10,
                visualScale: 1.31905,
            },
        });

        expect(host.style.width).toBe("382px");
        expect(host.style.height).toBe("298px");
        expect(container.style.width).toBe("298px");
        expect(container.style.left).toBe("42px");
        expect(goban.style.width).toBe("210px");
        expect(goban.style.height).toBe("210px");
        expect(goban.style.left).toBe("10px");
        expect(goban.style.top).toBe("10px");
        expect(goban.style.transform).toBe("scale(1.31905)");
    });
});

describe("computeMobileResizeAppliedTarget", () => {
    const smallBoardStableGeometry = {
        measuredAt: 1,
        shell: {
            shellWidth: 394,
            shellHeight: 640,
        },
        boardSizingSlot: {
            boardSizingSlotWidth: 382,
            boardSizingSlotHeight: 640,
        },
        boardSurface: {
            boardSurfaceWidth: 374,
            boardSurfaceHeight: 300,
        },
        gobanContainer: {
            gobanContainerWidth: 300,
            gobanContainerHeight: 300,
            gobanContainerSize: 300,
        },
        gobanContent: {
            gobanContentWidth: 286,
            gobanContentHeight: 286,
            gobanContentSize: 286,
            nativeGobanContentSize: 286,
        },
        divider: {
            dividerRatio: 0.5,
        },
        derived: {
            horizontalInset: 132,
            boardVerticalChrome: 70,
        },
        source: "stable-observer" as const,
    };

    const maxStartStableGeometry = {
        measuredAt: 1,
        shell: {
            shellWidth: 390,
            shellHeight: 640,
        },
        boardSizingSlot: {
            boardSizingSlotWidth: 382,
            boardSizingSlotHeight: 640,
        },
        boardSurface: {
            boardSurfaceWidth: 374,
            boardSurfaceHeight: 382,
        },
        gobanContainer: {
            gobanContainerWidth: 374,
            gobanContainerHeight: 374,
            gobanContainerSize: 374,
        },
        gobanContent: {
            gobanContentWidth: 360,
            gobanContentHeight: 360,
            gobanContentSize: 360,
            nativeGobanContentSize: 360,
        },
        divider: {
            dividerRatio: 0.596875,
        },
        derived: {
            horizontalInset: 8,
            boardVerticalChrome: 8,
        },
        source: "stable-observer" as const,
    };

    it("grows host and container from a smaller board", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: smallBoardStableGeometry,
            targetDividerRatio: 0.65,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
        });

        expect(target).not.toBeNull();
        expect(target!.boardSurfaceWidth).toBeGreaterThan(0);
        expect(target!.boardSurfaceHeight).toBeGreaterThan(
            smallBoardStableGeometry.boardSurface.boardSurfaceHeight,
        );
        expect(target!.gobanContainerHeight).toBeGreaterThan(
            smallBoardStableGeometry.gobanContainer.gobanContainerHeight,
        );
        expect(target!.gobanContainerWidth).toBeGreaterThan(
            smallBoardStableGeometry.gobanContainer.gobanContainerWidth,
        );
    });

    it("keeps the max-start geometry out of the padding", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: maxStartStableGeometry,
            targetDividerRatio: maxStartStableGeometry.divider.dividerRatio,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
        });

        expect(target).not.toBeNull();
        expect(target!.boardSurfaceWidth).toBe(374);
        expect(target!.boardSurfaceHeight).toBe(374);
        expect(target!.gobanContainerWidth).toBe(374);
        expect(target!.gobanContainerHeight).toBe(374);
        expect(target!.gobanLeft).toBe(8);
    });

    it("fails closed when stable goban content metrics are missing", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                ...smallBoardStableGeometry,
                gobanContent: {
                    gobanContentWidth: null,
                    gobanContentHeight: null,
                    gobanContentSize: null,
                    nativeGobanContentSize: null,
                },
            },
            targetDividerRatio: 0.65,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
        });

        expect(target).toBeNull();
    });

    it("uses an explicit baseline goban content size when the stable snapshot lacks one", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                ...smallBoardStableGeometry,
                gobanContent: {
                    gobanContentWidth: null,
                    gobanContentHeight: null,
                    gobanContentSize: null,
                    nativeGobanContentSize: null,
                },
            },
            targetDividerRatio: 0.65,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 286,
        });

        expect(target).not.toBeNull();
        expect(target!.transformScale).toBeCloseTo(target!.previewGobanContentSize / 286);
    });

    it("uses current Goban metrics when stable content is zero", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                ...smallBoardStableGeometry,
                gobanContent: {
                    gobanContentWidth: 0,
                    gobanContentHeight: 0,
                    gobanContentSize: 0,
                    nativeGobanContentSize: 0,
                },
            },
            targetDividerRatio: 0.65,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 225,
        });

        expect(target).not.toBeNull();
        expect(target!.transformScale).toBeCloseTo(target!.previewGobanContentSize / 225);
    });

    it("uses native backing content as the active preview scale denominator", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                measuredAt: 1,
                shell: {
                    shellWidth: 390,
                    shellHeight: 744,
                },
                boardSizingSlot: {
                    boardSizingSlotWidth: 337,
                    boardSizingSlotHeight: 744,
                },
                boardSurface: {
                    boardSurfaceWidth: 366,
                    boardSurfaceHeight: 366,
                },
                gobanContainer: {
                    gobanContainerWidth: 366,
                    gobanContainerHeight: 366,
                    gobanContainerSize: 366,
                },
                gobanContent: {
                    gobanContentWidth: 366,
                    gobanContentHeight: 366,
                    gobanContentSize: 366,
                    nativeGobanContentSize: 255,
                },
                divider: {
                    dividerRatio: 0.5,
                },
                derived: {
                    horizontalInset: 0,
                    boardVerticalChrome: 0,
                },
                source: "stable-observer",
            },
            targetDividerRatio: 0.5,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 366,
        });

        expect(target).not.toBeNull();
        expect(target!.gobanContainer.size).toBe(337);
        expect(target!.activePreviewContent.size).toBe(336);
        expect(target!.activePreviewContent.transformScale).toBeCloseTo(337 / 255);
    });

    it("uses max mobile preview content as the visual target at max size", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                measuredAt: 1,
                shell: {
                    shellWidth: 390,
                    shellHeight: 744,
                },
                boardSizingSlot: {
                    boardSizingSlotWidth: 382,
                    boardSizingSlotHeight: 382,
                },
                boardSurface: {
                    boardSurfaceWidth: 382,
                    boardSurfaceHeight: 317,
                },
                gobanContainer: {
                    gobanContainerWidth: 382,
                    gobanContainerHeight: 317,
                    gobanContainerSize: 382,
                },
                gobanContent: {
                    gobanContentWidth: 240,
                    gobanContentHeight: 240,
                    gobanContentSize: 240,
                    nativeGobanContentSize: 240,
                },
                divider: {
                    dividerRatio: 0.48180779569892473,
                },
                derived: {
                    horizontalInset: 0,
                    boardVerticalChrome: 40,
                    reservedHeight: 36,
                    verticalInsetPx: 4,
                },
                source: "stable-observer" as const,
            },
            targetDividerRatio: 0.6901411290322581,
            boardWidth: 13,
            boardHeight: 13,
            showLabels: true,
            baselineGobanContentSize: 240,
        });

        expect(target).not.toBeNull();
        expect(target!.gobanContainer.size).toBe(382);
        expect(target!.activePreviewContent.size).toBeGreaterThanOrEqual(360);
        expect(target!.nativeFinalContent.size).toBe(375);
        expect(target!.activePreviewContent.nativeBackingContentSize).toBe(240);
        expect(target!.activePreviewContent.transformScale).toBeCloseTo(
            target!.activePreviewContent.size / 240,
        );
        expect(target!.mobileScaledVisualTarget.maxContainerSize).toBe(382);
        expect(target!.mobileScaledVisualTarget.maxPreviewContentSize).toBe(375);
        expect(target!.mobileScaledVisualTarget.targetContainerSize).toBe(382);
    });

    it("scales active preview from the max mobile content model when shrinking", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                measuredAt: 1,
                shell: {
                    shellWidth: 390,
                    shellHeight: 744,
                },
                boardSizingSlot: {
                    boardSizingSlotWidth: 382,
                    boardSizingSlotHeight: 382,
                },
                boardSurface: {
                    boardSurfaceWidth: 382,
                    boardSurfaceHeight: 382,
                },
                gobanContainer: {
                    gobanContainerWidth: 382,
                    gobanContainerHeight: 382,
                    gobanContainerSize: 382,
                },
                gobanContent: {
                    gobanContentWidth: 240,
                    gobanContentHeight: 240,
                    gobanContentSize: 240,
                    nativeGobanContentSize: 240,
                },
                divider: {
                    dividerRatio: 0.6901411290322581,
                },
                derived: {
                    horizontalInset: 0,
                    boardVerticalChrome: 40,
                    reservedHeight: 36,
                    verticalInsetPx: 4,
                },
                source: "stable-observer" as const,
            },
            targetDividerRatio: 309 / 744,
            boardWidth: 13,
            boardHeight: 13,
            showLabels: true,
            baselineGobanContentSize: 240,
        });

        expect(target).not.toBeNull();
        expect(target!.gobanContainer.size).toBe(269);
        expect(target!.activePreviewContent.size).toBeGreaterThanOrEqual(255);
        expect(target!.activePreviewContent.size).toBeLessThanOrEqual(269);
        expect(target!.activePreviewContent.size).toBeGreaterThan(200);
        expect(target!.nativeFinalContent.size).toBe(255);
        expect(target!.activePreviewContent.transformScale).toBeCloseTo(
            target!.activePreviewContent.size / 240,
        );
        expect(target!.mobileScaledVisualTarget.maxContainerSize).toBe(382);
        expect(target!.mobileScaledVisualTarget.maxPreviewContentSize).toBe(375);
        expect(target!.mobileScaledVisualTarget.targetContainerSize).toBe(269);
    });

    it("uses labelled native sizing for release prediction when the board shows labels", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                measuredAt: 1,
                shell: {
                    shellWidth: 390,
                    shellHeight: 744,
                },
                boardSizingSlot: {
                    boardSizingSlotWidth: 382,
                    boardSizingSlotHeight: 744,
                },
                boardSurface: {
                    boardSurfaceWidth: 382,
                    boardSurfaceHeight: 322,
                },
                gobanContainer: {
                    gobanContainerWidth: 322,
                    gobanContainerHeight: 322,
                    gobanContainerSize: 322,
                },
                gobanContent: {
                    gobanContentWidth: 315,
                    gobanContentHeight: 315,
                    gobanContentSize: 315,
                    nativeGobanContentSize: 315,
                },
                divider: {
                    dividerRatio: 0.4885282258064516,
                },
                derived: {
                    horizontalInset: 0,
                    horizontalInsetPx: 0,
                    reservedHeight: 36,
                    boardVerticalChrome: 36,
                    verticalInsetPx: 4,
                },
                source: "stable-observer" as const,
            },
            targetDividerRatio: 0.4465255376344086,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 315,
        });

        expect(target).not.toBeNull();
        expect(target!.gobanContainer.size).toBe(292);
        expect(target!.predictedNativeGobanContentSize).toBe(273);
    });

    it("does not grow Goban content when active drag starts from max with a native inner gap", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                measuredAt: 1,
                shell: {
                    shellWidth: 390,
                    shellHeight: 744,
                },
                boardSizingSlot: {
                    boardSizingSlotWidth: 382,
                    boardSizingSlotHeight: 744,
                },
                boardSurface: {
                    boardSurfaceWidth: 382,
                    boardSurfaceHeight: 382,
                },
                gobanContainer: {
                    gobanContainerWidth: 382,
                    gobanContainerHeight: 382,
                    gobanContainerSize: 382,
                },
                gobanContent: {
                    gobanContentWidth: 378,
                    gobanContentHeight: 378,
                    gobanContentSize: 378,
                    nativeGobanContentSize: 378,
                },
                divider: {
                    dividerRatio: 0.60870190785156,
                },
                derived: {
                    horizontalInset: 0,
                    boardVerticalChrome: 0,
                },
                source: "stable-observer" as const,
            },
            targetDividerRatio: 0.60870190785156,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 378,
        });

        expect(target).not.toBeNull();
        expect(target!.gobanContainer.size).toBe(382);
        expect(target!.activePreviewContent.size).toBe(target!.nativeFinalContent.size);
        expect(target!.activePreviewContent.size).toBe(378);
        expect(target!.activePreviewContent.leftInContainer).toBe(2);
        expect(target!.activePreviewContent.topInContainer).toBe(2);
        expect(target!.activePreviewContent.transformScale).toBeCloseTo(1);
        expect(target!.previewGobanContentSize).toBe(target!.predictedNativeGobanContentSize);
    });

    it("keeps active preview smooth instead of native-quantized during mobile drag", () => {
        const stableGeometry = {
            measuredAt: 1,
            shell: {
                shellWidth: 390,
                shellHeight: 744,
            },
            boardSizingSlot: {
                boardSizingSlotWidth: 382,
                boardSizingSlotHeight: 744,
            },
            boardSurface: {
                boardSurfaceWidth: 382,
                boardSurfaceHeight: 382,
            },
            gobanContainer: {
                gobanContainerWidth: 382,
                gobanContainerHeight: 382,
                gobanContainerSize: 382,
            },
            gobanContent: {
                gobanContentWidth: 378,
                gobanContentHeight: 378,
                gobanContentSize: 378,
                nativeGobanContentSize: 378,
            },
            divider: {
                dividerRatio: 0.6254569892473117,
            },
            derived: {
                horizontalInset: 0,
                boardVerticalChrome: 36,
                reservedHeight: 36,
                verticalInsetPx: 0,
            },
            source: "stable-observer" as const,
        };

        const targetA = computeMobileResizeAppliedTarget({
            stableGeometry,
            targetDividerRatio: 401 / 744,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 378,
        });
        const targetB = computeMobileResizeAppliedTarget({
            stableGeometry,
            targetDividerRatio: 398 / 744,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 378,
        });
        const targetC = computeMobileResizeAppliedTarget({
            stableGeometry,
            targetDividerRatio: 390 / 744,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 378,
        });

        expect(targetA).not.toBeNull();
        expect(targetB).not.toBeNull();
        expect(targetC).not.toBeNull();

        expect(targetA!.gobanContainer.size).toBe(365);
        expect(targetB!.gobanContainer.size).toBe(362);
        expect(targetC!.gobanContainer.size).toBe(354);

        expect(targetA!.activePreviewContent.size).toBe(361);
        expect(targetB!.activePreviewContent.size).toBe(358);
        expect(targetC!.activePreviewContent.size).toBe(350);

        expect(targetA!.activePreviewContent.size).not.toBe(targetA!.nativeFinalContent.size);
        expect(targetB!.activePreviewContent.size).not.toBe(targetB!.nativeFinalContent.size);
        expect(targetC!.activePreviewContent.size).not.toBe(targetC!.nativeFinalContent.size);

        expect(targetA!.activePreviewContent.size).toBeGreaterThan(
            targetB!.activePreviewContent.size,
        );
        expect(targetB!.activePreviewContent.size).toBeGreaterThan(
            targetC!.activePreviewContent.size,
        );

        expect(targetA!.nativeFinalContent.size).toBe(targetB!.nativeFinalContent.size);
    });

    it("does not freeze board geometry when the stable Goban host is narrower than the slot", () => {
        const target = computeMobileResizeAppliedTarget({
            stableGeometry: {
                ...smallBoardStableGeometry,
                boardSurface: {
                    boardSurfaceWidth: 374,
                    boardSurfaceHeight: 374,
                },
                gobanContainer: {
                    gobanContainerWidth: 227,
                    gobanContainerHeight: 227,
                    gobanContainerSize: 227,
                },
                gobanContent: {
                    gobanContentWidth: 225,
                    gobanContentHeight: 225,
                    gobanContentSize: 225,
                    nativeGobanContentSize: 225,
                },
            },
            targetDividerRatio: 0.8,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
            baselineGobanContentSize: 225,
        });

        expect(target).not.toBeNull();
        expect(target!.boardSurfaceWidth).toBe(374);
        expect(target!.boardSurfaceWidth).not.toBe(227);
        expect(target!.gobanContainerWidth).toBeGreaterThan(227);
        expect(target!.geometry.gobanContainer.gobanContainerSize).toBeGreaterThan(227);
    });
});

describe("computeMobileBoardGeometry", () => {
    it("subtracts horizontal inset from outer mobile board slot width", () => {
        const fit = computeMobileBoardFitBox({
            outerSlotWidth: 382,
            horizontalInsetPx: 4,
            parentClientHeight: 450,
            reservedHeight: 36,
            verticalInsetPx: 4,
        });

        expect(fit.contentWidth).toBe(374);
        expect(fit.boardSize).toBe(374);
    });

    it("subtracts vertical inset so the divider does not overlap the board", () => {
        const fit = computeMobileBoardFitBox({
            outerSlotWidth: 382,
            horizontalInsetPx: 4,
            parentClientHeight: 373,
            reservedHeight: 36,
            verticalInsetPx: 4,
        });

        expect(fit.fallbackHeight).toBe(337);
        expect(fit.contentHeight).toBe(333);
        expect(fit.boardSize).toBe(333);
    });

    it("keeps board surface square once the board is width-capped", () => {
        const geometry = computeMobileBoardGeometry({
            shellWidth: 390,
            shellHeight: 744,
            dividerRatio: 0.6019354838709677,
            boardSizingSlotWidth: 382,
            squareFitReservedHeight: 36,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: true,
        });

        expect(geometry.boardPane.boardPaneHeight).toBe(447);
        expect(geometry.boardPane.usableBoardHeight).toBe(411);
        expect(geometry.boardSurface.boardSurfaceWidth).toBe(382);
        expect(geometry.boardSurface.boardSurfaceHeight).toBe(382);
        expect(geometry.gobanContainer.gobanContainerSize).toBe(382);
    });

    it("does not grow board surface when dragging further after max width", () => {
        for (const dividerRatio of [0.6019354838709677, 0.624616935483871]) {
            const geometry = computeMobileBoardGeometry({
                shellWidth: 390,
                shellHeight: 744,
                dividerRatio,
                boardSizingSlotWidth: 382,
                squareFitReservedHeight: 36,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            });

            expect(geometry.gobanContainer.gobanContainerSize).toBe(382);
            expect(geometry.boardSurface.boardSurfaceHeight).toBe(382);
        }
    });

    it("keeps the board surface rectangular while the goban container remains square", () => {
        const geometry = computeMobileBoardGeometry({
            shellWidth: 394,
            shellHeight: 640,
            boardSizingSlotWidth: 382,
            dividerRatio: 0.609375,
            squareFitReservedHeight: 16,
            boardWidth: 18,
            boardHeight: 18,
            showLabels: true,
        });

        expect(geometry.boardSizingSlot).toEqual({
            boardSizingSlotWidth: 382,
            boardSizingSlotHeight: 640,
        });
        expect(geometry.boardSurface).toEqual({
            boardSurfaceWidth: 382,
            boardSurfaceHeight: 374,
        });
        expect(geometry.gobanContainer).toEqual({
            gobanContainerWidth: 374,
            gobanContainerHeight: 374,
            gobanContainerSize: 374,
            gobanContainerLeft: 4,
            gobanContainerTop: 0,
            leftInSurface: 4,
            topInSurface: 0,
        });
        expect(geometry.gobanContent.predictedNativeGobanContentSize).toBe(360);
    });

    it("grows monotonically from a smaller board without freezing at the start size", () => {
        const smaller = computeMobileBoardGeometry({
            shellWidth: 394,
            shellHeight: 640,
            boardSizingSlotWidth: 382,
            dividerRatio: 0.4,
            squareFitReservedHeight: 16,
            boardWidth: 18,
            boardHeight: 18,
            showLabels: true,
        });
        const larger = computeMobileBoardGeometry({
            shellWidth: 394,
            shellHeight: 640,
            boardSizingSlotWidth: 382,
            dividerRatio: 0.55,
            squareFitReservedHeight: 16,
            boardWidth: 18,
            boardHeight: 18,
            showLabels: true,
        });

        expect(larger.boardSurface.boardSurfaceWidth).toBe(smaller.boardSurface.boardSurfaceWidth);
        expect(larger.boardSurface.boardSurfaceHeight).toBeGreaterThan(
            smaller.boardSurface.boardSurfaceHeight,
        );
        expect(larger.gobanContainer.gobanContainerSize).toBeGreaterThan(
            smaller.gobanContainer.gobanContainerSize,
        );
    });

    it("uses the same square-fit usable height that the mobile layout later recomputes", () => {
        const geometry = computeMobileBoardGeometry({
            shellWidth: 744,
            shellHeight: 744,
            dividerRatio: 0.4949618414264922,
            boardSizingSlotWidth: 382,
            squareFitReservedHeight: 36,
            squareFitExtraReservedHeight: 4,
            boardWidth: 19,
            boardHeight: 19,
            showLabels: false,
        });

        expect(geometry.boardSurface.boardSurfaceHeight).toBe(328);
        expect(geometry.gobanContainer.gobanContainerSize).toBe(328);
        expect(geometry.gobanContainer.gobanContainerWidth).toBe(328);
    });
});

describe("mobile geometry mismatch classification", () => {
    it("classifies a vertical chrome mismatch", () => {
        const target = {
            geometrySource: "computeMobileBoardGeometry",
            dividerRatio: 0.609375,
            boardSurfaceWidth: 374,
            boardSurfaceHeight: 390,
            gobanContainerWidth: 374,
            gobanContainerHeight: 374,
            previewGobanContentSize: 360,
            predictedNativeGobanContentSize: 360,
            legacyVisualSize: 374,
            legacyFinalWindowSize: 374,
            usingRestingMaxGeometry: false,
            transformScale: 1,
            dragScale: 1,
            gobanLeft: 0,
            gobanTop: 0,
            boardSurface: {
                width: 374,
                height: 390,
            },
            gobanContainer: {
                size: 374,
                leftInSurface: 0,
                topInSurface: 0,
            },
            activePreviewContent: {
                size: 374,
                leftInContainer: 0,
                topInContainer: 0,
                leftInSurface: 0,
                topInSurface: 0,
                transformScale: 1,
            },
            nativeFinalContent: {
                size: 360,
                leftInContainer: 7,
                topInContainer: 7,
                leftInSurface: 7,
                topInSurface: 7,
            },
            geometry: computeMobileBoardGeometry({
                shellWidth: 394,
                shellHeight: 640,
                boardSizingSlotWidth: 382,
                dividerRatio: 0.609375,
                squareFitReservedHeight: 16,
                boardWidth: 18,
                boardHeight: 18,
                showLabels: true,
            }),
        };
        const actual = {
            measuredAt: 1,
            shell: {
                shellWidth: 394,
                shellHeight: 640,
            },
            boardSurface: {
                boardSurfaceWidth: 374,
                boardSurfaceHeight: 394,
            },
            gobanContainer: {
                gobanContainerWidth: 374,
                gobanContainerHeight: 378,
                gobanContainerSize: 374,
            },
            gobanContent: {
                gobanContentWidth: 360,
                gobanContentHeight: 360,
                gobanContentSize: 360,
                nativeGobanContentSize: 360,
            },
            divider: {
                dividerRatio: 0.609375,
            },
            derived: {
                horizontalInset: 8,
                boardVerticalChrome: 16,
            },
            source: "stable-observer" as const,
        };

        const comparison = compareMobileGeometryToTarget({
            target: target as Parameters<typeof compareMobileGeometryToTarget>[0]["target"],
            actual: actual as Parameters<typeof compareMobileGeometryToTarget>[0]["actual"],
        });

        expect(comparison.mismatchType).toBe("vertical-fit-slot-mismatch");
    });

    it("classifies the square-fit authority mismatch path", () => {
        const target = {
            geometrySource: "computeMobileBoardGeometry" as const,
            dividerRatio: 0.4949618414264922,
            boardSurfaceWidth: 382,
            boardSurfaceHeight: 328,
            gobanContainerWidth: 328,
            gobanContainerHeight: 328,
            previewGobanContentSize: 308,
            predictedNativeGobanContentSize: 308,
            legacyVisualSize: 328,
            legacyFinalWindowSize: 328,
            usingRestingMaxGeometry: false,
            transformScale: 1,
            dragScale: 1,
            gobanLeft: 0,
            gobanTop: 0,
            mobileScaledVisualTarget: {
                maxContainerSize: 328,
                maxPreviewContentSize: 308,
                targetContainerSize: 328,
                source: "max-preview-ratio" as const,
            },
            boardSurface: {
                width: 382,
                height: 328,
            },
            gobanContainer: {
                size: 328,
                leftInSurface: 0,
                topInSurface: 0,
            },
            activePreviewContent: {
                size: 328,
                leftInContainer: 0,
                topInContainer: 0,
                leftInSurface: 0,
                topInSurface: 0,
                transformScale: 1,
                nativeBackingContentSize: 328,
                visualScaleExceedsOne: false,
            },
            nativeFinalContent: {
                size: 308,
                leftInContainer: 10,
                topInContainer: 10,
                leftInSurface: 10,
                topInSurface: 10,
            },
            geometry: computeMobileBoardGeometry({
                shellWidth: 744,
                shellHeight: 744,
                boardSizingSlotWidth: 382,
                dividerRatio: 0.4949618414264922,
                squareFitReservedHeight: 36,
                squareFitExtraReservedHeight: 4,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: false,
            }),
        };
        const actual = {
            measuredAt: 1,
            shell: {
                shellWidth: 744,
                shellHeight: 744,
            },
            boardSizingSlot: {
                boardSizingSlotWidth: 382,
                boardSizingSlotHeight: 744,
            },
            boardSurface: {
                boardSurfaceWidth: 382,
                boardSurfaceHeight: 328.25,
            },
            gobanContainer: {
                gobanContainerWidth: 382,
                gobanContainerHeight: 368,
                gobanContainerSize: 382,
            },
            gobanContent: {
                gobanContentWidth: 360,
                gobanContentHeight: 360,
                gobanContentSize: 360,
                nativeGobanContentSize: 360,
            },
            divider: {
                dividerRatio: 0.4949618414264922,
            },
            derived: {
                horizontalInset: 0,
                boardVerticalChrome: 40,
            },
            source: "stable-observer" as const,
        };

        expect(
            classifyMobileGeometryMismatch({
                target,
                actual,
            }),
        ).toBe("square-fit-authority-mismatch");
    });

    it("flags a bad helper output that pushes the board into padding", () => {
        const stableGeometry = {
            measuredAt: 1,
            shell: {
                shellWidth: 390,
                shellHeight: 640,
            },
            boardSizingSlot: {
                boardSizingSlotWidth: 382,
                boardSizingSlotHeight: 640,
            },
            boardSurface: {
                boardSurfaceWidth: 374,
                boardSurfaceHeight: 382,
            },
            gobanContainer: {
                gobanContainerWidth: 374,
                gobanContainerHeight: 374,
                gobanContainerSize: 374,
            },
            gobanContent: {
                gobanContentWidth: 360,
                gobanContentHeight: 360,
                gobanContentSize: 360,
                nativeGobanContentSize: 360,
            },
            divider: {
                dividerRatio: 0.596875,
            },
            derived: {
                horizontalInset: 8,
                boardVerticalChrome: 8,
            },
            source: "stable-observer" as const,
        };
        const actual = stableGeometry as Parameters<
            typeof compareMobileGeometryToTarget
        >[0]["actual"];
        const target = {
            geometrySource: "computeMobileBoardGeometry" as const,
            dividerRatio: 0.596875,
            boardSurfaceWidth: 378,
            boardSurfaceHeight: 386,
            gobanContainerWidth: 378,
            gobanContainerHeight: 378,
            previewGobanContentSize: 363,
            predictedNativeGobanContentSize: 363,
            legacyVisualSize: 378,
            legacyFinalWindowSize: 378,
            usingRestingMaxGeometry: false,
            transformScale: 1,
            dragScale: 1,
            gobanLeft: 0,
            gobanTop: 0,
            mobileScaledVisualTarget: {
                maxContainerSize: 378,
                maxPreviewContentSize: 363,
                targetContainerSize: 378,
                source: "max-preview-ratio" as const,
            },
            boardSurface: {
                width: 378,
                height: 386,
            },
            gobanContainer: {
                size: 378,
                leftInSurface: 0,
                topInSurface: 0,
            },
            activePreviewContent: {
                size: 378,
                leftInContainer: 0,
                topInContainer: 0,
                leftInSurface: 0,
                topInSurface: 0,
                transformScale: 1,
                nativeBackingContentSize: 378,
                visualScaleExceedsOne: false,
            },
            nativeFinalContent: {
                size: 363,
                leftInContainer: 7,
                topInContainer: 7,
                leftInSurface: 7,
                topInSurface: 7,
            },
            geometry: computeMobileBoardGeometry({
                shellWidth: 390,
                shellHeight: 640,
                boardSizingSlotWidth: 382,
                dividerRatio: 0.596875,
                squareFitReservedHeight: 8,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        };

        const comparison = compareMobileGeometryToTarget({
            target,
            actual,
        });

        expect(comparison.matched).toBe(false);
        expect(comparison.mismatchType).not.toBeNull();
    });
});

describe("computeTransientDragReleaseGeometry", () => {
    it("preserves the resting max rect during release from the real max-start runtime inputs", () => {
        expect(
            computeTransientDragReleaseGeometry({
                finalWindowSize: 378,
                lastVisibleWindowSize: 374,
                startWindowWidth: 374,
                startWindowHeight: 378,
                usingRestingMaxGeometry: true,
            }),
        ).toEqual({
            settleWindowWidth: 374,
            settleWindowHeight: 378,
            fromWindowSize: 374,
            toWindowSize: 374,
            preserveRestingRect: true,
        });
    });
});

describe("computeTransientDragReleaseGeometryFromAppliedTarget", () => {
    it("commits the last applied target without remeasuring a new release window", () => {
        expect(
            computeTransientDragReleaseGeometryFromAppliedTarget({
                target: {
                    geometrySource: "computeMobileBoardGeometry",
                    dividerRatio: 0.5,
                    boardSurfaceWidth: 374,
                    boardSurfaceHeight: 382,
                    gobanContainerWidth: 374,
                    gobanContainerHeight: 382,
                    previewGobanContentSize: 360,
                    predictedNativeGobanContentSize: 360,
                    legacyVisualSize: 378,
                    legacyFinalWindowSize: 378,
                    usingRestingMaxGeometry: true,
                    transformScale: 1,
                    dragScale: 1,
                    gobanLeft: 7,
                    gobanTop: 0,
                    mobileScaledVisualTarget: {
                        maxContainerSize: 374,
                        maxPreviewContentSize: 360,
                        targetContainerSize: 374,
                        source: "max-preview-ratio" as const,
                    },
                    boardSurface: {
                        width: 374,
                        height: 382,
                    },
                    gobanContainer: {
                        size: 374,
                        leftInSurface: 0,
                        topInSurface: 0,
                    },
                    activePreviewContent: {
                        size: 360,
                        leftInContainer: 7,
                        topInContainer: 7,
                        leftInSurface: 7,
                        topInSurface: 7,
                        transformScale: 1,
                        nativeBackingContentSize: 360,
                        visualScaleExceedsOne: false,
                    },
                    nativeFinalContent: {
                        size: 360,
                        leftInContainer: 7,
                        topInContainer: 7,
                        leftInSurface: 7,
                        topInSurface: 7,
                    },
                    geometry: {
                        modelVersion: "mobile-square-surface-v1",
                        shell: {
                            shellWidth: 382,
                            shellHeight: 640,
                        },
                        boardPane: {
                            boardPaneHeight: 382,
                            usableBoardHeight: 374,
                        },
                        boardSizingSlot: {
                            boardSizingSlotWidth: 382,
                            boardSizingSlotHeight: 640,
                        },
                        divider: {
                            dividerRatio: 0.5,
                            boardPaneHeight: 320,
                        },
                        boardSurface: {
                            boardSurfaceWidth: 374,
                            boardSurfaceHeight: 382,
                        },
                        fitBox: {
                            outerSlotWidth: 382,
                            contentWidth: 374,
                            parentClientHeight: 382,
                            reservedHeight: 8,
                            fallbackHeight: 374,
                            contentHeight: 374,
                            boardSize: 374,
                            horizontalInsetPx: 4,
                            verticalInsetPx: 0,
                        },
                        gobanContainer: {
                            gobanContainerWidth: 374,
                            gobanContainerHeight: 374,
                            gobanContainerSize: 374,
                            gobanContainerLeft: 0,
                            gobanContainerTop: 0,
                            leftInSurface: 0,
                            topInSurface: 0,
                        },
                        activePreviewContent: {
                            size: 374,
                            leftInContainer: 0,
                            topInContainer: 0,
                            leftInSurface: 0,
                            topInSurface: 0,
                        },
                        nativeFinalContent: {
                            size: 360,
                            leftInContainer: 7,
                            topInContainer: 7,
                            leftInSurface: 7,
                            topInSurface: 7,
                        },
                        gobanContent: {
                            predictedNativeGobanContentSize: 360,
                            previewGobanContentSize: 360,
                            gobanContentLeft: 7,
                            gobanContentTop: 7,
                        },
                    },
                },
                lastVisibleContentSize: 360,
                lastVisibleLeftInContainer: 7,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toMatchObject({
            boardSurfaceWidth: 374,
            boardSurfaceHeight: 382,
            gobanContainerWidth: 374,
            gobanContainerHeight: 374,
            finalNativeContentSize: 360,
            fromContentSize: 360,
            toContentSize: 360,
            fromLeft: 7,
            toLeft: 7,
            fromContentTopInContainer: 7,
            toContentTopInContainer: 7,
            fromContentTopInSurface: 7,
            toContentTopInSurface: 7,
            contentDelta: 0,
            windowDelta: 0,
            targetSource: "last-applied-target",
            boardSurfacePreserved: true,
        });
    });
});

describe("predictNativeGobanContentSize", () => {
    it("predicts the quantized native board size for a labelled 19x19 board", () => {
        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 260,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toBe(252);

        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 292,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toBe(273);

        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 363,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toBe(357);

        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 382,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toBe(378);
    });

    it("keeps labelled and unlabelled 19x19 predictions distinct", () => {
        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 280,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: true,
            }),
        ).toBe(273);

        expect(
            predictNativeGobanContentSize({
                targetSlotSize: 280,
                boardWidth: 19,
                boardHeight: 19,
                showLabels: false,
            }),
        ).toBe(266);
    });
});

describe("refreshLastOfficialMoveFromTrunk", () => {
    it("updates a stale official move pointer while preserving the current variation node", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            players: {
                black: { id: 1, username: "black" },
                white: { id: 2, username: "white" },
            },
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                    branches: [
                        {
                            x: 3,
                            y: 4,
                        },
                    ],
                },
            },
        });
        const staleOfficialMove = controller.goban.engine.move_tree.trunk_next;
        const trunkTail = staleOfficialMove?.trunk_next;
        const variation = staleOfficialMove?.branches[0];

        if (!staleOfficialMove || !trunkTail || !variation) {
            throw new Error("Expected test move tree to contain trunk and variation nodes");
        }

        controller.goban.engine.jumpTo(variation);
        controller.goban.engine.last_official_move = staleOfficialMove;

        expect(refreshLastOfficialMoveFromTrunk(controller)).toBe(trunkTail);
        expect(controller.goban.engine.last_official_move).toBe(trunkTail);
        expect(controller.goban.engine.cur_move).toBe(variation);
    });
});

describe("restoreToOfficialTail", () => {
    it("jumps the board to the trunk tail and keeps the official pointer there", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            players: {
                black: { id: 1, username: "black" },
                white: { id: 2, username: "white" },
            },
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                    branches: [
                        {
                            x: 3,
                            y: 4,
                        },
                    ],
                },
            },
        });
        const trunkTail = controller.goban.engine.move_tree.trunk_next?.trunk_next;

        if (!trunkTail) {
            throw new Error("Expected test move tree to contain a trunk tail");
        }

        expect(restoreToOfficialTail(controller)).toBe(trunkTail);
        expect(controller.goban.engine.last_official_move).toBe(trunkTail);
        expect(controller.goban.engine.cur_move).toBe(trunkTail);
    });
});

describe("shouldRestoreToOfficialTailForGame", () => {
    it("restores once per game and again only if the board falls back to root", () => {
        expect(shouldRestoreToOfficialTailForGame(0, null, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, null, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, 123, 123)).toBe(false);
        expect(shouldRestoreToOfficialTailForGame(0, 123, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, 123, 456)).toBe(true);
    });
});

describe("shouldRestoreMainBoardToOfficialTail", () => {
    it("restores on a new game, at root, or when the previously-followed live tail advances", () => {
        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 0,
                officialTailMoveNumber: 20,
                lastRestored: null,
            }),
        ).toBe(true);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 20,
                officialTailMoveNumber: 20,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(false);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 20,
                officialTailMoveNumber: 21,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(true);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 19,
                officialTailMoveNumber: 21,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(false);
    });
});
