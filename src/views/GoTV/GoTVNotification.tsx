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
import { _, interpolate } from "@/lib/translate";

interface GoTVNotificationProps {
    streamId: string;
    username: string;
    title: string;
    profileImageUrl: string;
    onClose: () => void;
    animationDelay: string;
    handleClick: (streamId: string) => void;
}

// GoTVNotification component displays a notification for a live stream
export const GoTVNotification: React.FC<GoTVNotificationProps> = ({
    username,
    title,
    profileImageUrl,
    onClose,
    animationDelay,
    streamId,
    handleClick,
}) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 100); // Small delay to ensure the initial render is off-screen

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        setTimeout(() => onClose(), 300); // Delay the actual dismissal to allow animation to complete
    };

    return (
        <div
            className={`gotv-notification ${visible ? "show" : ""} ${dismissed ? "slide-out" : ""}`}
            style={{ animationDelay }}
        >
            <img src={profileImageUrl} alt={`${username}'s profile`} className="profile-image" />
            <div className="notification-content" onClick={() => handleClick(streamId)}>
                <div className="notification-header">
                    <strong>{interpolate(_("%s is live!"), [username])}</strong>
                </div>
                <div className="notification-body">
                    {/* Truncate the title if it's longer than 30 characters */}
                    <small>{title.length > 30 ? `${title.substring(0, 30)}...` : title}</small>
                </div>
            </div>
            {/* Button to dismiss the notification */}
            <button onClick={handleDismiss}>{_("Dismiss")}</button>
        </div>
    );
};
