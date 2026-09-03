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
import { render, screen } from "@testing-library/react";
import type { GobanController } from "@/lib/GobanController";
import { KibitzView, KibitzViewProps } from "./KibitzView";

jest.mock("@/components/KBShortcut", () => ({ __esModule: true, KBShortcut: () => null }));
jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("@/components/GobanView/PlayerBar", () => ({
    __esModule: true,
    PlayerBar: ({ color }: { color: string }) => <div data-testid={`bar-${color}`} />,
}));
jest.mock("@/components/GobanView/MoveNumberSlider", () => ({
    __esModule: true,
    MoveNumberSlider: () => <div data-testid="slider" />,
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
jest.mock("./KibitzVariationPanel", () => ({
    __esModule: true,
    KibitzVariationPanel: ({ mode }: { mode: string }) => (
        <div data-testid={`variation-panel-${mode}`} />
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
jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({ useKibitzHelpTarget: () => null }));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

function fakeController(): GobanController {
    return {
        goban: {
            config: { game_id: 100 },
            engine: {
                players: { black: { id: 1 }, white: { id: 2 } },
                playerColor: () => "invalid",
                rengo: false,
                cur_move: { move_number: 5 },
                last_official_move: { move_number: 5 },
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
        gobans: { main, secondary: null, center: main, centerMode: "main" },
        isPortrait: false,
        streamerMode: false,
        onStreamerModeChange: jest.fn(),
        leftAside: {} as KibitzViewProps["leftAside"],
        chat: {} as KibitzViewProps["chat"],
        proposals: { activeProposal: undefined, queuedProposals: [], onVote: jest.fn() },
        onPostVariation: jest.fn(),
        onExitVariation: jest.fn(),
        onReturnToLive: jest.fn(),
        roomSettings: {
            canEditRoom: false,
            canDeleteRoom: false,
            onSaveRoomDetails: jest.fn(),
            onDeleteRoom: jest.fn(),
        },
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
        expect(screen.queryByTitle("Return to game")).toBeNull();
    });

    test("draft mode shows the draft panel, mini board and return action", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-draft")).toBeInTheDocument();
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "yes");
        expect(screen.getByTitle("Return to game")).toBeInTheDocument();
    });

    test("variation mode shows the read-only panel", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-variation")).toBeInTheDocument();
    });

    test("streamer mode hides the asides", () => {
        const { container } = render(<KibitzView {...baseProps({ streamerMode: true })} />);
        expect(container.querySelector(".Kibitz.is-streamer-mode")).not.toBeNull();
    });
});
