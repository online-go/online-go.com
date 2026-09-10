/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { Player } from "@/components/Player";
import type { KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";
import "./KibitzVariationChip.css";

interface KibitzVariationChipProps {
    mode: "draft" | "variation";
    variation: KibitzVariationSummary | null;
    colorIndex: number | null;
    /** The game the variation belongs to, when that is not the room's current
     *  game. Null otherwise. */
    otherGame: KibitzWatchedGame | null;
    /** Leaves the variation and shows the live game again. Rendered as the
     *  close button at the right end of the chip. Drafting, this is the same
     *  route as Cancel and asks before discarding unposted moves. */
    onClose?: () => void;
}

/**
 * Says what the centre board is showing while it shows something other than
 * the live game: the variation's colour, its name, its author, and the game it
 * belongs to when that is not the game the room is watching. It stands in for
 * the room title while it is up, and closes back to the live game.
 */
export function KibitzVariationChip({
    mode,
    variation,
    colorIndex,
    otherGame,
    onClose,
}: KibitzVariationChipProps): React.ReactElement {
    const name =
        mode === "draft"
            ? pgettext(
                  "Label shown while the Kibitz centre board holds an unposted draft",
                  "New variation",
              )
            : variation?.title ||
              pgettext("Fallback title for an untitled variation in kibitz", "Untitled variation");

    const closeLabel = pgettext(
        "Button that closes a Kibitz variation and shows the live game",
        "Back to game",
    );

    return (
        <span className={`KibitzVariationChip ${mode}`}>
            <KibitzVariationSwatch colorIndex={colorIndex} />
            <span className="KibitzVariationChip-name">{name}</span>
            {mode === "variation" && variation ? (
                <span className="KibitzVariationChip-author">
                    <Player user={variation.creator} disableCacheUpdate />
                </span>
            ) : null}
            {otherGame ? (
                <span className="KibitzVariationChip-game">
                    {interpolate(
                        pgettext(
                            "Says which game a Kibitz variation belongs to when it is not the room's current game",
                            "of {{game}}",
                        ),
                        {
                            game:
                                otherGame.title ||
                                interpolate(
                                    pgettext(
                                        "Fallback game label for a Kibitz variation divider",
                                        "Game #{{game_id}}",
                                    ),
                                    { game_id: otherGame.game_id },
                                ),
                        },
                    )}
                </span>
            ) : null}
            {onClose ? (
                <button
                    type="button"
                    className="KibitzVariationChip-close"
                    title={closeLabel}
                    aria-label={closeLabel}
                    onClick={onClose}
                >
                    <i className="fa fa-times" aria-hidden="true" />
                </button>
            ) : null}
        </span>
    );
}
