/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

// Importing @/lib/data and @/lib/sockets in this order triggers their
// full module bodies to evaluate before PlayerCards' transitive
// ChatPresenceIndicator → UIPush → sockets chain re-enters the cycle.
// This guards against the sockets/debug/data/ITC circular dependency
// that otherwise produces "Cannot read properties of undefined (reading
// 'on')" — previously avoided by chance because PlayerCard pulled in
// browserHistory / usePreference / etc., which provided the same
// load-order anchoring. Extracting mod-controls / flags removed those
// imports and exposed the underlying fragility; the right long-term fix
// is to break the cycle at the lib level.
import "@/lib/data";
import "@/lib/sockets";

import { fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { PlayerCard } from "./PlayerCards";
import { GobanControllerContext } from "./goban_context";
import { BrowserRouter as Router } from "react-router-dom";
import * as data from "@/lib/data";
import { GobanController } from "../../lib/GobanController";
import { openRengoTeamModal } from "@/components/RengoTeamModal";
import { BlockState } from "@/components/BlockPlayer";
import cached from "@/lib/cached";
import * as player_cache from "@/lib/player_cache";

jest.mock("@/components/RengoTeamModal", () => ({
    openRengoTeamModal: jest.fn(),
}));

afterEach(() => {
    jest.restoreAllMocks();
    data.set(cached.blocks, []);
});

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

const BASE_PROPS = {
    color: "white" as const,
    historical: null,
    estimating_score: false,
    show_score_breakdown: false,
    zen_mode: false,
    onScoreClick: jest.fn(),
};

test("make sure komi is displayed for white", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);

    const gameController = new GobanController({ game_id: 123456, komi: 5 });
    const goban = gameController.goban;
    const props = { goban, ...BASE_PROPS };

    const { container } = render(
        <Router>
            <GobanControllerContext.Provider value={gameController}>
                <PlayerCard {...props} />
            </GobanControllerContext.Provider>
        </Router>,
    );
    const divElement = container.querySelector(".komi");

    expect(divElement).toHaveTextContent("5.0");
});

test("make sure komi is not displayed for black", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);

    const gameController = new GobanController({ game_id: 123456, komi: 5 });
    const goban = gameController.goban;
    const props = { goban, ...BASE_PROPS, color: "black" as const };

    const { container } = render(
        <Router>
            <GobanControllerContext.Provider value={gameController}>
                <PlayerCard {...props} />
            </GobanControllerContext.Provider>
        </Router>,
    );
    const divElement = container.querySelector(".komi");

    if (divElement) {
        expect(divElement).toBeEmptyDOMElement();
    }
});

test("uses current player cache avatars when historical player data is unavailable", async () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);
    const blackHash = "11111111111111111111111111111111";
    const whiteDefaultAvatar =
        "https://secure.gravatar.com/avatar/803b30a87717c3bbadd467fcfa891c82?s=80&d=retro";
    jest.spyOn(player_cache, "lookup").mockReturnValue(null);
    jest.spyOn(player_cache, "fetch").mockImplementation((id) =>
        Promise.resolve({
            id: id!,
            icon: id === 11 ? blackHash : whiteDefaultAvatar,
        }),
    );

    const controller = new GobanController({
        game_id: 123456,
        players: {
            black: { id: 11, username: "blackie", rank: 20 },
            white: { id: 22, username: "whitey", rank: 20 },
        },
    });
    const { container } = render(
        <Router>
            <GobanControllerContext.Provider value={controller}>
                <>
                    <PlayerCard {...BASE_PROPS} color="black" goban={controller.goban} />
                    <PlayerCard {...BASE_PROPS} color="white" goban={controller.goban} />
                </>
            </GobanControllerContext.Provider>
        </Router>,
    );

    await waitFor(() => {
        expect(container.querySelector(".black .player-card-avatar")).toHaveAttribute(
            "src",
            `https://user-uploads.online-go.com/${blackHash}-64.png`,
        );
        expect(container.querySelector(".white .player-card-avatar")).toHaveAttribute(
            "src",
            whiteDefaultAvatar,
        );
    });
});

test("keeps the historical avatar when historical player data is available", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);
    const historicalIcon = "https://example.com/historical-avatar.png";
    const controller = new GobanController({
        game_id: 123456,
        players: {
            black: { id: 11, username: "blackie", rank: 20 },
            white: { id: 22, username: "whitey", rank: 20 },
        },
    });

    const { container } = render(
        <Router>
            <GobanControllerContext.Provider value={controller}>
                <PlayerCard
                    {...BASE_PROPS}
                    color="white"
                    goban={controller.goban}
                    historical={{ icon: historicalIcon } as any}
                />
            </GobanControllerContext.Provider>
        </Router>,
    );

    expect(container.querySelector(".player-icon-container")).toHaveStyle({
        backgroundImage: `url("${historicalIcon}")`,
    });
    expect(container.querySelector(".player-card-avatar")).toBeNull();
});

test("does not show the cache-backed avatar for an ignored player", () => {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);
    jest.spyOn(player_cache, "lookup").mockReturnValue(null);
    const ignoredPlayer = new BlockState(11);
    ignoredPlayer.block_chat = true;
    data.set(cached.blocks, [ignoredPlayer]);

    const controller = new GobanController({
        game_id: 123456,
        players: {
            black: { id: 11, username: "blackie", rank: 20 },
            white: { id: 22, username: "whitey", rank: 20 },
        },
    });
    const { container } = render(
        <Router>
            <GobanControllerContext.Provider value={controller}>
                <PlayerCard {...BASE_PROPS} color="black" goban={controller.goban} />
            </GobanControllerContext.Provider>
        </Router>,
    );

    expect(container.querySelector(".player-card-avatar")).toBeNull();
    expect(container.querySelector(".player-icon-container")).toHaveStyle({ backgroundImage: "" });
});

const RENGO_PLAYERS = {
    alice: {
        id: 1,
        username: "alice",
        rank: 10,
        "icon-url": "22222222222222222222222222222222",
    },
    bob: { id: 2, username: "bob", rank: 11 },
    carol: { id: 3, username: "carol", rank: 12 },
    dave: { id: 4, username: "dave", rank: 13 },
};

function renderRengoCard(color: "black" | "white") {
    data.set("user", TEST_USER);
    data.set("preferences.moderator.hide-flags", false);
    data.set("preferences.moderator.hide-player-card-mod-controls", false);

    const { alice, bob, carol, dave } = RENGO_PLAYERS;
    const gameController = new GobanController({
        game_id: 123456,
        rengo: true,
        players: { black: alice, white: dave },
        rengo_teams: { black: [alice, bob, carol], white: [dave] },
    });
    const goban = gameController.goban;
    const props = { goban, ...BASE_PROPS, color };

    return render(
        <Router>
            <GobanControllerContext.Provider value={gameController}>
                <PlayerCard {...props} />
            </GobanControllerContext.Provider>
        </Router>,
    );
}

test("rengo card shows the number of other team members instead of the full list", () => {
    const { container } = renderRengoCard("black");

    expect(container.querySelector(".rengo-team-count")).toHaveTextContent("+ 2");
    expect(container.querySelector(".rengo-team-members")).toBeNull();
    expect(container.querySelector(".player-icon-container")).toHaveStyle({
        backgroundImage:
            'url("https://user-uploads.online-go.com/22222222222222222222222222222222-64.png")',
    });
    expect(container.querySelector(".player-card-avatar")).toBeNull();
});

test("rengo card hides the team count when the team has one player", () => {
    const { container } = renderRengoCard("white");

    expect(container.querySelector(".rengo-team-count")).toBeNull();
});

test("clicking the rengo team count opens the team modal with the current player first", () => {
    const { container } = renderRengoCard("black");
    const { alice, bob, carol } = RENGO_PLAYERS;

    fireEvent.click(container.querySelector(".rengo-team-count")!);

    expect(openRengoTeamModal).toHaveBeenCalledWith("black", [alice, bob, carol]);
});
