/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: () => null,
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => null,
}));

jest.mock("@/lib/player_cache", () => ({
    __esModule: true,
    fetch: jest.fn(),
    lookup: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    pgettext: jest.fn((_: string, text: string) => text),
}));

function makeRoom(overrides?: Partial<KibitzRoomSummary>): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "channel-1",
        title: "Room 1",
        kind: "user",
        viewer_count: 12,
        ...overrides,
    };
}

describe("KibitzRoomSettingsPopover", () => {
    it("shows no room management actions for a viewer without permissions", () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        expect(screen.getByText("You do not have room management access yet.")).toBeInTheDocument();
        expect(screen.queryByText("Edit room details")).toBeNull();
        expect(screen.queryByText("Change live game")).toBeNull();
        expect(screen.queryByText("Delete")).toBeNull();
    });

    it("offers the management actions the permissions allow", () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={true}
                canDeleteRoom={true}
                canChangeBoard={true}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        expect(screen.getByText("Edit room details")).toBeInTheDocument();
        expect(screen.getByText("Change live game")).toBeInTheDocument();
        expect(screen.queryByText("You do not have room management access yet.")).toBeNull();
    });

    it("says why when the server refuses the room details as offensive", async () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                initialView="edit-details"
                canEditRoom={true}
                canDeleteRoom={false}
                canChangeBoard={false}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={() => Promise.reject({ errcode: "kibitzroom_offensive" })}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(
            await screen.findByText(
                "Sorry, that room title or description is not allowed. Please choose a different one.",
            ),
        ).toBeInTheDocument();
    });

    it("says why when the server refuses the room name as already used", async () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                initialView="edit-details"
                canEditRoom={true}
                canDeleteRoom={false}
                canChangeBoard={false}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={() => Promise.reject({ errcode: "kibitzroom_title_taken" })}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(
            await screen.findByText(
                "A room with that name already exists. Please choose another name.",
            ),
        ).toBeInTheDocument();
    });
});
