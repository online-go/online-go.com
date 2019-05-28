/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import * as data from "data";
import {Link} from "react-router-dom";
import {_, pgettext, interpolate, cc_to_country_name} from "translate";
import {post, get, put, del} from "requests";
import {PaginatedTable} from "PaginatedTable";
import {Card} from "material";
import {UIPush} from "UIPush";
import {errorAlerter} from "misc";
import {Player} from "Player";
import * as Datetime from "react-datetime";
import * as moment from "moment";

declare var swal;

interface AnnouncementCenterProperties {
}

const MAX_ANNOUNCEMENT_DURATION = 6 * 3600 * 1000; /* 6 hours */

export class AnnouncementCenter extends React.PureComponent<AnnouncementCenterProperties, any> {

    constructor(props) {
        super(props);
        let exp = new Date();
        exp.setSeconds(exp.getSeconds() + 300);

        this.state = {
            announcements: [],
            type: "system",
            expiration_date: exp,
            expiration: moment(exp).toISOString(),
            text: "",
            link: "",
        };
    }

    componentWillMount() {
        this.refresh();
    }

    setType = (ev) => {{{
        this.setState({type: ev.target.value});
    }}}
    setExpiration = (moment_date) => {{{

        let message = null;
        let announcement_duration = moment_date.toDate().getTime() - Date.now();
        if (announcement_duration > MAX_ANNOUNCEMENT_DURATION && !data.get('user').is_superuser) {
            message = _("Announcement durations must be 6 hours or less");
        }

        this.setState({
            expiration_date: moment_date._d,
            expiration: moment_date._d.toISOString(),
            expiration_message: message
        });
    }}}
    setText = (ev) => {{{
        this.setState({text: ev.target.value});
    }}}
    setLink = (ev) => {{{
        let link  = ev.target.value.trim();
        this.setState({
            link: link
        });
    }}}
    create = () => {{{
        let announcement_duration = moment(this.state.expiration).toDate().getTime() - Date.now();
        if (announcement_duration > MAX_ANNOUNCEMENT_DURATION && !data.get('user').is_superuser) {
            return;
        }

        post("announcements", {
            "type": this.state.type,
            "user_ids": "",
            "text": this.state.text,
            "link": this.state.link,
            "button_text": "",
            "button_link": "",
            "button_class": "",
            "expiration": this.state.expiration
        })
        .then(this.refresh)
        .catch(errorAlerter);
    }}}
    refresh = () => {{{
        get("announcements")
        .then((list) => {
            console.log(list);
            this.setState({announcements: list});
        })
        .catch(errorAlerter);
    }}}
    deleteAnnouncement(announcement) {{{
        del("announcements/%%", announcement.id)
        .then(this.refresh)
        .catch(errorAlerter);
    }}}



    render() {
        let user = data.get("user");

        let can_create = (this.state.expiration && this.state.text) ;
        let announcement_duration = moment(this.state.expiration).toDate().getTime() - Date.now();
        if (announcement_duration > MAX_ANNOUNCEMENT_DURATION && !data.get('user').is_superuser) {
            can_create = false;
        }


        return (
        <div className="AnnouncementCenter container">
            <UIPush event="refresh" channel="announcement-center" action={this.refresh}/>
            <Card>
                <dl className="horizontal">
                    {(user.is_superuser || null) && <dt>Type</dt> }
                    {(user.is_superuser || null) &&
                        <dd>
                            <select>
                                <option value="system">System</option>
                                <option value="tournament">Tournament</option>
                                <option value="non-supporter">Non-Supporters</option>
                                <option value="uservoice">Uservoice</option>
                            </select>
                        </dd>
                    }

                    <dt>{_("Expiration")}</dt>
                    <dd>
                        <Datetime value={this.state.expiration_date} onChange={this.setExpiration} />
                    </dd>

                    <dt>{_("Text")}</dt>
                    <dd>
                        <input type="text" value={this.state.text} onChange={this.setText} />
                    </dd>

                    <dt>{_("Link")}</dt>
                    <dd>
                        <input type="text" value={this.state.link} onChange={this.setLink} />
                    </dd>
                    <dt></dt>
                    <dd>
                        { this.state.expiration_message &&
                            <div className='danger'>{this.state.expiration_message} </div>
                        }
                        <button className="primary" disabled={ !can_create } onClick={this.create}>{_("Create announcement")}</button>
                    </dd>
                </dl>
                <div className="announcements">
                    {this.state.announcements.map((announcement, idx) => (
                        <div className="announcement" key={idx}>
                            <div className="cell">
                                {((user.is_moderator || user.id === announcement.creator.id) || null) &&
                                    <button className="reject xs" onClick={this.deleteAnnouncement.bind(this, announcement)}><i className="fa fa-trash-o"/></button>
                                }
                            </div>
                            <div className="cell">
                                <Player user={announcement.creator}/>
                            </div>
                            <div className="cell">
                                {announcement.text}
                            </div>
                            <div className="cell">
                                <a target="_blank" href={announcement.link}>{announcement.link}</a>
                            </div>
                            <div className="cell">
                                expires {moment(announcement.expiration).fromNow()}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {(user.is_superuser || null) &&
                <Card>
                    <h3>Announcement History</h3>

                    <PaginatedTable
                        className="announcement-history"
                        source={`announcements/history`}
                        orderBy={["-timestamp"]}
                        columns={[
                            {header: "Time"      , className: "", render: (a) => moment(a.timestamp).format('YYYY-MM-DD LTS')},
                            {header: "Duration"  , className: "", render: (a) =>
                                moment.utc(
                                    moment(a.expiration).diff(moment(a.timestamp))
                                ).format('HH:mm')
                            },
                            {header: "Player"    , className: "", render: (a) => <Player user={a.creator} />},
                            {header: "Message"   , className: "", render: (a) => a.text},
                            {header: "Link"      , className: "", render: (a) => <a href={a.link}>{a.link}</a>},
                        ]}
                    />
                </Card>
            }
        </div>
        );
    }
}
