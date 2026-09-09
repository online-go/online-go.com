/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as data from "@/lib/data";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzRoomUser, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzView, KibitzViewProps } from "./KibitzView";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user?: { username?: string } }) => (
        <span data-testid="Player">{user?.username ?? ""}</span>
    ),
}));
jest.mock("@/components/KBShortcut", () => ({ __esModule: true, KBShortcut: () => null }));
jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("@/components/GobanView/PlayerBar", () => ({
    __esModule: true,
    PlayerBar: ({ color }: { color: string }) => <div data-testid={`bar-${color}`} />,
}));
jest.mock("@/components/GobanView/MoveNumberControl", () => ({
    __esModule: true,
    MoveNumberControl: () => <div data-testid="slider" />,
}));
jest.mock("./KibitzLeftAside", () => ({
    __esModule: true,
    KibitzLeftAside: ({ miniBoardController }: { miniBoardController: unknown }) => (
        <div data-testid="left-aside" data-mini={miniBoardController ? "yes" : "no"} />
    ),
}));
jest.mock("./KibitzChatPanel", () => ({
    __esModule: true,
    KibitzChatPanel: () => <div data-testid="chat" />,
}));
jest.mock("./KibitzPortraitPanes", () => ({
    __esModule: true,
    // The analysis node is rendered so tests can reach the variation panel,
    // which portrait puts inside this pane.
    KibitzPortraitPanes: ({ active, analysis }: { active: string; analysis: React.ReactNode }) => (
        <div data-testid="portrait-panes" data-active={active}>
            {analysis}
        </div>
    ),
}));
jest.mock("./KibitzVariationPanel", () => ({
    __esModule: true,
    KibitzVariationPanel: ({ mode, onPost }: { mode: string; onPost: () => void }) => (
        <div data-testid={`variation-panel-${mode}`}>
            <button type="button" onClick={() => onPost()}>
                mock post
            </button>
        </div>
    ),
}));
jest.mock("./KibitzProposalPanel", () => ({
    __esModule: true,
    KibitzProposalPanel: () => <div data-testid="proposals" />,
}));
jest.mock("./KibitzRoomSettingsPopover", () => ({
    __esModule: true,
    KibitzRoomSettingsPopover: () => null,
}));
jest.mock("./KibitzMoreActionsPopover", () => ({
    __esModule: true,
    openKibitzMoreActions: jest.fn(),
}));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

function fakeController(curMove = 5, lastOfficialMove = 5): GobanController {
    return {
        goban: {
            config: { game_id: 100 },
            engine: {
                players: { black: { id: 1 }, white: { id: 2 } },
                playerColor: () => "invalid",
                rengo: false,
                cur_move: { move_number: curMove },
                last_official_move: { move_number: lastOfficialMove },
            },
            on: jest.fn(),
            off: jest.fn(),
        },
        on: jest.fn(),
        off: jest.fn(),
    } as unknown as GobanController;
}

function baseProps(overrides: Partial<KibitzViewProps> = {}): KibitzViewProps {
    const main = fakeController();
    return {
        room: { id: "r1", title: "Room", channel: "kibitz-r1" } as KibitzViewProps["room"],
        gobans: {
            main,
            secondary: null,
            center: main,
            centerMode: "main",
            playerBars: main,
            isDraftDirty: () => false,
        },
        isPortrait: false,
        leftAside: {} as KibitzViewProps["leftAside"],
        chat: {} as KibitzViewProps["chat"],
        proposals: { activeProposal: undefined, queuedProposals: [], onVote: jest.fn() },
        onPostVariation: jest.fn(),
        onExitVariation: jest.fn(),
        onReturnToLive: jest.fn(),
        roomSettings: {
            ready: true,
            canEditRoom: false,
            canDeleteRoom: false,
            onSaveRoomDetails: jest.fn(),
            onDeleteRoom: jest.fn(),
        },
        ...overrides,
    };
}

function makeRoomUser(id: number, username: string): KibitzRoomUser {
    return { id, username, ranking: 0, professional: false, ui_class: "" };
}

function makeVariation(overrides: Partial<KibitzVariationSummary> = {}): KibitzVariationSummary {
    return {
        id: "v1",
        room_id: "r1",
        game_id: 100,
        creator: makeRoomUser(1, "alice"),
        created_at: 0,
        viewer_count: 0,
        current_viewers: [],
        title: "Tenuki instead",
        ...overrides,
    };
}

function makeWatchedGame(overrides: Partial<KibitzWatchedGame> = {}): KibitzWatchedGame {
    return {
        game_id: 42,
        board_size: "19x19",
        title: "Round 3",
        black: makeRoomUser(1, "b"),
        white: makeRoomUser(2, "w"),
        ...overrides,
    };
}

// A populated leftAside, standing in for the `{}` stub `baseProps()` uses,
// for the tests below that need the chip's game-lookup derivation
// (variations / variationGameById / selectedVariationId /
// variationColorIndexes) to actually resolve rather than short-circuit.
function variationLeftAside(
    overrides: Partial<KibitzViewProps["leftAside"]> = {},
): KibitzViewProps["leftAside"] {
    return {
        rooms: [],
        activeRoomId: "r1",
        blockedRoomIds: new Set(),
        onSelectRoom: jest.fn(),
        canOpenCreateRoomFlow: false,
        signInHref: "/login",
        variations: [],
        currentGameId: 100,
        variationGameById: new Map(),
        selectedVariationId: null,
        variationFocusRequestId: 0,
        blockedVariationFlashId: null,
        onRecallVariation: jest.fn(),
        onHideVariation: jest.fn(),
        variationColorIndexes: {},
        ...overrides,
    };
}

// jsdom reports a 1024x768 window, which goban_view_mode classifies as
// "wide", so these tests exercise the landscape layout.
describe("KibitzView", () => {
    test("main mode shows the board, bars, chat and no variation panel", () => {
        render(<KibitzView {...baseProps()} />);
        expect(screen.getByTestId("goban-container")).toBeInTheDocument();
        expect(screen.getByTestId("bar-white")).toBeInTheDocument();
        expect(screen.getByTestId("bar-black")).toBeInTheDocument();
        expect(screen.getByTestId("chat")).toBeInTheDocument();
        expect(screen.queryByTestId(/variation-panel/)).toBeNull();
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "no");
        expect(screen.getByTitle("More actions")).toBeInTheDocument();
        // The settings gear is gone; its entries live in the More menu.
        expect(screen.queryByTitle("Settings")).toBeNull();
    });

    test("draft mode shows the draft panel and the mini board", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-draft")).toBeInTheDocument();
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "yes");
        // No Return to game tab: the variation panel's own Back to game
        // button, the mini board and Escape are the ways out.
        expect(screen.queryByTitle("Return to game")).toBeNull();
    });

    test("variation mode shows the read-only panel", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-variation")).toBeInTheDocument();
    });

    test("a variation of a different game names that game in the header chip", () => {
        const otherGame = makeWatchedGame({ game_id: 42, title: "Round 3" });
        const variation = makeVariation({ id: "v1", game_id: 42, title: "Tenuki instead" });
        const props = baseProps({
            room: {
                id: "r1",
                title: "Room",
                channel: "kibitz-r1",
                current_game: { game_id: 100 },
            } as unknown as KibitzViewProps["room"],
            leftAside: variationLeftAside({
                variations: [variation],
                selectedVariationId: "v1",
                variationGameById: new Map([[42, otherGame]]),
            }),
        });
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        render(<KibitzView {...props} />);
        // Assert the variation itself resolved (not just that some text
        // matched), so a fixture that leaves `selectedVariation` null can't
        // pass this test for the wrong reason.
        expect(screen.getByText("Tenuki instead")).toBeInTheDocument();
        expect(screen.getByText(/Round 3/)).toBeInTheDocument();
    });

    test("a variation of the room's current game shows no other-game label", () => {
        const variation = makeVariation({ id: "v1", game_id: 100, title: "Tenuki instead" });
        const props = baseProps({
            room: {
                id: "r1",
                title: "Room",
                channel: "kibitz-r1",
                current_game: { game_id: 100 },
            } as unknown as KibitzViewProps["room"],
            leftAside: variationLeftAside({
                variations: [variation],
                selectedVariationId: "v1",
                variationGameById: new Map([
                    [100, makeWatchedGame({ game_id: 100, title: "Should not appear" })],
                ]),
            }),
        });
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        const { container } = render(<KibitzView {...props} />);
        expect(screen.getByText("Tenuki instead")).toBeInTheDocument();
        expect(container.querySelector(".KibitzVariationChip-game")).toBeNull();
    });

    test("a variation of an untracked older game renders without the label", () => {
        const variation = makeVariation({ id: "v1", game_id: 42, title: "Tenuki instead" });
        const props = baseProps({
            room: {
                id: "r1",
                title: "Room",
                channel: "kibitz-r1",
                current_game: { game_id: 100 },
            } as unknown as KibitzViewProps["room"],
            leftAside: variationLeftAside({
                variations: [variation],
                selectedVariationId: "v1",
                variationGameById: new Map(),
            }),
        });
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        const { container } = render(<KibitzView {...props} />);
        expect(screen.getByText("Tenuki instead")).toBeInTheDocument();
        expect(container.querySelector(".KibitzVariationChip-game")).toBeNull();
    });

    test("a main board behind the official tail offers Return to live", () => {
        const main = fakeController(3, 5);
        const props = baseProps({
            gobans: {
                main,
                secondary: null,
                center: main,
                centerMode: "main",
                playerBars: main,
                isDraftDirty: () => false,
            },
        });
        render(<KibitzView {...props} />);
        expect(screen.getByTitle("Return to live")).toBeInTheDocument();
    });

    test("a variation opening before its controller exists mounts one board", () => {
        const main = fakeController();
        const props = baseProps({
            gobans: {
                main,
                secondary: null,
                center: main,
                centerMode: "variation",
                playerBars: main,
                isDraftDirty: () => false,
            },
        });
        render(<KibitzView {...props} />);
        expect(screen.getAllByTestId("goban-container")).toHaveLength(1);
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "no");
    });

    test("a room with no board shows the waiting message, rooms and chat", () => {
        const props = baseProps({
            gobans: {
                main: null,
                secondary: null,
                center: null,
                centerMode: "main",
                playerBars: null,
                isDraftDirty: () => false,
            },
        });
        render(<KibitzView {...props} />);
        expect(screen.getByText("Looking for a suitable live game.")).toBeInTheDocument();
        expect(screen.getByTestId("chat")).toBeInTheDocument();
        expect(screen.getByTestId("left-aside")).toBeInTheDocument();
        expect(screen.queryByTestId("goban-container")).toBeNull();
    });

    describe("portrait", () => {
        beforeEach(() => {
            data.remove("kibitz.portrait_pane");
            data.remove("kibitz.chat_tab");
        });

        test("shows the panes instead of the chat and the left aside", () => {
            render(<KibitzView {...baseProps({ isPortrait: true })} />);
            for (const title of ["Game chat", "Kibitz chat", "People", "Variations", "Rooms"]) {
                expect(screen.getByTitle(title)).toBeInTheDocument();
            }
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute(
                "data-active",
                "room-chat",
            );
            expect(screen.queryByTestId("chat")).toBeNull();
            expect(screen.queryByTestId("left-aside")).toBeNull();
        });

        test("the action bar switches the pane and remembers the choice", () => {
            render(<KibitzView {...baseProps({ isPortrait: true })} />);
            fireEvent.click(screen.getByTitle("Variations"));
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute(
                "data-active",
                "variations",
            );
            expect(data.get("kibitz.portrait_pane")).toBe("variations");
        });

        test("a stored Rooms pane refreshes the room directory on the first render", () => {
            data.set("kibitz.portrait_pane", "rooms");
            const onRoomsOpened = jest.fn();
            render(<KibitzView {...baseProps({ isPortrait: true, onRoomsOpened })} />);
            expect(onRoomsOpened).toHaveBeenCalledTimes(1);
        });

        test("landscape does not refresh the directory for a stored Rooms pane", () => {
            data.set("kibitz.portrait_pane", "rooms");
            const onRoomsOpened = jest.fn();
            render(<KibitzView {...baseProps({ isPortrait: false, onRoomsOpened })} />);
            expect(onRoomsOpened).not.toHaveBeenCalled();
        });

        test("selecting the Rooms pane refreshes the room directory", () => {
            const onRoomsOpened = jest.fn();
            render(<KibitzView {...baseProps({ isPortrait: true, onRoomsOpened })} />);
            expect(onRoomsOpened).not.toHaveBeenCalled();
            fireEvent.click(screen.getByTitle("Rooms"));
            expect(onRoomsOpened).toHaveBeenCalledTimes(1);
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute("data-active", "rooms");
        });

        test("a second variation brings the analysis pane forward again", () => {
            // The reader can walk away from the analysis pane with a draft
            // still open. Starting another one there leaves the centre
            // showing a variation throughout, so only the new controller
            // says anything happened.
            const props = baseProps({ isPortrait: true });
            const firstDraft = fakeController();
            props.gobans = {
                ...props.gobans,
                secondary: firstDraft,
                center: firstDraft,
                centerMode: "draft",
            };
            const { rerender } = render(<KibitzView {...props} />);
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute("data-active", "analysis");

            fireEvent.click(screen.getByTitle("Variations"));
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute(
                "data-active",
                "variations",
            );

            const secondDraft = fakeController();
            rerender(
                <KibitzView
                    {...props}
                    gobans={{
                        ...props.gobans,
                        secondary: secondDraft,
                        center: secondDraft,
                        centerMode: "draft",
                    }}
                />,
            );
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute("data-active", "analysis");
        });

        test("posting a variation leaves the reader on the Kibitz chat", () => {
            // The post lands in the chat, and the posted variation arrives a
            // render after the draft goes, so the pane has to hold through a
            // moment where the centre shows a variation with no controller.
            const props = baseProps({ isPortrait: true });
            const draft = fakeController();
            props.gobans = {
                ...props.gobans,
                secondary: draft,
                center: draft,
                centerMode: "draft",
            };
            const { rerender } = render(<KibitzView {...props} />);
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute("data-active", "analysis");

            fireEvent.click(screen.getByText("mock post"));
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute(
                "data-active",
                "room-chat",
            );

            const gap = { ...props.gobans, secondary: null, center: null, centerMode: "variation" };
            rerender(<KibitzView {...props} gobans={gap as KibitzViewProps["gobans"]} />);
            const posted = fakeController();
            rerender(
                <KibitzView
                    {...props}
                    gobans={{
                        ...props.gobans,
                        secondary: posted,
                        center: posted,
                        centerMode: "variation",
                    }}
                />,
            );
            expect(screen.getByTestId("portrait-panes")).toHaveAttribute(
                "data-active",
                "room-chat",
            );
        });

        test("keeps the room title above the board", () => {
            const { container } = render(<KibitzView {...baseProps({ isPortrait: true })} />);
            expect(container.querySelector(".Kibitz-room-title")).not.toBeNull();
        });

        test("the variation chip takes the header over from the room title", () => {
            // The header names what the centre shows: the room, or the
            // variation on its own. The game's settings live in the More
            // actions menu, so there is no second line either way.
            const live = render(<KibitzView {...baseProps({ isPortrait: true })} />);
            expect(live.container.querySelector(".KibitzVariationChip")).toBeNull();
            expect(live.container.querySelector(".Kibitz-room-title")).not.toBeNull();
            live.unmount();

            const props = baseProps({ isPortrait: true });
            const secondary = fakeController();
            props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
            const variation = render(<KibitzView {...props} />);
            expect(variation.container.querySelector(".KibitzVariationChip")).not.toBeNull();
            expect(variation.container.querySelector(".Kibitz-room-title")).toBeNull();
            expect(variation.container.querySelector(".Kibitz-header-result")).toBeNull();
        });
    });

    test("a room with a game but no controller yet renders nothing", () => {
        const props = baseProps({
            room: {
                id: "r1",
                title: "Room",
                channel: "kibitz-r1",
                current_game: { game_id: 100 },
            } as unknown as KibitzViewProps["room"],
            gobans: {
                main: null,
                secondary: null,
                center: null,
                centerMode: "main",
                playerBars: null,
                isDraftDirty: () => false,
            },
        });
        const { container } = render(<KibitzView {...props} />);
        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByText("Looking for a suitable live game.")).toBeNull();
    });

    test("the analysis action leaves the draft when it is already active", async () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
        props.onCreateVariation = jest.fn();
        props.onExitVariation = jest.fn();
        render(<KibitzView {...props} />);
        await userEvent.click(screen.getByTitle("New variation"));
        expect(props.onExitVariation).toHaveBeenCalledTimes(1);
        expect(props.onCreateVariation).not.toHaveBeenCalled();
    });

    test("the analysis action starts a draft when it is not active", async () => {
        const props = baseProps();
        props.onCreateVariation = jest.fn();
        props.onExitVariation = jest.fn();
        render(<KibitzView {...props} />);
        await userEvent.click(screen.getByTitle("New variation"));
        expect(props.onCreateVariation).toHaveBeenCalledTimes(1);
        expect(props.onExitVariation).not.toHaveBeenCalled();
    });

    test("a room between games keeps the action bar and the panels", () => {
        // The waiting state used to render its own tree with no GobanView,
        // which meant no tab bar at all. It now renders the same tree as
        // everything else, with a message where the board would be.
        const props = baseProps();
        props.gobans = {
            ...props.gobans,
            main: null,
            center: null,
            playerBars: null,
            centerMode: "main",
        };
        props.room = { ...props.room, current_game: undefined };
        const { container } = render(<KibitzView {...props} />);

        expect(container.querySelector(".KibitzView-waiting-message")).not.toBeNull();
        expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
        expect(screen.getByTitle("More actions")).toBeInTheDocument();
        expect(screen.getByTestId("chat")).toBeInTheDocument();
        // No board means no bars and no move-number strip to drive.
        expect(screen.queryByTestId("bar-black")).toBeNull();
        expect(screen.queryByTestId("move-number-control")).toBeNull();
        expect(container.querySelector(".GobanView.has-no-board")).not.toBeNull();
    });
});
