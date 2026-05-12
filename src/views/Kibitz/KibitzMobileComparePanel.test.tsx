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
import { render, screen } from "@testing-library/react";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import type {
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { KibitzMobileComparePanel } from "./KibitzMobileComparePanel";

jest.mock("./KibitzMoveTreeStrip", () => ({
    __esModule: true,
    KibitzMoveTreeStrip: () => <div data-testid="KibitzMoveTreeStrip" />,
}));

jest.mock("./KibitzVariationComposer", () => ({
    __esModule: true,
    KibitzVariationComposer: () => <div data-testid="KibitzVariationComposer" />,
}));

jest.mock("./KibitzVariationList", () => ({
    __esModule: true,
    KibitzVariationList: () => <div data-testid="KibitzVariationList" />,
}));

jest.mock("./KibitzNodeText", () => ({
    __esModule: true,
    KibitzNodeText: () => <div data-testid="KibitzNodeText" />,
}));

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("@/lib/swal_config", () => ({
    __esModule: true,
    alert: {
        fire: jest.fn(),
    },
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    pgettext: (_: string, text: string) => text,
    current_language: "en",
    moment: {
        duration: (_value: number, _unit: string) => ({
            humanize: () => "time",
        }),
    },
}));

const TEST_USER = {
    anonymous: false,
    id: 123,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "https://secure.gravatar.com/avatar/8d809ecc50408afc399a4cb7c8fd4510?s=32&d=retro",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

function makeController(): GobanController {
    const controller = new GobanController({
        game_id: 1234,
        players: {
            black: { id: 123, username: "test_user" },
            white: { id: 456, username: "test_user2" },
        },
        moves: [],
    });

    controller.goban.setMode("analyze");
    return controller;
}

function makeRoom(): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "room-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 1,
        creator_id: 1,
    };
}

function makeSecondaryPane(): KibitzSecondaryPaneState {
    return {
        collapsed: false,
        size: "equal",
        variation_source_game_id: 4321,
        variation_draft_base_id: "draft-1",
    };
}

describe("KibitzMobileComparePanel", () => {
    beforeEach(() => {
        data.set("user", TEST_USER);
    });

    it("renders the standalone analyze button bar without the play-only back-to-game control", () => {
        const controller = makeController();
        const room = makeRoom();
        const secondaryPane = makeSecondaryPane();
        const noop = () => {
            return;
        };

        const variations: KibitzVariationSummary[] = [];
        const queuedRoomProposals: KibitzProposal[] = [];

        const { container } = render(
            <KibitzMobileComparePanel
                controller={controller}
                room={room}
                variations={variations}
                queuedRoomProposals={queuedRoomProposals}
                visibleVariationIds={[]}
                variationColorIndexes={{}}
                blockedVariationFlashId={null}
                secondaryPane={secondaryPane}
                selectedVariation={null}
                isDraftingVariation={true}
                variationFocusRequestId={0}
                onOpenVariation={noop}
                onToggleVariation={noop}
                onPostVariation={noop}
            />,
        );

        expect(container.querySelector("#game-analyze-button-bar")).not.toBeNull();
        expect(screen.getByRole("button", { name: "Pass" })).toBeInTheDocument();
        expect(screen.queryByText("Back to Game")).toBeNull();
    });
});
