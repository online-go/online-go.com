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
import {Link} from "react-router";
import {_, cc_to_country_name} from "translate";
import {post, put} from "requests";
import {PaginatedTable} from "PaginatedTable";
import {Card} from "material";
import {UIPush} from "UIPush";
import {SearchInput} from "misc-ui";
import {Player} from "Player";
import * as moment from "moment";

declare var swal;

interface ModeratorProperties {
}

export class Moderator extends React.PureComponent<ModeratorProperties, any> {
    refs: {
        modlog;
        userlog;
    };

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    refreshModlog = () => {{{
        this.refs.modlog.update();
    }}}
    refreshUserlog = () => {{{
        this.refs.userlog.update();
    }}}

    render() {{{
        return (
        <div className="Moderator">
            <UIPush event="modlog-updated" channel="moderators" action={this.refreshModlog} />
            <UIPush event="new-user" channel="moderators" action={this.refreshUserlog} />

            <Card>
                <h2>{_("New Users")}</h2>
               <SearchInput
                    className="pull-right"
                    placeholder={_("Search")}
                    onChange={(event) => {
                        this.refs.userlog.filter.username__istartswith = (event.target as HTMLInputElement).value.trim();
                        this.refs.userlog.filter_updated();
                    }}
                />

                <PaginatedTable
                    className=""
                    ref="userlog"
                    name="userlog"
                    source={`moderation/recent_users`}
                    orderBy={["-timestamp"]}
                    filter={{ "username__istartswith": "" }}
                    columns={[
                        {header: _("Time"),  className: () => "timestamp",
                         render: (X) => (moment(new Date(X.registration_date)).format("YYYY-MM-DD HH:mm")) },

                        {header: "Quick ban", className: "quick-ban",
                         render: (X) => (
                             <div className="quick-ban">
                                <button className="reject sm" onClick={() => ban(X.id)}>{_("Ban")}</button>
                                <button className="danger sm" onClick={() => shadowban(X.id)}>{_("Shadowban")}</button>
                             </div>
                        )},

                        {header: _("User"),  className: () => "user",
                         render: (X) => (
                             <div className="userlog-user">
                                 <Player user={X} using_cache/>
                                 <span><b>{_("Accounts")}:</b> {X.browser_id_count}</span>
                                 <span><b>IP:</b> {X.last_ip}</span>
                                 <span><b>{_("Country")}:</b> {cc_to_country_name(X.geoip.country)} {X.geoip.subdivisions ? (" / " + X.geoip.subdivisions.join(", ")) : ""}</span>
                                 <span><b>{_("Timezone")}:</b> {X.last_timezone_offset / 60}</span>
                                 <span className="monospace small clip"><b>BID:</b> {X.last_browser_id}</span>
                                 <span className="monospace small clip"><b>Fingerprint:</b> {X.last_fingerprint}</span>
                                 <span className="monospace small clip"><b>Plugins:</b> {X.last_plugin_hash}</span>
                                 <span className="monospace small clip"><b>Screen:</b>
                                    {`${X.last_screen_width}x${X.last_screen_height}+${X.last_screen_avail_left}x${X.last_screen_avail_top}`}
                                 </span>
                             </div>
                        )},
                    ]}
                />
            </Card>

            <Card>
                <h2>{_("Moderator Log")}</h2>
               <SearchInput
                    className="pull-right"
                    placeholder={_("Search")}
                    onChange={(event) => {
                        this.refs.modlog.filter.player__username__istartswith = (event.target as HTMLInputElement).value.trim();
                        this.refs.modlog.filter_updated();
                    }}
                />

                <PaginatedTable
                    className=""
                    ref="modlog"
                    name="modlog"
                    source={`moderation/`}
                    orderBy={["-timestamp"]}
                    filter={{ "player__username__istartswith": "" }}
                    columns={[
                        {header: _("Time"),  className: () => "timestamp ",
                         render: (X) => (moment(new Date(X.timestamp)).format("YYYY-MM-DD HH:mm")) },

                        {header: _("Moderator"),  className: () => "moderator",
                         render: (X) => (<Player user={X.moderator} using_cache/>)},

                        {header: "",  className: () => "object",
                         render: (X) => (
                             <span>
                                 {X.game && <Link to={`/game/${X.game.id}`}>#{X.game.id}</Link>}
                                 {X.player && <Player user={X.player} using_cache/> }
                             </span>
                        )},

                        {header: _("Moderation action"), className: "action",
                         render: (X) => (
                            <div>
                                <div>
                                    <i>{_("Note")}: </i>{X.note}
                                </div>
                                <div>
                                    <i>{_("Action")}: </i>{X.action}
                                </div>
                            </div>
                        )},
                    ]}
                />
            </Card>


        </div>
        );
    }}}
}

function moderate(player_id, prompt, obj) {{{
    return new Promise((resolve, reject) => {
        swal({
            text: prompt,
            input: "text",
            showCancelButton: true
        }).then((reason) => {
            obj.moderation_note = reason;
            console.log(obj);
            put("players/" + player_id + "/moderate", obj).then(resolve).catch(reject);
        }, reject);
    });
}}}
export function ban(player_id) {{{
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 1,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for banning?", {"is_banned": 1});
    }
}}}
export function shadowban(player_id) {{{
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 1,
            "user_id": player_id
        });
    } else {
        return moderate(player_id, "Reason for shadow banning?", {"is_shadowbanned": 1});
    }
}}}
export function remove_ban(player_id) {{{
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 0,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for removing ban?", {"is_banned": 0});
    }
}}}
export function remove_shadowban(player_id) {{{
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 0,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for removing the shadow ban?", {"is_shadowbanned": 0});
    }
}}}
