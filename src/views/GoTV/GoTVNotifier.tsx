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
    streamId: string;
    username: string;
    title: string;
    profileImageUrl: string;
}

interface GoTVNotifierProps {
    streams: Stream[];
}

const NOTIFICATION_EXPIRATION_HOURS = 12;
const NOTIFICATION_EXPIRATION_MS = NOTIFICATION_EXPIRATION_HOURS * 60 * 60 * 1000;

export const GoTVNotifier: React.FC<GoTVNotifierProps> = ({ streams }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [allowNotifications] = usePreference("gotv.allow-notifications");
    const [followedChannels] = usePreference("gotv.followed-channels");
    const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
    const [notifiedStreams, setNotifiedStreams] = usePreference("gotv.notified-streams");

    useEffect(() => {
        if (!allowNotifications) {
            return;
        }

        const now = Date.now();

        // Clean up old notifications
        const updatedNotifiedStreams = notifiedStreams.filter(
            (notification) => now - notification.timestamp < NOTIFICATION_EXPIRATION_MS,
        );

        if (updatedNotifiedStreams.length !== notifiedStreams.length) {
            setNotifiedStreams(updatedNotifiedStreams);
        }

        const newLiveStreams = streams.filter(
            (stream) =>
                followedChannels.some((channel) => channel.broadcaster_login === stream.channel) &&
                !liveStreams.some((liveStream) => liveStream.stream_id === stream.stream_id) &&
                !updatedNotifiedStreams.some(
                    (notification) => notification.streamId === stream.stream_id,
                ),
        );

        if (newLiveStreams.length > 0) {
            setLiveStreams([...liveStreams, ...newLiveStreams]);
            const newNotifications: Notification[] = newLiveStreams.map((stream) => ({
                streamId: stream.stream_id,
                username: stream.username,
                title: stream.title,
                profileImageUrl: stream.profile_image_url,
            }));
            setNotifications((prev) => [...prev, ...newNotifications]);
        }
    }, [
        streams,
        allowNotifications,
        followedChannels,
        liveStreams,
        notifiedStreams,
        setNotifiedStreams,
    ]);

    const dismissNotification = (index: number) => {
        const dismissedStreamId = notifications[index].streamId;
        setNotifications((prev) => prev.filter((_, i) => i !== index));

        const now = Date.now();

        const notified = [...notifiedStreams, { streamId: dismissedStreamId, timestamp: now }];
        setNotifiedStreams(notified);
    };

    return (
        <div className="gotv-notification-container">
            {notifications.map((notification, index) => (
                <GoTVNotification
                    key={index}
                    username={notification.username}
                    title={notification.title}
                    profileImageUrl={notification.profileImageUrl}
                    onClose={() => dismissNotification(index)}
                />
            ))}
        </div>
    );
};
