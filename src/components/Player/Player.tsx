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
import {rankString} from "rank_utils";
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
        if (this.props.nolink) {
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



let __html_player_link_id = 0;
let player_link_data = {};
let player_link_last_id = 0;
export function makeHTMLPlayerLink(field_order, player, link_target) { /* {{{ */
    let id = "player-link-" + (++__html_player_link_id);
    let obj = makePlayerLink(field_order, player, link_target);
    if (!player.nolink && !player.no_link) {
        setTimeout(() => { $("#" + id).append(obj); }, 100);
    }
    return "<span id='" + id + "'></span>";
} /* }}} */
export function setPlayerLinkData(user_id, player, extra_arguments) { /* {{{ */
    let id = ++player_link_last_id;

    player_link_data[id] = {
        "user_id": user_id,
        "player": player,
        "extra_arguments": extra_arguments
    };
    return id;
} /* }}} */
export function makePlayerLink(field_order, player,  extra_arguments?) { /* {{{ */
    let ret;

    try {
        player_cache.update(player);
        let user_id = ("user_id" in player ? player.user_id : ("id" in player ? player.id : 0));
        player.user_id = user_id;

        ret = $(`<span class='Player' data-player-id='${user_id}'>`).addClass("player-name");

        if ("rank" in player && !("ranking" in player)) {
            player.ranking = player.rank;
        }

        let provisional = false;
        let timeout = false;
        if ("ui_class" in player) {
            provisional = player.ui_class.indexOf("provisional") >= 0;
            timeout = player.ui_class.indexOf("timeout") >= 0;

            if (field_order.indexOf("ui_class_dot") >= 0) {
                let classes = player["ui_class"].split(/\s+/);
                for (let i = 0; i < classes.length; ++i) {
                    classes[i] += "-dot";
                }
                ret.addClass(classes.join(" "));
            } else {
                ret.addClass(player["ui_class"]);
            }
        }

        let rank_suffix = "";
        if (provisional) {
            rank_suffix += "?";
        }
        if (timeout) {
            rank_suffix += "T";
        }

        let nolink = ((player.nolink ? 1 : 0) || (player.no_link ? 1 : 0));
        let flag = false;
        let bigflag = false;
        let img;

        for (let  i = 0; i < field_order.length; ++i) {
            let field = field_order[i];
            let res = $("<span>");

            if (field === "name") {
                res.text(player.username);
            }
            else if (field === "online") {
                throw new Error("online no longer supported in makePlayerLink");
            }
            else if (field === "icon") {
                res.append(img = $("<img>").attr("src", "icon" in player ? player["icon"] : player["icon-url"]).addClass("user_icon").addClass(player["icon-size"]));
            }
            else if (field === "rank") {
                if (player.ranking > -100) {
                     res.text(" [" + rankString(player) + rank_suffix + "]");
                }
                res.addClass("rank");
            }
            else if (field === "smallrank") {
                if (player.ranking > -100) {
                     res.text(" [" + rankString(player) + rank_suffix + "]");
                }
                res.addClass("smallrank");
            }
            else if (field === "plain-rank" || field === "plainrank") {
                res.text(rankString(player));
            }
            else if (field === "flag") {
                flag = true;
            }
            else if (field === "bigflag") {
                bigflag = true;
            }
            else if (field === "nolink" || field === "no_link") { nolink = 1; }
            else if (field === "small" || field === "medium" || field === "large" || field === "tiny") {
                if (img) {
                    img.addClass(field);
                }
            } else if (field === "ui_class_dot") {
            } else {
                console.log("Unknown component in player link: ", field);
                continue;
            }

            ret.append(res);
        }

        if (!nolink) {
            if (!user_id) {
                console.error("No user id found in player object", player);
                console.error(new Error().stack);
            }
            ret.addClass("clickable");
            let id = setPlayerLinkData(user_id, player, extra_arguments);
            ret.attr("data-player", id);
        }


        if (flag) {
            ret = $("<span>").append($("<span>").addClass("f16").append($("<span>").addClass("flag " + window["getCountryFlagClass"](player.country)).attr("title", window["getCountryName"](player.country)))).append(ret);
        }
        else if (bigflag) {
            ret = $("<span>").append($("<span>").addClass("f32").append($("<span>").addClass("flag " + window["getCountryFlagClass"](player.country)).attr("title", window["getCountryName"](player.country)))).append(ret);
        }

    } catch (e) {
        console.log(e);
        throw e;
    }


    //console.log(ret);

    return ret;
} /* }}} */
