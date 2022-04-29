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
import { Goban } from "goban";
import { ChatUserList, ChatUserCount } from "ChatUserList";
import { TabCompleteInput } from "TabCompleteInput";
import { chat_markup } from "components/Chat";
import { inGameModChannel } from "chat_manager";
import { MoveTree } from "goban";
import { game_control } from "./game_control";

export type ChatMode = "main" | "malkovich" | "moderator" | "hidden";
interface GameChatProperties {
    goban: Goban;
    userIsPlayer: boolean;
    selected_chat_log: ChatMode;
    onSelectedChatModeChange: (c: ChatMode) => void;
    channel: string;
    game_id?: number;
    review_id?: number;
}

interface ChatLine {
    chat_id: number;
    body: string | AnalysisComment | ReviewComment;
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
    game_id: number;
    review_id: number;
}

export function GameChat(props: GameChatProperties): JSX.Element {
    const user = data.get("user");
    const in_game_mod_channel = !props.review_id && inGameModChannel(props.game_id);

    const ref_chat_log = React.useRef<HTMLDivElement>(null);
    const scrolled_to_bottom = React.useRef(true);
    const [show_quick_chat, setShowQuickChat] = React.useState(false);
    const [selected_chat_log, setSelectedChatLog] = React.useState<ChatMode>(
        in_game_mod_channel ? "hidden" : "main",
    );
    const [show_player_list, setShowPlayerList] = React.useState(false);

    const chat_log_hash = React.useRef<{ [k: string]: boolean }>({});
    const chat_lines = React.useRef<ChatLine[]>([]);
    const [, refresh] = React.useState<number>();

    React.useEffect(() => {
        if (!props.goban) {
            return;
        }

        scrolled_to_bottom.current = true;
        chat_log_hash.current = {};
        let chat_update_debounce: ReturnType<typeof setTimeout> | null = null;
        const debouncedChatUpdate = () => {
            if (chat_update_debounce) {
                return;
            }
            chat_update_debounce = setTimeout(() => {
                chat_update_debounce = null;
                refresh(Math.random());
            }, 1);
        };

        const onChat = (line) => {
            if (!(line.chat_id in chat_log_hash.current)) {
                chat_log_hash.current[line.chat_id] = true;
                chat_lines.current.push(line);
                debouncedChatUpdate();
            }
        };

        const onChatRemove = (obj) => {
            for (const chat_id of obj.chat_ids) {
                for (let i = 0; i < chat_lines.current.length; ++i) {
                    if (chat_lines.current[i].chat_id === chat_id) {
                        chat_lines.current.splice(i, 1);
                        delete chat_log_hash.current[chat_id];
                        break;
                    } else {
                        console.log(chat_id, chat_lines.current[i]);
                    }
                }
            }
            debouncedChatUpdate();
        };

        const onChatReset = () => {
            chat_lines.current.length = 0;
            chat_log_hash.current = {};
            debouncedChatUpdate();
        };

        for (const line of props.goban.chat_log) {
            onChat(line);
        }

        props.goban.on("chat", onChat);
        props.goban.on("chat-remove", onChatRemove);
        props.goban.on("chat-reset", onChatReset);

        return () => {
            props.goban.off("chat", onChat);
            props.goban.off("chat-remove", onChatRemove);
            props.goban.off("chat-reset", onChatReset);
            chat_lines.current.length = 0;
            chat_log_hash.current = {};
        };
    }, [props.goban]);

    const channel = props.game_id ? `game-${props.game_id}` : `review-${props.review_id}`;

    React.useEffect(() => {
        const onAnonymousOverrideChange = () => {
            const in_game_mod_channel = inGameModChannel(props.game_id || props.review_id);
            if (in_game_mod_channel) {
                setSelectedChatLog("hidden");
            } else {
                setSelectedChatLog("main");
            }
        };

        data.watch(
            `moderator.join-game-publicly.${channel}`,
            onAnonymousOverrideChange,
            true,
            true,
        );
        return () => {
            data.unwatch(`moderator.join-game-publicly.${channel}`, onAnonymousOverrideChange);
        };
    }, []);

    const onKeyPress = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter") {
            const input = event.target as HTMLInputElement;
            if (input.className === "qc-option") {
                //saveEdit();
                console.warn("Quick chat editing not implemented");
                event.preventDefault();
            } else {
                props.goban.sendChat(input.value, selected_chat_log);
                input.value = "";
                return false;
            }
        }
    };

    const updateScrollPosition = () => {
        const chat_log = ref_chat_log.current;

        const tf = chat_log.scrollHeight - chat_log.scrollTop - 10 < chat_log.offsetHeight;
        if (tf !== scrolled_to_bottom.current) {
            scrolled_to_bottom.current = tf;
            chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        scrolled_to_bottom.current =
            chat_log.scrollHeight - chat_log.scrollTop - 10 < chat_log.offsetHeight;
    };

    const autoscroll = () => {
        const chat_log = ref_chat_log.current;

        if (scrolled_to_bottom.current) {
            chat_log.scrollTop = chat_log.scrollHeight;
            setTimeout(() => {
                if (chat_log) {
                    chat_log.scrollTop = chat_log.scrollHeight;
                }
            }, 100);
        }
    };

    const toggleChatLog = () => {
        const new_chat_log = selected_chat_log === "main" ? "malkovich" : "main";
        setSelectedChatLog(new_chat_log);
        setShowQuickChat(false);
        props.onSelectedChatModeChange(new_chat_log);
    };

    const toggleModeratorChatLog = () => {
        const new_chat_log =
            selected_chat_log === "main"
                ? "moderator"
                : selected_chat_log === "hidden"
                ? "main"
                : "hidden";
        setSelectedChatLog(new_chat_log);
        setShowQuickChat(false);
        props.onSelectedChatModeChange(new_chat_log);
    };

    const togglePlayerList = () => {
        setShowPlayerList(!show_player_list);
    };

    requestAnimationFrame(autoscroll);

    let last_line: ChatLine = null;
    return (
        <div className="GameChat">
            <div className={"log-player-container" + (show_player_list ? " show-player-list" : "")}>
                <div className="chat-log-container">
                    <div
                        ref={ref_chat_log}
                        className="chat-log autoscrolling"
                        onScroll={updateScrollPosition}
                    >
                        {chat_lines.current.map((line: ChatLine) => {
                            const ll = last_line;
                            last_line = line;
                            return (
                                <GameChatLine
                                    key={line.chat_id}
                                    line={line}
                                    lastline={ll}
                                    game_id={props.game_id}
                                    review_id={props.review_id}
                                />
                            );
                        })}
                    </div>
                </div>
                {(show_player_list || null) && <ChatUserList channel={channel} />}
            </div>
            {(show_quick_chat || null) && (
                <QuickChat
                    goban={props.goban}
                    selected_chat_log={selected_chat_log}
                    onSend={() => setShowQuickChat(false)}
                />
            )}
            <div className="chat-input-container input-group">
                {((props.userIsPlayer && data.get("user").email_validated) || null) && (
                    <button
                        className={`chat-input-chat-log-toggle sm ${selected_chat_log}`}
                        onClick={toggleChatLog}
                    >
                        {selected_chat_log === "malkovich"
                            ? _("Malkovich")
                            : selected_chat_log === "hidden"
                            ? _("Hidden")
                            : _("Chat")}{" "}
                        <i
                            className={
                                "fa " +
                                (selected_chat_log === "main" ? "fa-caret-down" : "fa-caret-up")
                            }
                        />
                    </button>
                )}
                {((!props.userIsPlayer && data.get("user").is_moderator) || null) && (
                    <button
                        className={`chat-input-chat-log-toggle sm ${selected_chat_log}`}
                        onClick={toggleModeratorChatLog}
                    >
                        {selected_chat_log === "moderator"
                            ? _("Moderator")
                            : selected_chat_log === "hidden"
                            ? _("Hidden")
                            : _("Chat")}{" "}
                        <i
                            className={
                                "fa " +
                                (selected_chat_log === "main" ? "fa-caret-down" : "fa-caret-up")
                            }
                        />
                    </button>
                )}
                <TabCompleteInput
                    ref={() => 0}
                    className={`chat-input  ${selected_chat_log}`}
                    disabled={user.anonymous || !data.get("user").email_validated}
                    placeholder={
                        user.anonymous
                            ? _("Sign in to chat")
                            : !data.get("user").email_validated
                            ? _("Chat will be enabled once your email address has been validated")
                            : selected_chat_log === "malkovich"
                            ? pgettext(
                                  "Malkovich logs are only visible after the game has ended",
                                  "Visible after the game",
                              )
                            : selected_chat_log === "moderator"
                            ? "Message players as a moderator"
                            : selected_chat_log === "hidden"
                            ? "Visible only to moderators"
                            : pgettext(
                                  "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                                  interpolate("Message {{who}}", { who: "..." }),
                              )
                    }
                    onKeyPress={onKeyPress}
                    onFocus={() => setShowQuickChat(false)}
                />
                {props.userIsPlayer &&
                user.email_validated &&
                props.game_id &&
                selected_chat_log === "main" ? (
                    <i
                        className={
                            "qc-toggle fa " + (show_quick_chat ? "fa-caret-down" : "fa-caret-up")
                        }
                        onClick={() => setShowQuickChat(!show_quick_chat)}
                    />
                ) : null}
                <ChatUserCount
                    onClick={togglePlayerList}
                    active={show_player_list}
                    channel={channel}
                />
            </div>
        </div>
    );
}

interface QuickChatProperties {
    selected_chat_log: ChatMode;
    goban: Goban;
    onSend: () => void;
}

export function QuickChat(props: QuickChatProperties): JSX.Element {
    const [editing, setEditing] = React.useState<boolean>(false);
    const lc_phrases = localStorage.getItem("ogs.qc.messages");
    const phrases = React.useRef<string[]>(
        data.get(
            "quick-chat.phrases",
            (lc_phrases ? JSON.parse(lc_phrases) : null) || [
                _("Hi") + ".",
                _("Have fun") + ".",
                _("Sorry - misclick") + ".",
                _("Good game") + ".",
                _("Thanks for the game") + ".",
            ],
        ),
    );

    const editable_messages = React.useRef<HTMLLIElement[]>(null);

    const saveEdit = () => {
        editable_messages.current.map((li, index) => {
            phrases.current[index] = li.innerText.trim();
        });
        data.set("quick-chat.phrases", phrases.current);
        finishEdit();
    };

    const finishEdit = () => {
        editable_messages.current = null;
        setEditing(false);
    };

    const sendQuickChat = (msg: string) => {
        props.goban.sendChat(msg, props.selected_chat_log);
        props.onSend();
    };

    const onKeyPress = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter") {
            const input = event.target as HTMLInputElement;
            if (input.className === "qc-option") {
                saveEdit();
                event.preventDefault();
            }
        }
    };

    const lis = phrases.current.map((msg, index) => (
        <li
            className="qc-option"
            key={index}
            contentEditable={editing}
            onKeyPress={onKeyPress}
            ref={
                editing
                    ? (input) => {
                          editable_messages.current = index === 0 ? [] : editable_messages.current;
                          editable_messages.current.push(input);
                      }
                    : null
            }
        >
            {editing ? (
                msg
            ) : (
                <a
                    onClick={() => {
                        sendQuickChat(msg);
                    }}
                >
                    {msg}
                </a>
            )}
        </li>
    ));

    return (
        <div className="qc-option-list-container">
            {editing ? (
                <span className="qc-edit">
                    <button
                        onClick={() => {
                            saveEdit();
                        }}
                        className="xs edit-button"
                    >
                        <i className={"fa fa-save"} /> {_("Save")}
                    </button>
                    <button onClick={finishEdit} className="xs edit-button">
                        <i className={"fa fa-times-circle"} /> {_("Cancel")}
                    </button>
                </span>
            ) : (
                <span className="qc-edit">
                    <button onClick={() => setEditing(true)} className="xs edit-button">
                        <i className={"fa fa-pencil"} /> {_("Edit")}
                    </button>
                </span>
            )}
            <ul>{lis}</ul>
        </div>
    );
}

export function GameChatLine(props: GameChatLineProperties): JSX.Element {
    const line = props.line;
    const lastline = props.lastline;
    const ts = line.date ? new Date(line.date * 1000) : null;
    let third_person = "";
    if (typeof line.body === "string" && line.body.substr(0, 4) === "/me ") {
        third_person = line.body.substr(0, 4) === "/me " ? "third-person" : "";
        line.body = line.body.substr(4);
    }
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
                    <div className="date">{moment(new Date(line.date * 1000)).format("LL")}</div>
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
        const jumpToMove = () => {
            game_control.emit("stopEstimatingScore");
            const line = props.line;
            const goban = game_control.goban;

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

        move_number = (
            <LineText className="move-number" onClick={jumpToMove}>
                Move{" "}
                {"move_number" in line
                    ? line.move_number
                    : "moves" in line
                    ? line.from + (line.moves.length ? " + " + line.moves.length / 2 : "")
                    : ""}
            </LineText>
        );
    }

    let chat_id = props.review_id ? "r." + props.review_id : "g." + props.game_id;
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
                        [{ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}
                        ]{" "}
                    </span>
                )}
                {(line.player_id || null) && <Player user={line} flare disableCacheUpdate />}
                <span className="body">
                    {third_person ? " " : ": "}
                    <MarkupChatLine line={line} />
                </span>
            </div>
        </div>
    );
}

function parsePosition(position: string) {
    if (!game_control.goban || !position) {
        return {
            i: -1,
            j: -1,
        };
    }
    const goban = game_control.goban;

    let i = "abcdefghjklmnopqrstuvwxyz".indexOf(position[0].toLowerCase());
    let j = ((goban && goban.height) || 19) - parseInt(position.substring(1));
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
    if (!game_control.goban) {
        return;
    }

    const pos = parsePosition((event.target as HTMLSpanElement).innerText);
    if (pos.i >= 0) {
        game_control.goban.getMarks(pos.i, pos.j).chat_triangle = true;
        game_control.goban.drawSquare(pos.i, pos.j);
    }
}
function unhighlight_position(event: React.MouseEvent<HTMLSpanElement>) {
    if (!game_control.goban) {
        return;
    }

    const pos = parsePosition((event.target as HTMLSpanElement).innerText);
    if (pos.i >= 0) {
        game_control.goban.getMarks(pos.i, pos.j).chat_triangle = false;
        game_control.goban.drawSquare(pos.i, pos.j);
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

let orig_move: MoveTree = null;
let stashed_pen_marks = null; //goban.pen_marks;
let orig_marks: unknown[] = null;

function MarkupChatLine({ line }: { line: ChatLine }): JSX.Element {
    const body = line.body;

    if (typeof body === "string") {
        return (
            <React.Fragment>
                {chat_markup(body, [
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
                ])}
            </React.Fragment>
        );
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

                    const v = parseInt("" + (body.name ? body.name.replace(/^[^0-9]*/, "") : 0));
                    if (v) {
                        game_control.last_variation_number = Math.max(
                            v,
                            game_control.last_variation_number,
                        );
                    }

                    const onLeave = () => {
                        const goban = game_control.goban;
                        if (game_control.in_pushed_analysis) {
                            game_control.in_pushed_analysis = false;
                            delete game_control.onPushAnalysisLeft;
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
                        const goban = game_control.goban;
                        game_control.in_pushed_analysis = true;
                        game_control.onPushAnalysisLeft = onLeave;

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
                        const goban = game_control.goban;
                        onLeave();
                        goban.setMode("analyze");
                        onEnter();
                        game_control.in_pushed_analysis = false;
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
