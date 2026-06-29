/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { Flag } from "@/components/Flag/Flag";
import { PlayerDetails } from "@/components/Player/PlayerDetails";
import { rankString, getUserRating, PROVISIONAL_RATING_CUTOFF } from "@/lib/rank_utils";
import { popover } from "@/lib/popover";
import type { KibitzRoomUser } from "@/models/kibitz";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import "./kibitzScoreboardPlayerDisplay.css";

interface KibitzScoreboardPlayerDisplayProps {
    user: KibitzRoomUser;
    side: "black" | "white";
}

function getRankText(user: KibitzRoomUser): string {
    const rating = getUserRating(user, "overall", 0);

    if (user.professional) {
        return rankString(user);
    }

    if (rating.unset && ((user.ranking || 0) > 0 || user.professional)) {
        return rankString(user);
    }

    if (rating.deviation >= PROVISIONAL_RATING_CUTOFF) {
        return "?";
    }

    return rating.bounded_rank_label;
}

function openPlayerPopover(event: React.MouseEvent<HTMLButtonElement>, user: KibitzRoomUser): void {
    event.preventDefault();
    event.stopPropagation();

    popover({
        elt: <PlayerDetails playerId={user.id} />,
        below: event.currentTarget,
        minWidth: 240,
        minHeight: 250,
    });
}

export function KibitzScoreboardPlayerDisplay({
    user,
    side,
}: KibitzScoreboardPlayerDisplayProps): React.ReactElement {
    return (
        <span className={"KibitzScoreboardPlayerDisplay KibitzScoreboardPlayerDisplay--" + side}>
            <button
                type="button"
                className="KibitzScoreboardPlayerDisplay-link"
                onClick={(event) => openPlayerPopover(event, user)}
                aria-label={user.username}
                title={user.username}
            >
                <KibitzUserAvatar
                    user={user}
                    size={32}
                    className="KibitzScoreboardPlayerDisplay-avatar"
                    iconClassName="KibitzScoreboardPlayerDisplay-avatarImage"
                />
                {user.country ? (
                    <span className="KibitzScoreboardPlayerDisplay-flag" aria-hidden="true">
                        <Flag country={user.country} />
                    </span>
                ) : null}
                <span className="KibitzScoreboardPlayerDisplay-identity">
                    <span className="KibitzDesktopMainGameScoreboard-playerName">
                        {user.username}
                    </span>
                    <span className="KibitzDesktopMainGameScoreboard-playerRank">
                        [{getRankText(user)}]
                    </span>
                </span>
            </button>
        </span>
    );
}
