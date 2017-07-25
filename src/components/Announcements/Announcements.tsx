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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {UIPush} from "UIPush";
import * as moment from "moment";
import ITC from "ITC";
import data from "data";

interface AnnouncementsProperties {
}

let announced = {};
let cleared_announcements = data.get("announcements.cleared", {});
for (let k in cleared_announcements) {
    if (cleared_announcements[k] < Date.now()) {
        delete cleared_announcements[k];
    }
}
data.set("announcements.cleared", cleared_announcements);

export class Announcements extends React.PureComponent<AnnouncementsProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            announcements: []
        };

        ITC.register("clear-announcement", (id) => {
            console.log("ITC: Clearing announcement");
            this.clearAnnouncement(id, true);
        });
    }

    componentWillMount() {{{
        get("announcements")
        .then((announcements) => {
            for (let announcement of announcements) {
                this.announce(announcement);
            }
        });
    }}}

    retract = (announcement) => {{{
        this.clearAnnouncement(announcement.id, true);
    }}}
    announce = (announcement) => {{{
        if (announcement.id in announced) {
            return;
        }

        if (announcement.id in cleared_announcements) {
            return;
        }

        announcement.clear = this.clearAnnouncement.bind(this, announcement.id, false);
        announced[announcement.id] = true;

        if (announcement.type !== "tournament") {
            this.state.announcements.push(announcement);
            this.forceUpdate();
        } else {
            let t = moment(announcement.expiration).toDate().getTime() - Date.now();
            if (t > 0 && t < 30 * 60 * 1000) {
                data.set("active-tournament", announcement);
            }
        }
    }}}

    clearAnnouncement(id, dont_send_clear_announcement) {{{
        cleared_announcements[id] = Date.now() + 30 * 24 * 3600 * 1000;
        data.set("announcements.cleared", cleared_announcements);

        if (!dont_send_clear_announcement) {
            ITC.send("clear-announcement", id);
        }

        for (let i = 0; i < this.state.announcements.length; ++i) {
            let announcement = this.state.announcements[i];
            if (announcement.id === id) {
                this.state.announcements.splice(i, 1);
                break;
            }
        }

        this.forceUpdate();
    }}}


    render() {
        return (
        <div className="Announcements">
            <UIPush event="retract" channel="announcements" action={this.retract}/>
            <UIPush event="announcement" channel="announcements" action={this.announce}/>
            <UIPush event="retract"  action={this.retract}/>
            <UIPush event="announcement" action={this.announce}/>

            {this.state.announcements.map((announcement, idx) => (
                <div className="announcement" key={idx}>
                    <i className="fa fa-times-circle" onClick={announcement.clear}/>
                    {/*
                    {(announcement.type === 'tournament' || null) &&
                        <span className='expiration'>
                            {moment(announcement.expiration).fromNow(true)}:
                        </span>
                    }
                    */}
                    {announcement.link
                        ? (announcement.link.indexOf("://") > 0
                            ? <a href={announcement.link} target="_blank">{announcement.text}</a>
                            : <Link to={announcement.link}>{announcement.text}</Link>
                          )
                        : <span>{announcement.text}</span>
                    }
                </div>
            ))}
        </div>
        );
    }
}
