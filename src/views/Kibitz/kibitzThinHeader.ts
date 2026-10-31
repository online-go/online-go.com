/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 */

import * as React from "react";
import { useGameLayout } from "@/components/GobanView";
import type { GameLayoutSnapshot } from "@/components/GobanView";

let headerOverride: boolean | undefined;
const headerListeners = new Set<() => void>();

export function setKibitzHeaderOverride(thin: boolean | undefined): void {
    headerOverride = thin;
    headerListeners.forEach((listener) => listener());
}

function subscribeHeader(listener: () => void): () => void {
    headerListeners.add(listener);
    return () => {
        headerListeners.delete(listener);
    };
}

function getHeaderOverride(): boolean | undefined {
    return headerOverride;
}

export function usesKibitzThinHeader(layout: GameLayoutSnapshot): boolean {
    const width = layout.clientWidth ?? layout.width;
    const height = layout.clientHeight ?? layout.height;
    return layout.mode === "stacked" && width < 600 && (width < 390 || height < 844);
}

export function useKibitzThinHeader(): boolean {
    const layout = useGameLayout();
    const manualOverride = React.useSyncExternalStore(subscribeHeader, getHeaderOverride);
    const next = usesKibitzThinHeader(layout);
    const [thin, setThin] = React.useState(next);
    React.useLayoutEffect(() => {
        if (!layout.keyboardOpen) {
            setThin(next);
        }
    }, [layout.keyboardOpen, next]);
    return layout.mode === "stacked" && (manualOverride ?? thin);
}
