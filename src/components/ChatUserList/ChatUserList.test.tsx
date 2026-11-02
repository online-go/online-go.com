/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { ChatUserList } from "./ChatUserList";

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    chat_manager: {
        join: jest.fn(() => ({
            on: jest.fn(),
            part: jest.fn(),
            channel: { users_by_name: [{ id: 1 }], users_by_rank: [{ id: 1 }] },
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
    Player: () => <span data-testid="player" />,
}));

describe("ChatUserList", () => {
    it("renders the footer after the user entries", () => {
        render(<ChatUserList channel="game-1" footer={<span data-testid="footer" />} />);
        const footer = screen.getByTestId("footer");
        const player = screen.getByTestId("player");
        expect(footer.closest(".user-list-footer")).not.toBeNull();
        expect(
            player.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it("renders no footer wrapper without a footer", () => {
        render(<ChatUserList channel="game-1" />);
        expect(document.querySelector(".user-list-footer")).toBeNull();
    });
});
