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
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as data from "@/lib/data";
import { JGOFClockWithTransmitting, TestGoban } from "goban";
import { TransmittingIndicator } from "./TransmittingIndicator";

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
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

beforeEach(() => {
    data.set("user", LOGGED_IN_USER);
});

/** The logged-in user plays black against user 456. */
function renderBoth() {
    const goban = new TestGoban({
        players: {
            black: { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username },
            white: { id: 456, username: "opponent" },
        },
    });
    const { container } = render(
        <>
            <div data-testid="black">
                <TransmittingIndicator goban={goban} color="black" />
            </div>
            <div data-testid="white">
                <TransmittingIndicator goban={goban} color="white" />
            </div>
        </>,
    );
    const shown = (color: "black" | "white") =>
        !!container.querySelector(`[data-testid="${color}"] .TransmittingIndicator`);
    return { goban, shown };
}

function emitTransmitting(goban: TestGoban, black: number, white: number) {
    act(() => {
        goban.emit("clock", {
            black_move_transmitting: black,
            white_move_transmitting: white,
        } as JGOFClockWithTransmitting);
    });
}

test("shows on neither player when no move is in flight", () => {
    const { shown } = renderBoth();
    expect(shown("black")).toBe(false);
    expect(shown("white")).toBe(false);
});

test("shows on the opponent while the user's own move is being submitted", () => {
    const { goban, shown } = renderBoth();

    act(() => {
        goban.emit("submitting-move", true);
    });
    expect(shown("black")).toBe(false);
    expect(shown("white")).toBe(true);

    act(() => {
        goban.emit("submitting-move", false);
    });
    expect(shown("white")).toBe(false);
});

test("shows on the player to move until the estimated delay has passed", () => {
    const { goban, shown } = renderBoth();

    emitTransmitting(goban, 0, 250);
    expect(shown("black")).toBe(false);
    expect(shown("white")).toBe(true);

    emitTransmitting(goban, 0, 0);
    expect(shown("white")).toBe(false);
});
