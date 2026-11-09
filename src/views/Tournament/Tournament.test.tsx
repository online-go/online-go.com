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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as ogs_hooks from "@/lib/hooks";
import * as requests from "@/lib/requests";
import { OgsHelpProvider } from "@/components/OgsHelpProvider";
import { TimeControl } from "@/components/TimeControl";

import { Tournament } from "./Tournament";

jest.mock("@/lib/requests");

jest.mock("@/lib/sockets", () => ({
    socket: {
        on: jest.fn(),
        off: jest.fn(),
        send: jest.fn(),
        connected: false,
        options: {},
    },
    ai_socket: {
        on: jest.fn(),
        off: jest.fn(),
        send: jest.fn(),
        connected: false,
        options: {},
    },
}));

jest.mock("@/components/UIPush", () => {
    return {
        ...jest.requireActual("@/components/UIPush"),
        UIPush: jest.fn(() => null),
    };
});

jest.mock("@/components/Chat", () => {
    return {
        EmbeddedChatCard: jest.fn(() => {
            return <div className="EmbeddedChatCardMock" />;
        }),
    };
});

const ANONYMOUS_USER = {
    username: "Guest",
    anonymous: true,
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

const TOURNAMENT_NAME = "Legacy Tournament";
const DISABLE_VACATION_LABEL = "Disable vacation";
const VACATION_BANNER_TEXT =
    "Vacation is disabled for this tournament. Game clocks will not pause for vacation.";

interface TournamentFixture {
    id: number;
    name: string;
    director: { id: number; username: string };
    time_start: string;
    board_size: number;
    rules: string;
    description: string;
    handicap: string;
    time_control_parameters?: TimeControl | null;
    tournament_type: string;
    min_ranking: number;
    max_ranking: number;
    analysis_enabled: boolean;
    exclude_provisional: boolean;
    auto_start_on_max: boolean;
    ranked: boolean;
    disable_vacation: boolean;
    exclusivity: string;
    first_pairing_method: string;
    subsequent_pairing_method: string;
    players_start: number;
    settings: {
        lower_bar: string;
        upper_bar: string;
        num_rounds: string;
        group_size: string;
        maximum_players: number;
    };
    lead_time_seconds: number;
    base_points: number;
    started: string;
    ended: string;
    is_open: boolean;
    can_administer: boolean;
}

function makeTournament(overrides: Partial<TournamentFixture>): TournamentFixture {
    return {
        id: 12,
        name: TOURNAMENT_NAME,
        director: { id: 1, username: "director" },
        time_start: "2013-01-01T00:00:00Z",
        board_size: 19,
        rules: "japanese",
        description: "",
        handicap: "0",
        time_control_parameters: null,
        tournament_type: "mcmahon",
        min_ranking: 5,
        max_ranking: 38,
        analysis_enabled: true,
        exclude_provisional: false,
        auto_start_on_max: false,
        ranked: true,
        disable_vacation: false,
        exclusivity: "open",
        first_pairing_method: "slide",
        subsequent_pairing_method: "slaughter",
        players_start: 4,
        settings: {
            lower_bar: "10",
            upper_bar: "20",
            num_rounds: "3",
            group_size: "3",
            maximum_players: 100,
        },
        lead_time_seconds: 1800,
        base_points: 0,
        started: "2013-01-02T00:00:00Z",
        ended: "2013-02-01T00:00:00Z",
        is_open: false,
        can_administer: false,
        ...overrides,
    };
}

function fischer(speed: "correspondence" | "live" | "blitz"): TimeControl {
    return {
        system: "fischer",
        speed,
        initial_time: speed === "correspondence" ? 3 * 86400 : 30,
        max_time: speed === "correspondence" ? 7 * 86400 : 60,
        time_increment: speed === "correspondence" ? 86400 : 5,
        pause_on_weekends: false,
    };
}

function mockBackend(tournament: TournamentFixture): void {
    jest.mocked(requests.get).mockImplementation((url: string) => {
        switch (url) {
            case "tournaments/12":
                return Promise.resolve(tournament);
            case "tournaments/12/rounds":
                return Promise.resolve([]);
            case "tournaments/12/players/all":
                return Promise.resolve({});
            default:
                return Promise.resolve({});
        }
    });
}

async function renderTournament(tournament: TournamentFixture): Promise<void> {
    mockBackend(tournament);
    render(
        <OgsHelpProvider>
            <MemoryRouter initialEntries={["/tournament/12"]}>
                <Routes>
                    <Route path="/tournament/:tournament_id" element={<Tournament />} />
                </Routes>
            </MemoryRouter>
        </OgsHelpProvider>,
    );
    expect(await screen.findByText(TOURNAMENT_NAME)).toBeInTheDocument();
}

describe("Tournament page time control display", () => {
    beforeEach(() => {
        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(ANONYMOUS_USER);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("without time control parameters", () => {
        beforeEach(() => {
            jest.spyOn(console, "error").mockImplementation(() => {});
        });

        test("renders a tournament with null time control parameters", async () => {
            await renderTournament(makeTournament({ time_control_parameters: null }));

            expect(screen.queryByText(DISABLE_VACATION_LABEL)).not.toBeInTheDocument();
            expect(screen.queryByText(VACATION_BANNER_TEXT)).not.toBeInTheDocument();
        });

        test("renders a tournament with null time control parameters and vacation disabled", async () => {
            await renderTournament(
                makeTournament({ time_control_parameters: null, disable_vacation: true }),
            );

            expect(screen.queryByText(DISABLE_VACATION_LABEL)).not.toBeInTheDocument();
            expect(screen.queryByText(VACATION_BANNER_TEXT)).not.toBeInTheDocument();
        });

        test("renders a tournament with no time control parameters field", async () => {
            const tournament = makeTournament({});
            delete tournament.time_control_parameters;
            await renderTournament(tournament);

            expect(screen.queryByText(DISABLE_VACATION_LABEL)).not.toBeInTheDocument();
            expect(screen.queryByText(VACATION_BANNER_TEXT)).not.toBeInTheDocument();
        });
    });

    describe("with time control parameters", () => {
        test("shows the vacation row and no banner for correspondence with vacation allowed", async () => {
            await renderTournament(
                makeTournament({
                    time_control_parameters: fischer("correspondence"),
                    disable_vacation: false,
                }),
            );

            expect(screen.getByText(DISABLE_VACATION_LABEL)).toBeInTheDocument();
            expect(screen.queryByText(VACATION_BANNER_TEXT)).not.toBeInTheDocument();
        });

        test("shows the vacation row and the banner for correspondence with vacation disabled", async () => {
            await renderTournament(
                makeTournament({
                    time_control_parameters: fischer("correspondence"),
                    disable_vacation: true,
                }),
            );

            expect(screen.getByText(DISABLE_VACATION_LABEL)).toBeInTheDocument();
            expect(screen.getByText(VACATION_BANNER_TEXT)).toBeInTheDocument();
        });

        test.each(["live", "blitz"] as const)(
            "hides the vacation row and banner for %s tournaments",
            async (speed) => {
                await renderTournament(
                    makeTournament({
                        time_control_parameters: fischer(speed),
                        disable_vacation: true,
                    }),
                );

                expect(screen.queryByText(DISABLE_VACATION_LABEL)).not.toBeInTheDocument();
                expect(screen.queryByText(VACATION_BANNER_TEXT)).not.toBeInTheDocument();
            },
        );
    });
});
