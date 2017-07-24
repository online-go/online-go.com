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
import online_status from "online_status";
import data from "data";
import {post, get, abort_requests_in_flight} from "requests";
import {Player} from "Player";


interface FriendListProperties {
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

export class FriendList extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            friends: [],
            resolved: false
        };
    }
    friends_listener:any;

    updateFriends = (friends) => {
        this.setState({
            friends: this.sortFriends(friends),
            resolved: true
        });
    }

    componentDidMount() {{{
        this.friends_listener = data.watch("friends", this.updateFriends); /* this is managed by our FriendIndicator */
        online_status.event_emitter.on("users-online-updated", this.resortFriends);
    }}}
    componentWillUnmount() {{{
        this.friends_listener.remove();
        online_status.event_emitter.off("users-online-updated", this.resortFriends);
    }}}
    resortFriends = () => {
        this.setState({"friends": this.sortFriends(this.state.friends)});
    }
    sortFriends(lst) {{{
        let ret = [].concat(lst);
        ret.sort((a, b) => {
            let a_online = online_status.is_player_online(a.id);
            let b_online = online_status.is_player_online(b.id);
            if (a_online && !b_online) {
                return -1;
            }
            if (b_online && !a_online) {
                return 1;
            }
            return a.username.localeCompare(b.username);
        });
        return ret;
    }}}
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

