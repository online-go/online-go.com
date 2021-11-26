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
import {Link} from "react-router-dom";
import {_, cc_to_country_name} from "translate";
import {post, put} from "requests";
import {PaginatedTable} from "PaginatedTable";
import {Card} from "material";
import {UIPush} from "UIPush";
import {SearchInput} from "misc-ui";
import {Player} from "Player";
import * as moment from "moment";
import { chat_markup } from "Chat";
import * as data from "data";
import swal from 'sweetalert2';

const whitelist = ["aol.com", "att.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com", "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com", "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk", "protonmail.com", "protonmail.ch", "pm.me", "email.com", "games.com", "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com", "lavabit.com", "love.com", "outlook.com", "pobox.com", "rocketmail.com", "safe-mail.net", "wow.com", "ygm.com", "ymail.com", "zoho.com", "fastmail.com", "fastmail.fm", "yandex.com", "yandex.net", "bellsouth.net", "charter.net", "comcast.net", "cox.net", "earthlink.net", "juno.com", "yahoo.ca", "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk", "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk", "virgin.net", "wanadoo.co.uk", "bt.com", "sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph", "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr", "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de", "web.de", "yahoo.de", "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru", "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be", "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar", "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx", "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br", "cabletv.on.ca", "live.ca", "unitybox.de", "volki.at", "skole.hr"];

const greylist = ["yopmail.com", "vsprint.com", "xplanningzx.com", "mailsac.com", "mailinator.com", "plumber-thatcham.co.uk", "emergency-plumbers-clerkenwell.co.uk", "harrow-plumber.co.uk"];

const greylist2 = [".xyz", ".life", ".website"];

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
    componentDidMount() {
        window.document.title = _("Moderator Center");
    }

    refreshModlog = () => {
        this.refs.modlog.update();
    };
    refreshUserlog = () => {
        this.refs.userlog.update();
    };

    render() {
        return (
            <div className="Moderator">
                <UIPush event="modlog-updated" channel="moderators" action={this.refreshModlog} />
                <UIPush event="new-user" channel="moderators" action={this.refreshUserlog} />

                <Card>
                    <div className='hsearch'>
                        <h2>{_("New Users")}</h2>
                        <SearchInput
                            placeholder={_("Search")}
                            onChange={(event) => {
                            //this.refs.userlog.filter.username__istartswith = (event.target as HTMLInputElement).value.trim();
                                this.refs.userlog.filter.newuserany = (event.target as HTMLInputElement).value.trim();
                                this.refs.userlog.filter_updated();
                            }}
                        />
                    </div>

                    <div>
                        <ColorTableToggle />
                    </div>

                    <PaginatedTable
                        className="userlog"
                        ref="userlog"
                        name="userlog"
                        source={`moderation/recent_users`}
                        orderBy={["-timestamp"]}
                        filter={{ "newuserany": "" }}
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
                                    <Player user={X} />
                                )},

                            {header: _("Accounts") , render: (X) => <span className={X.should_ban ? 'should-ban' : ''}>{X.browser_id_count} </span>},
                            {header: "IP"          , render: (X) => <span className={'monospace small clip ' + (X.should_ban ? 'should-ban' : '')}>{X.last_ip}</span>} ,
                            {header: _("Country")  , render: (X) => <span className={X.should_ban ? 'should-ban' : ''}>{X.geoip.country} {X.geoip.subdivisions ? (" / " + X.geoip.subdivisions.join(", ")) : ""}</span>},
                            {header: _("Timezone") , render: (X) => <span className={X.should_ban ? 'should-ban' : ''}>{X.last_timezone_offset / 60}</span>} ,
                            {header: "BID"         , render: (X) => <span className={'monospace small clip ' + (X.should_ban ? 'should-ban' : '')}>{X.last_browser_id}</span>} ,
                            {header: "Email"       , render: (X) => <span className={'monospace small clip ' + (X.should_ban ? 'should-ban' : '')}>{X.email}</span>} ,
                        ]}
                    />
                </Card>

                <Card>
                    <div className='hsearch'>
                        <h2>{_("Moderator Log")}</h2>
                        <SearchInput
                            className="pull-right"
                            placeholder={_("Search")}
                            onChange={(event) => {
                                this.refs.modlog.filter.playerusernameistartswith = (event.target as HTMLInputElement).value.trim();
                                //this.refs.modlog.filter.useruserany = (event.target as HTMLInputElement).value.trim();
                                this.refs.modlog.filter_updated();
                            }}
                        />
                    </div>

                    <PaginatedTable
                        className=""
                        ref="modlog"
                        name="modlog"
                        source={`moderation/`}
                        orderBy={["-timestamp"]}
                        filter={{ "playerusernameistartswith": "" }}
                        columns={[
                            {header: _("Time"),  className: () => "timestamp ",
                                render: (X) => (moment(new Date(X.timestamp)).format("YYYY-MM-DD HH:mm")) },

                            {header: _("Moderator"),  className: () => "moderator",
                                render: (X) => (<Player user={X.moderator} />)},

                            {header: "",  className: () => "object",
                                render: (X) => (
                                    <span>
                                        {X.game && <Link to={`/game/${X.game.id}`}>#{X.game.id}</Link>} {X.player && <Player user={X.player}/> }
                                    </span>
                                )},

                            {header: _("Moderation action"), className: "action",
                                render: (X) => (
                                    <div>
                                        <div>
                                            <i>{_("Note")}: </i>{chat_markup(X.note, undefined, 1024 * 128)}
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
    }
}

export class ColorTableToggle extends React.Component<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            isToggleOn: false,
            timerID : "",
            onDefault : false
        };

        // This binding is necessary to make `this` work in the callback
        this.handleClick = this.handleClick.bind(this);
        this.updateDefault = this.updateDefault.bind(this);
    }

    handleClick() {
        this.setState(prevState => ({
            isToggleOn: !prevState.isToggleOn
        }));

        if (this.state.timerID === "") {
            this.setState(prevState => ({
                timerID : setInterval(this.colorTable, 1000)
            }));
        } else {
            clearInterval(this.state.timerID);
            this.setState( prevState => ({
                timerID : ""
            }));
        }
    }

    colorTable() {
        const users = document.getElementsByClassName('userlog')[1].getElementsByTagName('tbody')[0].getElementsByTagName('tr');

        if (users.length === 0) {
            return;
        }

        for (let i = 0; i < users.length; i++) {
            const m = (parseInt(users[i].getElementsByTagName('td')[3].getElementsByTagName('span')[0].innerHTML));

            if (m > 1) {
                users[i].getElementsByTagName("td")[3].style.backgroundColor = "hsl(0,80%,20%)";
            }
            const l = (parseInt(users[i].getElementsByTagName("td")[6].getElementsByTagName("span")[0].innerHTML) + 12);
            const j = (l * 15) % 360;
            if (l !== 12) {
                users[i].getElementsByTagName("td")[6].style.backgroundColor = "hsl(" + j + (l % 3 === 1 ? ",70%,15%)" : (l % 3 === 2 ? ",70%,30%)" : ",70%,60%)"));

                users[i].getElementsByTagName("td")[5].style.backgroundColor = "hsl(" + j + (l % 3 === 1 ? ",70%,15%)" : (l % 3 === 2 ? ",70%,30%)" : ",70%,60%)"));
            }

            if (parseInt(users[i].getElementsByTagName("td")[6].getElementsByTagName("span")[0].innerHTML) === -7 && users[i].getElementsByTagName("td")[5].getElementsByTagName("span")[0].innerHTML.substring(0, 2) !== "TH" && users[i].getElementsByTagName("td")[5].getElementsByTagName("span")[0].innerHTML.substring(0, 2) !== "KH" && users[i].getElementsByTagName("td")[5].getElementsByTagName("span")[0].innerHTML.substring(0, 2) !== "LA") {

                users[i].getElementsByTagName("td")[2].style.backgroundColor = "hsl(0,80%,20%)";
            }

            if (users[i].getElementsByTagName('td')[8].getElementsByTagName('div').length === 0) {
                const k = users[i].getElementsByTagName('td')[8].getElementsByTagName('span')[0].innerHTML.split('@');
                if (k.length === 2) {
                    if (!whitelist.includes(k[1])) {
                        users[i].getElementsByTagName('td')[8].innerHTML = '<div><span class="monospace small clip">' + k[0] + '@</span><span style="color:#9dc6ff">' + k[1] + '</span></div>';
                    }
                    if (greylist.includes(k[1])) {
                        users[i].getElementsByTagName('td')[8].style.backgroundColor = "salmon";
                    }
                    const k1 = k[1].split(".");
                    if (k1.length > 1 && greylist2.includes(k1[k1.length - 1])) {
                        users[i].getElementsByTagName('td')[8].style.backgroundColor = "salmon";
                    }
                }
            }
        }

        const users2 = document.getElementsByClassName('Player-username');

        for (let i = 0; i < users2.length; i++) {
            let s = "";
            if (!users2[i].classList.contains('checked')) {
                const chars = users2[i].innerHTML.split("");
                for (let j = 0; j < chars.length; j++) {
                    if (chars[j] >= 'A' && chars[j] <= 'Z') {
                        s += '<span style="color:#99ddff">' + chars[j] + '</span>';
                    } else if (chars[j] >= 'a' && chars[j] <= 'z') {
                        s += '<span style="color:#99cc77">' + chars[j] + '</span>';
                    } else if (chars[j] >= '0' && chars[j] <= '9') {
                        s += '<span style="color:#bb00bb">' + chars[j] + '</span>';
                    } else {
                        s += '<span style="color:#ff9933">' + chars[j] + '</span>';
                    }
                }
                users2[i].classList.add('checked');
                users2[i].innerHTML = s;
            }
        }
    }

    componentDidMount() {
        const c = data.get("table-color-default-on", "");
        if (c === true) {
            this.setState(prevState => ({
                onDefault: !prevState.onDefault
            }));
            this.handleClick();
        }
    }

    componentWillUnmount() {
        if (this.state.timerID !== "") {
            clearInterval(this.state.timerID);
            this.setState( prevState => ({
                timerID : ""
            }));
        }
    }

    updateDefault() {
        if (this.state.onDefault) {
            data.set("table-color-default-on", false);
        } else {
            data.set("table-color-default-on", true);
        }
        this.setState(prevState => ({
            onDefault: !prevState.onDefault
        }));
    }

    render() {
        return (
            <div>
                <button onClick={this.handleClick}>
                    {this.state.isToggleOn ? 'Table Coloring On' : 'Table Coloring Off'}
                </button>
                <label>
                    <input type="checkbox" id="colorDefault" checked={this.state.onDefault} onChange={this.updateDefault}></input>
      On by default
                </label>
            </div>
        );
    }
}

function moderate(player_id, prompt, obj) {
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
}
export function ban(player_id) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 1,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for banning?", {"is_banned": 1});
    }
}
export function shadowban(player_id) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 1,
            "user_id": player_id
        });
    } else {
        return moderate(player_id, "Reason for shadow banning?", {"is_shadowbanned": 1});
    }
}
export function remove_ban(player_id) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 0,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for removing ban?", {"is_banned": 0});
    }
}
export function remove_shadowban(player_id) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            "ban": 0,
            "user_id": player_id,
        });
    } else {
        return moderate(player_id, "Reason for removing the shadow ban?", {"is_shadowbanned": 0});
    }
}
