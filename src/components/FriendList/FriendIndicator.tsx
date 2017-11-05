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
import {Link} from "react-router-dom";
import online_status from "online_status";
import * as data from "data";
import {get} from "requests";
import * as moment from "moment";
import {FriendList} from "./FriendList";
import {UIPush} from "UIPush";
import {KBShortcut} from "KBShortcut";


let friend_indicator_singleton:FriendIndicator;

export class FriendIndicator extends React.PureComponent<{}, any> {
    update_interval = null;
    friend_list = [];
    online_subscriptions = {};

    constructor(props) {
        super(props);
        this.state = {
            friends: [],
            online_ct: 0,
            show_friend_list: false,
        };
        friend_indicator_singleton = this;
    }

    componentWillMount() {
        data.watch("friends", this.updateFriends);
        online_status.event_emitter.on("users-online-updated", this.updateFriendCount);
        this.refresh();
    }

    updateFriendCount = () => {
        let ct = 0;
        for (let friend of this.friend_list) {
            if (!(friend.id in this.online_subscriptions)) {
                this.online_subscriptions[friend.id] = true;
                setTimeout(() => {
                    online_status.subscribe(friend.id, this.updateFriendCount);
                }, 1);
            }

            if (online_status.is_player_online(friend.id)) {
                ++ct;
            }
        }

        this.setState({
            online_ct: ct
        });
    }

    refresh() {
        get("ui/friends").then((res) => {
            data.set("friends", res.friends);
        }).catch((err) => {
            console.error("Error resolving friends list: ", err);
        });
    }

    updateFriends = (friends) => {
        this.friend_list = friends;
        this.updateFriendCount();
    }

    toggleFriendList = () => {
        this.setState({
            show_friend_list: !this.state.show_friend_list
        });
    }


    render() {
        if (this.friend_list.length === 0) {
            return null;
        }

        return (
            <span className={"FriendIndicator" + (this.state.online_ct ? " online" : "")} onClick={this.toggleFriendList}>
                <UIPush event="update-friend-list" action={this.refresh} />
                <i className="fa fa-users"/>
                <span className="count">{this.state.online_ct}</span>
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
