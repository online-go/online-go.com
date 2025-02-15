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
import { _ } from "@/lib/translate";
import online_status from "@/lib/online_status";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { Player } from "@/components/Player";
import cached from "@/lib/cached";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { get, post } from "@/lib/requests";
import { push_manager } from "../UIPush";
import { player_is_ignored } from "../BlockPlayer";
export function FriendList() {
    const [friends, setFriends] = React.useState<PlayerCacheEntry[]>([]);
    const [showOfflineFriends, setShowOfflineFriends] = React.useState(
        preferences.get("show-offline-friends"),
    );
    const [invitations, setInvitations] = React.useState<rest_api.FriendInvitations>([]);

    React.useEffect(() => {
        const update_friend_list = () => {
            get("me/friends/invitations/")
                .then((invitations: rest_api.FriendInvitations) => {
                    setInvitations(invitations);
                })
                .catch((err) => {
                    console.error(err);
                });
        };

        update_friend_list();
        const handler = push_manager.on("update-friend-list", update_friend_list);

        return () => {
            push_manager.off(handler);
        };
    }, []);

    const sortFriends = React.useCallback((lst: PlayerCacheEntry[]) => {
        const ret = [...lst];
        ret.sort((a, b) => {
            const a_online = online_status.is_player_online(a.id);
            const b_online = online_status.is_player_online(b.id);
            if (a_online && !b_online) {
                return -1;
            }
            if (b_online && !a_online) {
                return 1;
            }
            if (!a.username) {
                return 1;
            }
            if (!b.username) {
                return -1;
            }
            return a.username.localeCompare(b.username);
        });
        return ret;
    }, []);

    const updateFriends = React.useCallback(
        (newFriends: PlayerCacheEntry[]) => {
            setFriends(sortFriends(newFriends));
        },
        [sortFriends],
    );

    const resortFriends = React.useCallback(() => {
        setFriends((friends) => sortFriends(friends));
    }, [sortFriends]);

    React.useEffect(() => {
        data.watch(cached.friends, updateFriends);
        online_status.event_emitter.on("users-online-updated", resortFriends);

        return () => {
            data.unwatch(cached.friends, updateFriends);
            online_status.event_emitter.off("users-online-updated", resortFriends);
        };
    }, [updateFriends, resortFriends]);

    const handleShowOfflineFriends = (ev: React.ChangeEvent<HTMLInputElement>) => {
        preferences.set("show-offline-friends", ev.target.checked);
        setShowOfflineFriends(ev.target.checked);
        ev.stopPropagation();
    };

    const eat = (ev: React.MouseEvent) => {
        ev.stopPropagation();
    };

    const acceptInvite = (invitation: rest_api.FriendInvitations[number]) => {
        setInvitations(invitations.filter((inv) => inv.from_user.id !== invitation.from_user.id));
        post("me/friends/invitations/", { from_user: invitation.from_user.id })
            .then(() => 0)
            .catch(() => 0);
    };

    const rejectInvite = (invitation: rest_api.FriendInvitations[number]) => {
        setInvitations(invitations.filter((inv) => inv.from_user.id !== invitation.from_user.id));
        post("me/friends/invitations/", { from_user: invitation.from_user.id, delete: true })
            .then(() => 0)
            .catch(() => 0);
    };

    return (
        <div className="FriendList">
            <div className="show-offline">
                <input
                    id="show-offline-friends"
                    type="checkbox"
                    checked={showOfflineFriends}
                    onClick={eat}
                    onChange={handleShowOfflineFriends}
                />
                <label onClick={eat} htmlFor="show-offline-friends">
                    {_("Show offline")}
                </label>
            </div>
            {invitations.map((invitation) => {
                if (player_is_ignored(invitation.from_user.id)) {
                    return null;
                }

                return (
                    <div className="friend-invitation" key={invitation.from_user.id}>
                        <i className="fa fa-times" onClick={() => rejectInvite(invitation)} />
                        <i className="fa fa-check" onClick={() => acceptInvite(invitation)} />
                        <Player
                            user={invitation.from_user}
                            online
                            rank
                            noextracontrols
                            shownotesindicator
                        />
                    </div>
                );
            })}
            {friends.map(
                (friend: PlayerCacheEntry) =>
                    (online_status.is_player_online(friend.id) || showOfflineFriends) && (
                        <div className="friend-entry" key={friend.id}>
                            <Player user={friend} online rank noextracontrols shownotesindicator />
                        </div>
                    ),
            )}
            {(friends.length === 0 || null) && null}
        </div>
    );
}
