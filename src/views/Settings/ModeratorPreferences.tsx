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
import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { SettingGroupPageProps, PreferenceLine } from "@/lib/SettingsCommon";
import { ReportsCenterSettings } from "@/views/ReportsCenter";
import * as preferences from "@/lib/preferences";

export function ModeratorPreferences(_props: SettingGroupPageProps): React.ReactElement | null {
    const [incident_report_notifications, setIncidentReportNotifications] = usePreference(
        "notify-on-incident-report",
    );
    const [hide_incident_reports, setHideIncidentReports] = usePreference("hide-incident-reports");
    const [hide_claimed_reports, setHideClaimedReports] = usePreference("hide-claimed-reports");
    const [show_cm_reports, setShowCMReports] = usePreference("show-cm-reports");
    const [join_games_anonymously, setJoinGamesAnonymously] = usePreference(
        "moderator.join-games-anonymously",
    );
    const [hide_flags, setHideFlags] = usePreference("moderator.hide-flags");
    const [hide_profile, setHideProfile] = usePreference("moderator.hide-profile-information");
    const [hide_player_card_mod_controls, setHidePlayerCardModControls] = usePreference(
        "moderator.hide-player-card-mod-controls",
    );

    const [report_quota, _setReportQuota] = React.useState(
        preferences.get("moderator.report-quota"),
    );

    const user = data.get("user");

    function updateReportQuota(ev: React.ChangeEvent<HTMLInputElement>) {
        let quota = parseInt(ev.target.value);
        if (!isNaN(quota)) {
            quota = Math.min(200, Math.max(0, quota));
            preferences.set("moderator.report-quota", quota);
            _setReportQuota(quota);
        } else {
            _setReportQuota(ev.target.value as any);
        }
    }

    // At the moment we want moderators do non-CM reports
    React.useEffect(() => {
        if (show_cm_reports) {
            setShowCMReports(false);
        }
    }, [show_cm_reports, setShowCMReports]);

    if (!user.is_moderator && !user.moderator_powers) {
        return null;
    }

    return (
        <div>
            <PreferenceLine title={_("Report quota")} description={_("Set to 0 for no quota.")}>
                <input
                    value={report_quota}
                    onChange={updateReportQuota}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                />
            </PreferenceLine>
            {user.is_moderator && (
                <>
                    <PreferenceLine
                        title={_("Notify me when an incident is submitted for moderation")}
                    >
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
                    <PreferenceLine title="Show un-escalated reports">
                        <Toggle checked={false} onChange={() => {}} />
                        <span>
                            This would include for you reports that CMs can still vote on, but is
                            not currently available.
                        </span>
                    </PreferenceLine>
                    <PreferenceLine title="Join games anonymously">
                        <Toggle
                            checked={join_games_anonymously}
                            onChange={setJoinGamesAnonymously}
                        />
                    </PreferenceLine>
                    <PreferenceLine title="Hide flags">
                        <Toggle checked={hide_flags} onChange={setHideFlags} />
                    </PreferenceLine>
                    <PreferenceLine title="Hide moderator information on profile pages">
                        <Toggle checked={hide_profile} onChange={setHideProfile} />
                    </PreferenceLine>
                    <PreferenceLine title="Hide moderator controls on player cards">
                        <Toggle
                            checked={hide_player_card_mod_controls}
                            onChange={setHidePlayerCardModControls}
                        />
                    </PreferenceLine>

                    <ReportsCenterSettings />
                </>
            )}
        </div>
    );
}
