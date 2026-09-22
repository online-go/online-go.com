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

    test("shows the rule set above the stones", () => {
        render(<CompactTurnStones to_move="black" move_number={34} rules="japanese" />);
        expect(screen.getByText("Japanese").closest(".CompactTurnStones-rules")).not.toBeNull();
    });

    test("shows the handicap next to the rule set", () => {
        render(<CompactTurnStones to_move="white" move_number={0} rules="japanese" handicap={2} />);
        expect(screen.getByTitle("Handicap: 2")).toHaveTextContent("\u2461");
        expect(screen.getByTitle("Handicap: 2").parentElement).toBe(
            screen.getByText("Japanese").parentElement,
        );
    });

    test("omits the handicap in an even game", () => {
        const { container } = render(
            <CompactTurnStones to_move="black" move_number={0} rules="japanese" handicap={0} />,
        );
        expect(container.querySelector(".CompactTurnStones-handicap")).toBeNull();
    });

    test("shows the komi on its own line under the rule set", () => {
        const { container } = render(
            <CompactTurnStones to_move="black" move_number={0} rules="japanese" komi={6.5} />,
        );
        const komi = container.querySelector(".CompactTurnStones-komi");
        expect(komi).toHaveTextContent("Komi 6.5");
        expect(komi?.previousElementSibling).toHaveClass("CompactTurnStones-rules");
        expect(komi?.nextElementSibling).toHaveClass("CompactTurnStones-stones");
    });

    test("omits the komi when there is none", () => {
        const { container } = render(
            <CompactTurnStones to_move="black" move_number={0} rules="japanese" komi={0} />,
        );
        expect(container.querySelector(".CompactTurnStones-komi")).toBeNull();
    });

    test("omits the rule set when it is not known", () => {
        const { container } = render(
            <CompactTurnStones to_move="black" move_number={34} rules="bogus" />,
        );
        expect(container.querySelector(".CompactTurnStones-rules")).toBeNull();
    });
});
