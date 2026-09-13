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
import { CompactTurnStones } from "./CompactTurnStones";

describe("CompactTurnStones", () => {
    test("puts the black stone on top when black is to move", () => {
        render(<CompactTurnStones to_move="black" move_number={34} />);
        expect(screen.getByTestId("compact-stone-black")).toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-white")).not.toHaveClass("on-top");
    });

    test("puts the white stone on top when white is to move", () => {
        render(<CompactTurnStones to_move="white" move_number={34} />);
        expect(screen.getByTestId("compact-stone-white")).toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
    });

    test("leaves both stones level when nobody is to move", () => {
        render(<CompactTurnStones to_move={null} move_number={34} />);
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-white")).not.toHaveClass("on-top");
    });

    test("shows the move number under the stones", () => {
        render(<CompactTurnStones to_move="black" move_number={34} />);
        expect(screen.getByText("34")).toBeInTheDocument();
    });

    test("omits the move number when there is no move to number", () => {
        const { container } = render(<CompactTurnStones to_move={null} move_number={-1} />);
        expect(container.querySelector(".CompactTurnStones-move-number")).toBeNull();
    });
});
