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

import { interpolate, pgettext } from "@/lib/translate";
import { put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";

import { Toggle } from "@/components/Toggle";

import { SettingsState } from "@/lib/SettingsCommon";
import "./NotificationToggleRow.css";

interface DeliveryMethods {
    email: boolean;
    mobile: boolean;
}

/** One notification type, with independent email and push toggles. */
export function NotificationToggleRow(props: {
    state: SettingsState;
    name: string;
    notification: string;
}): React.ReactElement {
    const current = props.state.notifications[props.notification].value;
    const [methods, setMethods] = React.useState<DeliveryMethods>({
        email: !!current.email,
        mobile: !!current.mobile,
    });

    function save(update: Partial<DeliveryMethods>): void {
        const value = { ...methods, ...update };
        setMethods(value);
        const entry = {
            description: props.state.notifications[props.notification].description,
            value,
        };
        props.state.notifications[props.notification] = entry;
        put("me/settings", {
            notifications: { [props.notification]: entry },
        })
            .then(() => 0)
            .catch(errorAlerter);
    }

    return (
        <div className="NotificationToggleRow">
            <span className="preference-toggle-name">{props.name}</span>
            <label aria-label={interpolate(pgettext("Toggle label", "Email: %s"), [props.name])}>
                <Toggle onChange={(on) => save({ email: on })} checked={methods.email} />
            </label>
            <label aria-label={interpolate(pgettext("Toggle label", "Push: %s"), [props.name])}>
                <Toggle onChange={(on) => save({ mobile: on })} checked={methods.mobile} />
            </label>
        </div>
    );
}
