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
 * Help flow for users suspended due to AI detection, providing guidance on
 * how to appeal and what information to include.
 */

export function AIDetectionAppealHelp(): React.ReactElement {
    return (
        <HelpFlow
            id="ai-detection-appeal-help"
            showInitially={false}
            description={pgettext("Name of a dynamic help flow", "AI Detection Appeal Help")}
        >
            <HelpItem target="ai-detection-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to AI detection - part 1",
                        "Your account was flagged by our AI detection system. It says 'It appears you are using outside assistance in your games'. \
                         Our detection system uses all the data we have available about your activity at OGS to determine this.",
                    )}
                </div>
            </HelpItem>
            <HelpItem target="ai-detection-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to AI detection - part 2",
                        "To appeal, please either confirm that you will stop using AI assistance in your games, or let us know if you have never used AI assistance (or any other outside assistance). ",
                    )}
                </div>
            </HelpItem>
            <HelpItem target="ai-detection-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to AI detection - part 3",
                        "You can read more about this here: https://github.com/online-go/online-go.com/wiki/Moderation-at-OGS#minimizing-ai-cheating",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
