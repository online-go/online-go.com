/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import * as data from "data";
import device from "device";
import * as preferences from "preferences";
import * as React from "react";
import * as moment from "moment";
import {LineText} from "misc-ui";
import {Link} from "react-router-dom";
import {_, ngettext, pgettext, interpolate} from "translate";
import {Player} from "Player";
import {profanity_filter} from "profanity_filter";
import {Game} from './Game';
import {ChatUserList, ChatUserCount} from "ChatUserList";
import {TabCompleteInput} from "TabCompleteInput";
import * as Chat from "Chat";

let active_game_view:Game = null;

export function setActiveGameView(game:Game) {
    active_game_view = game;
}

interface GameChatProperties {
    chatlog: Array<any>;
    gameview: Game;
    userIsPlayer: boolean;
    onChatLogChanged: (c) => void;
    channel: string;
}

interface GameChatLineProperties {
    line: any;
    lastline: any;
    gameview: Game;
}

/* Chat  */
export class GameChat extends React.PureComponent<GameChatProperties, any> {
    ref_chat_log;
    qc_editableMsgs = null;

    scrolled_to_bottom: boolean = true;

    constructor(props) {
        super(props);
        this.state = {
            chat_log: "main",
            show_player_list: false,
            qc_visible: false,
            qc_editing: false,
        };
        this.chat_log_filter = this.chat_log_filter.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.updateScrollPosition = this.updateScrollPosition.bind(this);
    }

    chat_log_filter(line) {
        return true;
    }
    onKeyPress(event) {
        if (event.charCode === 13) {
            if (event.target.className === "qc-option") {
                this.saveEdit();
                event.preventDefault();
            }
            else {
                let input = event.target as HTMLInputElement;
                this.props.gameview.goban.sendChat(input.value, this.state.chat_log);
                input.value = "";
                return false;
            }
        }
    }

    onFocus(event) {
        this.hideQCOptions();
    }

    componentDidMount() {
        this.autoscroll();
    }
    componentDidUpdate() {
        this.autoscroll();
        if (this.qc_editableMsgs !== null && this.qc_editableMsgs[0] !== null) {
            this.qc_editableMsgs[0].focus();
        }
    }

    updateScrollPosition() {
        let tf = this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 < this.ref_chat_log.offsetHeight;
        if (tf !== this.scrolled_to_bottom) {
            this.scrolled_to_bottom  = tf;
            this.ref_chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        this.scrolled_to_bottom = this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 < this.ref_chat_log.offsetHeight;
    }
    autoscroll() {
        if (this.scrolled_to_bottom) {
            this.ref_chat_log.scrollTop = this.ref_chat_log.scrollHeight;
            setTimeout(() => {
                if (this.ref_chat_log) {
                    this.ref_chat_log.scrollTop = this.ref_chat_log.scrollHeight;
                }
            }, 100);
        }
    }
    toggleChatLog = () => {
        let new_chat_log = this.state.chat_log === "main" ? "malkovich" : "main";
        this.setState({
            chat_log: new_chat_log,
            qc_visible: false,
            qc_editing: false
        });
        this.props.onChatLogChanged(new_chat_log);
    }
    toggleModeratorChatLog = () => {
        let new_chat_log = this.state.chat_log === "main" ? "moderator" : "main";
        this.setState({
            chat_log: new_chat_log,
            qc_visible: false,
            qc_editing: false
        });
        this.props.onChatLogChanged(new_chat_log);
    }
    togglePlayerList = () => {
        this.setState({
            show_player_list: !this.state.show_player_list
        });
    }
    togglePlayerListSortOrder = () => {
    }

    sendQuickChat = (msg: string) => {
        this.props.gameview.goban.sendChat(msg, this.state.chat_log);
        this.hideQCOptions();
    }

    showQCOptions = () => {
        this.setState({
            qc_visible: true
        });
    }

    hideQCOptions = () => {
        this.setState({
            qc_visible: false,
            qc_editing: false
        });
    }

    startEdit = () => {
        this.setState({
            qc_editing: true
        });
    }

    saveEdit = () => {
        let user = data.get("user");
        this.qc_editableMsgs.map((li, index) => {
            user.qc_phrases[index] = li.innerText.trim();
        });
        localStorage.setItem("ogs.qc.messages", JSON.stringify(user.qc_phrases));
        this.finishEdit();
    }

    finishEdit = () => {
        this.qc_editableMsgs = null;
        this.setState({
            qc_editing: false
        });
    }

    render() {
        let last_line = null;
        let user = data.get("user");
        let channel = this.props.gameview.game_id ? `game-${this.props.gameview.game_id}` : `review-${this.props.gameview.review_id}`;

        return (
            <div className="chat-container">
                <div className={"log-player-container" + (this.state.show_player_list ? " show-player-list" : "")}>
                    <div className="chat-log-container">
                        <div ref={el => this.ref_chat_log = el} className="chat-log autoscrolling" onScroll={this.updateScrollPosition}>
                            {this.props.chatlog.filter(this.chat_log_filter).map((line, idx) => {
                                let ll = last_line;
                                last_line = line;
                                //jreturn <GameChatLine key={line.chat_id} line={line} lastline={ll} gameview={this.props.gameview} />
                                return <GameChatLine key={line.chat_id} line={line} lastline={ll} gameview={this.props.gameview} />;
                            })}
                        </div>
                    </div>
                    {(this.state.show_player_list || null) &&
                        <ChatUserList channel={channel} />
                    }
                </div>
                {this.renderQC(user)}
                <div className="chat-input-container input-group">
                    {((this.props.userIsPlayer && data.get('user').email_validated) || null) &&
                        <button
                            className={`chat-input-chat-log-toggle sm ${this.state.chat_log}`}
                            onClick={this.toggleChatLog}
                            >
                            {this.state.chat_log === "malkovich" ? _("Malkovich") : _("Chat")} <i className={"fa " + (this.state.chat_log === "malkovich" ? "fa-caret-up" : "fa-caret-down")}/>
                        </button>
                    }
                    {((!this.props.userIsPlayer && data.get('user').is_moderator) || null) &&
                        <button
                            className={`chat-input-chat-log-toggle sm ${this.state.chat_log}`}
                            onClick={this.toggleModeratorChatLog}
                            >
                            {this.state.chat_log === "moderator" ? _("Moderator") : _("Chat")} <i className={"fa " + (this.state.chat_log === "moderator" ? "fa-caret-up" : "fa-caret-down")}/>
                        </button>
                    }
                    <TabCompleteInput className={`chat-input  ${this.state.chat_log}`}
                        disabled={user.anonymous || !data.get('user').email_validated}
                        placeholder={user.anonymous
                            ? _("Login to chat")
                            : !data.get('user').email_validated ? _("Chat will be enabled once your email address has been validated")
                                : (this.state.chat_log === "malkovich"
                                    ? pgettext("Malkovich logs are only visible after the game has ended", "Visible after the game")
                                    : _("Say hi!")
                                  )
                        }
                        onKeyPress={this.onKeyPress}
                        onFocus={this.onFocus}
                    />
                    {this.props.userIsPlayer && user.email_validated && this.props.gameview.game_id && this.state.chat_log === "main"
                        ? <i className={"qc-toggle fa " + (this.state.qc_visible ? "fa-caret-down" : "fa-caret-up")} onClick={this.state.qc_visible ? this.hideQCOptions : this.showQCOptions}/>
                        : null
                    }
                    <ChatUserCount
                        chat={this}
                        active={this.state.show_player_list}
                        channel={channel}
                    />
                </div>
            </div>
        );
    }

    renderQC = (user) => {
        let quick_chat: JSX.Element = null;

        if (this.state.qc_visible) {
            if (user.qc_phrases === undefined) {
                let qc_local = localStorage.getItem("ogs.qc.messages");
                if (qc_local === null) {
                    user.qc_phrases = [
                        _("Hi") + ".",
                        _("Have fun") + ".",
                        _("Sorry - misclick") + ".",
                        _("Good game") + ".",
                        _("Thanks for the game") + "."
                    ];
                    localStorage.setItem("ogs.qc.messages", JSON.stringify(user.qc_phrases));
                }
                else {
                    user.qc_phrases = JSON.parse(qc_local);
                }
            }

            let lis = user.qc_phrases.map((msg, index) =>
                    <li
                        className="qc-option"
                        key={index}
                        contentEditable={this.state.qc_editing}
                        onKeyPress={this.onKeyPress}
                        ref={this.state.qc_editing
                            ? (input) => {
                                this.qc_editableMsgs = (index === 0 ? [] : this.qc_editableMsgs);
                                this.qc_editableMsgs.push(input);
                                }
                            : null
                        }
                    >
                        {
                        this.state.qc_editing
                        ? msg
                        : (<a onClick={() => {this.sendQuickChat(msg); }} >{msg}</a>)
                        }
                    </li>
            );

            quick_chat =
            <div className="qc-option-list-container">
                {this.state.qc_editing
                    ? (<span className="qc-edit">
                        <button onClick={() => {this.saveEdit(); }} className='xs edit-button'><i className={"fa fa-save"}/> {_("Save")}</button>
                        <button onClick={this.finishEdit} className='xs edit-button'><i className={"fa fa-times-circle"}/> {_("Cancel")}</button>
                        </span>)
                    : (<span className="qc-edit">
                        <button onClick={this.startEdit} className='xs edit-button'><i className={"fa fa-pencil"}/> {_("Edit")}</button>
                        </span>)
                }
                <ul>{lis}</ul>
            </div>;
        }
        return quick_chat;
    }
}


function parsePosition(position: string) {
    if (!active_game_view || !position) {
        return {
            i: -1,
            j: -1
        };
    }
    let goban = active_game_view.goban;

    let i = "abcdefghjklmnopqrstuvwxyz".indexOf(position[0].toLowerCase());
    let j = ((goban && goban.height) || 19) - parseInt(position.substr(1));
    if (j < 0 || i < 0) {
        i = -1;
        j = -1;
    }
    if (i >= ((goban && goban.width) || 19) || j >= ((goban && goban.height) || 19)) {
        i = -1;
        j = -1;
    }
    return {i: i, j: j};
}
function highlight_position(event) {
    if (!active_game_view) { return; }

    let pos = parsePosition(event.target.innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = true;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}
function unhighlight_position(event) {
    if (!active_game_view) { return; }

    let pos = parsePosition(event.target.innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = false;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}

export class GameChatLine extends React.Component<GameChatLineProperties, any> {
    //scrolled_to_bottom:any = {"malkovich": true, "main": true};

    constructor(props) {
        super(props);
    }

    markup(body): JSX.Element|Array<JSX.Element> {
        if (typeof(body) === "string") {
            return Chat.chat_markup(body, [
                {split: /(\b[a-zA-Z][0-9]{1,2}\b)/mg, pattern: /\b([a-zA-Z][0-9]{1,2})\b/mg,
                    replacement: (m, idx) => {
                        let pos = m[1];
                        if (parsePosition(pos).i < 0) {
                            return (<span key={idx}>{m[1]}</span>);
                        }
                        return (<span key={idx} className="position" onMouseEnter={highlight_position} onMouseLeave={unhighlight_position}>{m[1]}</span>);
                    }
                },
            ]);
        } else {
            try {
                switch (body.type) {
                    case "analysis": {
                            if (!preferences.get("variations-in-chat-enabled")) {
                                return (
                                    <span>
                                        {_("Variation") + ": " + (body.name ? profanity_filter(body.name) : "<error>")}
                                    </span>
                                );
                            }


                            let gameview = this.props.gameview;
                            let goban = gameview.goban;
                            let orig_move = null;
                            let stashed_pen_marks = goban.pen_marks;
                            let orig_marks = null;

                            let v = parseInt("" + (body.name ? body.name.replace(/^[^0-9]*/, "") : 0));
                            if (v) {
                                this.props.gameview.last_variation_number = Math.max(v, this.props.gameview.last_variation_number);
                            }

                            let onLeave = () => {
                                if (this.props.gameview.in_pushed_analysis) {
                                    this.props.gameview.in_pushed_analysis = false;
                                    this.props.gameview.leave_pushed_analysis = null;
                                    goban.engine.jumpTo(orig_move);
                                    orig_move.marks = orig_marks;
                                    goban.pen_marks = stashed_pen_marks;
                                    if (goban.pen_marks.length === 0) {
                                        goban.disablePen();
                                    }
                                    goban.redraw();
                                }
                            };

                            let onEnter = () => {
                                this.props.gameview.in_pushed_analysis = true;
                                this.props.gameview.leave_pushed_analysis = onLeave;
                                let turn = "branch_move" in body ? body.branch_move - 1 : body.from; /* branch_move exists in old games, and was +1 from our current counting */
                                let moves = body.moves;

                                orig_move = goban.engine.cur_move;
                                if (orig_move) {
                                    orig_marks = orig_move.marks;
                                    orig_move.clearMarks();
                                } else {
                                    orig_marks = null;
                                }
                                goban.engine.followPath(parseInt(turn), moves);

                                if (body.marks) {
                                    goban.setMarks(body.marks);
                                }
                                stashed_pen_marks = goban.pen_marks;
                                if (body.pen_marks) {
                                    goban.pen_marks = [].concat(body.pen_marks);
                                } else {
                                    goban.pen_marks = [];
                                }

                                goban.redraw();
                            };

                            let onClick = () => {
                                onLeave();
                                goban.setMode("analyze");
                                onEnter();
                                this.props.gameview.in_pushed_analysis = false;
                                goban.updateTitleAndStonePlacement();
                                goban.syncReviewMove();
                                goban.redraw();
                            };

                            return (
                                <span className="variation"
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                    onClick={onClick}
                                >
                                    {_("Variation") + ": " + (body.name ? profanity_filter(body.name) : "<error>")}
                                </span>
                            );
                        }
                    case "review":
                        return <Link to={`/review/${body.review_id}`}>{interpolate(_("Review: ##{{id}}"), {"id": body.review_id})}</Link>;
                    default:
                        return <span>[error loading chat line]</span>;
                }
            } catch (e) {
                console.log(e.stack);
                return <span>[error loading chat line]</span>;
            }
        }
    }

    shouldComponentUpdate(next_props, _next_state) {
        return this.props.line.chat_id !== next_props.line.chat_id;
    }

    jumpToMove = () => {
       this.props.gameview.stopEstimatingScore();
       let line = this.props.line;
       let goban = this.props.gameview.goban;

       if ("move_number" in line) {
           if (!goban.isAnalysisDisabled()) {
               goban.setMode("analyze");
           }

            goban.engine.followPath(line.move_number, "");
            goban.redraw();

            if (goban.isAnalysisDisabled()) {
                goban.updatePlayerToMoveTitle();
            }

            goban.emit("update");
       }

       if ("from" in line) {
            let mvs = goban.engine.decodeMoves(line.moves);
            let ct = 0;
            for (let i = 0; i < mvs.length; ++i) {
                ct += mvs[i].edited ? 0 : 1;
            }

            if (goban.isAnalysisDisabled()) {
                goban.setMode("analyze");
            }

            goban.engine.followPath(line.from, line.moves);
            goban.syncReviewMove();
            goban.drawPenMarks(goban.engine.cur_move.pen_marks);
            goban.redraw();
            //last_move_number[type] = line.from;
            //last_moves[type] = line.moves;
       }

    }

    render() {
        let line = this.props.line;
        let lastline = this.props.lastline;
        let ts = line.date ? new Date(line.date * 1000) : null;
        let third_person = "";
        if (typeof(line.body) === "string" && line.body.substr(0, 4) === "/me ") {
            third_person = (line.body.substr(0, 4) === "/me ") ? "third-person" : "";
            line.body = line.body.substr(4);
        }
        let msg = this.markup(line.body);
        let show_date: JSX.Element = null;
        let move_number: JSX.Element = null;

        if (!lastline || (line.date && lastline.date)) {
            if (line.date) {
                if (!lastline || moment(new Date(line.date * 1000)).format("YYYY-MM-DD") !== moment(new Date(lastline.date * 1000)).format("YYYY-MM-DD")) {
                    show_date = <div className="date">{moment(new Date(line.date * 1000)).format("LL")}</div>;
                }
            }
        }

        if (!lastline || (line.move_number !== lastline.move_number) || (line.from !== lastline.from) || (line.moves !== lastline.moves)) {
            move_number = <LineText className="move-number" onClick={this.jumpToMove}>Move {
                ("move_number" in line
                    ? line.move_number
                    : ("moves" in line ? (line.from + (line.moves.length ? " + " + line.moves.length / 2 : "")) : "")
                )
            }</LineText>;
        }

        let chat_id = this.props.gameview.review_id ? ('r.' + this.props.gameview.review_id) : ('g.' + this.props.gameview.game_id);
        chat_id += '.' + line.channel + '.' + line.chat_id;

        return (
            <div className={`chat-line-container`} data-chat-id={chat_id}>
                {move_number}
                {show_date}
                <div className={`chat-line ${line.channel} ${third_person} chat-user-${line.player_id}`}>
                    {(ts) && <span className="timestamp">[{ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}] </span>}
                    {(line.player_id || null) && <Player user={line} flare disableCacheUpdate />}
                    <span className="body">{third_person ? " " : ": "}{msg}</span>
                </div>
            </div>
        );
    }
}


