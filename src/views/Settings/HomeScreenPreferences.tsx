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

import { pgettext } from "@/lib/translate";
import { usePreference, ValidPreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { SettingGroupPageProps, PreferenceLine } from "@/lib/SettingsCommon";

function HomeToggle({
    preference,
    title,
}: {
    preference: ValidPreference;
    title: string;
}): React.ReactElement {
    const [value, setValue] = usePreference(preference);

    return (
        <PreferenceLine title={title}>
            <Toggle checked={!!value} onChange={setValue} />
        </PreferenceLine>
    );
}

export function HomeScreenPreferences(_props: SettingGroupPageProps): React.ReactElement {
    return (
        <div className="HomeScreenPreferences">
            <HomeToggle
                preference="home-show-PlayButtons"
                title={pgettext("Home screen component toggle", "Quick play buttons")}
            />
            <HomeToggle
                preference="home-show-ActiveDroppedGameList"
                title={pgettext("Home screen component toggle", "Active games list")}
            />
            <HomeToggle
                preference="home-show-GameCount"
                title={pgettext("Home screen component toggle", "Show game count")}
            />
            <HomeToggle
                preference="home-show-ActiveAnnouncements"
                title={pgettext("Home screen component toggle", "Announcements")}
            />
            <HomeToggle
                preference="home-show-WhatsNewBanner"
                title={pgettext("Home screen component toggle", "What's new banner")}
            />
            <HomeToggle
                preference="home-show-ProfileCard"
                title={pgettext("Home screen component toggle", "Profile card")}
            />
            <HomeToggle
                preference="home-show-TournamentList"
                title={pgettext("Home screen component toggle", "Tournaments")}
            />
            <HomeToggle
                preference="home-show-LadderList"
                title={pgettext("Home screen component toggle", "Ladders")}
            />
            <HomeToggle
                preference="home-show-GroupList"
                title={pgettext("Home screen component toggle", "Groups")}
            />
            <HomeToggle
                preference="home-show-HomeFriendList"
                title={pgettext("Home screen component toggle", "Friends list")}
            />
        </div>
    );
}
