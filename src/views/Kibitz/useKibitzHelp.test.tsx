/*
 * Copyright (C)  Online-Go.com
 * Licensed under the GNU Affero General Public License.
 */
import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import * as DynamicHelp from "react-dynamic-help";
import { useKibitzHelp } from "./useKibitzHelp";
import { KIBITZ_INTRO_FLOW, KIBITZ_VARIATION_FLOW } from "./KibitzHelpFlows";

test("variation help waits for the introduction and stops when the variation closes", () => {
    jest.useFakeTimers();
    const intro = { id: KIBITZ_INTRO_FLOW, description: "", seen: false, visible: true };
    const variation = { id: KIBITZ_VARIATION_FLOW, description: "", seen: false, visible: false };
    const triggerFlow = jest.fn();
    const api = {
        registerTargetItem: () => ({
            ref: () => undefined,
            active: () => true,
            used: () => undefined,
        }),
        getSystemStatus: () => ({ enabled: true, initialized: true }),
        getFlowInfo: () => [intro, variation],
        triggerFlow,
    } as unknown as DynamicHelp.AppApi;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DynamicHelp.Api.Provider value={api}>{children}</DynamicHelp.Api.Provider>
    );
    const { rerender, unmount } = renderHook(({ showing }) => useKibitzHelp(showing), {
        wrapper,
        initialProps: { showing: true },
    });
    expect(triggerFlow).not.toHaveBeenCalled();
    intro.visible = false;
    act(() => jest.advanceTimersByTime(500));
    expect(triggerFlow).toHaveBeenCalledWith(KIBITZ_VARIATION_FLOW);
    variation.seen = true;
    act(() => jest.advanceTimersByTime(500));
    expect(triggerFlow).toHaveBeenCalledTimes(1);
    rerender({ showing: false });
    variation.seen = false;
    act(() => jest.advanceTimersByTime(1000));
    expect(triggerFlow).toHaveBeenCalledTimes(1);
    unmount();
    jest.useRealTimers();
});
