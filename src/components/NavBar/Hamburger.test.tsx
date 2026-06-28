/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Hamburger } from "./Hamburger";

jest.mock("@/lib/translate", () => ({
    _: (text: string) => text,
}));

describe("Hamburger", () => {
    it("renders the menu button and home link in the closed state", () => {
        render(
            <MemoryRouter>
                <Hamburger open={false} onClick={jest.fn()} />
            </MemoryRouter>,
        );

        const menuButton = screen.getByRole("button", { name: "Menu" });
        const homeLink = screen.getByRole("link", { name: "Home" });

        expect(menuButton).toHaveAttribute("aria-expanded", "false");
        expect(homeLink).toHaveClass("hamburger__logo");
        expect(homeLink).not.toHaveClass("hamburger__logo--hidden");
    });

    it("marks the home logo hidden when open", () => {
        render(
            <MemoryRouter>
                <Hamburger open={true} onClick={jest.fn()} />
            </MemoryRouter>,
        );

        expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        expect(screen.getByRole("link", { name: "Home" })).toHaveClass("hamburger__logo--hidden");
    });

    it("calls onClick when the menu button is pressed", () => {
        const onClick = jest.fn();

        render(
            <MemoryRouter>
                <Hamburger open={false} onClick={onClick} />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Menu" }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
