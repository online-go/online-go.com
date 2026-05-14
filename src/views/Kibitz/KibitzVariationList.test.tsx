/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { render, screen } from "@testing-library/react";
import type { KibitzRoomUser, KibitzVariationSummary } from "@/models/kibitz";
import { KibitzVariationList } from "./KibitzVariationList";

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => <span data-testid="KibitzUserAvatar" />,
}));

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    pgettext: (_context: string, text: string) => text,
}));

function makeUser(id: number, username: string): KibitzRoomUser {
    return {
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    };
}

function makeVariation(id: string, gameId: number, title: string): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: gameId,
        creator: makeUser(gameId, `${title}-creator`),
        created_at: gameId,
        viewer_count: 0,
        current_viewers: [],
        title,
        analysis_from: 87,
        move_count: 5,
    };
}

describe("KibitzVariationList", () => {
    it("renders the active variations quick-list", () => {
        const onRecallVariation = jest.fn();
        const onHideVariation = jest.fn();

        render(
            <KibitzVariationList
                variations={[makeVariation("a1", 10, "A1"), makeVariation("a2", 10, "A2")]}
                selectedVariationId="a2"
                variationColorIndexes={{ a1: 0, a2: 1 }}
                onRecallVariation={onRecallVariation}
                onHideVariation={onHideVariation}
            />,
        );

        expect(screen.getByText("Active variations")).toBeInTheDocument();
        expect(screen.getByText("A1")).toBeInTheDocument();
        expect(screen.getByText("A2")).toBeInTheDocument();
        expect(screen.getAllByText("M87")).toHaveLength(2);
        expect(screen.getAllByText("+5")).toHaveLength(2);
        expect(screen.getAllByLabelText("Hide from board")).toHaveLength(2);
    });
});
