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
import { act, cleanup, renderHook } from "@testing-library/react";
import * as data from "./data";
import { useData } from "./hooks";

jest.mock("@/lib/bots", () => ({ bots_list: () => [], bot_event_emitter: {} }));

const key = "appeals.banned_user_id";

afterEach(() => {
    cleanup();
    data.remove(key);
    data.remove("theme");
    jest.restoreAllMocks();
});

test("mounting readers cannot erase a suspension received before effects subscribe", () => {
    const { result } = renderHook(() => {
        const first = useData(key);
        const second = useData(key);
        React.useLayoutEffect(() => {
            data.set(key, 7211);
        }, []);
        return [first[0], second[0]];
    });
    expect(data.get(key)).toBe(7211);
    expect(result.current).toEqual([7211, 7211]);
});

test("an update during commit supersedes the render snapshot", () => {
    data.set(key, 1);
    const { result, rerender } = renderHook(
        ({ value }) => {
            const state = useData(key);
            React.useLayoutEffect(() => {
                data.set(key, value);
            }, [value]);
            return state[0];
        },
        { initialProps: { value: 1 } },
    );
    act(() => data.set(key, 2));
    rerender({ value: 3 });
    expect(data.get(key)).toBe(3);
    expect(result.current).toBe(3);
});

test("reading an existing value does not publish another write", () => {
    data.set(key, 1);
    const write = jest.spyOn(data, "set");
    renderHook(() => useData(key));
    expect(write).not.toHaveBeenCalled();
});

test("both consumers see explicit and functional setter updates", () => {
    data.set(key, 1);
    const { result } = renderHook(() => [useData(key), useData(key)]);
    act(() => {
        result.current[0][1]((value) => (value ?? 0) + 1);
        result.current[1][1]((value) => (value ?? 0) + 1);
    });
    expect(data.get(key)).toBe(3);
    expect(result.current.map(([value]) => value)).toEqual([3, 3]);
    act(() => result.current[0][1](8));
    expect(result.current.map(([value]) => value)).toEqual([8, 8]);
});

test("removing a value updates all readers", () => {
    data.set(key, 1);
    const { result } = renderHook(() => [useData(key)[0], useData(key)[0]]);
    act(() => data.remove(key));
    expect(result.current).toEqual([undefined, undefined]);
});

test("the default is a fallback until explicitly set", () => {
    const { result } = renderHook(() => useData("theme", "system"));
    expect(result.current[0]).toBe("system");
    expect(data.get("theme")).toBeUndefined();
    act(() => result.current[1]("dark"));
    expect(data.get("theme")).toBe("dark");
    act(() => data.remove("theme"));
    expect(result.current[0]).toBe("system");
});

test("switching keys reads and subscribes to the new key", () => {
    data.set(key, 1);
    data.set("theme", "dark");
    const { result, rerender } = renderHook(
        ({ selected }: { selected: typeof key | "theme" }) => useData(selected)[0],
        {
            initialProps: { selected: key },
        },
    );
    rerender({ selected: "theme" });
    expect(result.current).toBe("dark");
    act(() => data.set(key, 2));
    expect(result.current).toBe("dark");
    act(() => data.set("theme", "light"));
    expect(result.current).toBe("light");
});

test("StrictMode remounts do not erase updates or leave subscriptions behind", () => {
    const watch = jest.spyOn(data, "watch");
    const unwatch = jest.spyOn(data, "unwatch");
    const { result, unmount } = renderHook(
        () => {
            const state = useData(key);
            React.useLayoutEffect(() => {
                data.set(key, 7211);
            }, []);
            return state[0];
        },
        { wrapper: React.StrictMode },
    );
    expect(result.current).toBe(7211);
    expect(data.get(key)).toBe(7211);
    unmount();
    expect(unwatch).toHaveBeenCalledTimes(watch.mock.calls.length);
});
