import * as React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as ReactRouterDOM from "react-router-dom";
import { act, render, screen, getByRole, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as ogs_hooks from "hooks";

import { OgsHelpProvider } from "OgsHelpProvider";

import * as requests from "requests";
import { OnlineLeaguePlayerLanding } from "./OnlineLeaguePlayerLanding";

// Test data

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

jest.mock("requests");

// EmbeddedChatCard has a TabCompleteInput in it that doesn't work under jest
// so we have to mock it out from the landing page we're testing
jest.mock("../../../src/components/Chat", () => {
    return {
        EmbeddedChatCard: jest.fn(() => {
            return <div className="EmbeddedChatCardMock" />;
        }),
    };
});

describe("COOL Player landing tests", () => {
    test.only("logged out player arrival", async () => {
        const user = { ...TEST_USER, anonymous: true };
        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(user);

        // The landing page has to ask the back-end about this match, so that it
        // can display the details to the user.
        (requests.get as jest.MockedFunction<typeof requests.get>).mockImplementation(
            (url: string) => {
                expect(url).toEqual("online_league/commence?side=black&id=testid");
                return new Promise((resolve) => {
                    resolve(UNSTARTED_MATCH);
                });
            },
        );

        let rendered: HTMLElement;
        await act(async () => {
            rendered = render(
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
            ).container;
        });

        // There should be a welcome header for not-logged in players
        expect(rendered.querySelector("#cool-player-landing-header")).toBeInTheDocument();
        expect(screen.getByText("Welcome", { exact: false }));

        // The match name and number should be listed
        expect(screen.getByText(UNSTARTED_MATCH.name));
        expect(
            screen.getByText(`${UNSTARTED_MATCH.league} Match ${UNSTARTED_MATCH.id}`, {
                exact: false,
            }),
        );

        // And there should be register and login buttons
        const signIn = getByRole(rendered, "button", { name: "Sign In" });
        expect(signIn).toBeInTheDocument();
        expect(getByRole(rendered, "button", { name: "Register" })).toBeInTheDocument();

        // And the sign in button should take us to the ... sign in page!

        // Create a mock implementation of navigate
        const mockNavigate = jest.fn();

        // Spy on the useNavigate hook and return the mock navigate function
        jest.spyOn(ReactRouterDOM, "useNavigate").mockReturnValue(mockNavigate);

        await act(async () => {
            fireEvent.click(signIn);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/sign-in#/online-league/league-player");
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
