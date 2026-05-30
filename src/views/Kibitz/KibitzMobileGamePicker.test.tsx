/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { KibitzMobileGamePicker } from "./KibitzMobileGamePicker";
import { get } from "@/lib/requests";

jest.mock("./KibitzBoard", () => ({
    __esModule: true,
    KibitzBoard: () => <div data-testid="KibitzBoard" />,
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => <div data-testid="KibitzUserAvatar" />,
}));

jest.mock("@/components/ObserveGamesComponent", () => ({
    __esModule: true,
    ObserveGamesComponent: ({ onSelectGameId }: { onSelectGameId: (gameId: number) => void }) => (
        <div data-testid="ObserveGamesComponent">
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

function makeGameDetails() {
    return {
        id: 1234,
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
            moves: [],
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
        mockedGet.mockResolvedValue(makeGameDetails());
        const onCreateRoom = jest.fn(() => Promise.resolve("room-2"));

        render(
            <KibitzMobileGamePicker
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

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
        });
    });
});
