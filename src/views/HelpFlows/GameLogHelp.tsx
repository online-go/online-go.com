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

import { llm_pgettext } from "@/lib/translate";

/**
 * A help flow intended for moderators and CMs wondering about mysterious auto score entries
 */

export function GameLogHelp(): React.ReactElement {
    return (
        <HelpFlow
            id="game-log-help"
            showInitially={true}
            debug={false}
            description={llm_pgettext("Name of a dynamic help flow", "Game Log Help")}
        >
            <HelpItem target="autoscore-game-log-entry" position={"bottom-center"}>
                <div>
                    {llm_pgettext(
                        "",
                        "Auto-scorer updates. 'server autoscore' is the server's proposal at the start of the scoring phase. 'stone removal stones set' entries with this label come from a user's browser: two per user when it scores locally (boards over 19x19, or no server proposal), and when the user presses 'Auto-score'.",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
