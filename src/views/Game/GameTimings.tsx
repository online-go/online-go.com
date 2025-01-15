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

import moment from "moment";
import duration from "moment-duration-format";
duration(moment as any);

import * as React from "react";

import { AdHocPackedMove, GobanMovesArray } from "goban";
import { useUser } from "@/lib/hooks";
import { showSecondsResolution } from "@/lib/misc";

interface GameTimingProperties {
    moves: GobanMovesArray;
    start_time: number;
    end_time?: number;
    free_handicap_placement: boolean;
    handicap: number;
    black_id: number;
    white_id: number;
    onFinalActionCalculated?: (final_action_timing: moment.Duration) => void;
}

export function GameTimings(props: GameTimingProperties): React.ReactElement {
    const user = useUser();

    const show_seconds_nicely = (duration: moment.Duration) =>
        duration < moment.duration(60 * 1000) ? (
            <span className="timing-seconds">
                {moment.duration(duration).asSeconds().toFixed(1)}
            </span>
        ) : duration < moment.duration(60 * 60 * 1000) ? (
            <span className="timing-slow-live">{moment.duration(duration).format()}</span>
        ) : (
            <span className="timing-slow">{moment.duration(duration).format()}</span>
        );

    const game_elapsed: ReturnType<typeof moment.duration> = moment.duration(0); // running total
    const black_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
    const white_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
    const move_elapsed: Array<ReturnType<typeof moment.duration>> = []; // the time elapsed up to each move

    // Publish final action timing after game_elapsed is calculated (during render!)
    React.useEffect(() => {
        if (props.end_time && props.onFinalActionCalculated) {
            props.onFinalActionCalculated(
                moment
                    .duration(props.end_time - props.start_time, "seconds")
                    .subtract(game_elapsed),
            );
        }
    }, [props.start_time, props.end_time, props.onFinalActionCalculated]);

    let non_handicap_moves = [...props.moves];
    let handicap_moves: any[] = [];
    let handicap_move_offset = 0;

    let white_first_turn = false;
    let first_row = <React.Fragment></React.Fragment>;

    if (props.handicap) {
        if (props.free_handicap_placement) {
            // when there is free handicap placement, black plays handicap-1 moves before his actual first turn that white responds to...

            handicap_moves = props.moves.slice(0, props.handicap - 1);
            non_handicap_moves = props.moves.slice(props.handicap - 1);
            handicap_move_offset = props.handicap - 1;
        } else {
            // In fixed handicap placement, white goes first.  needs a separate special row in the table to show just white's move

            white_first_turn = true;
            const first_move = non_handicap_moves.shift();
            handicap_move_offset = 1;
            const elapsed = (first_move as AdHocPackedMove)?.[2];
            game_elapsed.add(elapsed);
            move_elapsed.push(game_elapsed.clone());
            white_elapsed.add(elapsed);
            const move_string = show_seconds_nicely(elapsed as any);
            first_row = (
                <React.Fragment>
                    <div>0</div>
                    <div>-</div>
                    <div>{move_string}</div>
                    <div>{`${move_elapsed[0].format()}`}</div>
                </React.Fragment>
            );
        }
    }

    const cm = user.moderator_powers !== 0; // community moderator

    return (
        <div className="GameTimings">
            <div className="timings-header">Game Timings</div>
            <div>Move</div>
            <div>Black {!cm && "(blur)"}</div>
            <div>White {!cm && "(blur)"}</div>
            <div>Elapsed Time</div>
            {white_first_turn ? first_row : ""}
            {
                // Get the times from the moves array in a nice format, compute ongoing elapsed times

                // first display free handicap moves...
                handicap_moves.map((move, move_num) => {
                    const elapsed = move[2];
                    game_elapsed.add(elapsed);
                    move_elapsed.push(game_elapsed.clone());
                    black_elapsed.add(elapsed);
                    const move_string = show_seconds_nicely(elapsed);
                    return (
                        <React.Fragment key={move_num}>
                            <div>{move_num + 1}</div>
                            <div>{move_string}</div>
                            <div>-</div>
                            <div>{`${move_elapsed[move_num].format()}`}</div>
                        </React.Fragment>
                    );
                })
            }
            {
                // now normal moves...
                non_handicap_moves
                    .map((move, move_num) => {
                        const blacks_turn: boolean = move_num % 2 === 0;
                        const elapsed = (move as AdHocPackedMove)[2];
                        game_elapsed.add(elapsed);
                        move_elapsed.push(game_elapsed.clone());
                        if (blacks_turn) {
                            black_elapsed.add(elapsed);
                        } else {
                            white_elapsed.add(elapsed);
                        }
                        return show_seconds_nicely(elapsed as any);
                    })
                    // pair them up into black and white move pairs, along with the elapsed time to that point
                    .reduce((acc, value, index, orig) => {
                        if (index % 2 === 0) {
                            // the elapsed array can contain handicap moves, we have to skip past those
                            const move_elapsed_index =
                                props.free_handicap_placement && props.handicap > 1
                                    ? props.handicap - 1 + index
                                    : index;
                            // if white didn't play (therefore has no elapsed) then the elapsed up to here is black's elapsed
                            const total_elapsed = move_elapsed[move_elapsed_index + 1]
                                ? move_elapsed[move_elapsed_index + 1]
                                : move_elapsed[move_elapsed_index];
                            const blur1 = (non_handicap_moves as any)?.[index]?.[4]?.blur;
                            const blur2 = (non_handicap_moves as any)?.[index + 1]?.[4]?.blur;
                            const black_sgf_download =
                                (
                                    (non_handicap_moves as any)?.[index]?.[4]?.sgf_downloaded_by ||
                                    []
                                ).indexOf(props.black_id) >= 0 ||
                                (
                                    (non_handicap_moves as any)?.[index + 1]?.[4]
                                        ?.sgf_downloaded_by || []
                                ).indexOf(props.black_id) >= 0;
                            const white_sgf_download =
                                (
                                    (non_handicap_moves as any)?.[index]?.[4]?.sgf_downloaded_by ||
                                    []
                                ).indexOf(props.white_id) >= 0 ||
                                (
                                    (non_handicap_moves as any)?.[index + 1]?.[4]
                                        ?.sgf_downloaded_by || []
                                ).indexOf(props.white_id) >= 0;
                            let other_sgf_download = false;
                            for (const player_id of (non_handicap_moves as any)?.[index]?.[4]
                                ?.sgf_downloaded_by || []) {
                                if (player_id !== props.black_id && player_id !== props.white_id) {
                                    other_sgf_download = true;
                                }
                            }
                            for (const player_id of (non_handicap_moves as any)?.[index + 1]?.[4]
                                ?.sgf_downloaded_by || []) {
                                if (player_id !== props.black_id && player_id !== props.white_id) {
                                    other_sgf_download = true;
                                }
                            }
                            acc.push([
                                orig[index],
                                orig[index + 1] ? orig[index + 1] : "-",
                                total_elapsed,
                                blur1,
                                blur2,
                                black_sgf_download,
                                white_sgf_download,
                                other_sgf_download,
                            ]);
                        }
                        return acc;
                    }, [] as any[])
                    // render them in a move pair per row
                    .map((move_pair, idx) => {
                        const black_move_time = move_pair[0];
                        const white_move_time = move_pair[1];
                        const total_elapsed = move_pair[2];
                        const black_blur = move_pair[3];
                        const white_blur = move_pair[4];
                        const black_download_sgf = move_pair[5];
                        const white_download_sgf = move_pair[6];
                        const other_download_sgf = move_pair[7];

                        return (
                            <React.Fragment key={idx}>
                                <div>{idx * 2 + 1 + handicap_move_offset}</div>
                                <div>
                                    {black_move_time}
                                    {!cm && blurDurationFormat(black_blur)}
                                    {black_download_sgf ? <i className="fa fa-download" /> : null}
                                </div>
                                <div>
                                    {white_move_time}
                                    {!cm && blurDurationFormat(white_blur)}
                                    {white_download_sgf ? <i className="fa fa-download" /> : null}
                                </div>
                                <div>
                                    {`${total_elapsed.format()}`}
                                    {other_download_sgf ? <i className="fa fa-download" /> : null}
                                </div>
                            </React.Fragment>
                        );
                    })
            }
            <div className="span-4">
                <hr />
            </div>
            <div>Totals:</div>
            <div>{moment.duration(black_elapsed).format()}</div>
            <div>{moment.duration(white_elapsed).format()}</div>
            <div>{moment.duration(game_elapsed).format()}</div>
            <div className="span-3 final-action-row">Final action:</div>
            <div className="final-action-row">
                {props.end_time &&
                    showSecondsResolution(
                        moment
                            .duration(props.end_time - props.start_time, "seconds")
                            .subtract(game_elapsed),
                    )}
            </div>
        </div>
    );
}

function blurDurationFormat(blur_ms: number | undefined): string | null {
    if (!blur_ms || blur_ms < 100) {
        return null;
    }

    if (blur_ms > 100 && blur_ms < 10000) {
        return " (" + (blur_ms / 1000).toFixed(1) + "s" + ")";
    }

    return " (" + moment.duration(blur_ms).format() + ")";
}
