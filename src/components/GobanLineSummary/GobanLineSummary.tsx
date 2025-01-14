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
import { Link } from "react-router-dom";
import { interpolate } from "@/lib/translate";
import { createGoban, GobanRenderer } from "goban";
import * as data from "@/lib/data";
import { rankString } from "@/lib/rank_utils";
import { Player } from "@/components/Player";
import { Clock } from "@/components/Clock";
import { GobanInfoStateBase } from "@/lib/types";
import { LineSummaryTableMode } from "../GameList";
import { PlayerCacheEntry } from "@/lib/player_cache";

interface UserType {
    id: number;
    username: string;
    rank?: number;
    rating?: number;
    pro?: boolean;
    professional?: boolean;
}

interface GobanLineSummaryProps {
    id: number;
    black: UserType;
    white: UserType;
    player?: { id: number };
    gobanRef?: (goban: GobanRenderer) => void;
    width?: number;
    height?: number;
    rengo_teams?: {
        black: UserType[];
        white: UserType[];
    };
    lineSummaryMode: LineSummaryTableMode;
}

interface GobanLineSummaryState extends GobanInfoStateBase {
    black_score: string;
    white_score: string;

    move_number?: number;
}

export class GobanLineSummary extends React.Component<
    GobanLineSummaryProps,
    GobanLineSummaryState
> {
    goban!: GobanRenderer;

    constructor(props: GobanLineSummaryProps) {
        super(props);
        this.state = {
            white_score: "",
            black_score: "",
        };
    }

    componentDidMount() {
        this.initialize();
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate(prev_props: GobanLineSummaryProps) {
        if (prev_props.id !== this.props.id) {
            this.destroy();
            this.initialize();
        }
    }

    initialize() {
        /* This requestAnimationFrame is a hack to work around an issue where
         * when toggling between thumbnail and list view on the Observe Games
         * page, the thumbnail would send a disconnect after this line summary
         * sends a connect to each game, and since the server doesn't count it
         * sees the disconnect and doesn't send anything else to this
         * component. By doing this frame request, we just wait for a tick so
         * react finishes calling goban.destroy from the MiniGoban. I don't
         * know why the reverse isn't true.
         *
         * Ultimately we need to fix this properly by having a game connection
         * manager.
         */

        requestAnimationFrame(() => {
            this.goban = createGoban({
                board_div: undefined,
                draw_top_labels: false,
                draw_bottom_labels: false,
                draw_left_labels: false,
                draw_right_labels: false,
                game_id: this.props.id,
                square_size: "auto",
            });

            this.goban.on("update", () => {
                this.sync_state();
            });

            if (this.props.gobanRef) {
                this.props.gobanRef(this.goban);
            }
        });
    }

    destroy() {
        if (this.goban) {
            /* This is guarded because we hit this being called before
             * initialize ran a few times, so I guess componentWillUnmount can
             * be called without componentDidMount having been executed, or
             * something else fuggly is going on. */
            this.goban.destroy();
        }
    }

    sync_state() {
        const score = this.goban.engine.computeScore(true);
        const black = this.props.black;
        const white = this.props.white;
        const player_to_move = (this.goban && this.goban.engine.playerToMove()) || 0;
        const user = data.get("config.user").id;
        const player = this.props?.player?.id;
        const is_current_user = player_to_move === user;

        this.setState({
            black_score: interpolate("%s points", [score.black.prisoners + score.black.komi]),
            white_score: interpolate("%s points", [score.white.prisoners + score.white.komi]),

            move_number: this.goban.engine.getMoveNumber(),
            game_name: this.goban.engine.config.game_name,

            black_name:
                typeof black === "object" ? black.username + " [" + rankString(black) + "]" : black,
            white_name:
                typeof white === "object" ? white.username + " [" + rankString(white) + "]" : white,

            // Mark games where it's the current user's move.
            current_users_move: is_current_user,

            // If this is a different player's page, also mark other games
            // where it's not that player's move.
            viewed_users_move:
                !!player && !is_current_user && user !== player && player_to_move === player,
            black_to_move_cls: this.goban && black.id === player_to_move ? "to-move" : "",
            white_to_move_cls: this.goban && white.id === player_to_move ? "to-move" : "",

            in_stone_removal_phase: this.goban && this.goban.engine.phase === "stone removal",
            finished: this.goban && this.goban.engine.phase === "finished",
        });
    }

    render() {
        let opponent: UserType | null = null;
        let player_color: PlayerColor | null | null = null;
        let opponent_color: PlayerColor | null = null;

        if (this.props.lineSummaryMode === "opponent-only") {
            if (this.props.player == null) {
                console.error(
                    `You are using the line summary mode ${this.props.lineSummaryMode}, but the current player is undefined. This will cause display problems!`,
                );
            }
            player_color = playerColor(this.props);
            if (player_color === null) {
                console.error(
                    `You are using the line summary mode ${this.props.lineSummaryMode}, but the current player is not in the game ${this.state.game_name}. This will cause display problems!`,
                );
            }
            opponent_color = player_color === "black" ? "white" : "black";
            opponent = player_color === "black" ? this.props.white : this.props.black;
        }

        return (
            <Link
                to={`/game/${this.props.id}`}
                className={
                    `GobanLineSummary ` +
                    (this.state.viewed_users_move ? " viewed-users-move" : "") +
                    (this.state.current_users_move ? " current-users-move" : "") +
                    (this.state.in_stone_removal_phase ? " in-stone-removal-phase" : "")
                }
            >
                <div className="move-number">{this.state.move_number}</div>
                <GameNameForList original_name={this.state.game_name || ""} />

                {this.props.lineSummaryMode === "opponent-only" &&
                    opponent &&
                    player_color &&
                    opponent_color && (
                        <>
                            <div className="player">
                                <Player user={opponent} fakelink rank />
                            </div>
                            <div>
                                <Clock goban={this.goban} color={player_color} lineSummary={true} />
                            </div>
                            <div>
                                <Clock
                                    goban={this.goban}
                                    color={opponent_color}
                                    lineSummary={true}
                                />
                            </div>
                        </>
                    )}

                {this.props.lineSummaryMode === "both-players" && (
                    <>
                        <div className="player">
                            <Player user={this.props.black} fakelink rank />
                        </div>
                        <div>
                            <Clock goban={this.goban} color="black" lineSummary={true} />
                        </div>
                        <div className="player">
                            <Player user={this.props.white} fakelink />
                        </div>
                        <div>
                            <Clock goban={this.goban} color="white" lineSummary={true} />
                        </div>
                    </>
                )}

                <div className="size">{this.props.width + "x" + this.props.height}</div>
            </Link>
        );
    }
}

type PlayerColor = "black" | "white";
function playerColor(props: GobanLineSummaryProps): PlayerColor | null {
    if (!props.player) {
        return null;
    }
    if (props.player.id === props.black.id) {
        return "black";
    }
    if (props.player.id === props.white.id) {
        return "white";
    }

    const isPlayer = (p: PlayerCacheEntry) => p.id === props.player?.id;
    if (props.rengo_teams) {
        if (props.rengo_teams.black.some(isPlayer)) {
            return "black";
        }
        if (props.rengo_teams.white.some(isPlayer)) {
            return "white";
        }
    }
    return null;
}

function stripNamePrefix(name: string, prefix: string): string | null {
    if (!name) {
        return null;
    }
    return name.startsWith(prefix) ? name.substr(prefix.length) : null;
}

export function GameNameForList(props: { original_name: string }): React.ReactElement {
    const name = props.original_name;
    const spans = {
        "Tournament Game:": "fa fa-trophy",
        "Ladder Challenge:": "fa fa-list-ol",
    };
    for (const prefix in spans) {
        let text: string | null = null;
        if ((text = stripNamePrefix(name, prefix))) {
            const icon_class = (spans as any)[prefix];
            return (
                <div className="game-name">
                    <span className={icon_class} />
                    <span title={name}>{text}</span>
                </div>
            );
        }
    }
    return (
        <div className="game-name">
            <span title={name}>{name}</span>
        </div>
    );
}
