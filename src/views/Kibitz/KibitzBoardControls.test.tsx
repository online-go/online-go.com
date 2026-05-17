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
import { GobanController } from "@/lib/GobanController";
import { KibitzBoardControls } from "./KibitzBoardControls";

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
}));

function makeController(): GobanController {
    return {
        goban: {
            engine: {
                isLastOfficialMove: jest.fn(() => true),
            },
            on: jest.fn(),
            off: jest.fn(),
        },
        gotoFirstMove: jest.fn(),
        previousMove: jest.fn(),
        nextMove: jest.fn(),
        gotoLastMove: jest.fn(),
        setMoveTreeContainer: jest.fn(),
    } as unknown as GobanController;
}

describe("KibitzBoardControls", () => {
    it("shows the unknown move placeholder in full layout until the move count is known", () => {
        render(<KibitzBoardControls controller={makeController()} variant="full" />);

        expect(screen.getByText("Move …")).toBeInTheDocument();
        expect(screen.queryByText("Move undefined")).toBeNull();
    });
});
