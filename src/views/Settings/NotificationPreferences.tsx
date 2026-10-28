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

import { _, pgettext } from "@/lib/translate";

import { SettingGroupPageProps } from "@/lib/SettingsCommon";

import { NotificationToggleRow } from "./NotificationToggleRow";
import { PushDeviceList } from "./PushDeviceList";
import "./NotificationPreferences.css";

export function NotificationPreferences(props: SettingGroupPageProps): React.ReactElement {
    return (
        <div className="NotificationPreferences">
            <div className="notification-toggle-header">
                <span>
                    {pgettext(
                        "Heading above the list of events the user can be notified about",
                        "Notify me when ...",
                    )}
                </span>
                <span>{pgettext("Notification delivery method", "Email")}</span>
                <span>
                    {pgettext(
                        "Notification delivery method: push notifications to a mobile app",
                        "Push",
                    )}
                </span>
            </div>
            {Object.keys(props.state.notifications).map((k) => (
                <NotificationToggleRow
                    key={k}
                    name={_(props.state.notifications[k].description)}
                    notification={k}
                    state={props.state}
                />
            ))}
            <PushDeviceList />
        </div>
    );
}
