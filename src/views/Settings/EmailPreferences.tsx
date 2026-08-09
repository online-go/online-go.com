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

import { _ } from "@/lib/translate";
import { ENABLE_WEB_PUSH } from "@/lib/features";
import { isWebPushSupported } from "@/lib/web_push";

import { put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";

import { Toggle } from "@/components/Toggle";

import { SettingGroupPageProps, SettingsState } from "@/lib/SettingsCommon";

export function EmailPreferences(props: SettingGroupPageProps): React.ReactElement {
    const web_push_available =
        ENABLE_WEB_PUSH &&
        typeof Notification !== "undefined" &&
        isWebPushSupported() &&
        Notification.permission === "granted";
    const notifications = (props.state.notifications ?? {}) as NotificationSettings;

    return (
        <div>
            {_("Email me a notification when ...")}
            {Object.keys(notifications).map((k) => (
                <EmailNotificationToggle
                    key={k}
                    name={_(notifications[k].description)}
                    notification={k}
                    state={props.state}
                    webPushAvailable={web_push_available}
                />
            ))}
        </div>
    );
}

interface NotificationValue {
    email?: boolean;
    mobile?: boolean;
    web_push?: boolean;
}

interface NotificationSetting {
    description: string;
    value: NotificationValue;
}

type NotificationSettings = Record<string, NotificationSetting>;

function EmailNotificationToggle(props: {
    state: SettingsState;
    name: string;
    notification: string;
    webPushAvailable: boolean;
}): React.ReactElement {
    const notifications = props.state.notifications as NotificationSettings;
    const setting = notifications[props.notification];
    const [email_on, setEmailOn] = React.useState(!!setting.value.email);
    const [web_push_on, setWebPushOn] = React.useState(!!setting.value.web_push);

    function save(channel: "email" | "web_push", on: boolean): void {
        if (channel === "email") {
            setEmailOn(on);
        } else {
            setWebPushOn(on);
        }

        const updated_setting: NotificationSetting = {
            description: setting.description,
            value: {
                ...setting.value,
                [channel]: on,
            },
        };
        notifications[props.notification] = updated_setting;
        put("me/settings", {
            notifications: {
                [props.notification]: updated_setting,
            },
        })
            .then(() => 0)
            .catch(errorAlerter);
    }

    return (
        <div className="EmailNotificationToggle">
            <span className="preference-toggle-name">{props.name}</span>
            <label>
                <span>{_("Email")}</span>
                <Toggle onChange={(on) => save("email", on)} checked={email_on} />
            </label>
            {ENABLE_WEB_PUSH && (
                <label>
                    <span>{_("Web Push")}</span>
                    <Toggle
                        onChange={(on) => save("web_push", on)}
                        checked={web_push_on}
                        disabled={!props.webPushAvailable}
                    />
                </label>
            )}
        </div>
    );
}
