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
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TabCompleteInput } from "./TabCompleteInput";

describe("TabCompleteInput", () => {
    it("fires onKeyPress and prevents default on a plain Enter", () => {
        const onKeyPress = jest.fn();
        render(<TabCompleteInput onKeyPress={onKeyPress} />);

        const input = screen.getByRole("textbox");
        const sent = fireEvent.keyDown(input, { key: "Enter" });

        expect(onKeyPress).toHaveBeenCalledTimes(1);
        // preventDefault was called, so fireEvent returns false
        expect(sent).toBe(false);
    });

    it("does not fire onKeyPress on Enter while IME is composing (isComposing)", () => {
        const onKeyPress = jest.fn();
        render(<TabCompleteInput onKeyPress={onKeyPress} />);

        const input = screen.getByRole("textbox");
        // Confirming a Japanese / Chinese / Korean IME candidate also produces
        // a keydown Enter — but with isComposing === true. The chat input must
        // not send the message in this case, and must not preventDefault
        // (otherwise the IME confirmation itself would be swallowed).
        const sent = fireEvent.keyDown(input, { key: "Enter", isComposing: true });

        expect(onKeyPress).not.toHaveBeenCalled();
        expect(sent).toBe(true);
    });

    it("does not fire onKeyPress on Enter while IME is composing (keyCode 229 fallback)", () => {
        const onKeyPress = jest.fn();
        render(<TabCompleteInput onKeyPress={onKeyPress} />);

        const input = screen.getByRole("textbox");
        // Older Safari fires keydown with keyCode === 229 during IME
        // composition without setting isComposing. Guard against this too.
        const sent = fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });

        expect(onKeyPress).not.toHaveBeenCalled();
        expect(sent).toBe(true);
    });
});
