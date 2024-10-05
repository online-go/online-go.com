/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */
import * as React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { act, render, screen, getByRole, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as ogs_hooks from "@/lib/hooks";

import { OgsHelpProvider } from "@/components/OgsHelpProvider";

import * as requests from "@/lib/requests";
import * as data from "@/lib/data";

import { uiPushActions } from "../../components/UIPush/MockUIPush";

import { OnlineLeaguePlayerLanding } from "./OnlineLeaguePlayerLanding";

/* cspell: disable */

// Test data

const TEST_USER = {
    username: "testuser",
    anonymous: false,
    id: 0,
    registration_date: "",
    ratings: {
        version: 5,
        overall: {
            rating: 1500,
            deviation: 350,
            volatility: 0.006,
        },
    },
    country: "",
    professional: false,
    ranking: 0,
    provisional: 0,
    can_create_tournaments: false,
    is_moderator: false,
    is_superuser: false,
    is_tournament_moderator: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    supporter: false,
    supporter_level: 0,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: "",
    is_announcer: false,
    last_supporter_trial: "",
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

// Mocks

// mock backend calls
jest.mock("requests");

// mock useNavigate, so we can test login buttons etc
const mockedUseNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as any),
    useNavigate: () => mockedUseNavigate,
}));

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
    test("logged out player arrival", async () => {
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

        let rendered: HTMLElement | undefined;
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
        rendered = rendered as HTMLElement;

        // There should be a welcome header for not-logged in players
        expect(rendered?.querySelector("#cool-player-landing-header"))
            .toBeInTheDocument()
            .toHaveTextContent("Welcome");

        // The match name and number should be listed
        expect(screen.getByText(UNSTARTED_MATCH.name));
        expect(
            screen.getByText(`${UNSTARTED_MATCH.league} Match ${UNSTARTED_MATCH.id}`, {
                exact: false,
            }),
        );

        // And there should be register and login buttons
        const signInButton = getByRole(rendered, "button", { name: "Sign In" });
        const registerButton = getByRole(rendered, "button", { name: "Register" });
        expect(signInButton).toBeInTheDocument();
        expect(registerButton).toBeInTheDocument();

        // The sign in button should try to navigate to the sign in page
        // with a # return URL

        await act(async () => {
            fireEvent.click(signInButton);
        });
        expect(mockedUseNavigate).toHaveBeenCalledWith(
            "/sign-in#/online-league/league-player",
            expect.anything(),
        );

        // The register button should try to navigate to the register page
        // with a # return URL

        await act(async () => {
            fireEvent.click(registerButton);
        });
        expect(mockedUseNavigate).toHaveBeenCalledWith(
            "/register#/online-league/league-player",
            expect.anything(),
        );
    });

    test("logged in player arrival", async () => {
        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(TEST_USER);

        // we have to clear this, because it's left over from other tests :S
        data.set("pending_league_match", undefined);

        // Landing page hits back-end to find out match status
        (requests.get as jest.MockedFunction<typeof requests.get>).mockImplementation(
            (url: string) => {
                expect(url).toEqual("online_league/commence?side=black&id=testid");
                return new Promise((resolve) => {
                    resolve(UNSTARTED_MATCH);
                });
            },
        );

        let rendered: HTMLElement | undefined;
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
        rendered = rendered as HTMLElement;

        // There should not be a "welcome" header for logged in players
        expect(rendered.querySelector("#cool-player-landing-header"))
            .toBeInTheDocument()
            .toHaveTextContent(/^$/);

        // The match name and number should be listed
        expect(screen.getByText(UNSTARTED_MATCH.name));
        expect(
            screen.getByText(`${UNSTARTED_MATCH.league} Match ${UNSTARTED_MATCH.id}`, {
                exact: false,
            }),
        );

        // There should be the I'm Ready button
        const imReadyButton = getByRole(rendered, "button", { name: "I'm Ready" });
        expect(imReadyButton).toBeInTheDocument();

        // And display of player waiting status
        expect(screen.getByText("Black:", { exact: false })).toHaveTextContent("waiting");
        expect(screen.getByText("White:", { exact: false })).toHaveTextContent("waiting");

        // When they press the button, we're supposed to tell the back end

        (requests.put as jest.MockedFunction<typeof requests.put>).mockImplementation(
            (url: string) => {
                expect(url).toEqual("online_league/commence?side=black&id=testid&ready=true");
                return new Promise((resolve) => {
                    resolve({
                        ...UNSTARTED_MATCH,
                        black_ready: true,
                    });
                });
            },
        );

        await act(async () => {
            fireEvent.click(imReadyButton);
        });

        expect(screen.getByText("Black:", { exact: false })).toHaveTextContent(/^(?!.*waiting).*$/);
        expect(screen.getByText("White:", { exact: false })).toHaveTextContent("waiting");

        (requests.put as jest.MockedFunction<typeof requests.put>).mockImplementation(
            (url: string) => {
                expect(url).toEqual("online_league/commence?side=black&id=testid&ready=false");
                return new Promise((resolve) => {
                    resolve({
                        ...UNSTARTED_MATCH,
                    });
                });
            },
        );

        await act(async () => {
            fireEvent.click(imReadyButton);
        });

        expect(screen.getByText("Black:", { exact: false })).toHaveTextContent("waiting");
        expect(screen.getByText("White:", { exact: false })).toHaveTextContent("waiting");

        // We need to update the opponent status when the server tells us
        await act(async () => {
            (uiPushActions as any)["online-league-game-waiting"]({
                matchId: 1,
                black: false,
                white: true,
            });
        });

        expect(screen.getByText("Black:", { exact: false })).toHaveTextContent("waiting");
        expect(screen.getByText("White:", { exact: false })).toHaveTextContent(/^(?!.*waiting).*$/);

        // And go to game when the server tells us
        await act(async () => {
            (uiPushActions as any)["online-league-game-commencement"]({
                matchId: 1,
                gameId: 999,
            });
        });

        expect(mockedUseNavigate).toHaveBeenCalledWith("/game/999", expect.anything());
    });
});
