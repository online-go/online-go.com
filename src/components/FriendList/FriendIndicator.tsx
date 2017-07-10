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
import * as data from "data";
import {get} from "requests";
import * as player_cache from "player_cache";
import {FriendList} from "./FriendList";
import {UIPush} from "UIPush";
import {KBShortcut} from "KBShortcut";
import {Player, is_registered} from "data/Player";



let friend_indicator_singleton: FriendIndicator;

interface FriendIndicatorState {
    has_friends: boolean;
    online_count: number;
    show_friend_list: boolean;
}

export class FriendIndicator extends React.PureComponent<{}, FriendIndicatorState> {
    friends: Array<Player> = [];
    friends_subscribe: player_cache.Subscription;
    data_subscribe: data.Subscription<"friends">;

    constructor(props) {
        super(props);
        this.state = {
            has_friends: false,
            online_count: 0,
            show_friend_list: false
        };
        this.friends_subscribe = new player_cache.Subscription(this.updateFriendCount);
        this.data_subscribe = new data.Subscription(this.updateFriends);
        friend_indicator_singleton = this;
    }

    componentDidMount() {
        this.data_subscribe.to(["friends"]);
        this.refresh();
    }

    componentWillUnmount() {
        this.friends_subscribe.to([]);
    }

    updateFriends = (channel: "friends", friends: Array<Player>) => {
        // Update the component.
        this.friends_subscribe.to(friends);
        this.friends = friends;
        this.updateFriendCount();
    }

    updateFriendCount = () => {
        let count = 0;
        for (let friend of this.friends) {
            count += friend.is.online ? 1 : 0;
        }
        this.setState({
            has_friends: this.friends.length > 0,
            online_count: count
        });
    }

    refresh() {
        get("ui/friends", 0).then((friends: Array<Player>) => {
            data.set("friends", friends);
        }).catch((err) => {
            console.error("Error resolving friends list: ", err);
        });
    }

    toggleFriendList = () => {
        this.setState({
            show_friend_list: !this.state.show_friend_list
        });
    }

    render() {
        return !this.state.has_friends ? null : (
            <span className={"FriendIndicator" + (this.state.online_count ? " online" : "")} onClick={this.toggleFriendList}>
                <UIPush event="update-friend-list" action={this.refresh} />
                <i className="fa fa-users"/>
                <span className="count">{this.state.online_count}</span>
                {(this.state.show_friend_list || null) &&
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
    if (friend_indicator_singleton && friend_indicator_singleton.state.show_friend_list) {
        friend_indicator_singleton.setState({show_friend_list: false});
    }
}
