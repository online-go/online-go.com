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
import { act, fireEvent, render, screen } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import { GobanView, GobanViewRef } from "./GobanView";
import { useGobanViewLayout } from "./GobanViewLayoutContext";
import { fakeController, restoreWindowSize, setWindow } from "./test_helpers";
import type {
    ActionButtonsPosition,
    GobanViewBoardAlignment,
    MoveControlsPosition,
} from "./layout";

jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("./MoveNumberControl", () => ({
    __esModule: true,
    MoveNumberControl: () => <div data-testid="slider" />,
}));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

afterEach(() => {
    restoreWindowSize();
    preferences.set("goban-view-action-buttons", "bar");
    preferences.set("goban-view-mobile-scroll", false);
});

function renderWide(props: Partial<React.ComponentProps<typeof GobanView>> = {}) {
    setWindow(2560, 1300);
    return render(
        <GobanView controller={fakeController()} playerBars {...props}>
            <GobanView.Tab id="settings" type="action" icon="gear" title="Settings" />
        </GobanView>,
    );
}

function renderPhone(props: Partial<React.ComponentProps<typeof GobanView>> = {}) {
    setWindow(400, 800);
    return render(
        <GobanView controller={fakeController()} {...props}>
            <GobanView.Tab id="settings" type="action" icon="gear" title="Settings" />
        </GobanView>,
    );
}

function Probe(): React.ReactElement {
    const layout = useGobanViewLayout();
    return (
        <div data-testid="probe" data-dock={String(layout.actionDock)} data-mode={layout.mode} />
    );
}

test("children read the resolved layout", () => {
    setWindow(2560, 1300);
    preferences.set("goban-view-action-buttons", "dock");
    render(
        <GobanView controller={fakeController()} playerBars actionDock={<div />}>
            <GobanView.Tab id="main" type="always">
                <Probe />
            </GobanView.Tab>
        </GobanView>,
    );
    expect(screen.getByTestId("probe").dataset.mode).toBe("fullHorizontal");
    expect(screen.getByTestId("probe").dataset.dock).toBe("true");
});

test.each<[ActionButtonsPosition, string]>([
    ["bar", "false"],
    ["dock", "true"],
])("the stored position %s reaches the resolver as dock=%s", (stored, dock) => {
    setWindow(2560, 1300);
    preferences.set("goban-view-action-buttons", stored);
    render(
        <GobanView controller={fakeController()} playerBars actionDock={<div />}>
            <GobanView.Tab id="main" type="always">
                <Probe />
            </GobanView.Tab>
        </GobanView>,
    );
    expect(screen.getByTestId("probe").dataset.dock).toBe(dock);
});

test("useGobanViewLayout throws outside a GobanView", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow();
});

test("the dock renders beside the sidebar and replaces the tab bar", () => {
    preferences.set("goban-view-action-buttons", "dock");
    const { container } = renderWide({ actionDock: <button>Row</button> });
    const dock = container.querySelector(".GobanView-action-dock");
    expect(dock).not.toBeNull();
    expect(dock?.previousElementSibling?.classList.contains("GobanView-sidebar")).toBe(true);
    expect(container.querySelector(".GobanView-action-dock-panel > button")?.textContent).toBe(
        "Row",
    );
    expect(container.querySelector(".GobanView-tab-bar")).toBeNull();
    expect(container.querySelector(".GobanView")?.classList.contains("has-action-dock")).toBe(true);
});

test("the tab bar stays when the view gives no dock content", () => {
    preferences.set("goban-view-action-buttons", "dock");
    const { container } = renderWide();
    expect(container.querySelector(".GobanView-action-dock")).toBeNull();
    expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
});

test("the tab bar stays when the action buttons are in the bar", () => {
    preferences.set("goban-view-action-buttons", "bar");
    const { container } = renderWide({ actionDock: <button>Row</button> });
    expect(container.querySelector(".GobanView-action-dock")).toBeNull();
    expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
});

describe("move controls position", () => {
    afterEach(() => {
        preferences.set("goban-view-move-controls", "docked");
    });

    test("docked move controls stay in the sidebar", () => {
        const { container } = renderWide();
        expect(container.querySelector(".GobanView-sidebar [data-testid=slider]")).not.toBeNull();
    });

    test("under-board move controls go in the stage directly after the board", () => {
        preferences.set("goban-view-move-controls", "under-board");
        const { container } = renderWide();
        const slider = container.querySelector(".GobanView-stage [data-testid=slider]");
        expect(slider).not.toBeNull();
        // renderWide() has player bars, so the board itself (not
        // .GobanView-center, which wraps the whole stage here) is the
        // slider's immediate predecessor; the bottom player bar follows.
        expect(slider?.previousElementSibling?.getAttribute("data-testid")).toBe("goban-container");
        expect(container.querySelector(".GobanView-sidebar [data-testid=slider]")).toBeNull();
    });

    test("under-board marks the root for the board inset only when the controls render", () => {
        preferences.set("goban-view-move-controls", "under-board");
        const { container: shown } = renderWide();
        expect(
            shown.querySelector(".GobanView")?.classList.contains("has-move-controls-under-board"),
        ).toBe(true);

        const { container: hidden } = renderWide({ hideSlider: true });
        expect(hidden.querySelector("[data-testid=slider]")).toBeNull();
        expect(
            hidden.querySelector(".GobanView")?.classList.contains("has-move-controls-under-board"),
        ).toBe(false);
    });

    test("under-board works in compactHorizontal, which has no player bars", () => {
        preferences.set("goban-view-move-controls", "under-board");
        setWindow(900, 500);
        const { container } = render(
            <GobanView controller={fakeController()} playerBars>
                <div />
            </GobanView>,
        );
        expect(container.querySelector(".GobanView-stage [data-testid=slider]")).not.toBeNull();
    });

    test("under-board in portrait puts the controls above the bottom player card", () => {
        preferences.set("goban-view-move-controls", "under-board");
        setWindow(400, 800);
        const { container } = render(
            <GobanView controller={fakeController()} belowBoard={<div data-testid="below" />}>
                <div />
            </GobanView>,
        );
        const slider = container.querySelector(".GobanView-stage [data-testid=slider]");
        expect(slider).not.toBeNull();
        expect(slider?.previousElementSibling?.classList.contains("GobanView-center")).toBe(true);
    });
});

describe("mobile scrolling mode", () => {
    test("scrolling mode lists the actions at the end and drops the tab bar", () => {
        preferences.set("goban-view-mobile-scroll", true);
        const { container } = renderPhone({ actionDock: <button>Row</button> });
        expect(container.querySelector(".GobanView")?.classList.contains("has-mobile-scroll")).toBe(
            true,
        );
        const list = container.querySelector(".GobanView-mobile-panels > .GobanView-action-list");
        expect(list?.textContent).toBe("Row");
        expect(list?.nextElementSibling).toBeNull();
        expect(container.querySelector(".GobanView-tab-bar")).toBeNull();
    });

    test("scrolling mode keeps the tab bar when the view gives no list", () => {
        preferences.set("goban-view-mobile-scroll", true);
        const { container } = renderPhone();
        expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
    });

    test("has-action-list marks the root only when the list replaces the tab bar", () => {
        preferences.set("goban-view-mobile-scroll", true);
        const { container: withDock } = renderPhone({ actionDock: <button>Row</button> });
        expect(withDock.querySelector(".GobanView")?.classList.contains("has-action-list")).toBe(
            true,
        );

        const { container: withoutDock } = renderPhone();
        expect(withoutDock.querySelector(".GobanView")?.classList.contains("has-action-list")).toBe(
            false,
        );
    });

    test("scrolling mode shows the move controls even when hideSlider is when-cramped", () => {
        preferences.set("goban-view-mobile-scroll", true);
        const { container } = renderPhone({ hideSlider: "when-cramped" });
        expect(container.querySelector(".GobanView-stage [data-testid=slider]")).not.toBeNull();
    });

    test("zen mode still hides the move controls in scrolling mode", () => {
        preferences.set("goban-view-mobile-scroll", true);
        const { container } = renderPhone({ hideSlider: true });
        expect(container.querySelector("[data-testid=slider]")).toBeNull();
    });

    test("the non-scrolling layout does not render the list", () => {
        const { container } = renderPhone({ actionDock: <button>Row</button> });
        expect(container.querySelector(".GobanView-action-list")).toBeNull();
        expect(container.querySelector(".GobanView-tab-bar")).not.toBeNull();
    });
});

describe("the landscape board stage", () => {
    afterEach(() => {
        preferences.set("goban-view-move-controls", "docked");
    });

    test("wraps the board with no player bars and docked move controls", () => {
        setWindow(2560, 1300);
        const { container } = render(
            <GobanView controller={fakeController()}>
                <div />
            </GobanView>,
        );
        expect(
            container.querySelector(
                ".GobanView-center > .GobanView-stage > [data-testid=goban-container]",
            ),
        ).not.toBeNull();
    });

    test("is left out without a board, so the placeholder fills the column", () => {
        setWindow(2560, 1300);
        const { container } = render(
            <GobanView controller={null} centerPlaceholder={<p data-testid="placeholder" />}>
                <div />
            </GobanView>,
        );
        expect(container.querySelector(".GobanView-stage")).toBeNull();
        expect(
            container.querySelector(".GobanView-center > [data-testid=placeholder]"),
        ).not.toBeNull();
    });
});

/** What the layout of a GobanView consists of: the root classes, and where
 *  the board and the move controls are. */
function layoutState(container: HTMLElement) {
    const root = container.querySelector(".GobanView");
    const slider = container.querySelector("[data-testid=slider]");
    return {
        classes: root?.className,
        stage: Array.from(
            container.querySelector(".GobanView-center > .GobanView-stage")?.children ?? [],
        ).map((child) => child.getAttribute("data-testid") ?? child.className),
        slider: slider?.parentElement?.className ?? null,
    };
}

const alignments: GobanViewBoardAlignment[] = ["window", "container", "group"];
const positions: MoveControlsPosition[] = ["docked", "under-board"];
const cases = alignments.flatMap((a) => positions.map((p) => [a, p] as const));

describe("a takeover does not change the layout", () => {
    afterEach(() => {
        preferences.set("goban-view-move-controls", "docked");
        preferences.set("goban-view-board-alignment", "container");
    });

    test.each(cases)(
        "Game: the settings takeover opened from the popover keeps %s, %s",
        (alignment, position) => {
            preferences.set("goban-view-board-alignment", alignment);
            preferences.set("goban-view-move-controls", position);
            setWindow(1920, 1080);
            const ref = React.createRef<GobanViewRef>();
            const { container } = render(
                <GobanView ref={ref} controller={fakeController()} className="Game">
                    <GobanView.Tab id="main" type="always">
                        <div />
                    </GobanView.Tab>
                    <GobanView.Tab id="game-more-settings" type="takeover" hideFromBar>
                        <div data-testid="more-settings" />
                    </GobanView.Tab>
                </GobanView>,
            );
            const before = layoutState(container);
            expect(before.classes).toContain(`board-align-${alignment}`);

            act(() => ref.current?.setActiveTakeover("game-more-settings"));

            expect(
                screen.getByTestId("more-settings").closest(".GobanView-tab-panel.active"),
            ).not.toBeNull();
            const after = layoutState(container);
            expect(after.classes).toBe(before.classes);
            expect(after.stage).toEqual(before.stage);
            if (position === "under-board") {
                expect(after.slider).toBe("GobanView-stage");
            }
        },
    );

    test.each(cases)(
        "Puzzle: the settings takeover opened from the tab bar keeps %s, %s",
        (alignment, position) => {
            preferences.set("goban-view-board-alignment", alignment);
            preferences.set("goban-view-move-controls", position);
            setWindow(1920, 1080);
            const { container } = render(
                <GobanView controller={fakeController()} className="Puzzle">
                    <GobanView.Tab
                        id="puzzle-settings"
                        icon="gear"
                        type="takeover"
                        title="Puzzle settings"
                    >
                        <div data-testid="puzzle-settings" />
                    </GobanView.Tab>
                    <GobanView.Tab id="puzzle-controls" type="always">
                        <div />
                    </GobanView.Tab>
                </GobanView>,
            );
            const before = layoutState(container);
            expect(before.classes).toContain(`board-align-${alignment}`);

            fireEvent.click(screen.getByTitle("Puzzle settings"));

            expect(
                screen.getByTestId("puzzle-settings").closest(".GobanView-tab-panel.active"),
            ).not.toBeNull();
            const after = layoutState(container);
            expect(after.classes).toBe(before.classes);
            expect(after.stage).toEqual(before.stage);
            if (position === "under-board") {
                expect(after.slider).toBe("GobanView-stage");
            }
        },
    );

    test("the docked move controls still give their place in the sidebar to a takeover", () => {
        setWindow(1920, 1080);
        const ref = React.createRef<GobanViewRef>();
        const { container } = render(
            <GobanView ref={ref} controller={fakeController()}>
                <GobanView.Tab id="settings" type="takeover" hideFromBar>
                    <div />
                </GobanView.Tab>
            </GobanView>,
        );
        expect(container.querySelector(".GobanView-sidebar [data-testid=slider]")).not.toBeNull();
        act(() => ref.current?.setActiveTakeover("settings"));
        expect(container.querySelector("[data-testid=slider]")).toBeNull();
    });

    test("portrait: a takeover that keeps the board visible keeps the docked move controls", () => {
        setWindow(400, 800);
        const ref = React.createRef<GobanViewRef>();
        const { container } = render(
            <GobanView ref={ref} controller={fakeController()}>
                <GobanView.Tab id="edit" type="takeover" hideFromBar keepGobanVisible>
                    <div />
                </GobanView.Tab>
            </GobanView>,
        );
        const before = layoutState(container);
        expect(before.slider).toContain("GobanView portrait");
        act(() => ref.current?.setActiveTakeover("edit"));
        expect(layoutState(container)).toEqual(before);
    });

    test("portrait: a takeover that covers the view hides the docked move controls", () => {
        setWindow(400, 800);
        const ref = React.createRef<GobanViewRef>();
        const { container } = render(
            <GobanView ref={ref} controller={fakeController()}>
                <GobanView.Tab id="settings" type="takeover" hideFromBar>
                    <div />
                </GobanView.Tab>
            </GobanView>,
        );
        const before = layoutState(container);
        act(() => ref.current?.setActiveTakeover("settings"));
        const after = layoutState(container);
        expect(after.slider).toBeNull();
        expect(after.classes).toBe(before.classes);
    });
});

test.each([
    [2560, 1300, false],
    [900, 500, true],
])(
    "sidebarContentBefore shows only in compactHorizontal (%sx%s: %s), so views pass it in every mode",
    (width, height, shown) => {
        setWindow(width, height);
        render(
            <GobanView
                controller={fakeController()}
                sidebarContentBefore={<p data-testid="before" />}
            >
                <div />
            </GobanView>,
        );
        expect(screen.queryByTestId("before") !== null).toBe(shown);
    },
);

describe("the wheel over the board", () => {
    test.each([
        ["docked", false],
        ["under-board", false],
        ["docked", true],
    ] as const)(
        "landscape (%s, player bars %s): the center column outside the board calls onWheel once",
        (position, bars) => {
            preferences.set("goban-view-move-controls", position);
            setWindow(1920, 1080);
            const onWheel = jest.fn();
            const { container } = render(
                <GobanView controller={fakeController()} playerBars={bars} onWheel={onWheel}>
                    <div />
                </GobanView>,
            );
            const center = container.querySelector(".GobanView-center");
            expect(center).not.toBeNull();
            fireEvent.wheel(center!, { deltaY: 100 });
            expect(onWheel).toHaveBeenCalledTimes(1);
            fireEvent.wheel(screen.getByTestId("goban-container"), { deltaY: 100 });
            expect(onWheel).toHaveBeenCalledTimes(2);
            preferences.set("goban-view-move-controls", "docked");
        },
    );
});

describe("landscape: the stage holds the move controls if and only if the root reserves their row", () => {
    afterEach(() => {
        preferences.set("goban-view-move-controls", "docked");
    });

    const hideSliders = [false, true, "when-cramped"] as const;
    const combinations = positions.flatMap((position) =>
        hideSliders.flatMap((hideSlider) =>
            [false, true].flatMap((custom) =>
                [false, true].map((board) => [position, hideSlider, custom, board] as const),
            ),
        ),
    );

    test.each(combinations)(
        "position %s, hideSlider %s, customSlider %s, board %s",
        (position, hideSlider, custom, board) => {
            preferences.set("goban-view-move-controls", position);
            setWindow(1920, 1080);
            const { container } = render(
                <GobanView
                    controller={board ? fakeController() : null}
                    hideSlider={hideSlider}
                    customSlider={custom ? <div data-testid="custom-slider" /> : undefined}
                >
                    <div />
                </GobanView>,
            );
            const inStage =
                container.querySelector(".GobanView-stage > [data-testid=slider]") !== null;
            const reserved =
                container
                    .querySelector(".GobanView")
                    ?.classList.contains("has-move-controls-under-board") ?? false;
            expect(inStage).toBe(reserved);
            expect(reserved).toBe(
                position === "under-board" && hideSlider !== true && !custom && board,
            );
        },
    );
});
