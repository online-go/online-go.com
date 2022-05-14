import { AdHocPackedMove, Goban } from "goban";
import { CancelButton, PlayButtons } from "./PlayButtons";
import { act, cleanup, fireEvent, render, screen /* waitFor */ } from "@testing-library/react";
import * as React from "react";
import * as data from "data";

const LOGGED_IN_USER = {
    anonymous: false,
    id: 123,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "https://secure.gravatar.com/avatar/8d809ecc50408afc399a4cb7c8fd4510?s=32&d=retro",
    email: "",
    email_validated: false,
    is_announcer: false,
} as const;

const LESS_THAN_SIX_MOVES = {
    moves: [
        [16, 3, 9136],
        [3, 2, 18978.5],
        [15, 16, 4274.5],
    ] as AdHocPackedMove[],
} as const;
const MORE_THAN_SIX_MOVES = {
    moves: [
        [16, 3, 9136],
        [3, 2, 18978.5],
        [15, 16, 4274.5],
        [14, 2, 3816],
        [2, 15, 6869],
        [16, 14, 6241.5],
        [15, 4, 4485],
    ] as AdHocPackedMove[],
} as const;

beforeEach(() => {
    data.set("user", LOGGED_IN_USER);
});

afterEach(() => {
    data.remove("user");
    cleanup();
});

describe("CancelButton", () => {
    test('says "Cancel game" in the first 6 moves.', () => {
        const goban = new Goban(LESS_THAN_SIX_MOVES);

        render(<CancelButton goban={goban} />);

        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.queryByText("Resign")).toBeNull();
    });

    test('says "Resign" after 6 moves', () => {
        const goban = new Goban(MORE_THAN_SIX_MOVES);

        render(<CancelButton goban={goban} />);

        expect(screen.getByText("Resign")).toBeDefined();
        expect(screen.queryByText("Cancel game")).toBeNull();
    });

    test('changes to "Resign" on the 6th move.', () => {
        const goban = new Goban({
            // 5 moves
            moves: [
                [16, 3, 9136.12],
                [3, 2, 1897.853],
                [15, 16, 4274.0],
                [14, 2, 3816],
                [2, 15, 6869],
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });

        render(<CancelButton goban={goban} />);

        act(() => {
            goban.engine.place(10, 10);
        });

        expect(screen.getByText("Resign")).toBeDefined();
        expect(screen.queryByText("Cancel game")).toBeNull();
    });

    /*
    Most of these tests pass, but for some reason, the swal modal never closes.
    I found this issue: https://github.com/sweetalert2/sweetalert2/issues/1426
    which shows that sweetalert wasn't resolving in tests
    Seems like the issue was fixed in swal2 v8.3.0, so maybe I try to
    uncomment this test after upgrading...

    test("allows user to cancel before 6 moves.", async () => {
        const goban = new Goban(LESS_THAN_SIX_MOVES);
        const cancel_spy = spyOn(goban, "cancelGame");

        render(<CancelButton goban={goban} />);
        fireEvent.click(screen.getByText("Cancel game"));

        expect(screen.getByText(/Are you sure.*cancel.*?/)).toBeDefined();

        fireEvent.click(screen.getByText("Yes"));

        // Wait for the sweetalert to close (not sure why this isn't synchronous)
        await waitFor(() => expect(cancel_spy).toHaveBeenCalledTimes(1));
    });

    test("allows user to resign after 6 moves.", async () => {
        const goban = new Goban(MORE_THAN_SIX_MOVES);
        const resign_spy = spyOn(goban, "resign");

        render(<CancelButton goban={goban} />);
        fireEvent.click(screen.getByText("Resign"));

        expect(screen.getByText(/Are you sure.*resign.*?/)).toBeDefined();

        fireEvent.click(screen.getByText("Yes"));

        // Wait for the sweetalert to close (not sure why this isn't synchronous)
        await waitFor(() => expect(resign_spy).toHaveBeenCalledTimes(1));
    });

    test("allows user to abandon in casual rengo.", async () => {
        const goban = new Goban({
            ...MORE_THAN_SIX_MOVES,
            rengo: true,
            rengo_teams: {
                black: [
                    { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                    { id: 234, username: "user2" },
                ],
                white: [
                    { id: 345, username: "user3" },
                    { id: 456, username: "user4" },
                ],
            },
            rengo_casual_mode: true,
        });
        const resign_spy = spyOn(goban, "resign");
        render(<CancelButton goban={goban} />);
        fireEvent.click(screen.getByText("Resign"));
        expect(screen.getByText(/Are you sure.*abandon.*?/)).toBeDefined();
        fireEvent.click(screen.getByText("Yes"));
        // Wait for the sweetalert to close (not sure why this isn't synchronous)
        await waitFor(() => expect(resign_spy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(resign_spy).toHaveBeenCalledTimes(1));
    });

    test("allows user to change their mind", async () => {
        const goban = new Goban(MORE_THAN_SIX_MOVES);
        const resign_spy = spyOn(goban, "resign");

        render(<CancelButton goban={goban} />);
        fireEvent.click(screen.getByText("Resign"));

        expect(screen.getByText(/Are you sure.*resign.*?/)).toBeDefined();

        fireEvent.click(screen.getByText("No"));

        await waitForElementToBeRemoved(screen.getByRole("dialog"));

        expect(resign_spy).not.toHaveBeenCalled();
    });
    */
});

describe("PlayButtons", () => {
    test("normal game when it's my opponent's turn.", () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // Black went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });

        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Undo")).toBeDefined();

        // Absent
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
        expect(screen.queryByText("Pass")).toBeNull();
    });

    test("normal game when it's my turn.", () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });

        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Pass")).toBeDefined();

        // Absent
        expect(screen.queryByText("Undo")).toBeNull();
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
    });

    test('shows "Accept Undo" when opponent requested an undo.', () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });
        goban.engine.undo_requested = 4;
        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Pass")).toBeDefined();
        expect(screen.queryByText("Accept Undo")).toBeDefined();

        // Absent
        expect(screen.queryByText("Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
    });

    test('shows "Accept undo" if undo was requested after initial render', () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });
        render(<PlayButtons goban={goban} />);

        act(() => {
            goban.engine.undo_requested = 4;
        });

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Pass")).toBeDefined();
        expect(screen.queryByText("Accept Undo")).toBeDefined();

        // Absent
        expect(screen.queryByText("Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
    });

    test('shows "Submit Move" when user staged a move.', () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });
        goban.engine.place(10, 10);
        // usually this is set by a tap event, but I don't really
        // want to mess with GobanCanvas in these tests.
        goban.submit_move = jest.fn();
        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Submit Move")).toBeDefined();

        // Absent
        expect(screen.queryByText("Undo")).toBeNull();
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Pass")).toBeNull();

        // Check that submit button actually triggers a submit
        fireEvent.click(screen.getByText("Submit Move"));
        expect(goban.submit_move).toHaveBeenCalledTimes(1);
    });

    test("Don't show undo for rengo", () => {
        const goban = new Goban({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // Black went last
            ],
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
            rengo: true,
        });

        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();

        // Absent
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
        expect(screen.queryByText("Pass")).toBeNull();
        expect(screen.queryByText("Undo")).toBeNull();
    });

    test("Don't show undo on the first move", () => {
        const goban = new Goban({
            players: {
                black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
                white: { id: 456, username: "test_user2" },
            },
        });

        render(<PlayButtons goban={goban} />);

        // Present
        expect(screen.getByText("Cancel game")).toBeDefined();
        expect(screen.getByText("Pass")).toBeDefined();

        // Absent
        expect(screen.queryByText("Accept Undo")).toBeNull();
        expect(screen.queryByText("Submit Move")).toBeNull();
        expect(screen.queryByText("Undo")).toBeNull();
    });
});
