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
import { _, interpolate } from "translate";
import { chat_manager, ChatChannelProxy } from "chat_manager";
import * as preferences from "preferences";
import { Player } from "Player";
import { GameChat } from "Game/Chat";

interface ChatUserListProperties {
    channel: string;
}

interface ChatUserCountProperties extends ChatUserListProperties {
    chat: GameChat;
    active: boolean;
}

interface ChatUsersState {
    tick: number;
}

export class ChatUsers<
    P extends ChatUserListProperties,
    S extends ChatUsersState,
> extends React.PureComponent<P, S> {
    proxy: ChatChannelProxy;

    constructor(props) {
        super(props);
        (this.state as ChatUsersState) = { tick: 0 };
    }
    componentDidMount() {
        this.init(this.props.channel);
    }
    UNSAFE_componentWillReceiveProps(next_props) {
        if (this.props.channel !== next_props.channel) {
            this.deinit();
            this.init(next_props.channel);
        }
    }
    //componentDidUpdate(old_props, old_state) { }
    componentWillUnmount() {
        this.deinit();
    }

    init(channel) {
        this.proxy = chat_manager.join(channel);
        this.proxy.on("join", () => this.setState({ tick: this.state.tick + 1 }));
        this.proxy.on("part", () => this.setState({ tick: this.state.tick + 1 }));
    }
    deinit() {
        this.proxy.part();
        this.proxy = null;
    }
}

interface ChatUserListState extends ChatUsersState {
    user_sort_order: "alpha" | "rank";
}

export class ChatUserList extends ChatUsers<ChatUserListProperties, ChatUserListState> {
    constructor(props) {
        super(props);
        (this.state as any).user_sort_order = preferences.get("chat.user-sort-order");
    }

    toggleSortOrder = () => {
        const new_sort_order =
            preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        this.setState({ user_sort_order: new_sort_order });
    };

    render() {
        const sorted_users: Array<any> =
            this.state.user_sort_order === "alpha"
                ? this.proxy.channel.users_by_name
                : this.proxy.channel.users_by_rank;

        return (
            <div className="ChatUserList">
                <div className="user-header" onClick={this.toggleSortOrder}>
                    <i
                        className={
                            this.state.user_sort_order === "rank"
                                ? "fa fa-sort-numeric-asc"
                                : "fa fa-sort-alpha-asc"
                        }
                    />{" "}
                    {interpolate(_("Users : {{in_chat}}"), { in_chat: sorted_users.length })}
                </div>

                {sorted_users.map((user) => (
                    <div key={user.id}>
                        <Player user={user} flag rank />
                    </div>
                ))}
            </div>
        );
    }
}

export class ChatUserCount extends ChatUsers<ChatUserCountProperties, ChatUsersState> {
    render() {
        return (
            <button
                onClick={this.props.chat.togglePlayerList}
                className={
                    "chat-input-player-list-toggle sm" + (this.props.active ? " active" : "")
                }
            >
                <i className="fa fa-users" />{" "}
                {this.proxy ? this.proxy.channel.users_by_name.length : ""}
            </button>
        );
    }
}
