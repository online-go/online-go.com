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
import { fireEvent, render } from "@testing-library/react";
import { BanDetails } from "./BanModal";

jest.mock("@/lib/translate", () => ({
    _: (msgid: string) => msgid,
    pgettext: (_context: string, msgid: string) => msgid,
    interpolate: (msgid: string) => msgid,
}));

/* The Date constructor's multi-argument form builds a local-time date, and the
 * expiration field is local wall-clock, so these expectations hold in any timezone. */

function expirationInput(container: HTMLElement): HTMLInputElement {
    const input = container.querySelector('input[type="datetime-local"]');
    if (!input) {
        throw new Error("expiration input not found");
    }
    return input as HTMLInputElement;
}

describe("BanDetails", () => {
    test("reports no expiration while the field is blank", () => {
        const onChange = jest.fn();

        render(<BanDetails onChange={onChange} />);

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: undefined,
        });
    });

    test("reports the chosen expiration as a local-time Date", () => {
        const onChange = jest.fn();
        const { container } = render(<BanDetails onChange={onChange} />);

        fireEvent.change(expirationInput(container), { target: { value: "2026-08-02T15:04" } });

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: new Date(2026, 7, 2, 15, 4),
        });
    });

    test("returns to no expiration when the field is cleared", () => {
        const onChange = jest.fn();
        const { container } = render(<BanDetails onChange={onChange} />);

        fireEvent.change(expirationInput(container), { target: { value: "2026-08-02T15:04" } });
        fireEvent.change(expirationInput(container), { target: { value: "" } });

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: undefined,
        });
    });
});
