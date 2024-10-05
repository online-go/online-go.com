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

import { useState, useEffect } from "react";
import { usePreference } from "@/lib/preferences";

// Client ID will need to be the OGS client ID, probably from environment variable?
// Redirect URI also needs to match the allowed redirect URIs in the console at dev.twitch.tv
const TWITCH_CLIENT_ID = "xvy1fywrxk9si1l88ba4otjo239ho8"; // cspell:disable-line
const REDIRECT_URI = `${window.location.protocol}//${window.location.host}/settings/gotv`;

export interface FollowedChannel {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    followed_at: string;
}

export function useTwitchIntegration() {
    const [isTokenExpired, setIsTokenExpired] = useState(false);
    const [userAccessToken, setUserAccessToken] = usePreference("gotv.user-access-token");
    const [followedChannels, setFollowedChannels] = usePreference("gotv.followed-channels");

    // Determine if user is authenticated based on the presence of a user access token
    const isAuthenticated = Boolean(userAccessToken && !isTokenExpired);

    // Effect to handle token extraction from URL hash or fetching followed channels if token exists
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.replace("#", ""));
            const token = params.get("access_token");
            if (token) {
                setUserAccessToken(token);
                window.location.hash = "";
            }
        } else if (userAccessToken) {
            getUserID(userAccessToken)
                .then((userID) => {
                    if (userID) {
                        fetchFollowedChannels(userAccessToken, userID).catch(console.error);
                    }
                })
                .catch(console.error);
        }
    }, [userAccessToken]);

    // Effect to handle token expiration
    useEffect(() => {
        if (isTokenExpired) {
            authenticateWithTwitch();
        }
    }, [isTokenExpired]);

    // Function to initiate Twitch authentication
    const authenticateWithTwitch = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:follows`;
        window.location.href = authUrl;
    };

    // Function to handle token error (e.g., expiration)
    const handleTokenError = () => {
        setIsTokenExpired(true);
        setUserAccessToken(""); // Clear the expired token
        setFollowedChannels([]); // Clear followed channels as they are no longer valid
    };

    // Function to get user ID from Twitch using the access token
    const getUserID = async (token: string): Promise<string | null> => {
        try {
            const headers = {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch("https://api.twitch.tv/helix/users", { headers });
            if (response.status === 401) {
                handleTokenError();
                return null;
            }
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0].id;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user ID:", error);
            handleTokenError();
            return null;
        }
    };

    // Function to fetch followed channels from Twitch using the user ID
    const fetchFollowedChannels = async (token: string, userID: string) => {
        try {
            let followedChannels: FollowedChannel[] = [];
            const headers = {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${token}`,
            };

            let cursor = "";
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(
                    `https://api.twitch.tv/helix/channels/followed?user_id=${userID}&after=${cursor}`,
                    { headers },
                );
                if (response.status === 401) {
                    handleTokenError();
                    return;
                }
                const data = await response.json();
                followedChannels = followedChannels.concat(
                    data.data.map((channel: any) => ({
                        broadcaster_id: channel.broadcaster_id,
                        broadcaster_login: channel.broadcaster_login,
                        broadcaster_name: channel.broadcaster_name,
                        followed_at: channel.followed_at,
                    })),
                );

                cursor = data.pagination.cursor || "";
                hasMore = data.pagination && data.pagination.cursor;
            }

            setFollowedChannels(followedChannels);
        } catch (error) {
            console.error("Error fetching followed channels:", error);
            handleTokenError();
        }
    };

    return {
        isAuthenticated,
        isTokenExpired,
        userAccessToken,
        setUserAccessToken,
        followedChannels,
        authenticateWithTwitch,
    };
}
