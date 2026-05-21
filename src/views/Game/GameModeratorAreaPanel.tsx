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
import { useUser } from "@/lib/hooks";
import { browserHistory } from "@/lib/ogsHistory";
import { doAnnul } from "@/lib/moderation";
import { usePreference } from "@/lib/preferences";
import { Player } from "@/components/Player";
import { useGobanController } from "./goban_context";
import { usePhase } from "./GameHooks";
import "./GameModeratorAreaPanel.css";

type PlayerType = rest_api.games.Player;

interface GameModeratorAreaPanelProps {
    historical_black: PlayerType | null;
    historical_white: PlayerType | null;
    black_flags: rest_api.GamePlayerFlags | null;
    white_flags: rest_api.GamePlayerFlags | null;
    bot_detection_results: any;
}

/**
 * Per-player moderator panel: navigation/annul controls and flag
 * indicators (AI Suspected, blur rate, slow_moving) for each color. Sits
 * inside the gavel toggle tab alongside GameModToolsPanel.
 *
 * Renders `null` for non-moderators (or games without an id), so it can
 * be dropped into the toggle tab unconditionally — non-mods just see the
 * GameModToolsPanel content (e.g. AI-detector inspect tools) below.
 */
export function GameModeratorAreaPanel({
    historical_black,
    historical_white,
    black_flags,
    white_flags,
    bot_detection_results,
}: GameModeratorAreaPanelProps): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const user = useUser();
    const phase = usePhase(goban);
    const [hide_flags] = usePreference("moderator.hide-flags");
    const game_id = goban.config.game_id ? Number(goban.config.game_id) : 0;

    if (!user?.is_moderator || !game_id) {
        return null;
    }

    const black_ai_suspected = !!bot_detection_results?.ai_suspected?.includes(
        historical_black?.id,
    );
    const white_ai_suspected = !!bot_detection_results?.ai_suspected?.includes(
        historical_white?.id,
    );

    return (
        <div className="GameModeratorAreaPanel">
            <PlayerModSection
                color="black"
                player_id={engine.players.black?.id}
                historical={historical_black}
                ai_suspected={black_ai_suspected}
                flags={black_flags}
                hide_flags={hide_flags}
                phase={phase}
                game_id={game_id}
            />
            <PlayerModSection
                color="white"
                player_id={engine.players.white?.id}
                historical={historical_white}
                ai_suspected={white_ai_suspected}
                flags={white_flags}
                hide_flags={hide_flags}
                phase={phase}
                game_id={game_id}
            />
        </div>
    );
}

interface PlayerModSectionProps {
    color: "black" | "white";
    player_id: number | undefined;
    historical: PlayerType | null;
    ai_suspected: boolean;
    flags: rest_api.GamePlayerFlags | null;
    hide_flags: boolean;
    phase: string | undefined;
    game_id: number;
}

function PlayerModSection({
    color,
    player_id,
    historical,
    ai_suspected,
    flags,
    hide_flags,
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
