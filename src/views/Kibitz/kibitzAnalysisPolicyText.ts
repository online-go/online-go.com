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

import { interpolate, pgettext } from "@/lib/translate";

export function getKibitzAccessBlockedMessage(): string {
    return pgettext(
        "Error shown when a user tries to use their own active analysis-disabled game for Kibitz",
        "You can't create or join a Kibitz room for your own active game while analysis is disabled.",
    );
}

export function getKibitzAnalysisDisabledSpectatorMessage(): string {
    return pgettext(
        "Informational note shown for live Kibitz games with analysis disabled",
        "Players in this game cannot join this Kibitz room while the game is live.",
    );
}

export function getKibitzBlockedRoomMessage(roomTitle: string): string {
    return interpolate(
        pgettext(
            "Blocked Kibitz room message for analysis-disabled games",
            'You can\'t stay in "{{room}}" while it is watching your active game with analysis disabled.',
        ),
        {
            room: roomTitle,
        },
    );
}

export function getKibitzBlockedRoomFollowupMessage(): string {
    return pgettext(
        "Blocked Kibitz room follow-up message for analysis-disabled games",
        "You can return after the game ends, or switch to another room.",
    );
}

export function getKibitzRoomLockedTooltip(): string {
    return pgettext(
        "Tooltip for a kibitz room that is blocked for the current player",
        "Locked for players while the game is live.",
    );
}

export function getKibitzRoomLockedLabel(): string {
    return pgettext(
        "Status shown in the kibitz room list when a room is blocked for the current player",
        "Locked for players",
    );
}

export function getKibitzPickerFailedCreateMessage(): string {
    return pgettext(
        "Error shown when Kibitz room creation fails",
        "Could not create the Kibitz room. Please try again.",
    );
}

export function getKibitzPickerFailedChangeMessage(): string {
    return pgettext(
        "Error shown when Kibitz board switching fails",
        "Could not switch the Kibitz room to that game. Please try again.",
    );
}
