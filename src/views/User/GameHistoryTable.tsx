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
import { _ } from "translate";
import { PlayerAutocomplete } from "PlayerAutocomplete";
import { Card } from "material";
import { PaginatedTable } from "PaginatedTable";
import { effective_outcome } from "rank_utils";
import { getGameResultText } from "misc";
import { openUrlIfALinkWasNotClicked, maskedRank } from "./common";
import * as moment from "moment";
import { rankString } from "rank_utils";
import { Player } from "Player";
import { Link } from "react-router-dom";
import { interpolate } from "translate";
import * as preferences from "preferences";
import { PlayerCacheEntry } from "src/lib/player_cache";
import { TimeControl } from "src/components/TimeControl";
import { Speed } from "src/lib/types";

interface GameHistoryProps {
    user_id: number;
}

type ResultClass =
    | `library-${"won" | "lost" | "tie"}-result${"-vs-stronger" | "-vs-weaker" | "-unranked" | ""}`;

/** Groomed game */
interface GG {
    id: number;
    annulled: boolean;
    played_black: boolean;
    player: PlayerCacheEntry;
    player_won: boolean;
    date: Date;
    opponent?: PlayerCacheEntry;
    speed_icon_class: `speed-icon ${string}`;
    speed: Capitalize<Speed>;
    width: number;
    height: number;
    href: `/game/${number}`;
    name: string;
    black: PlayerCacheEntry;
    white: PlayerCacheEntry;
    result_class: ResultClass;
    result: JSX.Element;
    rengo_vs_string?: `${number} vs ${number}`;
}

export function GameHistoryTable(props: GameHistoryProps) {
    const [player_filter, setPlayerFilter] = React.useState<number>(null);
    const [show_rengo, setShowRengo] = React.useState<boolean>(false);

    function game_history_groomer(results: rest_api.Game[]): GG[] {
        const ret = [];
        for (let i = 0; i < results.length; ++i) {
            const r = results[i];

            const black_won = !r.black_lost && r.white_lost && !r.annulled;
            const white_won = !r.white_lost && r.black_lost && !r.annulled;

            const item: Partial<GG> = {
                id: r.id,
            };

            item.width = r.width;
            item.height = r.height;
            item.date = r.ended ? new Date(r.ended) : null;
            item.annulled = r.annulled || false;

            item.black = r.players.black;
            item.white = r.players.white;

            if (item.white.id === props.user_id) {
                /* played white */ item.played_black = false;
                item.opponent = r.historical_ratings.black;
                item.player = r.historical_ratings.white;
                item.player_won = white_won;
            } else if (item.black.id === props.user_id) {
                /* played black */ item.played_black = true;
                item.opponent = r.historical_ratings.white;
                item.player = r.historical_ratings.black;
                item.player_won = black_won;
            }

            if (r.rengo) {
                // TODO: replace with a real "2v2" type string, pending api support
                // currently the API does not give a list of players or even the number of players in the game
                item.rengo_vs_string = "N/A (Rengo)" as any;
            }

            item.result_class = getResultClass(r, props.user_id);

            const speed = getSpeed(r);
            item.speed = capitalize(speed);
            item.speed_icon_class = getSpeedClass(speed);

            item.name = r.name;

            if (item.name && item.name.trim() === "") {
                item.name = item.href;
            }

            item.href = `/game/${item.id}`;
            item.result = getGameResultRichText(r);

            ret.push(item);
        }
        return ret;
    }

    return (
        <div className="col-sm-12">
            <h2>{_("Game History")}</h2>
            <Card>
                <div>
                    {/* loading-container="game_history.settings().$loading" */}
                    <div className="game-options">
                        <div className="search">
                            <i className="fa fa-search"></i>
                            <PlayerAutocomplete
                                onComplete={(player) => {
                                    // happily, and importantly, if there isn't a player, then we get null
                                    setPlayerFilter(player?.id);
                                }}
                            />
                        </div>
                        <div className="rengo-selector">
                            <span>{_("Rengo")}</span>
                            <input
                                type="checkbox"
                                checked={show_rengo}
                                onChange={() => setShowRengo(!show_rengo)}
                            />
                        </div>
                    </div>
                    <PaginatedTable
                        className="game-history-table"
                        name="game-history"
                        method="GET"
                        source={`players/${props.user_id}/games/`}
                        filter={{
                            source: "play",
                            ended__isnull: false,
                            ...(player_filter !== null && {
                                alt_player: player_filter,
                            }),
                            rengo: show_rengo,
                        }}
                        orderBy={["-ended"]}
                        groom={game_history_groomer}
                        onRowClick={(ref, ev) => openUrlIfALinkWasNotClicked(ev, ref.href)}
                        columns={[
                            // normal table layout ...
                            ...(!show_rengo
                                ? [
                                      {
                                          header: _("User"),
                                          className: (X: GG) =>
                                              "user_info" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <React.Fragment>
                                                  <span>
                                                      {X.played_black == null
                                                          ? "❓" // Some rengo games don't tell us which team the user is on. Needs backend fix.
                                                          : X.played_black
                                                          ? "⚫"
                                                          : "⚪"}
                                                  </span>
                                                  {X.played_black != null &&
                                                      maskedRank(`[${rankString(X.player)}]`)}
                                              </React.Fragment>
                                          ),
                                      },
                                      {
                                          header: _(""),
                                          className: (X: GG) =>
                                              "winner_marker" +
                                              (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) =>
                                              X.player_won ? (
                                                  <i className="fa fa-trophy game-history-winner" />
                                              ) : (
                                                  ""
                                              ),
                                      },
                                      {
                                          header: _("Date"),
                                          className: (X: GG) =>
                                              "date" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => moment(X.date).format("YYYY-MM-DD"),
                                      },
                                      {
                                          header: _("Opponent"),
                                          className: (X: GG) =>
                                              "player" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <>
                                                  {X.rengo_vs_string || (
                                                      <Player
                                                          user={X.opponent}
                                                          disableCacheUpdate
                                                      />
                                                  )}
                                              </>
                                          ),
                                      },
                                      {
                                          header: _(""),
                                          className: (X: GG) =>
                                              "speed" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <i className={X.speed_icon_class} title={X.speed} />
                                          ),
                                      },
                                      {
                                          header: _("Size"),
                                          className: (X: GG) =>
                                              "board_size" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => `${X.width}x${X.height}`,
                                      },
                                      {
                                          header: _("Name"),
                                          className: (X: GG) =>
                                              "game_name" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <Link to={X.href}>
                                                  {X.name ||
                                                      interpolate(
                                                          "{{black_username}} vs. {{white_username}}",
                                                          {
                                                              black_username: X.black.username,
                                                              white_username: X.white.username,
                                                          },
                                                      )}
                                              </Link>
                                          ),
                                      },
                                      {
                                          header: _("Result"),
                                          className: (X: GG) =>
                                              X
                                                  ? X.result_class + (X.annulled ? " annulled" : "")
                                                  : "",
                                          render: (X: GG) => X.result,
                                      },
                                  ]
                                : []),
                            // .. and brute force hiding things that are too hard for a quick implemetation for rengo :o  ...
                            ...(show_rengo
                                ? [
                                      {
                                          header: _("-"),
                                          className: (X: GG) =>
                                              "user_info" + (X && X.annulled ? " annulled" : ""),
                                          render: () => "",
                                      },
                                      {
                                          header: _(""),
                                          className: (X: GG) =>
                                              "winner_marker" +
                                              (X && X.annulled ? " annulled" : ""),
                                          render: () => "",
                                      },
                                      {
                                          header: _("Date"),
                                          className: (X: GG) =>
                                              "date" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => moment(X.date).format("YYYY-MM-DD"),
                                      },
                                      {
                                          header: _("-"),
                                          className: (X: GG) =>
                                              "player" + (X && X.annulled ? " annulled" : ""),
                                          render: () => "",
                                      },
                                      {
                                          header: _(""),
                                          className: (X: GG) =>
                                              "speed" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <i className={X.speed_icon_class} title={X.speed} />
                                          ),
                                      },
                                      {
                                          header: _("Size"),
                                          className: (X: GG) =>
                                              "board_size" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => `${X.width}x${X.height}`,
                                      },
                                      {
                                          header: _("Name"),
                                          className: (X: GG) =>
                                              "game_name" + (X && X.annulled ? " annulled" : ""),
                                          render: (X: GG) => (
                                              <Link to={X.href}>
                                                  {X.name ||
                                                      interpolate(
                                                          "{{black_username}} vs. {{white_username}}",
                                                          {
                                                              black_username: X.black.username,
                                                              white_username: X.white.username,
                                                          },
                                                      )}
                                              </Link>
                                          ),
                                      },
                                      {
                                          header: _("Result"),
                                          className: (X: GG) =>
                                              X && X.annulled ? " annulled" : "",
                                          render: (X: GG) => X.result,
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}

function getGameResultRichText(game: rest_api.Game) {
    let resultText = getGameResultText(game.outcome, game.white_lost, game.black_lost);

    if (game.ranked) {
        resultText += ", ";
        resultText += _("ranked");
    }
    if (game.annulled) {
        return (
            <span>
                <span style={{ textDecoration: "line-through" }}>{resultText}</span>
                <span>, {_("annulled")}</span>
            </span>
        );
    }

    return <>{resultText}</>;
}

function capitalize<T extends string>(s: T): Capitalize<T> {
    return (s.toUpperCase() + s.slice(1)) as Capitalize<T>;
}

function getResultClass(game: rest_api.Game, user_id: number): ResultClass {
    const annulled = game.annulled;
    const black_won = !game.black_lost && game.white_lost && !annulled;
    const white_won = !game.white_lost && game.black_lost && !annulled;
    const ranked = game.ranked;
    const played_black = game.players.black.id === user_id;
    const player_won = (played_black && black_won) || (!played_black && white_won);

    if (!(black_won || white_won)) {
        return "library-tie-result";
    }

    if (ranked && !preferences.get("hide-ranks")) {
        const { black_effective_stronger, white_effective_stronger } = effective_outcome(
            game.historical_ratings.black.ratings.overall.rating,
            game.historical_ratings.white.ratings.overall.rating,
            game.handicap,
        );
        const player_effective_stronger =
            (black_effective_stronger && played_black) ||
            (!white_effective_stronger && !played_black);

        if (player_won) {
            return player_effective_stronger
                ? "library-won-result-vs-weaker"
                : "library-won-result-vs-stronger";
        } else {
            return player_effective_stronger
                ? "library-lost-result-vs-weaker"
                : "library-lost-result-vs-stronger";
        }
    }

    // tie caught above
    return player_won ? "library-won-result-unranked" : "library-lost-result-unranked";
}

function getSpeed(game: rest_api.Game): Speed {
    if ("time_control_parameters" in game) {
        const tcp = JSON.parse(game.time_control_parameters) as TimeControl;
        if (tcp?.speed) {
            return tcp.speed;
        }
    }

    // fallback
    const time_per_move = game.time_per_move;
    if (time_per_move >= 3600 || time_per_move === 0) {
        return "correspondence";
    }
    if (time_per_move >= 10) {
        return "live";
    }
    if (time_per_move > 0) {
        return "blitz";
    }

    console.log("time per move less than 0: " + time_per_move);
    return "correspondence";
}

function getSpeedClass(speed: Speed) {
    switch (speed) {
        case "correspondence":
            return "speed-icon ogs-turtle";
        case "live":
            return "speed-icon fa fa-clock-o";
        case "blitz":
            return "speed-icon fa fa-bolt";
    }
    console.log("unsupported speed setting: " + speed);
}
