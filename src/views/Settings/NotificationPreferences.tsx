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

import { _, interpolate, pgettext } from "@/lib/translate";
import * as data from "@/lib/data";
import { put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { Toggle } from "@/components/Toggle";
import { SettingGroupPageProps } from "@/lib/SettingsCommon";

import { PushDeviceList } from "./PushDeviceList";
import "./NotificationPreferences.css";

interface DeliveryMethods {
    email: boolean;
    mobile: boolean;
    desktop: boolean;
}

/** Separate email and mobile toggles for each kind of notification, and the devices getting them. */
export function NotificationPreferences(props: SettingGroupPageProps): React.ReactElement {
    const [notifications, setNotifications] = React.useState(props.state.notifications);

    function save(type: string, update: Partial<DeliveryMethods>): void {
        const entry = {
            description: notifications[type].description,
            value: { ...notifications[type].value, ...update },
        };
        props.state.notifications[type] = entry;
        setNotifications({ ...notifications, [type]: entry });
        if (update.desktop !== undefined) {
            data.set("config.desktop_notifications", {
                ...data.get("config.desktop_notifications"),
                [type]: update.desktop,
            });
        }
        put("me/settings", { notifications: { [type]: entry } })
            .then(() => 0)
            .catch(errorAlerter);
    }

    return (
        <div className="NotificationPreferences">
            <div className="notification-toggles">
                <span className="heading">
                    {pgettext(
                        "Heading above the list of events the user can be notified about",
                        "Notify me when ...",
                    )}
                </span>
                <span className="heading">{pgettext("Notification delivery method", "Email")}</span>
                <span className="heading">
                    {pgettext(
                        "Notification delivery method: push notifications to a mobile app",
                        "Mobile",
                    )}
                </span>
                <span className="heading">
                    {pgettext(
                        "Notification delivery method: notifications in a desktop browser",
                        "Desktop",
                    )}
                </span>
                {/* Streak notifications aren't released yet, so their settings stay hidden */}
                {Object.keys(notifications)
                    .filter((type) => !type.startsWith("streak_"))
                    .map((type) => {
                        const name = _(notifications[type].description);
                        const { email, mobile, desktop } = notifications[type].value;
                        return (
                            <React.Fragment key={type}>
                                <span>{name}</span>
                                <label
                                    aria-label={interpolate(pgettext("Toggle label", "Email: %s"), [
                                        name,
                                    ])}
                                >
                                    <Toggle
                                        checked={!!email}
                                        onChange={(on) => save(type, { email: on })}
                                    />
                                </label>
                                <label
                                    aria-label={interpolate(
                                        pgettext("Toggle label", "Mobile: %s"),
                                        [name],
                                    )}
                                >
                                    <Toggle
                                        checked={!!mobile}
                                        onChange={(on) => save(type, { mobile: on })}
                                    />
                                </label>
                                <label
                                    aria-label={interpolate(
                                        pgettext("Toggle label", "Desktop: %s"),
                                        [name],
                                    )}
                                >
                                    <Toggle
                                        checked={desktop !== false}
                                        onChange={(on) => save(type, { desktop: on })}
                                    />
                                </label>
                            </React.Fragment>
                        );
                    })}
            </div>
            <PushDeviceList />
        </div>
    );
}
