/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Link } from "react-router-dom";
import { get } from "requests";
import { UIPush } from "UIPush";
import { TypedEventEmitter } from "TypedEventEmitter";
import { errorLogger } from "misc";
import * as moment from "moment";
import ITC from "ITC";
import * as data from "data";
import { getBlocks } from "../BlockPlayer";
import * as preferences from "preferences";

interface Events {
    announcement: any;
    "announcement-cleared": any;
}

export interface Announcement {
    id: number;
    expiration: number;
    type: string;
    creator: {
        id: number;
        username: string;
        ui_class: string;
    };
    clear?: () => void;
    link?: string;
    text: string;
}

export const announcement_event_emitter = new TypedEventEmitter<Events>();
export const active_announcements: { [id: number]: Announcement } = {};

export function announcementTypeMuted(announcement: Announcement): boolean {
    if (announcement.type === "stream" && preferences.get("mute-stream-announcements")) {
        return true;
    }
    if (announcement.type === "event" && preferences.get("mute-event-announcements")) {
        return true;
    }
    return false;
}

const announced: { [id: number]: Announcement } = {};
// Holds the expirations dates of cleared announcements
const cleared_announcements: { [id: number]: number } = data.get("announcements.cleared", {});
for (const k in cleared_announcements) {
    if (cleared_announcements[k] < Date.now()) {
        delete cleared_announcements[k];
    }
}
data.set("announcements.cleared", cleared_announcements);

interface AnnouncementsState {
    announcements: Announcement[];
}
export class Announcements extends React.PureComponent<{}, AnnouncementsState> {
    constructor(props) {
        super(props);
        this.state = {
            announcements: [],
        };

        ITC.register("clear-announcement", (id) => {
            console.log("ITC: Clearing announcement");
            this.clearAnnouncement(id, true);
        });
    }

    UNSAFE_componentWillMount() {
        setTimeout(() => {
            /* Defer this get so we can load whatever page we're on first */
            get("announcements")
                .then((announcements) => {
                    for (const announcement of announcements) {
                        this.announce(announcement);
                    }
                })
                .catch(errorLogger);
        }, 20);
    }

    retract = (announcement) => {
        this.clearAnnouncement(announcement.id, true);
    };
    announce = (announcement: Announcement) => {
        active_announcements[announcement.id] = announcement;

        if (announcement.id in announced) {
            return;
        }

        announcement_event_emitter.emit("announcement", announcement);

        if (announcement.id in cleared_announcements) {
            announcement_event_emitter.emit("announcement-cleared", announcement);
            return;
        }

        announcement.clear = this.clearAnnouncement.bind(this, announcement.id, false);
        announced[announcement.id] = announcement;

        if (announcement.type !== "tournament") {
            this.state.announcements.push(announcement);
            this.forceUpdate();

            setTimeout(() => {
                this.clearAnnouncement(announcement.id, true);
                delete active_announcements[announcement.id];
            }, moment(announcement.expiration).toDate().getTime() - Date.now());
        } else {
            const t = moment(announcement.expiration).toDate().getTime() - Date.now();
            if (t > 0 && t < 30 * 60 * 1000) {
                data.set("active-tournament", announcement);
            }
        }
    };

    clearAnnouncement(id, dont_send_clear_announcement) {
        cleared_announcements[id] = Date.now() + 30 * 24 * 3600 * 1000;
        announcement_event_emitter.emit("announcement-cleared", announced[id]);
        data.set("announcements.cleared", cleared_announcements);

        if (!dont_send_clear_announcement) {
            ITC.send("clear-announcement", id);
        }

        for (let i = 0; i < this.state.announcements.length; ++i) {
            const announcement = this.state.announcements[i];
            if (announcement.id === id) {
                this.state.announcements.splice(i, 1);
                break;
            }
        }

        this.forceUpdate();
    }

    render() {
        return (
            <div className="Announcements">
                <UIPush event="retract" channel="announcements" action={this.retract} />
                <UIPush event="announcement" channel="announcements" action={this.announce} />
                <UIPush event="retract" action={this.retract} />
                <UIPush event="announcement" action={this.announce} />

                {this.state.announcements.map((announcement, idx) => {
                    const creator_blocked = getBlocks(announcement.creator.id).block_announcements;
                    const type_muted = announcementTypeMuted(announcement);

                    if (creator_blocked || type_muted) {
                        return null;
                    }

                    return (
                        <div className="announcement" key={idx}>
                            <i className="fa fa-times-circle" onClick={announcement.clear} />
                            {/*
                    {(announcement.type === 'tournament' || null) &&
                        <span className='expiration'>
                            {moment(announcement.expiration).fromNow(true)}:
                        </span>
                    }
                    */}
                            {announcement.link ? (
                                announcement.link.indexOf("://") > 0 ? (
                                    <a href={announcement.link} target="_blank">
                                        {announcement.text}
                                    </a>
                                ) : (
                                    <Link to={announcement.link}>{announcement.text}</Link>
                                )
                            ) : (
                                <span>{announcement.text}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }
}
