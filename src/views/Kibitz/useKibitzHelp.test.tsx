/*
 * Copyright (C)  Online-Go.com
 * Licensed under the GNU Affero General Public License.
 */
import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import * as DynamicHelp from "react-dynamic-help";
import { useKibitzHelp } from "./useKibitzHelp";
import {
    KIBITZ_INTRO_FLOW,
    KIBITZ_ROOM_SWITCHER_TARGET,
    KIBITZ_VARIATION_FLOW,
} from "./KibitzHelpFlows";

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
    const { rerender, unmount } = renderHook(({ showing }) => useKibitzHelp(true, showing), {
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

test("advances past the room-switcher help only outside portrait", () => {
    jest.useFakeTimers();
    const intro = { id: KIBITZ_INTRO_FLOW, description: "", seen: false, visible: true };
    const skipSwitcher = jest.fn();
    const switcherRef = jest.fn();
    const api = {
        registerTargetItem: (id: string) =>
            id === KIBITZ_ROOM_SWITCHER_TARGET
                ? { ref: switcherRef, used: skipSwitcher }
                : undefined,
        getSystemStatus: () => ({ enabled: true, initialized: true }),
        getFlowInfo: () => [intro],
    } as unknown as DynamicHelp.AppApi;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DynamicHelp.Api.Provider value={api}>{children}</DynamicHelp.Api.Provider>
    );
    const { result, rerender, unmount } = renderHook(
        ({ isStacked }) => useKibitzHelp(isStacked, false),
        { wrapper, initialProps: { isStacked: true } },
    );

    expect(result.current.roomSwitcherRef).toBe(switcherRef);
    act(() => jest.advanceTimersByTime(500));
    expect(skipSwitcher).not.toHaveBeenCalled();

    rerender({ isStacked: false });
    expect(skipSwitcher).toHaveBeenCalledTimes(1);

    intro.visible = false;
    act(() => jest.advanceTimersByTime(500));
    expect(skipSwitcher).toHaveBeenCalledTimes(1);
    unmount();
    jest.useRealTimers();
});
