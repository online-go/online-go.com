/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as preferences from "preferences";
import * as React from "react";
import * as moment from "moment";
import { LineText } from "misc-ui";
import { Link } from "react-router-dom";
import { _, pgettext, interpolate } from "translate";
import { Player } from "Player";
import { profanity_filter } from "profanity_filter";
import { Game } from "./Game";
import { ChatUserList, ChatUserCount } from "ChatUserList";
import { TabCompleteInput } from "TabCompleteInput";
import { chat_markup } from "components/Chat";
import { inGameModChannel } from "chat_manager";
import { MoveTree } from "goban";

let active_game_view: Game = null;

export function setActiveGameView(game: Game) {
    active_game_view = game;
}

type ChatMode = "main" | "malkovich" | "moderator" | "hidden";
interface GameChatProperties {
    chatlog: ChatLine[];
    gameview: Game;
    userIsPlayer: boolean;
    onChatLogChanged: (c: ChatMode) => void;
    channel: string;
}

interface ChatLine {
    chat_id: number;
    body: string;
    date: number;
    move_number: number;
    from: number;
    moves: string;
    channel: string;
    player_id: number;
}

interface GameChatLineProperties {
    line: ChatLine;
    lastline: ChatLine;
    gameview: Game;
}

interface GameChatState {
    chat_log: "main" | "malkovich" | "moderator" | "hidden";
    show_player_list: boolean;
    qc_visible: boolean;
    qc_editing: boolean;
}

/* Chat  */
export class GameChat extends React.PureComponent<GameChatProperties, GameChatState> {
    ref_chat_log: HTMLElement;
    qc_editableMsgs: HTMLLIElement[] = null;
    scrolled_to_bottom: boolean = true;

    constructor(props: GameChatProperties) {
        super(props);
        const in_game_mod_channel = inGameModChannel(props.gameview.game_id);
        this.state = {
            chat_log: in_game_mod_channel ? "hidden" : "main",
            show_player_list: false,
            qc_visible: false,
            qc_editing: false,
        };
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.updateScrollPosition = this.updateScrollPosition.bind(this);

        const channel = `game-${props.gameview.game_id}`;
        data.watch(
            `moderator.join-game-publicly.${channel}`,
            this.onAnonymousOverrideChange,
            true,
            true,
        );
    }

    onAnonymousOverrideChange = () => {
        const in_game_mod_channel = inGameModChannel(this.props.gameview.game_id);
        if (in_game_mod_channel) {
            this.setState({ chat_log: "hidden" });
        } else {
            this.setState({ chat_log: "main" });
        }
    };
    componentWillUnmount() {
        const channel = `game-${this.props.gameview.game_id}`;
        data.unwatch(`moderator.join-game-publicly.${channel}`, this.onAnonymousOverrideChange);
    }

    onKeyPress(event: React.KeyboardEvent<HTMLElement>) {
        if (event.key === "Enter") {
            const input = event.target as HTMLInputElement;
            if (input.className === "qc-option") {
                this.saveEdit();
                event.preventDefault();
            } else {
                this.props.gameview.goban.sendChat(input.value, this.state.chat_log);
                input.value = "";
                return false;
            }
        }
    }

    onFocus() {
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
        const tf =
            this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 <
            this.ref_chat_log.offsetHeight;
        if (tf !== this.scrolled_to_bottom) {
            this.scrolled_to_bottom = tf;
            this.ref_chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        this.scrolled_to_bottom =
            this.ref_chat_log.scrollHeight - this.ref_chat_log.scrollTop - 10 <
            this.ref_chat_log.offsetHeight;
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
        const new_chat_log = this.state.chat_log === "main" ? "malkovich" : "main";
        this.setState({
            chat_log: new_chat_log,
            qc_visible: false,
            qc_editing: false,
        });
        this.props.onChatLogChanged(new_chat_log);
    };
    toggleModeratorChatLog = () => {
        const new_chat_log =
            this.state.chat_log === "main"
                ? "moderator"
                : this.state.chat_log === "hidden"
                ? "main"
                : "hidden";
        this.setState({
            chat_log: new_chat_log,
            qc_visible: false,
            qc_editing: false,
        });
        this.props.onChatLogChanged(new_chat_log);
    };
    togglePlayerList = () => {
        this.setState({
            show_player_list: !this.state.show_player_list,
        });
    };

    sendQuickChat = (msg: string) => {
        this.props.gameview.goban.sendChat(msg, this.state.chat_log);
        this.hideQCOptions();
    };

    showQCOptions = () => {
        this.setState({
            qc_visible: true,
        });
    };

    hideQCOptions = () => {
        this.setState({
            qc_visible: false,
            qc_editing: false,
        });
    };

    startEdit = () => {
        this.setState({
            qc_editing: true,
        });
    };

    saveEdit = () => {
        const user = data.get("user") as any;
        this.qc_editableMsgs.map((li, index) => {
            user.qc_phrases[index] = li.innerText.trim();
        });
        localStorage.setItem("ogs.qc.messages", JSON.stringify(user.qc_phrases));
        this.finishEdit();
    };

    finishEdit = () => {
        this.qc_editableMsgs = null;
        this.setState({
            qc_editing: false,
        });
    };

    render() {
        let last_line: ChatLine = null;
        const user = data.get("user");
        const channel = this.props.gameview.game_id
            ? `game-${this.props.gameview.game_id}`
            : `review-${this.props.gameview.review_id}`;

        return (
            <div className="GameChat">
                <div
                    className={
                        "log-player-container" +
                        (this.state.show_player_list ? " show-player-list" : "")
                    }
                >
                    <div className="chat-log-container">
                        <div
                            ref={(el) => (this.ref_chat_log = el)}
                            className="chat-log autoscrolling"
                            onScroll={this.updateScrollPosition}
                        >
                            {this.props.chatlog.map((line) => {
                                const ll = last_line;
                                last_line = line;
                                // return <GameChatLine key={line.chat_id} line={line} lastline={ll} gameview={this.props.gameview} />
                                return (
                                    <GameChatLine
                                        key={line.chat_id}
                                        line={line}
                                        lastline={ll}
                                        gameview={this.props.gameview}
                                    />
                                );
                            })}

                            {/*
                                this.props.chatlog.length === 0 &&
                                <div className='chat-log-please-be-nice'>{_("Please be nice in chat.")}</div>
                            */}
                        </div>
                    </div>
                    {(this.state.show_player_list || null) && <ChatUserList channel={channel} />}
                </div>
                {this.renderQC(user)}
                <div className="chat-input-container input-group">
                    {((this.props.userIsPlayer && data.get("user").email_validated) || null) && (
                        <button
                            className={`chat-input-chat-log-toggle sm ${this.state.chat_log}`}
                            onClick={this.toggleChatLog}
                        >
                            {this.state.chat_log === "malkovich"
                                ? _("Malkovich")
                                : this.state.chat_log === "hidden"
                                ? _("Hidden")
                                : _("Chat")}{" "}
                            <i
                                className={
                                    "fa " +
                                    (this.state.chat_log === "main"
                                        ? "fa-caret-down"
                                        : "fa-caret-up")
                                }
                            />
                        </button>
                    )}
                    {((!this.props.userIsPlayer && data.get("user").is_moderator) || null) && (
                        <button
                            className={`chat-input-chat-log-toggle sm ${this.state.chat_log}`}
                            onClick={this.toggleModeratorChatLog}
                        >
                            {this.state.chat_log === "moderator"
                                ? _("Moderator")
                                : this.state.chat_log === "hidden"
                                ? _("Hidden")
                                : _("Chat")}{" "}
                            <i
                                className={
                                    "fa " +
                                    (this.state.chat_log === "main"
                                        ? "fa-caret-down"
                                        : "fa-caret-up")
                                }
                            />
                        </button>
                    )}
                    <TabCompleteInput
                        ref={() => 0}
                        className={`chat-input  ${this.state.chat_log}`}
                        disabled={user.anonymous || !data.get("user").email_validated}
                        placeholder={
                            user.anonymous
                                ? _("Sign in to chat")
                                : !data.get("user").email_validated
                                ? _(
                                      "Chat will be enabled once your email address has been validated",
                                  )
                                : this.state.chat_log === "malkovich"
                                ? pgettext(
                                      "Malkovich logs are only visible after the game has ended",
                                      "Visible after the game",
                                  )
                                : this.state.chat_log === "moderator"
                                ? "Message players as a moderator"
                                : this.state.chat_log === "hidden"
                                ? "Visible only to moderators"
                                : pgettext(
                                      "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                                      interpolate("Message {{who}}", { who: "..." }),
                                  )
                        }
                        onKeyPress={this.onKeyPress}
                        onFocus={this.onFocus}
                    />
                    {this.props.userIsPlayer &&
                    user.email_validated &&
                    this.props.gameview.game_id &&
                    this.state.chat_log === "main" ? (
                        <i
                            className={
                                "qc-toggle fa " +
                                (this.state.qc_visible ? "fa-caret-down" : "fa-caret-up")
                            }
                            onClick={
                                this.state.qc_visible ? this.hideQCOptions : this.showQCOptions
                            }
                        />
                    ) : null}
                    <ChatUserCount
                        onClick={this.togglePlayerList}
                        active={this.state.show_player_list}
                        channel={channel}
                    />
                </div>
            </div>
        );
    }

    // TODO:Don't save qc_phrases on the user - there really is no need since
    // it is pulled/saved in local storage anyway.
    renderQC = (user: rest_api.UserConfig & { qc_phrases?: string[] }) => {
        let quick_chat: JSX.Element = null;

        if (this.state.qc_visible) {
            if (user.qc_phrases === undefined) {
                const qc_local = localStorage.getItem("ogs.qc.messages");
                if (qc_local === null) {
                    user.qc_phrases = [
                        _("Hi") + ".",
                        _("Have fun") + ".",
                        _("Sorry - misclick") + ".",
                        _("Good game") + ".",
                        _("Thanks for the game") + ".",
                    ];
                    localStorage.setItem("ogs.qc.messages", JSON.stringify(user.qc_phrases));
                } else {
                    user.qc_phrases = JSON.parse(qc_local);
                }
            }

            const lis = user.qc_phrases.map((msg, index) => (
                <li
                    className="qc-option"
                    key={index}
                    contentEditable={this.state.qc_editing}
                    onKeyPress={this.onKeyPress}
                    ref={
                        this.state.qc_editing
                            ? (input) => {
                                  this.qc_editableMsgs = index === 0 ? [] : this.qc_editableMsgs;
                                  this.qc_editableMsgs.push(input);
                              }
                            : null
                    }
                >
                    {this.state.qc_editing ? (
                        msg
                    ) : (
                        <a
                            onClick={() => {
                                this.sendQuickChat(msg);
                            }}
                        >
                            {msg}
                        </a>
                    )}
                </li>
            ));

            quick_chat = (
                <div className="qc-option-list-container">
                    {this.state.qc_editing ? (
                        <span className="qc-edit">
                            <button
                                onClick={() => {
                                    this.saveEdit();
                                }}
                                className="xs edit-button"
                            >
                                <i className={"fa fa-save"} /> {_("Save")}
                            </button>
                            <button onClick={this.finishEdit} className="xs edit-button">
                                <i className={"fa fa-times-circle"} /> {_("Cancel")}
                            </button>
                        </span>
                    ) : (
                        <span className="qc-edit">
                            <button onClick={this.startEdit} className="xs edit-button">
                                <i className={"fa fa-pencil"} /> {_("Edit")}
                            </button>
                        </span>
                    )}
                    <ul>{lis}</ul>
                </div>
            );
        }
        return quick_chat;
    };
}

function parsePosition(position: string) {
    if (!active_game_view || !position) {
        return {
            i: -1,
            j: -1,
        };
    }
    const goban = active_game_view.goban;

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
    return { i: i, j: j };
}
function highlight_position(event: React.MouseEvent<HTMLSpanElement>) {
    if (!active_game_view) {
        return;
    }

    const pos = parsePosition((event.target as HTMLSpanElement).innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = true;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}
function unhighlight_position(event: React.MouseEvent<HTMLSpanElement>) {
    if (!active_game_view) {
        return;
    }

    const pos = parsePosition((event.target as HTMLSpanElement).innerText);
    if (pos.i >= 0) {
        active_game_view.goban.getMarks(pos.i, pos.j).chat_triangle = false;
        active_game_view.goban.drawSquare(pos.i, pos.j);
    }
}

interface AnalysisComment {
    type: "analysis";
    name?: string;
    branch_move?: number; // deprecated
    from?: number;
    moves?: string;
    marks?: { [mark: string]: string };
    pen_marks?: unknown[];
}
interface ReviewComment {
    type: "review";
    review_id: number;
}
export class GameChatLine extends React.Component<GameChatLineProperties> {
    constructor(props: GameChatLineProperties) {
        super(props);
    }

    markup(body: string | AnalysisComment | ReviewComment): JSX.Element | Array<JSX.Element> {
        if (typeof body === "string") {
            return chat_markup(body, [
                {
                    split: /(\b[a-zA-Z][0-9]{1,2}\b)/gm,
                    pattern: /\b([a-zA-Z][0-9]{1,2})\b/gm,
                    replacement: (m, idx) => {
                        const pos = m[1];
                        if (parsePosition(pos).i < 0) {
                            return <span key={idx}>{m[1]}</span>;
                        }
                        return (
                            <span
                                key={idx}
                                className="position"
                                onMouseEnter={highlight_position}
                                onMouseLeave={unhighlight_position}
                            >
                                {m[1]}
                            </span>
                        );
                    },
                },
            ]);
        } else {
            try {
                switch (body.type) {
                    case "analysis": {
                        if (!preferences.get("variations-in-chat-enabled")) {
                            return (
                                <span>
                                    {_("Variation") +
                                        ": " +
                                        (body.name ? profanity_filter(body.name) : "<error>")}
                                </span>
                            );
                        }

                        const gameview = this.props.gameview;
                        const goban = gameview.goban;
                        let orig_move: MoveTree = null;
                        let stashed_pen_marks = goban.pen_marks;
                        let orig_marks: unknown[] = null;

                        const v = parseInt(
                            "" + (body.name ? body.name.replace(/^[^0-9]*/, "") : 0),
                        );
                        if (v) {
                            this.props.gameview.last_variation_number = Math.max(
                                v,
                                this.props.gameview.last_variation_number,
                            );
                        }

                        const onLeave = () => {
                            if (this.props.gameview.in_pushed_analysis) {
                                this.props.gameview.in_pushed_analysis = false;
                                this.props.gameview.leave_pushed_analysis = null;
                                goban.engine.jumpTo(orig_move);
                                (orig_move as any).marks = orig_marks;
                                goban.pen_marks = stashed_pen_marks;
                                if (goban.pen_marks.length === 0) {
                                    goban.disablePen();
                                }
                                goban.redraw();
                            }
                        };

                        const onEnter = () => {
                            this.props.gameview.in_pushed_analysis = true;
                            this.props.gameview.leave_pushed_analysis = onLeave;
                            const turn =
                                "branch_move" in body
                                    ? body.branch_move - 1
                                    : body.from; /* branch_move exists in old games, and was +1 from our current counting */
                            const moves = body.moves;

                            orig_move = goban.engine.cur_move;
                            if (orig_move) {
                                orig_marks = (orig_move as any).marks;
                                orig_move.clearMarks();
                            } else {
                                orig_marks = null;
                            }
                            goban.engine.followPath(parseInt(turn as any), moves);

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

                        const onClick = () => {
                            onLeave();
                            goban.setMode("analyze");
                            onEnter();
                            this.props.gameview.in_pushed_analysis = false;
                            goban.updateTitleAndStonePlacement();
                            goban.syncReviewMove();
                            goban.redraw();
                        };

                        return (
                            <span
                                className="variation"
                                onMouseEnter={onEnter}
                                onMouseLeave={onLeave}
                                onClick={onClick}
                            >
                                {_("Variation") +
                                    ": " +
                                    (body.name ? profanity_filter(body.name) : "<error>")}
                            </span>
                        );
                    }
                    case "review":
                        return (
                            <Link to={`/review/${body.review_id}`}>
                                {interpolate(_("Review: ##{{id}}"), { id: body.review_id })}
                            </Link>
                        );
                    default:
                        return <span>[error loading chat line]</span>;
                }
            } catch (e) {
                console.log(e.stack);
                return <span>[error loading chat line]</span>;
            }
        }
    }

    shouldComponentUpdate(next_props: GameChatLineProperties, _next_state: {}) {
        return this.props.line.chat_id !== next_props.line.chat_id;
    }

    jumpToMove = () => {
        this.props.gameview.stopEstimatingScore();
        const line = this.props.line;
        const goban = this.props.gameview.goban;

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
    };

    render() {
        const line = this.props.line;
        const lastline = this.props.lastline;
        const ts = line.date ? new Date(line.date * 1000) : null;
        let third_person = "";
        if (typeof line.body === "string" && line.body.substr(0, 4) === "/me ") {
            third_person = line.body.substr(0, 4) === "/me " ? "third-person" : "";
            line.body = line.body.substr(4);
        }
        const msg = this.markup(line.body);
        let show_date: JSX.Element = null;
        let move_number: JSX.Element = null;

        if (!lastline || (line.date && lastline.date)) {
            if (line.date) {
                if (
                    !lastline ||
                    moment(new Date(line.date * 1000)).format("YYYY-MM-DD") !==
                        moment(new Date(lastline.date * 1000)).format("YYYY-MM-DD")
                ) {
                    show_date = (
                        <div className="date">
                            {moment(new Date(line.date * 1000)).format("LL")}
                        </div>
                    );
                }
            }
        }

        if (
            !lastline ||
            line.move_number !== lastline.move_number ||
            line.from !== lastline.from ||
            line.moves !== lastline.moves
        ) {
            move_number = (
                <LineText className="move-number" onClick={this.jumpToMove}>
                    Move{" "}
                    {"move_number" in line
                        ? line.move_number
                        : "moves" in line
                        ? line.from + (line.moves.length ? " + " + line.moves.length / 2 : "")
                        : ""}
                </LineText>
            );
        }

        let chat_id = this.props.gameview.review_id
            ? "r." + this.props.gameview.review_id
            : "g." + this.props.gameview.game_id;
        chat_id += "." + line.channel + "." + line.chat_id;

        return (
            <div className={`chat-line-container`} data-chat-id={chat_id}>
                {move_number}
                {show_date}
                <div
                    className={`chat-line ${line.channel} ${third_person} chat-user-${line.player_id}`}
                >
                    {ts && (
                        <span className="timestamp">
                            [
                            {ts.getHours() +
                                ":" +
                                (ts.getMinutes() < 10 ? "0" : "") +
                                ts.getMinutes()}
                            ]{" "}
                        </span>
                    )}
                    {(line.player_id || null) && <Player user={line} flare disableCacheUpdate />}
                    <span className="body">
                        {third_person ? " " : ": "}
                        {msg}
                    </span>
                </div>
            </div>
        );
    }
}
