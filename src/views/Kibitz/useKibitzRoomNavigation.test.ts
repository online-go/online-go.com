/*
 * Copyright (C) Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { act, renderHook } from "@testing-library/react";
import { useKibitzRoomNavigation } from "./useKibitzRoomNavigation";

const mockNavigate = jest.fn();
let mockLocationKey = "initial";
let mockRoomId: string | undefined;

jest.mock("react-router-dom", () => ({
    useLocation: () => ({ key: mockLocationKey }),
    useParams: () => ({ roomId: mockRoomId }),
    useNavigate: () => mockNavigate,
}));

beforeEach(() => {
    mockNavigate.mockClear();
    mockLocationKey = "initial";
    mockRoomId = undefined;
});

test("selects the default room once the directory loads", () => {
    const initialProps: { defaultRoomId: string | null } = { defaultRoomId: null };
    const { rerender } = renderHook(
        ({ defaultRoomId }) => useKibitzRoomNavigation(defaultRoomId, false),
        { initialProps },
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    rerender({ defaultRoomId: "default-room" });
    expect(mockNavigate).toHaveBeenCalledWith("/kibitz/default-room", { replace: true });
});

test("leaves the create-room picker open until it is closed", () => {
    const { rerender } = renderHook(
        ({ creatingRoom }) => useKibitzRoomNavigation("default-room", creatingRoom),
        { initialProps: { creatingRoom: true } },
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    rerender({ creatingRoom: false });
    expect(mockNavigate).toHaveBeenCalledWith("/kibitz/default-room", { replace: true });
});

test("preserves explicit navigation while the picker closes and directory updates", () => {
    const { result, rerender } = renderHook(
        ({ defaultRoomId, creatingRoom }) => useKibitzRoomNavigation(defaultRoomId, creatingRoom),
        { initialProps: { defaultRoomId: "default-room", creatingRoom: true } },
    );
    act(() => result.current("created-room"));
    rerender({ defaultRoomId: "another-default", creatingRoom: false });

    expect(mockNavigate.mock.calls).toEqual([["/kibitz/created-room"]]);
});

test("recovers when a competing navigation commits the same directory URL", () => {
    const { result, rerender } = renderHook(
        ({ creatingRoom }) => useKibitzRoomNavigation("default-room", creatingRoom),
        { initialProps: { creatingRoom: true } },
    );
    act(() => result.current("created-room"));
    rerender({ creatingRoom: false });

    mockLocationKey = "replacement-directory-entry";
    rerender({ creatingRoom: false });

    expect(mockNavigate.mock.calls).toEqual([
        ["/kibitz/created-room"],
        ["/kibitz/default-room", { replace: true }],
    ]);
});

test.each([undefined, "another-room", "requested-room"])(
    "restores the default redirect after navigation settles at %s",
    (settledRoomId) => {
        mockRoomId = "initial-room";
        const { result, rerender } = renderHook(() =>
            useKibitzRoomNavigation("default-room", false),
        );
        expect(mockNavigate).not.toHaveBeenCalled();
        act(() => result.current("requested-room"));

        mockLocationKey = "settled";
        mockRoomId = settledRoomId;
        rerender();
        if (settledRoomId) {
            expect(mockNavigate.mock.calls).toEqual([["/kibitz/requested-room"]]);
            mockLocationKey = "back-to-directory";
            mockRoomId = undefined;
            rerender();
        }

        expect(mockNavigate.mock.calls).toEqual([
            ["/kibitz/requested-room"],
            ["/kibitz/default-room", { replace: true }],
        ]);
    },
);

test("returns to the default room after deleting the selected room", () => {
    mockRoomId = "deleted-room";
    const { result, rerender } = renderHook(() => useKibitzRoomNavigation("default-room", false));
    act(() => result.current(null));
    expect(mockNavigate.mock.calls).toEqual([["/kibitz"]]);

    mockLocationKey = "after-delete";
    mockRoomId = undefined;
    rerender();
    expect(mockNavigate).toHaveBeenLastCalledWith("/kibitz/default-room", { replace: true });
});
