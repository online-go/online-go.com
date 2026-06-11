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
import { Flag } from "@/components/Flag/Flag";
import { PlayerDetails } from "@/components/Player/PlayerDetails";
import { shortShortTimeControl } from "@/components/TimeControl/util";
import { generateGobanHook } from "@/components/GobanView/hooks";
import { GobanController } from "@/lib/GobanController";
import { interpolate, ngettext, pgettext } from "@/lib/translate";
import type { KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import type { Goban, JGOFClockWithTransmitting, JGOFPlayerClock, JGOFTimeControl } from "goban";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import { popover } from "@/lib/popover";
import "./KibitzMobileMainGameScoreboard.css";

interface KibitzMobileMainGameScoreboardProps {
    controller: GobanController | null;
    game: KibitzWatchedGame | undefined;
    isMainBoardVisible: boolean;
    isInteractionPaused?: boolean;
}

interface GameScore {
    black: { prisoners: number };
    white: { prisoners: number };
}

interface ScoreboardState {
    phase: string | null;
    outcome: string | null;
    winner: number | "black" | "white" | undefined;
    pausedSince: number | null;
    clock: JGOFClockWithTransmitting | null;
}

type KibitzGoban = Goban & {
    paused_since?: number;
    last_emitted_clock?: JGOFClockWithTransmitting | null;
};

type ScoreboardFace = "player" | "metadata";

interface KibitzEngineMetadata {
    handicap?: number | null;
    komi?: number | null;
}

interface MetadataFaceLine {
    label: string;
    value: string;
}

const useGameScore = generateGobanHook<GameScore | null, KibitzGoban | null>(
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

const useScoreboardState = generateGobanHook<ScoreboardState, KibitzGoban | null>(
    (goban) => ({
        phase: goban?.engine.phase ?? null,
        outcome: goban?.engine.outcome ?? null,
        winner: goban?.engine.winner,
        pausedSince: goban?.paused_since ?? null,
        clock: goban?.last_emitted_clock ?? null,
    }),
    ["phase", "outcome", "winner", "paused", "clock"],
);

const usePlayerToMove = generateGobanHook<number, KibitzGoban | null>(
    (goban) => goban?.engine.playerToMove() ?? 0,
    ["cur_move", "last_official_move"],
);

function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return false;
        }

        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return undefined;
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = (event?: MediaQueryListEvent) => {
            setPrefersReducedMotion(event?.matches ?? mediaQuery.matches);
        };

        sync();
        mediaQuery.addEventListener("change", sync);

        return () => {
            mediaQuery.removeEventListener("change", sync);
        };
    }, []);

    return prefersReducedMotion;
}

function getRankText(user: KibitzRoomUser): string {
    const ranking = Math.round(user.ranking || 0);

    if (user.professional) {
        return `${ranking}p`;
    }

    if (ranking > 0) {
        return `${ranking}k`;
    }

    return "?";
}

function formatKomi(komi: number | null | undefined): string {
    if (komi == null || Number.isNaN(komi)) {
        return "?";
    }

    return Number.isInteger(komi) ? String(komi) : komi.toFixed(1);
}

function formatHandicap(handicap: number | null | undefined): string {
    if (handicap == null || !Number.isFinite(handicap) || handicap < 0) {
        return "?";
    }

    return String(Math.round(handicap));
}

function getMetadataGameLine(config: KibitzEngineMetadata | null | undefined): string {
    return interpolate(
        pgettext("Kibitz mobile scoreboard metadata game line", "H{{handicap}} · Komi {{komi}}"),
        {
            handicap: formatHandicap(config?.handicap),
            komi: formatKomi(config?.komi),
        },
    );
}

function getTimeControlSummary(timeControl: JGOFTimeControl | null | undefined): string {
    return (
        shortShortTimeControl(timeControl) ||
        pgettext("Kibitz mobile scoreboard metadata time value", "None")
    );
}

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

function getWinnerColor(
    game: KibitzWatchedGame,
    winner: ScoreboardState["winner"],
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

function getCompactResultToken(game: KibitzWatchedGame, state: ScoreboardState): string | null {
    const winnerColor = getWinnerColor(game, state.winner);

    if (!winnerColor) {
        return null;
    }

    const outcome = state.outcome ?? "";
    const prefix = winnerColor === "black" ? "B" : "W";

    if (/[0-9.]+/.test(outcome)) {
        const match = outcome.match(/([0-9.]+)/);
        return `${prefix}+${match ? match[1] : outcome}`;
    }

    if (outcome === "Resignation" || outcome === "resign" || outcome === "r") {
        return `${prefix}+R`;
    }

    return null;
}

function getStateToken(game: KibitzWatchedGame, state: ScoreboardState): string | null {
    if (state.phase === "stone removal" || state.phase === "scoring") {
        return pgettext("Kibitz mobile scoreboard state token", "Score");
    }

    if (state.phase === "finished") {
        const token = getCompactResultToken(game, state);
        return token || pgettext("Kibitz mobile scoreboard state token", "Done");
    }

    if (state.phase === "play" && state.pausedSince) {
        return pgettext("Kibitz mobile scoreboard state token", "Pause");
    }

    return null;
}

function getShouldPinMetadataFace(state: ScoreboardState): boolean {
    return state.phase === "stone removal" || state.phase === "scoring";
}

function getMetadataFaceLines(
    game: KibitzWatchedGame,
    controller: GobanController | null,
    state: ScoreboardState,
    stateToken: string | null,
): [MetadataFaceLine, MetadataFaceLine] {
    const goban = controller?.goban;
    const timeControl = goban?.engine?.time_control;
    const config = goban?.engine?.config as KibitzEngineMetadata | undefined;

    if (state.phase === "finished") {
        return [
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "Result"),
                value: stateToken || pgettext("Kibitz mobile scoreboard state token", "Done"),
            },
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "Game"),
                value: getMetadataGameLine(config),
            },
        ];
    }

    if (state.phase === "play" && state.pausedSince) {
        return [
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "State"),
                value: stateToken || pgettext("Kibitz mobile scoreboard state token", "Pause"),
            },
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "Time"),
                value: getTimeControlSummary(timeControl),
            },
        ];
    }

    if (state.phase === "stone removal" || state.phase === "scoring") {
        return [
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "State"),
                value: stateToken || pgettext("Kibitz mobile scoreboard state token", "Score"),
            },
            {
                label: pgettext("Kibitz mobile scoreboard metadata label", "Game"),
                value: getMetadataGameLine(config),
            },
        ];
    }

    return [
        {
            label: pgettext("Kibitz mobile scoreboard metadata label", "Time"),
            value: getTimeControlSummary(timeControl),
        },
        {
            label: pgettext("Kibitz mobile scoreboard metadata label", "Game"),
            value: getMetadataGameLine(config),
        },
    ];
}

function prettyClockTime(ms: number): string {
    if (ms <= 0 || Number.isNaN(ms)) {
        return "0:00";
    }

    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function renderClockLabel(
    clock: JGOFClockWithTransmitting | null,
    color: "black" | "white",
): string | null {
    if (!clock) {
        return null;
    }

    const timeControl = clock;
    const playerClock: JGOFPlayerClock =
        color === "black" ? timeControl.black_clock : timeControl.white_clock;
    const colorLabel =
        color === "black" ? pgettext("Game color", "Black") : pgettext("Game color", "White");

    if (timeControl.start_mode && timeControl.current_player === color) {
        return interpolate(
            pgettext(
                "Kibitz mobile scoreboard clock aria label",
                "{{color}} time remaining {{time}}",
            ),
            {
                color: colorLabel,
                time: prettyClockTime(timeControl.start_time_left || 0),
            },
        );
    }

    if (playerClock.main_time > 0) {
        return interpolate(
            pgettext(
                "Kibitz mobile scoreboard clock aria label",
                "{{color}} time remaining {{time}}",
            ),
            {
                color: colorLabel,
                time: prettyClockTime(playerClock.main_time),
            },
        );
    }

    if ((playerClock.period_time_left || playerClock.block_time_left || 0) > 0) {
        return interpolate(
            pgettext(
                "Kibitz mobile scoreboard clock aria label",
                "{{color}} time remaining {{time}}",
            ),
            {
                color: colorLabel,
                time: prettyClockTime(
                    playerClock.period_time_left || playerClock.block_time_left || 0,
                ),
            },
        );
    }

    return interpolate(
        pgettext("Kibitz mobile scoreboard clock aria label", "{{color}} time remaining"),
        {
            color: colorLabel,
        },
    );
}

function renderClock(
    controller: GobanController | null,
    state: ScoreboardState,
    color: "black" | "white",
): React.ReactElement | null {
    const goban = controller?.goban;

    if (!goban?.engine?.time_control) {
        return null;
    }

    const ariaLabel = renderClockLabel(state.clock, color);

    return (
        <span className="KibitzMobileMainGameScoreboard-clock" aria-label={ariaLabel || undefined}>
            <span aria-hidden="true">
                <Clock goban={goban} color={color} compact lineSummary={true} />
            </span>
        </span>
    );
}

function renderCaptures(
    value: number | undefined | null,
    color: "black" | "white",
): React.ReactElement | null {
    if (value == null) {
        return null;
    }

    return (
        <span
            className="KibitzMobileMainGameScoreboard-captures"
            aria-label={interpolate(
                pgettext(
                    "Kibitz mobile scoreboard capture aria label",
                    "{{color}} has captured {{count}} {{stoneCount}}",
                ),
                {
                    color:
                        color === "black"
                            ? pgettext("Game color", "Black")
                            : pgettext("Game color", "White"),
                    count: value,
                    stoneCount: ngettext("stone", "stones", value),
                },
            )}
        >
            <span className="KibitzMobileMainGameScoreboard-captureDot" aria-hidden="true">
                ·
            </span>
            <span className="KibitzMobileMainGameScoreboard-captureCount">{value}</span>
        </span>
    );
}

function renderAvatar(user: KibitzRoomUser, interactive: boolean): React.ReactElement {
    return (
        <button
            type="button"
            className="KibitzMobileMainGameScoreboard-avatarButton"
            onClick={(event) => openPlayerPopover(event, user)}
            tabIndex={interactive ? 0 : -1}
            aria-hidden={interactive ? undefined : true}
            aria-label={user.username}
            title={user.username}
        >
            <KibitzUserAvatar
                user={user}
                size={32}
                className="KibitzMobileMainGameScoreboard-avatar"
                iconClassName="KibitzMobileMainGameScoreboard-avatarImage"
            />
        </button>
    );
}

function renderPlayerRow(
    user: KibitzRoomUser,
    color: "black" | "white",
    active: boolean,
    interactive: boolean,
    controller: GobanController | null,
    state: ScoreboardState,
    captures: number | undefined | null,
): React.ReactElement {
    return (
        <div
            className={
                "KibitzMobileMainGameScoreboard-row KibitzMobileMainGameScoreboard-row--" +
                color +
                (active ? " is-active" : "")
            }
            aria-label={
                color === "black"
                    ? pgettext("Kibitz mobile scoreboard row aria label", "Black player")
                    : pgettext("Kibitz mobile scoreboard row aria label", "White player")
            }
        >
            <span className="KibitzMobileMainGameScoreboard-avatarSlot">
                {renderAvatar(user, interactive)}
            </span>
            {user.country ? (
                <span className="KibitzMobileMainGameScoreboard-flag" aria-hidden="true">
                    <Flag country={user.country} />
                </span>
            ) : null}
            <span
                className={
                    "KibitzMobileMainGameScoreboard-player" + (active ? " is-active-player" : "")
                }
            >
                <span className="KibitzMobileMainGameScoreboard-playerName">{user.username}</span>
                <span className="KibitzMobileMainGameScoreboard-playerRank">
                    [{getRankText(user)}]
                </span>
            </span>
            {renderClock(controller, state, color)}
            {renderCaptures(captures, color)}
        </div>
    );
}

function renderPlayerFace(
    black: KibitzRoomUser,
    blackActive: boolean,
    blackCaptures: number | undefined | null,
    white: KibitzRoomUser,
    whiteActive: boolean,
    whiteCaptures: number | undefined | null,
    controller: GobanController | null,
    state: ScoreboardState,
    visible: boolean,
): React.ReactElement {
    return (
        <div
            className={
                "KibitzMobileMainGameScoreboard-face KibitzMobileMainGameScoreboard-face--player" +
                (visible ? " is-visible" : "")
            }
            aria-hidden={!visible}
        >
            {renderPlayerRow(
                black,
                "black",
                blackActive,
                visible,
                controller,
                state,
                blackCaptures,
            )}
            {renderPlayerRow(
                white,
                "white",
                whiteActive,
                visible,
                controller,
                state,
                whiteCaptures,
            )}
        </div>
    );
}

function renderMetadataFace(
    lines: [MetadataFaceLine, MetadataFaceLine],
    visible: boolean,
): React.ReactElement {
    return (
        <div
            className={
                "KibitzMobileMainGameScoreboard-face KibitzMobileMainGameScoreboard-face--metadata" +
                (visible ? " is-visible" : "")
            }
            aria-hidden={!visible}
        >
            <span className="KibitzMobileMainGameScoreboard-metadataLabel">{lines[0].label}</span>
            <span className="KibitzMobileMainGameScoreboard-metadataValue">{lines[0].value}</span>
            <span className="KibitzMobileMainGameScoreboard-metadataLabel">{lines[1].label}</span>
            <span className="KibitzMobileMainGameScoreboard-metadataValue">{lines[1].value}</span>
        </div>
    );
}

function renderScoreboardFace(
    game: KibitzWatchedGame,
    controller: GobanController | null,
    state: ScoreboardState,
    score: GameScore | null,
    playerToMove: number,
    face: ScoreboardFace,
    metadataLines: [MetadataFaceLine, MetadataFaceLine],
): React.ReactElement {
    const blackCaptures = controller ? score?.black?.prisoners : null;
    const whiteCaptures = controller ? score?.white?.prisoners : null;
    const blackActive = controller
        ? state.phase !== "finished" && playerToMove === game.black.id
        : false;
    const whiteActive = controller
        ? state.phase !== "finished" && playerToMove === game.white.id
        : false;

    return (
        <div className="KibitzMobileMainGameScoreboard-faceStage">
            {renderPlayerFace(
                game.black,
                blackActive,
                blackCaptures,
                game.white,
                whiteActive,
                whiteCaptures,
                controller,
                state,
                face === "player",
            )}
            {renderMetadataFace(metadataLines, face === "metadata")}
        </div>
    );
}

export function KibitzMobileMainGameScoreboard({
    controller,
    game,
    isMainBoardVisible,
    isInteractionPaused = false,
}: KibitzMobileMainGameScoreboardProps): React.ReactElement | null {
    const goban = controller?.goban ?? null;
    const score = useGameScore(goban);
    const state = useScoreboardState(goban);
    const playerToMove = usePlayerToMove(goban);
    const [localInteractionPaused, setLocalInteractionPaused] = React.useState(false);
    const [cycleFace, setCycleFace] = React.useState<ScoreboardFace>("player");
    const prefersReducedMotion = usePrefersReducedMotion();

    React.useEffect(() => {
        if (!isMainBoardVisible) {
            setLocalInteractionPaused(false);
        }
    }, [isMainBoardVisible]);

    React.useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const isRelevantTarget = (event: Event): boolean =>
            event.target instanceof Element &&
            event.target.closest(".Kibitz-mobile-room-header, .Kibitz-mobile-board-host") != null;

        const pause = () => {
            setLocalInteractionPaused(true);
        };

        const resume = () => {
            setLocalInteractionPaused(false);
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (isRelevantTarget(event)) {
                pause();
            }
        };

        const handlePointerUp = () => {
            resume();
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (isRelevantTarget(event)) {
                pause();
            }
        };

        const handleTouchEnd = () => {
            resume();
        };

        window.addEventListener("pointerdown", handlePointerDown, true);
        window.addEventListener("pointerup", handlePointerUp, true);
        window.addEventListener("pointercancel", handlePointerUp, true);
        window.addEventListener("touchstart", handleTouchStart, true);
        window.addEventListener("touchend", handleTouchEnd, true);
        window.addEventListener("touchcancel", handleTouchEnd, true);

        return () => {
            window.removeEventListener("pointerdown", handlePointerDown, true);
            window.removeEventListener("pointerup", handlePointerUp, true);
            window.removeEventListener("pointercancel", handlePointerUp, true);
            window.removeEventListener("touchstart", handleTouchStart, true);
            window.removeEventListener("touchend", handleTouchEnd, true);
            window.removeEventListener("touchcancel", handleTouchEnd, true);
        };
    }, []);

    const interactionPaused = Boolean(isInteractionPaused || localInteractionPaused);
    const stateToken = controller && game ? getStateToken(game, state) : null;
    const shouldPinMetadataFace = getShouldPinMetadataFace(state);
    const shouldCycleFace =
        Boolean(controller && game && isMainBoardVisible) &&
        !interactionPaused &&
        !prefersReducedMotion &&
        !shouldPinMetadataFace;

    React.useEffect(() => {
        if (!shouldCycleFace) {
            setCycleFace(shouldPinMetadataFace ? "metadata" : "player");
            return undefined;
        }

        let cancelled = false;
        const intervalId = window.setInterval(() => {
            if (cancelled) {
                return;
            }

            setCycleFace("metadata");
            metadataTimeout = window.setTimeout(() => {
                if (cancelled) {
                    return;
                }

                setCycleFace("player");
            }, 2000);
        }, 10000);
        let metadataTimeout: number | undefined;

        setCycleFace("player");

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            if (metadataTimeout !== undefined) {
                window.clearTimeout(metadataTimeout);
            }
        };
    }, [shouldCycleFace, shouldPinMetadataFace, game?.game_id]);

    if (!game || !isMainBoardVisible) {
        return null;
    }
    const metadataLines = getMetadataFaceLines(game, controller, state, stateToken);
    const visibleFace: ScoreboardFace = shouldPinMetadataFace ? "metadata" : cycleFace;

    return (
        <div className="KibitzMobileMainGameScoreboard">
            <div className="KibitzMobileMainGameScoreboard-inner">
                {renderScoreboardFace(
                    game,
                    controller,
                    state,
                    score,
                    playerToMove,
                    visibleFace,
                    metadataLines,
                )}
            </div>
        </div>
    );
}
