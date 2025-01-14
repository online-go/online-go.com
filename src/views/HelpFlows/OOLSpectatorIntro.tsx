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

import React from "react";

import { HelpFlow, HelpItem } from "react-dynamic-help";

import { pgettext } from "@/lib/translate";

/**
 * A help flow intended for spectators who arrived on an OOL Game Link
 */

export function OOLSpectatorIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="ool-spectator-intro"
            showInitially={true}
            description={pgettext(
                "Name of a dynamic help flow",
                "Online League Spectator Introduction Message",
            )}
        >
            <HelpItem target="spectator-wait" position={"top-right"}>
                <div>
                    {pgettext(
                        "A message to spectators who've come to see a league game",
                        "When both players have pressed their 'ready' button the game will start.",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
