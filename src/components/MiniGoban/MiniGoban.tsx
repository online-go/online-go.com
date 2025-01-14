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
import { npgettext, interpolate } from "@/lib/translate";
import moment from "moment";
import * as preferences from "@/lib/preferences";
import { GobanRenderer, JGOFMove, createGoban } from "goban";
import * as data from "@/lib/data";
import { PersistentElement } from "@/components/PersistentElement";
import { getUserRating, PROVISIONAL_RATING_CUTOFF } from "@/lib/rank_utils";
import { Clock } from "@/components/Clock";
import { fetch } from "@/lib/player_cache";
import { getGameResultText } from "@/lib/misc";
import { getEm10Width, getWindowWidth } from "@/lib/device";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { usePreference } from "@/lib/preferences";

export interface MiniGobanProps {
    game_id?: number;
    review_id?: number;
    width?: number;
    height?: number;
    displayWidth?: number;
    className?: string;

    // If these are not provided, we look in the game itself (via the id prop)...
    // Also note that if you pass in a string, you won't get the rank of the player displayed...
    // ... this component only looks up the rank if it has a player object.

    black?: string | PlayerCacheEntry; // user object or string is expected, to get the player name and rank where possible
    white?: string | PlayerCacheEntry; // user object or string is expected, to get the player name and rank where possible

    onUpdate?: () => void;
    json?: any;
    player?: { id: number };
    noLink?: boolean;
    openLinksInNewTab?: boolean;
    noText?: boolean;
    title?: boolean;
    onGobanCreated?: (goban: GobanRenderer) => void;
    chat?: boolean;
    labels_positioning?: "none" | "all" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    sampleOptions?: {
        undo?: boolean;
        variation?: JGOFMove[];
    };
}

function computedDisplayWidth(): number {
    return Math.min(getWindowWidth(), getEm10Width() * 2);
}

export function MiniGoban(props: MiniGobanProps): React.ReactElement {
    const goban_div = React.useRef<HTMLDivElement>(
        (() => {
            const ret = document.createElement("div");
            ret.className = "Goban";
            return ret;
        })(),
    );
    const goban = React.useRef<GobanRenderer | undefined>(undefined);

    const [white_points, setWhitePoints] = React.useState("");
    const [black_points, setBlackPoints] = React.useState("");
    const [game_date, setGameDate] = React.useState("");
    const [game_result, setGameResult] = React.useState("");
    const [black_rank, setBlackRank] = React.useState("");
    const [white_rank, setWhiteRank] = React.useState("");
    const [black_name, setBlackName] = React.useState("");
    const [white_name, setWhiteName] = React.useState("");
    const [current_users_move, setCurrentUsersMove] = React.useState(false);
    const [viewed_users_move, setViewedUsersMove] = React.useState(false);
    const [black_to_move_cls, setBlackToMoveCls] = React.useState("");
    const [white_to_move_cls, setWhiteToMoveCls] = React.useState("");
    const [in_stone_removal_phase, setInStoneRemovalPhase] = React.useState(false);
    const [finished, setFinished] = React.useState(false);
    const [game_name, setGameName] = React.useState("");
    const [last_move_opacity] = usePreference("last-move-opacity");

    const draw_top_labels =
        props.labels_positioning === "all" ||
        props.labels_positioning === "top-left" ||
        props.labels_positioning === "top-right";
    const draw_bottom_labels =
        props.labels_positioning === "all" ||
        props.labels_positioning === "bottom-left" ||
        props.labels_positioning === "bottom-right";
    const draw_left_labels =
        props.labels_positioning === "all" ||
        props.labels_positioning === "top-left" ||
        props.labels_positioning === "bottom-left";
    const draw_right_labels =
        props.labels_positioning === "all" ||
        props.labels_positioning === "top-right" ||
        props.labels_positioning === "bottom-right";

    React.useEffect(() => {
        goban.current = createGoban(
            {
                board_div: goban_div.current,
                draw_top_labels,
                draw_bottom_labels,
                draw_left_labels,
                draw_right_labels,
                connect_to_chat: !!props.chat,
                game_id: props.game_id,
                review_id: props.review_id,
                display_width: props.displayWidth || computedDisplayWidth(),
                square_size: "auto",
                width: props.width || (props.json ? props.json.width : 19),
                height: props.height || (props.json ? props.json.height : 19),
                last_move_opacity: last_move_opacity,
                variation_stone_opacity: preferences.get("variation-stone-opacity"),
                stone_font_scale: preferences.get("stone-font-scale"),
            },
            props.json,
        );

        if (props.onGobanCreated) {
            props.onGobanCreated(goban.current);
        }

        if (props.sampleOptions?.undo) {
            window.mini_goban = goban.current;
            //goban.current.visual_undo_request_indicator = true;
            goban.current.engine.undo_requested = goban.current.engine.cur_move.move_number;
        }

        if (props.sampleOptions?.variation) {
            goban.current.setMode("analyze");
            for (const move of props.sampleOptions.variation) {
                goban.current.engine.place(move.x, move.y);
            }
            if (props.json.marks) {
                goban.current.setMarks(props.json.marks);
            }
        }

        goban.current.on("update", () => {
            const engine = goban.current?.engine;
            if (!engine) {
                return;
            }

            const score = engine.computeScore(true);
            let black: string | PlayerCacheEntry = props.black || "";
            let white: string | PlayerCacheEntry = props.white || "";

            if (!black) {
                try {
                    // maybe the engine doesn't have players?
                    black = engine.players.black;
                    // the goban engine doesn't come with the full player rating structure
                    fetch(engine.players.black.id)
                        .then((player) => {
                            const blackRating = getUserRating(player);
                            let rank_text = blackRating.bounded_rank_label;
                            if (blackRating.deviation >= PROVISIONAL_RATING_CUTOFF) {
                                rank_text = "?";
                            }
                            setBlackRank(preferences.get("hide-ranks") ? "" : `[${rank_text}]`);
                        })
                        .catch(() => {
                            console.log("Couldn't work out black rank");
                        });
                } catch {
                    console.log("Couldn't work out who played black");
                }
            }

            if (!white) {
                try {
                    white = engine.players.white;
                    // the goban engine doesn't come with the full player rating structure
                    fetch(engine.players.white.id)
                        .then((player) => {
                            const whiteRating = getUserRating(player);
                            let rank_text = whiteRating.bounded_rank_label;
                            if (whiteRating.deviation >= PROVISIONAL_RATING_CUTOFF) {
                                rank_text = "?";
                            }
                            setWhiteRank(preferences.get("hide-ranks") ? "" : `[${rank_text}]`);
                        })
                        .catch(() => {
                            console.log("Couldn't work out white rank");
                        });
                } catch {
                    console.log("Couldn't work out who played black");
                }
            }

            if (props.title) {
                const result_string = getGameResultText(
                    engine.outcome,
                    engine.winner !== (engine as any).white_player_id,
                    engine.winner !== (engine as any).black_player_id,
                );

                setGameName(engine.config.game_name || "");
                setGameDate(
                    goban.current?.config.end_time
                        ? moment(new Date(goban.current.config.end_time * 1000)).format("LLL")
                        : "",
                );
                setGameResult(result_string);
            }

            const player_to_move = (goban.current && goban.current.engine.playerToMove()) || 0;

            const black_points = score.black.prisoners + score.black.komi;
            const white_points = score.white.prisoners + score.white.komi;

            setBlackPoints(
                interpolate(
                    npgettext(
                        "Plural form 0 is the singular form, Plural form 1 is the plural form",
                        "{{num}} point",
                        "{{num}} points",
                        black_points,
                    ),
                    { num: black_points },
                ),
            );
            setWhitePoints(
                interpolate(
                    npgettext(
                        "Plural form 0 is the singular form, Plural form 1 is the plural form",
                        "{{num}} point",
                        "{{num}} points",
                        white_points,
                    ),
                    { num: white_points },
                ),
            );
            if (typeof black === "string") {
                setBlackName(black);
            } else {
                setBlackName(
                    engine.rengo && engine.rengo_teams
                        ? engine.rengo_teams.black[0].username +
                              " +" +
                              (engine.rengo_teams.black.length - 1)
                        : engine.players.black.username,
                );
            }
            if (typeof white === "string") {
                setWhiteName(white);
            } else {
                setWhiteName(
                    engine.rengo && engine.rengo_teams
                        ? engine.rengo_teams.white[0].username +
                              " +" +
                              (engine.rengo_teams.white.length - 1)
                        : engine.players.white.username,
                );
            }

            // Mark games where it's the current user's move.
            const user = data.get("config.user").id;
            const is_current_user = player_to_move === user;
            setCurrentUsersMove(is_current_user);

            // If this is a different player's page, also mark other games
            // where it's not that player's move.
            const player = props?.player?.id;
            setViewedUsersMove(
                !!player && !is_current_user && user !== player && player_to_move === player,
            );

            setBlackToMoveCls(
                typeof black === "object" && goban.current && black.id === player_to_move
                    ? "to-move"
                    : "",
            );
            setWhiteToMoveCls(
                typeof white === "object" && goban.current && white.id === player_to_move
                    ? "to-move"
                    : "",
            );

            setInStoneRemovalPhase(engine.phase === "stone removal");
            setFinished(engine.phase === "finished");

            if (props.onUpdate) {
                props.onUpdate();
            }
        });

        return () => {
            goban.current?.destroy();
            goban_div.current.childNodes.forEach((node) => node.remove());
        };
    }, [props.game_id, props.review_id, props.width, props.height]);

    // Update displayWidth dynamically
    React.useEffect(() => {
        if (!goban.current || props.displayWidth == null) {
            return;
        }
        goban.current.setSquareSizeBasedOnDisplayWidth(props.displayWidth);
    }, [props.displayWidth]);

    const inner = (
        <React.Fragment>
            {props.title && (
                <div className={"minigoban-title"}>
                    <div>{game_name}</div>
                    <div className="game-date">{game_date}</div>
                    <div className="game-result">{game_result}</div>
                </div>
            )}
            <div className="inner-container">
                <PersistentElement
                    className={
                        "small board" +
                        (current_users_move ? " current-users-move" : "") +
                        (viewed_users_move ? " viewed-users-move" : "") +
                        (in_stone_removal_phase ? " in-stone-removal-phase" : "") +
                        (finished ? " finished" : "")
                    }
                    elt={goban_div.current}
                />
                {!props.noText && (
                    <div className={`title-black ${black_to_move_cls}`}>
                        <span className={`player-name`}>{black_name}</span>
                        <span className={`player-rank`}>{black_rank}</span>
                        {finished ||
                            (goban.current && (
                                <Clock
                                    compact
                                    goban={goban.current}
                                    color="black"
                                    className="mini-goban"
                                />
                            ))}
                        {finished || <span className="score">{black_points}</span>}
                    </div>
                )}
                {!props.noText && (
                    <div className={`title-white ${white_to_move_cls}`}>
                        <span className={`player-name`}>{white_name}</span>
                        <span className={`player-rank`}>{white_rank}</span>
                        {finished ||
                            (goban.current && (
                                <Clock
                                    compact
                                    goban={goban.current}
                                    color="white"
                                    className="mini-goban"
                                />
                            ))}
                        {finished || <span className="score">{white_points}</span>}
                    </div>
                )}
            </div>
        </React.Fragment>
    );

    let new_tab_attributes = {};
    if (props.openLinksInNewTab) {
        new_tab_attributes = { target: "_blank", rel: "noopener noreferrer" };
    }

    if (props.noLink || (!props.game_id && !props.review_id)) {
        return <div className={"MiniGoban nolink " + (props.className ?? "")}>{inner}</div>;
    } else {
        if (props.game_id) {
            return (
                <Link
                    to={`/game/${props.game_id}`}
                    className={"MiniGoban link " + (props.className ?? "")}
                    {...new_tab_attributes}
                >
                    {inner}
                </Link>
            );
        } else {
            return (
                <Link
                    to={`/review/${props.review_id}`}
                    className={"MiniGoban link " + (props.className ?? "")}
                    {...new_tab_attributes}
                >
                    {inner}
                </Link>
            );
        }
    }
}
