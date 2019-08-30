/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {post, get} from "requests";
import {errorAlerter} from "misc";
import {chat_manager, ChatChannelProxy} from "chat_manager";
import * as preferences from "preferences";
import {Player} from "Player";

interface ChatPresenceIndicatorProperties {
    channel: string;
    userId: number;
}

export class ChatPresenceIndicator extends React.PureComponent<ChatPresenceIndicatorProperties, any> {
    proxy: ChatChannelProxy;

    constructor(props) {
        super(props);
        this.state = {
            online: false,
        };
    }

    UNSAFE_componentWillMount() {{{
        this.init(this.props.channel, this.props.userId);
    }}}
    UNSAFE_componentWillReceiveProps(next_props) {{{
        if (this.props.channel !== next_props.channel) {
            this.deinit();
            this.init(next_props.channel, next_props.userId);
        }
    }}}
    componentWillUnmount() {{{
        this.deinit();
    }}}

    init(channel, user_id) {{{
        this.proxy = chat_manager.join(channel, user_id);
        this.proxy.on("join", () => this.update(user_id));
        this.proxy.on("part", () => this.update(user_id));
        this.update(user_id);
    }}}
    deinit() {{{
        this.proxy.part();
        this.proxy = null;
    }}}
    update = (user_id) => {{{
        let online = user_id in this.proxy.channel.user_list;
        if (this.state.online !== online) {
            this.setState({online: online});
        }
    }}}
    toggleSortOrder = () => {{{
        let new_sort_order = preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        this.setState({"user_sort_order": new_sort_order});
    }}}


    render() {
        return (
            <i className={`ChatPresenceIndicator ${this.state.online ? "online" : ""} fa fa-circle`} title={this.state.online ? _("Online") : _("Offline")} />
        );
    }
}

