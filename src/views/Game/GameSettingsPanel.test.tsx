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

import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { GobanControllerContext } from "./goban_context";
import { GobanController } from "@/lib/GobanController";

jest.mock("@/components/GobanThemePicker/GobanThemePicker", () => ({
    GobanThemePicker: () => null,
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

    const { container } = renderPanel(controller, { compact: true });

    expect(container.querySelector("#game-settings-board-alignment")).toBeNull();
});
