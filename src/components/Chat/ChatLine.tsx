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
import * as moment from "moment";
import * as data from "data";
import { Player } from "Player";
import { chat_markup } from "./chat_markup";
import { ChatMessage } from "chat_manager";

let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    const cleaned_username_regex = user.username.replace(/[\\^$*+.()|[\]{}]/g, "\\$&");
    name_match_regex = new RegExp(
        "\\b" +
            cleaned_username_regex +
            "\\b" +
            "|\\bplayer ?" +
            user.id +
            "\\b" +
            "|\\bhttps?:\\/\\/online-go\\.com\\/user\\/view\\/" +
            user.id +
            "\\b",
        "i",
    );
});

interface ChatLineInterface {
    line: ChatMessage;
    lastLine?: ChatMessage;
}

export function ChatLine(props: ChatLineInterface): JSX.Element {
    const line = props.line;
    const last_line = props.lastLine;
    const user = line;

    if (line.system) {
        return <div className="chat-line system">{chat_markup(line.message.m)}</div>;
    }

    const message = line.message;
    const ts_ll = last_line ? new Date(last_line.message.t * 1000) : null;
    const ts = message.t ? new Date(message.t * 1000) : null;
    let third_person = false;
    let body = message.m;
    let show_date: JSX.Element | null = null;

    if (!last_line || (ts && ts_ll)) {
        if (ts) {
            if (
                !last_line ||
                moment(ts).format("YYYY-MM-DD") !== moment(ts_ll).format("YYYY-MM-DD")
            ) {
                show_date = <div className="date">{moment(ts).format("LL")}</div>;
            }
        }
    }

    if (typeof body === "string") {
        if (body.substr(0, 4) === "/me ") {
            third_person = body.substr(0, 4) === "/me ";
            body = body.substr(4);
        }

        if (/^\/senseis?\s/.test(body)) {
            body = generateChatSearchLine(
                "http://senseis.xmp.net/?search=",
                (/^\/senseis?\s/.exec(body) as string[])[0],
                body,
            );
        }

        if (body.substr(0, 8) === "/google ") {
            body = generateChatSearchLine("https://www.google.com/#q=", "/google ", body);
        }

        /* cspell:disable-next-line */
        if (body.substr(0, 8) === "/lmgtfy ") {
            /* cspell:disable-next-line */
            body = generateChatSearchLine("https://www.lmgtfy.com/?q=", "/lmgtfy ", body);
        }
    }

    const mentions = name_match_regex.test(body);

    let timestamp_str = "";
    if (ts) {
        const hours = ts.getHours();
        const minutes = ts.getMinutes();

        timestamp_str =
            (hours < 10 ? ` ${hours}` : hours.toString()) +
            ":" +
            (minutes < 10 ? `0${minutes}` : minutes.toString());
    }

    return (
        <div
            className={
                (third_person ? "chat-line third-person" : "chat-line") +
                (user.id === data.get("config.user").id ? " self" : ` chat-user-${user.id}`) +
                (mentions ? " mentions" : "")
            }
            data-chat-id={message.i}
        >
            {show_date}
            {ts && <span className="timestamp">[{timestamp_str}]</span>}
            {(user.id || null) && (
                <Player user={user} flare rank={false} noextracontrols disableCacheUpdate />
            )}
            {third_person ? " " : ": "}
            <span className="body">{chat_markup(body)}</span>
        </div>
    );
}

function generateChatSearchLine(urlString: string, command: string, body: string) {
    let target = "";
    const bodyString = body.substr(command.length);
    if (bodyString.split(" ")[0] === "-user") {
        target = bodyString.split(" ")[1] + " ";
    }

    const params = body.split(" ");
    if (target.length > 0) {
        return (
            target.slice(0, target.length - 1) +
            ": " +
            searchString(urlString, params.slice(3, params.length))
        );
    } else {
        return searchString(urlString, params.slice(1, params.length));
    }
}

function searchString(site: string, parameters: string[]) {
    if (parameters.length === 1) {
        return site + parameters[0];
    }

    return site + parameters[0] + "+" + parameters.slice(1, parameters.length).join("+").slice(0);
}
