import { UserByName } from './UserByName';
import * as React from 'react';
import * as player_cache from "../../lib/player_cache";
import { render } from "react-dom";
import { act } from "react-dom/test-utils";
import * as requests from "../../lib/requests";
import {User} from './User';

// workaround for setGobanTranslations not found error
// This can probably be fixed by removing sideeffects from translate.ts
jest.mock('goban', () => ({
    setGobanTranslations: jest.fn(),
}));

let container: HTMLDivElement = null;
beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
    (User as jest.Mock).mockClear();
});

jest.mock("./User", () => {
    return {
        User: jest.fn(() => {
            return <div className="UserMock"/>;
        }),
    };
});

test('Renders User page if found in cache', async() => {
    // Mocking this because no easy way to clear and update player_cache without
    // API fetches
    jest.spyOn(player_cache, "lookup_by_username")
        .mockImplementation(() => { return {id: 12345, username: "benjito"}; });
    jest.spyOn(requests, "get")
        .mockImplementation(() => { return Promise.resolve({results: [{player_id: 12345}]}); });

    await act(async() =>
        render(<UserByName
            match={{
                params: { username: "benjito" },
                isExact: null,
                path: null,
                url: null,
            }}
            history={null}
            location={null}
        />, container)
    );

    expect(requests.get).toHaveBeenCalledTimes(0);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0].match.params.user_id).toBe("12345");
});

test('Renders User page if not found', async() => {
    // Mocking this because no easy way to clear and update player_cache without
    // API fetches
    jest.spyOn(player_cache, "lookup_by_username")
        .mockImplementation(() => { return null; });
    jest.spyOn(requests, "get")
        .mockImplementation(() => {
            return Promise.resolve({results: [{id: 12345}]});
        });

    await act(async() =>
        render(<UserByName
            match={{
                params: { username: "benjito" },
                isExact: null,
                path: null,
                url: null,
            }}
            history={null}
            location={null}
        />, container)
    );

    expect(requests.get).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0].match.params.user_id).toBe("12345");
});

test('Displays user not found if not found.', async() => {
    // Mocking this because no easy way to clear and update player_cache without
    // API fetches
    jest.spyOn(player_cache, "lookup_by_username")
        .mockImplementation(() => { return null; });
    jest.spyOn(requests, "get")
        .mockImplementation(() => { return Promise.resolve({results: []}); });

    await act(async() =>
        render(<UserByName
            match={{
                params: { username: "benjito" },
                isExact: null,
                path: null,
                url: null,
            }}
            history={null}
            location={null}
        />, container)
    );

    expect(requests.get).toHaveBeenCalledWith("players", {username: "benjito"});
    expect(container.children).toHaveLength(1);
    expect(container.children[0].className).toBe("UserMock");
    expect((User as jest.Mock).mock.calls[0][0].match.params.user_id).toBe("-1");
});
