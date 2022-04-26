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
import online_status from "online_status";
import * as data from "data";
import { FriendList } from "./FriendList";
import { KBShortcut } from "KBShortcut";
import cached from "cached";

const online_subscriptions = {};
let ext_setShowFriendList = (_tf: boolean) => {
    /* noop */
};

export function FriendIndicator(): JSX.Element {
    const user = data.get("user");
    const [show_friend_list, setShowFriendList] = React.useState(false);
    const [online_ct, setOnlineCt] = React.useState(0);
    const [, refresh] = React.useState(0);
    const friend_list = React.useRef([]);

    ext_setShowFriendList = setShowFriendList;

    React.useEffect(() => {
        if (user.id) {
            const updateFriendCount = () => {
                let ct = 0;
                for (const friend of friend_list.current) {
                    if (!(friend.id in online_subscriptions)) {
                        online_subscriptions[friend.id] = true;
                        setTimeout(() => {
                            online_status.subscribe(friend.id, updateFriendCount);
                        }, 1);
                    }

                    if (online_status.is_player_online(friend.id)) {
                        ++ct;
                    }
                }

                setOnlineCt(ct);
            };

            const updateFriends = (friends: any[]) => {
                friend_list.current = friends;
                updateFriendCount();
                refresh(Math.random());
            };

            data.watch(cached.friends, updateFriends);
            online_status.event_emitter.on("users-online-updated", updateFriendCount);
        }
    }, [user.id]);

    const toggleFriendList = () => {
        setShowFriendList(!show_friend_list);
    };

    if (friend_list.current.length === 0) {
        return null;
    }

    return (
        <span
            className={"FriendIndicator" + (online_ct ? " online" : "")}
            onClick={toggleFriendList}
        >
            <i className="fa fa-users" />
            <span className="count">{online_ct}</span>
            {(show_friend_list || null) && (
                <div>
                    <KBShortcut shortcut="escape" action={toggleFriendList} />
                    <div className="FriendListBackdrop" onClick={toggleFriendList} />
                    <FriendList />
                </div>
            )}
        </span>
    );
}

export function close_friend_list() {
    ext_setShowFriendList(false);
}
