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
import {PlayerDetails} from "./PlayerDetails";
import {Flag} from "Flag";
import {PlayerIcon} from "PlayerIcon";
import player_cache from "player_cache";
import online_status from "online_status";

interface PlayerProperties {
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
    icon?: boolean;
    iconSize?: number;
    user: any;
    flag?: boolean;
    rank?: boolean;
    flare?: boolean;
    online?: boolean;
    nolink?: boolean;
    nodetails?: boolean; /* don't open the detials box, instead just open player page */
    noextracontrols?: boolean; /* Disable extra controls */
    disableCacheUpdate?: boolean;
}


export class Player extends React.PureComponent<PlayerProperties, any> {
    refs: {
        elt
    };

    online_subscription_user_id = null;

    constructor(props) {
        super(props);
        this.state = {
            is_online: false,
            user: null,
        };
        if (typeof(props.user) === "object") {
            this.state.user = props.user;
        }
    }

    componentDidMount() {{{
        if (this.state.user) {
            if (!this.props.disableCacheUpdate) {
                player_cache.update(this.props.user);
            }
        }
        let player_id = typeof(this.props.user) === "number" ? this.props.user : (this.props.user.id || this.props.user.player_id) ;
        if (player_id && player_id > 0) {
            player_cache.fetch(player_id, ["username", "ui_class", "ranking", "professional"]).then((user) => {
                this.setState({user: user});
            }).catch(errorLogger);
        }

        this.syncUpdateOnline(this.props.user);
    }}}

    updateOnline = (_player_id, tf) => {{{
        this.setState({is_online: tf});
    }}}

    syncUpdateOnline(user_or_id) {{{
        let id = typeof(user_or_id) === "number" ? user_or_id : ((typeof(user_or_id) === "object" && user_or_id) ? user_or_id.id : null);

        if (!this.props.online || id !== this.online_subscription_user_id) {
            if (this.online_subscription_user_id) {
                this.online_subscription_user_id = null;
                online_status.unsubscribe(this.online_subscription_user_id, this.updateOnline);
            }
        }
        if (this.props.online && id && id !== this.online_subscription_user_id) {
            this.online_subscription_user_id = id;
            online_status.subscribe(this.online_subscription_user_id, this.updateOnline);
        }

    }}}



    componentWillReceiveProps(new_props) {{{
        if (typeof(new_props.user) === "object") {
            player_cache.update(new_props.user);
            this.setState({user: new_props.user});
        }

        let player_id = typeof(new_props.user) === "number" ? new_props.user : (new_props.user.id || new_props.user.player_id) ;
        if (player_id && player_id > 0) {
            player_cache.fetch(player_id, ["username", "ui_class", "ranking", "professional"]).then((user) => {
                this.setState({user: user});
            }).catch(errorLogger);
        }
        this.syncUpdateOnline(new_props.user);
    }}}
    componentDidUpdate() {{{
        this.syncUpdateOnline(this.props.user);
    }}}
    componentWillUnmount() {{{
        this.syncUpdateOnline(null);
    }}}


    render() {
        if (!this.state.user) {
            if (typeof(this.props.user) === "number") {
                return <span className="Player" data-player-id={0}>...</span>;
            } else {
                return <span className="Player" data-player-id={0}>[NULL USER]</span>;
            }
        }

        let props = this.props;
        let player = this.state.user;
        let player_id = player.id || player.player_id;
        let nolink = !!this.props.nolink;


        let main_attrs: any = {
            "className": "Player",
            "data-player-id": player_id,
        };

        if (props.icon) {
            main_attrs.className += " Player-with-icon";
        }

        if (player.ui_class) {
            main_attrs.className += " " + player.ui_class;
        }

        if (player_id < 0) {
            main_attrs.className += " guest";
        }

        if (!player_id || nolink) {
            main_attrs.className += " nolink";
        }

        if (this.props.nodetails) {
            main_attrs.className += " nodetails";
        }

        if (this.props.noextracontrols) {
            main_attrs.className += " noextracontrols";
        }

        if (this.props.rank !== false) {
            if ("rank" in player && !("ranking" in player)) {
                player.ranking = player.rank;
            }
            if (player.ranking > 0) {
                let suffix = "";
                if (player.ui_class && player.ui_class.indexOf("provisional") >= 0) {
                    suffix += "?";
                }
                if (player.ui_class && player.ui_class.indexOf("timeout") >= 0) {
                    suffix += "T";
                }
                main_attrs["data-rank"] = " [" + rankString(player) + suffix + "]";
            }
        }

        if (props.flare) {
            main_attrs.className += " with-flare";
        }

        if (props.online) {
            main_attrs.className += this.state.is_online ? " online" : " offline";
        }


        return (
            <span ref="elt" {...main_attrs}>
                {(props.icon || null) && <PlayerIcon user={player} size={props.iconSize || 16}/>}
                {(props.flag || null) && <Flag country={player.country}/>}
                {player.username || player.name}
            </span>
        );
    }
}



$(document).on("mousedown", ".Player", (ev) => {
    try {
        if ($(ev.target).hasClass("nolink")) {
            return;
        }


        ev.stopPropagation();

        //console.log('Player clicked', ev.target);

        let elt = $(ev.target);
        let player_id: any = elt.attr("data-player-id");

        let failsafe = 5;
        while (elt && !player_id && --failsafe) {
            elt = elt.parent();
            player_id = elt.attr("data-player-id");
        }
        if (!player_id) {
            console.warn("No player id for this player name element", ev.target, $(ev.target).parent()[0]);
            return;
        }
        player_id = parseInt(player_id);
        if (player_id < 0) {
            return;
        }


        if (shouldOpenNewTab(ev)) {
            let uri = `/player/${player_id}`;
            let player = player_cache.lookup(parseInt(player_id));
            if (player) {
                uri += "/" + encodeURIComponent(player.username);
            }
            window.open(uri , "_blank");
        } else {
            let noextracontrols = false;

            if ($(ev.target).hasClass("nodetails")) {
                close_all_popovers();
                browserHistory.push(`/player/${player_id}/`);
                return;
            }

            if ($(ev.target).hasClass("noextracontrols")) {
                noextracontrols = true;
            }


            let offset = elt.offset();

            popover({
                elt: (<PlayerDetails playerId={parseInt(player_id)} noextracontrols={noextracontrols} />),
                at: {x: offset.left, y: offset.top + elt.height()},
                minWidth: 240,
                minHeight: 250,
            });

            ev.preventDefault();
            return false;
        }
    } catch (e) {
        console.error(e);
    }
});


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
