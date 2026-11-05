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
import { post } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { errorAlerter } from "@/lib/misc";
import { challenge_text_description, ChallengeDetails } from "@/components/ChallengeModal";
import { notification_manager } from "@/components/Notifications/NotificationManager";

/**
 * Offers to accept the challenge that a game which hasn't started belongs to,
 * as when the player followed a challenge's push notification here. The
 * challenge comes from the player's notifications, which arrive after the page
 * loads, so it waits for them. Once accepted, the page reloads to show the
 * started game.
 */
export function useAcceptChallengePrompt(game_id: number, unstarted_challenge: boolean): void {
    React.useEffect(() => {
        if (!unstarted_challenge) {
            return;
        }
        let offered = false;

        function offer() {
            const challenge = notification_manager.ordered_notifications.find(
                (n) => n.type === "challenge" && n.game_id === game_id,
            );
            if (offered || !challenge) {
                return;
            }
            offered = true;
            void alert
                .fire({
                    title: interpolate(
                        pgettext(
                            "Title of a dialog to accept a game challenge",
                            "Challenge from {{username}}",
                        ),
                        { username: challenge.user?.username ?? "" },
                    ),
                    text: challenge_text_description(challenge as unknown as ChallengeDetails),
                    showCancelButton: true,
                    confirmButtonText: pgettext("Accept a game challenge", "Accept"),
                    cancelButtonText: pgettext("Leave a game challenge for later", "Not now"),
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        post(`me/challenges/${challenge.challenge_id}/accept`, {})
                            .then(() => window.location.reload())
                            .catch(errorAlerter);
                    }
                });
        }

        offer();
        notification_manager.event_emitter.on("notification-list-updated", offer);
        return () => {
            notification_manager.event_emitter.off("notification-list-updated", offer);
        };
    }, [game_id, unstarted_challenge]);
}
