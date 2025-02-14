/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */
import { UserByName } from "./UserByName";
import * as React from "react";
import * as player_cache from "../../lib/player_cache";
import * as requests from "../../lib/requests";
import { User } from "./User";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { act } from "react";

let container: HTMLDivElement | undefined;
beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    (User as jest.Mock).mockClear();
});

jest.mock("./User", () => {
    return {
        User: jest.fn(() => {
            return <div className="UserMock" />;
        }),
    };
});

async function renderUserByName() {
    let res: ReturnType<typeof render> | undefined;
    await act(async () => {
        res = render(
            <MemoryRouter initialEntries={["/user/benjito"]}>
                <Routes>
                    <Route path="/user/:username" element={<UserByName />} />
                </Routes>
            </MemoryRouter>,
        );
    });
    return res as ReturnType<typeof render>;
}

test("Renders User page if found in cache", async () => {
    player_cache.update({ id: 12345, username: "benjito" });
    jest.spyOn(requests, "get").mockImplementation(() => {
        return Promise.resolve({ results: [{ player_id: 12345 }] });
    });

    const { container } = await renderUserByName();

    expect(requests.get).toHaveBeenCalledTimes(0);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0]).toEqual({ user_id: 12345 });
});

test("Renders User page if not found", async () => {
    // Mocking this because no easy way to clear and update player_cache without
    // API fetches
    jest.spyOn(player_cache, "lookup_by_username").mockImplementation(() => {
        return null;
    });
    jest.spyOn(requests, "get").mockImplementation(() => {
        return Promise.resolve({ results: [{ id: 12345 }] });
    });

    const { container } = await renderUserByName();

    expect(requests.get).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0]).toEqual({ user_id: 12345 });
});

test("Displays user not found if not found.", async () => {
    // Mocking this because no easy way to clear and update player_cache without
    // API fetches
    jest.spyOn(player_cache, "lookup_by_username").mockImplementation(() => {
        return null;
    });
    jest.spyOn(requests, "get").mockImplementation(() => {
        return Promise.resolve({ results: [] });
    });

    const { container } = await renderUserByName();

    expect(requests.get).toHaveBeenCalledWith("players", { username: "benjito" });
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0]).toEqual({ user_id: -1 });
});
