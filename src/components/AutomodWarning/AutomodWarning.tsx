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

/* The popup the chat automod pushes to a user when it flags one of their chat
 * messages. The automod itself runs in the ogs repo's ChatAutomod. */

import * as React from "react";
import { push_manager } from "@/components/UIPush";
import { interpolate, llm_pgettext } from "@/lib/translate";
import { toast } from "@/lib/toast";
import "./AutomodWarning.css";

const MAX_QUOTE_LENGTH = 200;

export function AutomodWarning({ message }: { message: string }): React.ReactElement {
    const quote =
        message.length > MAX_QUOTE_LENGTH ? message.slice(0, MAX_QUOTE_LENGTH) + "…" : message;

    return (
        <div className="AutomodWarning">
            <i className="fa fa-exclamation-triangle" />
            <div>
                {interpolate(
                    llm_pgettext(
                        "Popup shown to a user right after an automatic moderation system flagged one of their chat messages as offensive. {{message}} is the message they sent.",
                        'Your message "{{message}}" was flagged as offensive. Insults, slurs, harassment and hateful language are not allowed on Online-Go.com.',
                    ),
                    { message: quote },
                )}
            </div>
        </div>
    );
}

push_manager.on("automod-warning", (data: { message: string }) => {
    toast(<AutomodWarning message={data.message} />);
});
