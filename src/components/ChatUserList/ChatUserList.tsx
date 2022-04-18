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

import * as React from "react";
import { _, interpolate } from "translate";
import { chat_manager, ChatChannelProxy } from "chat_manager";
import * as preferences from "preferences";
import { Player } from "Player";

interface ChatUserListProperties {
    channel: string;
}

interface ChatUserCountProperties extends ChatUserListProperties {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    active: boolean;
}

export function ChatUserList(props: ChatUserListProperties): JSX.Element {
    const [user_sort_order, set_user_sort_order] = React.useState<"alpha" | "rank">(
        preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank",
    );
    const [, refresh] = React.useState<number>(0);
    const proxy = React.useRef<ChatChannelProxy>();

    React.useEffect(() => {
        proxy.current = chat_manager.join(props.channel);
        proxy.current.on("join", () => refresh(proxy.current.channel.users_by_name.length));
        proxy.current.on("part", () => refresh(proxy.current.channel.users_by_name.length));
        proxy.current.on("join", () => console.log("JOin!"));
        proxy.current.on("part", () => console.log("Part!"));
        window["proxy"] = proxy.current;
        refresh(proxy.current.channel.users_by_name.length);

        return () => {
            proxy.current.part();
        };
    }, [props.channel]);

    const toggleSortOrder = () => {
        const new_sort_order =
            preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        set_user_sort_order(new_sort_order);
    };

    const sorted_users: Array<any> = proxy.current
        ? user_sort_order === "alpha"
            ? proxy.current.channel.users_by_name
            : proxy.current.channel.users_by_rank
        : [];

    return (
        <div className="ChatUserList">
            <div className="user-header" onClick={toggleSortOrder}>
                <i
                    className={
                        user_sort_order === "rank"
                            ? "fa fa-sort-numeric-asc"
                            : "fa fa-sort-alpha-asc"
                    }
                />{" "}
                {interpolate(_("Users : {{in_chat}}"), { in_chat: sorted_users.length })}
            </div>

            {sorted_users.map((user) => (
                <div key={user.id}>
                    <Player user={user} flag rank />
                </div>
            ))}
        </div>
    );
}

export function ChatUserCount(props: ChatUserCountProperties): JSX.Element {
    const [num_users, set_num_users] = React.useState<number>(0);
    const proxy = React.useRef<ChatChannelProxy>();

    React.useEffect(() => {
        proxy.current = chat_manager.join(props.channel);
        proxy.current.on("join", () => set_num_users(num_users + 1));
        proxy.current.on("part", () => set_num_users(num_users - 1));
        set_num_users(proxy.current.channel.users_by_name.length);

        return () => {
            proxy.current.part();
        };
    }, [props.channel]);

    return (
        <button
            onClick={props.onClick}
            className={"chat-input-player-list-toggle sm" + (props.active ? " active" : "")}
        >
            <i className="fa fa-users" />{" "}
            {proxy.current ? proxy.current.channel.users_by_name.length : ""}
        </button>
    );
}
