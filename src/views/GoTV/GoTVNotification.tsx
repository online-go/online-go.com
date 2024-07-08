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
    message: string;
    onClose: () => void;
}

export const GoTVNotification: React.FC<GoTVNotificationProps> = ({ message, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 100); // Small delay to ensure the initial render is off-screen

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`gotv-notification ${visible ? "show" : ""}`}>
            <span>{message}</span>
            <button onClick={onClose}>Dismiss</button>
        </div>
    );
};
