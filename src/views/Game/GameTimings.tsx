/*
 * Copyright (C) 2012-2020  Online-Go.com
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


import * as moment from "moment";
import 'moment-duration-format';

import * as React from "react";
import { _, pgettext, interpolate } from "translate";

declare let swal;

interface GameTimingProperties {
    moves: any;
    start_time: number;
    end_time: number;
    free_handicap_placement: boolean;
    handicap: number;
    black_id: number;
    white_id: number;
}

interface GameTimingState {

}

export class GameTimings extends React.Component<GameTimingProperties> {

    constructor(props: GameTimingProperties) {
        super(props);

        let state: GameTimingState = {
        };
        this.state = state;
    }

    show_seconds_nicely = (duration: moment.Duration) => (
        duration < moment.duration(60000) ?
        `${moment.duration(duration).asSeconds().toFixed(1)}s` :
        moment.duration(duration).format()
    );

    // needed because end_time and start_time are only to the nearest second
    show_seconds_resolution = (duration: moment.Duration) => {
        if (duration < moment.duration(1000)) {
            return ">1s";  // we don't have better resolution than this.
        } else if (duration < moment.duration(60000)) {
            return `${moment.duration(duration).asSeconds().toFixed(0)}s`;
        } else {
            return  moment.duration(duration).format("d:h:m:s");
        }
    };

    public render(): JSX.Element {
        let game_elapsed: ReturnType<typeof moment.duration> = moment.duration(0); // running total
        let black_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
        let white_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
        let game_elapseds: Array<ReturnType<typeof moment.duration>> = new Array(); // the time elapsed up to each move

        let non_handicap_moves = [...this.props.moves];
        let handicap_moves = [];
        let handicap_move_offset = 0;

        let white_first_turn = false;
        let first_row = <React.Fragment></React.Fragment>;

        if (this.props.handicap) {
            if (this.props.free_handicap_placement) {
                // when there is free handicap placement, black plays handicap-1 moves before his actual first turn that white responds to...

                handicap_moves = this.props.moves.slice(0, this.props.handicap - 1);
                non_handicap_moves = this.props.moves.slice(this.props.handicap - 1);
                handicap_move_offset = this.props.handicap - 1;
            } else {
                // In fixed handicap placement, white goes first.  This needs a separate special row in the table to show just white's move

                white_first_turn = true;
                const first_move = non_handicap_moves.shift();
                handicap_move_offset = 1;
                const elapsed = first_move?.[2];
                game_elapsed.add(elapsed);
                game_elapseds.push(game_elapsed.clone());
                white_elapsed.add(elapsed);
                const move_string = this.show_seconds_nicely(elapsed);
                first_row =
                    <React.Fragment>
                        <div>0</div>
                        <div>-</div>
                        <div>{move_string}</div>
                        <div>{`${game_elapseds[0].format()}`}</div>
                    </React.Fragment>;
            }
        }

        return (
            <div className='GameTimings'>
                <div className='timings-header'>Game Timings</div>
                <div>Move</div><div>Black (blur)</div><div>White (blur)</div><div>Elapsed Time</div>
                {white_first_turn ? first_row : ""}
                {
                    // Get the times from the moves array in a nice format, compute ongoing elapsed times

                    // first display free handicap moves...
                    handicap_moves.map((move, move_num) => {
                        const elapsed = move[2];
                        game_elapsed.add(elapsed);
                        game_elapseds.push(game_elapsed.clone());
                        black_elapsed.add(elapsed);
                        const move_string = this.show_seconds_nicely(elapsed);
                        return (
                            <React.Fragment key={move_num}>
                                <div>{move_num + 1}</div>
                                <div>{move_string}</div>
                                <div>-</div>
                                <div>{`${game_elapseds[move_num].format()}`}</div>
                            </React.Fragment>
                        );
                    })
                }
                {
                    // now normal moves...
                    non_handicap_moves.map((move, move_num) => {
                        const blacks_turn: boolean = move_num % 2 === 0;
                        const elapsed = move[2];
                        game_elapsed.add(elapsed);
                        game_elapseds.push(game_elapsed.clone());
                        if (blacks_turn) {
                            black_elapsed.add(elapsed);
                        } else {
                            white_elapsed.add(elapsed);
                        }
                        return(
                            this.show_seconds_nicely(elapsed)
                        );
                    })
                    // pair them up into black and white move pairs, along with the elapsed time to that point
                    .reduce((acc, value, index, orig) => {
                        if (index % 2 === 0) {
                            // the elapsed array can contain handicap moves, we have to skip past those
                            const elapseds_index = this.props.free_handicap_placement && this.props.handicap > 1 ?
                                this.props.handicap - 1 + index : index;
                            // if white didn't play (therefore has no elapsed) then the elapsed up to here is black's elapsed
                            const total_elapsed = game_elapseds[elapseds_index + 1] ? game_elapseds[elapseds_index + 1] : game_elapseds[elapseds_index];
                            const blur1 = non_handicap_moves?.[index]?.[4]?.blur;
                            const blur2 = non_handicap_moves?.[index + 1]?.[4]?.blur;
                            const black_sgf_download =
                                (non_handicap_moves?.[index]?.[4]?.sgf_downloaded_by || []).indexOf(this.props.black_id) >= 0
                             || (non_handicap_moves?.[index + 1]?.[4]?.sgf_downloaded_by || []).indexOf(this.props.black_id) >= 0;
                            const white_sgf_download =
                                (non_handicap_moves?.[index]?.[4]?.sgf_downloaded_by || []).indexOf(this.props.white_id) >= 0
                             || (non_handicap_moves?.[index + 1]?.[4]?.sgf_downloaded_by || []).indexOf(this.props.white_id) >= 0;
                            let other_sgf_download = false;
                            for (let player_id of non_handicap_moves?.[index]?.[4]?.sgf_downloaded_by || []) {
                                if (player_id !== this.props.black_id && player_id !== this.props.white_id) {
                                    other_sgf_download = true;
                                }
                            }
                            for (let player_id of non_handicap_moves?.[index + 1]?.[4]?.sgf_downloaded_by || []) {
                                if (player_id !== this.props.black_id && player_id !== this.props.white_id) {
                                    other_sgf_download = true;
                                }
                            }
                            acc.push([
                                orig[index],
                                orig[index + 1] ? orig[index + 1]  : "-" ,
                                total_elapsed,
                                blur1,
                                blur2,
                                black_sgf_download,
                                white_sgf_download,
                                other_sgf_download,
                            ]);
                        }
                        return acc;
                    }, [])
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
                                <div>{black_move_time}{blurDurationFormat(black_blur)}
                                    {black_download_sgf ? <i className='fa fa-download' /> : null}
                                </div>
                                <div>{white_move_time}{blurDurationFormat(white_blur)}
                                    {white_download_sgf ? <i className='fa fa-download' /> : null}
                                </div>
                                <div>{`${total_elapsed.format()}`}
                                    {other_download_sgf ? <i className='fa fa-download' /> : null}
                                </div>
                            </React.Fragment>
                        );
                    })
                }
                <div className='span-4'>
                    <hr />
                </div>
                <div>Totals:</div>
                <div>{this.show_seconds_nicely(black_elapsed)}</div>
                <div>{this.show_seconds_nicely(white_elapsed)}</div>
                <div>{/* empty cell at end of row */}</div>
                <div className='span-3' >Final action:</div>
                <div>{this.show_seconds_resolution(moment.duration(this.props.end_time - this.props.start_time, "seconds").subtract(game_elapsed))}</div>
                <div>{/* empty cell at end of row */}</div>
            </div>
        );
    }
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
