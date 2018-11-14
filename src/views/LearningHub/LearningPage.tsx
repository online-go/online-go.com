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
import {Link} from "react-router-dom";
import {GoMath} from 'ogs-goban/GoMath';
import {InstructionalGoban} from "./InstructionalGoban";
import {sfx} from "ogs-goban/SFXManager";
import {browserHistory} from "ogsHistory";
import {setSectionPageCompleted, getSectionPageCompleted} from './util';

interface LearningPageProperties {
    title:string;
    npages:number;
    curpage:number;
    section:string;
    nextSection:string;
}

export abstract class LearningPage extends React.Component<LearningPageProperties, any> {
    refs: {
        igoban;
    };
    _config: any;
    correct_answer_triggered:boolean = false;
    wrong_answer_triggered:boolean = false;
    error_triggered:boolean = false;

    static underConstruction():boolean { return false; }

    constructor(props) {
        super(props);
        this._config = Object.assign({
            width: 9,
            height: 9,
            onCorrectAnswer: this.onCorrectAnswer,
            onWrongAnswer: this.onWrongAnswer,
            onError: this.onError,
        }, this.config());
        this.state = {
            show_reset: false,
            show_next: false,
        };
    }
    next = () => {{{
        setSectionPageCompleted(this.props.section, this.props.curpage);

        this.correct_answer_triggered = false;
        this.error_triggered = false;
        this.wrong_answer_triggered = false;

        if (this.props.curpage + 1 < this.props.npages) {
            browserHistory.push(window.location.pathname.replace(/\/[0-9]+/, '') + '/' + (this.props.curpage + 1));
        } else {
            browserHistory.push('/learning-hub/' + this.props.nextSection);
        }
    }}}
    reset = () => {{{
        this.correct_answer_triggered = false;
        this.error_triggered = false;
        this.wrong_answer_triggered = false;
        this.refs.igoban.reset();
        this.forceUpdate();
    }}}

    componentDidMount() {{{
        this.setState({show_next: this.complete()});
        sfx.play("tutorial-ping");
    }}}
    showReset():boolean {{{
        return false;
    }}}
    onUpdate = () => {{{
        if (this.complete()) {
            sfx.play("tutorial-pass");
            setTimeout(this.next, 1000);
        }
        else if (this.failed()) {
            sfx.play("tutorial-fail");
        }
        if (this.complete() || this.failed()) {
            this.refs.igoban.goban.disableStonePlacement();
        }

        this.setState({
            show_reset: this.showReset(),
            show_next: this.complete(),
        });
    }}}
    pagehref(i:number):string {{{
        return window.location.pathname.replace(/\/[0-9]*$/, "") + "/" + i;
    }}}

    onCorrectAnswer = () => {
        this.correct_answer_triggered = true;
        sfx.play("tutorial-pass");
        setTimeout(this.next, 1000);
        this.refs.igoban.goban.disableStonePlacement();
        this.forceUpdate();
    }
    onWrongAnswer = () => {
        this.wrong_answer_triggered = true;
        sfx.play("tutorial-fail");
        this.refs.igoban.goban.disableStonePlacement();
        this.forceUpdate();
    }
    onError = () => {
        //this.error_triggered = true;
        sfx.play("tutorial-fail");
        //this.refs.igoban.goban.disableStonePlacement();
        //this.forceUpdate();
    }

    makePuzzleMoveTree(_correct:Array<string>, _wrong:Array<string>, width:number = 9, height:number = 9) {
        let correct:Array<any> = [];
        let wrong:Array<any> = [];
        for (let s of _correct) {
            correct.push(GoMath.decodeMoves(s, width, height));
        }
        for (let s of _wrong) {
            wrong.push(GoMath.decodeMoves(s, width, height));
        }

        let ret = {
            x: -1,
            y: -1,
            branches: [],
        };

        function walk(cur, path, cb) {
            if (!path.length) {
                cb(cur);
                return;
            } else {
                for (let branch of cur.branches) {
                    if (branch.x === path[0].x && branch.y === path[0].y) {
                        path.shift();
                        walk(branch, path, cb);
                        return;
                    }
                }
                let new_branch = {
                    x: path[0].x,
                    y: path[0].y,
                    branches: [],
                };
                cur.branches.push(new_branch);
                path.shift();
                walk(new_branch, path, cb);
                return;
            }
        }

        for (let arr of correct) {
            walk(ret, arr, (node) => node.correct_answer = true);
        }

        for (let arr of wrong) {
            walk(ret, arr, (node) => node.wrong_answer = true);
        }

        return ret;
    }

    abstract text();
    abstract config():{initial_state:{black?:string, white?:string}};
    button():any { return null; }
    complete():boolean {
        return false;
    }
    failed():boolean {
        return false;
    }

    render() {
        let links = [];
        for (let i = 0; i < this.props.npages; ++i) {
            if (i === this.props.curpage) {
                links.push(<span key={i} onClick={this.reset} className='page active'>{i + 1}</span>);
            } else {
                links.push(<Link key={i} to={this.pagehref(i)} className='page'>
                    {getSectionPageCompleted(this.props.section, i) ? <i className='fa fa-star' /> : <span>{i + 1}</span>}
                </Link>);
            }
        }

        let correct:boolean = this.correct_answer_triggered || this.complete();
        let fail:boolean = this.error_triggered || this.wrong_answer_triggered || this.failed();

        return (
                <div className='LearningPage'>
                    <InstructionalGoban
                        ref='igoban'
                        config={this._config}
                        onUpdate={this.onUpdate}
                    />

                    <div className='LearningPage-pages'>
                        <div className='header'>
                            <h1>{this.props.title}</h1>
                        </div>

                        <div className='text'>
                            {!correct && fail &&
                                <div className='failed'>
                                    <h1>Puzzle failed!</h1>
                                    <button className='reject' onClick={this.reset} >Retry</button>
                                </div>
                            }
                            {correct &&
                                <div className='complete'>
                                    <h1>Great job!</h1>
                                </div>
                            }
                            {!correct && !fail &&
                                <div>
                                    {this.text()}
                                    {this.button()}
                                </div>
                            }
                        </div>

                        <div className='pages'>
                            {links}
                        </div>
                    </div>
                </div>
        );
    }

    at(coord:string):number {
        if (this.refs.igoban && this.refs.igoban.goban) {
            let obj = this.refs.igoban.goban.engine.decodeMoves(coord);
            return this.refs.igoban.goban.engine.board[obj[0].y][obj[0].x];
        }
        return 0;
    }
    moveNumber():number {
        if (this.refs.igoban && this.refs.igoban.goban) {
            return this.refs.igoban.goban.engine.cur_move.move_number;
        }
        return 0;
    }
}


export class DummyPage extends LearningPage {
    constructor(props) { super(props); }
    static underConstruction():boolean { return true; }
    text() {
        return "Dummy page";
    }
    config() {
        return {
            'initial_state': {
                'black': 'd5e6f5',
                'white': 'e5'
            }
        };
    }
    complete() {
        return this.moveNumber() === 1 && this.at("e5") === 0;
    }
    failed() {
        return this.moveNumber() > 0 && !this.complete();
    }
}
