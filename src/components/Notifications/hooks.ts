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
import { notification_manager, Notification } from "./NotificationManager";

export function useNotifications(types: string[]): Notification[] {
    const [list, setList] = React.useState<Notification[]>(
        notification_manager.ordered_notifications.filter((n) => types.includes(n.type)),
    );

    React.useEffect(() => {
        function refresh() {
            setList(
                notification_manager.ordered_notifications.filter((n) => types.includes(n.type)),
            );
        }

        notification_manager.event_emitter.on("notification-list-updated", refresh);

        return () => {
            notification_manager.event_emitter.off("notification-list-updated", refresh);
        };
    }, []);

    return list;
}
