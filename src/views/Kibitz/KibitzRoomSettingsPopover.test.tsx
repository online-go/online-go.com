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
    it("renders the streamer mode toggle on desktop", () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                isMobileLayout={false}
                streamerMode={false}
                onStreamerModeChange={jest.fn()}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        expect(screen.getByText("Display")).toBeInTheDocument();
        expect(screen.getByText("Streamer mode")).toBeInTheDocument();
    });

    it("calls onStreamerModeChange when the checkbox is toggled on and off", () => {
        const onStreamerModeChange = jest.fn();

        const { rerender } = render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                isMobileLayout={false}
                streamerMode={false}
                onStreamerModeChange={onStreamerModeChange}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        fireEvent.click(screen.getByRole("checkbox"));
        expect(onStreamerModeChange).toHaveBeenCalledWith(true);

        rerender(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                isMobileLayout={false}
                streamerMode={true}
                onStreamerModeChange={onStreamerModeChange}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        fireEvent.click(screen.getByRole("checkbox"));
        expect(onStreamerModeChange).toHaveBeenCalledWith(false);
    });

    it("hides the streamer mode toggle on mobile", () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                isMobileLayout={true}
                streamerMode={false}
                onStreamerModeChange={jest.fn()}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        expect(screen.queryByText("Display")).toBeNull();
        expect(screen.queryByText("Streamer mode")).toBeNull();
    });

    it("shows display settings for viewers but not room management actions", () => {
        render(
            <KibitzRoomSettingsPopover
                room={makeRoom()}
                canEditRoom={false}
                canDeleteRoom={false}
                canChangeBoard={false}
                isMobileLayout={false}
                streamerMode={false}
                onStreamerModeChange={jest.fn()}
                onClose={jest.fn()}
                onRequestChangeBoard={jest.fn()}
                onDeleteRoom={async () => false}
                onSaveRoomDetails={async () => false}
            />,
        );

        expect(screen.getByText("Display")).toBeInTheDocument();
        expect(screen.getByText("Streamer mode")).toBeInTheDocument();
        expect(screen.queryByText("Edit room details")).toBeNull();
        expect(screen.queryByText("Change live game")).toBeNull();
        expect(screen.queryByText("Delete")).toBeNull();
    });
});
