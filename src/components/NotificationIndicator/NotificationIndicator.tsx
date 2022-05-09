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
import { notification_manager } from "Notifications";
import { _ } from "translate";

export function NotificationIndicator({ onClick }: { onClick: () => void }): JSX.Element {
    const [count, setCount] = React.useState(notification_manager.unread_notification_count);

    React.useEffect(() => {
        notification_manager.event_emitter.on("notification-count", setCount);
        return () => {
            notification_manager.event_emitter.off("notification-count", setCount);
        };
    }, []);

    return (
        <span className="NotificationIndicator" title={_("Notifications")} onClick={onClick}>
            <i className={"fa fa-bell " + (count > 0 ? "active" : "")} />
            {count > 0 && <span className="count">{count}</span>}
        </span>
    );
}
