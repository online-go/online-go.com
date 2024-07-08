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
import { useEffect, useState } from "react";
import { _ } from "translate";
import { usePreference } from "preferences";
import { Toggle } from "Toggle";
import { PreferenceLine } from "SettingsCommon";
import Select, { MultiValue } from "react-select";
import { twitchLanguageCodes } from "../GoTV/twitchLanguageCodes";

type LanguageCodes = typeof twitchLanguageCodes;

// Client ID will need to be the OGS client ID, probably from environment variable?
const TWITCH_CLIENT_ID = "z00yx3qzdzkh10c6nxku6tqm1pxrgv"; // cspell:disable-line
const REDIRECT_URI = "http://localhost:8080/settings/gotv";

export interface FollowedChannel {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    followed_at: string;
}

export function GoTVPreferences(): JSX.Element {
    const [showGoTVIndicator, toggleGoTVIndicator] = usePreference("gotv.show-gotv-indicator");
    const [autoSelect, toggleAutoSelect] = usePreference("gotv.auto-select-top-stream");
    const [allowMatureStreams, toggleAllowMatureStreams] = usePreference(
        "gotv.allow-mature-streams",
    );
    const [selectedLanguages, setSelectedLanguages] = usePreference("gotv.selected-languages");

    const [allowNotifications, setAllowNotifications] = usePreference("gotv.allow-notifications");
    const [userAccessToken, setUserAccessToken] = usePreference("gotv.user-access-token");
    const [followedChannels, setFollowedChannels] = usePreference("gotv.followed-channels");
    const [showFollowedChannels, setShowFollowedChannels] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);

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

    const authenticateWithTwitch = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:follows`;
        window.location.href = authUrl;
    };

    const getUserID = async (token: string): Promise<string | null> => {
        try {
            const headers = {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch("https://api.twitch.tv/helix/users", { headers });
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0].id;
            }
            return null;
        } catch (error) {
            if (error.response?.status === 401) {
                setIsTokenExpired(true);
            }
            console.error("Error fetching user ID:", error);
            return null;
        }
    };

    const fetchFollowedChannels = async (token: string, userID: string) => {
        try {
            const headers = {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch(
                `https://api.twitch.tv/helix/channels/followed?user_id=${userID}`,
                { headers },
            );
            const data = await response.json();
            console.log("Fetched followed channels:", data); // Logging for debugging
            const channels: FollowedChannel[] = data.data.map((channel: any) => ({
                broadcaster_id: channel.broadcaster_id,
                broadcaster_login: channel.broadcaster_login,
                broadcaster_name: channel.broadcaster_name,
                followed_at: channel.followed_at,
            }));
            setFollowedChannels(channels);
        } catch (error) {
            if (error.response?.status === 401) {
                setIsTokenExpired(true);
            }
            console.error("Error fetching followed channels:", error);
        }
    };

    useEffect(() => {
        const hash = window.location.hash;
        console.log("URL hash:", hash); // Logging for debugging
        if (hash) {
            const params = new URLSearchParams(hash.replace("#", ""));
            const token = params.get("access_token");
            console.log("Access token:", token); // Logging for debugging
            if (token) {
                setUserAccessToken(token);
                getUserID(token)
                    .then((userID) => {
                        if (userID) {
                            fetchFollowedChannels(token, userID).catch((error) =>
                                console.error(error),
                            );
                            setIsAuthenticated(true);
                        }
                    })
                    .catch((error) => console.error(error));
                window.location.hash = "";
            }
        } else if (userAccessToken) {
            getUserID(userAccessToken)
                .then((userID) => {
                    if (userID) {
                        fetchFollowedChannels(userAccessToken, userID).catch((error) =>
                            console.error(error),
                        );
                        setIsAuthenticated(true);
                    }
                })
                .catch((error) => console.error(error));
        }
    }, [userAccessToken]);

    const handleShowFollowedChannels = () => {
        setShowFollowedChannels(!showFollowedChannels);
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
                            <button disabled>{_("Authenticated with Twitch")}</button>
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
                </>
            )}
        </div>
    );
}
