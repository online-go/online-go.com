import * as React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import * as ogs_hooks from "hooks";

import { OgsHelpProvider } from "OgsHelpProvider";

import * as requests from "requests";
import { OnlineLeaguePlayerLanding } from "./OnlineLeaguePlayerLanding";

// This thing has a TabCompleteInput in it that doesn't work under jest
jest.mock("../../../src/components/Chat", () => {
    return {
        EmbeddedChatCard: jest.fn(() => {
            return <div className="EmbeddedChatCardMock" />;
        }),
    };
});

const TEST_USER = {
    username: "testuser",
    anonymous: false,
    id: 0,
    registration_date: "",
    ratings: undefined,
    country: "",
    professional: false,
    ranking: 0,
    provisional: 0,
    can_create_tournaments: false,
    is_moderator: false,
    is_superuser: false,
    is_tournament_moderator: false,
    supporter: false,
    supporter_level: 0,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: "",
    is_announcer: false,
} as const;

/*
const UNSTARTED_MATCH = {
    id: 1,
    name: "Test Match 2",
    league: "TL",
    player_key: "blackmatchid",
    side: "black",
    started: false,
    game: 0, // pk
    black_ready: false,
    white_ready: false,
} as const;
*/

jest.mock("requests");

describe("COOL Player landing tests", () => {
    test("logged out player arrival", async () => {
        const user = { ...TEST_USER, anonymous: true };
        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(user);

        (requests.get as jest.MockedFunction<typeof requests.get>).mockImplementation(
            (url: string) => {
                console.log(url);
                return new Promise((resolve) => {
                    resolve({
                        data: "foo",
                    });
                });
            },
        );

        //let res: ReturnType<typeof render>;
        await act(async () => {
            render(
                <OgsHelpProvider>
                    <MemoryRouter
                        initialEntries={["/online-league/league-player?side=black&id=testid"]}
                    >
                        <Routes>
                            <Route
                                path="/online-league/league-player"
                                element={<OnlineLeaguePlayerLanding />}
                            />
                        </Routes>
                    </MemoryRouter>
                </OgsHelpProvider>,
            );
        });

        expect(screen.getByText("Welcome to OGS!")).toBeDefined();
    });

    test("logged in player arrival", async () => {
        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(TEST_USER);
        // data.set("user", TEST_USER);

        (requests.get as jest.MockedFunction<typeof requests.get>).mockImplementation(
            (url: string) => {
                console.log(url);
                return new Promise((resolve) => {
                    resolve({
                        data: "foo",
                    });
                });
            },
        );

        let res: ReturnType<typeof render>;
        await act(async () => {
            res = render(
                <OgsHelpProvider>
                    <MemoryRouter
                        initialEntries={["/online-league/league-player?side=black&id=testid"]}
                    >
                        <Routes>
                            <Route
                                path="/online-league/league-player"
                                element={<OnlineLeaguePlayerLanding />}
                            />
                        </Routes>
                    </MemoryRouter>
                </OgsHelpProvider>,
            );
        });

        const { container } = res;
        expect(container.children).toHaveLength(1);
    });
});
