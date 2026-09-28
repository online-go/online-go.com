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

import { act, render, fireEvent, screen } from "@testing-library/react";
import * as React from "react";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { GobanControllerContext } from "./goban_context";
import { GobanController } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import { sfx } from "@/lib/sfx";
import { openGameKeyboardShortcutsModal } from "./GameKeyboardShortcutsModal";

jest.mock("@/components/GobanThemePicker/GobanThemePicker", () => ({
    GobanThemePicker: () => null,
}));

jest.mock("./GameKeyboardShortcutsModal", () => ({
    openGameKeyboardShortcutsModal: jest.fn(),
}));

function renderPanel(
    controller: GobanController,
    props: React.ComponentProps<typeof GameSettingsPanel> = {},
) {
    return render(
        <GobanControllerContext.Provider value={controller}>
            <GameSettingsPanel {...props} />
        </GobanControllerContext.Provider>,
    );
}

test("the compact (mobile) panel turns on zen mode and closes", () => {
    const controller = new GobanController({ game_id: 123456 });
    const onClose = jest.fn();

    const { container } = renderPanel(controller, { compact: true, onClose });

    const zen_toggle = container.querySelector("#game-settings-zen-mode");
    expect(zen_toggle).not.toBeNull();

    fireEvent.click(zen_toggle!);

    expect(controller.zen_mode).toBe(true);
    expect(onClose).toHaveBeenCalled();
});

test("the compact (mobile) panel leaves out the landscape-only board alignment", () => {
    const controller = new GobanController({ game_id: 123456 });

    renderPanel(controller, { compact: true });

    expect(screen.queryByRole("radiogroup", { name: "Board alignment" })).toBeNull();
    expect(screen.queryByLabelText("Board alignment")).toBeNull();
});

function renderSettings(props: React.ComponentProps<typeof GameSettingsPanel> = {}) {
    const controller = new GobanController({ game_id: 123456 });
    return renderPanel(controller, props);
}

describe("layout group", () => {
    afterEach(() => {
        preferences.set("goban-view-action-buttons", "bar");
        preferences.set("game.chat-column", false);
        preferences.set("goban-view-mobile-scroll", false);
        preferences.set("goban-view-move-controls", "docked");
        preferences.set("goban-view-board-alignment", "container");
    });

    test("desktop shows the action buttons, chat column and move controls pickers", () => {
        renderSettings({ compact: false });
        expect(screen.getByRole("radiogroup", { name: "Action buttons" })).not.toBeNull();
        expect(screen.getByRole("radiogroup", { name: "Chat column" })).not.toBeNull();
        expect(screen.getByRole("radiogroup", { name: "Move controls" })).not.toBeNull();
        expect(screen.queryByRole("radiogroup", { name: "Scrolling layout" })).toBeNull();
    });

    test("desktop shows the pickers in the order action buttons, move controls, chat column, board alignment", () => {
        renderSettings({ compact: false });
        const names = screen
            .getAllByRole("radiogroup")
            .map((group) => group.getAttribute("aria-labelledby"))
            .map((id) => document.getElementById(id!)?.textContent);
        expect(names).toEqual([
            "Action buttons",
            "Move controls",
            "Chat column",
            "Board alignment",
        ]);
    });

    test("the board alignment picker has the three alignments in order, with wide drawings", () => {
        renderSettings({ compact: false });
        const group = screen.getByRole("radiogroup", { name: "Board alignment" });
        const labels = Array.from(group.querySelectorAll("[role=radio]")).map(
            (radio) => radio.textContent,
        );
        expect(labels).toEqual([
            "Center in window",
            "Center beside sidebar",
            "Center with sidebar",
        ]);
        expect(group.querySelectorAll("svg.wide")).toHaveLength(3);
        expect(screen.getByRole("radio", { name: "Center beside sidebar" })).toHaveAttribute(
            "aria-checked",
            "true",
        );
    });

    test("an unknown stored alignment selects the alignment GobanView uses", () => {
        preferences.set("goban-view-board-alignment", "bogus" as unknown as "container");
        renderSettings({ compact: false });
        expect(screen.getByRole("radio", { name: "Center beside sidebar" })).toHaveAttribute(
            "aria-checked",
            "true",
        );
    });

    test("choosing an alignment stores it", () => {
        renderSettings({ compact: false });
        fireEvent.click(screen.getByRole("radio", { name: "Center with sidebar" }));
        expect(preferences.get("goban-view-board-alignment")).toBe("group");
        fireEvent.click(screen.getByRole("radio", { name: "Center in window" }));
        expect(preferences.get("goban-view-board-alignment")).toBe("window");
    });

    test("the section headers are the theme and then the layout", () => {
        const { container } = renderSettings({ compact: false, onShowThemeSettings: () => {} });
        const headers = Array.from(
            container.querySelectorAll(".GameSidebarPanel-section-header"),
        ).map((header) => header.textContent);
        expect(headers).toEqual(["Theme", "Layout"]);
    });

    test("mobile shows the scrolling layout and move controls pickers", () => {
        renderSettings({ compact: true });
        expect(screen.getByRole("radiogroup", { name: "Scrolling layout" })).not.toBeNull();
        expect(screen.getByRole("radiogroup", { name: "Move controls" })).not.toBeNull();
        expect(screen.queryByRole("radiogroup", { name: "Action buttons" })).toBeNull();
        expect(screen.queryByRole("radiogroup", { name: "Chat column" })).toBeNull();
    });

    test("the move controls picker draws a phone on mobile and a wide screen on desktop", () => {
        const { unmount } = renderSettings({ compact: true });
        let group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group.querySelectorAll("svg.phone")).toHaveLength(2);
        unmount();

        renderSettings({ compact: false });
        group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group.querySelectorAll("svg.wide")).toHaveLength(2);
    });

    test("choosing the right side stores the dock position", () => {
        renderSettings({ compact: false });
        fireEvent.click(screen.getByRole("radio", { name: "Right side" }));
        expect(preferences.get("goban-view-action-buttons")).toBe("dock");
        expect(screen.getByRole("radio", { name: "Right side" })).toHaveAttribute(
            "aria-checked",
            "true",
        );
    });

    test("choosing the left column turns on the chat column", () => {
        renderSettings({ compact: false });
        fireEvent.click(screen.getByRole("radio", { name: "Left column" }));
        expect(preferences.get("game.chat-column")).toBe(true);
    });

    test("choosing scrolls turns on the scrolling layout", () => {
        renderSettings({ compact: true });
        fireEvent.click(screen.getByRole("radio", { name: "Scrolls" }));
        expect(preferences.get("goban-view-mobile-scroll")).toBe(true);
    });

    test("choosing under the board stores the move controls position", () => {
        renderSettings({ compact: false });
        fireEvent.click(screen.getByRole("radio", { name: "Under the board" }));
        expect(preferences.get("goban-view-move-controls")).toBe("under-board");
    });

    test("mobile with scrolling on disables move controls and shows the note", () => {
        preferences.set("goban-view-mobile-scroll", true);
        renderSettings({ compact: true });

        const group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group).toHaveAttribute("aria-disabled", "true");
        const note = screen.getByText(
            "The scrolling layout always puts the move controls under the board.",
        );
        expect(note).not.toBeNull();
        expect(group).toHaveAttribute("aria-describedby", note.id);

        fireEvent.click(screen.getByRole("radio", { name: "Under the board" }));
        expect(preferences.get("goban-view-move-controls")).toBe("docked");
    });

    test("mobile with scrolling off leaves move controls enabled with no note", () => {
        renderSettings({ compact: true });

        const group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group).not.toHaveAttribute("aria-disabled");
        expect(
            screen.queryByText(
                "The scrolling layout always puts the move controls under the board.",
            ),
        ).toBeNull();
    });

    test("desktop is unaffected by the scrolling layout preference", () => {
        preferences.set("goban-view-mobile-scroll", true);
        renderSettings({ compact: false });

        const group = screen.getByRole("radiogroup", { name: "Move controls" });
        expect(group).not.toHaveAttribute("aria-disabled");
        expect(
            screen.queryByText(
                "The scrolling layout always puts the move controls under the board.",
            ),
        ).toBeNull();
    });
});

describe("more options footer", () => {
    test("the more options row is in a footer after the scrolling body", () => {
        const { container } = renderSettings({ compact: false, onShowThemeSettings: () => {} });
        const body = container.querySelector(".GameSettingsPanel-body")!;
        const footer = container.querySelector(".GameSettingsPanel-footer")!;
        expect(body).not.toBeNull();
        expect(footer).not.toBeNull();

        const more_options = screen.getByRole("button", { name: "More options" });
        expect(footer).toContainElement(more_options);
        expect(body).not.toContainElement(more_options);
        expect(body).toContainElement(container.querySelector(".GameSettingsPanel-layout-pickers"));
        expect(body.nextElementSibling).toBe(footer);
    });

    test("the more options row opens the theme settings and closes the popover", () => {
        const onShowThemeSettings = jest.fn();
        const onClose = jest.fn();
        renderSettings({ compact: true, onShowThemeSettings, onClose });

        fireEvent.click(screen.getByRole("button", { name: "More options" }));

        expect(onShowThemeSettings).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    test("there is no footer without a more options handler", () => {
        const { container } = renderSettings({ compact: false });
        expect(container.querySelector(".GameSettingsPanel-footer")).toBeNull();
        expect(screen.queryByRole("button", { name: "More options" })).toBeNull();
    });
});

describe("keyboard shortcuts link", () => {
    afterEach(() => delete (window as { matchMedia?: unknown }).matchMedia);

    test("opens the shortcuts modal and closes the popover", () => {
        const onClose = jest.fn();
        renderSettings({ onClose });

        fireEvent.click(screen.getByTitle("Keyboard shortcuts"));

        expect(openGameKeyboardShortcutsModal).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("is hidden on touch-only devices", () => {
        const matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: query === "(any-hover: none) and (any-pointer: coarse)",
            media: query,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        }));
        Object.defineProperty(window, "matchMedia", { configurable: true, value: matchMedia });

        renderSettings();

        expect(screen.queryByTitle("Keyboard shortcuts")).toBeNull();
    });
});

describe("volume", () => {
    afterEach(() => sfx.setVolume("master", 1.0));

    test("a volume change made outside the panel shows in the panel", () => {
        sfx.setVolume("master", 0.8);
        renderSettings();
        const slider = screen.getByLabelText("Volume") as HTMLInputElement;
        const icon = screen.getByTitle("Toggle volume");
        expect(slider.value).toBe("0.8");
        expect(icon).toHaveClass("fa-volume-up");

        act(() => sfx.setVolume("master", 0));

        expect(slider.value).toBe("0");
        expect(icon).toHaveClass("fa-volume-off");
    });
});
