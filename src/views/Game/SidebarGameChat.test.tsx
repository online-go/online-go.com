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

import { render, screen } from "@testing-library/react";
import * as React from "react";
import type { GobanViewLayout } from "@/components/GobanView";
import { GobanViewLayoutContext } from "@/components/GobanView/GobanViewLayoutContext";
import { SidebarGameChat } from "./SidebarGameChat";

jest.mock("./GameChat", () => ({ GameChat: () => <div data-testid="chat" /> }));

const layout = (leftAside: boolean, mobileScroll = false): GobanViewLayout => ({
    mode: mobileScroll ? "stacked" : "fullHorizontal",
    leftAside,
    leftAsideWidth: null,
    actionDock: false,
    mobileScroll,
    moveControls: mobileScroll ? "under-board" : "docked",
    boardAlignment: mobileScroll ? null : "container",
    actionList: mobileScroll,
    portraitSplit: false,
    playerBars: false,
    sidebarContentBefore: false,
    moveControlsUnderBoard: mobileScroll,
});

test("renders in the main tab when the chat is not in the left column", () => {
    render(
        <GobanViewLayoutContext.Provider value={layout(false)}>
            <SidebarGameChat
                channel="game-1"
                game_id={1}
                isMobile={false}
                mobileChatVisible={false}
            />
        </GobanViewLayoutContext.Provider>,
    );
    expect(screen.queryByTestId("chat")).not.toBeNull();
});

test("renders nothing when the left column shows the chat", () => {
    render(
        <GobanViewLayoutContext.Provider value={layout(true)}>
            <SidebarGameChat
                channel="game-1"
                game_id={1}
                isMobile={false}
                mobileChatVisible={false}
            />
        </GobanViewLayoutContext.Provider>,
    );
    expect(screen.queryByTestId("chat")).toBeNull();
});

function renderMobile(mobileScroll: boolean, mobileChatVisible: boolean) {
    return render(
        <GobanViewLayoutContext.Provider value={layout(false, mobileScroll)}>
            <SidebarGameChat
                channel="game-1"
                game_id={1}
                isMobile={true}
                mobileChatVisible={mobileChatVisible}
            />
        </GobanViewLayoutContext.Provider>,
    );
}

test("on mobile, the chat follows the chat toggle", () => {
    renderMobile(false, false);
    expect(screen.queryByTestId("chat")).toBeNull();
});

test("on mobile, the chat shows when the chat toggle is on", () => {
    renderMobile(false, true);
    expect(screen.queryByTestId("chat")).not.toBeNull();
});

test("in scrolling mode the chat shows even when the chat toggle is off", () => {
    renderMobile(true, false);
    expect(screen.queryByTestId("chat")).not.toBeNull();
});

describe("onMobileVisibleChange", () => {
    function renderReporting(isMobile: boolean, mobileScroll: boolean, mobileChatVisible: boolean) {
        const onMobileVisibleChange = jest.fn();
        const result = render(
            <GobanViewLayoutContext.Provider value={layout(false, mobileScroll)}>
                <SidebarGameChat
                    channel="game-1"
                    game_id={1}
                    isMobile={isMobile}
                    mobileChatVisible={mobileChatVisible}
                    onMobileVisibleChange={onMobileVisibleChange}
                />
            </GobanViewLayoutContext.Provider>,
        );
        return { ...result, onMobileVisibleChange };
    }

    test("reports true in scrolling mode with the chat toggle off", () => {
        const { onMobileVisibleChange } = renderReporting(true, true, false);
        expect(onMobileVisibleChange).toHaveBeenLastCalledWith(true);
    });

    test("reports false on mobile with the chat toggle off", () => {
        const { onMobileVisibleChange } = renderReporting(true, false, false);
        expect(onMobileVisibleChange).toHaveBeenLastCalledWith(false);
    });

    test("reports false on desktop, where there is no unread marker", () => {
        const { onMobileVisibleChange } = renderReporting(false, false, false);
        expect(onMobileVisibleChange).toHaveBeenLastCalledWith(false);
    });

    test("reports false when it unmounts", () => {
        const { onMobileVisibleChange, unmount } = renderReporting(true, true, false);
        unmount();
        expect(onMobileVisibleChange).toHaveBeenLastCalledWith(false);
    });
});
