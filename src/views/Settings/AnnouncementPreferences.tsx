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
import moment from "moment";

import { _, pgettext } from "@/lib/translate";

import { errorAlerter } from "@/lib/misc";

import { usePreference } from "@/lib/preferences";

import { BlockPlayerModal, getAllBlocksWithUsernames } from "@/components/BlockPlayer";
import { Player } from "@/components/Player";
import { PaginatedTable } from "@/components/PaginatedTable";

import { Toggle } from "@/components/Toggle";

import { PreferenceLine } from "@/lib/SettingsCommon";

export function AnnouncementPreferences(): React.ReactElement {
    const [blocked_players, setBlockedPlayers]: [
        Array<any> | null,
        (x: Array<any> | null) => void,
    ] = React.useState<Array<any> | null>(null);

    React.useEffect(() => {
        getAllBlocksWithUsernames()
            .then((blocks) => {
                blocks = blocks.filter((bs) => bs.block_announcements);
                setBlockedPlayers(blocks);
            })
            .catch(errorAlerter);
    }, []);

    const [mute_stream_announcements, toggleMuteStreamAnnouncements] = usePreference(
        "mute-stream-announcements",
    );
    const [mute_event_announcements, toggleMuteEventAnnouncements] = usePreference(
        "mute-event-announcements",
    );

    return (
        <div id="AnnouncementPreferences">
            <br />
            <h2>{_("Announcements")}</h2>
            <div>
                <PreferenceLine title={_("Hide stream announcements")}>
                    <Toggle
                        checked={mute_stream_announcements}
                        onChange={toggleMuteStreamAnnouncements}
                    />
                </PreferenceLine>
                <PreferenceLine title={_("Hide event announcements")}>
                    <Toggle
                        checked={mute_event_announcements}
                        onChange={toggleMuteEventAnnouncements}
                    />
                </PreferenceLine>
            </div>

            <h2>{_("Announcement History")}</h2>

            <PaginatedTable
                className="announcement-history"
                source={`announcements/history`}
                orderBy={["-timestamp"]}
                columns={[
                    {
                        header: "Time",
                        className: "announcement-time ",
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
                                    return pgettext("Announcement type (video stream)", "Stream");
                            }
                            return a.type;
                        },
                    },
                    { header: "Player", className: "", render: (a) => <Player user={a.creator} /> },
                    { header: "Message", className: "announcement-message", render: (a) => a.text },
                    {
                        header: "Link",
                        className: "announcement-link",
                        render: (a) => <a href={a.link}>{a.link}</a>,
                    },
                ]}
            />

            {blocked_players && blocked_players.length > 0 && (
                <div>
                    <h2>{_("Blocked players")}</h2>
                    {blocked_players.map((block_state) => {
                        const user_id = block_state.blocked;
                        if (!user_id) {
                            return null;
                        }
                        return (
                            <div key={user_id} className="blocked-player-row">
                                <span className="blocked-player">{block_state.username}</span>
                                <BlockPlayerModal
                                    playerId={user_id}
                                    inline={true}
                                    onlyAnnouncements={true}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
