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
import { render, screen } from "@testing-library/react";
import { GobanView } from "@/components/GobanView";
import { fakeController, restoreWindowSize, setWindow } from "@/components/GobanView/test_helpers";
import { SidebarGameChat } from "./SidebarGameChat";
import { GameChat } from "./GameChat";

jest.mock("./GameChat", () => ({ GameChat: () => <div data-testid="game-chat" /> }));
jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("@/components/GobanView/MoveNumberControl", () => ({
    __esModule: true,
    MoveNumberControl: () => <div data-testid="slider" />,
}));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

afterEach(restoreWindowSize);

/** The Game view's chat wiring: the chat column in the left aside, and the
 *  sidebar chat in an always tab. */
function renderGameChat() {
    return render(
        <GobanView
            controller={fakeController()}
            playerBars
            leftAside={<GameChat channel="game-100" game_id={100} />}
        >
            <GobanView.Tab id="main" type="always">
                <SidebarGameChat
                    channel="game-100"
                    game_id={100}
                    isMobile={false}
                    mobileChatVisible={false}
                />
            </GobanView.Tab>
        </GobanView>,
    );
}

test("fullHorizontal renders exactly one chat, in the left aside", () => {
    setWindow(2560, 1300);
    const { container } = renderGameChat();
    expect(screen.getAllByTestId("game-chat")).toHaveLength(1);
    expect(container.querySelector(".GobanView-left-aside [data-testid=game-chat]")).not.toBeNull();
});

test("compactHorizontal renders exactly one chat, in the sidebar", () => {
    setWindow(900, 700);
    const { container } = renderGameChat();
    expect(screen.getAllByTestId("game-chat")).toHaveLength(1);
    expect(container.querySelector(".GobanView-sidebar [data-testid=game-chat]")).not.toBeNull();
});
