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
import { usePreference } from "@/lib/preferences";
import { GoTVNotification } from "./GoTVNotification";
import { useNavigate } from "react-router-dom";
import { _ } from "@/lib/translate";

interface Notification {
    streamId: string;
    username: string;
    title: string;
    profileImageUrl: string;
}

interface GoTVNotifierProps {
    streams: Stream[];
}

// Constants for notification expiration time
const NOTIFICATION_EXPIRATION_HOURS = 12;
const NOTIFICATION_EXPIRATION_MS = NOTIFICATION_EXPIRATION_HOURS * 60 * 60 * 1000;

// GoTVNotifier component manages notifications for live streams
export function GoTVNotifier({ streams }: GoTVNotifierProps): React.ReactElement {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [allowNotifications] = usePreference("gotv.allow-notifications");
    const [followedChannels] = usePreference("gotv.followed-channels");
    const [notifiedStreams, setNotifiedStreams] = usePreference("gotv.notified-streams");

    const navigate = useNavigate();

    // Effect to clean up old notifications
    useEffect(() => {
        if (!allowNotifications) {
            return;
        }

        const now = Date.now();
        const updatedNotifiedStreams = notifiedStreams.filter(
            (notification) => now - notification.timestamp < NOTIFICATION_EXPIRATION_MS,
        );

        if (updatedNotifiedStreams.length !== notifiedStreams.length) {
            setNotifiedStreams(updatedNotifiedStreams);
        }
    }, [allowNotifications, notifiedStreams]);

    // Effect to update notifications for new live streams
    useEffect(() => {
        if (!allowNotifications) {
            return;
        }

        const now = Date.now();
        const updatedNotifiedStreams = notifiedStreams.filter(
            (notification) => now - notification.timestamp < NOTIFICATION_EXPIRATION_MS,
        );

        // Filter new live streams that are followed and not already notified
        const newLiveStreams = streams.filter(
            (stream) =>
                followedChannels.some((channel) => channel.broadcaster_login === stream.channel) &&
                !updatedNotifiedStreams.some(
                    (notification) => notification.streamId === stream.stream_id,
                ),
        );

        // Update the notifications state with new live streams
        if (newLiveStreams.length > 0) {
            setNotifications((prevNotifications) => {
                const newNotifications = newLiveStreams
                    .filter(
                        (stream) =>
                            !prevNotifications.some(
                                (notification) => notification.streamId === stream.stream_id,
                            ),
                    )
                    .map((stream) => ({
                        streamId: stream.stream_id,
                        username: stream.username,
                        title: stream.title,
                        profileImageUrl: stream.profile_image_url,
                    }));
                return [...prevNotifications, ...newNotifications];
            });
        }
    }, [streams, allowNotifications, followedChannels, notifiedStreams]);

    // Effect to remove notifications for streams that are no longer live
    useEffect(() => {
        if (!allowNotifications) {
            return;
        }

        const activeStreamIds = new Set(streams.map((stream) => stream.stream_id));
        setNotifications((prev) =>
            prev.filter((notification) => activeStreamIds.has(notification.streamId)),
        );
    }, [streams, allowNotifications]);

    // Function to dismiss a notification and update the notified streams
    const dismissNotification = (index: number) => {
        const dismissedStreamId = notifications[index].streamId;
        setNotifications((prev) => prev.filter((_, i) => i !== index));

        const now = Date.now();

        const updatedNotifiedStreams = [
            ...notifiedStreams.filter(
                (notification) => now - notification.timestamp < NOTIFICATION_EXPIRATION_MS,
            ),
            { streamId: dismissedStreamId, timestamp: now },
        ];
        setNotifiedStreams(updatedNotifiedStreams);
    };

    const dismissAllNotifications = () => {
        const now = Date.now();

        // Pre-compute the updates for notifiedStreams based on the current notifications
        const additionalNotifiedStreams = notifications.map((notification) => ({
            streamId: notification.streamId,
            timestamp: now,
        }));

        // Update notifiedStreams with all notifications marked as dismissed
        const updatedNotifiedStreams = [
            ...notifiedStreams.filter(
                (notification) => now - notification.timestamp < NOTIFICATION_EXPIRATION_MS,
            ),
            ...additionalNotifiedStreams,
        ];

        setNotifiedStreams(updatedNotifiedStreams);

        // Clear notifications after notifiedStreams has been updated
        setNotifications([]);
    };

    const handleNotificationClick = (streamId: string) => {
        navigate("/gotv", { state: { streamId } });
        dismissAllNotifications();
    };

    return (
        <div className="gotv-notification-container">
            {notifications.map((notification, index) => (
                <GoTVNotification
                    key={notification.streamId}
                    streamId={notification.streamId}
                    username={notification.username}
                    title={notification.title}
                    profileImageUrl={notification.profileImageUrl}
                    onClose={() => dismissNotification(index)}
                    handleClick={(streamId: string) => handleNotificationClick(streamId)}
                    animationDelay={`${index * 0.1}s`}
                />
            ))}
            {notifications.length > 1 && (
                <button id="dismiss-all" onClick={dismissAllNotifications}>
                    {_("Dismiss All")}
                </button>
            )}
        </div>
    );
}
