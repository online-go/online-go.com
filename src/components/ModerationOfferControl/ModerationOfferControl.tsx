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
import { _ } from "@/lib/translate";

interface ModerationOfferControlProps {
    ability: string; // Title/label for this power
    ability_mask: number; // which bitfield carries the power we want to offer
    currently_offered: number; // what they are already offered
    moderator_powers: number; // what they already have
    previously_rejected: boolean;
    onMakeOffer: (offer_mask: number) => void;
    onRetractOffer: (offer_mask: number) => void;
    onRemovePower: (offer_mask: number) => void;
}

export function ModerationOfferControl(props: ModerationOfferControlProps) {
    const is_offered = (props.currently_offered & props.ability_mask) > 0;
    const has_power = (props.moderator_powers & props.ability_mask) > 0;

    return (
        <div className="ModerationOfferControl">
            <span className="moderation-ability">
                {props.ability}
                {(has_power && <i className="fa fa-check" />) ||
                    (props.previously_rejected && <i className="fa fa-times-circle" />)}
            </span>

            {has_power ? (
                <button onClick={() => props.onRemovePower(props.ability_mask)}>
                    {_("Revoke")}
                </button>
            ) : is_offered ? (
                <button onClick={() => props.onRetractOffer(props.ability_mask)}>
                    {_("Retract Offer")}
                </button>
            ) : (
                <button onClick={() => props.onMakeOffer(props.ability_mask)}>{_("Offer")}</button>
            )}
        </div>
    );
}
