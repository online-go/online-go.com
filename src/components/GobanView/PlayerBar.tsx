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
import { GobanEnginePlayerEntry, GobanEvents, GobanRenderer } from "goban";
import type { GobanController } from "@/lib/GobanController";
import { _, interpolate, ngettext } from "@/lib/translate";
import { Clock } from "@/components/Clock";
import { PlayerIcon } from "@/components/PlayerIcon";
import { Player } from "@/components/Player";
import { useGobanController } from "./GobanViewContext";
import { subscribeAllEvents } from "./hooks";
import { outcomeHasScore } from "./util";
import "./PlayerBar.css";

interface PlayerBarProps {
    color: "black" | "white";
    /** The game to show. Defaults to the GobanControllerContext controller. */
    controller?: GobanController;
}

interface PlayerBarState {
    player_id: number;
    username: string;
    player: GobanEnginePlayerEntry;
    their_turn: boolean;
    score_line: string;
}

/** " + 6.5" / " - 6.5", matching the game page's komi display. */
function komiString(komi: number): string {
    const abs_komi = Math.abs(komi).toFixed(1);
    return komi > 0 ? ` + ${abs_komi}` : ` - ${abs_komi}`;
}

function deriveState(goban: GobanRenderer, color: "black" | "white"): PlayerBarState {
    const engine = goban.engine;
    const player = engine.players[color];
    const finished = engine.phase === "finished" || engine.phase === "stone removal";
    const outcome = engine.outcome ?? "";
    const show_points = finished && goban.mode !== "analyze" && outcomeHasScore(outcome);
    const score = engine.computeScore(!show_points)[color];
    // Komi rides on the capture line, as it does on the game page: "0 + 6.5"
    // is no captures and 6.5 komi. Points already include it, so it is only
    // spelled out while captures are what is shown.
    const komi_line = !show_points && score.komi ? komiString(score.komi) : "";
    const score_line = show_points
        ? interpolate(_("{{total}} {{unit}}"), {
              total: score.total,
              unit: ngettext("point", "points", score.total),
          })
        : interpolate(_("{{count}} {{unit}}"), {
              count: score.prisoners,
              unit: ngettext("capture", "captures", score.prisoners),
          }) + komi_line;
    return {
        player_id: player.id,
        username: player.username,
        player,
        their_turn: engine.phase === "play" && engine.playerToMoveOnOfficialBranch() === player.id,
        score_line,
    };
}

const PLAYER_BAR_EVENTS: Array<keyof Omit<GobanEvents, "load">> = [
    "phase",
    "mode",
    "outcome",
    "stone-removal.accepted",
    "stone-removal.updated",
    "cur_move",
    "last_official_move",
    "gamedata",
    "winner",
];

function usePlayerBarState(goban: GobanRenderer, color: "black" | "white"): PlayerBarState {
    const [state, setState] = React.useState(() => deriveState(goban, color));
    React.useEffect(() => {
        const sync = () => setState(deriveState(goban, color));
        sync();
        return subscribeAllEvents(goban, PLAYER_BAR_EVENTS, sync);
    }, [goban, color]);
    return state;
}

/**
 * One player's strip for the board area: icon on the left, username with
 * the capture or point count stacked beside it, clock on the right.
 * Reads the goban from `controller`, or from GobanControllerContext.
 */
export function PlayerBar({
    color,
    controller: controllerProp,
}: PlayerBarProps): React.ReactElement {
    const contextController = useGobanController();
    const goban = (controllerProp ?? contextController).goban;
    const state = usePlayerBarState(goban, color);

    return (
        <div className={`PlayerBar ${color}` + (state.their_turn ? " their-turn" : "")}>
            <div className="PlayerBar-icon">
                {state.player_id ? (
                    <PlayerIcon id={state.player_id} size={64} />
                ) : (
                    <div className={`PlayerBar-stone ${color}`} />
                )}
            </div>
            <div className="PlayerBar-text">
                <div className="PlayerBar-name">
                    {state.player_id ? (
                        <Player
                            user={state.player_id}
                            historical={state.player}
                            gameId={goban.game_id}
                        />
                    ) : (
                        <span className="PlayerBar-name-plain">{state.username}</span>
                    )}
                </div>
                <div className="PlayerBar-score">{state.score_line}</div>
            </div>
            <div className="PlayerBar-clock">
                <Clock goban={goban} color={color} compact />
            </div>
        </div>
    );
}
