/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {errorAlerter} from "misc";
import * as data from "data";
import {post, get, abort_requests_in_flight} from "requests";
import {Player} from "Player";
import {Player as PlayerType, by_name} from "data/Player";
import * as player_cache from "player_cache";



export class FriendList extends React.PureComponent<{}, any> {
    friends_subscribe: player_cache.Subscription;
    data_subscribe: data.Subscription<"friends">;

    constructor(props) {
        super(props);
        this.state = {
            friends: [],
            resolved: false
        };
        this.friends_subscribe = new player_cache.Subscription(this.resortFriends);
        this.data_subscribe = new data.Subscription(this.updateFriends);
    }

    updateFriends = (channel: "friends", friends: Array<any>) => {
        let new_style_friends = friends.map((friend) => player_cache.update(friend));
        new_style_friends.sort(by_status);
        this.friends_subscribe.to(new_style_friends);
        this.setState({
            friends: new_style_friends,
            resolved: true
        });
    }

    componentDidMount() {{{
        this.data_subscribe.to(["friends"]); /* This is managed by our FriendIndicator */
    }}}
    componentWillUnmount() {{{
        this.data_subscribe.to([]);
        this.friends_subscribe.to([]);
    }}}
    resortFriends = () => {
        this.state.friends.sort(by_status);
        this.forceUpdate();
    }
    render() {
        if (!this.state.resolved) {
            return null;
        }

        return (
            <div className="FriendList">
                {this.state.friends.map((friend) => (
                    <div key={friend.id} >
                        <Player user={friend} online rank noextracontrols />
                    </div>
                ))}
                {(this.state.friends.length === 0 || null) &&
                    null
                }
            </div>
        );
    }
}

function by_status(a: PlayerType, b: PlayerType): number {
    let result = 0;
    result = (b.is.online ? 1 : 0) - (a.is.online ? 1 : 0);
    return result || by_name(a, b);
}
