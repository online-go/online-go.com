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
import { get } from "@/lib/requests";

import { GobanRenderer, Goban, PlayerScore, JGOFPlayerSummary } from "goban";
import { icon_size_url } from "@/components/PlayerIcon";
import { CountDown } from "./CountDown";
import { Flag } from "@/components/Flag";
import { ChatPresenceIndicator } from "@/components/ChatPresenceIndicator";
import { Clock } from "@/components/Clock";
import { useUser } from "@/lib/hooks";
import { Player } from "@/components/Player";
import { lookup, fetch } from "@/lib/player_cache";
import { _, interpolate, ngettext } from "@/lib/translate";
import * as data from "@/lib/data";
import { generateGobanHook, usePlayerToMove } from "./GameHooks";
import { get_network_latency, get_clock_drift } from "@/lib/sockets";
import { useGoban } from "./goban_context";
import { usePreference } from "@/lib/preferences";
import { browserHistory } from "@/lib/ogsHistory";
import { player_is_ignored } from "@/components/BlockPlayer";
import { doAnnul } from "@/lib/moderation";
import moment from "moment";

type PlayerType = rest_api.games.Player;

interface PlayerCardsProps {
    historical_black: PlayerType | null;
    historical_white: PlayerType | null;
    estimating_score: boolean;
    zen_mode: boolean;
    black_flags: null | rest_api.GamePlayerFlags;
    white_flags: null | rest_api.GamePlayerFlags;
    black_ai_suspected: boolean;
    white_ai_suspected: boolean;
}

export function PlayerCards({
    historical_black,
    historical_white,
    estimating_score,
    zen_mode,
    black_flags,
    white_flags,
    black_ai_suspected,
    white_ai_suspected,
}: PlayerCardsProps): React.ReactElement {
    const goban = useGoban();

    const orig_marks = React.useRef<string | null>(null);
    const showing_scores = React.useRef<boolean>(false);

    const [show_score_breakdown, set_show_score_breakdown] = React.useState(false);

    const popupScores = () => {
        if (goban.engine.cur_move) {
            orig_marks.current = JSON.stringify(goban.engine.cur_move.getAllMarks());
            goban.engine.cur_move.clearMarks();
        } else {
            orig_marks.current = null;
        }

        const scores = goban.engine.computeScore(false);
        showing_scores.current = goban.showing_scores;
        goban.showScores(scores);

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

        set_show_score_breakdown(false);
    };

    const toggleScorePopup = () => (show_score_breakdown ? hideScores() : popupScores());

    return (
        <div className="players">
            <div className="player-icons">
                <PlayerCard
                    historical={historical_black}
                    color="black"
                    goban={goban}
                    estimating_score={estimating_score}
                    show_score_breakdown={show_score_breakdown}
                    onScoreClick={toggleScorePopup}
                    zen_mode={zen_mode}
                    flags={black_flags}
                    ai_suspected={black_ai_suspected}
                />
                <PlayerCard
                    historical={historical_white}
                    color="white"
                    goban={goban}
                    estimating_score={estimating_score}
                    show_score_breakdown={show_score_breakdown}
                    onScoreClick={toggleScorePopup}
                    zen_mode={zen_mode}
                    flags={white_flags}
                    ai_suspected={white_ai_suspected}
                />
            </div>
        </div>
    );
}

interface NumCapturesProps {
    score: PlayerScore;
    color: "black" | "white";
    zen_mode: boolean;
    hidden: boolean;
}
function NumCapturesText({ color, score, zen_mode, hidden }: NumCapturesProps) {
    const num_prisoners = score.prisoners;
    const prisoner_color = color === "black" ? "white" : "black";
    const prisoner_img_src = data.get("config.cdn_release") + "/img/" + prisoner_color + ".png";
    return (
        <div className={"captures" + (hidden ? " hidden" : "")}>
            <span className="num-captures-container">
                <span className="num-captures-count">{num_prisoners}</span>
                {!zen_mode && (
                    <span className="num-captures-units">
                        {` ${ngettext("capture", "captures", num_prisoners)}`}
                    </span>
                )}
                {zen_mode && (
                    <span className="num-captures-stone">
                        {" "}
                        <img className="stone-image" src={prisoner_img_src} />
                    </span>
                )}
            </span>
        </div>
    );
}

const useScore = generateGobanHook(
    (goban: Goban) => {
        const engine = goban.engine;

        // TODO: decouple this from stone_removal
        // The issue is that GobanEngine.computeScore() will not return accurate
        // prisoners and total at the same time.  One must choose using the
        // boolean argument.
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
        } else {
            return engine.computeScore(true);
        }
    },
    ["phase", "mode", "outcome", "stone-removal.accepted", "stone-removal.updated", "cur_move"],
);
interface PlayerCardProps {
    color: "black" | "white";
    goban: GobanRenderer;
    historical: PlayerType | null;
    estimating_score: boolean;
    show_score_breakdown: boolean;
    onScoreClick: () => void;
    zen_mode: boolean;
    flags: null | rest_api.GamePlayerFlags;
    ai_suspected: boolean;
}

export function PlayerCard({
    color,
    goban,
    historical,
    estimating_score,
    show_score_breakdown,
    onScoreClick,
    zen_mode,
    flags,
    ai_suspected,
}: PlayerCardProps) {
    const engine = goban.engine;
    const player = { ...engine.players[color] };
    const player_to_move = usePlayerToMove(goban);
    const [hide_flags] = usePreference("moderator.hide-flags");

    const auto_resign_expiration = useAutoResignExpiration(goban, color);
    const score = useScore(goban)[color];
    const { game_id, review_id } = goban;
    const chat_channel = game_id ? `game-${game_id}` : `review-${review_id}`;
    const [hide_player_card_mod_controls] = usePreference(
        "moderator.hide-player-card-mod-controls",
    );

    const user = useUser();

    if (goban.is_game_record) {
        player.id = 0;
        historical = null;
    }

    const show_player_card_mod_controls =
        user.is_moderator && game_id && !hide_player_card_mod_controls && !!player.id;

    const jumpToPrevGame = () => {
        get(`games/${game_id}/prev/${player.id}`)
            .then((body) => {
                const prev_game = body.id;
                browserHistory.push(`/game/${prev_game}`);
            })
            .catch((e) => {
                console.debug("No previous game", e);
            });
    };

    const jumpToNextGame = () => {
        get(`games/${game_id}/next/${player.id}`)
            .then((body) => {
                const next_game = body.id;
                browserHistory.push(`/game/${next_game}`);
            })
            .catch((e) => {
                console.debug("No next game", e);
            });
    };

    const annulWithBlame = () => {
        doAnnul(engine.config, true, null, ` ${color} `); // spaces make it easy for the user to put the cursor before or after, they are trimmed later
    };

    // In rengo we always will have a player icon to show (after initialization).
    // In other cases, we only have one if `historical` is set
    const player_bg: React.CSSProperties = {};
    if (engine.rengo && player && (player as any)["icon-url"]) {
        // Does icon-url need to be added to GobanEnginePlayerEntry? -BPJ
        const icon = icon_size_url((player as any)["icon-url"], 64);
        player_bg.backgroundImage = `url("${icon}")`;
    } else if (historical) {
        const icon = icon_size_url(historical["icon"], 64);
        player_bg.backgroundImage = `url("${icon}")`;
    }

    if (player_is_ignored(player.id)) {
        player_bg.backgroundImage = ``;
    }

    const their_turn = player_to_move === player.id;
    const highlight_their_turn = their_turn ? `their-turn` : "";

    const show_points =
        (engine.phase === "finished" || engine.phase === "stone removal") &&
        goban.mode !== "analyze" &&
        engine.outcome !== "Timeout" &&
        engine.outcome !== "Resignation" &&
        engine.outcome !== "Cancellation" &&
        !engine.outcome.startsWith("Server Decision");

    return (
        <div className={`${color} ${highlight_their_turn} player-container`}>
            <div className="player-icon-clock-row">
                {player && !!player.id && (
                    <div className="player-icon-container" style={player_bg}>
                        {!!auto_resign_expiration && (
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

                {engine.phase !== "finished" && !goban.review_id && (
                    <Clock goban={goban} color={color} className="in-game-clock" />
                )}
            </div>

            {player && player.rank !== -1 && (
                <div className={`${color} player-name-container`}>
                    <Player user={player.id} historical={(!engine.rengo && historical) || player} />
                </div>
            )}

            {!player && (
                <span className="player-name-plain">
                    {color === "black" ? _("Black") : _("White")}
                </span>
            )}

            {show_player_card_mod_controls && (
                <div className="player-card-mod-controls">
                    <i className="fa fa-2x fa-angle-left" onClick={jumpToPrevGame} />
                    <div className="middle-mod-controls">
                        {engine.phase === "finished" && (
                            <i className="fa fa-gavel" onClick={annulWithBlame} />
                        )}
                    </div>
                    <i className="fa fa-2x fa-angle-right" onClick={jumpToNextGame} />
                </div>
            )}

            <div
                className={
                    "score-container " + (show_score_breakdown ? "show-score-breakdown" : "")
                }
                onClick={onScoreClick}
            >
                {show_points && !estimating_score && (
                    <div className="points">
                        {interpolate(_("{{total}} {{unit}}"), {
                            total: score.total,
                            unit: ngettext("point", "points", score.total),
                        })}
                    </div>
                )}
                {(!show_points || estimating_score) && (
                    <NumCapturesText
                        score={score}
                        color={color}
                        zen_mode={zen_mode}
                        hidden={show_points && !estimating_score}
                    />
                )}
                {color === "black" && handicapStones(engine.config.handicap)}
                {!show_points && !!score.komi && (
                    <div className="komi">{komiString(score.komi)}</div>
                )}
                <div id={`${color}-score-details`} className="score-details">
                    <ScorePopup goban={goban} color={color} show={show_score_breakdown} />
                </div>
                {!hide_flags && ai_suspected && (
                    <div className="player-flags">
                        <i className="fa fa-flag" />
                        {" AI Suspected"}
                    </div>
                )}
                {!hide_flags && flags && (
                    <div className="player-flags">
                        {Object.keys(flags).map((flag) => (
                            <div key={flag}>
                                <i className="fa fa-flag" /> {flag}:{" "}
                                {flag === "blur_rate"
                                    ? `${Math.round((flags[flag] as number) * 100.0)}%`
                                    : flag === "slow_moving"
                                      ? moment.duration(flags[flag] as number).humanize()
                                      : flags[flag]}
                            </div>
                        ))}
                    </div>
                )}
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

function PlayerFlag({ player_id }: { player_id: number }): React.ReactElement | null {
    const [country, setCountry] = React.useState<string | undefined>(lookup(player_id)?.country);

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
        return <Flag country={country} big />;
    }
    return null;
}

function komiString(komi: number) {
    if (!komi) {
        return "";
    }
    const abs_komi = Math.abs(komi).toFixed(1);
    return komi > 0 ? `+ ${abs_komi}` : `- ${abs_komi}`;
}

function handicapStones(handicap_stones: number | undefined) {
    const stones = handicap_stones ? stonesString(handicap_stones) : "";
    return (
        <div className="handicap-stones">
            {stones && <span title={_("Handicap") + ": " + handicap_stones}>{stones}</span>}
        </div>
    );
}

function stonesString(handicap_stones: number) {
    if (handicap_stones <= 0) {
        return "";
    }
    const one = 0x2460;
    const twenty_one = 0x3251;
    const thirty_six = 0x32b1;
    if (handicap_stones <= 20) {
        return String.fromCodePoint(one + handicap_stones - 1);
    }
    if (handicap_stones <= 35) {
        return String.fromCodePoint(twenty_one + handicap_stones - 21);
    }
    if (handicap_stones <= 50) {
        return String.fromCodePoint(thirty_six + handicap_stones - 36);
    }
    return "(" + handicap_stones + ")";
}

function useAutoResignExpiration(goban: Goban, color: "black" | "white") {
    const [auto_resign_expiration, setAutoResignExpiration] = React.useState<Date | null>(null);
    React.useEffect(() => {
        const handleAutoResign = (data?: { player_id: number; expiration: number }) => {
            if (goban.engine && data?.player_id === goban.engine.players[color].id) {
                setAutoResignExpiration(
                    new Date(data?.expiration - get_network_latency() + get_clock_drift()),
                );
            }
        };
        const handleClearAutoResign = (data?: { player_id: number }) => {
            if (goban.engine && data?.player_id === goban.engine.players[color].id) {
                setAutoResignExpiration(null);
            }
        };
        const processPlayerUpdate = (player_update: JGOFPlayerSummary) => {
            if (player_update.dropped_players) {
                if (player_update.dropped_players[color]) {
                    setAutoResignExpiration(null);
                }
            }
        };

        goban.on("auto-resign", handleAutoResign);
        goban.on("clear-auto-resign", handleClearAutoResign);
        goban.on("player-update", processPlayerUpdate);

        return () => {
            setAutoResignExpiration(null);
            goban.off("auto-resign", handleAutoResign);
            goban.off("clear-auto-resign", handleClearAutoResign);
            goban.off("player-update", processPlayerUpdate);
        };
    }, [goban, color]);
    return auto_resign_expiration;
}

interface ScorePopupProps {
    show: boolean;
    goban: Goban;
    color: "black" | "white";
}

function ScorePopup({ show, goban, color }: ScorePopupProps) {
    if (!show) {
        return <React.Fragment />;
    }

    const scores = goban.engine.computeScore(false);
    const { stones, prisoners, handicap, komi, territory } = scores[color];

    let first_points = 0;
    return (
        <div className="score_breakdown">
            {color === "black" && !!goban.engine.handicap && (
                <div>
                    <span>{_("Handicap")}</span>
                    <div>{goban.engine.handicap}</div>
                    <hr />
                </div>
            )}
            {!!stones && (
                <div>
                    <span>{_("Stones")}</span>
                    <div>
                        {first_points++ ? "+" : ""}
                        {stones}
                    </div>
                </div>
            )}
            {!!territory && (
                <div>
                    <span>{_("Territory")}</span>
                    <div>
                        {first_points++ ? "+" : ""}
                        {territory}
                    </div>
                </div>
            )}
            {!!prisoners && (
                <div>
                    <span>{_("Prisoners")}</span>
                    <div>
                        {first_points++ ? "+" : ""}
                        {prisoners}
                    </div>
                </div>
            )}
            {!!komi && (
                <div>
                    <span>{_("Komi")}</span>
                    <div>
                        {first_points++ ? "+" : ""}
                        {komi}
                    </div>
                </div>
            )}
            {!!handicap && (
                <div>
                    <span>{_("Handicap")}</span>
                    <div>
                        {first_points++ ? "+" : ""}
                        {handicap}
                    </div>
                </div>
            )}
            {!stones && !territory && !handicap && !komi && (
                <div>
                    <span>{_("No score yet")}</span>
                </div>
            )}
        </div>
    );
}
