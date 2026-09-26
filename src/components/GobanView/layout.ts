/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as React from "react";

export type GameLayoutMode = "stacked" | "compactHorizontal" | "fullHorizontal";
export type LegacyViewMode = "portrait" | "wide";

export interface ViewportGeometry {
    width: number;
    height: number;
    clientWidth?: number;
    clientHeight?: number;
}

/** Product geometry required before the three-column desktop composition is useful. */
export const FULL_HORIZONTAL_REQUIREMENTS = {
    leftAside: 24 * 16,
    rightSidebar: 400,
    interColumnGaps: 24,
    resizer: 8,
    minimumUsefulGoban: 200,
    minimumHeight: 600,
} as const;

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
