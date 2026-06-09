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
import { Clock } from "@/components/Clock/Clock";
import { Player } from "@/components/Player";
import { PlayerDetails } from "@/components/Player/PlayerDetails";
import { generateGobanHook } from "@/components/GobanView/hooks";
import { GobanController } from "@/lib/GobanController";
import { popover } from "@/lib/popover";
import { pgettext } from "@/lib/translate";
import type { KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import type { Goban } from "goban";
import "./KibitzMainGameStats.css";

interface KibitzMainGameStatsProps {
    controller: GobanController | null;
    game: KibitzWatchedGame | undefined;
    variant: "desktop" | "mobile";
}

interface GameScore {
    black: { prisoners: number };
    white: { prisoners: number };
}

interface GameSummary {
    phase: string | null;
    outcome: string | null;
    winner: number | "black" | "white" | undefined;
    pausedSince: number | null;
}

type KibitzGoban = Goban & {
    paused_since?: number;
};

const useGameScore = generateGobanHook<GameScore | null, Goban | null>(
    (goban) => {
        if (!goban) {
            return null;
        }

        const engine = goban.engine;
        if (
            (engine.phase === "stone removal" || engine.phase === "finished") &&
            engine.outcome !== "Timeout" &&
            engine.outcome !== "Disconnection" &&
            engine.outcome !== "Resignation" &&
            engine.outcome !== "Abandonment" &&
            engine.outcome !== "Cancellation" &&
            goban.mode === "play"
        ) {
            return engine.computeScore(false);
        }

        return engine.computeScore(true);
    },
    ["phase", "mode", "outcome", "stone-removal.accepted", "stone-removal.updated", "cur_move"],
);

const useGameSummary = generateGobanHook<GameSummary, KibitzGoban | null>(
    (goban) => ({
        phase: goban?.engine.phase ?? null,
        outcome: goban?.engine.outcome ?? null,
        winner: goban?.engine.winner,
        pausedSince: goban?.paused_since ?? null,
    }),
    ["phase", "outcome", "winner", "paused"],
);

const usePlayerToMove = generateGobanHook<number, Goban | null>(
    (goban) => goban?.engine.playerToMove() ?? 0,
    ["cur_move", "last_official_move"],
);

function openPlayerPopover(event: React.MouseEvent<HTMLButtonElement>, user: KibitzRoomUser): void {
    event.preventDefault();
    event.stopPropagation();

    popover({
        elt: <PlayerDetails playerId={user.id} />,
        below: event.currentTarget,
        minWidth: 240,
        minHeight: 250,
    });
}

function renderChip(
    className: string,
    content: React.ReactNode,
    ariaLabel?: string,
): React.ReactElement {
    return (
        <span className={className} aria-label={ariaLabel}>
            {content}
        </span>
    );
}

function renderDesktopIdentity(user: KibitzRoomUser): React.ReactElement {
    return renderChip(
        "player-badge KibitzMainGameStats-chip KibitzMainGameStats-playerBadge",
        <>
            <KibitzUserAvatar
                user={user}
                size={16}
                className="stage-avatar"
                iconClassName="stage-avatar-image"
            />
            <Player user={user} flag rank noextracontrols />
        </>,
    );
}

function renderMobileIdentity(user: KibitzRoomUser): React.ReactElement {
    return (
        <button
            type="button"
            className="mobile-room-header-matchup-avatar-button"
            onClick={(event) => openPlayerPopover(event, user)}
            aria-label={user.username}
        >
            <KibitzUserAvatar
                user={user}
                size={64}
                className="mobile-room-header-matchup-avatar"
                iconClassName="mobile-room-header-matchup-avatar-image"
            />
        </button>
    );
}

function renderMobilePlayerBadge(user: KibitzRoomUser): React.ReactElement {
    return renderChip(
        "player-badge KibitzMainGameStats-chip KibitzMainGameStats-playerBadge KibitzMainGameStats-playerBadge-mobile",
        <Player user={user} flag rank noextracontrols />,
    );
}

function renderClockChip(
    controller: GobanController | null,
    color: "black" | "white",
): React.ReactElement | null {
    const goban = controller?.goban;

    if (!goban?.engine?.time_control) {
        return null;
    }

    return renderChip(
        "KibitzMainGameStats-chip KibitzMainGameStats-chip-clock KibitzMainGameStats-clock",
        <Clock goban={goban} color={color} compact lineSummary={true} />,
    );
}

function renderCaptureChip(value: number | undefined | null): React.ReactElement | null {
    if (value == null) {
        return null;
    }

    return renderChip(
        "KibitzMainGameStats-chip KibitzMainGameStats-chip-captures KibitzMainGameStats-captures",
        value,
        pgettext("Kibitz main game capture count", "Captured stones"),
    );
}

function renderStatusChip(text: string | null): React.ReactElement | null {
    if (!text) {
        return null;
    }

    return renderChip("KibitzMainGameStats-chip KibitzMainGameStats-chip-state", text);
}

function getWinnerColor(
    game: KibitzWatchedGame,
    winner: GameSummary["winner"],
): "black" | "white" | null {
    if (winner === "black" || winner === "white") {
        return winner;
    }

    if (winner === game.black.id) {
        return "black";
    }

    if (winner === game.white.id) {
        return "white";
    }

    return null;
}

function getCompactResultToken(game: KibitzWatchedGame, summary: GameSummary): string {
    const winnerColor = getWinnerColor(game, summary.winner);

    if (!winnerColor) {
        return pgettext("Kibitz main game compact result fallback", "Done");
    }

    const prefix = winnerColor === "black" ? "B" : "W";
    const outcome = summary.outcome ?? "";

    if (/[0-9.]+/.test(outcome)) {
        const match = outcome.match(/([0-9.]+)/);
        return `${prefix}+${match ? match[1] : outcome}`;
    }

    if (outcome === "Resignation" || outcome === "resign" || outcome === "r") {
        return `${prefix}+R`;
    }

    return pgettext("Kibitz main game compact result fallback", "Done");
}

function renderDesktopStateChip(
    summary: GameSummary,
    game: KibitzWatchedGame,
): React.ReactElement | null {
    if (summary.phase === "stone removal") {
        return renderChip(
            "KibitzMainGameStats-chip KibitzMainGameStats-chip-center",
            pgettext("Kibitz main game center token", "Score"),
        );
    }

    if (summary.phase === "finished") {
        return renderChip(
            "KibitzMainGameStats-chip KibitzMainGameStats-chip-center",
            getCompactResultToken(game, summary),
        );
    }

    if (summary.phase === "play" && summary.pausedSince) {
        return renderChip(
            "KibitzMainGameStats-chip KibitzMainGameStats-chip-center",
            pgettext("Kibitz main game center token", "Paused"),
        );
    }

    return renderChip(
        "KibitzMainGameStats-chip KibitzMainGameStats-chip-center",
        pgettext("Kibitz main game center token", "VS"),
    );
}

function renderDesktopStatusChip(summary: GameSummary): React.ReactElement | null {
    if (summary.phase === "stone removal") {
        return renderStatusChip(pgettext("Kibitz main game phase status", "Stone removal"));
    }

    if (summary.phase === "finished") {
        return renderStatusChip(pgettext("Kibitz main game phase status", "Game finished"));
    }

    return null;
}

function renderMobilePlayerLine(
    user: KibitzRoomUser,
    stoneColor: "black" | "white",
    captures: number | undefined | null,
    clock: React.ReactElement | null,
): React.ReactElement {
    return (
        <span className={"mobile-room-header-player mobile-room-header-player-" + stoneColor}>
            {stoneColor === "black" ? renderMobilePlayerBadge(user) : null}
            {renderCaptureChip(captures)}
            {clock}
            {stoneColor === "white" ? renderMobilePlayerBadge(user) : null}
        </span>
    );
}

export function KibitzMainGameStats({
    controller,
    game,
    variant,
}: KibitzMainGameStatsProps): React.ReactElement | null {
    const goban = controller?.goban ?? null;
    const score = useGameScore(goban);
    const playerToMove = usePlayerToMove(goban);
    const gameSummary = useGameSummary(goban);

    if (!game) {
        return null;
    }

    const black = game.black;
    const white = game.white;
    const blackTheirTurn = playerToMove === black.id;
    const whiteTheirTurn = playerToMove === white.id;
    const blackCaptures = score?.black?.prisoners;
    const whiteCaptures = score?.white?.prisoners;

    if (variant === "mobile") {
        return (
            <div className="mobile-room-header-matchup KibitzMainGameStats KibitzMainGameStats-mobile">
                <span className="mobile-room-header-matchup-avatar mobile-room-header-matchup-avatar-black">
                    {renderMobileIdentity(black)}
                </span>
                <span className="mobile-room-header-matchup-content">
                    <span
                        className={
                            "mobile-room-header-matchup-first" +
                            (blackTheirTurn ? " their-turn" : "")
                        }
                    >
                        {renderMobilePlayerLine(
                            black,
                            "black",
                            blackCaptures,
                            renderClockChip(controller, "black"),
                        )}
                    </span>
                    <span className="mobile-room-header-matchup-second">
                        <span
                            className={
                                "mobile-room-header-matchup-second-name" +
                                (whiteTheirTurn ? " their-turn" : "")
                            }
                        >
                            {renderMobilePlayerLine(
                                white,
                                "white",
                                whiteCaptures,
                                renderClockChip(controller, "white"),
                            )}
                        </span>
                    </span>
                </span>
                <span className="mobile-room-header-matchup-avatar mobile-room-header-matchup-avatar-white">
                    {renderMobileIdentity(white)}
                </span>
            </div>
        );
    }

    return (
        <div className="players player-pair KibitzMainGameStats KibitzMainGameStats-desktop">
            <span
                className={
                    "KibitzMainGameStats-side KibitzMainGameStats-side-black" +
                    (blackTheirTurn ? " their-turn" : "")
                }
            >
                {renderClockChip(controller, "black")}
                {renderCaptureChip(blackCaptures)}
                {renderDesktopIdentity(black)}
            </span>
            <span className="KibitzMainGameStats-center">
                {renderDesktopStateChip(gameSummary, game)}
            </span>
            <span
                className={
                    "KibitzMainGameStats-side KibitzMainGameStats-side-white" +
                    (whiteTheirTurn ? " their-turn" : "")
                }
            >
                {renderDesktopIdentity(white)}
                {renderCaptureChip(whiteCaptures)}
                {renderClockChip(controller, "white")}
            </span>
            {renderDesktopStatusChip(gameSummary)}
        </div>
    );
}
