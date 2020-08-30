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

declare var swal;

interface GameTimingProperties {
    moves: any;
    free_handicap_placement: boolean;
    handicap: number;
}

interface GameTimingState {

}

export class GameTimings extends React.Component<GameTimingProperties> {

    constructor(props:GameTimingProperties) {
        super(props);

        let state:GameTimingState = {
        };
        this.state = state;
    }

    public render():JSX.Element {
        let game_elapsed: ReturnType<typeof moment.duration> = moment.duration(0); // running total
        let black_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
        let white_elapsed: ReturnType<typeof moment.duration> = moment.duration(0);
        let game_elapseds: Array<ReturnType<typeof moment.duration>> = new Array(); // the time elapsed up to each move

        // when there is free handicap placement, black plays handicap-1 moves before his actual first turn that white responds to...

        const handicap_moves = this.props.free_handicap_placement && this.props.handicap > 1 ?
            this.props.moves.slice(0, this.props.handicap - 1) : [];

        const non_handicap_moves = this.props.free_handicap_placement && this.props.handicap > 1 ?
            this.props.moves.slice(this.props.handicap - 1) :
            this.props.moves;

        const handicap_move_offset = this.props.free_handicap_placement && this.props.handicap > 1 ?
            this.props.handicap - 1 : 0;

        return (
            <div className='GameTimings'>
                <div className='timings-header'>Game Timings</div>
                <div>Move</div><div>Black</div><div>White</div><div>Elapsed Time</div>
                {
                    // Get the times from the moves array in a nice format, compute ongoing elapsed times

                    // first display free handicap moves...
                    handicap_moves.map((move, move_num) => {
                        const elapsed = move[2];
                        game_elapsed.add(elapsed);
                        game_elapseds.push(game_elapsed.clone());
                        black_elapsed.add(elapsed);
                        const move_string =
                            elapsed < 60000 ?
                            `${moment.duration(elapsed).asSeconds().toFixed(1)}s` :
                            moment.duration(elapsed).format();
                        return(
                        <React.Fragment key={move_num}>
                            <div>{move_num + 1}</div>
                            <div>{move_string}</div>
                            <div>-</div>
                            <div>{`${game_elapseds[move_num].format()}`}</div>
                        </React.Fragment>);
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
                        }
                        else {
                            white_elapsed.add(elapsed);
                        }
                        return(
                            elapsed < 60000 ?
                            `${moment.duration(elapsed).asSeconds().toFixed(1)}s` :
                            moment.duration(elapsed).format());
                    })
                    // pair them up into black and white move pairs, along with the elapsed time to that point
                    .reduce((acc, value, index, orig) => {
                        if (index % 2 === 0) {
                            // the elapsed array can contain handicap moves, we have to skip past those
                            const elapseds_index = this.props.free_handicap_placement && this.props.handicap > 1 ?
                                this.props.handicap - 1 + index : index;
                            // if white didn't play (therefore has no elapsed) then the elapsed up to here is black's elapsed
                            const total_elapsed = game_elapseds[elapseds_index + 1] ? game_elapseds[elapseds_index + 1] : game_elapseds[elapseds_index];
                            acc.push([orig[index], orig[index + 1] ? orig[index + 1]  : "-" , total_elapsed]);
                        }
                        return acc;
                    }, [])
                    // render them in a move pair per row
                    .map((move_pair, idx) => (
                        <React.Fragment key={idx}>
                            <div>{idx * 2 + 1 + handicap_move_offset}</div>
                            <div>{move_pair[0]}</div>
                            <div>{move_pair[1]}</div>
                            <div>{`${move_pair[2].format()}`}</div>
                        </React.Fragment>
                    ))
                }
                <div>Totals:</div>
                <div>{black_elapsed.asMinutes() < 1 ? `${black_elapsed.asSeconds().toFixed(1)}s` : black_elapsed.format()}</div>
                <div>{white_elapsed.asMinutes() < 1 ? `${white_elapsed.asSeconds().toFixed(1)}s` : white_elapsed.format()}</div>
                <div></div>
            </div>
        );
    }
}
