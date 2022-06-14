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

import { _ } from "translate";

import * as data from "data";

import { usePreference } from "preferences";

import { Toggle } from "Toggle";

import { SettingGroupProps, PreferenceLine } from "SettingsCommon";

export function ModeratorPreferences(_props: SettingGroupProps): JSX.Element {
    const [incident_report_notifications, setIncidentReportNotifications] = usePreference(
        "notify-on-incident-report",
    );
    const [hide_incident_reports, setHideIncidentReports] = usePreference("hide-incident-reports");
    const [join_games_anonymously, setJoinGamesAnonymously] = usePreference(
        "moderator.join-games-anonymously",
    );

    const user = data.get("user");

    if (!user.is_moderator) {
        return null;
    }

    return (
        <div>
            <PreferenceLine title={_("Notify me when an incident is submitted for moderation")}>
                <Toggle
                    checked={incident_report_notifications}
                    onChange={setIncidentReportNotifications}
                />
            </PreferenceLine>
            <PreferenceLine title="Hide incident reports">
                <Toggle checked={hide_incident_reports} onChange={setHideIncidentReports} />
            </PreferenceLine>
            <PreferenceLine title="Join games anonymously">
                <Toggle checked={join_games_anonymously} onChange={setJoinGamesAnonymously} />
            </PreferenceLine>
        </div>
    );
}
