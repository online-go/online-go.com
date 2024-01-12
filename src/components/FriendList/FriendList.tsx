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
import { _ } from "translate";
import online_status from "online_status";
import * as data from "data";
import * as preferences from "preferences";
import { Player } from "Player";
import cached from "cached";
import { PlayerCacheEntry } from "src/lib/player_cache";

export class FriendList extends React.PureComponent<{}, any> {
    constructor(props: {}) {
        super(props);
        this.state = {
            friends: [] as PlayerCacheEntry[],
            show_offline_friends: preferences.get("show-offline-friends"),
        };
    }
    friends_listener: any;

    updateFriends = (friends: PlayerCacheEntry[]) => {
        this.setState({
            friends: this.sortFriends(friends),
        });
    };

    componentDidMount() {
        data.watch(cached.friends, this.updateFriends); /* this is managed by our FriendIndicator */
        online_status.event_emitter.on("users-online-updated", this.resortFriends);
    }
    componentWillUnmount() {
        data.unwatch(cached.friends, this.updateFriends);
        online_status.event_emitter.off("users-online-updated", this.resortFriends);
    }
    resortFriends = () => {
        this.setState({ friends: this.sortFriends(this.state.friends) });
    };
    sortFriends(lst: PlayerCacheEntry[]) {
        const ret: any[] = ([] as PlayerCacheEntry[]).concat(lst);
        ret.sort((a, b) => {
            const a_online = online_status.is_player_online(a.id);
            const b_online = online_status.is_player_online(b.id);
            if (a_online && !b_online) {
                return -1;
            }
            if (b_online && !a_online) {
                return 1;
            }
            return a.username.localeCompare(b.username);
        });
        return ret;
    }
    setShowOfflineFriends = (ev: React.ChangeEvent<HTMLInputElement>) => {
        preferences.set("show-offline-friends", ev.target.checked);
        this.setState({ show_offline_friends: preferences.get("show-offline-friends") });
        ev.stopPropagation();
    };
    clickShowOfflineFriends = (ev: React.MouseEvent) => {
        ev.stopPropagation();
    };
    eat = (ev: React.MouseEvent) => {
        ev.stopPropagation();
    };

    render() {
        return (
            <div className="FriendList">
                <div className="show-offline">
                    <input
                        id="show-offline-friends"
                        type="checkbox"
                        checked={this.state.show_offline_friends}
                        onClick={this.clickShowOfflineFriends}
                        onChange={this.setShowOfflineFriends}
                    />{" "}
                    <label onClick={this.eat} htmlFor="show-offline-friends">
                        {_("Show offline")}
                    </label>
                </div>
                {this.state.friends.map(
                    (friend: PlayerCacheEntry) =>
                        (online_status.is_player_online(friend.id) ||
                            this.state.show_offline_friends) && (
                            <div className="friend-entry" key={friend.id}>
                                <Player
                                    user={friend}
                                    online
                                    rank
                                    noextracontrols
                                    shownotesindicator
                                />
                            </div>
                        ),
                )}
                {(this.state.friends.length === 0 || null) && null}
            </div>
        );
    }
}
