/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Goban, Score, PlayerScore } from "goban";
import { icon_size_url } from "PlayerIcon";
import { CountDown } from "./CountDown";
import { Flag } from "Flag";
import { ChatPresenceIndicator } from "ChatPresenceIndicator";
import { Clock } from "Clock";
import { Player } from "Player";
import { lookup, fetch } from "player_cache";
import { _, interpolate, ngettext } from "translate";
import * as data from "data";
import { usePlayerToMove } from "./GameHooks";

type PlayerType = rest_api.games.Player;

interface PlayerCardsProps {
    goban: Goban;
    historical_black: PlayerType;
    historical_white: PlayerType;
    black_auto_resign_expiration: Date;
    white_auto_resign_expiration: Date;
    game_id: number;
    review_id: number;
    estimating_score: boolean;
    zen_mode: boolean;
    score: Score;
    show_title: boolean;
    title: string;
}

export function PlayerCards({
    goban,
    historical_black,
    historical_white,
    black_auto_resign_expiration,
    white_auto_resign_expiration,
    game_id,
    review_id,
    estimating_score,
    zen_mode,
    score,
    show_title,
    title,
}: PlayerCardsProps): JSX.Element {
    const engine = goban.engine;

    const orig_marks = React.useRef<string | null>(null);
    const showing_scores = React.useRef<boolean>(false);

    const [show_score_breakdown, set_show_score_breakdown] = React.useState(false);

    const player_to_move = usePlayerToMove(goban);

    const popupScores = () => {
        if (goban.engine.cur_move) {
            orig_marks.current = JSON.stringify(goban.engine.cur_move.getAllMarks());
            goban.engine.cur_move.clearMarks();
        } else {
            orig_marks.current = null;
        }

        _popupScores("black");
        _popupScores("white");
    };
    const _popupScores = (color: "black" | "white") => {
        const only_prisoners = false;
        const scores = goban.engine.computeScore(only_prisoners);
        showing_scores.current = goban.showing_scores;
        goban.showScores(scores);

        const score = scores[color];
        let html = "";
        if (!only_prisoners) {
            html += "<div class='score_breakdown'>";
            if (score.stones) {
                html +=
                    "<div><span>" + _("Stones") + "</span><div>" + score.stones + "</div></div>";
            }
            if (score.territory) {
                html +=
                    "<div><span>" +
                    _("Territory") +
                    "</span><div>" +
                    score.territory +
                    "</div></div>";
            }
            if (score.prisoners) {
                html +=
                    "<div><span>" +
                    _("Prisoners") +
                    "</span><div>" +
                    score.prisoners +
                    "</div></div>";
            }
            if (score.handicap) {
                html +=
                    "<div><span>" +
                    _("Handicap") +
                    "</span><div>" +
                    score.handicap +
                    "</div></div>";
            }
            if (score.komi) {
                html += "<div><span>" + _("Komi") + "</span><div>" + score.komi + "</div></div>";
            }

            if (!score.stones && !score.territory && !score.prisoners && !score.komi) {
                html += "<div><span>" + _("No score yet") + "</span>";
            }

            html += "<div>";
        } else {
            html += "<div class='score_breakdown'>";
            if (score.komi) {
                html += "<div><span>" + _("Komi") + "</span><div>" + score.komi + "</div></div>";
            }
            html +=
                "<div><span>" + _("Prisoners") + "</span><div>" + score.prisoners + "</div></div>";
            html += "<div>";
        }

        $("#" + color + "-score-details").html(html);
        set_show_score_breakdown(true);
    };
    const hideScores = () => {
        if (!showing_scores.current) {
            goban.hideScores();
        }
        if (goban.engine.cur_move && orig_marks.current) {
            goban.engine.cur_move.setAllMarks(JSON.parse(orig_marks.current));
        }
        goban.redraw();

        $("#black-score-details").children().remove();
        $("#white-score-details").children().remove();

        set_show_score_breakdown(false);
    };

    const onClick = () => (show_score_breakdown ? hideScores() : popupScores());
    const chat_channel = game_id ? `game-${game_id}` : `review-${review_id}`;

    return (
        <div className="players">
            <div className="player-icons">
                <PlayerCard
                    historical={historical_black}
                    auto_resign_expiration={black_auto_resign_expiration}
                    color="black"
                    score={score["black"]}
                    goban={goban}
                    player_to_move={player_to_move}
                    estimating_score={estimating_score}
                    show_score_breakdown={show_score_breakdown}
                    onClick={onClick}
                    chat_channel={chat_channel}
                    zen_mode={zen_mode}
                />
                <PlayerCard
                    historical={historical_white}
                    auto_resign_expiration={white_auto_resign_expiration}
                    color="white"
                    score={score["white"]}
                    goban={goban}
                    player_to_move={player_to_move}
                    estimating_score={estimating_score}
                    show_score_breakdown={show_score_breakdown}
                    onClick={onClick}
                    chat_channel={chat_channel}
                    zen_mode={zen_mode}
                />
            </div>
            {(engine.rengo || null) && (
                <div className="rengo-header-block">
                    {
                        /* Title logic doesn't really belong in PlayerCards, but it appears it was
                        added here so that in vertical-mode, the "White/Black to Move" message shows
                        up above the board, not below it.

                        TODO: move title logic out of this component.
                        */
                        ((!review_id && show_title && goban?.engine?.rengo) || null) && (
                            <div className="game-state">{title}</div>
                        )
                    }
                </div>
            )}
        </div>
    );
}

interface NumCapturesProps {
    score: PlayerScore;
    color: "black" | "white";
    zen_mode: boolean;
    estimating_score: boolean;
}
function NumCapturesText({ color, score, zen_mode, estimating_score }: NumCapturesProps) {
    const num_prisoners = score.prisoners;
    const prisoner_color = color === "black" ? "white" : "black";
    const prisoner_img_src = data.get("config.cdn_release") + "/img/" + prisoner_color + ".png";
    return (
        <div className={"captures" + (estimating_score ? " hidden" : "")}>
            <span className="num-captures-container">
                <span className="num-captures-count">{num_prisoners}</span>
                {(!zen_mode || null) && (
                    <span className="num-captures-units">
                        {` ${ngettext("capture", "captures", num_prisoners)}`}
                    </span>
                )}
                {(zen_mode || null) && (
                    <span className="num-captures-stone">
                        {" "}
                        <img className="stone-image" src={prisoner_img_src} />
                    </span>
                )}
            </span>
        </div>
    );
}

interface PlayerCardProps {
    score: PlayerScore;
    color: "black" | "white";
    goban: Goban;
    auto_resign_expiration: Date;
    historical: PlayerType;
    player_to_move: number;
    estimating_score: boolean;
    show_score_breakdown: boolean;
    onClick: () => void;
    chat_channel: string;
    zen_mode: boolean;
}

function PlayerCard({
    score,
    color,
    goban,
    auto_resign_expiration,
    historical,
    player_to_move,
    estimating_score,
    show_score_breakdown,
    onClick,
    chat_channel,
    zen_mode,
}: PlayerCardProps) {
    const engine = goban.engine;
    const player = engine.players[color];

    // In rengo we always will have a player icon to show (after initialisation).
    // In other cases, we only have one if `historical` is set
    const player_bg: React.CSSProperties = {};
    if (engine.rengo && player && (player as any)["icon-url"]) {
        // Does icon-url need to be added to GoEnginePlayerEntry? -BPJ
        const icon = icon_size_url((player as any)["icon-url"], 64);
        player_bg.backgroundImage = `url("${icon}")`;
    } else if (historical) {
        const icon = icon_size_url(historical["icon"], 64);
        player_bg.backgroundImage = `url("${icon}")`;
    }

    const their_turn = player_to_move === player.id;
    const highlight_their_turn = their_turn ? `their-turn` : "";

    const show_points =
        (engine.phase === "finished" || engine.phase === "stone removal") &&
        goban.mode !== "analyze" &&
        engine.outcome !== "Timeout" &&
        engine.outcome !== "Resignation" &&
        engine.outcome !== "Cancellation";

    return (
        <div className={`${color} ${highlight_their_turn} player-container`}>
            <div className="player-icon-clock-row">
                {((player && player.id) || null) && (
                    <div className="player-icon-container" style={player_bg}>
                        {auto_resign_expiration && (
                            <div className={`auto-resign-overlay`}>
                                <i className="fa fa-bolt" />
                                <CountDown to={auto_resign_expiration} />
                            </div>
                        )}
                        <div className="player-flag">
                            <PlayerFlag player_id={player.id} />
                        </div>
                        <ChatPresenceIndicator channel={chat_channel} userId={player.id} />
                    </div>
                )}

                {((engine.phase !== "finished" && !goban.review_id) || null) && (
                    <Clock goban={goban} color={color} className="in-game-clock" />
                )}
            </div>

            {((player && player.rank !== -1) || null) && (
                <div className={`${color} player-name-container`}>
                    <Player user={player.id} historical={(!engine.rengo && historical) || player} />
                </div>
            )}

            {(!player || null) && (
                <span className="player-name-plain">
                    {color === "black" ? _("Black") : _("White")}
                </span>
            )}

            <div
                className={
                    "score-container " + (show_score_breakdown ? "show-score-breakdown" : "")
                }
                onClick={onClick}
            >
                {show_points && (
                    <div className={"points" + (estimating_score ? " hidden" : "")}>
                        {interpolate(_("{{total}} {{unit}}"), {
                            total: score.total,
                            unit: ngettext("point", "points", score.total),
                        })}
                    </div>
                )}
                {!show_points && (
                    <NumCapturesText
                        score={score}
                        color={color}
                        zen_mode={zen_mode}
                        estimating_score={estimating_score}
                    />
                )}
                {!show_points && (
                    <div className="komi">
                        {score.komi === 0 ? "" : `+ ${score.komi.toFixed(1)}`}
                    </div>
                )}
                <div id={`${color}-score-details`} className="score-details" />
            </div>
            {!!(engine.rengo && engine.rengo_teams) && (
                <div className={"rengo-team-members player-name-container " + color}>
                    {engine.rengo_teams[color].slice(1).map((player) => (
                        <div className={"rengo-team-member"} key={player.id}>
                            {<Player user={player} icon rank />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PlayerFlag({ player_id }: { player_id: number }): JSX.Element {
    const [country, setCountry] = React.useState<string>(lookup(player_id)?.country);

    React.useEffect(() => {
        let cancelled = false;
        fetch(player_id, ["country"])
            .then((e) => {
                if (!cancelled) {
                    setCountry(e.country);
                }
            })
            .catch(() => {
                console.error("Error resolving player country", player_id);
            });

        return () => {
            cancelled = true;
        };
    }, [player_id]);

    if (country) {
        return <Flag country={country} />;
    }
    return null;
}
