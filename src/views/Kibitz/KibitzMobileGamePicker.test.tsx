/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { KibitzMobileGamePicker } from "./KibitzMobileGamePicker";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import type { KibitzRoomSummary } from "@/models/kibitz";
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

describe("KibitzMobileGamePicker", () => {
    beforeEach(() => {
        mockedGet.mockReset();
        installMatchMedia(true);
    });

    it("keeps the current game in the detached snapshot map while pending", () => {
        const currentRoom = {
            id: "room-1",
            current_game: { game_id: 123 },
        } as unknown as KibitzRoomSummary;

        render(
            <KibitzMobileGamePicker
                mode="create-room"
                rooms={[]}
                currentRoom={currentRoom}
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

    it("shows a login-required state for anonymous create-room direct entry", () => {
        render(
            <KibitzMobileGamePicker
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

    it("renders the normal create flow for logged-in users", async () => {
        mockedGet.mockResolvedValue(makeGameDetails(1234, [{ x: 3, y: 4 }]));
        const onCreateRoom = jest.fn(() => Promise.resolve("room-2"));
        const currentRoom = {
            id: "room-1",
            current_game: { game_id: 123 },
        } as unknown as KibitzRoomSummary;
        const currentGameBaseSnapshot = {
            gameId: 123,
            config: {
                game_id: 123,
                move_tree: { id: "official-tree" },
            },
        } as unknown as KibitzCurrentGameBaseSnapshot;

        render(
            <KibitzMobileGamePicker
                mode="create-room"
                rooms={[]}
                currentRoom={currentRoom}
                currentGameBaseSnapshot={currentGameBaseSnapshot}
                canOpenCreateRoomFlow={true}
                signInHref="/sign-in#/kibitz"
                onClose={jest.fn()}
                onCreateRoom={onCreateRoom}
                onChangeBoard={jest.fn()}
                onJoinRoom={jest.fn()}
            />,
        );

        const picker = screen.getByTestId("ObserveGamesComponent");
        expect(picker).toHaveAttribute("data-current-game-id", "123");
        expect(picker).toHaveAttribute("data-snapshot-game-id", "undefined");
        expect(picker).toHaveAttribute("data-snapshot-move-tree-id", "official-tree");
        expect(picker).toHaveAttribute("data-snapshot-ready", "true");

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
        });
    });

    it("moves to the mobile preview with the selected game's detached move tree", async () => {
        mockedGet.mockResolvedValue(
            makeGameDetails(1234, [
                { x: 3, y: 4 },
                { x: 15, y: 14 },
            ]),
        );

        render(
            <KibitzMobileGamePicker
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

        fireEvent.click(screen.getByRole("button", { name: "Select game" }));

        const board = await screen.findByTestId("KibitzBoard");
        expect(board).toHaveAttribute("data-role", "preview");
        expect(board).toHaveAttribute("data-game-id", "1234");
        expect(board).toHaveAttribute("data-move-tree-present", "true");
        expect(board).toHaveAttribute("data-move-path");
        expect(board).toHaveAttribute("data-restore-to-official-tail", "true");
        expect(board).toHaveAttribute("data-connect-to-game", "undefined");
    });
});
