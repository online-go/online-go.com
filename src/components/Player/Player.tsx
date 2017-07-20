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
import {browserHistory} from "react-router";
import {shouldOpenNewTab, errorLogger} from "misc";
import {close_all_popovers, popover} from "popover";
import {close_friend_list} from 'FriendList/FriendIndicator';
import {PlayerDetails} from "./PlayerDetails";
import {Flag} from "Flag";
import {PlayerIcon} from "PlayerIcon";
import * as player_cache from "player_cache";
import {AbstractPlayer, AbstractPlayerProperties, AbstractPlayerState} from "./AbstractPlayer";
import {Player as PlayerType, RegisteredPlayer, is_guest, is_registered, player_name, player_attributes} from "data/Player";
import {Rank, rank_short_string, rank_long_string} from "data/Rank";



interface PlayerProperties extends AbstractPlayerProperties {
    icon?: boolean;         // Should we display the player's icon?
    iconSize?: number;      // And if we should, how big do we want it?
    flag?: boolean;         // Should we display the player's flag?
    rank?: boolean;         // Should we display the player's rank?
    flare?: boolean;        // Should we display the spanner and gavel icons that appear beside a user in the main chat?
    online?: boolean;       // Should we display the user's online status?

    nolink?: boolean;       // Disable the link to the player's profile page.
    noextracontrols?: boolean;  // Disable extra controls, such as appear in a game review.
 }

// A standard component for displaying brief player details. This component is
// used pervasively throughout the site. Clicking on the component will bring
// up a PlayerDetails box enabling more actions to be taken.
export class Player extends AbstractPlayer<PlayerProperties, AbstractPlayerState> {
    protected player_id: number;

    render() {
        let props = this.props;
        let state = this.state;
        let classes: Array<string> = [];

        classes.push("Player");
        props.icon && classes.push("Player-with-icon");
        state.guest && classes.push("guest");
        props.nolink && classes.push("nolink");
        props.noextracontrols && classes.push("noextracontrols");
        props.flare && classes.push("with-flare");
        props.online && classes.push("show-online");

        let className = classes.join(" ");
        if (state.className) {
            className += " ";
            className += state.className;
        }

        return (
            <span ref="player" className={className} onMouseDown={this.display_details}>
                {(props.icon || null) && <PlayerIcon icon={state.icon} size={props.iconSize || 16}/>}
                {(props.flag || null) && <Flag country={state.country}/>}
                <span className="username">{state.username}</span>
                {(props.rank || null) && <span className="rank">{state.short_rank}</span>}
            </span>
        );
    }

    display_details = (event) => {
        if (this.props.nolink || this.state.guest) {
            return;
        }
        else {
            event.stopPropagation();
        }

        if (shouldOpenNewTab(event)) {
            let uri = `/player/${this.player_id}`;
            let player = player_cache.lookup(this.player_id);
            if (player) {
                uri += "/" + encodeURIComponent(player.username);
            }
            window.open(uri, "_blank");
        }
        else if (this.props.nodetails) {
            close_all_popovers();
            browserHistory.push(`/player/${player_id}/`);
            return;
        }
        else {
            popover({
                elt: (<PlayerDetails user={this.props.user} disableCacheUpdate={this.props.disableCacheUpdate} noextracontrols={this.props.noextracontrols} />),
                below: this.refs.player,
                minWidth: 240,
                minHeight: 250,
            });
        }
    }
}
