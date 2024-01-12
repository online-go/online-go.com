/*
 * Copyright (C)  Online-Go.com
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
import { _, pgettext, interpolate, current_language } from "translate";
import { Player } from "Player";
import { profanity_filter } from "profanity_filter";
import { Goban, GobanCore, protocol } from "goban";
import { ChatUserList, ChatUserCount } from "ChatUserList";
import { TabCompleteInput } from "TabCompleteInput";
import { chat_markup } from "components/Chat";
import { inGameModChannel } from "chat_manager";
import { MoveTree } from "goban";
import { game_control } from "./game_control";
import { useUserIsParticipant } from "./GameHooks";
import { useGoban } from "./goban_context";

export type ChatMode = "main" | "malkovich" | "moderator" | "hidden" | "personal";
interface GameChatProperties {
    selected_chat_log: ChatMode;
    onSelectedChatModeChange: (c: ChatMode) => void;
    channel: string;
    game_id?: number;
    review_id?: number;
}

interface ChatLine {
    chat_id: string;
    body:
        | string
        | protocol.GameChatAnalysisMessage
        | protocol.GameChatReviewMessage
        | protocol.GameChatTranslatedMessage;
    date: number;
    move_number: number;
    from?: number;
    moves?: string;
    channel: string;
    player_id: number;
    username?: string;
}

interface GameChatLineProperties {
    line: ChatLine;
    last_line: ChatLine;
    game_id?: number;
    review_id?: number;
}

export function GameChat(props: GameChatProperties): JSX.Element {
    const user = data.get("user");
    const goban = useGoban();
    const defaultChatMode = preferences.get("chat-mode") as ChatMode;
    const ref_chat_log = React.useRef<HTMLDivElement>(null);
    const scrolled_to_bottom = React.useRef(true);
    const [show_quick_chat, setShowQuickChat] = React.useState(false);
    const { selected_chat_log, onSelectedChatModeChange } = props;
    const [show_player_list, setShowPlayerList] = React.useState(false);

    const chat_log_hash = React.useRef<{ [k: string]: boolean }>({});
    const chat_lines = React.useRef<ChatLine[]>([]);
    const [, refresh] = React.useState<number>();
    const userIsPlayer = useUserIsParticipant(goban);

    React.useEffect(() => {
        if (!goban) {
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

        const onChat = (line: protocol.GameChatLine) => {
            if (!(line.chat_id in chat_log_hash.current)) {
                chat_log_hash.current[line.chat_id] = true;
                chat_lines.current.push(line);
                debouncedChatUpdate();
            }
        };

        const onChatRemove = (obj: { chat_ids: string[] }) => {
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

        for (const line of goban.chat_log) {
            onChat(line);
        }

        goban.on("chat", onChat);
        goban.on("chat-remove", onChatRemove);
        goban.on("chat-reset", onChatReset);

        return () => {
            goban.off("chat", onChat);
            goban.off("chat-remove", onChatRemove);
            goban.off("chat-reset", onChatReset);
            chat_lines.current.length = 0;
            chat_log_hash.current = {};
        };
    }, [goban]);

    const channel = props.game_id ? `game-${props.game_id}` : `review-${props.review_id}`;

    React.useEffect(() => {
        const onAnonymousOverrideChange = () => {
            const in_game_mod_channel = inGameModChannel(
                (props.game_id || props.review_id) as number,
            );
            if (in_game_mod_channel) {
                onSelectedChatModeChange("hidden");
            } else {
                onSelectedChatModeChange(defaultChatMode);
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

    const onKeyPress = (event: React.KeyboardEvent<HTMLElement>): boolean | void => {
        if (event.key === "Enter") {
            const input = event.target as HTMLInputElement;
            if (input.className === "qc-option") {
                //saveEdit();
                console.warn("Quick chat editing not implemented");
                event.preventDefault();
            } else {
                goban.sendChat(input.value, selected_chat_log);
                input.value = "";
                return false;
            }
        }
    };

    const updateScrollPosition = () => {
        const chat_log = ref_chat_log.current;
        if (!chat_log) {
            return;
        }

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

        if (chat_log && scrolled_to_bottom.current) {
            chat_log.scrollTop = chat_log.scrollHeight;
            setTimeout(() => {
                if (chat_log) {
                    chat_log.scrollTop = chat_log.scrollHeight;
                }
            }, 100);
        }
    };

    const toggleChatLog = (isModerator: boolean) => {
        const new_chat_log = nextChatMode(selected_chat_log, isModerator);
        onSelectedChatModeChange(new_chat_log);
        setShowQuickChat(false);
        props.onSelectedChatModeChange(new_chat_log);
    };

    const togglePlayerList = () => {
        setShowPlayerList(!show_player_list);
    };

    requestAnimationFrame(autoscroll);

    let last_line: ChatLine;
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
                                    last_line={ll}
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
                    goban={goban}
                    selected_chat_log={selected_chat_log}
                    onSend={() => setShowQuickChat(false)}
                />
            )}
            <div className="chat-input-container input-group">
                {((userIsPlayer && data.get("user").email_validated) || null) && (
                    <ChatLogToggleButton
                        selected_chat_log={selected_chat_log}
                        toggleChatLog={toggleChatLog}
                        isUserModerator={false}
                    />
                )}
                {((!userIsPlayer && data.get("user").is_moderator) || null) && (
                    <ChatLogToggleButton
                        selected_chat_log={selected_chat_log}
                        toggleChatLog={toggleChatLog}
                        isUserModerator={true}
                    />
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
                                : selected_chat_log === "personal"
                                  ? _("Visible only to you")
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
                {userIsPlayer &&
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

    const editable_messages = React.useRef<HTMLLIElement[] | null>(null);

    const saveEdit = () => {
        editable_messages.current?.map((li, index) => {
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
                          if (input) {
                              editable_messages.current!.push(input);
                          }
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
    const last_line = props.last_line;
    const ts = line.date ? new Date(line.date * 1000) : null;
    let third_person = "";
    if (typeof line.body === "string" && line.body.substr(0, 4) === "/me ") {
        third_person = line.body.substr(0, 4) === "/me " ? "third-person" : "";
        line.body = line.body.substr(4);
    }
    let show_date: JSX.Element | null = null;
    let move_number: JSX.Element | null = null;
    const goban = useGoban();

    if (!last_line || (line.date && last_line.date)) {
        if (line.date) {
            if (
                !last_line ||
                moment(new Date(line.date * 1000)).format("YYYY-MM-DD") !==
                    moment(new Date(last_line.date * 1000)).format("YYYY-MM-DD")
            ) {
                show_date = (
                    <div className="date">{moment(new Date(line.date * 1000)).format("LL")}</div>
                );
            }
        }
    }

    if (
        !last_line ||
        line.move_number !== last_line.move_number ||
        line.from !== last_line.from ||
        line.moves !== last_line.moves
    ) {
        const jumpToMove = () => {
            game_control.emit("stopEstimatingScore");
            const line = props.line;

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

            if ((line.from ?? -1) >= 0 && line.moves) {
                if (goban.isAnalysisDisabled()) {
                    goban.setMode("analyze");
                }

                goban.engine.followPath(line.from as number, line.moves);
                goban.syncReviewMove();
                goban.drawPenMarks(goban.engine.cur_move.pen_marks);
                goban.redraw();
                //last_move_number[type] = line.from;
                //last_moves[type] = line.moves;
            }
        };

        // It's unclear to me if we still need this "move_number" in (line as any) check,
        // our typing says that field should always exist so the second case isn't necessary,
        // but I'm not sure why we had it to begin with then, so I'm leaving it in place
        // for the time being. - anoek 2023-01-02
        move_number = (
            <LineText className="move-number" onClick={jumpToMove}>
                Move{" "}
                {"move_number" in (line as any)
                    ? line.move_number
                    : "moves" in line
                      ? line.from + (line.moves?.length ? " + " + line.moves.length / 2 : "")
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

function parsePosition(position: string, goban: GobanCore) {
    if (!goban || !position) {
        return {
            i: -1,
            j: -1,
        };
    }

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

let orig_move: MoveTree | null = null;
let stashed_pen_marks: any = null; //goban.pen_marks;
let orig_marks: unknown[] | null = null;

function MarkupChatLine({ line }: { line: ChatLine }): JSX.Element {
    const body = line.body;
    const goban = useGoban();

    const highlight_position = (event: React.MouseEvent<HTMLSpanElement>) => {
        const pos = parsePosition((event.target as HTMLSpanElement).innerText, goban);
        if (pos.i >= 0) {
            goban.getMarks(pos.i, pos.j).chat_triangle = true;
            goban.drawSquare(pos.i, pos.j);
        }
    };
    function unhighlight_position(event: React.MouseEvent<HTMLSpanElement>) {
        const pos = parsePosition((event.target as HTMLSpanElement).innerText, goban);
        if (pos.i >= 0) {
            goban.getMarks(pos.i, pos.j).chat_triangle = false;
            goban.drawSquare(pos.i, pos.j);
        }
    }

    if (typeof body === "string") {
        return (
            <React.Fragment>
                {chat_markup(body, [
                    {
                        split: /(\b[a-zA-Z][0-9]{1,2}\b)/gm,
                        pattern: /\b([a-zA-Z][0-9]{1,2})\b/gm,
                        replacement: (m, idx) => {
                            const pos = m[1];
                            if (parsePosition(pos, goban).i < 0) {
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
                case "translated":
                    return <span>{getTranslatedMessageText(body)}</span>;

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
                        if (game_control.in_pushed_analysis) {
                            game_control.in_pushed_analysis = false;
                            delete game_control.onPushAnalysisLeft;
                            goban.engine.jumpTo(orig_move);
                            (orig_move as any).marks = orig_marks;
                            goban.pen_marks = stashed_pen_marks as any;
                            if (goban.pen_marks.length === 0) {
                                goban.disablePen();
                            }
                            goban.redraw();
                        }
                    };

                    const onEnter = () => {
                        game_control.in_pushed_analysis = true;
                        game_control.onPushAnalysisLeft = onLeave;

                        const turn =
                            "branch_move" in body
                                ? (body.branch_move ?? -1) - 1
                                : body.from; /* branch_move exists in old games, and was +1 from our current counting */
                        const moves = body.moves;

                        orig_move = goban.engine.cur_move;
                        if (orig_move) {
                            orig_marks = (orig_move as any).marks;
                            orig_move.clearMarks();
                        } else {
                            orig_marks = null;
                        }
                        if (moves || moves === "") {
                            goban.engine.followPath(parseInt(turn as any), moves);
                        }

                        if (body.marks) {
                            goban.setMarks(body.marks);
                        }
                        stashed_pen_marks = goban.pen_marks;
                        if (body.pen_marks) {
                            goban.pen_marks = ([] as any[]).concat(body.pen_marks);
                        } else {
                            goban.pen_marks = [];
                        }

                        goban.redraw();
                    };

                    const onClick = () => {
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

// Returns next chat mode if user clicks on chat-input-chat-log-toggle button.
function nextChatMode(current: ChatMode, isModerator: boolean): ChatMode {
    if (!isModerator) {
        switch (current) {
            case "main":
                return "malkovich";
            case "malkovich":
                return "personal";
            default:
                return "main";
        }
    }
    switch (current) {
        case "main":
            return "moderator";
        case "hidden":
            return "main";
        default:
            return "hidden";
    }
}

// Returns text that appears in chat-input-chat-log-toggle button.
function chatModeTranslation(chatMode: ChatMode, isModerator: boolean): string {
    if (!isModerator) {
        switch (chatMode) {
            case "malkovich":
                return _("Malkovich");
            case "hidden":
                return _("Hidden");
            case "personal":
                return _("Personal");
            default:
                return _("Chat");
        }
    }
    switch (chatMode) {
        case "moderator":
            return _("Moderator");
        case "hidden":
            return _("Hidden");
        default:
            return _("Chat");
    }
}

interface ChatLogToggleButtonProperties {
    selected_chat_log: ChatMode;
    toggleChatLog: (isModerator: boolean) => void;
    isUserModerator: boolean; // NOTE Should be false if moderator is playing
}

function ChatLogToggleButton(props: ChatLogToggleButtonProperties): JSX.Element {
    const { selected_chat_log, toggleChatLog, isUserModerator } = props;
    return (
        <button
            className={`chat-input-chat-log-toggle sm ${selected_chat_log}`}
            onClick={() => toggleChatLog(isUserModerator)}
        >
            {chatModeTranslation(selected_chat_log, isUserModerator)}{" "}
            <i
                className={"fa " + (selected_chat_log === "main" ? "fa-caret-down" : "fa-caret-up")}
            />
        </button>
    );
}

function getTranslatedMessageText(msg: protocol.GameChatTranslatedMessage): string {
    if (current_language in msg) {
        return msg[current_language];
    }

    if ("en" in msg) {
        return msg.en;
    }

    for (const key in msg as any) {
        if (key !== "type") {
            return `${msg[key]}`;
        }
    }

    return "<error: translated chat body is missing>";
}
