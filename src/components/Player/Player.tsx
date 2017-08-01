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
import {rankString, getUserRating} from "rank_utils";
import {close_all_popovers, popover} from "popover";
import {close_friend_list} from 'FriendList/FriendIndicator';
import {PlayerDetails} from "./PlayerDetails";
import {Flag} from "Flag";
import {PlayerIcon} from "PlayerIcon";
import player_cache from "player_cache";
import online_status from "online_status";
import {pgettext} from "translate";

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
        let player_id = typeof(this.props.user) !== "object" ? this.props.user : (this.props.user.id || this.props.user.player_id) ;
        if (player_id && player_id > 0) {
            player_cache.fetch(player_id, ["username", "ui_class", "ranking", "pro"]).then((user) => {
                let player_id = typeof(this.props.user) !== "object" ? this.props.user : (this.props.user.id || this.props.user.player_id) ;
                if (player_id === user.id) {
                    this.setState({user: user});
                }
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

        let player_id = typeof(new_props.user) !== "object" ? new_props.user : (new_props.user.id || new_props.user.player_id) ;
        if (player_id && player_id > 0) {
            player_cache.fetch(player_id, ["username", "ui_class", "ranking", "pro"]).then((user) => {
                let player_id = typeof(this.props.user) !== "object" ? this.props.user : (this.props.user.id || this.props.user.player_id) ;
                if (player_id === user.id) {
                    this.setState({user: user});
                }
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
            let rating = getUserRating(player, 'overall', 0);
            let rank_text = 'E';

            if (player.pro || player.professional) {
                rank_text = rankString(player);
            }
            else if (rating.unset && player.rank > 0) {
                /* This is to support displaying archived chat lines */
                rank_text = rankString(player);
            }
            else if (rating.deviation > 220) {
                rank_text = '?';
            }
            else if (rating.rank < 13) { /* < 17k */
                rank_text = pgettext("Beginners class rank text", 'BC');
            }
            else {
                rank_text = rating.rank_label;
            }

            main_attrs["data-rank"] = " [" + rank_text + "]";
        }

        if (props.flare) {
            main_attrs.className += " with-flare";
        }

        if (props.online) {
            main_attrs.className += this.state.is_online ? " online" : " offline";
        }


        return (
            <span ref="elt" {...main_attrs} onMouseDown={this.display_details}>
                {(props.icon || null) && <PlayerIcon user={player} size={props.iconSize || 16}/>}
                {(props.flag || null) && <Flag country={player.country}/>}
                {player.username || player.name}
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

        let player_id = this.state.user.id || this.state.user.player_id;
        if (shouldOpenNewTab(event)) {
            let uri = `/player/${player_id}`;
            let player = player_cache.lookup(player_id);
            if (player) {
                uri += "/" + encodeURIComponent(player.username);
            }
            window.open(uri, "_blank");
        }
        else if (this.props.nodetails) {
            close_all_popovers();
            close_friend_list();
            browserHistory.push(`/player/${player_id}/`);
            return;
        }
        else {
            popover({
                elt: (<PlayerDetails playerId={player_id} noextracontrols={this.props.noextracontrols} />),
                below: this.refs.elt,
                minWidth: 240,
                minHeight: 250,
            });
        }
    }
}
