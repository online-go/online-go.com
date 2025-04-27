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

import { get } from "@/lib/requests";
import { AccountWarningMessage } from "../AccountWarning/AccountWarning";
import { _ } from "@/lib/translate";

interface WarningSystemMessagesProps {
    onlyOutstanding?: boolean;
}

export function WarningSystemMessagesPane({ onlyOutstanding = false }: WarningSystemMessagesProps) {
    return (
        <div className="WarningSystemMessage-container">
            <h2 className="warning-system-messages-title">{_("Warning System Messages")}</h2>
            <WarningSystemMessages onlyOutstanding={onlyOutstanding} />
        </div>
    );
}

export function WarningSystemMessages({ onlyOutstanding = false }: WarningSystemMessagesProps) {
    const [loaded, setLoaded] = React.useState(false);
    const [messages, setMessages] = React.useState<rest_api.warnings.Warning[]>([]);
    const [displayedMessage, setDisplayedMessage] =
        React.useState<rest_api.warnings.Warning | null>(null);

    React.useEffect(() => {
        setLoaded(false);
    }, [onlyOutstanding]);

    React.useEffect(() => {
        if (!loaded) {
            get("me/warning_system_messages/", {})
                .then((res) => {
                    console.log(res);
                    setLoaded(true);
                    setMessages(
                        onlyOutstanding
                            ? res.filter(
                                  (message: rest_api.warnings.Warning) =>
                                      message.acknowledged === null,
                              )
                            : res,
                    );
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }, [loaded]);

    const openWarning = (message: rest_api.warnings.Warning) => {
        setDisplayedMessage(message);
    };

    const onMessageAcked = () => {
        setDisplayedMessage(null);
        setLoaded(false);
    };

    return (
        <>
            {displayedMessage && (
                <AccountWarningMessage message={displayedMessage} onAck={onMessageAcked} />
            )}

            {loaded && messages.length > 0 && (
                <div className="WarningSystemMessages">
                    <div className="warning-system-messages-left">
                        {messages.map((message: rest_api.warnings.Warning) => (
                            <div
                                key={message.id}
                                className="warning-system-messages-message"
                                onClick={() => {
                                    openWarning(message);
                                }}
                            >
                                <span className="warning-system-messages-message-severity">
                                    {`${message.severity}:`}
                                </span>
                                <span className="warning-system-messages-message-text">
                                    "
                                    {message.text ||
                                        (message.message_id
                                            ? message.message_id.replace(/_/g, " ")
                                            : "")}
                                    "
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="warning-system-messages-right"></div>
                </div>
            )}
        </>
    );
}
