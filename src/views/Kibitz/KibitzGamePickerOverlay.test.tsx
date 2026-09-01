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
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { KibitzRoomSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzGamePickerOverlay } from "./KibitzGamePickerOverlay";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import { get } from "@/lib/requests";

jest.mock("./KibitzBoard", () => ({
    __esModule: true,
    KibitzBoard: (props: {
        role?: string;
        gameId?: number;
        width?: number;
        height?: number;
        moveTree?: unknown;
        movePath?: string;
        restoreToOfficialTailOnLoad?: boolean;
        connectToGame?: boolean;
    }) => (
        <div
            data-testid="KibitzBoard"
            data-role={props.role}
            data-game-id={props.gameId}
            data-width={props.width}
            data-height={props.height}
            data-move-tree-present={String(Boolean(props.moveTree))}
            data-move-path={props.movePath}
            data-restore-to-official-tail={String(props.restoreToOfficialTailOnLoad)}
            data-connect-to-game={String(props.connectToGame)}
        />
    ),
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => <div data-testid="KibitzUserAvatar" />,
}));

jest.mock("@/components/ObserveGamesComponent", () => ({
    __esModule: true,
    ObserveGamesComponent: ({
        onSelectGameId,
        miniGobanProps,
    }: {
        onSelectGameId: (gameId: number) => void;
        miniGobanProps?: {
            miniGobanSnapshotOverrides?: ReadonlyMap<
                number,
                { game_id?: number; move_tree?: { id?: number | string } } | null
            >;
        };
    }) => (
        <div
            data-testid="ObserveGamesComponent"
            data-current-game-id={String(
                miniGobanProps?.miniGobanSnapshotOverrides?.keys().next().value,
            )}
            data-snapshot-game-id={String(
                miniGobanProps?.miniGobanSnapshotOverrides?.values().next().value?.game_id,
            )}
            data-snapshot-move-tree-id={String(
                miniGobanProps?.miniGobanSnapshotOverrides?.values().next().value?.move_tree?.id,
            )}
            data-snapshot-ready={String(
                Boolean(miniGobanProps?.miniGobanSnapshotOverrides?.values().next().value),
            )}
        >
            <button type="button" onClick={() => onSelectGameId(1234)}>
                Select game
            </button>
            <button type="button" onClick={() => onSelectGameId(456)}>
                Select another game
            </button>
        </div>
    ),
}));

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: { username?: string } }) => <span>{user.username}</span>,
}));

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    pgettext: (_: string, text: string) => text,
    current_language: "en",
    moment: {
        duration: (_value: number, _unit: string) => ({
            humanize: () => "time",
        }),
    },
}));

jest.mock("./useCurrentKibitzUser", () => ({
    __esModule: true,
    useCurrentKibitzUser: () => ({
        id: 1,
        username: "tester",
        ranking: 0,
        professional: false,
        ui_class: "",
    }),
}));

jest.mock("./kibitzAnalysisPolicy", () => ({
    __esModule: true,
    getKibitzAccessPolicyForUser: () => ({ allowed: true as const }),
}));

jest.mock("./kibitzAnalysisPolicyText", () => ({
    __esModule: true,
    getKibitzAccessBlockedMessage: () => "blocked",
    getKibitzAnalysisDisabledSpectatorMessage: () => "disabled",
    getKibitzPickerFailedChangeMessage: () => "change failed",
    getKibitzPickerFailedCreateMessage: () => "create failed",
}));

const mockedGet = get as jest.MockedFunction<typeof get>;

function installMatchMedia(matches = false): void {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
            matches,
            media: "",
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

function installRequestAnimationFrame(): void {
    window.requestAnimationFrame = (callback) => {
        queueMicrotask(() => callback(performance.now()));
        return 0;
    };
}

function makeRoom(currentGameId: number): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "room-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 1,
        creator_id: 1,
        current_game: {
            game_id: currentGameId,
            board_size: "19x19",
            title: "Current game",
            black: {
                id: 10,
                username: "black",
                ranking: 0,
                professional: false,
                ui_class: "",
            },
            white: {
                id: 11,
                username: "white",
                ranking: 0,
                professional: false,
                ui_class: "",
            },
            live: true,
            analysis_disabled: false,
        } satisfies KibitzWatchedGame,
    };
}

function makeGameDetails(gameId = 1234, moves: Array<{ x: number; y: number }> = []) {
    return {
        id: gameId,
        width: 19,
        height: 19,
        name: "Selected game",
        ended: false,
        players: {
            black: {
                id: 20,
                username: "alice",
                ranking: 0,
                professional: false,
                ui_class: "",
                country: "un",
                icon: "",
            },
            white: {
                id: 21,
                username: "bob",
                ranking: 0,
                professional: false,
                ui_class: "",
                country: "un",
                icon: "",
            },
        },
        gamedata: {
            moves,
            private: false,
            disable_analysis: false,
        },
    } as unknown as rest_api.GameDetails;
}

describe("KibitzGamePickerOverlay", () => {
    beforeEach(() => {
        mockedGet.mockReset();
        installMatchMedia(false);
        installRequestAnimationFrame();
    });

    it("provides the current game's authoritative snapshot to picker thumbnails", () => {
        const snapshot = {
            gameId: 123,
            roomId: "room-1",
            trunkTailMoveNumber: 4,
            moveTreeId: "official-tree",
            movePath: "abcd",
            source: "main-board",
            config: {
                game_id: 123,
                move_tree: { id: "official-tree" },
            },
        } as unknown as KibitzCurrentGameBaseSnapshot;

        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                currentRoom={makeRoom(123)}
                currentGameBaseSnapshot={snapshot}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        const picker = screen.getByTestId("ObserveGamesComponent");
        expect(picker).toHaveAttribute("data-current-game-id", "123");
        expect(picker).toHaveAttribute("data-snapshot-game-id", "undefined");
        expect(picker).toHaveAttribute("data-snapshot-move-tree-id", "official-tree");
        expect(picker).toHaveAttribute("data-snapshot-ready", "true");
    });

    it("keeps the current game in the detached snapshot map while pending", () => {
        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                currentRoom={makeRoom(123)}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        const picker = screen.getByTestId("ObserveGamesComponent");
        expect(picker).toHaveAttribute("data-current-game-id", "123");
        expect(picker).toHaveAttribute("data-snapshot-ready", "false");
    });

    it("disables create room while the submit request is in flight", async () => {
        mockedGet.mockResolvedValue(makeGameDetails());
        let resolveCreate: ((value: string | null) => void) | undefined;
        const onCreateRoom = jest.fn(
            () =>
                new Promise<string | null>((resolve) => {
                    resolveCreate = resolve;
                }),
        );

        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={onCreateRoom}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));
        expect(await screen.findByRole("button", { name: "Create room" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Create room" }));
        expect(onCreateRoom).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", { name: "Create room" })).toBeDisabled();

        resolveCreate?.("room-2");
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Create room" })).toBeEnabled();
        });
    });

    it("hydrates the desktop selected preview from the resolved game details", async () => {
        mockedGet.mockResolvedValue(
            makeGameDetails(1234, [
                { x: 3, y: 4 },
                { x: 15, y: 14 },
            ]),
        );

        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.change(screen.getByLabelText("Game ID"), { target: { value: "1234" } });
        fireEvent.click(screen.getByRole("button", { name: "Load" }));

        const board = await screen.findByTestId("KibitzBoard");
        expect(board).toHaveAttribute("data-role", "preview");
        expect(board).toHaveAttribute("data-game-id", "1234");
        expect(board).toHaveAttribute("data-width", "19");
        expect(board).toHaveAttribute("data-height", "19");
        expect(board).toHaveAttribute("data-move-tree-present", "true");
        expect(board).toHaveAttribute("data-restore-to-official-tail", "true");
        expect(board).toHaveAttribute("data-connect-to-game", "undefined");
        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith("games/1234");
    });

    it("switches the desktop selected preview to the newly resolved game", async () => {
        mockedGet
            .mockResolvedValueOnce(makeGameDetails(1234, [{ x: 3, y: 4 }]))
            .mockResolvedValueOnce(
                makeGameDetails(456, [
                    { x: 10, y: 10 },
                    { x: 11, y: 11 },
                ]),
            );

        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.change(screen.getByLabelText("Game ID"), { target: { value: "1234" } });
        fireEvent.click(screen.getByRole("button", { name: "Load" }));
        const firstBoard = await screen.findByTestId("KibitzBoard");
        expect(firstBoard).toHaveAttribute("data-game-id", "1234");
        const firstMovePath = firstBoard.getAttribute("data-move-path");
        expect(firstMovePath).not.toBeNull();

        fireEvent.change(screen.getByLabelText("Game ID"), { target: { value: "456" } });
        fireEvent.click(screen.getByRole("button", { name: "Load" }));
        await waitFor(() => {
            expect(screen.getByTestId("KibitzBoard")).toHaveAttribute("data-game-id", "456");
        });
        expect(mockedGet).toHaveBeenCalledTimes(2);
        const secondBoard = screen.getByTestId("KibitzBoard");
        expect(secondBoard).toHaveAttribute("data-move-tree-present", "true");
        expect(secondBoard.getAttribute("data-move-path")).not.toBe(firstMovePath);
    });

    it("disables change board while the submit request is in flight", async () => {
        mockedGet.mockResolvedValue(makeGameDetails());
        let resolveChange: ((value: boolean) => void) | undefined;
        const onClose = jest.fn();
        const onChangeBoard = jest.fn(
            () =>
                new Promise<boolean>((resolve) => {
                    resolveChange = resolve;
                }),
        );

        render(
            <KibitzGamePickerOverlay
                mode="change-board"
                rooms={[]}
                currentRoom={makeRoom(1)}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={onClose}
                onCreateRoom={jest.fn()}
                onChangeBoard={onChangeBoard}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));
        expect(await screen.findByRole("button", { name: "Change board" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Change board" }));
        expect(screen.getByRole("button", { name: "Change board" })).toBeDisabled();

        await waitFor(() => {
            expect(onChangeBoard).toHaveBeenCalledTimes(1);
        });

        resolveChange?.(true);
        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("defers board change until after the picker teardown gate", async () => {
        mockedGet.mockResolvedValue(makeGameDetails());
        let resolveChange: ((value: boolean) => void) | undefined;
        const onChangeBoard = jest.fn(
            () =>
                new Promise<boolean>((resolve) => {
                    resolveChange = resolve;
                }),
        );

        render(
            <KibitzGamePickerOverlay
                mode="change-board"
                rooms={[]}
                currentRoom={makeRoom(1)}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={onChangeBoard}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));
        expect(await screen.findByRole("button", { name: "Change board" })).toBeEnabled();
        expect(screen.getByTestId("ObserveGamesComponent")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Change board" }));

        expect(onChangeBoard).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(onChangeBoard).toHaveBeenCalledTimes(1);
        });

        resolveChange?.(true);
    });

    it("restores picker previews if changing board fails", async () => {
        mockedGet.mockResolvedValue(makeGameDetails());
        const onChangeBoard = jest.fn(() => Promise.resolve(false));

        render(
            <KibitzGamePickerOverlay
                mode="change-board"
                rooms={[]}
                currentRoom={makeRoom(1)}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={onChangeBoard}
                onJoinRoom={jest.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));
        expect(await screen.findByRole("button", { name: "Change board" })).toBeEnabled();
        expect(screen.getByTestId("ObserveGamesComponent")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Change board" }));

        await waitFor(() => {
            expect(onChangeBoard).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.getAllByText("change failed")).toHaveLength(2);
        });
    });

    it("shows a login-required state for anonymous create-room direct entry", () => {
        render(
            <KibitzGamePickerOverlay
                mode="create-room"
                rooms={[]}
                canOpenCreateRoomFlow={false}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={jest.fn()}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        expect(screen.getByText("Sign in to create a room")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
            "href",
            "/sign-in#/kibitz",
        );
        expect(screen.queryByRole("button", { name: "Create room" })).toBeNull();
    });
});
