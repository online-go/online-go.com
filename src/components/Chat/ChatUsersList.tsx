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
import * as preferences from "preferences";
import { Player } from "Player";
import { _, interpolate } from "translate";
import { socket } from "sockets";
import { useEffect, useState, useCallback } from "react";
import { Timeout } from "misc";
import { chat_manager, users_by_rank, ChatChannelProxy } from "chat_manager";

interface ChatUsersListProperties {
    channel: string;
}

let deferred_users_update: Timeout | null = null;

export function ChatUsersList({ channel }: ChatUsersListProperties): JSX.Element {
    const [, refresh]: [number, (n: number) => void] = useState(0);
    const [proxy, setProxy]: [ChatChannelProxy | null, (x: ChatChannelProxy) => void] =
        useState<ChatChannelProxy | null>(null);
    const [user_sort_order, set_user_sort_order]: [string, (s: string) => void] = useState(
        preferences.get("chat.user-sort-order"),
    );
    const [online_count, set_online_count]: [number, (n: number) => void] = useState(0);

    useEffect(() => {
        const proxy = chat_manager.join(channel);
        setProxy(proxy);
        proxy.on("join", syncStateSoon);
        proxy.on("part", syncStateSoon);
        syncStateSoon();

        const online_count_interval = setInterval(() => {
            socket.send("stats/online", { interval: 1800 }, (ct) => set_online_count(ct));
        }, 30000);
        socket.send("stats/online", { interval: 1800 }, (ct) => set_online_count(ct));

        return () => {
            clearInterval(online_count_interval);
            proxy.part();
            if (deferred_users_update) {
                clearTimeout(deferred_users_update);
                deferred_users_update = null;
            }
        };
    }, [channel]);

    const toggleSortOrder = useCallback((): void => {
        const new_sort_order: "rank" | "alpha" =
            preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        set_user_sort_order(new_sort_order);
    }, [channel]);

    if (!proxy) {
        return <div className="ChatUsersList" />;
    }

    const sorted_user_list: any[] = [];
    for (const id in proxy?.channel.user_list) {
        sorted_user_list.push(proxy?.channel.user_list[id]);
    }

    if (user_sort_order === "rank") {
        sorted_user_list.sort(users_by_rank);
    } else {
        sorted_user_list.sort((a, b) => {
            return a.username.localeCompare(b.username);
        });
    }

    return (
        <div className="ChatUsersList">
            <div className="user-header" onClick={toggleSortOrder}>
                <i
                    className={
                        user_sort_order === "rank"
                            ? "fa fa-sort-numeric-asc"
                            : "fa fa-sort-alpha-asc"
                    }
                />{" "}
                {interpolate(_("Users ({{total_online}} online : {{in_chat}} chat)"), {
                    total_online: online_count,
                    in_chat: sorted_user_list.length,
                })}
            </div>

            {sorted_user_list.map((user) => (
                <div key={user.id}>
                    <Player user={user} flag rank noextracontrols />
                </div>
            ))}
        </div>
    );

    function syncStateSoon() {
        if (!deferred_users_update) {
            deferred_users_update = setTimeout(() => {
                deferred_users_update = null;
                refresh(Math.random());
            }, 20);
        }
    }
}
