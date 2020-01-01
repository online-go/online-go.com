/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import {comm_socket} from "sockets";
import {challenge} from "ChallengeModal";
import {_} from 'translate';
import * as data from "data";
import ITC from "ITC";
import {splitOnBytes, unicodeFilter} from "misc";
import {profanity_filter} from "profanity_filter";
import {player_is_ignored} from "BlockPlayer";
import {emitNotification} from "Notifications";
import {PlayerCacheEntry} from 'player_cache';
import * as player_cache from "player_cache";
import online_status from "online_status";

let last_id: number = 0;

let private_chats = [];
let instances = {};


class PrivateChat {
    id: number = ++last_id;
    user_id: number;
    dom = null;
    lines = [];
    received_messages = {};
    last_uid;
    last_date = new Date().toLocaleDateString();
    floating = false;
    superchat_enabled = false;
    body;
    input;
    superchat_modal;
    player_is_ignored;
    pc;
    opening;
    player_dom;
    player:PlayerCacheEntry;

    /* for generating uids */
    chatbase = Math.floor(Math.random() * 100000).toString(36);
    chatnum = 0;

    display_state = "closed";


    constructor(user_id, username) {
        this.user_id = user_id;
        comm_socket.send("chat/pm/load", user_id);

        this.player_dom = $("<span class='user Player nolink'>...</span>");
        if (username) {
            this.player_dom.text(unicodeFilter(username));
            this.player.username = username;
        }

        online_status.subscribe(user_id, (_, tf) => {
            if (tf) {
                this.player_dom.removeClass("offline").addClass("online");
            } else {
                this.player_dom.addClass("offline").removeClass("online");
            }
        });

        this.player = {
            "id": user_id,
            "username": "...",
            "ui_class": ""
        };
        player_cache.fetch(this.user_id, ["username", "ui_class"])
        .then((player) => {
            this.player = player;
            this.player_dom.text(unicodeFilter(player.username));
            this.player_dom.addClass(player.ui_class);
            this.updateInputPlaceholder();
        })
        .catch((err) => {
            console.error(err);
            this.player_dom.text("[error]");
        });
    }

    open(send_itc?) {
        if (this.display_state === "open") { return; }
        if (this.display_state !== "closed") { this.close(false, true); }
        private_chats.push(this);

        this.dom = $("<div>").addClass("private-chat-window").addClass("open");
        this.dom.append($("<div class='paper-shadow top z2'>"));
        this.dom.append($("<div class='paper-shadow bottom z2'>"));

        let title = $("<div>").addClass("title")
            .append(this.player_dom)
        ;

        if (data.get("user").is_moderator) {
            let superchat = $("<i>").addClass("fa fa-bullhorn").click(() => {
                this.superchat_enabled = !this.superchat_enabled;
                if (this.superchat_enabled) {
                    superchat.addClass("enabled");
                    this.dom.addClass("superchat");

                    comm_socket.send("chat/pm/superchat", {
                        "player_id": this.user_id,
                        "username": this.player.username,
                        "auth": data.get("config.superchat_auth"),
                        "enable": true
                    });
                } else {
                    superchat.removeClass("enabled");
                    this.dom.removeClass("superchat");
                    comm_socket.send("chat/pm/superchat", {
                        "player_id": this.user_id,
                        "username": this.player.username,
                        "auth": data.get("config.superchat_auth"),
                        "enable": false
                    });
                }

            });
            if (this.superchat_enabled) {
                superchat.addClass("enabled");
            }
            title.append(superchat);
        }


        title.append($("<i>").addClass("ogs-goban").click(() => {
            challenge(this.user_id);
        }));
        title.append($("<i>").addClass("fa fa-info-circle").click(() => {
            window.open("/user/view/" + this.user_id + "/" + encodeURIComponent(unicodeFilter(this.player.username)), "_blank");
        }));
        title.append($("<i>").addClass("fa fa-minus").click(() => { this.minimize(true); }));
        title.append($("<i>").addClass("fa fa-times").click(() => { this.close(true); }));



        this.dom.append(title);

        let handle = title;
        let start_drag = (ev) => {
            if (!$(ev.target).hasClass("title") && !$(ev.target).hasClass("user")) { return; }


            let body = $("body");

            body.append(this.dom); /* brings the chat to the front of other chats */
            let offset = this.dom.offset();
            let ox = offset.left;
            let oy = offset.top;
            let sx = ev.clientX;
            let sy = ev.clientY;
            let lx = sx;
            let ly = sy;
            let moving = false;

            let last_rox = 0;
            let last_roy = 0;

            const move = (ev) => {
                let cx = ev.clientX;
                let cy = ev.clientY;
                if (moving || (Math.abs(cx - lx) + Math.abs(cy - ly)) > 5) {
                    moving = true;
                    if (!this.floating) {
                        this.startFloating();
                    }
                    ox += (cx - lx);
                    oy += (cy - ly);
                    lx = cx;
                    ly = cy;

                    let rox = Math.round(ox);
                    let roy = Math.round(oy);

                    if (last_rox !== rox || last_roy !== roy) {
                        last_rox = rox;
                        last_roy = roy;
                        this.dom.css({"right": "auto", "bottom": "auto", "left": rox, "top": roy});
                        this.body[0].scrollTop = this.body[0].scrollHeight;
                    }
                }

                return false;
            };

            const release = () => {
                //handle.off('mousedown touchstart', start_drag);
                body.off("mousemove touchmove", move);
                body.off("mouseup touchend", release);

                return false;
            };
            body.on("mouseup touchend", release);
            body.on("mousemove touchmove", move);

            return true;
        };

        handle.on("mousedown touchstart", start_drag);

        const raise_to_top = () => {
            let body = $("body");
            if (body[0].childNodes[body[0].childNodes.length - 1] !== this.dom[0]) {
                body.append(this.dom); /* brings the chat to the front of other chats */
                this.body[0].scrollTop = this.body[0].scrollHeight;
            }
        };


        let body = this.body = $("<div>").addClass("body");
        this.dom.append(body);
        body.on("mousedown touchstart", raise_to_top);

        for (let i = 0; i < this.lines.length; ++i) {
            body.append(this.lines[i]);
        }

        let input = this.input = $("<input>").attr("type", "text").keypress((ev) => {
            if (!data.get('user').email_validated && this.player.ui_class.indexOf('moderator') < 0 && this.lines.length === 0) {
                return;
            }

            if (ev.keyCode === 13) {
                if (input.val().trim() === "") {
                    return false;
                }
                this.sendChat(input.val());
                return false;
            }
        });

        this.updateInputPlaceholder();


        (input as any).nicknameTabComplete();
        this.dom.append(input);

        $(document.body).append(this.dom);

        body[0].scrollTop = body[0].scrollHeight;
        input.focus();

        this.display_state = "open";
        update_chat_layout();

        if (send_itc) {
            //ITC.send("private-chat-open", {"user_id": this.user_id, "username": this.player.username});
            data.set("pm.read-" + this.user_id, this.last_uid);
        }
    }
    updateInputPlaceholder() {
        if (!this.input) {
            return;
        }
        if (!data.get('user').email_validated && this.player.ui_class.indexOf('moderator') < 0 && this.lines.length === 0) {
            this.input.attr("placeholder", _("Chat will be enabled once your email address has been validated"));
            this.input.attr("disabled", "disabled");
        } else {
            this.input.removeAttr("placeholder");
            this.input.removeAttr("disabled");
        }
    }
    minimize(send_itc?) {
        if (this.superchat_enabled) { return; }
        if (this.display_state === "minimized") { return; }
        if (this.display_state !== "closed") { this.close(false, true); }
        private_chats.push(this);


        this.dom = $("<div>").addClass("private-chat-window").addClass("minimized");

        let title = $("<div>").addClass("title").click(() => { this.open(true); });
        title.append(this.player_dom);
        title.append($("<i>").addClass("ogs-goban").click(() => {
            challenge(this.user_id);
        }));
        title.append($("<i>").addClass("fa fa-info-circle").click(() => {
            window.open("/user/view/" + this.user_id + "/" + encodeURIComponent(this.player.username), "_blank");
        }));
        title.append($("<i>").addClass("fa fa-times").click(() => { this.close(true); }));

        this.dom.append(title);

        $(document.body).append(this.dom);

        this.display_state = "minimized";

        if (this.floating) {
            this.dock();
        } else {
            update_chat_layout();
        }

        if (send_itc) {
            ITC.send("private-chat-minimize", {"user_id": this.user_id, "username": this.player.username});
        }
    }
    close(send_itc, dont_send_pm_close?) {
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
        this.dom = null;
        this.body = null;
        update_chat_layout();
        if (send_itc) {
            ITC.send("private-chat-close", {"user_id": this.user_id, "username": this.player.username});
            data.set("pm.close-" + this.user_id, this.last_uid);
        }
        if (comm_socket && !dont_send_pm_close) {
            comm_socket.send("chat/pm/close", this.user_id);
        }
    }
    addChat(from, txt, user_id, timestamp) {
        from = unicodeFilter(from);

        let line = $("<div>").addClass("chat-line");
        line.addClass("chat-user-" + user_id);

        if (timestamp) {
            let ts = new Date(timestamp * 1000);
            line.append($("<span class='timestamp'>").text("[" + ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes() + "] "));
            if (this.last_date !== ts.toLocaleDateString()) {
                this.last_date = ts.toLocaleDateString();
                this.lines.push($("<div>").addClass("date").text(ts.toLocaleDateString()));
            }
        }


        if (typeof(txt) === "string" && txt.substr(0, 4) === "/me ") {
            line.append("<span> ** </span>");
            line.append($("<span>").addClass("username").text(from)).append("<span> </span>");
            txt = txt.substr(4);
        } else {
            line.append($("<span>").addClass("username").text(from)).append("<span>: </span>");
        }
        line.append($("<span>").html(chat_markup(profanity_filter(txt))));


        this.lines.push(line);
        if (this.body) {
            let body = this.body[0];
            let scroll = false;
            let cur = body.scrollTop;
            body.scrollTop = body.scrollHeight;
            if (body.scrollTop === cur) {
                scroll = true;
            }

            this.body.append(line);
            if (scroll) {
                body.scrollTop = body.scrollHeight;
            }
        }
        this.updateInputPlaceholder();
    }
    addSystem(message) {
        let line = $("<div>").addClass("chat-line system");
        line.text(message.message);
        this.lines.push(line);
        if (this.body) {
            let body = this.body[0];
            let scroll = false;
            let cur = body.scrollTop;
            body.scrollTop = body.scrollHeight;
            if (body.scrollTop === cur) {
                scroll = true;
            }

            this.body.append(line);
            if (scroll) {
                body.scrollTop = body.scrollHeight;
            }
        }
    }
    hilight() {
        if (this.dom) {
            this.dom.addClass("highlighted");
        }
    }
    removeHilight() {
        if (this.dom) {
            this.dom.removeClass("highlighted");
        }
    }
    handleChat(line) {

        if (line.message.i) {
            if ((line.message.i + " " + line.message.t + " " + line.from.username) in this.received_messages) {
                return;
            }
            this.received_messages[(line.message.i + " " + line.message.t + " " + line.from.username)] = true;
        }

        //if (line.message.to) {
            //this.addChat(data.get('user').username, line.message.m, 0, line.message.t);
        //} else {
            line.message.m = profanity_filter(line.message.m);
            this.addChat(line.from.username, line.message.m, line.from.id, line.message.t);
            if (line.from.id !== data.get("user").id) { /* don't open if we were the ones who sent this (from another tab for instance) */
                if (this.display_state === "closed") {
                    //this.opening = true;
                    //setTimeout(()=>{
                    //    if (this.opening) {
                    this.minimize();
                    this.hilight();
                    //    }
                    //}, 100);
                }
                else if (this.display_state === "minimized") {
                    this.hilight();
                }
                if (!player_is_ignored(line.from.id)) {
                    emitNotification("Private Message", line.from.username + " sent you a message:\n" + line.message.m);
                } else {
                    console.log("Ignoring private chat from ", line.from.username);
                }
            }
        //}

        this.last_uid = line.message.i + " " + line.message.t;

        if (this.last_uid === data.get("pm.read-" + this.user_id, "-")) {
            this.removeHilight();
        }
    }
    sendChat(msg) {

        while (msg.length) {
            let arr = splitOnBytes(msg, 500);
            let line = arr[0];
            msg = arr[1];

            this.addChat(data.get("user").username, line, this.user_id, Date.now() / 1000);
            comm_socket.send("chat/pm", {
                "player_id": this.user_id,
                "username": this.player.username,
                "uid": this.chatbase + "." + (++this.chatnum).toString(36),
                "message": line
            }, (line) => {
                /* we're gonna get these echoed back to us in various cases */
                this.received_messages[(line.message.i + " " + line.message.t + " " + line.from.username)] = true;
            });
        }
        this.input.val("");
    }

    startFloating() {
        if (!this.floating) {
            this.dom.addClass("floating");
            this.floating = true;
            update_chat_layout();
        }
    }
    dock() {
        if (this.floating) {
            this.floating = false;
            this.dom.removeClass("floating");
            update_chat_layout();
        }
    }
    superchat(enable) {
        this.superchat_enabled = enable;
        if (enable) {
            this.open();
            this.dom.addClass("superchat");
            if (!this.superchat_modal) {
                this.superchat_modal = $("<div>").addClass("superchat-modal");
                $("body").append(this.superchat_modal);
                let check = setInterval(() => {
                    if (!this.superchat_enabled) {
                        clearInterval(check);
                        return;
                    }

                    if (!this.superchat_modal[0].parentNode) {
                        $("body").append(this.superchat_modal);
                    }
                }, 100);
            }
        } else {
            this.dom.removeClass("superchat");
            if (this.superchat_modal) {
                this.superchat_modal.remove();
                this.superchat_modal = null;
            }
        }
    }
}

function update_chat_layout() {
    let pos = $("#em10").width() / 2.5;
    let max_width = '20rem';

    let window_width = $(window).width();
    if (window_width < 640) {
        pos = 0;
        max_width = '100vw';
    }

    let docked_chats = [];
    for (let i = 0; i < private_chats.length; ++i) {
        if (!private_chats[i].floating) {
            docked_chats.push(private_chats[i]);
        }
    }

    docked_chats.sort((a, b) => { return a.id - b.id; });

    for (let i = 0; i < docked_chats.length; ++i) {
        //docked_chats[i].dom.css({"right": pos, "z-index": 50000});
        docked_chats[i].dom.css({"right": pos, maxWidth: max_width});
        pos += docked_chats[i].dom.width() + 3;
    }
}

export function getPrivateChat(user_id, username?) {
    if (user_id in instances) {
        return instances[user_id];
    }

    return (instances[user_id] = new PrivateChat(user_id, username));
}
comm_socket.on("private-message", (line) => {
    let pc;
    if (line.from.id === data.get("user").id) {
        pc = getPrivateChat(line.to.id);
    } else if (line.to.id === data.get("user").id) {
        pc = getPrivateChat(line.from.id);
    }

    if (pc && !pc.superchat_enabled) {
        if (line.from.id === data.get("user").id && player_is_ignored(line.to.id)) {
            pc = null;
        } else if (line.to.id === data.get("user").id && player_is_ignored(line.from.id)) {
            pc = null;
        }
    }

    if (pc) {
        pc.handleChat(line);
    }
});
comm_socket.on("private-superchat", (config) => {
    let pc;
    if (config.moderator_id !== data.get("user").id) {
        pc = getPrivateChat(config.moderator_id, config.moderator_username);
        if (pc) {
            pc.open();
            if (!data.get("user").is_superuser) {
                pc.superchat(config.enable);
            } else {
                pc.addSystem({
                    "message": config.moderator_username + " just tried to superchat you, but being a super user we decided to ignore that shit."
                });
            }
        }
    } else {
        //pc = getPrivateChat(config.player_id, config.player_username);
        pc = getPrivateChat(config.player_id, config.player_username);
        if (pc) {
            pc.superchat_enabled = true;
            pc.open();
        }
    }
});
ITC.register("private-chat-close", (data) => {
    let pc = getPrivateChat(data.user_id);
    if (pc.display_state === "minimized") {
        pc.close();
    }
});
function chat_markup(body) {
    if (typeof(body) === "string") {
        let ret = $("<div>").text(body).html();
        // Some link urls can have an @-sign in. Be careful not to cause the link_matcher
        // and email_matcher to overlap! See for example
        // https://www.google.co.uk/maps/place/Platform+9%C2%BE/@51.5321578,-0.1261661
        let link_matcher = /(((ftp|http)(s)?:\/\/)([^<> ]+))/gi;
        ret = ret.replace(link_matcher, (match) => "<a target='_blank' href='" +
            match.replace("@", "%40") + "'>" +
            match.replace("@", "&commat;") + "</a>");
        let email_matcher = /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi;
        ret = ret.replace(email_matcher, "<a target='_blank' href='mailto:$1'>$1</a>");
        let review_matcher = /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi;
        ret = ret.replace(review_matcher, "<a target='_blank' href='/review/$2$4'>$3##$2$4</a>");
        let game_matcher = /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi;
        ret = ret.replace(game_matcher, "<a target='_blank' href='/game/$2$4'>$3#$2$4</a>");
        let player_matcher = /(player ([0-9]+))/gi;
        ret = ret.replace(player_matcher, "<a target='_blank' href='/user/view/$2'>$1</a>");
        let group_matcher = /(#group-([0-9]+))/gi;
        ret = ret.replace(group_matcher, "<a target='_blank' href='/group/$2'>$1</a>");
        return ret;
    } else {
        console.log("Attempted to markup non-text object: ", body);
    }
}
