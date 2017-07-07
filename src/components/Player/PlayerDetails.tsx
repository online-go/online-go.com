
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
import * as player_cache from "player_cache";
import {icon_size_url} from "PlayerIcon";
import * as data from "data";
import {close_all_popovers} from "popover";
import {Flag} from "Flag";
import {ban, shadowban, remove_shadowban, remove_ban} from "Moderator";
import {openSupporterAdminModal} from "SupporterAdmin";
import {challenge} from "ChallengeModal";
import {getPrivateChat} from "PrivateChat";
import {openBlockPlayerControls} from "BlockPlayer";
import {close_friend_list} from 'FriendList/FriendIndicator';
import {AbstractPlayer, AbstractPlayerProperties, AbstractPlayerState} from "./AbstractPlayer";
import {Player, RegisteredPlayer, is_registered} from "data/Player";


interface PlayerDetailsProperties extends AbstractPlayerProperties {
    noextracontrols?: boolean;
}

let extraActionCallback: (user_id: number, user: any) => JSX.Element = null;

export class PlayerDetails extends AbstractPlayer<PlayerDetailsProperties, AbstractPlayerState> {
    protected player_id: number;

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    }

    gotoPlayerView = (ev) => {{{
        this.close_all_modals_and_popovers();

        let url = `/player/${this.player_id}/`;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }}}
    challenge = (_ev) => {{{
        challenge(this.player_id);
        this.close_all_modals_and_popovers();
    }}}
    message = (_ev) => {{{
        getPrivateChat(this.player_id).open();
        this.close_all_modals_and_popovers();
    }}}
    report = (_ev) => {{{
        alertModerator({user: this.player_id});
        this.close_all_modals_and_popovers();
    }}}
    block = (ev) => {{{
        let controls = openBlockPlayerControls(ev, this.player_id);
        controls.on("close", () => {
            this.close_all_modals_and_popovers();
        });
    }}}
    ban = (_ev) => {{{
        ban(this.player_id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    shadowban = (_ev) => {{{
        shadowban(this.player_id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    removeShadowban = (_ev) => {{{
        remove_shadowban(this.player_id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    removeBan = (_ev) => {{{
        remove_ban(this.player_id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    openSupporterAdmin = () => {
        this.close_all_modals_and_popovers();
        openSupporterAdminModal(this.player_id);
    }
    render() {
        let user = data.get("user");
        let props = this.props;
        let state = this.state;
        let classes: Array<string> = [];

        classes.push("Player");
        state.guest && classes.push("guest");
        props.noextracontrols && classes.push("noextracontrols");

        let className = classes.join(" ");
        if (state.className) {
            className += " ";
            className += state.className;
        }

        return (
            <div className="PlayerDetails">
                <div className="details">
                    <div className="icon" style={{backgroundImage: 'url("' + icon_size_url(this.state.icon, 64) + '")'}}>
                        <Flag country={this.state.country}/>
                    </div>
                    <div>
                        <div>
                            <span className={className} onClick={this.click}>
                                <span className="username">{state.username}</span>
                            </span>
                        </div>
                        <div>
                            <span className="rating">{this.state.rating}</span>
                        </div>
                        <div>
                            <span className="rank">{this.state.long_rank}</span>
                        </div>
                    </div>
                </div>
                {!this.state.guest && (user.id !== this.player_id || null) &&
                    <div className="actions">
                        <button className="xs noshadow primary" disabled={!this.state.resolved} onClick={this.challenge}><i className="ogs-goban"/>{_("Challenge")}</button>
                        <button className="xs noshadow success" disabled={!this.state.resolved} onClick={this.message}><i className="fa fa-comment-o"/>{_("Message")}</button>
                        <button className="xs noshadow reject" disabled={!this.state.resolved} onClick={this.report}><i className="fa fa-exclamation-triangle"/>{_("Report")}</button>
                        <button className="xs noshadow reject" disabled={!this.state.resolved} onClick={this.block}><i className="fa fa-ban"/>{_("Block")}</button>
                    </div>
                }
                {!this.state.guest && !this.props.noextracontrols && extraActionCallback && extraActionCallback(this.player_id, this.state)}
                { ((user.is.moderator && this.player_id > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow reject" onClick={this.ban}><i className="fa fa-gavel"/>{pgettext("Ban user from the server", "Ban")}</button>
                        <button className="xs noshadow danger" onClick={this.shadowban}><i className="fa fa-commenting"/>{pgettext("Disallow user to chat", "Shadowban")}</button>
                    </div>
                }
                { ((user.is.moderator && !this.state.guest) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.removeBan}><i className="fa fa-thumbs-o-up"/>{pgettext("Allow user on the server", "Un-Ban")}</button>
                        <button className="xs noshadow" onClick={this.removeShadowban}><i className="fa fa-commenting-o"/>{pgettext("Remove chat ban", "Un-Shadowban")}</button>
                    </div>
                }
                { ((user.is.admin && !this.state.guest) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.openSupporterAdmin}><i className="fa fa-star"/>Supporter Admin</button>
                    </div>
                }
            </div>
        );
    }

    click = (event) => {
        event.stopPropagation();
        if (shouldOpenNewTab(event)) {
            let uri = `/player/${this.player_id}`;
            let player = player_cache.lookup(this.player_id);
            if (player) {
                uri += "/" + encodeURIComponent(player.username);
            }
            window.open(uri, "_blank");
        }
        else {
            close_all_popovers();
            browserHistory.push(`/player/${this.player_id}/`);
            return;
        }
    }
}

export function setExtraActionCallback(cb: (user_id: number, user: any) => JSX.Element) {{{
    extraActionCallback = cb;
}}}
