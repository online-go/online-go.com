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

import React, { useEffect, useState } from "react";
import { Stream } from "./StreamManager";
import { usePreference } from "preferences";
import { GoTVNotification } from "./GoTVNotification";

interface Notification {
    stream: Stream;
    message: string;
}

interface GoTVNotifierProps {
    streams: Stream[];
}

export const GoTVNotifier: React.FC<GoTVNotifierProps> = ({ streams }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [allowNotifications] = usePreference("gotv.allow-notifications");
    const [followedChannels] = usePreference("gotv.followed-channels");
    const [liveStreams, setLiveStreams] = useState<Stream[]>([]);

    useEffect(() => {
        if (!allowNotifications) {
            return;
        }

        const newLiveStreams = streams?.filter(
            (stream) =>
                followedChannels.some((channel) => channel.broadcaster_login === stream.channel) &&
                !liveStreams.some((liveStream) => liveStream.stream_id === stream.stream_id),
        );

        if (newLiveStreams.length > 0) {
            setLiveStreams([...liveStreams, ...newLiveStreams]);
            const newNotifications: Notification[] = newLiveStreams.map((stream) => ({
                stream,
                message: `${stream.username} is now live: ${stream.title}`,
            }));
            setNotifications((prev) => [...prev, ...newNotifications]);
        }
    }, [streams, allowNotifications, followedChannels, liveStreams]);

    const dismissNotification = (index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="gotv-notification-container">
            {notifications.map((notification, index) => (
                <GoTVNotification
                    key={index}
                    message={notification.message}
                    onClose={() => dismissNotification(index)}
                />
            ))}
        </div>
    );
};
