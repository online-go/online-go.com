/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { ChatUserCount } from "./ChatUserList";

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    chat_manager: {
        join: jest.fn(() => ({
            on: jest.fn(),
            part: jest.fn(),
            channel: { users_by_name: [], users_by_rank: [] },
        })),
    },
}));

jest.mock("@/lib/preferences", () => ({
    __esModule: true,
    get: jest.fn(),
    set: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: jest.fn((text: string) => text),
    interpolate: jest.fn((template: string) => template),
    pgettext: jest.fn((_: string, text: string) => text),
}));

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: () => null,
}));

describe("ChatUserCount", () => {
    it("shows the users icon when there is no kibitz", () => {
        render(<ChatUserCount channel="game-1" onClick={jest.fn()} active={false} />);
        expect(document.querySelector("i.fa-users")).not.toBeNull();
        expect(document.querySelector("svg.KibitzUsersIcon")).toBeNull();
    });

    it("shows the kibitz users icon when has_kibitz is set", () => {
        render(<ChatUserCount channel="game-1" onClick={jest.fn()} active={false} has_kibitz />);
        expect(document.querySelector("svg.KibitzUsersIcon")).not.toBeNull();
        expect(document.querySelector("i.fa-users")).toBeNull();
        expect(screen.getByRole("button")).toHaveAttribute(
            "title",
            "Kibitz rooms are watching this game",
        );
    });
});
