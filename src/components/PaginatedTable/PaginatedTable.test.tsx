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
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { PaginatedTable } from "./PaginatedTable";
import { get } from "@/lib/requests";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

jest.mock("../UIPush", () => ({
    UIPush: () => null,
}));

type Page = { count: number; results: Array<{ id: number; name: string }> };

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve: (value: T) => resolve(value) };
}

const pendingByUrl = new Map<string, ReturnType<typeof deferred<Page>>>();

beforeEach(() => {
    pendingByUrl.clear();
    (get as jest.Mock).mockImplementation((url: string) => {
        const d = deferred<Page>();
        pendingByUrl.set(url, d);
        return d.promise;
    });
});

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

function renderTable(source: string) {
    return render(
        <PaginatedTable
            className="test-table"
            name="stale-source-table"
            source={source}
            hidePageControls={true}
            columns={[
                {
                    header: "Name",
                    render: (row: { name: string }) => row.name,
                },
            ]}
        />,
    );
}

describe("PaginatedTable", () => {
    test("does not show rows from a previous source after the source URL changes", async () => {
        const { rerender } = renderTable("moderation?player_id=1");

        await waitFor(() => {
            expect(pendingByUrl.has("moderation?player_id=1")).toBe(true);
        });

        rerender(
            <PaginatedTable
                className="test-table"
                name="stale-source-table"
                source="moderation?player_id=2"
                hidePageControls={true}
                columns={[
                    {
                        header: "Name",
                        render: (row: { name: string }) => row.name,
                    },
                ]}
            />,
        );

        await act(async () => {
            pendingByUrl.get("moderation?player_id=1")?.resolve({
                count: 1,
                results: [{ id: 1, name: "Alice history" }],
            });
        });

        expect(screen.queryByText("Alice history")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(pendingByUrl.has("moderation?player_id=2")).toBe(true);
        });

        await act(async () => {
            pendingByUrl.get("moderation?player_id=2")?.resolve({
                count: 1,
                results: [{ id: 2, name: "Bob history" }],
            });
        });

        expect(screen.getByText("Bob history")).toBeInTheDocument();
        expect(screen.queryByText("Alice history")).not.toBeInTheDocument();
    });

    test("fetches the new source when it changes mid-flight with page > 1", async () => {
        const tableElement = (source: string) => (
            <PaginatedTable
                className="test-table"
                name="stale-source-table"
                source={source}
                startingPage={2}
                hidePageControls={true}
                columns={[
                    {
                        header: "Name",
                        render: (row: { name: string }) => row.name,
                    },
                ]}
            />
        );

        const { rerender } = render(tableElement("moderation?player_id=1"));
        await waitFor(() => {
            expect(pendingByUrl.has("moderation?player_id=1")).toBe(true);
        });

        rerender(tableElement("moderation?player_id=2"));

        await act(async () => {
            pendingByUrl.get("moderation?player_id=1")?.resolve({
                count: 30,
                results: [{ id: 1, name: "Alice history" }],
            });
        });

        // The new source must still get fetched when the old fetch resolves
        // after the source change: the source-change bump and the
        // fetch-completion bump of load_again_refresh must compound rather
        // than collide (stale-closure livelock regression).
        await waitFor(() => {
            expect(pendingByUrl.has("moderation?player_id=2")).toBe(true);
        });

        await act(async () => {
            pendingByUrl.get("moderation?player_id=2")?.resolve({
                count: 1,
                results: [{ id: 2, name: "Bob history" }],
            });
        });

        expect(screen.getByText("Bob history")).toBeInTheDocument();
        expect(screen.queryByText("Alice history")).not.toBeInTheDocument();
    });
});
