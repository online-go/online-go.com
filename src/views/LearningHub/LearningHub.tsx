/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Card, CardLink} from "material";
import {_, pgettext, interpolate} from "translate";
import {Capture} from './Capture';
import {Defend} from './Defend';
import {Territory} from './Territory';
import {EndingTheGame} from './EndingTheGame';


interface LearningHubProperties {
    match: {
        params: {
            section: string;
            page: number;
        }
    };
}

export class LearningHub extends React.PureComponent<LearningHubProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return <div id='LearningHub'>{this._render()}</div>;
    }
    _render() {
        //let page = parseInt(this.props.match.params.section || 0);
        let section = (this.props.match.params.section || "index").toLowerCase();

        switch (section) {
            /* Beginner */
            case "capture":
                return <Capture page={this.props.match.params.page} nextSection='defend' />;

            case "defend":
                return <Defend page={this.props.match.params.page} nextSection='territory' />;

            case "territory":
                return <Territory page={this.props.match.params.page} nextSection='ending-the-game' />;

            case "ending-the-game":
                return <EndingTheGame page={this.props.match.params.page} nextSection='about-the-board' />;

            /* Intermediate */


            default:
            case "index":
                return <Index />;
        }
    }
}

class Index extends React.PureComponent<{}, any>  {
    constructor(props) {
        super(props);
    }

    render() {
        const progress = 9;
        return (
            <div id='LearningHub-Index'>

            {/*
            <div id='LearningHub-progress-box-container'>
            <Card id='LearningHub-progress-box' >
                <div id='LearningHub-progress-box-bottom-half'>
                    <h2>{_("Learn Go by playing!")}</h2>
                    <div className="progress">
                    <div className="progress-bar primary" style={{width: progress + "%"}} />
                    </div>
                    <div>
                    {interpolate(_("Progress: {{progress_percent}}%"), {progress_percent: progress})}
                    </div>
                </div>
            </Card>
            </div>
            */}

            <div id='LearningHub-list'>
            <h2>Fundamentals</h2>
            <div className='section'>
                <CardLink className='next' to='/learning-hub/capture'>
                    <img src='' />
                    <div>
                        <h1>Capture</h1>
                        <h3>Surrounding stones</h3>
                    </div>
                </CardLink>
                <CardLink className='next' to='/learning-hub/defend'>
                    <img src='' />
                    <div>
                        <h1>Defend</h1>
                        <h3>Two eyes or death</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/territory'>
                    <img src='' />
                    <div>
                        <h1>Territory</h1>
                        <h3>Stake your claim</h3>
                    </div>
                </CardLink>
                <CardLink className='done' to='/learning-hub/ending-the-game'>
                    <img src='' />
                    <div>
                        <h1>Ending the Game</h1>
                        <h3>Pass and Pass</h3>
                    </div>
                </CardLink>
            </div>

            <h2>Intermediate</h2>
            <div className='section'>
                <CardLink className='next' to='/learning-hub/the-board'>
                    <img src='' />
                    <div>
                        <h1>The board</h1>
                        <h3>Corners, sides, middle</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/ladders'>
                    <img src='' />
                    <div>
                        <h1>Ladders</h1>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/snapback'>
                    <img src='' />
                    <div>
                        <h1>Snapback</h1>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/false-eyes'>
                    <img src='' />
                    <div>
                        <h1>False Eyes</h1>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/cutting-stones'>
                    <img src='' />
                    <div>
                        <h1>Cutting Stones</h1>
                    </div>
                </CardLink>
                <CardLink className='done' to='/learning-hub/jumping-stones'>
                    <img src='' />
                    <div>
                        <h1>Jumping Stones</h1>
                    </div>
                </CardLink>
            </div>

            <h2>Advanced</h2>
            <div className='section'>
                <CardLink className='todo' to='/learning-hub/semeai'>
                    <img src='' />
                    <div>
                        <h1>Semeai</h1>
                        <h3>Attacking eachother</h3>
                    </div>
                </CardLink>
                <CardLink className='next' to='/learning-hub/counting-liberties'>
                    <img src='' />
                    <div>
                        <h1>Counting Liberties</h1>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/mutual-life'>
                    <img src='' />
                    <div>
                        <h1>Seki</h1>
                        <h3>Mutal life</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/ko-battles'>
                    <img src='' />
                    <div>
                        <h1>Ko Battles</h1>
                        <h3>Exploiting the Ko rule</h3>
                    </div>
                </CardLink>
            </div>

            <h2>About the game</h2>
            <div className='section'>
                <CardLink className='todo' to='/learning-hub/what-is-go'>
                    <img src='' />
                    <div>
                        <h3>What is Go?</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/sport-of-go-and-go-as-art'>
                    <img src='' />
                    <div>
                        <h3>Sport of Go and Go as Art</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/benefits-of-learning-go'>
                    <img src='' />
                    <div>
                        <h3>Benefits of Learning Go</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/basic-manners-of-go'>
                    <img src='' />
                    <div>
                        <h3>Basic Manners of Go</h3>
                    </div>
                </CardLink>
                <CardLink className='todo' to='/learning-hub/terminology'>
                    <img src='' />
                    <div>
                        <h3>Terminology</h3>
                    </div>
                </CardLink>
            </div>
            </div>
            </div>
        );
    }
}
