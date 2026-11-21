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
import { KibitzStreamPlayer, type KibitzStreamPlayerMode } from "./KibitzStreamPlayer";

jest.mock("@/lib/translate", () => ({
    ...jest.requireActual("@/lib/translate"),
    __esModule: true,
    pgettext: jest.fn((_: string, text: string) => text),
    interpolate: jest.fn((text: string, values: Record<string, string>) =>
        text.replace(/{{(\w+)}}/g, (_m, key: string) => values[key] ?? ""),
    ),
}));

const slotRect = { left: 10, top: 20, width: 400, height: 300 };

function renderPlayer(mode: KibitzStreamPlayerMode, overrides = {}) {
    const props = {
        channel: "gochannel",
        mode,
        slotRect,
        popoutWindow: null,
        canPopout: false,
        onExpand: jest.fn(),
        onPopout: jest.fn(),
        onClose: jest.fn(),
        ...overrides,
    };
    const result = render(<KibitzStreamPlayer {...props} />);
    return { ...result, props };
}

function playerFrame(): HTMLIFrameElement | null {
    return document.querySelector("iframe[title='Stream: gochannel']");
}

describe("KibitzStreamPlayer", () => {
    it("covers the panel's slot when docked", () => {
        renderPlayer("docked");
        const player = document.querySelector<HTMLElement>(".KibitzStreamPlayer")!;
        expect(player.style.left).toBe("10px");
        expect(player.style.top).toBe("20px");
        expect(player.style.width).toBe("400px");
        expect(screen.queryByLabelText("Expand")).toBeNull();
    });

    it("keeps the same player when it moves to the mini player and back", () => {
        const { rerender, props } = renderPlayer("docked");
        const frame = playerFrame();
        expect(frame).not.toBeNull();

        rerender(<KibitzStreamPlayer {...props} mode="mini" />);
        expect(playerFrame()).toBe(frame);
        rerender(<KibitzStreamPlayer {...props} mode="docked" />);
        expect(playerFrame()).toBe(frame);
    });

    it("stays mounted, out of sight, while its slot is off screen", () => {
        const { rerender, props } = renderPlayer("docked");
        const frame = playerFrame();
        rerender(<KibitzStreamPlayer {...props} slotRect={null} />);
        expect(playerFrame()).toBe(frame);
        expect(document.querySelector<HTMLElement>(".KibitzStreamPlayer")!.style.visibility).toBe(
            "hidden",
        );
    });

    it("offers expand and close in the mini player, and pop-out where supported", () => {
        const { props } = renderPlayer("mini", { canPopout: true });
        fireEvent.click(screen.getByLabelText("Expand"));
        fireEvent.click(screen.getByLabelText("Pop out"));
        fireEvent.click(screen.getByLabelText("Close"));
        expect(props.onExpand).toHaveBeenCalled();
        expect(props.onPopout).toHaveBeenCalled();
        expect(props.onClose).toHaveBeenCalled();
    });

    it("has no pop-out button where the browser cannot pop out", () => {
        renderPlayer("mini");
        expect(screen.queryByLabelText("Pop out")).toBeNull();
    });

    it("plays in the pop-out window instead of the page", () => {
        const popout = document.implementation.createHTMLDocument("popout");
        const popoutWindow = { document: popout } as unknown as Window;
        renderPlayer("popout", { popoutWindow });
        expect(document.querySelector(".KibitzStreamPlayer")).toBeNull();
        expect(popout.body.querySelector("iframe")).not.toBeNull();
    });

    it("plays nothing when off", () => {
        renderPlayer("off");
        expect(playerFrame()).toBeNull();
    });
});
