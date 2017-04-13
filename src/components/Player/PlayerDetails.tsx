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
import {_, pgettext} from "translate";
import {shouldOpenNewTab, errorAlerter, alertModerator} from "misc";
import {rankString} from "rank_utils";
import player_cache from "player_cache";
import {icon_size_url} from "PlayerIcon";
import data from "data";
import {close_all_popovers} from "popover";
import {Flag} from "Flag";
import {ban, shadowban, remove_shadowban, remove_ban} from "Moderator";
import {challenge} from "ChallengeModal";
import {getPrivateChat} from "PrivateChat";
import {openBlockPlayerControls} from "BlockPlayer";
import {Player} from "./Player";


interface PlayerDetailsProperties {
    playerId: number;
}

let extraActionCallback: (user_id: number, user: any) => JSX.Element = null;

export class PlayerDetails extends React.PureComponent<PlayerDetailsProperties, any> {
    refs: {
    };

    constructor(props) {
        super(props);
        this.state = this.blankState();
        let player = player_cache.lookup(this.props.playerId);
        if (player) {
            this.state = Object.assign(this.state, player);
        }
    }

    componentWillMount()  {
        this.resolve(this.props.playerId);
    }

    blankState() {{{
        return {
            resolved: false,
            resolving: 0,
            username: "...",
            //icon: data.get('config.cdn_release') + '/img/default-user.svg',
            icon: "",
            ranking: "...",
            rating: "...",
            ui_class: "...",
            country: "un",
            error: null,
        };
    }}}
    resolve(player_id) {{{
        this.setState({resolved: false});
        player_cache.fetch(
            this.props.playerId,
            [
                "username",
                "icon",
                "rating",
                "ranking",
                "professional",
                "country",
                "ui_class",
            ]
        )
        .then((player) => {
            this.setState(Object.assign({resolved: true}, player));
        })
        .catch((err) => {
            if (player_id === this.props.playerId) {
                this.setState({resolved: true, error: _("Error loading player information")});
                console.error(err);
            }
        });
    }}}
    componentWillReceiveProps(new_props) {{{
        if (new_props.playerId !== this.props.playerId) {
            let player = player_cache.lookup(new_props.playerId);
            let new_state = this.blankState();
            if (player) {
                new_state = Object.assign(this.state, player);
            }
            this.setState(new_state);
            setTimeout(() => {
                this.resolve(new_props.playerId);
            }, 1);
        }
    }}}
    componentWillUnmount() {{{
    }}}

    gotoPlayerView = (ev) => {{{
        close_all_popovers();

        let url = `/player/${this.props.playerId}/${this.state.username}`;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }}}
    challenge = (_ev) => {{{
        challenge(this.props.playerId);
        close_all_popovers();
    }}}
    message = (_ev) => {{{
        getPrivateChat(this.props.playerId).open();
        close_all_popovers();
    }}}
    report = (_ev) => {{{
        alertModerator({user: this.props.playerId});
        close_all_popovers();
    }}}
    block = (ev) => {{{
        let controls = openBlockPlayerControls(ev, this.props.playerId);
        controls.on("close", () => {
            close_all_popovers();
        });
    }}}
    ban = (_ev) => {{{
        ban(this.props.playerId).then(close_all_popovers).catch(errorAlerter);
    }}}
    shadowban = (_ev) => {{{
        shadowban(this.props.playerId).then(close_all_popovers).catch(errorAlerter);
    }}}
    removeShadowban = (_ev) => {{{
        remove_shadowban(this.props.playerId).then(close_all_popovers).catch(errorAlerter);
    }}}
    removeBan = (_ev) => {{{
        remove_ban(this.props.playerId).then(close_all_popovers).catch(errorAlerter);
    }}}

    render() {
        let user = data.get("user");

        return (
            <div className="PlayerDetails">
                <div className="details">
                    <div className="icon" style={{backgroundImage: 'url("' + icon_size_url(this.state.icon, 64) + '")'}}>
                        <Flag country={this.state.country}/>
                    </div>
                    <div>
                        <div>
                            <Player user={this.state} nodetails rank={false} />
                        </div>
                        <div>
                            <span className="rating">{Math.round(this.state.rating) || "..."}</span>
                        </div>
                        <div>
                            <span className="rank">{rankString(this.state) || "..."}</span>
                        </div>
                    </div>
                </div>
                {(user.id !== this.props.playerId || null) &&
                    <div className="actions">
                        <button className="xs noshadow primary" disabled={this.state.resolved} onClick={this.challenge}><i className="ogs-goban"/>{_("Challenge")}</button>
                        <button className="xs noshadow success" disabled={this.state.resolved} onClick={this.message}><i className="fa fa-comment-o"/>{_("Message")}</button>
                        <button className="xs noshadow reject" disabled={this.state.resolved} onClick={this.report}><i className="fa fa-exclamation-triangle"/>{_("Report")}</button>
                        <button className="xs noshadow reject" disabled={this.state.resolved} onClick={this.block}><i className="fa fa-ban"/>{_("Block")}</button>
                    </div>
                }
                {extraActionCallback && extraActionCallback(this.props.playerId, this.state)}
                { ((user.is_moderator && this.props.playerId > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow reject" onClick={this.ban}><i className="fa fa-gavel"/>{pgettext("Ban user from the server", "Ban")}</button>
                        <button className="xs noshadow danger" onClick={this.shadowban}><i className="fa fa-commenting"/>{pgettext("Disallow user to chat", "Shadowban")}</button>
                    </div>
                }
                { ((user.is_moderator && this.props.playerId > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.removeBan}><i className="fa fa-thumbs-o-up"/>{pgettext("Allow user on the server", "Un-Ban")}</button>
                        <button className="xs noshadow" onClick={this.removeShadowban}><i className="fa fa-commenting-o"/>{pgettext("Remove chat ban", "Un-Shadowban")}</button>
                    </div>
                }
            </div>
        );
    }
}

export function setExtraActionCallback(cb: (user_id: number, user: any) => JSX.Element) {{{
    extraActionCallback = cb;
}}}
