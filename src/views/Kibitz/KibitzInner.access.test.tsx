/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { EventEmitter } from "eventemitter3";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { KibitzController } from "./KibitzController";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { KibitzInner } from "./KibitzInner";

jest.mock("./useCurrentKibitzUser", () => ({
    useCurrentKibitzUser: () => ({ id: 1, anonymous: false }),
}));
jest.mock("./useKibitzGobans", () => ({
    useKibitzGobans: () => ({
        main: null,
        secondary: null,
        center: null,
        playerBars: null,
        centerMode: "main",
        isDraftDirty: () => false,
    }),
}));
jest.mock("./useKibitzCurrentGameConnectionKeeper", () => ({
    useKibitzCurrentGameConnectionKeeper: jest.fn(),
}));
jest.mock("@/components/GobanView/layout", () => ({
    useGameLayout: () => ({ mode: "wide" }),
    leftAsideAllowed: () => true,
}));
jest.mock("./KibitzView", () => ({ KibitzView: () => "Room view" }));
jest.mock("./kibitzTelemetry", () => ({
    kibitzTelemetry: { setLayout: jest.fn(), record: jest.fn() },
}));

function makeController(rooms: KibitzRoomSummary[] = []) {
    return Object.assign(new EventEmitter(), {
        rooms,
        active_room: null,
        stream: [],
        proposals: [],
        variations: [],
        secondary_pane: { collapsed: true },
        permissions: {},
        access_blocked: null,
        getCachedGame: jest.fn(),
        ensureGamesCached: jest.fn(),
        selectRoom: jest.fn(),
        setAccessBlocked: jest.fn(),
    }) as unknown as KibitzController;
}

function renderPage(controller: KibitzController, path = "/kibitz") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/kibitz/:roomId?" element={<KibitzInner controller={controller} />} />
            </Routes>
        </MemoryRouter>,
    );
}

test("the directory without a selected room does not show a player block", () => {
    renderPage(makeController());
    expect(screen.queryByText(/You can't stay in/)).toBeNull();
    expect(
        screen.getByText("Create a Kibitz room to start watching a game with friends."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Room" })).toBeEnabled();
});

function makeAccessRooms(): KibitzRoomSummary[] {
    return [
        {
            id: "own",
            channel: "kibitz-own",
            title: "Own game",
            kind: "user",
            viewer_count: 1,
            current_game: {
                game_id: 42,
                board_size: "19x19",
                title: "Own game",
                live: true,
                black: { id: 1, username: "Me", ranking: 0, professional: false, ui_class: "" },
                white: {
                    id: 2,
                    username: "Opponent",
                    ranking: 0,
                    professional: false,
                    ui_class: "",
                },
            },
        },
        {
            id: "other",
            channel: "kibitz-other",
            title: "Other room",
            kind: "user",
            viewer_count: 1,
        },
    ];
}

test("an actual own-game block leaves other rooms available", async () => {
    const controller = makeController(makeAccessRooms());
    renderPage(controller, "/kibitz/own");
    expect(screen.getByText(/You can't stay in "Own game"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Own game 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Other room 1" }));
    await waitFor(() => expect(controller.selectRoom).toHaveBeenCalledWith("other"));
    expect(screen.queryByText(/You can't stay in/)).toBeNull();
});

test("opening Kibitz skips a blocked first room", async () => {
    const controller = makeController(makeAccessRooms());
    renderPage(controller);
    await waitFor(() => expect(controller.selectRoom).toHaveBeenCalledWith("other"));
    expect(controller.selectRoom).not.toHaveBeenCalledWith("own");
    expect(controller.setAccessBlocked).not.toHaveBeenCalled();
    expect(screen.queryByText(/You can't stay in/)).toBeNull();
});

test("opening Kibitz keeps the first room when it is accessible", async () => {
    const rooms = makeAccessRooms();
    rooms.reverse();
    const controller = makeController(rooms);
    renderPage(controller);
    await waitFor(() => expect(controller.selectRoom).toHaveBeenCalledWith("other"));
});

test("opening Kibitz with only blocked rooms shows the directory without joining", () => {
    const controller = makeController(makeAccessRooms().slice(0, 1));
    renderPage(controller);
    expect(screen.getByText("No rooms are available to join right now.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Own game 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Room" })).toBeEnabled();
    expect(controller.selectRoom).not.toHaveBeenCalled();
    expect(controller.setAccessBlocked).not.toHaveBeenCalled();
    expect(screen.queryByText(/You can't stay in/)).toBeNull();
});
