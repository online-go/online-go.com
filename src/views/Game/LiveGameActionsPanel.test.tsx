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

import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "./goban_context";
import { LiveGameActionsPanel } from "./LiveGameActionsPanel";
import { TEST_USER } from "./test_user";

const OPPONENT = { id: 456, username: "test_user2" };
const ME = { id: TEST_USER.id, username: TEST_USER.username };

test("an undo request that arrives while the menu is open adds Accept and Reject", () => {
    data.set("user", TEST_USER);
    // Four moves played, white went last, so it is black's (my) turn.
    const controller = new GobanController({
        game_id: 456789,
        moves: [
            [16, 3, 9136.12],
            [3, 2, 1897.853],
            [15, 16, 4274.0],
            [14, 2, 3816],
        ],
        players: { black: ME, white: OPPONENT },
    });

    render(
        <GobanControllerContext.Provider value={controller}>
            <LiveGameActionsPanel
                args={{
                    controller,
                    is_mobile: false,
                    historical_black: null,
                    historical_white: null,
                    estimating_score: false,
                    settings: { open: false, onClick: () => undefined },
                    chat: { enabled: true, visible: false, unread: false, toggle: () => undefined },
                    moderator: { visible: false, onToggle: () => undefined },
                }}
            />
        </GobanControllerContext.Provider>,
    );
    expect(screen.queryByText("Accept Undo")).toBeNull();

    act(() => {
        controller.goban.engine.undo_requested_by = OPPONENT.id;
        controller.goban.engine.undo_requested = 4;
        controller.goban.emit("undo_requested", 4);
    });

    expect(screen.getByText("Accept Undo")).toBeInTheDocument();
    expect(screen.getByText("Reject Undo")).toBeInTheDocument();
});
