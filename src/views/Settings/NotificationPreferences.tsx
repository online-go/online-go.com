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
import { usePreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { SettingGroupPageProps } from "@/lib/SettingsCommon";

import { PushDevice, PushDeviceList } from "./PushDeviceList";
import "./NotificationPreferences.css";

interface DeliveryMethods {
    email: boolean;
    mobile: boolean;
    desktop: boolean;
}

/** Which of the Mobile and Desktop settings a device follows, as the server picks it. */
function deliveryMethod(device: PushDevice): "mobile" | "desktop" | null {
    if (device.provider === "webhook") {
        return null;
    }
    if (device.provider === "webpush" && device.form_factor === "desktop") {
        return "desktop";
    }
    return "mobile";
}

/**
 * Separate email, mobile and desktop toggles for each kind of notification, a
 * switch for each delivery method over all of them, and the devices getting
 * them. A delivery method switched off for all notifications keeps each
 * notification's own setting, so switching it back on restores them.
 *
 * The Mobile and Desktop toggles are disabled, and show off, when nothing would
 * be sent that way. Desktop also controls the notifications this browser shows
 * while the site is open, so it stays enabled when those are on.
 */
export function NotificationPreferences(props: SettingGroupPageProps): React.ReactElement {
    const [notifications, setNotifications] = React.useState(props.state.notifications);
    const [enabled, setEnabled] = React.useState<DeliveryMethods>({
        email: true,
        mobile: true,
        desktop: true,
        ...props.state.notifications_enabled,
    });
    const [devices, setDevices] = React.useState<PushDevice[] | null>(null);
    const [in_page_notifications] = usePreference("desktop-notifications");

    let in_page_permitted = false;
    try {
        in_page_permitted = Notification.permission === "granted";
    } catch {
        /* not all browsers support the Notification API */
    }

    const methods = devices?.map(deliveryMethod);
    const no_mobile = methods !== undefined && !methods.includes("mobile");
    const no_desktop =
        methods !== undefined &&
        !methods.includes("desktop") &&
        !(in_page_notifications && in_page_permitted);

    const email_disabled = !enabled.email;
    const mobile_disabled = no_mobile || !enabled.mobile;
    const desktop_disabled = no_desktop || !enabled.desktop;

    /* Streak notifications aren't released yet, so their settings stay hidden */
    const types = Object.keys(notifications).filter((type) => !type.startsWith("streak_"));

    /* The notifications this browser shows itself follow both desktop switches */
    function setDesktopConfig(all_desktop: boolean, values: typeof notifications): void {
        const desktop: { [type: string]: boolean } = {};
        for (const type of Object.keys(values)) {
            desktop[type] = all_desktop && values[type].value.desktop !== false;
        }
        data.set("config.desktop_notifications", desktop);
    }

    function save(type: string, update: Partial<DeliveryMethods>): void {
        const entry = {
            description: notifications[type].description,
            value: { ...notifications[type].value, ...update },
        };
        const updated = { ...notifications, [type]: entry };
        props.state.notifications[type] = entry;
        setNotifications(updated);
        if (update.desktop !== undefined) {
            setDesktopConfig(enabled.desktop, updated);
        }
        put("me/settings", { notifications: { [type]: entry } })
            .then(() => 0)
            .catch(errorAlerter);
    }

    function saveEnabled(update: Partial<DeliveryMethods>): void {
        const updated = { ...enabled, ...update };
        props.state.notifications_enabled = updated;
        setEnabled(updated);
        if (update.desktop !== undefined) {
            setDesktopConfig(updated.desktop, notifications);
        }
        put("me/settings", { notifications_enabled: update })
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
                <span className="all-notifications">
                    {pgettext(
                        "Settings row with switches that turn every kind of notification on or off at once",
                        "All notifications",
                    )}
                </span>
                <label aria-label={pgettext("Toggle label", "Email: all notifications")}>
                    <Toggle checked={enabled.email} onChange={(on) => saveEnabled({ email: on })} />
                </label>
                <label aria-label={pgettext("Toggle label", "Mobile: all notifications")}>
                    <Toggle
                        checked={!no_mobile && enabled.mobile}
                        disabled={no_mobile}
                        onChange={(on) => saveEnabled({ mobile: on })}
                    />
                </label>
                <label aria-label={pgettext("Toggle label", "Desktop: all notifications")}>
                    <Toggle
                        checked={!no_desktop && enabled.desktop}
                        disabled={no_desktop}
                        onChange={(on) => saveEnabled({ desktop: on })}
                    />
                </label>
                {types.map((type) => {
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
                                    checked={!email_disabled && !!email}
                                    disabled={email_disabled}
                                    onChange={(on) => save(type, { email: on })}
                                />
                            </label>
                            <label
                                aria-label={interpolate(pgettext("Toggle label", "Mobile: %s"), [
                                    name,
                                ])}
                            >
                                <Toggle
                                    checked={!mobile_disabled && !!mobile}
                                    disabled={mobile_disabled}
                                    onChange={(on) => save(type, { mobile: on })}
                                />
                            </label>
                            <label
                                aria-label={interpolate(pgettext("Toggle label", "Desktop: %s"), [
                                    name,
                                ])}
                            >
                                <Toggle
                                    checked={!desktop_disabled && desktop !== false}
                                    disabled={desktop_disabled}
                                    onChange={(on) => save(type, { desktop: on })}
                                />
                            </label>
                        </React.Fragment>
                    );
                })}
            </div>
            <PushDeviceList onDevicesChange={setDevices} />
        </div>
    );
}
