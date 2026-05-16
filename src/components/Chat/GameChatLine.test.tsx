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
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GameChatLine } from "./GameChatLine";

describe("GameChatLine", () => {
    it("renders translated chat bodies using the english fallback text", () => {
        const line: React.ComponentProps<typeof GameChatLine>["line"] = {
            chat_id: "chat-1",
            body: {
                type: "translated",
                en: "Thank you for the game!",
            },
            date: 1715600000,
            move_number: 1,
            channel: "main",
            player_id: 0,
            username: "Oroton", // cspell: ignore Oroton
        };

        render(<GameChatLine line={line} />);

        expect(screen.getByText("Thank you for the game!")).toBeInTheDocument();
    });
});
