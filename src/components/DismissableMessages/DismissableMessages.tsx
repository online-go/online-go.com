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

/* cspell: disable */

import * as React from "react";
import * as data from "@/lib/data";
import { del } from "@/lib/requests";
import { DismissableMessagesSchema } from "@/lib/data_schema";
import { AutoTranslate } from "@/components/AutoTranslate";
import { UIPush } from "@/components/UIPush";
import "./DismissableMessages.css";

interface DismissableMessagesProps {
    forceShow?: boolean;
}

export function DismissableMessages({
    forceShow,
}: DismissableMessagesProps): React.ReactElement | null {
    const [messages, setMessages] = React.useState<DismissableMessagesSchema | undefined>(
        data.get("config.dismissable_messages"),
    );

    React.useEffect(() => {
        data.watch("config.dismissable_messages", setMessages);
    }, []);

    if (!forceShow && (!messages || Object.keys(messages).length === 0)) {
        return null;
    }

    function dismiss(key: string) {
        if (!messages) {
            return;
        }

        console.log("Should dismiss", key);
        delete messages[key];
        data.set("config.dismissable_messages", messages);
        del(`/api/v1/me/messages/${key}`)
            .then(() => console.log(`Message ${key} dismissed`))
            .catch(console.error);
    }

    return (
        <div className="DismissableMessages">
            <UIPush
                channel={`${data.get("user").id}`}
                event="dismissable_messages"
                action={setMessages}
            />
            {messages &&
                Object.keys(messages).map((key) => (
                    <div key={key} className="DismissableMessage">
                        <i className="fa fa-times" onClick={() => dismiss(key)} />
                        <AutoTranslate
                            source={messages[key].message}
                            source_language={messages[key].language}
                            markdown
                        />
                    </div>
                ))}
            {forceShow && (!messages || Object.keys(messages).length === 0) && (
                <div className="DismissableMessage">
                    <i className="fa fa-times" />
                    {/* Lorem ipsum placeholder text is fine here because this
                        is only ever visible for development when we are force
                        showing the component and there is no existing message
                        */}
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua.
                </div>
            )}
        </div>
    );
}
