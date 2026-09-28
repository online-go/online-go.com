/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as React from "react";
import { MIN_BOARD_PANE_REM } from "./resizerUtil";

export type GameLayoutMode = "stacked" | "compactHorizontal" | "fullHorizontal";
export type LegacyViewMode = "portrait" | "wide";
/** Where the game action buttons go: the tab bar at the bottom of the side
 *  panel, or the dock at the right side. */
export type ActionButtonsPosition = "bar" | "dock";
export type MoveControlsPosition = "docked" | "under-board";

/**
 * Where the board sits in the landscape layout.
 *
 * - `window`: the board is centered in the window; the sidebar sits in
 *   the space to its right.
 * - `container`: the board is centered in the space beside the sidebar.
 * - `group`: the board and the sidebar are centered together, as one
 *   block, with equal empty space on both sides.
 */
export type GobanViewBoardAlignment = "window" | "container" | "group";

const GOBAN_VIEW_BOARD_ALIGNMENTS: readonly GobanViewBoardAlignment[] = [
    "window",
    "container",
    "group",
];

/** Read a stored "goban-view-board-alignment" value. An unknown value reads
 *  as `container`, the preference's default. */
export function normalizeBoardAlignment(stored: unknown): GobanViewBoardAlignment {
    return GOBAN_VIEW_BOARD_ALIGNMENTS.find((alignment) => alignment === stored) ?? "container";
}

export interface ViewportGeometry {
    width: number;
    height: number;
    clientWidth?: number;
    clientHeight?: number;
}

/** Pixel sizes of the landscape layout at the default 16px root font size.
 *  They are copies of GobanView.css and 01_variables.css values;
 *  layout.test.ts reads the stylesheets and fails when the two differ. */
export const LAYOUT_GEOMETRY = {
    sidebarGap: 20,
    edgeMargin: 4.8,
    defaultSidebar: 400,
    defaultLeftAside: 384,
    dockCollapsed: 32,
} as const;

/** Product geometry required before the three-column desktop composition is useful. */
export const FULL_HORIZONTAL_REQUIREMENTS = {
    leftAside: LAYOUT_GEOMETRY.defaultLeftAside,
    rightSidebar: LAYOUT_GEOMETRY.defaultSidebar,
    interColumnGaps: 24,
    resizer: 8,
    minimumUsefulGoban: 200,
    minimumHeight: 600,
} as const;

/**
 * Read a stored "goban-view-action-buttons" value. An unknown value reads as
 * `bar`. This is the only place that interprets the stored value.
 */
export function normalizeActionButtonsPosition(stored: unknown): ActionButtonsPosition {
    return stored === "dock" ? "dock" : "bar";
}

/** Viewports narrower than this always stack, whatever their aspect ratio. */
export const MINIMUM_HORIZONTAL_WIDTH = 600;

export function classifyGameLayout(viewport: ViewportGeometry): GameLayoutMode {
    const width = viewport.clientWidth ?? viewport.width;
    const height = viewport.clientHeight ?? viewport.height;
    const vertical = width / Math.max(height, 1) <= 0.8;
    if (vertical || width < MINIMUM_HORIZONTAL_WIDTH) {
        return "stacked";
    }

    const requiredWidth =
        FULL_HORIZONTAL_REQUIREMENTS.leftAside +
        FULL_HORIZONTAL_REQUIREMENTS.rightSidebar +
        FULL_HORIZONTAL_REQUIREMENTS.interColumnGaps +
        FULL_HORIZONTAL_REQUIREMENTS.resizer +
        FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban;
    if (width >= requiredWidth && height >= FULL_HORIZONTAL_REQUIREMENTS.minimumHeight) {
        return "fullHorizontal";
    }
    return "compactHorizontal";
}

export function legacyViewMode(mode: GameLayoutMode): LegacyViewMode {
    return mode === "stacked" ? "portrait" : "wide";
}

export interface GameLayoutSnapshot extends ViewportGeometry {
    mode: GameLayoutMode;
    squashed: boolean;
    /** True while an on-screen keyboard holds the layout from before it
     *  opened. See `nextSnapshot`. */
    keyboardOpen: boolean;
}

function readSnapshot(): GameLayoutSnapshot {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const clientWidth = document.documentElement.clientWidth || width;
    const clientHeight = document.documentElement.clientHeight || height;
    return {
        width,
        height,
        clientWidth,
        clientHeight,
        mode: classifyGameLayout({ width, height, clientWidth, clientHeight }),
        squashed: height <= 500,
        keyboardOpen: false,
    };
}

/** True when the focused element brings up the on-screen keyboard. */
function isEditingText(): boolean {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) {
        return false;
    }
    if (el.isContentEditable || el instanceof HTMLTextAreaElement) {
        return true;
    }
    return (
        el instanceof HTMLInputElement &&
        !["button", "checkbox", "radio", "range", "submit", "reset", "file", "color"].includes(
            el.type,
        )
    );
}

/** The snapshot from just before an on-screen keyboard opened, while it is
 *  open. See `nextSnapshot`. */
let beforeKeyboard: GameLayoutSnapshot | null = null;

/**
 * Compute the next snapshot. When an on-screen keyboard opens, the viewport
 * gets shorter but not narrower. Changing the layout at that time would
 * unmount the focused input and close the keyboard, so the mode and
 * squashed state from before the keyboard opened are kept. They are kept
 * until the viewport is as tall as it was before, the width changes, or no
 * text input has focus. The keyboard can change its height while it is open
 * or closing, so a height increase alone does not release them.
 */
function nextSnapshot(prev: GameLayoutSnapshot | null): GameLayoutSnapshot {
    const next = readSnapshot();
    const editing = isEditingText();
    if (
        !beforeKeyboard &&
        prev &&
        editing &&
        next.width === prev.width &&
        next.height < prev.height
    ) {
        beforeKeyboard = prev;
    }
    if (
        beforeKeyboard &&
        (!editing || next.width !== beforeKeyboard.width || next.height >= beforeKeyboard.height)
    ) {
        beforeKeyboard = null;
    }
    if (beforeKeyboard) {
        return {
            ...next,
            mode: beforeKeyboard.mode,
            squashed: beforeKeyboard.squashed,
            keyboardOpen: true,
        };
    }
    return next;
}

let snapshot: GameLayoutSnapshot | null = null;
const listeners = new Set<() => void>();
let listening = false;

function ensureListening(): void {
    if (listening || typeof window === "undefined") {
        return;
    }
    listening = true;
    const update = () => {
        const next = nextSnapshot(snapshot);
        if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
            snapshot = next;
            listeners.forEach((listener) => listener());
        }
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
}

function getSnapshot(): GameLayoutSnapshot {
    ensureListening();
    return (snapshot ??= readSnapshot());
}

export function getGameLayoutSnapshot(): GameLayoutSnapshot {
    return getSnapshot();
}

function subscribe(listener: () => void): () => void {
    ensureListening();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useGameLayout(): GameLayoutSnapshot {
    return React.useSyncExternalStore(subscribe, getSnapshot, () => ({
        width: 1,
        height: 1,
        clientWidth: 1,
        clientHeight: 1,
        mode: "stacked",
        squashed: false,
        keyboardOpen: false,
    }));
}

export interface GobanViewLayoutInput {
    mode: GameLayoutMode;
    rootWidth: number;
    prefs: {
        actionButtons: ActionButtonsPosition;
        mobileScroll: boolean;
        moveControls: MoveControlsPosition;
        sidebarWidth: number | null;
        leftAsideWidth: number | null;
        /** The stored value; the resolver normalizes it. */
        boardAlignment: GobanViewBoardAlignment;
    };
    /** What the view gives GobanView. A takeover, or any other state that
     *  comes and goes while the view is open, is not an input: it must not
     *  move the board. */
    offered: {
        /** A board to show (a controller). */
        board: boolean;
        leftAside: boolean;
        actionDock: boolean;
        portraitSplit: boolean;
        playerBars: boolean;
        /** Content for the top of the sidebar where the player bars do not
         *  show (`sidebarContentBefore`). */
        sidebarContentBefore: boolean;
        /** The built-in move controls: no `customSlider`, and not hidden
         *  with `hideSlider={true}`. */
        moveControls: boolean;
    };
}

export interface GobanViewLayout {
    mode: GameLayoutMode;
    /** Null when stacked: the alignment applies only to landscape. */
    boardAlignment: GobanViewBoardAlignment | null;
    leftAside: boolean;
    /** Clamped left aside width in px, or null for the CSS default. */
    leftAsideWidth: number | null;
    actionDock: boolean;
    mobileScroll: boolean;
    /** The action list replaces the tab bar at the end of the mobile scroll. */
    actionList: boolean;
    portraitSplit: boolean;
    moveControls: MoveControlsPosition;
    /** Player bars above and below the board. */
    playerBars: boolean;
    /** The view's `sidebarContentBefore` shows at the top of the sidebar:
     *  only in compactHorizontal, where the player bars do not show. */
    sidebarContentBefore: boolean;
    /** The built-in move controls have their row under the board. The row
     *  is part of the board stage, so the board size leaves room for it. */
    moveControlsUnderBoard: boolean;
}

/** The left aside can show only in fullHorizontal. Views that change their
 *  content when the aside is not there (Kibitz) use this rule too. */
export function leftAsideAllowed(mode: GameLayoutMode): boolean {
    return mode === "fullHorizontal";
}

function sidebarOuter(sidebarWidth: number | null): number {
    return (
        LAYOUT_GEOMETRY.sidebarGap +
        Math.max(LAYOUT_GEOMETRY.defaultSidebar, sidebarWidth ?? 0) +
        LAYOUT_GEOMETRY.edgeMargin
    );
}

/**
 * Clamp a stored left aside width so the board pane keeps at least
 * `MIN_BOARD_PANE_REM` (24rem) beside the aside and the main sidebar, the
 * same limit the resize handles use. Never below the default width:
 * `classifyGameLayout` only picks fullHorizontal when that fits.
 */
export function clampLeftAsideWidth(
    stored: number | null,
    rootWidth: number,
    sidebarWidth: number | null,
): number | null {
    if (stored === null) {
        return null;
    }
    const max =
        rootWidth -
        sidebarOuter(sidebarWidth) -
        MIN_BOARD_PANE_REM * 16 -
        LAYOUT_GEOMETRY.sidebarGap -
        LAYOUT_GEOMETRY.edgeMargin;
    return Math.floor(Math.max(LAYOUT_GEOMETRY.defaultLeftAside, Math.min(stored, max)));
}

/**
 * Decide which columns show, what the board stage holds, where the board
 * sits and where the move controls go. This is the only place these
 * decisions are made; see docs/goban-view-layout.md.
 */
export function resolveGobanViewLayout(input: GobanViewLayoutInput): GobanViewLayout {
    const { mode, prefs, offered } = input;
    const full = mode === "fullHorizontal";
    const stacked = mode === "stacked";
    const mobileScroll = stacked && prefs.mobileScroll && !offered.portraitSplit;
    const moveControls: MoveControlsPosition = mobileScroll ? "under-board" : prefs.moveControls;
    const moveControlsUnderBoard =
        moveControls === "under-board" && offered.moveControls && offered.board;
    const compact = mode === "compactHorizontal";
    const playerBars = offered.playerBars && offered.board && !compact;

    const leftAside = leftAsideAllowed(mode) && offered.leftAside;
    const leftAsideWidth = leftAside
        ? clampLeftAsideWidth(prefs.leftAsideWidth, input.rootWidth, prefs.sidebarWidth)
        : null;
    const leftAsideOuter = leftAside
        ? (leftAsideWidth ?? LAYOUT_GEOMETRY.defaultLeftAside) +
          LAYOUT_GEOMETRY.sidebarGap +
          LAYOUT_GEOMETRY.edgeMargin
        : 0;

    let actionDock = false;
    if (full && offered.actionDock && prefs.actionButtons === "dock") {
        const boardWidth =
            input.rootWidth -
            leftAsideOuter -
            sidebarOuter(prefs.sidebarWidth) -
            LAYOUT_GEOMETRY.dockCollapsed;
        actionDock = boardWidth >= FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban;
    }

    return {
        mode,
        boardAlignment: stacked ? null : normalizeBoardAlignment(prefs.boardAlignment),
        leftAside,
        leftAsideWidth,
        actionDock,
        mobileScroll,
        actionList: mobileScroll && offered.actionDock,
        portraitSplit: stacked && offered.portraitSplit,
        moveControls,
        playerBars,
        sidebarContentBefore: compact && offered.sidebarContentBefore,
        moveControlsUnderBoard,
    };
}

/**
 * The root classes that carry the resolved layout to the CSS. GobanView
 * sets these and only these for layout, in portrait and landscape alike, so
 * the CSS can never see a layout the resolver did not decide.
 */
export function gobanViewLayoutClasses(layout: GobanViewLayout): string[] {
    const classes: string[] = [legacyViewMode(layout.mode)];
    if (layout.mode === "compactHorizontal") {
        classes.push("compactHorizontal");
    }
    if (layout.boardAlignment) {
        classes.push(`board-align-${layout.boardAlignment}`);
    }
    if (layout.leftAside) {
        classes.push("has-left-aside");
    }
    if (layout.actionDock) {
        classes.push("has-action-dock");
    }
    if (layout.playerBars) {
        classes.push("has-player-bars");
    }
    if (layout.moveControlsUnderBoard) {
        classes.push("has-move-controls-under-board");
    }
    if (layout.mobileScroll) {
        classes.push("has-mobile-scroll");
    }
    if (layout.actionList) {
        classes.push("has-action-list");
    }
    if (layout.portraitSplit) {
        classes.push("has-portrait-split");
    }
    return classes;
}
