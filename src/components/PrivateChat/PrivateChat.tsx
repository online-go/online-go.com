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

import * as React from "react";
import { socket } from "@/lib/sockets";
import { challenge } from "@/components/ChallengeModal";
import { createModeratorNote } from "@/components/ModNoteModal";
import { _, pgettext, interpolate } from "@/lib/translate";
import * as data from "@/lib/data";
import { unicodeFilter, splitOnBytes } from "@/lib/misc";
import { profanity_filter } from "@/lib/profanity_filter";
import { player_is_ignored } from "@/components/BlockPlayer";
import { emitNotification } from "@/components/Notifications/NotificationManager";
import { PlayerCacheEntry } from "@/lib/player_cache";
import * as player_cache from "@/lib/player_cache";
import online_status from "@/lib/online_status";
import { openReport } from "@/components/Report";
import { alert } from "@/lib/swal_config";
import ITC from "@/lib/ITC";
import { TabCompleteInput } from "@/components/TabCompleteInput";

let last_id = 0;

const private_chats: PrivateChat[] = [];
const instances: { [k: string]: PrivateChat } = {};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
};

interface PrivateChatProps {
    user_id: number;
    username: string;
}

interface PrivateChatState {
    isOpen: boolean;
    isMinimized: boolean;
    isFloating: boolean;
    isSuperchatEnabled: boolean;
    isHighlighted: boolean;
    lines: JSX.Element[];
    playerStatus: "online" | "offline" | "unknown";
    player: PlayerCacheEntry;
}

export function getPrivateChat(user_id: number, username?: string): PrivateChat {
    const key = `${user_id}`;
    if (instances[key]) {
        return instances[key];
    }
    const chat = new PrivateChat({ user_id, username: username || "<unknown>" });
    instances[key] = chat;
    return chat;
}

export class PrivateChat extends React.Component<PrivateChatProps, PrivateChatState> {
    private id: number;
    private chatRef = React.createRef<HTMLDivElement>();
    private bodyRef = React.createRef<HTMLDivElement>();
    private inputRef = React.createRef<HTMLInputElement>();
    private bannerRef = React.createRef<HTMLDivElement>();
    private chat_base = Math.floor(Math.random() * 100000).toString(36);
    private chat_num = 0;
    private received_messages: { [k: string]: boolean } = {};
    private last_date: string = new Date(Date.now() - 864e5).toLocaleDateString(
        undefined,
        DATE_FORMAT,
    );
    private last_uid: string = "";

    constructor(props: PrivateChatProps) {
        super(props);
        this.id = ++last_id;

        this.state = {
            isOpen: false,
            isMinimized: false,
            isFloating: false,
            isSuperchatEnabled: false,
            isHighlighted: false,
            lines: [],
            playerStatus: "unknown",
            player: {
                id: props.user_id,
                username: props.username || "...",
                ui_class: "",
            },
        };

        socket.send("chat/pm/load", { player_id: props.user_id });

        if (props.user_id) {
            online_status.subscribe(props.user_id, (_, isOnline) => {
                this.setState({ playerStatus: isOnline ? "online" : "offline" });
            });
        }

        if (props.user_id) {
            player_cache
                .fetch(props.user_id, ["username", "ui_class"])
                .then((player) => {
                    this.setState({ player });
                    if (player.ui_class?.match(/moderator/)) {
                        if (!data.get("user").is_moderator) {
                            this.open();
                        }
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    componentDidMount() {
        socket.on("private-message", this.handlePrivateMessage);
        socket.on("private-superchat", this.handleSuperchat);
    }

    componentWillUnmount() {
        socket.off("private-message", this.handlePrivateMessage);
        socket.off("private-superchat", this.handleSuperchat);
    }

    private handlePrivateMessage = (line: any) => {
        if (!this.props.user_id) {
            // system message
            this.open();
            const systemLine = (
                <div key={this.chat_num++} className="chat-line system">
                    {line.message.message}
                </div>
            );
            this.setState((state) => ({ lines: [...state.lines, systemLine] }));
            return;
        }

        if (line.message.i) {
            const msgKey = `${line.message.i} ${line.message.t} ${line.from.username}`;
            if (this.received_messages[msgKey]) {
                return;
            }
            this.received_messages[msgKey] = true;
            this.last_uid = line.message.i + " " + line.message.t;
        }

        const { user_id, username, message, type } = line;
        if (player_is_ignored(user_id)) {
            return;
        }

        if (!this.state.isOpen && !this.state.isMinimized && !player_is_ignored(line.from.id)) {
            emitNotification(username, message, () => {
                this.open();
            });
        }

        const lines: JSX.Element[] = [];
        const timestamp = line.message.t ? new Date(line.message.t * 1000) : new Date();
        const dateStr = timestamp.toLocaleDateString(undefined, DATE_FORMAT);

        if (dateStr !== this.last_date) {
            this.last_date = dateStr;
            lines.push(
                <div key={`date-${this.chat_num++}`} className="date">
                    {dateStr}
                </div>,
            );
        }

        const chatLine = (
            <div key={this.chat_num++} className={`chat-line chat-user-${user_id}`}>
                {line.message.t && (
                    <span className="timestamp">
                        [{timestamp.getHours()}:{timestamp.getMinutes() < 10 ? "0" : ""}
                        {timestamp.getMinutes()}]
                    </span>
                )}
                <span className="username">{username}</span>
                {type === "system" || message.startsWith("/me ") ? " ** " : ": "}
                <span
                    dangerouslySetInnerHTML={{
                        __html: this.chat_markup(
                            message.startsWith("/me ") ? message.slice(4) : message,
                        ),
                    }}
                />
            </div>
        );
        lines.push(chatLine);
        this.setState(
            (state) => ({ lines: [...state.lines, ...lines] }),
            () => {
                if (this.bodyRef.current) {
                    const body = this.bodyRef.current;
                    let scroll = false;
                    const cur = body.scrollTop;
                    body.scrollTop = body.scrollHeight;
                    if (body.scrollTop === cur) {
                        scroll = true;
                    }
                    if (scroll) {
                        body.scrollTop = body.scrollHeight;
                    }
                }
            },
        );
    };

    private handleSuperchat = (config: any) => {
        this.setState({ isSuperchatEnabled: config.enable });
    };

    private handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!this.inputRef.current) {
            return;
        }

        if (
            !data.get("user").email_validated &&
            (this.state.player.ui_class?.indexOf("moderator") || 0) < 0 &&
            this.state.lines.length === 0
        ) {
            return;
        }

        if (e.key === "Enter") {
            const value = this.inputRef.current.value.trim();
            if (value === "") {
                return;
            }
            this.sendChat(value);
            this.inputRef.current.value = "";
        }
    };

    public sendChat = (text: string, isSystem?: boolean) => {
        if (data.get("appeals.banned_user_id")) {
            void alert.fire(_("Your account is suspended - you cannot send messages."));
            return;
        }

        const lines = splitOnBytes(text, 500);
        for (const line of lines) {
            const chatLine = (
                <div key={this.chat_num} className={`chat-line chat-user-${this.props.user_id}`}>
                    <span className="username">{data.get("user").username}</span>
                    {": "}
                    <span dangerouslySetInnerHTML={{ __html: this.chat_markup(line) }} />
                </div>
            );
            this.setState((state) => ({ lines: [...state.lines, chatLine] }));

            socket.send("chat/pm", {
                player_id: this.props.user_id,
                username: this.state.player.username || "",
                message: line,
                uid: `${this.chat_base}-${this.chat_num++}`,
                as_system: isSystem ? true : undefined,
            });
        }
    };

    private startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!this.chatRef.current) {
            return;
        }

        const target = e.target as HTMLElement;
        if (!target.classList.contains("title") && !target.classList.contains("user")) {
            return;
        }

        const chatElement = this.chatRef.current;
        const offset = chatElement.getBoundingClientRect();
        let ox = offset.left;
        let oy = offset.top;
        const sx = e.clientX;
        const sy = e.clientY;
        let lx = sx;
        let ly = sy;
        let moving = false;

        const move = (e: MouseEvent) => {
            const cx = e.clientX;
            const cy = e.clientY;
            if (moving || Math.abs(cx - lx) + Math.abs(cy - ly) > 5) {
                moving = true;
                if (!this.state.isFloating) {
                    this.setState({ isFloating: true });
                }
                ox += cx - lx;
                oy += cy - ly;
                lx = cx;
                ly = cy;

                chatElement.style.right = "auto";
                chatElement.style.bottom = "auto";
                chatElement.style.left = `${Math.round(ox)}px`;
                chatElement.style.top = `${Math.round(oy)}px`;

                if (this.bodyRef.current) {
                    this.bodyRef.current.scrollTop = this.bodyRef.current.scrollHeight;
                }
            }
        };

        const release = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", release);
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", release);
    };

    public open = () => {
        if (this.state.isOpen) {
            return;
        }
        this.setState({ isOpen: true, isMinimized: false });
        private_chats.push(this);
        this.updateLayout();
        data.set(`pm.read-${this.props.user_id}`, this.last_uid);
        ITC.send("private-chat-open", {
            user_id: this.props.user_id,
            username: this.state.player.username,
        });
    };

    private minimize = (sendItc?: boolean) => {
        if (this.state.isSuperchatEnabled) {
            return;
        }
        if (this.state.isMinimized) {
            return;
        }
        this.setState({ isMinimized: true, isOpen: false });
        private_chats.push(this);
        this.updateLayout();
        if (sendItc) {
            ITC.send("private-chat-minimize", {
                user_id: this.props.user_id,
                username: this.state.player.username,
            });
        }
    };

    private close = (sendItc: boolean) => {
        this.setState({ isOpen: false, isMinimized: false });
        const idx = private_chats.findIndex((chat) => chat.id === this.id);
        if (idx !== -1) {
            private_chats.splice(idx, 1);
        }
        this.updateLayout();
        if (sendItc) {
            ITC.send("private-chat-close", {
                user_id: this.props.user_id,
                username: this.state.player.username,
            });
            data.set(`pm.close-${this.props.user_id}`, this.last_uid);
        }
    };

    private toggleSuperchat = () => {
        const newState = !this.state.isSuperchatEnabled;
        this.setState({ isSuperchatEnabled: newState });
        socket.send("chat/pm/superchat", {
            player_id: this.props.user_id,
            username: this.state.player.username || "",
            enable: newState,
        });
    };

    private createModNote = () => {
        createModeratorNote(this.props.user_id, "");
    };

    private report = () => {
        openReport({
            reported_user_id: this.props.user_id,
        });
    };

    private raiseToTop = () => {
        if (this.chatRef.current) {
            document.body.appendChild(this.chatRef.current);
            if (this.bodyRef.current) {
                this.bodyRef.current.scrollTop = this.bodyRef.current.scrollHeight;
            }
        }
    };

    private updateLayout = () => {
        if (this.state.isFloating) {
            return;
        }

        const docked = private_chats.filter((chat) => !chat.state.isFloating);
        const windowWidth = window.innerWidth;
        const maxWidth = Math.min(500, windowWidth - 50);
        let pos = 50;

        docked.forEach((chat) => {
            if (chat.chatRef.current) {
                chat.chatRef.current.style.right = `${pos}px`;
                chat.chatRef.current.style.maxWidth = `${maxWidth}px`;
                pos += chat.chatRef.current.offsetWidth + 3;
            }
        });
    };

    render() {
        const {
            isOpen,
            isMinimized,
            isFloating,
            isSuperchatEnabled,
            isHighlighted,
            player,
            playerStatus,
        } = this.state;

        if (!isOpen && !isMinimized) {
            return null;
        }

        const playerClass = `user Player nolink ${playerStatus} ${player.ui_class || ""}`;
        const windowClass = `private-chat-window ${isOpen ? "open" : ""} ${
            isMinimized ? "minimized" : ""
        } ${isFloating ? "floating" : ""} ${isSuperchatEnabled ? "superchat" : ""} ${
            isHighlighted ? "highlighted" : ""
        } ${!this.props.user_id ? "system" : ""}`;

        return (
            <div ref={this.chatRef} className={windowClass}>
                <div className="paper-shadow top z2" />
                <div className="paper-shadow bottom z2" />

                <div className="title" onMouseDown={this.startDrag}>
                    <span className={playerClass}>{unicodeFilter(player.username || "")}</span>
                    {data.get("user").is_moderator && (
                        <>
                            <i
                                className={`fa fa-bullhorn ${isSuperchatEnabled ? "enabled" : ""}`}
                                onClick={this.toggleSuperchat}
                            />
                            <i className="fa fa-clipboard" onClick={this.createModNote} />
                        </>
                    )}
                    {!data.get("user").is_moderator && this.props.user_id && (
                        <>
                            <i className="fa fa-exclamation-triangle" onClick={this.report} />
                            <i
                                className="ogs-goban"
                                onClick={() => challenge(this.props.user_id)}
                            />
                        </>
                    )}
                    {this.props.user_id && (
                        <i
                            className="fa fa-info-circle"
                            onClick={() =>
                                window.open(
                                    `/user/view/${this.props.user_id}/${encodeURIComponent(
                                        player.username || "",
                                    )}`,
                                    "_blank",
                                )
                            }
                        />
                    )}
                    <i className="fa fa-minus" onClick={() => this.minimize(true)} />
                    <i className="fa fa-times" onClick={() => this.close(true)} />
                </div>

                {this.renderBanner()}

                <div ref={this.bodyRef} className="body" onMouseDown={this.raiseToTop}>
                    {this.state.lines}
                </div>

                <TabCompleteInput
                    ref={this.inputRef}
                    disabled={!this.canChat()}
                    placeholder={this.getInputPlaceholder()}
                    onKeyPress={this.handleKeyPress}
                    autoFocus
                />
            </div>
        );
    }

    private canChat = () => {
        return (
            data.get("user").email_validated ||
            (this.state.player.ui_class?.indexOf("moderator") || 0) >= 0 ||
            this.state.lines.length > 0
        );
    };

    private getInputPlaceholder = () => {
        if (!this.canChat()) {
            return _("Chat will be enabled once your email address has been validated");
        }
        if (this.props.user_id) {
            return interpolate(
                pgettext(
                    "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                    "Message {{who}}",
                ),
                { who: this.state.player.username },
            );
        }
        return "";
    };

    private chat_markup = (body: string): string => {
        if (typeof body !== "string") {
            console.log("Attempted to markup non-text object: ", body);
            return "";
        }

        body = profanity_filter(body);
        let ret = body.replace(/[<>]/g, (m) => ({ "<": "&lt;", ">": "&gt;" })[m] || m);

        // Links
        ret = ret.replace(
            /(((ftp|http)(s)?:\/\/)([^<> ]+))/gi,
            "<a target='_blank' href='$1'>$1</a>",
        );

        // Email
        ret = ret.replace(
            /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,
            "<a target='_blank' href='mailto:$1'>$1</a>",
        );

        // Review references
        ret = ret.replace(
            /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
            "<a target='_blank' href='/review/$2$4'>$3##$2$4</a>",
        );

        // Game references
        ret = ret.replace(
            /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi,
            "<a target='_blank' href='/game/$2$4'>$3#$2$4</a>",
        );

        // Player references
        ret = ret.replace(/(player ([0-9]+))/gi, "<a target='_blank' href='/user/view/$2'>$1</a>");

        // Group references
        ret = ret.replace(/(#group-([0-9]+))/gi, "<a target='_blank' href='/group/$2'>$1</a>");

        return ret;
    };

    private renderBanner = () => {
        if (!this.state.player.ui_class?.match(/moderator/)) {
            return null;
        }

        return (
            <div ref={this.bannerRef} className="banner">
                <div
                    className={`banner-text ${
                        this.state.isSuperchatEnabled ? "megaphone-banner" : ""
                    }`}
                >
                    {this.state.isSuperchatEnabled
                        ? _("OGS Moderator official message: please respond")
                        : _("(You are talking with an OGS Moderator)")}
                </div>
            </div>
        );
    };
}
