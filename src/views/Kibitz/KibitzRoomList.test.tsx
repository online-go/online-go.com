/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
    npgettext: jest.fn((_: string, singular: string, plural: string, count: number) =>
        count === 1 ? singular : plural,
    ),
}));

jest.mock("./kibitzAnalysisPolicyText", () => ({
    __esModule: true,
    getKibitzRoomLockedTooltip: jest.fn(() => "Locked for players while the game is live."),
}));

function makeRoom(overrides?: Partial<KibitzRoomSummary>): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "channel-1",
        title: "Room 1",
        kind: "user",
        viewer_count: 12,
        description: "Room description",
        ...overrides,
    };
}

describe("KibitzRoomList", () => {
    it("labels room groups and preserves room selection and order within each group", () => {
        const onSelectRoom = jest.fn();
        render(
            <KibitzRoomList
                rooms={[
                    makeRoom({ id: "preset-high", title: "High-ranked game", kind: "preset" }),
                    makeRoom({ id: "preset-extra", title: "Extra preset", kind: "preset" }),
                    makeRoom({ id: "user-busy", title: "Busy room", viewer_count: 20 }),
                    makeRoom({ id: "user-quiet", title: "Quiet room", viewer_count: 2 }),
                ]}
                activeRoomId="user-busy"
                onSelectRoom={onSelectRoom}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                blockedRoomIds={new Set(["user-quiet"])}
            />,
        );

        const presets = screen.getByRole("region", { name: "Preset rooms" });
        const users = screen.getByRole("region", { name: "User rooms" });
        expect(
            within(presets)
                .getAllByRole("button")
                .map((button) => button.textContent),
        ).toEqual(["High-ranked game12", "Extra preset12"]);
        expect(
            within(users)
                .getAllByRole("button")
                .map((button) => button.textContent),
        ).toEqual(["Busy room20", "Quiet room2"]);
        expect(within(users).getByRole("button", { name: "Busy room, 20 spectators" })).toHaveClass(
            "active",
        );
        expect(
            within(users).getByRole("button", { name: "Quiet room, 2 spectators" }),
        ).toBeDisabled();
        fireEvent.click(
            within(presets).getByRole("button", { name: "Extra preset, 12 spectators" }),
        );
        expect(onSelectRoom).toHaveBeenCalledWith("preset-extra");
    });

    it("labels the count column once and announces singular and plural spectator counts", () => {
        const { container } = render(
            <KibitzRoomList
                rooms={[
                    makeRoom({ id: "preset", kind: "preset", title: "Preset", viewer_count: 0 }),
                    makeRoom({ id: "one", title: "One", viewer_count: 1 }),
                    makeRoom({ id: "many", title: "Many", viewer_count: 42 }),
                ]}
                activeRoomId="preset"
                onSelectRoom={jest.fn()}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
            />,
        );
        expect(screen.getAllByRole("img", { name: "Spectators" })).toHaveLength(1);
        expect(container.querySelectorAll(".KibitzRoomList-item .fa-user")).toHaveLength(0);
        expect(screen.getByRole("button", { name: "Preset, 0 spectators" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "One, 1 spectator" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Many, 42 spectators" })).toBeInTheDocument();
    });

    it("omits empty groups as the directory changes", () => {
        const props = {
            activeRoomId: "room-1",
            onSelectRoom: jest.fn(),
            canOpenCreateRoomFlow: true,
            signInHref: "/sign-in#/kibitz",
        };
        const { rerender } = render(
            <KibitzRoomList {...props} rooms={[makeRoom({ kind: "preset" })]} />,
        );
        expect(screen.getAllByRole("region")).toHaveLength(1);
        expect(screen.queryByRole("heading", { name: "User rooms" })).toBeNull();

        rerender(<KibitzRoomList {...props} rooms={[makeRoom()]} />);
        expect(screen.getAllByRole("region")).toHaveLength(1);
        expect(screen.queryByRole("heading", { name: "Preset rooms" })).toBeNull();

        rerender(<KibitzRoomList {...props} rooms={[]} />);
        expect(screen.queryByRole("region")).toBeNull();
    });

    it("does not label broadcasts as user rooms", () => {
        render(
            <KibitzRoomList
                rooms={[makeRoom({ kind: "broadcast" })]}
                activeRoomId="room-1"
                onSelectRoom={jest.fn()}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
            />,
        );
        expect(screen.getByRole("region", { name: "Other rooms" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "User rooms" })).toBeNull();
    });

    it("shows a preset badge on preset rooms", () => {
        const { container } = render(
            <KibitzRoomList
                rooms={[makeRoom({ kind: "preset" }), makeRoom({ id: "room-2", title: "Room 2" })]}
                activeRoomId="room-1"
                onSelectRoom={jest.fn()}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
            />,
        );

        expect(container.querySelector(".KibitzRoomList-item")).toHaveAttribute(
            "title",
            "Preset · Room description",
        );
    });

    it("does not show a preset badge on non-preset rooms", () => {
        render(
            <KibitzRoomList
                rooms={[makeRoom({ kind: "user" }), makeRoom({ id: "room-2", title: "Room 2" })]}
                activeRoomId="room-1"
                onSelectRoom={jest.fn()}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
            />,
        );

        expect(screen.queryByText("Preset")).toBeNull();
    });

    it("shows login copy instead of create copy for anonymous users", () => {
        render(
            <KibitzRoomList
                rooms={[makeRoom()]}
                activeRoomId="room-1"
                onSelectRoom={jest.fn()}
                onCreateRoom={jest.fn()}
                canOpenCreateRoomFlow={false}
                signInHref="/sign-in#/kibitz"
            />,
        );

        expect(screen.getByRole("link", { name: "Sign in to create room" })).toHaveAttribute(
            "href",
            "/sign-in#/kibitz",
        );
        expect(screen.queryByRole("button", { name: "Create room" })).toBeNull();
    });

    it("shows create copy for logged-in users", () => {
        render(
            <KibitzRoomList
                rooms={[makeRoom()]}
                activeRoomId="room-1"
                onSelectRoom={jest.fn()}
                onCreateRoom={jest.fn()}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
            />,
        );

        expect(screen.getByRole("button", { name: "Room" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Sign in to create room" })).toBeNull();
    });
});
