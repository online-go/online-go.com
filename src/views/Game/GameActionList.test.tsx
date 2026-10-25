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

import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { GobanViewStateContext, GobanViewTabState } from "@/components/GobanView/GobanViewContext";
import { GameAction } from "./GameAction";
import { GameActionList } from "./GameActionList";

function action(overrides: Partial<GameAction>): GameAction {
    return {
        id: "a",
        icon: "info",
        label: "Info",
        bar: null,
        menuOrder: 1,
        dockOrder: 1,
        kind: "action",
        ...overrides,
    } as GameAction;
}

test("rows are direct children, in dock order, each with a title", () => {
    const { container } = render(
        <div data-testid="host">
            <GameActionList
                actions={[
                    action({ id: "b", label: "B", dockOrder: 20 }),
                    action({ id: "a", label: "A", dockOrder: 10 }),
                ]}
            />
        </div>,
    );
    const rows = container.querySelectorAll("[data-testid=host] > *");
    expect(Array.from(rows).map((r) => r.textContent)).toEqual(["A", "B"]);
    expect(rows[0].getAttribute("title")).toBe("A");
});

test("actions with no dock order are left out", () => {
    render(<GameActionList actions={[action({ label: "Resign", dockOrder: undefined })]} />);
    expect(screen.queryByText("Resign")).toBeNull();
});

test("a tap runs the action", () => {
    const onClick = jest.fn();
    render(<GameActionList actions={[action({ onClick })]} />);
    fireEvent.click(screen.getByText("Info"));
    expect(onClick).toHaveBeenCalledTimes(1);
});

test("a toggle row switches its GobanView tab", () => {
    const state: GobanViewTabState = {
        toggleVisibility: { "game-moderator": false },
        activeTakeover: null,
        setToggle: jest.fn(),
        setActiveTakeover: jest.fn(),
    };
    const onToggle = jest.fn();
    render(
        <GobanViewStateContext.Provider value={state}>
            <GameActionList
                actions={[
                    action({ id: "game-moderator", label: "Moderator", kind: "toggle", onToggle }),
                ]}
            />
        </GobanViewStateContext.Provider>,
    );
    fireEvent.click(screen.getByText("Moderator"));
    expect(state.setToggle).toHaveBeenCalledWith("game-moderator", true);
    expect(onToggle).toHaveBeenCalledWith(true);
});

test("a disabled row does not run", () => {
    const onClick = jest.fn();
    render(<GameActionList actions={[action({ onClick, disabled: true })]} />);
    fireEvent.click(screen.getByText("Info"));
    expect(onClick).not.toHaveBeenCalled();
});

test("an active row and a toggle row that is on are marked active", () => {
    const state: GobanViewTabState = {
        toggleVisibility: { "game-moderator": true },
        activeTakeover: null,
        setToggle: jest.fn(),
        setActiveTakeover: jest.fn(),
    };
    render(
        <GobanViewStateContext.Provider value={state}>
            <GameActionList
                actions={[
                    action({ id: "game-analyze", label: "Analyze", active: true }),
                    action({ id: "game-moderator", label: "Moderator", kind: "toggle" }),
                    action({ id: "game-info", label: "Info" }),
                ]}
            />
        </GobanViewStateContext.Provider>,
    );
    const row = (label: string) => screen.getByText(label).closest("button");
    expect(row("Analyze")).toHaveClass("GameActionRow", "active");
    expect(row("Moderator")).toHaveClass("GameActionRow", "active");
    expect(row("Info")).toHaveClass("GameActionRow");
    expect(row("Info")).not.toHaveClass("active");
});
