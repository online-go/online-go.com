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

import type { MoveTree, MoveTreeJson } from "goban";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";

const QUERY_PARAM = "kibitzVariationMonitor";
const STORAGE_KEY = "ogs.kibitzVariationMonitor";

type MonitorDetailValue = boolean | number | string | null | undefined;

export interface KibitzVariationMeasurement {
    event: string;
    elapsedMs: number;
    timestamp: string;
    selectedVariationId?: string;
    selectedVariationFrom?: number;
    selectedVariationMoveCount?: number;
    selectedVariationGameId?: number;
    variationId?: string;
    variationFrom?: number;
    variationMoveCount?: number;
    sourceGameMoveNumber?: number;
    visibleVariationCount?: number;
    trunkTailMoveNumber?: number;
    trunkLength?: number;
    branchCount?: number;
    totalNodeCount?: number;
    lastOfficialMoveNumber?: number;
    currentMoveNumber?: number;
    hasConfigMoveTree?: boolean;
    reason?: string;
    detail?: Record<string, MonitorDetailValue>;
}

export interface KibitzVariationMonitorInput {
    event: string;
    controller?: GobanController | null;
    selectedVariation?: KibitzVariationSummary | null;
    variation?: KibitzVariationSummary | null;
    sourceGame?: KibitzWatchedGame | null;
    visibleVariations?: readonly KibitzVariationSummary[];
    reason?: string;
    detail?: Record<string, MonitorDetailValue>;
}

declare global {
    interface Window {
        __kibitzVariationMeasurements?: KibitzVariationMeasurement[];
    }
}

function storageEnabled(): boolean {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
}

function queryEnabled(): boolean {
    try {
        return new URLSearchParams(window.location.search).get(QUERY_PARAM) === "1";
    } catch {
        return false;
    }
}

export function isKibitzVariationMonitoringEnabled(): boolean {
    return queryEnabled() || storageEnabled();
}

export function getMoveTreeTrunkTail(moveTree: MoveTree | undefined): MoveTree | null {
    if (!moveTree) {
        return null;
    }

    let tail = moveTree;
    while (tail.trunk_next) {
        tail = tail.trunk_next;
    }
    return tail;
}

function getMoveTreeStats(moveTree: MoveTree | undefined) {
    if (!moveTree) {
        return {
            trunkTailMoveNumber: undefined,
            trunkLength: 0,
            branchCount: 0,
            totalNodeCount: 0,
        };
    }

    let trunkLength = 0;
    let branchCount = 0;
    let totalNodeCount = 0;
    const stack: MoveTree[] = [moveTree];

    while (stack.length > 0) {
        const node = stack.pop();
        if (!node) {
            continue;
        }

        ++totalNodeCount;
        branchCount += node.branches.length;

        if (node.trunk_next) {
            stack.push(node.trunk_next);
        }
        for (const branch of node.branches) {
            stack.push(branch);
        }
    }

    let cursor = moveTree.trunk_next;
    while (cursor) {
        ++trunkLength;
        cursor = cursor.trunk_next;
    }

    return {
        trunkTailMoveNumber: getMoveTreeTrunkTail(moveTree)?.move_number,
        trunkLength,
        branchCount,
        totalNodeCount,
    };
}

function hasConfigMoveTree(controller: GobanController): boolean {
    const config = controller.goban.engine?.config as { move_tree?: MoveTreeJson } | undefined;
    return Boolean(config?.move_tree);
}

export function recordKibitzVariationMeasurement(input: KibitzVariationMonitorInput): void {
    if (!isKibitzVariationMonitoringEnabled()) {
        return;
    }

    const engine = input.controller?.goban.engine;
    const stats = getMoveTreeStats(engine?.move_tree);
    const selectedVariation = input.selectedVariation ?? null;
    const variation = input.variation ?? null;
    const measurement: KibitzVariationMeasurement = {
        event: input.event,
        elapsedMs: Math.round(performance.now()),
        timestamp: new Date().toISOString(),
        selectedVariationId: selectedVariation?.id,
        selectedVariationFrom: selectedVariation?.analysis_from,
        selectedVariationMoveCount: selectedVariation?.move_count,
        selectedVariationGameId: selectedVariation?.game_id,
        variationId: variation?.id,
        variationFrom: variation?.analysis_from,
        variationMoveCount: variation?.move_count,
        sourceGameMoveNumber: input.sourceGame?.move_number,
        visibleVariationCount: input.visibleVariations?.length,
        trunkTailMoveNumber: stats.trunkTailMoveNumber,
        trunkLength: stats.trunkLength,
        branchCount: stats.branchCount,
        totalNodeCount: stats.totalNodeCount,
        lastOfficialMoveNumber: engine?.last_official_move?.move_number,
        currentMoveNumber: engine?.cur_move?.move_number,
        hasConfigMoveTree: input.controller ? hasConfigMoveTree(input.controller) : undefined,
        reason: input.reason,
        detail: input.detail,
    };

    const measurements = window.__kibitzVariationMeasurements ?? [];
    measurements.push(measurement);
    window.__kibitzVariationMeasurements = measurements;
    console.debug("kibitz variation measurement", measurement);
}
