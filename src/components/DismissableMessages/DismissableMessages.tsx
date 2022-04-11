/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as data from "data";
import { del } from "requests";
import { DismissableMessagesSchema } from "data_schema";
import { AutoTranslate } from "AutoTranslate";
import { UIPush } from "UIPush";

export function DismissableMessages(): JSX.Element {
    const [messages, setMessages] = React.useState<DismissableMessagesSchema>(
        data.get("config.dismissable_messages"),
    );

    React.useEffect(() => {
        data.watch("config.dismissable_messages", setMessages);
    }, []);

    if (!messages || Object.keys(messages).length === 0) {
        return null;
    }

    function dismiss(key: string) {
        console.log("Should dismiss", key);
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
            {Object.keys(messages).map((key) => (
                <div key={key} className="DismissableMessage">
                    <i className="fa fa-times" onClick={() => dismiss(key)} />
                    <AutoTranslate
                        source={messages[key].message}
                        source_language={messages[key].language}
                        markdown
                    />
                </div>
            ))}
        </div>
    );
}
