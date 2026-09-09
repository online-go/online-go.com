/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import type { GobanController } from "@/lib/GobanController";
import { KibitzLeftAside, KibitzLeftAsideProps } from "./KibitzLeftAside";

jest.mock("./KibitzRoomList", () => ({
    __esModule: true,
    KibitzRoomList: () => <div data-testid="room-list" />,
}));
jest.mock("./KibitzVariationList", () => ({
    __esModule: true,
    KibitzVariationList: () => <div data-testid="variation-list" />,
}));
jest.mock("./KibitzMiniMainBoard", () => ({
    __esModule: true,
    KibitzMiniMainBoard: ({ onClick }: { onClick: () => void }) => (
        <button type="button" data-testid="mini-main-board" onClick={onClick} />
    ),
}));

function baseProps(overrides: Partial<KibitzLeftAsideProps> = {}): KibitzLeftAsideProps {
    return {
        rooms: [],
        activeRoomId: "r1",
        blockedRoomIds: new Set<string>(),
        onSelectRoom: jest.fn(),
        canOpenCreateRoomFlow: false,
        signInHref: "/sign-in",
        variations: [],
        currentGameId: 100,
        variationGameById: new Map(),
        selectedVariationId: null,
        variationFocusRequestId: 0,
        blockedVariationFlashId: null,
        onRecallVariation: jest.fn(),
        onHideVariation: jest.fn(),
        miniBoardController: null,
        onExitVariation: jest.fn(),
        variationColorIndexes: {},
        ...overrides,
    };
}

describe("KibitzLeftAside", () => {
    test("shows the room list and the variation list without a mini board", () => {
        render(<KibitzLeftAside {...baseProps()} />);
        expect(screen.getByTestId("room-list")).toBeInTheDocument();
        expect(screen.getByTestId("variation-list")).toBeInTheDocument();
        expect(screen.queryByTestId("mini-main-board")).toBeNull();
    });

    test("shows the mini board when a controller is given and exits on click", () => {
        const onExitVariation = jest.fn();
        const controller = {} as unknown as GobanController;
        render(
            <KibitzLeftAside
                {...baseProps({ miniBoardController: controller, onExitVariation })}
            />,
        );
        fireEvent.click(screen.getByTestId("mini-main-board"));
        expect(onExitVariation).toHaveBeenCalledTimes(1);
    });
});
