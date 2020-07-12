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

import * as React from "react";
import * as preferences from "preferences";
import { Player } from "Player";
import { _, interpolate } from "translate";
import { comm_socket } from "sockets";
import { useEffect, useState, useCallback } from "react";
import { string_splitter, n2s, dup, Timeout} from "misc";
import { PlayerCacheEntry } from "player_cache";
import { chat_manager, users_by_rank, ChatChannelProxy } from 'chat_manager';



interface ChatUser extends PlayerCacheEntry {
    professional: boolean;
}

interface ChatUsersListProperties {
    channel: string;
}

interface ChatUsersListState {
    online_count: number;
    user_list: {[player_id:string]: ChatUser};
    user_sort_order: 'alpha' | 'rank';
}

let deferred_users_update:Timeout = null;

export function ChatUsersList({channel}:ChatUsersListProperties):JSX.Element {
    let [, refresh]:[number, (n:number) => void] = useState(0);
    let [proxy, setProxy]:[ChatChannelProxy | null, (x:ChatChannelProxy) => void] = useState(null);
    let [user_sort_order, set_user_sort_order]: [string, (s:string) => void] = useState(preferences.get("chat.user-sort-order"));
    let [online_count, set_online_count]: [number, (n:number) => void] = useState(0);

    useEffect(() => {
        let proxy = chat_manager.join(channel);
        setProxy(proxy);
        proxy.on("join", syncStateSoon);
        proxy.on("part", syncStateSoon);
        syncStateSoon();

        let online_count_interval = setInterval(() => {
            comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => set_online_count(ct));
        }, 30000);
        comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => set_online_count(ct));

        return () => {
            clearInterval(online_count_interval);
            proxy.part();
            if (deferred_users_update) {
                clearTimeout(deferred_users_update);
                deferred_users_update = null;
            }
        };
    }, [channel]);

    const toggleSortOrder = useCallback(():void => {
        let new_sort_order:'rank' | 'alpha' = preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        set_user_sort_order(new_sort_order);
    }, [channel]);



    if (!proxy) {
        return <div className='ChatUsersList' />;
    }

    let sorted_user_list = [];
    for (let id in proxy?.channel.user_list) {
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
        <div className='ChatUsersList'>
            <div className="user-header" onClick={toggleSortOrder}>
                <i className={user_sort_order === "rank" ? "fa fa-sort-numeric-asc" : "fa fa-sort-alpha-asc"} /> {
                    interpolate(
                        _("Users ({{total_online}} online : {{in_chat}} chat)"),
                        {"total_online": online_count, "in_chat": sorted_user_list.length}
                    )
                }
            </div>

            {sorted_user_list.map((user) => <div key={user.id}><Player user={user} flag rank noextracontrols /></div>)}
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

