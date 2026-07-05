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
import { _, moment } from "@/lib/translate";
import { get } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import { doAnnul } from "@/lib/moderation";
import { Player } from "@/components/Player";
import { useGobanController } from "./goban_context";
import "./PlayerModSection.css";

interface PlayerModSectionProps {
    color: "black" | "white";
    player_id: number | undefined;
    historical: rest_api.games.Player | null;
    ai_suspected: boolean;
    flags: rest_api.GamePlayerFlags | null;
    hide_flags: boolean;
    /** Suppress the prev/next-game navigation and annul-with-blame buttons
     *  (the `moderator.hide-player-card-mod-controls` preference). */
    hide_controls: boolean;
    phase: string | undefined;
    game_id: number;
}

/** One color's row in the moderator area: player identity, prev/next-game
 *  navigation, annul-with-blame, and flag indicators. */
export function PlayerModSection({
    color,
    player_id,
    historical,
    ai_suspected,
    flags,
    hide_flags,
    hide_controls,
    phase,
    game_id,
}: PlayerModSectionProps): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const player = engine.players[color];

    const jumpToPrevGame = () => {
        if (!player_id) {
            return;
        }
        get(`games/${game_id}/prev/${player_id}`)
            .then((body) => {
                browserHistory.push(`/game/${body.id}`);
            })
            .catch((e) => {
                console.debug("No previous game", e);
            });
    };

    const jumpToNextGame = () => {
        if (!player_id) {
            return;
        }
        get(`games/${game_id}/next/${player_id}`)
            .then((body) => {
                browserHistory.push(`/game/${body.id}`);
            })
            .catch((e) => {
                console.debug("No next game", e);
            });
    };

    const annulWithBlame = () => {
        // The trailing/leading spaces around the color match the existing
        // moderation-note formatting in PlayerCard so the existing
        // server-side parsing still works.
        doAnnul(engine.config, true, null, ` ${color} `);
    };

    return (
        <div className={"PlayerModSection " + color}>
            <div className="PlayerModSection-header">
                <span className={"PlayerModSection-color-dot " + color} />
                {player?.id ? (
                    <Player user={player.id} historical={(!engine.rengo && historical) || player} />
                ) : (
                    <span>{color === "black" ? _("Black") : _("White")}</span>
                )}
            </div>
            {!hide_controls && (
                <div className="PlayerModSection-controls">
                    <button
                        type="button"
                        className="PlayerModSection-button"
                        onClick={jumpToPrevGame}
                        title={_("Previous game by this player")}
                        aria-label={_("Previous game by this player")}
                        disabled={!player_id}
                    >
                        <i className="fa fa-angle-left" />
                    </button>
                    {phase === "finished" && (
                        <button
                            type="button"
                            className="PlayerModSection-button PlayerModSection-button-annul"
                            onClick={annulWithBlame}
                            title={_("Annul, blaming this player")}
                            aria-label={_("Annul, blaming this player")}
                        >
                            <i className="fa fa-gavel" />
                        </button>
                    )}
                    <button
                        type="button"
                        className="PlayerModSection-button"
                        onClick={jumpToNextGame}
                        title={_("Next game by this player")}
                        aria-label={_("Next game by this player")}
                        disabled={!player_id}
                    >
                        <i className="fa fa-angle-right" />
                    </button>
                </div>
            )}
            {!hide_flags && (ai_suspected || (flags && Object.keys(flags).length > 0)) && (
                <div className="PlayerModSection-flags">
                    {ai_suspected && (
                        <div className="PlayerModSection-flag">
                            <i className="fa fa-flag" /> {_("AI Suspected")}
                        </div>
                    )}
                    {flags &&
                        Object.keys(flags).map((flag) => (
                            <div key={flag} className="PlayerModSection-flag">
                                <i className="fa fa-flag" /> {flag}:{" "}
                                {flag === "blur_rate"
                                    ? `${Math.round((flags[flag] as number) * 100.0)}%`
                                    : flag === "slow_moving"
                                      ? moment.duration(flags[flag] as number).humanize()
                                      : (flags[flag] as React.ReactNode)}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
