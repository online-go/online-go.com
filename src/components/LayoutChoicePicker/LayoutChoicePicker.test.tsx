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
import { LayoutChoicePicker } from "./LayoutChoicePicker";
import type { LayoutChoice } from "./LayoutChoicePicker";

type Side = "left" | "right";

const OPTIONS: [LayoutChoice<Side>, LayoutChoice<Side>] = [
    { value: "left", label: "Left side", illustration: <svg data-testid="left-art" /> },
    { value: "right", label: "Right side", illustration: <svg data-testid="right-art" /> },
];

function renderPicker(value: Side, onChange: (value: Side) => void = jest.fn()) {
    return render(
        <LayoutChoicePicker title="Side" value={value} options={OPTIONS} onChange={onChange} />,
    );
}

test("renders a titled radio group with one radio per choice", () => {
    renderPicker("left");

    const group = screen.getByRole("radiogroup", { name: "Side" });
    expect(group).not.toBeNull();
    expect(screen.getByText("Side")).not.toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Left side" })).not.toBeNull();
    expect(screen.getByRole("radio", { name: "Right side" })).not.toBeNull();
    expect(screen.getByTestId("left-art")).not.toBeNull();
});

test("the radio group is labelled by the visible title", () => {
    renderPicker("left");

    const group = screen.getByRole("radiogroup", { name: "Side" });
    const title_id = group.getAttribute("aria-labelledby");
    expect(title_id).toBeTruthy();
    expect(document.getElementById(title_id!)).toHaveTextContent("Side");
    expect(group).not.toHaveAttribute("aria-label");
    expect(group).not.toHaveAttribute("aria-describedby");
});

test("hideTitle keeps the accessible name but visually hides the title", () => {
    render(
        <LayoutChoicePicker
            title="Side"
            value="left"
            options={OPTIONS}
            onChange={jest.fn()}
            hideTitle={true}
        />,
    );

    const group = screen.getByRole("radiogroup", { name: "Side" });
    const title_id = group.getAttribute("aria-labelledby");
    const title = document.getElementById(title_id!);
    expect(title).toHaveTextContent("Side");
    expect(title).toHaveClass("sr-only");
});

test("marks the current value as checked", () => {
    renderPicker("right");

    expect(screen.getByRole("radio", { name: "Left side" })).toHaveAttribute(
        "aria-checked",
        "false",
    );
    expect(screen.getByRole("radio", { name: "Right side" })).toHaveAttribute(
        "aria-checked",
        "true",
    );
});

test("a click on the other choice calls onChange with its value", () => {
    const onChange = jest.fn();
    renderPicker("left", onChange);

    fireEvent.click(screen.getByRole("radio", { name: "Right side" }));

    expect(onChange).toHaveBeenCalledWith("right");
});

test("only the checked radio is in the tab order", () => {
    renderPicker("right");

    expect(screen.getByRole("radio", { name: "Left side" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: "Right side" })).toHaveAttribute("tabindex", "0");
});

test("ArrowRight moves to the next choice, selects it and focuses it", () => {
    const onChange = jest.fn();
    renderPicker("left", onChange);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Left side" }), { key: "ArrowRight" });

    expect(onChange).toHaveBeenCalledWith("right");
    expect(screen.getByRole("radio", { name: "Right side" })).toHaveFocus();
});

test("ArrowLeft moves to the previous choice and selects it", () => {
    const onChange = jest.fn();
    renderPicker("right", onChange);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Right side" }), { key: "ArrowLeft" });

    expect(onChange).toHaveBeenCalledWith("left");
    expect(screen.getByRole("radio", { name: "Left side" })).toHaveFocus();
});

test("ArrowDown and ArrowUp also move the selection, and wrap", () => {
    const onChange = jest.fn();
    renderPicker("right", onChange);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Right side" }), { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith("left");

    fireEvent.keyDown(screen.getByRole("radio", { name: "Right side" }), { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("left");
});

test("Space selects the focused choice", () => {
    const onChange = jest.fn();
    renderPicker("left", onChange);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Right side" }), { key: " " });

    expect(onChange).toHaveBeenCalledWith("right");
});

test("Enter selects the focused choice", () => {
    const onChange = jest.fn();
    renderPicker("left", onChange);

    fireEvent.keyDown(screen.getByRole("radio", { name: "Right side" }), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("right");
});

test("when no choice matches the value, none is checked and the first is the tab stop", () => {
    renderPicker("middle" as Side);

    const left = screen.getByRole("radio", { name: "Left side" });
    const right = screen.getByRole("radio", { name: "Right side" });
    expect(left).toHaveAttribute("aria-checked", "false");
    expect(right).toHaveAttribute("aria-checked", "false");
    expect(left).toHaveAttribute("tabindex", "0");
    expect(right).toHaveAttribute("tabindex", "-1");
});

test("works with boolean values", () => {
    const onChange = jest.fn();
    render(
        <LayoutChoicePicker
            title="Chat column"
            value={false}
            options={[
                { value: false, label: "Off", illustration: null },
                { value: true, label: "On", illustration: null },
            ]}
            onChange={onChange}
        />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "On" }));

    expect(onChange).toHaveBeenCalledWith(true);
});

describe("three choices", () => {
    type Spot = "window" | "container" | "group";

    const THREE: readonly [LayoutChoice<Spot>, LayoutChoice<Spot>, LayoutChoice<Spot>] = [
        { value: "window", label: "Window", illustration: null },
        { value: "container", label: "Container", illustration: null },
        { value: "group", label: "Group", illustration: null },
    ];

    function renderThree(value: Spot, onChange: (value: Spot) => void = jest.fn()) {
        return render(
            <LayoutChoicePicker title="Spot" value={value} options={THREE} onChange={onChange} />,
        );
    }

    test("renders one radio per choice", () => {
        renderThree("window");
        expect(screen.getAllByRole("radio")).toHaveLength(3);
        expect(screen.getByRole("radio", { name: "Container" })).toHaveAttribute(
            "aria-checked",
            "false",
        );
    });

    test("ArrowRight moves through all the choices in order", () => {
        const onChange = jest.fn();
        renderThree("window", onChange);

        fireEvent.keyDown(screen.getByRole("radio", { name: "Window" }), { key: "ArrowRight" });
        expect(onChange).toHaveBeenLastCalledWith("container");
        expect(screen.getByRole("radio", { name: "Container" })).toHaveFocus();

        fireEvent.keyDown(screen.getByRole("radio", { name: "Container" }), { key: "ArrowRight" });
        expect(onChange).toHaveBeenLastCalledWith("group");
        expect(screen.getByRole("radio", { name: "Group" })).toHaveFocus();
    });

    test("ArrowDown from the last choice wraps to the first", () => {
        const onChange = jest.fn();
        renderThree("group", onChange);

        fireEvent.keyDown(screen.getByRole("radio", { name: "Group" }), { key: "ArrowDown" });
        expect(onChange).toHaveBeenLastCalledWith("window");
        expect(screen.getByRole("radio", { name: "Window" })).toHaveFocus();
    });

    test("ArrowLeft from the first choice wraps to the last", () => {
        const onChange = jest.fn();
        renderThree("window", onChange);

        fireEvent.keyDown(screen.getByRole("radio", { name: "Window" }), { key: "ArrowLeft" });
        expect(onChange).toHaveBeenLastCalledWith("group");
        expect(screen.getByRole("radio", { name: "Group" })).toHaveFocus();

        fireEvent.keyDown(screen.getByRole("radio", { name: "Group" }), { key: "ArrowUp" });
        expect(onChange).toHaveBeenLastCalledWith("container");
    });

    test("a click on the middle choice selects it", () => {
        const onChange = jest.fn();
        renderThree("group", onChange);

        fireEvent.click(screen.getByRole("radio", { name: "Container" }));

        expect(onChange).toHaveBeenCalledWith("container");
    });

    test("only the checked radio is in the tab order", () => {
        renderThree("container");
        expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("tabindex"))).toEqual(
            ["-1", "0", "-1"],
        );
    });

    test("the card row is marked with the number of choices", () => {
        const { container } = renderThree("window");
        expect(container.querySelector(".LayoutChoicePicker")).toHaveClass("choices-3");
    });
});
