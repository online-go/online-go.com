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
import * as DynamicHelp from "react-dynamic-help";

import type { KibitzRoomSummary } from "@/models/kibitz";

import { KIBITZ_HELP_FLOW_IDS } from "./KibitzHelpFlows";

type KibitzHelpFlowId = (typeof KIBITZ_HELP_FLOW_IDS)[keyof typeof KIBITZ_HELP_FLOW_IDS];

type UseKibitzHelpTriggersArgs = {
    isMobileLayout: boolean;
    room: KibitzRoomSummary | null;
    flowReadiness: Partial<Record<KibitzHelpFlowId, boolean>>;
    pickerOpen: boolean;
    mobileOverlayOpen: boolean;
};

type UseKibitzHelpTriggersResult = {
    noteMobileVariationsPanelOpened: () => void;
    noteDesktopVariationMadeVisible: () => void;
    notePostedVariationOpened: () => void;
    noteDraftStartedFromPostedVariation: () => void;
};

const KIBITZ_HELP_FLOW_ID_SET = new Set<string>(Object.values(KIBITZ_HELP_FLOW_IDS));

function isKibitzHelpFlowId(flowId: string): flowId is KibitzHelpFlowId {
    return KIBITZ_HELP_FLOW_ID_SET.has(flowId);
}

function getVisibleKibitzFlowId(
    flowInfo: ReturnType<DynamicHelp.AppApi["getFlowInfo"]>,
): KibitzHelpFlowId | null {
    for (const flow of flowInfo) {
        if (flow.visible && isKibitzHelpFlowId(flow.id)) {
            return flow.id;
        }
    }

    return null;
}

function isFlowSeen(
    flowInfo: ReturnType<DynamicHelp.AppApi["getFlowInfo"]>,
    flowId: KibitzHelpFlowId,
): boolean {
    return flowInfo.some((flow) => flow.id === flowId && flow.seen);
}

export function useKibitzHelpTriggers({
    isMobileLayout,
    room,
    flowReadiness,
    pickerOpen,
    mobileOverlayOpen,
}: UseKibitzHelpTriggersArgs): UseKibitzHelpTriggersResult {
    const { triggerFlow, getFlowInfo, getSystemStatus } = React.useContext(DynamicHelp.Api);
    const firstRunFlowId = isMobileLayout
        ? KIBITZ_HELP_FLOW_IDS.mobileFirstRun
        : KIBITZ_HELP_FLOW_IDS.desktopFirstRun;
    const previousMainBoardIdRef = React.useRef<number | null>(null);
    const hydratedMainBoardRef = React.useRef(false);
    const pendingFlowIdRef = React.useRef<KibitzHelpFlowId | null>(null);
    const flowReadinessRef = React.useRef(flowReadiness);
    const lastAutoTriggerAtRef = React.useRef(0);
    const [pendingFlowTick, setPendingFlowTick] = React.useState(0);

    React.useEffect(() => {
        flowReadinessRef.current = flowReadiness;
    }, [flowReadiness]);

    const queueFlow = React.useCallback(
        (flowId: KibitzHelpFlowId, allowBeforeFirstRunSeen: boolean) => {
            const flowInfo = getFlowInfo();
            const flowState = flowInfo.find((flow) => flow.id === flowId);
            if (flowState?.visible || flowState?.seen || pendingFlowIdRef.current === flowId) {
                return;
            }

            if (!allowBeforeFirstRunSeen && !isFlowSeen(flowInfo, firstRunFlowId)) {
                return;
            }

            pendingFlowIdRef.current = flowId;
            setPendingFlowTick((value) => value + 1);
        },
        [firstRunFlowId, getFlowInfo],
    );

    const flushPendingFlow = React.useCallback(() => {
        const pendingFlowId = pendingFlowIdRef.current;
        if (!pendingFlowId || !getSystemStatus().initialized) {
            return;
        }

        const flowInfo = getFlowInfo();
        if (getVisibleKibitzFlowId(flowInfo) != null) {
            return;
        }

        const flowState = flowInfo.find((flow) => flow.id === pendingFlowId);
        if (flowState == null) {
            return;
        }

        if (flowState.visible || flowState.seen) {
            pendingFlowIdRef.current = null;
            return;
        }

        if (!flowReadinessRef.current[pendingFlowId]) {
            return;
        }

        const now = Date.now();
        if (now - lastAutoTriggerAtRef.current < 800) {
            return;
        }

        lastAutoTriggerAtRef.current = now;
        triggerFlow(pendingFlowId);
        pendingFlowIdRef.current = null;
    }, [getFlowInfo, getSystemStatus, triggerFlow]);

    const firstRunSeen = React.useCallback(() => {
        return isFlowSeen(getFlowInfo(), firstRunFlowId);
    }, [firstRunFlowId, getFlowInfo]);
    const firstRunReady = Boolean(flowReadiness[firstRunFlowId]);

    React.useEffect(() => {
        if (!room || pickerOpen || mobileOverlayOpen) {
            return;
        }

        if (firstRunSeen()) {
            return;
        }

        if (!firstRunReady) {
            return;
        }

        queueFlow(firstRunFlowId, true);
    }, [
        firstRunFlowId,
        firstRunReady,
        mobileOverlayOpen,
        pickerOpen,
        queueFlow,
        room,
        firstRunSeen,
    ]);

    React.useEffect(() => {
        if (!room || pickerOpen || mobileOverlayOpen) {
            return;
        }

        const currentMainBoardId = room.current_game?.game_id ?? null;
        if (currentMainBoardId == null) {
            return;
        }

        if (!hydratedMainBoardRef.current) {
            hydratedMainBoardRef.current = true;
            previousMainBoardIdRef.current = currentMainBoardId;
            return;
        }

        const previousMainBoardId = previousMainBoardIdRef.current;
        previousMainBoardIdRef.current = currentMainBoardId;

        if (previousMainBoardId == null || previousMainBoardId === currentMainBoardId) {
            return;
        }

        if (!firstRunSeen()) {
            return;
        }

        queueFlow(KIBITZ_HELP_FLOW_IDS.roomBoardChange, false);
    }, [firstRunSeen, mobileOverlayOpen, pickerOpen, queueFlow, room]);

    React.useEffect(() => {
        if (pendingFlowIdRef.current == null) {
            return;
        }

        const intervalId = window.setInterval(() => {
            flushPendingFlow();
            if (pendingFlowIdRef.current == null) {
                window.clearInterval(intervalId);
            }
        }, 800);

        flushPendingFlow();

        if (pendingFlowIdRef.current == null) {
            window.clearInterval(intervalId);
            return;
        }

        return () => {
            window.clearInterval(intervalId);
        };
    }, [flushPendingFlow, pendingFlowTick]);

    const noteMobileVariationsPanelOpened = React.useCallback(() => {
        if (!isMobileLayout || !firstRunSeen()) {
            return;
        }

        queueFlow(KIBITZ_HELP_FLOW_IDS.mobileFirstVariations, false);
    }, [firstRunSeen, isMobileLayout, queueFlow]);

    const noteDesktopVariationMadeVisible = React.useCallback(() => {
        if (isMobileLayout || !firstRunSeen()) {
            return;
        }

        queueFlow(KIBITZ_HELP_FLOW_IDS.desktopFirstVariations, false);
    }, [firstRunSeen, isMobileLayout, queueFlow]);

    const notePostedVariationOpened = React.useCallback(() => {
        if (!firstRunSeen()) {
            return;
        }

        queueFlow(
            isMobileLayout
                ? KIBITZ_HELP_FLOW_IDS.mobilePostedVariation
                : KIBITZ_HELP_FLOW_IDS.desktopPostedVariation,
            false,
        );
    }, [firstRunSeen, isMobileLayout, queueFlow]);

    const noteDraftStartedFromPostedVariation = React.useCallback(() => {
        if (!firstRunSeen()) {
            return;
        }

        queueFlow(KIBITZ_HELP_FLOW_IDS.draftFromPostedVariation, false);
    }, [firstRunSeen, queueFlow]);

    return {
        noteMobileVariationsPanelOpened,
        noteDesktopVariationMadeVisible,
        notePostedVariationOpened,
        noteDraftStartedFromPostedVariation,
    };
}
