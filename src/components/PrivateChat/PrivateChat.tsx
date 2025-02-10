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

import { socket } from "@/lib/sockets";
import { challenge } from "@/components/ChallengeModal";
import { createModeratorNote } from "@/components/ModNoteModal";
import { _, pgettext, interpolate } from "@/lib/translate";
import * as data from "@/lib/data";
import ITC from "@/lib/ITC";
import { splitOnBytes, unicodeFilter } from "@/lib/misc";
import { profanity_filter } from "@/lib/profanity_filter";
import { player_is_ignored } from "@/components/BlockPlayer";
import { emitNotification } from "@/components/Notifications/NotificationManager";
import { PlayerCacheEntry } from "@/lib/player_cache";
import * as player_cache from "@/lib/player_cache";
import online_status from "@/lib/online_status";
import { openReport } from "@/components/Report";
import { alert } from "@/lib/swal_config";
import { nicknameTabComplete } from "./tab_complete";

let last_id = 0;

const private_chats: any[] = [];
const instances: { [k: string]: any } = {};

const date_format: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
};

class PrivateChat {
    id: number = ++last_id;
    user_id: number;
    dom!: HTMLElement;
    lines: any[] = [];
    received_messages: { [k: string]: any } = {};
    last_uid?: string;
    last_date = new Date(Date.now() - 864e5).toLocaleDateString(undefined, date_format);
    floating = false;
    superchat_enabled = false;
    banner?: HTMLElement;
    body?: HTMLElement | null;
    input?: HTMLInputElement;
    superchat_modal?: HTMLElement | null;
    player_is_ignored = false;
    pc?: PrivateChat;
    opening: boolean = false;
    player_dom: HTMLElement;
    player: PlayerCacheEntry;

    /* for generating uids */
    chat_base = Math.floor(Math.random() * 100000).toString(36);
    chat_num = 0;

    display_state: "open" | "minimized" | "closed" = "closed";

    constructor(user_id: number, username: string) {
        this.user_id = user_id;
        socket.send("chat/pm/load", { player_id: user_id });

        this.player_dom = document.createElement("span");
        this.player_dom.className = "user Player nolink";
        this.player_dom.textContent = "...";

        if (user_id) {
            online_status.subscribe(user_id, (_, tf) => {
                if (tf) {
                    this.player_dom.classList.remove("offline");
                    this.player_dom.classList.add("online");
                } else {
                    this.player_dom.classList.add("offline");
                    this.player_dom.classList.remove("online");
                }
            });
        }

        this.player = {
            id: user_id,
            username: "...",
            ui_class: "",
        };

        if (username) {
            this.player_dom.textContent = unicodeFilter(username);
            this.player.username = username;
        }

        if (this.user_id) {
            player_cache
                .fetch(this.user_id, ["username", "ui_class"])
                .then((player) => {
                    this.player = player;
                    this.player_dom.textContent = unicodeFilter(player.username || "");
                    if (player.ui_class) {
                        player.ui_class
                            .split(" ")
                            .filter((c) => !!c.trim())
                            .forEach((c) => {
                                this.player_dom.classList.add(c);
                            });
                    }
                    if (player.ui_class?.match(/moderator/)) {
                        // inter mod chat? don't open
                        if (!data.get("user").is_moderator) {
                            this.open();
                        }
                    }
                    this.updateInputPlaceholder();
                    if (this.banner) {
                        this.updateModeratorBanner();
                    }
                })
                .catch((err) => {
                    console.error(err);
                    this.player_dom.textContent = "[error]";
                });
        } else {
            this.player_dom.textContent = "system";
        }
    }

    open(send_itc?: boolean) {
        if (this.display_state === "open") {
            return;
        }
        if (this.display_state !== "closed") {
            this.close(false, true);
        }
        private_chats.push(this);

        this.dom = document.createElement("div");
        this.dom.classList.add("private-chat-window", "open");

        const shadowTop = document.createElement("div");
        shadowTop.className = "paper-shadow top z2";
        this.dom.appendChild(shadowTop);

        const shadowBottom = document.createElement("div");
        shadowBottom.className = "paper-shadow bottom z2";
        this.dom.appendChild(shadowBottom);

        if (!this.user_id) {
            this.dom.classList.add("system");
        }

        const title = document.createElement("div");
        title.classList.add("title");
        title.appendChild(this.player_dom);

        if (data.get("user").is_moderator) {
            const superchat = document.createElement("i");
            superchat.classList.add("fa", "fa-bullhorn");
            superchat.addEventListener("click", () => {
                this.superchat_enabled = !this.superchat_enabled;
                if (this.superchat_enabled) {
                    superchat.classList.add("enabled");
                    this.dom?.classList.add("superchat");

                    socket.send("chat/pm/superchat", {
                        player_id: this.user_id,
                        username: this.player.username || "<e>",
                        enable: true,
                    });
                } else {
                    superchat.classList.remove("enabled");
                    this.dom?.classList.remove("superchat");
                    socket.send("chat/pm/superchat", {
                        player_id: this.user_id,
                        username: this.player.username || "<e>",
                        enable: false,
                    });
                }
            });
            if (this.superchat_enabled) {
                superchat.classList.add("enabled");
            }
            title.appendChild(superchat);

            const modNote = document.createElement("i");
            modNote.classList.add("fa", "fa-clipboard");
            modNote.addEventListener("click", () => {
                this.createModNote();
            });
            title.appendChild(modNote);
        } else {
            if (this.user_id) {
                const report = document.createElement("i");
                report.classList.add("fa", "fa-exclamation-triangle");
                report.addEventListener("click", () => {
                    this.report();
                });
                title.appendChild(report);

                const challengeBtn = document.createElement("i");
                challengeBtn.classList.add("ogs-goban");
                challengeBtn.addEventListener("click", () => {
                    void (challenge as (id: number) => Promise<void>)(this.user_id);
                });
                title.appendChild(challengeBtn);
            }
        }

        if (this.user_id) {
            const info = document.createElement("i");
            info.classList.add("fa", "fa-info-circle");
            info.addEventListener("click", () => {
                window.open(
                    "/user/view/" +
                        this.user_id +
                        "/" +
                        encodeURIComponent(unicodeFilter(this.player.username || "")),
                    "_blank",
                );
            });
            title.appendChild(info);
        }

        const minimize = document.createElement("i");
        minimize.classList.add("fa", "fa-minus");
        minimize.addEventListener("click", () => {
            this.minimize(true);
        });
        title.appendChild(minimize);

        const close = document.createElement("i");
        close.classList.add("fa", "fa-times");
        close.addEventListener("click", () => {
            this.close(true);
        });
        title.appendChild(close);

        this.dom.appendChild(title);

        const handle = title;
        const start_drag = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement;
            if (!target.classList.contains("title") && !target.classList.contains("user")) {
                return;
            }

            const body = document.body;

            if (!this.dom) {
                return;
            }

            body.appendChild(this.dom); /* brings the chat to the front of other chats */
            const rect = this.dom.getBoundingClientRect();
            let ox = rect.left;
            let oy = rect.top;
            const sx = ev.clientX;
            const sy = ev.clientY;
            let lx = sx;
            let ly = sy;
            let moving = false;

            let last_rox = 0;
            let last_roy = 0;

            const move = (ev: MouseEvent | TouchEvent) => {
                const cx = ev instanceof MouseEvent ? ev.clientX : ev.touches[0].clientX;
                const cy = ev instanceof MouseEvent ? ev.clientY : ev.touches[0].clientY;
                if (moving || Math.abs(cx - lx) + Math.abs(cy - ly) > 5) {
                    moving = true;
                    if (!this.floating) {
                        this.startFloating();
                    }
                    ox += cx - lx;
                    oy += cy - ly;
                    lx = cx;
                    ly = cy;

                    const rox = Math.round(ox);
                    const roy = Math.round(oy);

                    if (last_rox !== rox || last_roy !== roy) {
                        last_rox = rox;
                        last_roy = roy;
                        if (this.dom) {
                            this.dom.style.right = "auto";
                            this.dom.style.bottom = "auto";
                            this.dom.style.left = rox + "px";
                            this.dom.style.top = roy + "px";
                        }
                        if (this.body) {
                            this.body.scrollTop = this.body.scrollHeight;
                        }
                    }
                }

                return false;
            };

            const release = () => {
                body.removeEventListener("mousemove", move as unknown as EventListener);
                body.removeEventListener("touchmove", move as unknown as EventListener);
                body.removeEventListener("mouseup", release);
                body.removeEventListener("touchend", release);
                return false;
            };

            body.addEventListener("mouseup", release);
            body.addEventListener("touchend", release);
            body.addEventListener("mousemove", move as unknown as EventListener);
            body.addEventListener("touchmove", move as unknown as EventListener, {
                passive: false,
            });

            return true;
        };

        handle.addEventListener("mousedown", start_drag as unknown as EventListener);
        handle.addEventListener("touchstart", start_drag as unknown as EventListener);

        const raise_to_top = () => {
            const body = document.body;
            if (body.lastChild !== this.dom) {
                body.appendChild(this.dom); /* brings the chat to the front of other chats */
                if (this.body) {
                    this.body.scrollTop = this.body.scrollHeight;
                }
            }
        };

        this.banner = document.createElement("div");
        this.banner.classList.add("banner", "banner-inactive");
        this.dom.appendChild(this.banner);
        this.updateModeratorBanner();

        this.body = document.createElement("div");
        this.body.classList.add("body");
        this.dom.appendChild(this.body);
        this.body.addEventListener("mousedown", raise_to_top);
        this.body.addEventListener("touchstart", raise_to_top);

        for (let i = 0; i < this.lines.length; ++i) {
            this.body.appendChild(this.lines[i]);
        }

        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.addEventListener("keypress", (ev: KeyboardEvent) => {
            if (
                !data.get("user").email_validated &&
                (this.player.ui_class?.indexOf("moderator") || 0) < 0 &&
                this.lines.length === 0
            ) {
                return true;
            }

            if (ev.keyCode === 13) {
                if (this.input && this.input.value.trim() === "") {
                    return false;
                }
                if (this.input) {
                    this.sendChat(this.input.value);
                }
                return false;
            }
            return true;
        });

        this.updateInputPlaceholder();

        nicknameTabComplete(this.input, {
            nicknames: () => player_cache.nicknames,
            nick_match: /([-_a-z0-9]+)$/i,
        });
        this.dom.appendChild(this.input);

        document.body.appendChild(this.dom);

        if (this.body) {
            this.body.scrollTop = this.body.scrollHeight;
        }
        this.input.focus();

        this.display_state = "open";
        update_chat_layout();

        if (send_itc) {
            data.set(`pm.read-${this.user_id}`, this.last_uid);
        }
    }

    updateModeratorBanner() {
        if (this.player.ui_class?.match(/moderator/)) {
            if (this.banner) {
                this.banner.classList.remove("banner-inactive");
                this.banner.textContent = "";
            }
            const line = document.createElement("div");
            line.classList.add("banner-text");
            if (this.superchat_enabled) {
                line.classList.add("megaphone-banner");
                line.textContent = _("OGS Moderator official message: please respond");
            } else {
                line.textContent = _("(You are talking with an OGS Moderator)");
            }
            if (this.banner) {
                this.banner.appendChild(line);
            }
        }
    }

    updateInputPlaceholder() {
        if (!this.input) {
            return;
        }
        if (
            !data.get("user").email_validated &&
            (this.player.ui_class?.indexOf("moderator") || 0) < 0 &&
            this.lines.length === 0
        ) {
            this.input.setAttribute(
                "placeholder",
                _("Chat will be enabled once your email address has been validated"),
            );
            this.input.setAttribute("disabled", "disabled");
        } else {
            if (this.user_id) {
                this.input.setAttribute(
                    "placeholder",
                    interpolate(
                        pgettext(
                            "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                            "Message {{who}}",
                        ),
                        { who: this.player.username },
                    ),
                );
                this.input.removeAttribute("disabled");
            } else {
                this.input.setAttribute("disabled", "disabled");
            }
        }
    }

    minimize(send_itc?: boolean) {
        if (this.superchat_enabled) {
            return;
        }
        if (this.display_state === "minimized") {
            return;
        }
        if (this.display_state !== "closed") {
            this.close(false, true);
        }
        private_chats.push(this);

        this.dom = document.createElement("div");
        this.dom.classList.add("private-chat-window", "minimized");

        const title = document.createElement("div");
        title.classList.add("title");
        title.addEventListener("click", (event) => {
            event.stopPropagation();
            this.open(true);
            return false;
        });
        title.appendChild(this.player_dom);

        const challengeBtn = document.createElement("i");
        challengeBtn.classList.add("ogs-goban");
        challengeBtn.addEventListener("click", () => {
            void (challenge as (id: number) => Promise<void>)(this.user_id);
        });
        title.appendChild(challengeBtn);

        const info = document.createElement("i");
        info.classList.add("fa", "fa-info-circle");
        info.addEventListener("click", () => {
            window.open(
                "/user/view/" + this.user_id + "/" + encodeURIComponent(this.player.username || ""),
                "_blank",
            );
        });
        title.appendChild(info);

        const close = document.createElement("i");
        close.classList.add("fa", "fa-times");
        close.addEventListener("click", (event) => {
            event.stopPropagation();
            this.close(true);
            return false;
        });
        title.appendChild(close);

        this.dom.appendChild(title);

        document.body.appendChild(this.dom);

        this.display_state = "minimized";

        if (this.floating) {
            this.dock();
        } else {
            update_chat_layout();
        }

        if (send_itc) {
            ITC.send("private-chat-minimize", {
                user_id: this.user_id,
                username: this.player.username,
            });
        }
    }

    close(send_itc: boolean, dont_send_pm_close?: boolean) {
        this.display_state = "closed";
        for (let i = 0; i < private_chats.length; ++i) {
            if (private_chats[i].id === this.id) {
                private_chats.splice(i, 1);
                break;
            }
        }

        if (this.dom) {
            this.dom.remove();
        }

        this.dom = null as unknown as HTMLDivElement;
        this.body = null;
        update_chat_layout();

        if (send_itc) {
            ITC.send("private-chat-close", {
                user_id: this.user_id,
                username: this.player.username,
            });
            data.set(`pm.close-${this.user_id}`, this.last_uid);
        }
        if (socket && !dont_send_pm_close) {
            socket.send("chat/pm/close", { player_id: this.user_id });
        }
    }

    addChat(from: string, txt: string, user_id: number, ts: Date) {
        from = unicodeFilter(from);

        const line = document.createElement("div");
        line.classList.add("chat-line");
        line.classList.add("chat-user-" + user_id);

        if (ts.toLocaleDateString(undefined, date_format) !== this.last_date) {
            this.last_date = ts.toLocaleDateString(undefined, date_format);
            const dateDiv = document.createElement("div");
            dateDiv.classList.add("date");
            dateDiv.textContent = ts.toLocaleDateString(undefined, date_format);
            line.appendChild(dateDiv);
        }

        const timestamp = document.createElement("span");
        timestamp.classList.add("timestamp");
        timestamp.textContent = `[${ts.getHours()}:${
            (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()
        }] `;
        line.appendChild(timestamp);

        if (typeof txt === "string" && txt.substr(0, 4) === "/me ") {
            const span = document.createElement("span");
            span.textContent = " ** ";
            line.appendChild(span);
            const username = document.createElement("span");
            username.classList.add("username");
            username.textContent = from;
            line.appendChild(username);
            const space = document.createElement("span");
            space.textContent = " ";
            line.appendChild(space);
            txt = txt.substr(4);
        } else {
            const username = document.createElement("span");
            username.classList.add("username");
            username.textContent = from;
            line.appendChild(username);
            const colon = document.createElement("span");
            colon.textContent = ": ";
            line.appendChild(colon);
        }

        const message = document.createElement("span");
        message.innerHTML = chat_markup(profanity_filter(txt)) || "";
        line.appendChild(message);

        this.lines.push(line);

        if (this.body) {
            const atBottom =
                this.body.scrollHeight - this.body.scrollTop <= this.body.clientHeight + 1;
            this.body.appendChild(line);
            if (atBottom) {
                this.body.scrollTop = this.body.scrollHeight;
            }
        }
    }

    addSystemChat(message: { message: string }) {
        const line = document.createElement("div");
        line.classList.add("chat-line", "system");
        line.textContent = message.message;

        this.lines.push(line);

        if (this.body) {
            const cur = this.body.scrollTop;
            this.body.scrollTop = this.body.scrollHeight;
            if (this.body.scrollTop === cur) {
                // we didn't scroll, meaning the user has scrolled up to read something
                // so let's highlight the title to let them know there are new messages
                this.dom?.classList.add("highlighted");
            }
            this.body.appendChild(line);
            if (this.body.scrollTop !== cur) {
                this.body.scrollTop = this.body.scrollHeight;
            }
        }
    }

    report() {
        openReport({
            reported_user_id: this.user_id,
            reported_game_id: 0,
            reported_review_id: 0,
            report_type: "harassment",
            reported_conversation: {
                username: this.player.username || "<e>",
                content: this.getHistory(),
            },
        });
    }

    highlight() {
        if (this.dom) {
            this.dom.classList.add("highlighted");
        }
    }

    removeHighlight() {
        if (this.dom) {
            this.dom.classList.remove("highlighted");
        }
    }

    handleChat(line: {
        from: { id: number; username: string };
        to: { id: number; username: string };
        message: { t: number; i: string; m: string };
    }) {
        if (!this.user_id) {
            // system message
            this.open();
        }
        if (this.player.ui_class?.match(/moderator/)) {
            // Open the chat window if a moderator is messaging (unless we are a moderator ourselves)
            if (!data.get("user").is_moderator) {
                this.open();
            }
        }

        if (line.message.i) {
            const message_key = line.message.i + " " + line.message.t + " " + line.from.username;
            if (message_key in this.received_messages) {
                return;
            }
            this.received_messages[message_key] = true;
        }

        line.message.m = profanity_filter(line.message.m);
        this.addChat(
            line.from.username,
            line.message.m,
            line.from.id,
            new Date(line.message.t * 1000),
        );

        if (line.from.id !== data.get("user").id) {
            /* don't open if we were the ones who sent this (from another tab for instance) */
            if (this.display_state === "closed") {
                this.minimize();
                this.highlight();
            } else if (this.display_state === "minimized") {
                this.highlight();
            }
            if (!player_is_ignored(line.from.id)) {
                emitNotification(
                    "Private Message",
                    line.from.username + " sent you a message:\n" + line.message.m,
                    () => {},
                );
            } else {
                console.log("Ignoring private chat from ", line.from.username);
            }
        }

        this.last_uid = line.message.i + " " + line.message.t + " " + line.from.username;

        if (this.last_uid === data.get(`pm.read-${this.user_id}`, "-")) {
            this.removeHighlight();
        }
    }

    getHistory() {
        return this.lines.map((line) => line.textContent);
    }

    sendChat(msg: string, as_system?: true) {
        if (data.get("appeals.banned_user_id")) {
            void alert.fire(_("Your account is suspended - you cannot send messages."));
            return;
        }

        if (msg.trim() === "") {
            return;
        }

        while (msg.length) {
            const arr = splitOnBytes(msg, 500);
            const line = arr[0];
            msg = arr[1];

            this.addChat(data.get("user").username, line, this.user_id, new Date());
            socket.send(
                "chat/pm",
                {
                    player_id: this.user_id,
                    username: this.player.username || "<error>",
                    uid: this.chat_base + "." + (++this.chat_num).toString(36),
                    message: line,
                    as_system,
                },

                (line) => {
                    if (line) {
                        /* we're gonna get these echoed back to us in various cases */
                        this.received_messages[
                            line.message.i + " " + line.message.t + " " + line.from.username
                        ] = true;
                    }
                },
            );
        }

        if (this.input) {
            this.input.value = "";
        }
    }

    startFloating() {
        if (this.floating) {
            return;
        }
        this.floating = true;
        if (this.dom) {
            this.dom.classList.add("floating");
        }
        update_chat_layout();
    }

    dock() {
        if (!this.floating) {
            return;
        }
        this.floating = false;
        if (this.dom) {
            this.dom.classList.remove("floating");
        }
        update_chat_layout();
    }

    createModNote() {
        createModeratorNote(this.user_id, this.getHistory().join("\n"));
    }

    superchatStart() {
        if (this.display_state === "open") {
            if (this.dom) {
                this.dom.classList.add("superchat");
            }
            if (!this.superchat_modal) {
                this.superchat_modal = document.createElement("div");
                this.superchat_modal.classList.add("superchat-modal");
                document.body.appendChild(this.superchat_modal);
            }
        }
    }

    superchatEnd() {
        if (this.display_state === "open") {
            if (this.dom) {
                this.dom.classList.remove("superchat");
            }
            if (this.superchat_modal) {
                this.superchat_modal.remove();
                this.superchat_modal = null;
            }
        }
    }
}

function update_chat_layout() {
    const docked_chats = private_chats.filter((chat) => !chat.floating);
    let pos = document.getElementById("em10")?.offsetWidth || 0;
    pos /= 2.5;
    let max_width = "20rem";

    const window_width = window.innerWidth;
    if (window_width < 640) {
        pos = 0;
        max_width = "100vw";
    }

    // Sort chats by id to maintain consistent ordering
    docked_chats.sort((a, b) => a.id - b.id);

    for (let i = 0; i < docked_chats.length; ++i) {
        docked_chats[i].dom.style.right = pos + "px";
        docked_chats[i].dom.style.maxWidth = max_width;
        pos += docked_chats[i].dom.offsetWidth + 3;
    }
}

socket.on(
    "private-message",
    (line: {
        from: { id: number; username: string };
        to: { id: number; username: string };
        message: { t: number; i: string; m: string };
    }) => {
        let pc;
        if (line.from.id === data.get("user").id) {
            pc = getPrivateChat(line.to.id, line.to.username);
        } else if (line.to.id === data.get("user").id) {
            pc = getPrivateChat(line.from.id, line.from.username);
        }

        if (pc && !pc.superchat_enabled) {
            if (line.from.id === data.get("user").id && player_is_ignored(line.to.id)) {
                pc = null;
            } else if (line.to.id === data.get("user").id && player_is_ignored(line.from.id)) {
                pc = null;
            }
        }

        if (!pc) {
            return;
        }

        pc.handleChat(line);
    },
);

socket.on("private-superchat", (config) => {
    let pc;
    if (config.moderator_id !== data.get("user").id) {
        pc = getPrivateChat(config.moderator_id, config.moderator_username);
        if (pc) {
            pc.open();
            if (!data.get("user").is_superuser) {
                if (config.enable) {
                    pc.superchatStart();
                } else {
                    pc.superchatEnd();
                }
            } else {
                pc.addSystemChat({
                    message:
                        config.moderator_username +
                        " just tried to superchat you, but being a super user we decided to ignore it.",
                });
            }
        }
    } else {
        pc = getPrivateChat(config.player_id, config.player_username);
        if (pc) {
            pc.superchat_enabled = true;
            pc.open();
        }
    }
});

/*
ITC.register("private-chat-minimize", (data) => {
    let pc = instances[data.user_id];
    if (!pc) {
        pc = instances[data.user_id] = new PrivateChat(data.user_id, data.username);
    }
    pc.minimize();
});
*/

ITC.register("private-chat-close", (data) => {
    const pc = getPrivateChat(data.user_id);
    if (pc.display_state === "minimized") {
        pc.close(false);
    }
});

export function getPrivateChat(user_id: number, username?: string) {
    let pc = instances[user_id];
    if (!pc) {
        pc = instances[user_id] = new PrivateChat(user_id, username ?? "<unknown>");
    }
    return pc;
}

function chat_markup(body: string): string | undefined {
    if (typeof body === "string") {
        const div = document.createElement("div");
        div.textContent = body;
        let ret = div.innerHTML;
        // Some link urls can have an @-sign in. Be careful not to cause the link_matcher
        // and email_matcher to overlap! See for example
        // https://www.google.co.uk/maps/place/Platform+9%C2%BE/@51.5321578,-0.1261661
        const link_matcher = /(((ftp|http)(s)?:\/\/)([^<> ]+))/gi;
        ret = ret.replace(
            link_matcher,
            (match) =>
                "<a target='_blank' href='" +
                match.replace("@", "%40") +
                "'>" +
                match.replace("@", "&commat;") +
                "</a>",
        );
        const email_matcher = /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi;
        ret = ret.replace(email_matcher, "<a target='_blank' href='mailto:$1'>$1</a>");
        const review_matcher = /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi;
        ret = ret.replace(review_matcher, "<a target='_blank' href='/review/$2$4'>$3##$2$4</a>");
        const game_matcher = /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi;
        ret = ret.replace(game_matcher, "<a target='_blank' href='/game/$2$4'>$3#$2$4</a>");
        const player_matcher = /(player ([0-9]+))/gi;
        ret = ret.replace(player_matcher, "<a target='_blank' href='/user/view/$2'>$1</a>");
        const group_matcher = /(#group-([0-9]+))/gi;
        ret = ret.replace(group_matcher, "<a target='_blank' href='/group/$2'>$1</a>");
        return ret;
    } else {
        console.log("Attempted to markup non-text object: ", body);
    }
    return;
}
