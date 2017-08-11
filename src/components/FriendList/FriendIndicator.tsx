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
import {observe_online} from "online_status";
import * as data from "data";
import {get} from "requests";
import {FriendList} from "./FriendList";
import {UIPush} from "UIPush";
import {KBShortcut} from "KBShortcut";
import {RegisteredPlayer} from "data/Player";
import * as player_cache from "player_cache";



let friend_indicator_singleton: FriendIndicator;

interface FriendIndicatorState {
    online_count: number;
    has_friends: boolean;
    show_friends: boolean;
}

export class FriendIndicator extends React.PureComponent<{}, FriendIndicatorState> {
    friends: Array<number>;
    subscriber: player_cache.Subscriber;

    constructor(props) {
        super(props);
        this.state = {
            online_count: 0,
            has_friends: false,
            show_friends: false,
        };
        friend_indicator_singleton = this;
        this.subscriber = new player_cache.Subscriber(this.updateFriendCount);
    }

    componentDidMount() {
        data.watch("friends", this.updateFriendList);
        this.subscriber.to(this.friends);
        this.refresh();
    }

    componentWillUnmount() {
        this.subscriber.to([]);
        data.unwatch("friends", this.updateFriendList);
    }

    refresh() {
        get("ui/friends")
        .then(friends => data.set("friends", friends))
        .catch(err => console.error("Error resolving friends list: ", err));
    }

    updateFriendList = (friends: Array<RegisteredPlayer>) => {
        let ids: Array<number> = friends.map(friend => friend.id);
        observe_online(...ids);
        friends.forEach(player_cache.update);
        this.friends = ids;
        this.subscriber.to(ids);
        this.setState({has_friends: ids.length > 0});
        this.updateFriendCount();
    }

    updateFriendCount = () => {
        let friends = this.friends.map(player_cache.lookup);
        let online_count = friends.reduce((sum, friend) => friend.is.online ? sum + 1 : sum, 0);
        this.setState({online_count: online_count});
    }

    toggleFriendList = () => {
        this.setState({show_friends: !this.state.show_friends});
    }

    render() {
        if (!this.state.has_friends) {
            return null;
        }

        return (
            <span className={"FriendIndicator" + (this.state.online_count ? " online" : "")} onClick={this.toggleFriendList}>
                <UIPush event="update-friend-list" action={this.refresh} />
                <i className="fa fa-users"/>
                <span className="count">{this.state.online_count}</span>
                {(this.state.show_friends || null) &&
                    <div>
                        <KBShortcut shortcut="escape" action={this.toggleFriendList}/>
                        <div className='FriendListBackdrop' onClick={this.toggleFriendList} />
                        <FriendList />
                    </div>
                }
            </span>
        );
    }
}

export function close_friend_list() {
    if (friend_indicator_singleton && friend_indicator_singleton.state.show_friends) {
        friend_indicator_singleton.setState({show_friends: false});
    }
}
