/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: jest.fn(() => null),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
}));

jest.mock("./kibitzAnalysisPolicyText", () => ({
    __esModule: true,
    getKibitzRoomLockedLabel: jest.fn(() => "Locked for players"),
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

        expect(screen.getByText("Preset")).toHaveClass("preset-label");
        expect(container.querySelector(".room-subtitle")).toHaveTextContent(
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

        expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Sign in to create room" })).toBeNull();
    });
});
