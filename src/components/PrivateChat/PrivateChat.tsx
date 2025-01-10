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
import { alert } from "@/lib/swal_config";
import { player_is_ignored } from "@/components/BlockPlayer";
import { emitNotification } from "@/components/Notifications/NotificationManager";
import { PlayerCacheEntry } from "@/lib/player_cache";
import * as player_cache from "@/lib/player_cache";
import online_status from "@/lib/online_status";
import { openReport } from "@/components/Report";
import { initTabComplete } from "./tab_complete";

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
    dom!: HTMLDivElement;
    lines: HTMLDivElement[] = [];
    received_messages: { [k: string]: any } = {};
    last_uid?: string;
    last_date = new Date(Date.now() - 864e5).toLocaleDateString(undefined, date_format);
    floating = false;
    superchat_enabled = false;
    banner?: HTMLDivElement;
    body?: HTMLDivElement | null;
    input?: HTMLInputElement;
    superchat_modal?: HTMLDivElement | null;
    player_is_ignored = false;
    pc?: PrivateChat;
    opening: boolean = false;
    player_dom: HTMLSpanElement;
    player: PlayerCacheEntry;
    cleanup_tab_complete?: () => void;

    /* for generating uids */
    chat_base = Math.floor(Math.random() * 100000).toString(36);
    chat_num = 0;

    display_state = "closed";

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
                        player.ui_class.split(" ").forEach((cls) => {
                            if (cls) {
                                this.player_dom.classList.add(cls);
                            }
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
        this.dom.className = "private-chat-window open";

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
        title.className = "title";
        title.appendChild(this.player_dom);

        if (data.get("user").is_moderator) {
            const superchat = document.createElement("i");
            superchat.className = "fa fa-bullhorn";
            superchat.onclick = () => {
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
            };
            if (this.superchat_enabled) {
                superchat.classList.add("enabled");
            }
            title.appendChild(superchat);

            const modNote = document.createElement("i");
            modNote.className = "fa fa-clipboard";
            modNote.onclick = () => this.createModNote();
            title.appendChild(modNote);
        } else {
            if (this.user_id) {
                const report = document.createElement("i");
                report.className = "fa fa-exclamation-triangle";
                report.onclick = () => this.report();
                title.appendChild(report);

                const challenge = document.createElement("i");
                challenge.className = "ogs-goban";
                challenge.onclick = () => this.challenge();
                title.appendChild(challenge);
            }
        }

        if (this.user_id) {
            const info = document.createElement("i");
            info.className = "fa fa-info-circle";
            info.onclick = () => {
                window.open(
                    "/user/view/" +
                        this.user_id +
                        "/" +
                        encodeURIComponent(unicodeFilter(this.player.username || "")),
                    "_blank",
                );
            };
            title.appendChild(info);
        }

        const minimize = document.createElement("i");
        minimize.className = "fa fa-minus";
        minimize.onclick = () => this.minimize(true);
        title.appendChild(minimize);

        const close = document.createElement("i");
        close.className = "fa fa-times";
        close.onclick = () => this.close(true);
        title.appendChild(close);

        this.dom.appendChild(title);

        const handle = title;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        const startDrag = (e: MouseEvent) => {
            if (
                !(e.target as HTMLElement).classList.contains("title") &&
                !(e.target as HTMLElement).classList.contains("user")
            ) {
                return;
            }

            document.body.appendChild(this.dom);
            const rect = this.dom.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            startX = e.clientX;
            startY = e.clientY;
            dragging = true;

            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", stopDrag);
        };

        const drag = (e: MouseEvent) => {
            if (!dragging) {
                return;
            }

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!this.floating && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                this.startFloating();
            }

            const newX = initialX + dx;
            const newY = initialY + dy;

            this.dom.style.left = `${newX}px`;
            this.dom.style.top = `${newY}px`;
            this.dom.style.right = "auto";
            this.dom.style.bottom = "auto";

            if (this.body) {
                this.body.scrollTop = this.body.scrollHeight;
            }
        };

        const stopDrag = () => {
            dragging = false;
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("mouseup", stopDrag);
        };

        handle.addEventListener("mousedown", startDrag);

        const raiseToTop = () => {
            const body = document.body;
            if (body.lastChild !== this.dom) {
                body.appendChild(this.dom);
                if (this.body) {
                    this.body.scrollTop = this.body.scrollHeight;
                }
            }
        };

        const banner = (this.banner = document.createElement("div"));
        banner.className = "banner banner-inactive";
        this.dom.appendChild(banner);
        this.updateModeratorBanner();

        const body = (this.body = document.createElement("div"));
        body.className = "body";
        this.dom.appendChild(body);
        body.addEventListener("mousedown", raiseToTop);

        for (const line of this.lines) {
            body.appendChild(line);
        }

        const input = (this.input = document.createElement("input"));
        input.type = "text";
        input.onkeypress = (ev: KeyboardEvent) => {
            if (
                !data.get("user").email_validated &&
                (this.player.ui_class?.indexOf("moderator") || 0) < 0 &&
                this.lines.length === 0
            ) {
                return false;
            }

            if (ev.keyCode === 13) {
                if (input.value.trim() === "") {
                    return false;
                }
                this.sendChat(input.value);
                return false;
            }
            return undefined;
        };

        this.updateInputPlaceholder();

        this.cleanup_tab_complete = initTabComplete(input);
        this.dom.appendChild(input);

        document.body.appendChild(this.dom);

        body.scrollTop = body.scrollHeight;
        input.focus();

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
                this.banner.innerHTML = "";
            }
            const line = document.createElement("div");
            line.className = "banner-text";
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
            this.input.placeholder = _(
                "Chat will be enabled once your email address has been validated",
            );
            this.input.disabled = true;
        } else {
            if (this.user_id) {
                this.input.placeholder = interpolate(
                    pgettext(
                        "This is the placeholder text for the chat input field in games, chat channels, and private messages",
                        "Message {{who}}",
                    ),
                    { who: this.player.username },
                );
                this.input.disabled = false;
            } else {
                this.input.disabled = true;
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
        this.dom.className = "private-chat-window minimized";

        const title = document.createElement("div");
        title.className = "title";
        title.onclick = () => this.open(true);
        title.appendChild(this.player_dom);

        const challenge = document.createElement("i");
        challenge.className = "ogs-goban";
        challenge.onclick = () => this.challenge();
        title.appendChild(challenge);

        const info = document.createElement("i");
        info.className = "fa fa-info-circle";
        info.onclick = () => {
            window.open(
                "/user/view/" + this.user_id + "/" + encodeURIComponent(this.player.username || ""),
                "_blank",
            );
        };
        title.appendChild(info);

        const close = document.createElement("i");
        close.className = "fa fa-times";
        close.onclick = () => this.close(true);
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

        if (this.cleanup_tab_complete) {
            this.cleanup_tab_complete();
        }

        if (this.dom) {
            this.dom.remove();
        }
        this.dom = null as any;
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

    addChat(from: string, txt: string, user_id: number, timestamp: number) {
        from = unicodeFilter(from);

        const line = document.createElement("div");
        line.classList.add("chat-line");
        line.classList.add("chat-user-" + user_id);

        if (timestamp) {
            const ts = new Date(timestamp * 1000);
            if (this.last_date !== ts.toLocaleDateString(undefined, date_format)) {
                this.last_date = ts.toLocaleDateString(undefined, date_format);
                const dateDiv = document.createElement("div");
                dateDiv.className = "date";
                dateDiv.textContent = ts.toLocaleDateString(undefined, date_format);
                line.appendChild(dateDiv);
            }

            const timeSpan = document.createElement("span");
            timeSpan.className = "timestamp";
            timeSpan.textContent = `[${ts.getHours()}:${
                (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()
            }] `;
            line.appendChild(timeSpan);
        }

        if (typeof txt === "string" && txt.substr(0, 4) === "/me ") {
            const meSpan = document.createElement("span");
            meSpan.textContent = " ** ";
            line.appendChild(meSpan);

            const usernameSpan = document.createElement("span");
            usernameSpan.className = "username";
            usernameSpan.textContent = from;
            line.appendChild(usernameSpan);

            const spaceSpan = document.createElement("span");
            spaceSpan.textContent = " ";
            line.appendChild(spaceSpan);

            txt = txt.substr(4);
        } else {
            const fromSpan = document.createElement("span");
            fromSpan.className = "from";
            fromSpan.textContent = from + ": ";
            line.appendChild(fromSpan);
        }

        const messageSpan = document.createElement("span");
        messageSpan.className = "message";
        messageSpan.textContent = txt;
        line.appendChild(messageSpan);

        this.lines.push(line);
        if (this.body) {
            this.body.appendChild(line);
            this.body.scrollTop = this.body.scrollHeight;
        }

        if (this.last_uid === data.get(`pm.read-${this.user_id}`, "-")) {
            this.removeHighlight();
        }
    }

    startFloating() {
        this.floating = true;
        this.dom.classList.add("floating");
    }

    dock() {
        this.floating = false;
        this.dom.classList.remove("floating");
        this.dom.style.left = "";
        this.dom.style.top = "";
        this.dom.style.right = "";
        this.dom.style.bottom = "";
        update_chat_layout();
    }

    highlight() {
        if (this.dom) {
            this.dom.classList.add("highlight");
        }
    }

    removeHighlight() {
        if (this.dom) {
            this.dom.classList.remove("highlight");
        }
    }

    challenge() {
        challenge(this.user_id);
    }

    report() {
        openReport({
            reported_user_id: this.user_id,
        });
    }

    createModNote() {
        createModeratorNote(this.user_id, "");
    }

    sendChat(msg: string, as_system?: true) {
        if (data.get("appeals.banned_user_id")) {
            void alert.fire(_("Your account is suspended - you cannot send messages."));
            return;
        }

        msg = msg.trim();
        if (msg === "") {
            return;
        }

        while (msg.length) {
            const arr = splitOnBytes(msg, 500);
            const line = profanity_filter(arr[0]);
            msg = arr[1];

            const uid = this.chat_base + "." + (++this.chat_num).toString(36);
            const timestamp = Date.now() / 1000;
            this.addChat(data.get("user").username, line, data.get("user").id, timestamp);
            socket.send(
                "chat/pm",
                {
                    player_id: this.user_id,
                    username: this.player.username || "<e>",
                    uid: uid,
                    message: line,
                    ...(as_system ? { as_system } : {}),
                },
                (line) => {
                    if (line) {
                        /* we're gonna get these echoed back to us in various cases */
                        const msgId = line.message.i + " " + line.message.t + " " + line.from.username;
                        this.received_messages[msgId] = true;
                        this.last_uid = line.message.i + " " + line.message.t;
                    }
                },
            );
        }
        if (this.input) {
            this.input.value = "";
        }
    }
}

function update_chat_layout() {
    let right = 0;
    for (let i = 0; i < private_chats.length; ++i) {
        const pc = private_chats[i];
        if (!pc.floating && pc.dom) {
            pc.dom.style.right = right + "px";
            if (pc.display_state === "open") {
                right += 290;
            } else {
                right += 160;
            }
        }
    }
}

export function getPrivateChat(user_id: number, username?: string): PrivateChat {
    if (instances[user_id]) {
        return instances[user_id];
    }

    const pc = new PrivateChat(user_id, username || "");
    instances[user_id] = pc;
    return pc;
}

export function openPrivateChat(user_id: number, username: string) {
    const pc = getPrivateChat(user_id, username);
    pc.open();
}

export function closePrivateChat(user_id: number) {
    if (instances[user_id]) {
        instances[user_id].close(false);
        delete instances[user_id];
    }
}

export function minimizePrivateChat(user_id: number) {
    if (instances[user_id]) {
        instances[user_id].minimize();
    }
}

export function privateMessage(obj: any) {
    if (obj.from === data.get("user").id) {
        return;
    }

    if (player_is_ignored(obj.from)) {
        return;
    }

    if (instances[obj.from]) {
        const msgId = obj.uid + " " + obj.timestamp + " " + obj.username;
        if (!instances[obj.from].received_messages[msgId]) {
            instances[obj.from].received_messages[msgId] = true;
            instances[obj.from].last_uid = obj.uid + " " + obj.timestamp;
            instances[obj.from].addChat(obj.username, obj.message, obj.from, obj.timestamp);
            if (instances[obj.from].display_state === "closed") {
                instances[obj.from].opening = true;
                instances[obj.from].minimize();
                instances[obj.from].highlight();
                setTimeout(() => {
                    if (instances[obj.from].opening) {
                        instances[obj.from].opening = false;
                    }
                }, 100);
            } else if (instances[obj.from].display_state === "minimized") {
                instances[obj.from].highlight();
            }
        }
    } else {
        const pc = new PrivateChat(obj.from, obj.username);
        instances[obj.from] = pc;
        const msgId = obj.uid + " " + obj.timestamp + " " + obj.username;
        pc.received_messages[msgId] = true;
        pc.last_uid = obj.uid + " " + obj.timestamp;
        pc.addChat(obj.username, obj.message, obj.from, obj.timestamp);
        pc.minimize();
        pc.highlight();
    }

    if (obj.superchat) {
        instances[obj.from].superchat_enabled = true;
        instances[obj.from].open();
    }

    if (!player_is_ignored(obj.from)) {
        emitNotification(
            "Private Message",
            obj.username + " sent you a message:\n" + obj.message,
            () => {},
        );
    } else {
        console.log("Ignoring private chat from ", obj.username);
    }
}

export function privateMessageOld(obj: any) {
    if (instances[obj.from]) {
        instances[obj.from].addChat(obj.username, obj.message, obj.from, obj.timestamp);
    } else {
        const pc = new PrivateChat(obj.from, obj.username);
        instances[obj.from] = pc;
        pc.addChat(obj.username, obj.message, obj.from, obj.timestamp);
        pc.minimize();
        pc.highlight();
    }
}

export function privateMessageClose(obj: any) {
    if (instances[obj.from]) {
        instances[obj.from].close(false);
        delete instances[obj.from];
    }
}

export function privateMessageMinimize(obj: any) {
    if (instances[obj.from]) {
        instances[obj.from].minimize();
    }
}

export function privateMessageOpen(obj: any) {
    if (instances[obj.from]) {
        instances[obj.from].open();
    }
}

export function privateMessageSuperchat(obj: any) {
    if (instances[obj.from]) {
        instances[obj.from].superchat_enabled = obj.enable;
        instances[obj.from].updateModeratorBanner();
    }
}

ITC.register("private-chat-close", (obj) => {
    if (instances[obj.user_id]) {
        instances[obj.user_id].close(false);
        delete instances[obj.user_id];
    }
});

ITC.register("private-chat-minimize", (obj) => {
    if (instances[obj.user_id]) {
        instances[obj.user_id].minimize();
    }
});

ITC.register("private-chat-open", (obj) => {
    if (instances[obj.user_id]) {
        instances[obj.user_id].open();
    }
});
