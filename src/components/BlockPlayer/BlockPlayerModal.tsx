/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {PopOver, popover, close_all_popovers} from "popover";
import {getBlocks, setIgnore, setGameBlock, setAnnouncementBlock} from "./BlockPlayer";



interface BlockPlayerModalProperties {
    playerId: number;
    inline?: boolean;
    onlyAnnouncements?: boolean; // only show block announcements line
}

export class BlockPlayerModal extends React.PureComponent<BlockPlayerModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = Object.assign({}, getBlocks(this.props.playerId));
    }

    UNSAFE_componentWillReceiveProps(next_props) {
        this.setState(getBlocks(next_props.playerId));
    }

    toggleChatBlock = () => {
        setIgnore(this.props.playerId, !this.state.block_chat);
        this.setState({block_chat: !this.state.block_chat});
    };

    toggleGameBlock = () => {
        setGameBlock(this.props.playerId, !this.state.block_games);
        this.setState({block_games: !this.state.block_games});
    };

    toggleAnnouncementBlock = () => {
        setAnnouncementBlock(this.props.playerId, !this.state.block_announcements);
        this.setState({block_announcements: !this.state.block_announcements});
    };


    render() {
        const show_block_chat = !this.props.onlyAnnouncements;
        const show_block_game = !this.props.onlyAnnouncements;
        const show_block_announcements = true;

        return (
            <div className={"BlockPlayerModal" + (this.props.inline ? " inline" : "")}>
                <div className="details">
                    {show_block_chat &&
                        <div className="block-option">
                            <input id={"block-chat-" + this.props.playerId} type="checkbox" checked={this.state.block_chat} onChange={this.toggleChatBlock} />
                            <label htmlFor={"block-chat-" + this.props.playerId}>{_("Ignore chats and private messages")}</label>
                        </div>
                    }
                    {show_block_game &&
                        <div className="block-option">
                            <input id={"block-game-" + this.props.playerId} type="checkbox" checked={this.state.block_games}  onChange={this.toggleGameBlock} />
                            <label htmlFor={"block-game-" + this.props.playerId}>{_("Block user from accepting my open games")}</label>
                        </div>
                    }
                    {show_block_announcements &&
                        <div className="block-option">
                            <input id={"block-announcements-" + this.props.playerId} type="checkbox" checked={this.state.block_announcements}  onChange={this.toggleAnnouncementBlock} />
                            <label htmlFor={"block-announcements-" + this.props.playerId}>{_("Block announcements from this person")}</label>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export function openBlockPlayerControls(ev, user_id): PopOver {
    const elt = $(ev.target);
    const offset = elt.offset();

    return popover({
        elt: (<BlockPlayerModal playerId={user_id} />),
        at: {x: offset.left, y: offset.top + elt.height()},
        minWidth: 300,
        minHeight: 50,
    });
}

