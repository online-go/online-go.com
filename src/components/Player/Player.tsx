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
import {rankString, getUserRating, is_novice} from "rank_utils";
import {close_all_popovers, popover} from "popover";
import {close_friend_list} from 'FriendList/FriendIndicator';
import {PlayerDetails} from "./PlayerDetails";
import {Flag} from "Flag";
import * as player_cache from "player_cache";
import {observe_online} from "online_status";
import {pgettext} from "translate";
import {RegisteredPlayer, player_attributes} from "data/Player";
import {PlayerComponentProperties, PlayerComponent} from "./PlayerComponent";
import {PlayerIcon} from "./PlayerIcon";

interface PlayerProperties extends PlayerComponentProperties {
    icon?: boolean;         // Show the player's icon?
    iconSize?: number;      // How big should the icon be?
    flag?: boolean;         // Show the player's national flag?
    rank?: boolean;         // Show the player's rank?
    flare?: boolean;        // Show the spanner / gavel / coin icons that appear in the chat.
    online?: boolean;       // Show whether the player is online?

    nolink?: boolean;       // Is the component clickable?
    nodetails?: boolean;    // Open the details box or go straight to the user page?
    noextracontrols?: boolean; // Show the extra controls that appear, for example, in reviews?
}


export class Player extends PlayerComponent<PlayerProperties> {
    render() {
        let props = this.props;
        let player = this.state.player;

        let classes: Array<string> = ["Player"];
        const prop_mappings: {[flag in keyof PlayerProperties]?: string} = {
            icon: "Player-with-icon",
            nolink: "nolink",
            nodetails: "nodetails",
            noextracontrols: "noextracontrols",
            online: "show-online",
            flare: "with-flare",
        };
        for (let prop in prop_mappings) {
            if (props[prop]) {
                classes.push(prop_mappings[prop]);
            }
        }
        if (!(player instanceof RegisteredPlayer)) {
            classes.push("guest");
        }
        classes.push(...player_attributes(player));

        let rank_text: string = "";
        if (props.rank && player instanceof RegisteredPlayer) {
            if (!player.is.professional && player.ratings.overall.deviation >= 220) {
                rank_text = "[?]";
            }
            else {
                rank_text = `[${rankString(player)}]`;
            }
        }

        return (
            <span ref="elt" className={classes.join(" ")} onMouseDown={this.display_details}>
                {(props.icon || null) && <PlayerIcon user={player} size={props.iconSize || 16}/>}
                {(props.flag || null) && <Flag country={player.country}/>}
                {player.username}
                {(rank_text || null) && <span className="rank">{rank_text}</span>}
            </span>
        );
    }

    display_details = (event) => {
        if (this.props.nolink || !(this.state.player instanceof RegisteredPlayer)) {
            return;
        }
        else {
            event.stopPropagation();
        }

        let player_id = this.state.player.id;
        let uri = `/player/${player_id}/${encodeURIComponent(this.state.player.username)}`;
        if (shouldOpenNewTab(event)) {
            window.open(uri, "_blank");
        }
        else if (this.props.nodetails) {
            close_all_popovers();
            close_friend_list();
            browserHistory.push(uri);
            return;
        }
        else {
            popover({
                elt: (<PlayerDetails user={player_id} noextracontrols={this.props.noextracontrols} />),
                below: this.refs.elt,
                minWidth: 240,
                minHeight: 250,
            });
        }
    }
}
