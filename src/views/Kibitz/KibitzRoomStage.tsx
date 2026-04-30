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
import type { MoveTree } from "goban";
import { Resizable } from "@/components/Resizable";
import { GobanController } from "@/lib/GobanController";
import { close_all_popovers, popover } from "@/lib/popover";
import { alert } from "@/lib/swal_config";
import { pgettext } from "@/lib/translate";
import type {
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzRoomUser,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import { KibitzBoardControls } from "./KibitzBoardControls";
import { KibitzDividerHandle } from "./KibitzDividerHandle";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { KibitzNodeText } from "./KibitzNodeText";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import { applyKibitzVariationToController } from "./kibitzVariationTree";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    room: KibitzRoomSummary;
    rooms: KibitzRoomSummary[];
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

export function KibitzRoomStage({
    room,
    rooms,
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
    const secondaryGameId = secondaryPane.preview_game_id;
    const secondaryPaneSize = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");
    const isCreatingVariationFromCurrentBoard = Boolean(
        secondaryPaneSize === "equal" && secondaryPane.variation_source_game,
    );
    const selectedVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    const draftBaseVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_draft_base_id,
    );
    const isDraftingVariation = secondaryPane.variation_source_game_id != null;
    const openRoomSettings = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            close_all_popovers();
            popover({
                elt: (
                    <KibitzRoomSettingsPopover
                        room={room}
                        canEditRoom={canEditRoom}
                        canChangeBoard={Boolean(onChangeBoard)}
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
        [canEditRoom, onChangeBoard, onDeleteRoom, onSaveRoomDetails, room],
    );
    const selectedVariationGameId = selectedVariation?.game_id ?? null;
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

        return `${selectedVariation.id}:${variationColorIndexes[selectedVariation.id] ?? 0}`;
    }, [selectedVariation, variationColorIndexes]);
    const visibleVariationApplyKey = React.useMemo(
        () =>
            visibleVariations
                .map((variation) => `${variation.id}:${variationColorIndexes[variation.id] ?? 0}`)
                .join("\n"),
        [variationColorIndexes, visibleVariations],
    );
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryGameId)
            ?.current_game ??
        proposals.find((proposal) => proposal.proposed_game.game_id === secondaryGameId)
            ?.proposed_game;
    const secondaryBoardGame = previewGame ?? secondaryPane.variation_source_game;
    const previewDisplayedMoveNumber = secondaryBoardGame?.move_number;
    const [mainBoardController, setMainBoardControllerState] =
        React.useState<GobanController | null>(null);
    // Wrap the setter so the parent (KibitzInner) is notified whenever the
    // main board's controller is (re)created. Lets the parent provide it via
    // GobanControllerContext so descendants like KibitzSharedStreamPanel can
    // hook into the watched game's chat without prop drilling.
    const setMainBoardController = React.useCallback(
        (controller: GobanController | null) => {
            setMainBoardControllerState(controller);
            onMainBoardControllerChange?.(controller);
        },
        [onMainBoardControllerChange],
    );
    const [secondaryBoardController, setSecondaryBoardController] =
        React.useState<GobanController | null>(null);
    const [mobileReturnLiveAvailable, setMobileReturnLiveAvailable] = React.useState(false);
    const [secondaryMoveTreeContainer, setSecondaryMoveTreeContainer] =
        React.useState<Resizable | null>(null);
    const previousSecondaryControllerRef = React.useRef<GobanController | null>(null);
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
        focusedPath: string | null;
    }>({
        variationId: null,
        requestId: -1,
        visibleVariationKey: "",
        focusedPath: null,
    });
    const appliedDraftBaseRef = React.useRef<{
        controller: GobanController | null;
        variationId: string | null;
    }>({
        controller: null,
        variationId: null,
    });
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
    const handleSecondaryMoveTreeContainerRef = React.useCallback((instance: Resizable | null) => {
        setSecondaryMoveTreeContainer(instance);
    }, []);
    const handleSecondaryMoveTreeResize = React.useCallback(() => {
        secondaryBoardController?.goban.move_tree_redraw(true);
    }, [secondaryBoardController]);

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
        }

        if (secondaryBoardController && container) {
            secondaryBoardController.setMoveTreeContainer(secondaryMoveTreeContainer);
            const redrawFrame = window.requestAnimationFrame(() => {
                secondaryBoardController.goban.move_tree_redraw(true);
            });

            return () => {
                window.cancelAnimationFrame(redrawFrame);
                secondaryBoardController.setMoveTreeContainer(null);
            };
        }

        return () => {
            if (secondaryBoardController) {
                secondaryBoardController.setMoveTreeContainer(null);
            }
        };
    }, [secondaryBoardController, secondaryMoveTreeContainer, secondaryMoveTreeKey]);

    React.useEffect(() => {
        if (!selectedVariation || !secondaryBoardController || secondaryPane.preview_game_id) {
            return;
        }

        const goban = secondaryBoardController.goban;

        let applyingVariation = false;
        const apply = (forceFocusSelected: boolean = false): boolean => {
            if (applyingVariation) {
                return false;
            }

            applyingVariation = true;
            const previousFocusPath = goban.engine.cur_move?.getMoveStringToThisPoint();
            const shouldFocusSelected =
                lastVariationFocusRequestRef.current.variationId !== selectedVariation.id ||
                lastVariationFocusRequestRef.current.requestId !== variationFocusRequestId ||
                lastVariationFocusRequestRef.current.visibleVariationKey !==
                    visibleVariationApplyKey;

            try {
                goban.load(goban.engine.config);

                let selectedEndpoint: MoveTree | null = null;

                for (const variation of visibleVariations) {
                    applyKibitzVariationToController(
                        secondaryBoardController,
                        variation,
                        variationColorIndexes[variation.id] ?? 0,
                        false,
                    );
                }

                if (
                    selectedVariation.game_id === visibleVariations[0]?.game_id ||
                    visibleVariations.length === 0
                ) {
                    const applied = applyKibitzVariationToController(
                        secondaryBoardController,
                        selectedVariation,
                        variationColorIndexes[selectedVariation.id] ?? 0,
                        true,
                    );
                    selectedEndpoint = applied.endpoint;
                }

                if (!selectedEndpoint) {
                    const applied = applyKibitzVariationToController(
                        secondaryBoardController,
                        selectedVariation,
                        variationColorIndexes[selectedVariation.id] ?? 0,
                        true,
                    );
                    selectedEndpoint = applied.endpoint;
                }

                if (selectedEndpoint && (shouldFocusSelected || forceFocusSelected)) {
                    goban.engine.jumpTo(selectedEndpoint);
                    lastVariationFocusRequestRef.current = {
                        variationId: selectedVariation.id,
                        requestId: variationFocusRequestId,
                        visibleVariationKey: visibleVariationApplyKey,
                        focusedPath: selectedEndpoint.getMoveStringToThisPoint(),
                    };
                } else if (previousFocusPath) {
                    goban.engine.followPath(0, previousFocusPath);
                }

                if (!selectedVariation.analysis_line_tree) {
                    if (selectedVariation.analysis_marks) {
                        goban.setMarks(selectedVariation.analysis_marks);
                    }
                    goban.pen_marks = selectedVariation.analysis_pen_marks
                        ? [...selectedVariation.analysis_pen_marks]
                        : [];
                }
                goban.redraw(true);
                goban.move_tree_redraw();
                return selectedEndpoint != null;
            } finally {
                applyingVariation = false;
            }
        };

        const onLoad = () => {
            apply(true);
        };
        goban.on("load", onLoad);

        if (goban.engine?.last_official_move) {
            apply();
        }

        return () => {
            goban.off("load", onLoad);
        };
    }, [
        secondaryBoardController,
        secondaryMoveTreeContainer,
        secondaryPane.preview_game_id,
        selectedVariationApplyKey,
        visibleVariationApplyKey,
        variationFocusRequestId,
    ]);

    React.useEffect(() => {
        if (
            !draftBaseVariation ||
            !secondaryBoardController ||
            secondaryPane.preview_game_id == null ||
            secondaryPane.variation_source_game_id == null
        ) {
            appliedDraftBaseRef.current = {
                controller: secondaryBoardController,
                variationId: null,
            };
            return;
        }

        if (
            appliedDraftBaseRef.current.controller === secondaryBoardController &&
            appliedDraftBaseRef.current.variationId === draftBaseVariation.id
        ) {
            return;
        }

        const goban = secondaryBoardController.goban;
        let applyingDraftBase = false;
        const apply = () => {
            if (applyingDraftBase) {
                return;
            }

            applyingDraftBase = true;
            try {
                const applied = applyKibitzVariationToController(
                    secondaryBoardController,
                    draftBaseVariation,
                    variationColorIndexes[draftBaseVariation.id] ?? 0,
                    true,
                );
                if (applied.endpoint) {
                    goban.engine.jumpTo(applied.endpoint);
                }
                goban.redraw(true);
                goban.move_tree_redraw();
                appliedDraftBaseRef.current = {
                    controller: secondaryBoardController,
                    variationId: draftBaseVariation.id,
                };
            } finally {
                applyingDraftBase = false;
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
        draftBaseVariation,
        secondaryBoardController,
        secondaryPane.preview_game_id,
        secondaryPane.variation_source_game_id,
        variationColorIndexes,
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

    // mainGame is populated by KibitzController.lookupGameForKibitz from
    // GET /games/<id>; the stage previously re-fetched the same endpoint
    // for "mainGameDetails", producing up to three concurrent calls per
    // board change (controller hydrateRoomCardGame + hydrateActiveRoomGame
    // + this stage's effect). Read the controller's data directly.
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
                        ref={mobileBoardSlotRef}
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
                                gameId={mainGame?.game_id}
                                {...boardDimensionsOf(mainGame)}
                                className="mobile-main-board-surface"
                                size={mobileBoardSize}
                                fitMode="contain"
                                respectContainerBounds={true}
                                onReady={setMainBoardController}
                            />
                        ) : null}
                        {renderPreviewBoard ? (
                            <KibitzBoard
                                gameId={secondaryGameId}
                                {...boardDimensionsOf(secondaryBoardGame)}
                                className="mobile-secondary-board-surface"
                                size={mobileBoardSize}
                                interactive={isDraftingVariation}
                                fitMode="contain"
                                respectContainerBounds={true}
                                onReady={setSecondaryBoardController}
                            />
                        ) : null}
                        {renderVariationBoard ? (
                            <KibitzBoard
                                gameId={selectedVariation?.game_id}
                                {...boardDimensionsOf(mainGame)}
                                className="mobile-secondary-board-surface"
                                size={mobileBoardSize}
                                interactive={false}
                                fitMode="contain"
                                respectContainerBounds={true}
                                onReady={setSecondaryBoardController}
                            />
                        ) : null}
                        {mobileCompareActive && !mobileCompareTargetActive ? (
                            <div className="secondary-board-empty-state mobile-compare-empty-state">
                                <button
                                    type="button"
                                    className="xs primary kibitz-create-variation-button"
                                    onClick={onCreateVariation}
                                >
                                    {pgettext(
                                        "Button label for opening Kibitz variation creation",
                                        "Create variation",
                                    )}
                                </button>
                                <div className="secondary-board-empty-message mobile-compare-empty-hint">
                                    {pgettext(
                                        "Hint for the mobile kibitz compare board before a variation is selected",
                                        "Or select a shared variation below",
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
                    <div className="mobile-board-controls-row">
                        <button
                            type="button"
                            className={
                                "kibitz-mobile-transport-button kibitz-mobile-stage-panel-button mobile-board-controls-toggle" +
                                (mobileCompanionPanel === "compare" ? " active" : "")
                            }
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
                                          "To room board",
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
                                    onClick={() => {
                                        if (
                                            selectedVariation &&
                                            onCreateVariationFromPostedVariation
                                        ) {
                                            onCreateVariationFromPostedVariation(selectedVariation);
                                            return;
                                        }

                                        onCreateVariation?.();
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
                            aria-label={pgettext(
                                "Aria label for opening room settings in Kibitz",
                                "Room settings",
                            )}
                        >
                            <i className="fa fa-gear" aria-hidden="true" />
                        </button>
                        <div className="board-title">{room.title}</div>
                    </div>
                    <div className="players player-pair">
                        <div className="player-badge">
                            {renderInlineAvatar(
                                mainGame?.black,
                                "stage-avatar",
                                "stage-avatar-image",
                            )}
                            <span className="player-name">{displayedBlack}</span>
                        </div>
                        <span className="player-vs">
                            {pgettext("Versus label shown between players in kibitz", "vs")}
                        </span>
                        <div className="player-badge">
                            {renderInlineAvatar(
                                mainGame?.white,
                                "stage-avatar",
                                "stage-avatar-image",
                            )}
                            <span className="player-name">{displayedWhite}</span>
                        </div>
                    </div>
                    <div className="board-subtitle">
                        {displayedTitle ??
                            pgettext(
                                "Placeholder when no main game is loaded in a kibitz room",
                                "No main board selected yet",
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
                                <div className="board-fit-slot" ref={mainBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={mainGame.game_id}
                                        {...boardDimensionsOf(mainGame)}
                                        className="main-board-surface"
                                        size={mainBoardSize}
                                        respectContainerBounds={true}
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
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={mainBoardController}
                                            variant="minimal"
                                            totalMoves={displayedMoveNumber}
                                        />
                                    </div>
                                    {secondaryPaneSize === "hidden" &&
                                    mainGame &&
                                    onCreateVariation ? (
                                        <div className="board-actions board-actions-inline board-actions-left main-board-new-variation-action">
                                            <button
                                                type="button"
                                                className="kibitz-move-control create-variation-button"
                                                onClick={onCreateVariation}
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
                                <div
                                    className={
                                        "board-meta" +
                                        (isCreatingVariationFromCurrentBoard
                                            ? " board-meta-variation-inline"
                                            : "")
                                    }
                                >
                                    {isCreatingVariationFromCurrentBoard ? (
                                        <>
                                            {secondaryBoardGame ? (
                                                <div className="players player-pair">
                                                    <div className="player-badge">
                                                        {renderInlineAvatar(
                                                            secondaryBoardGame.black,
                                                            "stage-avatar",
                                                            "stage-avatar-image",
                                                        )}
                                                        <span className="player-name">
                                                            {secondaryBoardGame.black.username}
                                                        </span>
                                                    </div>
                                                    <span className="player-vs">
                                                        {pgettext(
                                                            "Versus label shown between players in kibitz",
                                                            "vs",
                                                        )}
                                                    </span>
                                                    <div className="player-badge">
                                                        {renderInlineAvatar(
                                                            secondaryBoardGame.white,
                                                            "stage-avatar",
                                                            "stage-avatar-image",
                                                        )}
                                                        <span className="player-name">
                                                            {secondaryBoardGame.white.username}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div className="board-meta-variation-title">
                                                {pgettext(
                                                    "Title for a new Kibitz variation draft",
                                                    "New variation",
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="players player-pair">
                                                <div className="player-badge">
                                                    {renderInlineAvatar(
                                                        previewGame?.black,
                                                        "stage-avatar",
                                                        "stage-avatar-image",
                                                    )}
                                                    <span className="player-name">
                                                        {previewGame?.black.username ?? ""}
                                                    </span>
                                                </div>
                                                <span className="player-vs">
                                                    {pgettext(
                                                        "Versus label shown between players in kibitz",
                                                        "vs",
                                                    )}
                                                </span>
                                                <div className="player-badge">
                                                    {renderInlineAvatar(
                                                        previewGame?.white,
                                                        "stage-avatar",
                                                        "stage-avatar-image",
                                                    )}
                                                    <span className="player-name">
                                                        {previewGame?.white.username ?? ""}
                                                    </span>
                                                </div>
                                            </div>
                                            {previewGame?.title ?? ""}
                                        </>
                                    )}
                                </div>
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={secondaryGameId}
                                        {...boardDimensionsOf(secondaryBoardGame)}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        interactive={secondaryPaneSize === "equal"}
                                        respectContainerBounds={true}
                                        onReady={setSecondaryBoardController}
                                    />
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={previewDisplayedMoveNumber}
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
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={selectedVariation?.game_id}
                                        {...boardDimensionsOf(mainGame)}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        interactive={false}
                                        respectContainerBounds={true}
                                        onReady={setSecondaryBoardController}
                                    />
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={selectedVariation.move_count}
                                        />
                                    </div>
                                    <div className="board-actions board-actions-inline board-actions-left">
                                        {secondaryPaneSize === "equal" &&
                                        onCreateVariationFromPostedVariation ? (
                                            <button
                                                type="button"
                                                className="create-variation-button"
                                                onClick={() =>
                                                    onCreateVariationFromPostedVariation(
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
                                        onClick={onCreateVariation}
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
            <KibitzDividerHandle secondaryPane={secondaryPane} onSetMode={onSetSecondaryPaneMode} />
        </div>
    );
}
