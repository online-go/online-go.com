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
import { useState } from "react";
import { _ } from "translate";
import { usePreference } from "preferences";
import { Toggle } from "Toggle";
import { PreferenceLine } from "SettingsCommon";
import Select, { MultiValue } from "react-select";
import { twitchLanguageCodes } from "../GoTV/twitchLanguageCodes";
import { useTwitchIntegration } from "../GoTV/useTwitchIntegration";

type LanguageCodes = typeof twitchLanguageCodes;

export function GoTVPreferences(): JSX.Element {
    const { isAuthenticated, isTokenExpired, followedChannels, authenticateWithTwitch } =
        useTwitchIntegration();

    const [showGoTVIndicator, toggleGoTVIndicator] = usePreference("gotv.show-gotv-indicator");
    const [autoSelect, toggleAutoSelect] = usePreference("gotv.auto-select-top-stream");
    const [allowMatureStreams, toggleAllowMatureStreams] = usePreference(
        "gotv.allow-mature-streams",
    );
    const [selectedLanguages, setSelectedLanguages] = usePreference("gotv.selected-languages");
    const [allowNotifications, setAllowNotifications] = usePreference("gotv.allow-notifications");
    const [showFollowedChannels, setShowFollowedChannels] = useState(false);
    const [notifiedStreams, setNotifiedStreams] = usePreference("gotv.notified-streams");

    const languageOptions = Object.keys(twitchLanguageCodes).map((key) => ({
        value: key,
        label: twitchLanguageCodes[key as keyof LanguageCodes],
    }));

    const handleLanguageChange = (
        selectedOptions: MultiValue<{ value: string; label: string }>,
    ) => {
        setSelectedLanguages(
            selectedOptions && selectedOptions.length > 0
                ? selectedOptions.map((option) => option.value)
                : [""],
        );
    };

    const handleShowFollowedChannels = () => {
        setShowFollowedChannels(!showFollowedChannels);
    };

    const clearNotifiedStreams = () => {
        setNotifiedStreams([]);
    };

    return (
        <div className="GoTVPreferences">
            <PreferenceLine title={_("Select preferred languages (multiple allowed)")}>
                <Select
                    options={languageOptions}
                    placeholder={_("All Languages")}
                    isMulti
                    value={languageOptions.filter((option) =>
                        selectedLanguages.includes(option.value),
                    )}
                    onChange={handleLanguageChange}
                    className="language-select"
                    classNamePrefix="ogs-react-select"
                />
            </PreferenceLine>

            <PreferenceLine title={_("Show active streams indicator in navbar")}>
                <Toggle checked={showGoTVIndicator} onChange={toggleGoTVIndicator} />
            </PreferenceLine>

            <PreferenceLine title={_("Automatically play top stream on load")}>
                <Toggle checked={autoSelect} onChange={toggleAutoSelect} />
            </PreferenceLine>

            <PreferenceLine title={_("Show mature streams")}>
                <Toggle checked={allowMatureStreams} onChange={toggleAllowMatureStreams} />
            </PreferenceLine>

            <PreferenceLine title={_("Allow Notifications")}>
                <Toggle checked={allowNotifications} onChange={setAllowNotifications} />
            </PreferenceLine>

            {allowNotifications && (
                <>
                    <PreferenceLine
                        title={_("Connect your Twitch account")}
                        description="Link your Twitch account to get notifications when your favorite streamers are actively streaming Go"
                    >
                        {isAuthenticated ? (
                            <button disabled>{_("Connected")}</button>
                        ) : (
                            <button onClick={authenticateWithTwitch}>
                                {_("Authenticate with Twitch")}
                            </button>
                        )}
                        {isTokenExpired && <p>{_("Token expired. Please re-authenticate.")}</p>}
                    </PreferenceLine>

                    {followedChannels && followedChannels.length > 0 && (
                        <div className="followed-channels">
                            <h3>{_("Followed Twitch Channels")}</h3>
                            {showFollowedChannels ? (
                                <ul>
                                    {followedChannels.map((channel) => (
                                        <li key={channel.broadcaster_id}>
                                            {channel.broadcaster_name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <button onClick={handleShowFollowedChannels}>
                                    {_("Show Followed Channels")}
                                </button>
                            )}
                        </div>
                    )}

                    {/* TEMPORARY
                    Useful for testing, but should be removed before deployment */}
                    <div>
                        <h3>notified streams</h3>
                        <ul>
                            <>
                                {notifiedStreams.map((note) => (
                                    <li key={note.streamId}>
                                        {note.streamId} - {note.timestamp}
                                    </li>
                                ))}
                            </>
                        </ul>
                        <button onClick={clearNotifiedStreams}>Clear notified streams list</button>
                    </div>
                </>
            )}
        </div>
    );
}
