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
import {_} from "translate";
import {Card} from 'material';

import {active_announcements, announcement_event_emitter} from './Announcements';

interface ActiveAnnouncementsProperties {

}

export class ActiveAnnouncements extends React.PureComponent<ActiveAnnouncementsProperties, any> {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        announcement_event_emitter.on('announcement', this.update);
    }
    componentWillUnmount() {
        announcement_event_emitter.off('announcement', this.update);
    }

    update = () => {
        this.forceUpdate();
    }

    render() {
        let lst = [];

        for (let announcement_id in active_announcements) {
            let announcement = active_announcements[announcement_id];
            if (announcement.type !== "tournament") {
                lst.push(announcement);
            }
        }

        if (lst.length === 0) {
            return null;
        }

        return (
            <Card className="ActiveAnnouncements">
                {lst.map((announcement, idx) => (
                    <div className="announcement" key={idx}>
                        {announcement.link
                            ? (announcement.link.indexOf("://") > 0
                                ? <a href={announcement.link} target="_blank">{announcement.text}</a>
                                : <Link to={announcement.link}>{announcement.text}</Link>
                              )
                            : <span>{announcement.text}</span>
                        }
                    </div>
                ))}
            </Card>
        );
    }
}
