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
import {post, get} from "requests";
import {PopOver, popover, close_all_popovers} from "popover";
import {getBlocks, setIgnore, setGameBlock} from "./BlockPlayer";



interface BlockPlayerModalProperties {
    playerId: number;
}

export class BlockPlayerModal extends React.PureComponent<BlockPlayerModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = Object.assign({}, getBlocks(this.props.playerId));
    }

    componentWillReceiveProps(next_props) {
        this.setState(getBlocks(next_props.playerId));
    }

    toggleChatBlock = () => {
        setIgnore(this.props.playerId, !this.state.block_chat);
        this.setState({block_chat: !this.state.block_chat});
    }

    toggleGameBlock = () => {
        setGameBlock(this.props.playerId, !this.state.block_chat);
        this.setState({block_games: !this.state.block_games});
    }

    render() {
        return (
            <div className="BlockPlayerModal">
                <div className="details">
                    <div className="block-option">
                        <input id="block-chat" type="checkbox" checked={this.state.block_chat} onChange={this.toggleChatBlock} /> 
                        <label htmlFor="block-chat">{_("Ignore chats and private messages")}</label>
                    </div>
                    <div className="block-option">
                        <input id="block-game" type="checkbox" checked={this.state.block_games}  onChange={this.toggleGameBlock} /> 
                        <label htmlFor="block-game">{_("Block user from accepting my open games")}</label>
                    </div>
                </div>
            </div>
        );
    }
}

export function openBlockPlayerControls(ev, user_id): PopOver {
    let elt = $(ev.target);
    let offset = elt.offset();

    return popover({
        elt: (<BlockPlayerModal playerId={user_id} />),
        at: {x: offset.left, y: offset.top + elt.height()},
        minWidth: 300,
        minHeight: 50,
    });
}

