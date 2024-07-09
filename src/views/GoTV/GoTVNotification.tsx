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

interface GoTVNotificationProps {
    username: string;
    title: string;
    profileImageUrl: string;
    onClose: () => void;
    animationDelay: string;
}

// GoTVNotification component displays a notification for a live stream
export const GoTVNotification: React.FC<GoTVNotificationProps> = ({
    username,
    title,
    profileImageUrl,
    onClose,
    animationDelay,
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Set a timer to change the visibility state after a short delay
        const timer = setTimeout(() => {
            console.log("Profile image url:", profileImageUrl);
            setVisible(true);
        }, 100); // Small delay to ensure the initial render is off-screen

        // Cleanup the timer when the component unmounts
        return () => clearTimeout(timer);
    }, []);

    return (
        // Apply the "show" class if the notification is visible and set animation delay
        <div className={`gotv-notification ${visible ? "show" : ""}`} style={{ animationDelay }}>
            {/* Display the profile image */}
            <img src={profileImageUrl} alt={`${username}'s profile`} className="profile-image" />
            <div className="notification-content">
                <div className="notification-header">
                    <strong>{username} is live:</strong>
                </div>
                <div className="notification-body">
                    {/* Truncate the title if it's longer than 30 characters */}
                    <small>{title.length > 30 ? `${title.substring(0, 30)}...` : title}</small>
                </div>
            </div>
            {/* Button to dismiss the notification */}
            <button onClick={onClose}>Dismiss</button>
        </div>
    );
};
