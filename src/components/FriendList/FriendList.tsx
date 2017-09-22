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
import {observe_online} from "online_status";
import * as data from "data";
import {post, get, abort_requests_in_flight} from "requests";
import {Player} from "Player";
import * as player_cache from "player_cache";
import {RegisteredPlayer, by_username} from "data/Player";

interface FriendIndicatorState {
    friends: Array<number>;
}

export class FriendList extends React.PureComponent<{}, FriendIndicatorState> {
    subscriber = new player_cache.Subscriber(player => this.forceUpdate());

    constructor(props) {
        super(props);
        this.state = {friends: []};
    }

    componentDidMount() {
        data.watch("friends", this.updateFriends); // This is managed by the FriendIndicator.
        this.subscriber.to(this.state.friends);
    }

    componentWillUnmount() {
        this.subscriber.to([]);
        data.unwatch("friends", this.updateFriends);
    }

    updateFriends = (friends: Array<RegisteredPlayer>) => {
        this.setState({friends: friends.map(friend => friend.id)});
    }

    render() {
        let friends = this.state.friends.map(player_cache.lookup).sort(online_first);
        return (
            <div className="FriendList">
                {friends.map(friend => (
                    <div key={friend.id} >
                        <Player user={friend.id} online rank noextracontrols using_cache/>
                    </div>
                ))}
            </div>
        );
    }
}

function online_first(a: RegisteredPlayer, b: RegisteredPlayer): number {
    if (a.is.online && !b.is.online) {
        return -1;
    }
    if (!a.is.online && b.is.online) {
        return 1;
    }
    return by_username(a, b);
}
