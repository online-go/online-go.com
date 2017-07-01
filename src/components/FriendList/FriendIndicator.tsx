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
import data from "data";
import {get} from "requests";
import * as player_cache from "player_cache";
import {player_subscription} from "player_cache";
import {FriendList} from "./FriendList";
import {UIPush} from "UIPush";
import {KBShortcut} from "KBShortcut";
import {Player, is_registered} from "data/Player";
import {Subscription} from "pubsub";



let friend_indicator_singleton: FriendIndicator;

interface FriendIndicatorState {
    has_friends: boolean;
    online_count: number;
    show_friend_list: boolean;
}

export class FriendIndicator extends React.PureComponent<{}, FriendIndicatorState> {
    friends: Array<Player> = [];
    subscriptions: {[player_id: number]: Subscription} = {};

    constructor(props) {
        super(props);
        this.state = {
            has_friends: false,
            online_count: 0,
            show_friend_list: false
        };
        friend_indicator_singleton = this;
    }

    componentWillMount() {
        data.watch("friends", this.updateFriends);
        this.refresh();
    }

    updateFriends = (friends: Array<any>) => {
        // Convert the server's data to the new format.
        let new_style_friends: Array<Player> = [];
        for (let friend of friends) {
            new_style_friends.push(player_cache.update(friend));
        }

        // Calculate the new set of subscriptions.
        let new_subscriptions: {[player_id: number]: Subscription} = {};
        let old_subscriptions: {[player_id: number]: Subscription} = this.subscriptions;
        for (let friend of this.friends) {
            new_subscriptions[friend.id] =
                this.subscriptions[friend.id] ||
                player_subscription(friend.id, this.updateFriendCount).subscribe();
        }

        // Update the component.
        this.friends = new_style_friends;
        this.subscriptions = new_subscriptions;
        this.updateFriendCount();

        // Unsubscribe from lost friends. Weep softly and mourn.
        for (let friend of this.friends) {
            delete old_subscriptions[friend.id];
        }
        for (let player_id in old_subscriptions) {
            old_subscriptions[player_id].unsubscribe();
        }
    }

    updateFriendCount = () => {
        let count = 0;
        for (let friend of this.friends) {
            count += (is_registered(friend) && friend.is.online) ? 1 : 0;
        }
        this.setState({
            has_friends: this.friends.length > 0,
            online_count: count
        });
    }

    refresh() {
        get("ui/friends").then((res) => {
            data.set("friends", res.friends);
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
