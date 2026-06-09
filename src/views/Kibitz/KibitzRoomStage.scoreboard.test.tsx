/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { readFileSync } from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import type { KibitzRoomSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzRoomStage } from "./KibitzRoomStage";

jest.mock("./KibitzDesktopMainGameScoreboard", () => ({
    __esModule: true,
    KibitzDesktopMainGameScoreboard: () => <div data-testid="desktop-scoreboard" />,
    getDesktopMainGameMetadataRowText: () => ({
        timeText: "Time 5m",
        handicapText: "Handicap H6",
    }),
}));

jest.mock("@/lib/GobanController", () => ({
    __esModule: true,
    GobanController: class {},
    getMoveTreeTrunkTail: jest.fn(() => ({ move_number: 0 })),
}));

jest.mock("./KibitzMainGameStats", () => ({
    __esModule: true,
    KibitzMainGameStats: () => <div data-testid="mobile-stats" />,
}));

jest.mock("./KibitzBoard", () => ({
    __esModule: true,
    KibitzBoard: () => <div data-testid="board" />,
}));

jest.mock("./KibitzBoardControls", () => ({
    __esModule: true,
    KibitzBoardControls: () => <div data-testid="board-controls" />,
}));

jest.mock("./KibitzDividerHandle", () => ({
    __esModule: true,
    KibitzDividerHandle: () => <div data-testid="divider-handle" />,
}));

jest.mock("./KibitzVariationComposer", () => ({
    __esModule: true,
    KibitzVariationComposer: () => <div data-testid="variation-composer" />,
}));

jest.mock("./KibitzRoomSettingsPopover", () => ({
    __esModule: true,
    KibitzRoomSettingsPopover: () => null,
}));

jest.mock("./KibitzNodeText", () => ({
    __esModule: true,
    KibitzNodeText: () => null,
}));

jest.mock("@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar", () => ({
    __esModule: true,
    GobanAnalyzeButtonBar: () => <div data-testid="analyze-bar" />,
}));

jest.mock("@/components/Resizable", () => ({
    __esModule: true,
    Resizable: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/KBShortcut", () => ({
    __esModule: true,
    KBShortcut: () => null,
}));

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("./kibitzBoardSizing", () => ({
    __esModule: true,
    measureSquareFitLayout: () => ({
        nextSize: 0,
        slotWidth: 0,
        slotHeight: 0,
        parentClientHeight: 0,
        reservedHeight: 0,
        rowGap: 0,
        fallbackHeight: 0,
        usableHeight: 0,
    }),
}));

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(() => Promise.resolve({})),
}));

jest.mock("@/lib/popover", () => ({
    __esModule: true,
    close_all_popovers: jest.fn(),
    popover: jest.fn(),
}));

jest.mock("@/lib/swal_config", () => ({
    __esModule: true,
    alert: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    pgettext: (_context: string, text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        template.replace(/{{(\w+)}}/g, (_match, key) => String(values[key] ?? "")),
}));

beforeAll(() => {
    class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    const globalWithResizeObserver = globalThis as typeof globalThis & {
        ResizeObserver: typeof ResizeObserverMock;
    };

    globalWithResizeObserver.ResizeObserver = ResizeObserverMock;
});

function makeUser(id: number, username: string): KibitzWatchedGame["black"] {
    return {
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    };
}

function makeRoom(): KibitzRoomSummary {
    const game: KibitzWatchedGame = {
        game_id: 42,
        board_size: "19x19",
        title: "Test game",
        black: makeUser(1, "Black"),
        white: makeUser(2, "White"),
        live: true,
        move_number: 12,
    };

    return {
        id: "room-1",
        channel: "room-1",
        title: "Room 1",
        kind: "user",
        viewer_count: 3,
        current_game: game,
        proposals_enabled: true,
    };
}

describe("KibitzRoomStage header scoreboard integration", () => {
    const room = makeRoom();
    const baseProps = {
        room,
        rooms: [room],
        proposals: [],
        variations: [],
        visibleVariationIds: [],
        variationColorIndexes: {},
        secondaryPane: { collapsed: false, size: "small" as const },
        onClearPreview: jest.fn(),
        onPostVariation: jest.fn(),
        onSetSecondaryPaneMode: jest.fn(),
        variationFocusRequestId: 0,
        onMainBoardControllerChange: jest.fn(),
        onMainBoardHydrationChange: jest.fn(),
    };

    it("renders the desktop scoreboard in the desktop header path", () => {
        render(<KibitzRoomStage {...baseProps} />);

        expect(screen.getByTestId("desktop-scoreboard")).toBeInTheDocument();
        expect(screen.queryByTestId("mobile-stats")).toBeNull();
    });

    it("gives the scoreboard room to expand in the desktop header grid", () => {
        const css = readFileSync(path.join(__dirname, "KibitzRoomStage.css"), "utf8");

        expect(css).toMatch(
            /\.room-stage-header \.board-title-row\s*{[^}]*grid-template-columns:\s*minmax\(10rem, 1fr\) minmax\(0, 2\.5fr\) minmax\(10rem, 1fr\);/s,
        );
        expect(css).toMatch(
            /@media \(max-width: 1700px\)\s*{\s*\.room-stage-header \.board-title-row\s*{[^}]*gap:\s*0\.5rem;[^}]*grid-template-columns:\s*minmax\(0, 0\.85fr\) minmax\(0, 3fr\) minmax\(0, 0\.85fr\);/s,
        );
    });
});
