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
import { _, pgettext } from "@/lib/translate";

import { openModerationOfferModal } from "./ModerationOfferModal";

interface ModerationOfferProps {
    player_id: number;
    current_moderator_powers: number;
    offered_moderator_powers: number;
    onAck?: () => void;
}

export function ModerationOffer(props: ModerationOfferProps) {
    return (
        <div className="moderation-offer">
            <span>{_("You qualify for access to community moderation tools!")}</span>
            <button
                onClick={() =>
                    openModerationOfferModal(
                        props.player_id,
                        props.current_moderator_powers,
                        props.offered_moderator_powers,
                        props.onAck,
                    )
                }
            >
                {pgettext(
                    "Label of a button to get details of community moderation offer",
                    "Details",
                )}
            </button>
        </div>
    );
}
