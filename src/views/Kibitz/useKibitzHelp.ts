/*
 * Copyright (C)  Online-Go.com
 * Licensed under the GNU Affero General Public License.
 */
import * as React from "react";
import * as DynamicHelp from "react-dynamic-help";
import {
    KIBITZ_INTRO_FLOW,
    KIBITZ_ROOM_SWITCHER_TARGET,
    KIBITZ_ROOM_TARGET,
    KIBITZ_VARIATION_FLOW,
    KIBITZ_VARIATION_TARGET,
} from "./KibitzHelpFlows";

export function useKibitzHelp(
    isStacked: boolean,
    showingVariation: boolean,
): {
    roomRef: React.RefCallback<HTMLDivElement> | undefined;
    roomSwitcherRef: React.RefCallback<HTMLButtonElement> | undefined;
    acknowledgeRoomSwitcher: () => void;
    variationRef: React.RefCallback<HTMLDivElement> | undefined;
} {
    const api = React.useContext(DynamicHelp.Api);
    const roomTarget = api.registerTargetItem?.(KIBITZ_ROOM_TARGET);
    const roomSwitcherTarget = api.registerTargetItem?.(KIBITZ_ROOM_SWITCHER_TARGET);
    const variationTarget = api.registerTargetItem?.(KIBITZ_VARIATION_TARGET);

    const acknowledgeRoomSwitcher = () => {
        const status = api.getSystemStatus?.();
        if (
            isStacked &&
            status?.initialized &&
            status.enabled &&
            api.getFlowInfo().some((flow) => flow.id === KIBITZ_INTRO_FLOW && flow.visible)
        ) {
            roomSwitcherTarget?.used();
        }
    };

    React.useEffect(() => {
        if (isStacked && !showingVariation) {
            return;
        }
        const maybeShow = () => {
            const status = api.getSystemStatus?.();
            if (!status?.initialized || !status.enabled) {
                return;
            }
            const flows = api.getFlowInfo();
            const intro = flows.find((flow) => flow.id === KIBITZ_INTRO_FLOW);
            if (intro?.visible && !isStacked) {
                // Dynamic Help waits at steps without a target. Advance past the portrait step.
                roomSwitcherTarget?.used();
            }
            const variation = flows.find((flow) => flow.id === KIBITZ_VARIATION_FLOW);
            if (
                intro &&
                !intro.visible &&
                showingVariation &&
                variationTarget?.active() &&
                variation &&
                !variation.seen &&
                !variation.visible
            ) {
                api.triggerFlow(KIBITZ_VARIATION_FLOW);
            }
        };
        maybeShow();
        const interval = window.setInterval(maybeShow, 500);
        return () => window.clearInterval(interval);
    }, [api, isStacked, roomSwitcherTarget, showingVariation, variationTarget]);

    return {
        roomRef: roomTarget?.ref,
        roomSwitcherRef: roomSwitcherTarget?.ref,
        acknowledgeRoomSwitcher,
        variationRef: variationTarget?.ref,
    };
}
