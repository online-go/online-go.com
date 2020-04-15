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
        let game_elapseds: Array<ReturnType<typeof moment.duration>> = new Array(); // the time elapsed up to this move

        return (
            <div className='GameTimings'>
                <div className='timings-header'>Game Timings</div>
                <div>Move</div><div>Black</div><div>White</div><div>Elapsed Time</div>
                {
                // get the times from the moves array in a nice format, compute ongoing elapsed times
                this.props.moves.map(move => {
                    const elapsed = move[2];
                    game_elapsed.add(elapsed);
                    game_elapseds.push(game_elapsed.clone());
                    return(
                        move[2] < 60000 ?
                        `${moment.duration(elapsed).asSeconds()}s` :
                        moment.duration(elapsed).format());
                })
                // pair them up into black and white move pairs, along with the elapsed time to that point
                .reduce((acc, value, index, orig) => {
                    if (index % 2 === 0) {
                        const elapsed = game_elapseds[index + 1] ? game_elapseds[index + 1] : game_elapseds[index];
                        acc.push([orig[index], orig[index + 1] ? orig[index + 1]  : "-" , elapsed]);
                    }
                    return acc;
                }, [])
                // render them in a move pair per row
                .map((move_pair, idx) => (
                    <React.Fragment key={idx}>
                        <div>{idx * 2 + 1}</div>
                        <div>{move_pair[0]}</div>
                        <div>{move_pair[1]}</div>
                        <div>{`${move_pair[2].format()}`}</div>
                    </React.Fragment>
                ))}
            </div>
        );
    }
}
