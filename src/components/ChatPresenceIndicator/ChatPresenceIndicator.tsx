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
import { _ } from "@/lib/translate";
import { chat_manager, ChatChannelProxy } from "@/lib/chat_manager";

interface ChatPresenceIndicatorProperties {
    channel: string;
    userId: number;
}

interface ChatPresenceIndicatorState {
    online: boolean;
}

export class ChatPresenceIndicator extends React.PureComponent<
    ChatPresenceIndicatorProperties,
    ChatPresenceIndicatorState
> {
    proxy?: ChatChannelProxy;

    constructor(props: ChatPresenceIndicatorProperties) {
        super(props);
        this.state = {
            online: false,
        };
    }

    componentDidMount() {
        this.init(this.props.channel, this.props.userId);
    }

    componentDidUpdate(prev_props: ChatPresenceIndicatorProperties) {
        if (this.props.channel !== prev_props.channel || this.props.userId !== prev_props.userId) {
            this.deinit();
            this.init(this.props.channel, this.props.userId);
        }
    }
    componentWillUnmount() {
        this.deinit();
    }

    init(channel: string, user_id: number) {
        this.proxy = chat_manager.join(channel);
        this.proxy.on("join", () => this.update(user_id));
        this.proxy.on("part", () => this.update(user_id));
        this.update(user_id);
    }
    deinit() {
        this.proxy?.part();
        this.proxy = undefined;
    }
    update = (user_id: number) => {
        if (this.proxy) {
            const online = user_id in this.proxy.channel.user_list;
            if (this.state.online !== online) {
                this.setState({ online: online });
            }
        }
    };

    render() {
        return (
            <i
                className={`ChatPresenceIndicator ${
                    this.state.online ? "online" : ""
                } fa fa-circle`}
                title={this.state.online ? _("Online") : _("Offline")}
            />
        );
    }
}
