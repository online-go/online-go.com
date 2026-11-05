/*
 * Copyright (C)  Online-Go.com
 * Licensed under the GNU Affero General Public License.
 */
import * as React from "react";
import * as DynamicHelp from "react-dynamic-help";
import {
    KIBITZ_INTRO_FLOW,
    KIBITZ_ROOM_TARGET,
    KIBITZ_VARIATION_FLOW,
    KIBITZ_VARIATION_TARGET,
} from "./KibitzHelpFlows";

export function useKibitzHelp(showingVariation: boolean): {
    roomRef: React.RefCallback<HTMLDivElement> | undefined;
    variationRef: React.RefCallback<HTMLDivElement> | undefined;
} {
    const api = React.useContext(DynamicHelp.Api);
    const roomTarget = api.registerTargetItem?.(KIBITZ_ROOM_TARGET);
    const variationTarget = api.registerTargetItem?.(KIBITZ_VARIATION_TARGET);

    React.useEffect(() => {
        if (!showingVariation) {
            return;
        }
        const maybeShow = () => {
            const status = api.getSystemStatus?.();
            if (!status?.initialized || !status.enabled || !variationTarget?.active()) {
                return;
            }
            const flows = api.getFlowInfo();
            const intro = flows.find((flow) => flow.id === KIBITZ_INTRO_FLOW);
            const variation = flows.find((flow) => flow.id === KIBITZ_VARIATION_FLOW);
            if (intro && !intro.visible && variation && !variation.seen && !variation.visible) {
                api.triggerFlow(KIBITZ_VARIATION_FLOW);
            }
        };
        maybeShow();
        const interval = window.setInterval(maybeShow, 500);
        return () => window.clearInterval(interval);
    }, [api, showingVariation, variationTarget]);

    return { roomRef: roomTarget?.ref, variationRef: variationTarget?.ref };
}
