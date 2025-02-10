/*
 * Copyright (C)  Online-Go.com
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
import * as data from "@/lib/data";
import { _, interpolate, pgettext } from "@/lib/translate";
import { post, get, del } from "@/lib/requests";
import { PaginatedTable } from "@/components/PaginatedTable";
import { Card } from "@/components/material";
import { UIPush } from "@/components/UIPush";
import { errorAlerter } from "@/lib/misc";
import { Player } from "@/components/Player";
import moment from "moment";
//import { Announcement } from "@/components/Announcements";
import { useUser } from "@/lib/hooks";
import { Announcement } from "@/components/Announcements";

moment.relativeTimeThreshold("m", 59);

const all_duration_options = [
    900,
    1800,
    2700,
    3600,
    5400,
    7200,
    9000,
    10800,
    12600,
    14400,
    16200,
    18000,
    19800,
    21600,

    86400,
    86400 * 2,
    86400 * 3,
    86400 * 5,
    86400 * 6,
    86400 * 7,
];

if (process.env.NODE_ENV === "development") {
    all_duration_options.unshift(60);
    all_duration_options.unshift(5);
}

export function AnnouncementCenter(): React.ReactElement {
    const user = useUser();
    const [announcementType, setAnnouncementType] = React.useState(
        user.is_superuser ? "system" : data.get("announcement.last-type", "stream"),
    );
    const [text, setText] = React.useState("");
    const [link, setLink] = React.useState("");
    //const [duration, setDuration] = React.useState(7200);
    const [duration_idx, setDurationIdx] = React.useState(
        data.get("announcement.last-duration", 4),
    );
    const duration_options = all_duration_options.filter((x) => x < 86400 || user.is_superuser);
    const [announcements, setAnnouncements] = React.useState<any[]>([]);

    React.useEffect(() => {
        window.document.title = _("Announcement Center");
        refresh();
    }, []);

    const create = () => {
        const duration = all_duration_options[duration_idx] * 1000 + 1000;
        const expiration = moment.utc(Date.now() + duration).format("YYYY-MM-DD HH:mm:ss Z");
        data.set("announcement.last-type", announcementType);
        data.set("announcement.last-duration", duration_idx);

        post("announcements", {
            type: announcementType,
            user_ids: "",
            text,
            link,
            button_text: "",
            button_link: "",
            button_class: "",
            expiration,
        })
            .then(refresh)
            .catch(errorAlerter);
    };
    const refresh = () => {
        get("announcements")
            .then((list) => {
                setAnnouncements(list);
            })
            .catch(errorAlerter);
    };
    const deleteAnnouncement = (announcement: Announcement) => {
        del(`announcements/${announcement.id}`).then(refresh).catch(errorAlerter);
    };

    let can_create = true;
    let invalid_url = false;

    can_create &&= !!text;

    if (link && link.toLowerCase().indexOf("twitch.tv") > 0) {
        can_create = false;
    }

    // check if link is a valid url
    try {
        new URL(link);
    } catch {
        can_create = false;
        invalid_url = true;
    }

    if (user.is_moderator) {
        can_create = true;
        invalid_url = false;
    }

    return (
        <div className="AnnouncementCenter container">
            <UIPush event="refresh" channel="announcement-center" action={refresh} />
            <Card>
                <dl className="horizontal">
                    <dt>Type</dt>
                    {user.is_superuser ? (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => setAnnouncementType(e.target.value)}
                            >
                                <option value="system">System</option>
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                                <option value="advertisement">Advertisement</option>
                                <option value="tournament">Tournament</option>
                                <option value="non-supporter">Non-Supporters</option>
                                <option value="uservoice">Uservoice</option>
                            </select>
                        </dd>
                    ) : user.is_moderator ? (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => setAnnouncementType(e.target.value)}
                            >
                                <option value="system">System</option>
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                                <option value="advertisement">Advertisement</option>
                            </select>
                        </dd>
                    ) : (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => setAnnouncementType(e.target.value)}
                            >
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                            </select>
                        </dd>
                    )}

                    <dt>{_("Duration")}</dt>
                    <dd>
                        <div className="duration">
                            <input
                                type="range"
                                min={0}
                                max={duration_options.length - 1}
                                value={duration_idx}
                                onChange={(e) => {
                                    setDurationIdx(parseInt(e.target.value));
                                }}
                            />
                            <span className="text">
                                {duration_options[duration_idx] > 3600 &&
                                duration_options[duration_idx] % 3600 === 1800
                                    ? interpolate(_("%s hours"), [
                                          (duration_options[duration_idx] / 3600).toFixed(1),
                                      ])
                                    : moment
                                          .duration(duration_options[duration_idx], "seconds")
                                          .humanize(false, { h: 24, m: 59, s: 59 })}
                            </span>
                        </div>
                    </dd>

                    <dt>{_("Text")}</dt>
                    <dd>
                        <input
                            type="text"
                            value={text}
                            onChange={(ev) => setText(ev.target.value)}
                        />
                    </dd>

                    <dt>{_("Link")}</dt>
                    <dd>
                        <input
                            type="text"
                            value={link}
                            className={invalid_url ? "invalid" : ""}
                            onChange={(ev) => setLink(ev.target.value)}
                        />
                    </dd>
                    <dt></dt>
                    <dd>
                        <button className="primary" disabled={!can_create} onClick={create}>
                            {_("Create announcement")}
                        </button>
                    </dd>
                </dl>

                {link && link.toLowerCase().indexOf("twitch.tv") >= 0 && (
                    <div style={{ color: "orange" }}>
                        {/* untranslated on purpose, we should be moving away
                            from streamers needing to self announce in most
                            cases */}
                        Note: Announcing twitch.tv streams is no longer necessary as they'll
                        automatically be picked up and displayed with the GoTV system. To use the
                        GoTV system, simply start streaming on twitch.tv and set your category to
                        Go, or Board Games and use the #go, #weiqi, or #baduk tags.
                    </div>
                )}

                <div className="announcements">
                    {announcements.map((announcement, idx) => (
                        <div className="announcement" key={idx}>
                            <div className="cell">
                                {(user.is_moderator ||
                                    user.id === announcement.creator.id ||
                                    null) && (
                                    <button
                                        className="reject xs"
                                        onClick={() => deleteAnnouncement(announcement)}
                                    >
                                        <i className="fa fa-trash-o" />
                                    </button>
                                )}
                            </div>
                            <div className="cell">
                                <Player user={announcement.creator} />
                            </div>
                            <div className="cell">{announcement.text}</div>
                            <div className="cell">
                                <a target="_blank" href={announcement.link}>
                                    {announcement.link}
                                </a>
                            </div>
                            <div className="cell">
                                expires {moment(announcement.expiration).fromNow()}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h3>{_("Announcement History")}</h3>

                <PaginatedTable
                    className="announcement-history"
                    source={`announcements/history`}
                    orderBy={["-timestamp"]}
                    columns={[
                        {
                            header: "Time",
                            className: "",
                            render: (a) => moment(a.timestamp).format("YYYY-MM-DD LTS"),
                        },
                        {
                            header: "Duration",
                            className: "",
                            render: (a) => {
                                const ms = moment(a.expiration).diff(moment(a.timestamp));
                                const d = moment.duration(ms);
                                return Math.floor(d.asHours()) + moment.utc(ms).format(":mm");
                                //.format('HH:mm')
                            },
                        },
                        {
                            header: "Type",
                            className: "announcement-type ",
                            render: (a) => {
                                switch (a.type) {
                                    case "system":
                                        return pgettext("Announcement type", "System");
                                    case "event":
                                        return pgettext("Announcement type", "Event");
                                    case "stream":
                                        return pgettext(
                                            "Announcement type (video stream)",
                                            "Stream",
                                        );
                                }
                                return a.type;
                            },
                        },
                        {
                            header: "Player",
                            className: "",
                            render: (a) => <Player user={a.creator} />,
                        },
                        { header: "Message", className: "", render: (a) => a.text },
                        {
                            header: "Link",
                            className: "",
                            render: (a) => <a href={a.link}>{a.link}</a>,
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
