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

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import * as data from "@/lib/data";
import { RengoTeamModal } from "./RengoTeamModal";

const TEST_USER = {
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

const PLAYERS = [
    { id: 1, username: "alice", rank: 10 },
    { id: 2, username: "bob", rank: 11 },
    { id: 3, username: "carol", rank: 12 },
];

function setUser(id: number, username: string) {
    data.set("user", { ...TEST_USER, id, username });
}

function renderModal() {
    return render(
        <Router>
            <RengoTeamModal color="black" players={PLAYERS} />
        </Router>,
    );
}

test("lists the team members in the order given", () => {
    setUser(999, "someone_else");

    const { container } = renderModal();
    const rows = Array.from(container.querySelectorAll(".rengo-team-modal-row"));

    expect(rows.map((row) => row.textContent)).toEqual(
        expect.arrayContaining([
            expect.stringContaining("alice"),
            expect.stringContaining("bob"),
            expect.stringContaining("carol"),
        ]),
    );
    expect(rows[0]).toHaveTextContent("alice");
    expect(rows[1]).toHaveTextContent("bob");
    expect(rows[2]).toHaveTextContent("carol");
});

test("marks the current user's row with a chevron", () => {
    setUser(2, "bob");

    const { container } = renderModal();
    const rows = container.querySelectorAll(".rengo-team-modal-row");

    expect(rows[0].querySelector(".rengo-team-modal-you")).toBeNull();
    expect(rows[1].querySelector(".rengo-team-modal-you")).not.toBeNull();
    expect(rows[2].querySelector(".rengo-team-modal-you")).toBeNull();
});

test("shows no chevron when the current user is not on the team", () => {
    setUser(999, "someone_else");

    const { container } = renderModal();

    expect(container.querySelector(".rengo-team-modal-you")).toBeNull();
});
