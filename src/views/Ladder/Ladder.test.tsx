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
import { act, render, screen } from "@testing-library/react";
import { LadderRow } from "./Ladder";
import * as data from "@/lib/data";

jest.mock("@/components/Player", () => ({
    Player: ({ user }: { user: { username: string } }) => <span>{user.username}</span>,
}));

const originalUser = data.get("user");
beforeEach(() => data.set("user", { ...originalUser, anonymous: true }));
afterEach(() => data.set("user", originalUser));

const row = {
    rank: 4,
    player: { id: 4, username: "ladder-player" },
    can_challenge: { challengeable: true },
    incoming_challenges: [],
    outgoing_challenges: [],
};

type RowProps = React.ComponentProps<typeof LadderRow>;
function propsFor(load: () => typeof row | Promise<typeof row>): RowProps {
    return {
        index: 3,
        isScrolling: false,
        highlightRank: 4,
        invalidationCount: 0,
        ladder: { load } as unknown as RowProps["ladder"],
    };
}

test("renders a row when its page is already cached before mount", () => {
    render(<LadderRow {...propsFor(() => row)} />);
    expect(screen.getByText("ladder-player")).toBeVisible();
});

test("renders a cached row after a StrictMode remount", () => {
    render(
        <React.StrictMode>
            <LadderRow {...propsFor(() => row)} />
        </React.StrictMode>,
    );
    expect(screen.getByText("ladder-player")).toBeVisible();
});

test("renders a row whose request completes after mount", async () => {
    let resolve: (value: typeof row) => void = () => {};
    const response = new Promise<typeof row>((done) => {
        resolve = done;
    });
    render(<LadderRow {...propsFor(() => response)} />);
    expect(screen.queryByText("ladder-player")).not.toBeInTheDocument();

    await act(async () => resolve(row));
    expect(screen.getByText("ladder-player")).toBeVisible();
});
