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

export function EscapingJudgementToolIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="escaping-judgement-tool-intro"
            showInitially={false}
            description={llm_pgettext(
                "Name of a dynamic help flow",
                "Escaping Judgement Tool Introduction",
            )}
        >
            <HelpItem target="escape-rate-badge" position="bottom-left">
                <div>
                    {llm_pgettext(
                        "Help message introducing the escaping judgement tool to community moderators",
                        "This is a new escaping judgement tool, currently under test! The idea is to vote for the informal warning if they escaped but they are not escaping too much.",
                    )}
                </div>
            </HelpItem>
            <HelpItem target="informal-warn-escaper-option" position="bottom-left">
                <div>
                    {llm_pgettext(
                        "Help message about the informal warning voting option for escaping reports",
                        "Use this one if they are not escaping too much. Report in the forum if you spot bugs or issues!",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
