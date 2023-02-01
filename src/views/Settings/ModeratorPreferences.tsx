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
import * as data from "data";
import { _ } from "translate";
import { usePreference } from "preferences";
import { Toggle } from "Toggle";
import { SettingGroupPageProps, PreferenceLine } from "SettingsCommon";
import { ReportsCenterSettings } from "ReportsCenter";

export function ModeratorPreferences(_props: SettingGroupPageProps): JSX.Element {
    const [incident_report_notifications, setIncidentReportNotifications] = usePreference(
        "notify-on-incident-report",
    );
    const [hide_incident_reports, setHideIncidentReports] = usePreference("hide-incident-reports");
    const [hide_claimed_reports, setHideClaimedReports] = usePreference("hide-claimed-reports");
    const [join_games_anonymously, setJoinGamesAnonymously] = usePreference(
        "moderator.join-games-anonymously",
    );
    const [hide_flags, setHideFlags] = usePreference("moderator.hide-flags");
    const [hide_profile, setHideProfile] = usePreference("moderator.hide-profile-information");
    const [hide_next_game_arrows, setHideNextGameArrows] = usePreference(
        "moderator.hide-next-game-arrows",
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
            <PreferenceLine title="Hide claimed reports">
                <Toggle checked={hide_claimed_reports} onChange={setHideClaimedReports} />
            </PreferenceLine>
            <PreferenceLine title="Join games anonymously">
                <Toggle checked={join_games_anonymously} onChange={setJoinGamesAnonymously} />
            </PreferenceLine>
            <PreferenceLine title="Hide flags">
                <Toggle checked={hide_flags} onChange={setHideFlags} />
            </PreferenceLine>
            <PreferenceLine title="Hide moderator information on profile pages">
                <Toggle checked={hide_profile} onChange={setHideProfile} />
            </PreferenceLine>
            <PreferenceLine title="Hide 'next game' arrows on player cards">
                <Toggle checked={hide_next_game_arrows} onChange={setHideNextGameArrows} />
            </PreferenceLine>
            <ReportsCenterSettings />
        </div>
    );
}
