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
import { Resizable } from "@/components/Resizable";
import { GobanController } from "@/lib/GobanController";
import { get } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { pgettext } from "@/lib/translate";
import type {
    KibitzMode,
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import { KibitzBoardControls } from "./KibitzBoardControls";
import { KibitzDividerHandle } from "./KibitzDividerHandle";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    rooms: KibitzRoomSummary[];
    proposals: KibitzProposal[];
    variations: KibitzVariationSummary[];
    secondaryPane: KibitzSecondaryPaneState;
    onClearPreview: () => void;
    onPostVariation: (controller: GobanController) => void;
    onSetSecondaryPaneMode: (mode: "hidden" | "small" | "equal") => void;
    onChangeBoard?: () => void;
    onCreateVariation?: () => void;
}

function useSquareFitSize<T extends HTMLElement>(layoutKey: string) {
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
            const usableHeight = Math.max(slotHeight, fallbackHeight);
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
    }, [element, layoutKey]);

    return [ref, size] as const;
}

function getUserInitials(username: string | undefined): string {
    const trimmedUsername = (username ?? "").trim();

    if (!trimmedUsername) {
        return "?";
    }

    const parts = trimmedUsername.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getUserIcon(user: unknown): string | undefined {
    if (!user || typeof user !== "object") {
        return undefined;
    }

    const icon = "icon" in user ? user.icon : undefined;

    return typeof icon === "string" && icon.length > 0 ? icon : undefined;
}

function renderInlineAvatar(
    user: unknown,
    username: string | undefined,
    className: string,
): React.ReactElement {
    const icon = getUserIcon(user);

    return (
        <span className={className} title={username} aria-hidden="true">
            {icon ? (
                <img className="stage-avatar-image" src={icon} alt="" aria-hidden="true" />
            ) : (
                getUserInitials(username)
            )}
        </span>
    );
}

export function KibitzRoomStage({
    mode,
    room,
    rooms,
    proposals,
    variations,
    secondaryPane,
    onClearPreview,
    onPostVariation,
    onSetSecondaryPaneMode,
    onChangeBoard,
    onCreateVariation,
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
    const [mainGameDetails, setMainGameDetails] = React.useState<rest_api.GameDetails | null>(null);
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryGameId)
            ?.current_game ??
        proposals.find((proposal) => proposal.proposed_game.game_id === secondaryGameId)
            ?.proposed_game;
    const secondaryBoardGame = previewGame ?? secondaryPane.variation_source_game;
    const previewDisplayedMoveNumber = secondaryBoardGame?.move_number;
    const [mainBoardController, setMainBoardController] = React.useState<GobanController | null>(
        null,
    );
    const [secondaryBoardController, setSecondaryBoardController] =
        React.useState<GobanController | null>(null);
    const [secondaryMoveTreeContainer, setSecondaryMoveTreeContainer] =
        React.useState<Resizable | null>(null);
    const previousSecondaryControllerRef = React.useRef<GobanController | null>(null);
    const [mainBoardSlotRef, mainBoardSize] = useSquareFitSize<HTMLDivElement>(
        `main-${secondaryPaneSize}`,
    );
    const [secondaryBoardSlotRef, secondaryBoardSize] = useSquareFitSize<HTMLDivElement>(
        `secondary-${secondaryPaneSize}-${secondaryPane.variation_id ?? ""}-${secondaryPane.preview_game_id ?? ""}`,
    );
    const secondaryMoveTreeKey = React.useMemo(() => {
        if (secondaryPane.variation_id != null) {
            return `variation-${secondaryPane.variation_id}`;
        }

        if (secondaryPane.variation_source_game_id != null) {
            return `draft-${secondaryPane.variation_source_game_id}`;
        }

        if (secondaryPane.preview_game_id != null) {
            return `preview-${secondaryPane.preview_game_id}`;
        }

        return "empty";
    }, [
        secondaryPane.preview_game_id,
        secondaryPane.variation_id,
        secondaryPane.variation_source_game_id,
    ]);
    const handleSecondaryMoveTreeContainerRef = React.useCallback((instance: Resizable | null) => {
        setSecondaryMoveTreeContainer(instance);
    }, []);

    React.useEffect(() => {
        const previousController = previousSecondaryControllerRef.current;
        const container = secondaryMoveTreeContainer?.div ?? null;

        if (previousController && previousController !== secondaryBoardController) {
            previousController.setMoveTreeContainer(null);
        }

        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        if (secondaryBoardController && container) {
            secondaryBoardController.setMoveTreeContainer(secondaryMoveTreeContainer);
        }

        previousSecondaryControllerRef.current = secondaryBoardController;

        return () => {
            if (secondaryBoardController) {
                secondaryBoardController.setMoveTreeContainer(null);
            }
        };
    }, [secondaryBoardController, secondaryMoveTreeContainer, secondaryMoveTreeKey]);

    React.useEffect(() => {
        if (!mainGame?.game_id || mainGame.mock_game_data || mode === "demo") {
            setMainGameDetails(null);
            return;
        }

        let canceled = false;

        get(`games/${mainGame.game_id}`)
            .then((details: rest_api.GameDetails) => {
                if (!canceled) {
                    setMainGameDetails(details);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setMainGameDetails(null);
                }
            });

        return () => {
            canceled = true;
        };
    }, [mainGame?.game_id, mainGame?.mock_game_data, mode]);

    React.useEffect(() => {
        if (!selectedVariation || !secondaryBoardController) {
            return;
        }

        const goban = secondaryBoardController.goban;

        if (selectedVariation.analysis_marks) {
            goban.setMarks(selectedVariation.analysis_marks);
        }
        goban.pen_marks = selectedVariation.analysis_pen_marks
            ? [...selectedVariation.analysis_pen_marks]
            : [];
        goban.redraw(true);
    }, [secondaryBoardController, selectedVariation]);

    const displayedTitle = mainGameDetails?.name || mainGame?.title;
    const displayedBlack = mainGameDetails?.players?.black?.username || mainGame?.black.username;
    const displayedWhite = mainGameDetails?.players?.white?.username || mainGame?.white.username;
    const displayedMoveNumber =
        mainGameDetails?.gamedata?.moves?.length ??
        mainGameDetails?.gamedata?.clock?.last_move ??
        mainGame?.move_number;
    const onConfirmClearSecondaryPane = React.useCallback(() => {
        void alert
            .fire({
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
                focusCancel: true,
            })
            .then(({ value: confirmed }) => {
                if (confirmed) {
                    onClearPreview();
                }
            });
    }, [onClearPreview]);

    return (
        <div className="KibitzRoomStage">
            <div className={`KibitzRoomStage-boards secondary-pane-${secondaryPaneSize}`}>
                <div className="board-panel main-board">
                    <div className="panel-body">
                        {mainGame ? (
                            <div className="board-content">
                                <div
                                    className={
                                        "board-meta" +
                                        (secondaryPaneSize === "hidden" ? " board-meta-main" : "")
                                    }
                                >
                                    <div className="board-title-row">
                                        <div className="board-title">{room.title}</div>
                                        <div className="board-subtitle">
                                            {displayedTitle ??
                                                pgettext(
                                                    "Placeholder when no main game is loaded in a kibitz room",
                                                    "No main board selected yet",
                                                )}
                                        </div>
                                    </div>
                                    <div className="players player-pair">
                                        <div className="player-badge">
                                            {renderInlineAvatar(
                                                mainGame?.black,
                                                displayedBlack,
                                                "stage-avatar",
                                            )}
                                            <span className="player-name">{displayedBlack}</span>
                                        </div>
                                        <span className="player-vs">
                                            {pgettext(
                                                "Versus label shown between players in kibitz",
                                                "vs",
                                            )}
                                        </span>
                                        <div className="player-badge">
                                            {renderInlineAvatar(
                                                mainGame?.white,
                                                displayedWhite,
                                                "stage-avatar",
                                            )}
                                            <span className="player-name">{displayedWhite}</span>
                                        </div>
                                    </div>
                                    {onCreateVariation || onChangeBoard ? (
                                        <div className="board-meta-actions">
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
                                            {onChangeBoard ? (
                                                <button
                                                    type="button"
                                                    className="xs primary kibitz-change-board-button"
                                                    onClick={onChangeBoard}
                                                >
                                                    {pgettext(
                                                        "Button label for opening Kibitz change board",
                                                        "Change board",
                                                    )}
                                                </button>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="board-fit-slot" ref={mainBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={
                                            mainGame.mock_game_data ? undefined : mainGame.game_id
                                        }
                                        json={mainGame.mock_game_data}
                                        className="main-board-surface"
                                        size={mainBoardSize}
                                        onReady={setMainBoardController}
                                    />
                                </div>
                                <div className="main-board-transport-row">
                                    <KibitzBoardControls
                                        controller={mainBoardController}
                                        variant="minimal"
                                        totalMoves={displayedMoveNumber}
                                    />
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
                                {onChangeBoard ? (
                                    <button
                                        type="button"
                                        className="xs primary kibitz-change-board-button"
                                        onClick={onChangeBoard}
                                    >
                                        {pgettext(
                                            "Button label for opening Kibitz change board",
                                            "Change board",
                                        )}
                                    </button>
                                ) : null}
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
                            <div className="board-content">
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
                                                            secondaryBoardGame.black.username,
                                                            "stage-avatar",
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
                                                            secondaryBoardGame.white.username,
                                                            "stage-avatar",
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
                                                        previewGame?.black.username,
                                                        "stage-avatar",
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
                                                        previewGame?.white.username,
                                                        "stage-avatar",
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
                                        gameId={
                                            secondaryBoardGame?.mock_game_data
                                                ? undefined
                                                : secondaryGameId
                                        }
                                        json={secondaryBoardGame?.mock_game_data}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        interactive={secondaryPaneSize === "equal"}
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
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-analyze-row">
                                        <GobanAnalyzeButtonBar
                                            controller={secondaryBoardController}
                                            showBackToGame={false}
                                            showConditionalPlannerButton={false}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-compose-row">
                                        <KibitzVariationComposer
                                            controller={secondaryBoardController}
                                            onSubmit={onPostVariation}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        key={secondaryMoveTreeKey}
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        ref={handleSecondaryMoveTreeContainerRef}
                                    />
                                ) : null}
                                {secondaryPaneSize !== "equal" ? (
                                    <div className="board-content-spacer" aria-hidden="true" />
                                ) : null}
                            </div>
                        ) : selectedVariation ? (
                            <div className="board-content">
                                <div
                                    className={
                                        "board-meta" +
                                        (secondaryPaneSize === "equal"
                                            ? " board-meta-variation-inline"
                                            : "")
                                    }
                                >
                                    <div className="players player-single">
                                        <div className="player-badge">
                                            {renderInlineAvatar(
                                                selectedVariation.creator,
                                                selectedVariation.creator.username,
                                                "stage-avatar",
                                            )}
                                            <span className="player-name">
                                                {selectedVariation.creator.username}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="board-meta-variation-title">
                                        {selectedVariation.title ??
                                            pgettext(
                                                "Fallback title for an untitled kibitz variation",
                                                "Variation preview",
                                            )}
                                    </div>
                                </div>
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    <KibitzBoard
                                        json={selectedVariation.mock_game_data}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        interactive={secondaryPaneSize === "equal"}
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
                                    <div className="board-actions board-actions-inline">
                                        <button
                                            type="button"
                                            className="preview-action-button clear-preview symbol-button"
                                            onClick={onConfirmClearSecondaryPane}
                                            aria-label={pgettext(
                                                "Aria label for closing a variation preview in the secondary kibitz pane",
                                                "Clear",
                                            )}
                                            title={pgettext(
                                                "Tooltip label for closing a variation preview in the secondary kibitz pane",
                                                "Clear",
                                            )}
                                        >
                                            X
                                        </button>
                                    </div>
                                </div>
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-analyze-row">
                                        <GobanAnalyzeButtonBar
                                            controller={secondaryBoardController}
                                            showBackToGame={false}
                                            showConditionalPlannerButton={false}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize === "equal" && secondaryBoardController ? (
                                    <div className="secondary-board-compose-row">
                                        <KibitzVariationComposer
                                            controller={secondaryBoardController}
                                            onSubmit={onPostVariation}
                                        />
                                    </div>
                                ) : null}
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        key={secondaryMoveTreeKey}
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        ref={handleSecondaryMoveTreeContainerRef}
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
