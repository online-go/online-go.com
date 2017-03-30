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
import {Link, browserHistory} from 'react-router';
import {_, pgettext, interpolate} from "translate";
import {Goban} from "goban";
import {PersistentElement} from "PersistentElement";
import {InstructionalGoban} from "./InstructionalGoban";


interface TutorialProperties {
    params:any;
}

const NUM_PAGES = 2;

export class Tutorial extends React.PureComponent<TutorialProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        let page_number = parseInt(this.props.params.step || 0);

        switch (page_number) {
            case 0: return <ThisIsAGoban />;
            case 1: return <CapturingStones1 />;
            default:
                return <div>Invalid page</div>;
        }
    }
}

interface TutorialPageProperties {
}

abstract class TutorialPage extends React.PureComponent<TutorialPageProperties, any> {
    refs: {
        igoban;
    };
    _config: any;

    constructor(props) {
        super(props);
        this._config = Object.assign({
            width: 9,
            height: 9,
        }, this.config());
        this.state = {
            show_reset: false,
            show_next: false,
        };
    }


    getCurrentStep() {{{
        if (/[0-9]+/.test(window.location.pathname)) {
            return parseInt(window.location.pathname.match(/([0-9]+)/)[1]);
        }
        return 0;
    }}}
    prev = () => {{{
        let step = Math.max(0, Math.min(NUM_PAGES - 1, this.getCurrentStep() - 1));
        browserHistory.push(`/learn-to-play-go/${step}`);
    }}}
    next = () => {{{
        let step = Math.max(0, Math.min(NUM_PAGES - 1, this.getCurrentStep() + 1));
        browserHistory.push(`/learn-to-play-go/${step}`);
    }}}


    componentDidMount() {{{
        this.setState({show_next: this.showNext()});
    }}}
    showReset():boolean {{{
        return false;
    }}}
    showNext():boolean {{{
        return true;
    }}}
    onUpdate = () => {{{
        this.setState({
            show_reset: this.showReset(),
            show_next: this.showNext(),
        });
    }}}

    abstract text();
    abstract config();

    render() {
        return (
            <div className='Tutorial'>
                <div className='TutorialPage container'>
                    <div className='tutorial-text'>
                        {this.text()}
                    </div>
                    <InstructionalGoban ref='igoban' config={this._config} onUpdate={this.onUpdate} />

                    {this.state.show_prev && <button onClick={this.prev}>{_("Previous")}</button>}
                    {this.state.show_next && <button className='primary' onClick={this.next}>{_("Next")}</button>}
                </div>
            </div>
        );
    }
}


class ThisIsAGoban extends TutorialPage {
    constructor(props) {
        super(props);

    }

    text() {
        if (!this.state.show_next) {
            return (
                <div>
                    <p>
                        Welcome to Go! We'll be learning on a 9x9 board (or <i>&ldquo;goban&rdquo;</i>) today. As you
                        get better at the game, you'll play on 13x13 and 19x19 boards as well.
                    </p>

                    <p>
                        Go is a two player game. One plays as Black, the other as White. They
                        take turns placing "Stones" on the board. Try placing a stone now.
                    </p>
                </div>
            );
        } else {
            return (
                <div>
                    Great! Once a stone is placed, it cannot be moved. Stones can however
                    be captured...
                </div>
           );
        }
    }
    config() {
        return {
            'initial_state': {
                'black': '',
                'white': ''
            }
        };
    }
    showNext() {
        return !!this.refs.igoban.goban.engine.cur_move.parent;
    }
}


class CapturingStones1 extends TutorialPage {
    constructor(props) {
        super(props);
    }


    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    Stones are captured by completely surrounding them. Capture the white
                    stone by placing a black stone at <span className='coordinate'>E4</span>.
                </p>
            );
        } else {
            return (
                <p>
                    Excellent! Captured stones are taken as <i>&ldquo;prisoners&rdquo;</i> and are removed from the board.
                </p>
           );
        }
    }
    config() {
        return {
            'initial_state': {
                'black': 'd5e6f5',
                'white': 'e5'
            }
        };
    }
    showNext() {
        console.log('next?', this.refs.igoban.goban.engine.board[4][4]);
        return this.refs.igoban.goban.engine.board[4][4] !== 2;
    }
}

