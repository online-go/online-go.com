/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { KibitzMoreActionsPopover } from "./KibitzMoreActionsPopover";

jest.mock("@/lib/hooks", () => ({ useUser: () => ({ anonymous: false, id: 1 }) }));
jest.mock("@/lib/requests", () => ({ api1: (path: string) => path }));
jest.mock("@/lib/misc", () => ({ rulesText: () => "Japanese" }));

describe("KibitzMoreActionsPopover continuation action", () => {
    test.each([
        { title: "Continue in new room", creating: false, disabled: false, icon: "fa-comments" },
        {
            title: "Join continuation room (3)",
            creating: false,
            disabled: false,
            icon: "fa-comments",
        },
        { title: "Creating room…", creating: true, disabled: true, icon: "fa-spinner fa-spin" },
    ])("renders $title in the menu", ({ title, creating, disabled, icon }) => {
        render(
            <KibitzMoreActionsPopover
                controller={null}
                continuationAction={{ title, creating, onActivate: jest.fn() }}
                onClose={jest.fn()}
            />,
        );

        const action = screen.getByRole("button", { name: title });
        expect(action).toHaveProperty("disabled", disabled);
        expect(action.querySelector("i")).toHaveClass("fa", ...icon.split(" "));
    });
});
