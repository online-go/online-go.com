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

import { _ } from "translate";

import { put } from "requests";
import { errorAlerter } from "misc";

import { Toggle } from "Toggle";

import { SettingGroupPageProps, SettingsState } from "SettingsCommon";

export function EmailPreferences(props: SettingGroupPageProps): JSX.Element {
    return (
        <div>
            {_("Email me a notification when ...")}
            {Object.keys(props.state.notifications).map((k) => (
                <EmailNotificationToggle
                    key={k}
                    name={_(props.state.notifications[k].description)}
                    notification={k}
                    state={props.state}
                />
            ))}
        </div>
    );
}

function EmailNotificationToggle(props: {
    state: SettingsState;
    name: string;
    notification: string;
}): JSX.Element {
    const [on, __set]: [boolean, (x: boolean) => void] = React.useState(
        !!props.state.notifications[props.notification].value.email,
    );

    function save(on: boolean): void {
        __set(on);
        const up = {};
        up[props.notification] = {
            description: props.state.notifications[props.notification].description,
            value: {
                email: on,
                mobile: on,
            },
        };
        props.state.notifications[props.notification] = up[props.notification];
        put("me/settings", {
            notifications: up,
        })
            .then(() => 0)
            .catch(errorAlerter);
    }

    return (
        <div className="EmailNotificationToggle">
            <label>
                <span className="preference-toggle-name">{props.name}</span>
                <Toggle onChange={save} checked={on} />
            </label>
        </div>
    );
}
