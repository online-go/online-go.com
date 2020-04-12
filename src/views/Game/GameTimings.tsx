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

import * as React from "react";
import { _, pgettext, interpolate } from "translate";

declare var swal;

interface GameTimingProperties {
    moves: any;
}

interface GameTimingState {

}

export class GameTimings extends React.Component<GameTimingProperties> {
    // this will be the full ai review we are working with, as opposed to
    // selected_ai_review which will just contain some metadata from the
    // postgres database


    constructor(props:GameTimingProperties) {
        super(props);
        let state:GameTimingState = {
        };
        this.state = state;
    }

    public render():JSX.Element {
        return (
            <div className='GameTimings'>
                <div className='timings-header'>Game Timings</div>
                <div>Move</div><div>Black</div><div>White</div>
                {
                // get the times from the moves in a nice format
                this.props.moves.map(move => (
                    move[2] < 60000 ?
                    `${moment.duration(move[2]).asSeconds()}s` :
                    moment.duration(move[2]).humanize()
                ))
                // pair them up into black and white move pairs
                .reduce((acc, value, index, orig) => {
                    if (index % 2 === 0) {
                        acc.push(orig.slice(index, index + 2));
                    }
                    return acc;
                }, [])
                // render them in a move pair per row
                .map((move_pair, idx) => (
                    <React.Fragment key={idx}>
                        <div>{idx * 2}</div>
                        <div>{move_pair[0]}</div>
                        <div>{move_pair[1]}</div>
                    </React.Fragment>
                ))}
            </div>
        );
    }
}
