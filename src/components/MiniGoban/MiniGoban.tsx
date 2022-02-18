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
import { Link } from "react-router-dom";
import { npgettext, interpolate } from "translate";
import * as moment from "moment";
import * as preferences from "preferences";
import { Goban } from "goban";
import * as data from "data";
import { PersistentElement } from "PersistentElement";
import { getUserRating } from "rank_utils";
import { Clock } from "Clock";
import { fetch } from "player_cache";
import { getGameResultText } from "misc";
import { PlayerCacheEntry } from "player_cache";

interface MiniGobanProps {
    id: number;
    width?: number;
    height?: number;
    displayWidth?: number;

    // If these are not provided, we look in the game itself (via the id prop)...
    // Also note that if you pass in a string, you won't get the rank of the player displayed...
    // ... this component only looks up the rank if it has a player object.

    black?: string | PlayerCacheEntry; // user object or string is expected, to get the player name and rank where possible
    white?: string | PlayerCacheEntry; // user object or string is expected, to get the player name and rank where possible

    onUpdate?: () => void;
    json?: any;
    noLink?: boolean;
    noText?: boolean;
    title?: boolean;
}

// This state is very similar to GobanLineSummaryState.
// TODO (ben): Possibly pull shared members into a common type.
interface MiniGobanState {
    white_points: string;
    black_points: string;

    black_name?: string;
    white_name?: string;

    game_name?: string;
    game_date?: string;
    game_result?: string;

    black_rank?: string;
    white_rank?: string;

    current_users_move?: boolean;
    in_stone_removal_phase?: boolean;
    finished?: boolean;

    black_to_move_cls?: string;
    white_to_move_cls?: string;
}

export class MiniGoban extends React.Component<MiniGobanProps, MiniGobanState> {
    public goban_div: HTMLDivElement;
    goban;

    constructor(props) {
        super(props);
        this.state = {
            white_points: "",
            black_points: "",
        };

        this.goban_div = document.createElement("div");
        this.goban_div.className = "Goban";
    }

    componentDidMount() {
        this.initialize();
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate(prev_props) {
        if (prev_props.id !== this.props.id) {
            this.destroy();
            this.initialize();
        }
    }

    initialize() {
        this.goban = new Goban(
            {
                board_div: this.goban_div,
                draw_top_labels: false,
                draw_bottom_labels: false,
                draw_left_labels: false,
                draw_right_labels: false,
                game_id: this.props.id,
                display_width:
                    this.props.displayWidth ||
                    Math.min($("body").width() - 50, $("#em10").width() * 2),
                square_size: "auto",
                width: this.props.width || (this.props.json ? this.props.json.width : 19),
                height: this.props.height || (this.props.json ? this.props.json.height : 19),
            },
            this.props.json,
        );

        this.goban.on("update", () => {
            this.sync_state();
            if (this.props.onUpdate) {
                this.props.onUpdate();
            }
        });
    }

    destroy() {
        if (this.goban) {
            this.goban.destroy();
        }
    }
    sync_state() {
        const engine = this.goban.engine;
        const score = engine.computeScore(true);
        let black: string | PlayerCacheEntry = this.props.black || "";
        let white: string | PlayerCacheEntry = this.props.white || "";

        if (!black) {
            try {
                // maybe the engine doesn't have players?
                black = engine.players.black;
                // the goban engine doesn't come with the full player rating structure
                fetch(this.goban.engine.players.black.id)
                    .then((player) => {
                        this.setState({
                            black_rank: preferences.get("hide-ranks")
                                ? ""
                                : " [" + getUserRating(player).bounded_rank_label + "]",
                        });
                    })
                    .catch(() => {
                        console.log("Couldn't work out black rank");
                    });
            } catch (e) {
                console.log("Couldn't work out who played black");
            }
        }

        if (!white) {
            try {
                white = engine.players.white;
                // the goban engine doesn't come with the full player rating structure
                fetch(this.goban.engine.players.white.id)
                    .then((player) => {
                        this.setState({
                            white_rank: preferences.get("hide-ranks")
                                ? ""
                                : " [" + getUserRating(player).bounded_rank_label + "]",
                        });
                    })
                    .catch(() => {
                        console.log("Couldn't work out white rank");
                    });
            } catch (e) {
                console.log("Couldn't work out who played black");
            }
        }

        if (this.props.title) {
            const result_string = getGameResultText(
                this.goban.engine.outcome,
                this.goban.engine.winner !== this.goban.engine.white_player_id,
                this.goban.engine.winner !== this.goban.engine.black_player_id,
            );

            this.setState({
                game_name: this.goban.engine.game_name || "",
                game_date: this.goban.config.end_time
                    ? moment(new Date(this.goban.config.end_time * 1000)).format("LLL")
                    : "",
                game_result: result_string,
            });
        }

        const player_to_move = (this.goban && this.goban.engine.playerToMove()) || 0;

        const black_points = score.black.prisoners + score.black.komi;
        const white_points = score.white.prisoners + score.white.komi;

        // TODO something is telling me we should compute all this state into variables then do setState :)
        // That will definitely be needed to get the rank on the name of the current rengo player, if we want that.

        this.setState({
            // note, we need to say {{num}} point here as the singular form is used for multiple values in some languages (such as french, they say 0 point, 1 point, 2 points)
            black_points: interpolate(
                npgettext(
                    "Plural form 0 is the singular form, Plural form 1 is the plural form",
                    "{{num}} point",
                    "{{num}} points",
                    black_points,
                ),
                { num: black_points },
            ),
            white_points: interpolate(
                npgettext(
                    "Plural form 0 is the singular form, Plural form 1 is the plural form",
                    "{{num}} point",
                    "{{num}} points",
                    white_points,
                ),
                { num: white_points },
            ),

            ...(typeof black === "string"
                ? //honour the string that they provided: they must really want it!
                  { black_name: black }
                : // otherwise get the player name/team from the engine
                  {
                      black_name: this.goban.engine.rengo
                          ? this.goban.engine.rengo_teams.black[0].username +
                            " +" +
                            (this.goban.engine.rengo_teams.black.length - 1)
                          : this.goban.engine.players.black.username,
                  }),

            ...(typeof white === "string"
                ? //honour the string that they provided: they must really want it!
                  { white_name: white }
                : // otherwise get the player name/team from the engine
                  {
                      white_name: this.goban.engine.rengo
                          ? this.goban.engine.rengo_teams.white[0].username +
                            " +" +
                            (this.goban.engine.rengo_teams.white.length - 1)
                          : this.goban.engine.players.white.username,
                  }),

            current_users_move: player_to_move === data.get("config.user").id,
            black_to_move_cls:
                typeof black === "object" && this.goban && black.id === player_to_move
                    ? "to-move"
                    : "",
            white_to_move_cls:
                typeof white === "object" && this.goban && white.id === player_to_move
                    ? "to-move"
                    : "",

            in_stone_removal_phase: this.goban && this.goban.engine.phase === "stone removal",
            finished: this.goban && this.goban.engine.phase === "finished",
        });
    }

    render() {
        if (this.props.noLink) {
            return <div className="MiniGoban nolink">{this.inner()}</div>;
        } else {
            return (
                <Link to={`/game/${this.props.id}`} className="MiniGoban link">
                    {this.inner()}
                </Link>
            );
        }
    }

    inner() {
        return (
            <React.Fragment>
                {this.props.title && (
                    <div className={"minigoban-title"}>
                        <div>{this.state.game_name}</div>
                        <div className="game-date">{this.state.game_date}</div>
                        <div className="game-result">{this.state.game_result}</div>
                    </div>
                )}
                <div className="inner-container">
                    <PersistentElement
                        className={
                            "small board" +
                            (this.state.current_users_move ? " current-users-move" : "") +
                            (this.state.in_stone_removal_phase ? " in-stone-removal-phase" : "") +
                            (this.state.finished ? " finished" : "")
                        }
                        elt={this.goban_div}
                    />
                    {!this.props.noText && (
                        <div className={`title-black ${this.state.black_to_move_cls}`}>
                            <span className={`player-name`}>{this.state.black_name}</span>
                            <span className={`player-rank`}>{this.state.black_rank}</span>
                            {this.state.finished || (
                                <Clock
                                    compact
                                    goban={this.goban}
                                    color="black"
                                    className="mini-goban"
                                />
                            )}
                            {this.state.finished || (
                                <span className="score">{this.state.black_points}</span>
                            )}
                        </div>
                    )}
                    {!this.props.noText && (
                        <div className={`title-white ${this.state.white_to_move_cls}`}>
                            <span className={`player-name`}>{this.state.white_name}</span>
                            <span className={`player-rank`}>{this.state.white_rank}</span>
                            {this.state.finished || (
                                <Clock
                                    compact
                                    goban={this.goban}
                                    color="white"
                                    className="mini-goban"
                                />
                            )}
                            {this.state.finished || (
                                <span className="score">{this.state.white_points}</span>
                            )}
                        </div>
                    )}
                </div>
            </React.Fragment>
        );
    }
}
