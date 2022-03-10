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
import * as moment from "moment";
import { Card } from "material";
import { post, get } from "requests";
import { _, pgettext, interpolate } from "translate";
import { errorAlerter } from "misc";
import { RouteComponentProps } from "react-router";
import { Player } from "Player";
import { AutoTranslate } from "AutoTranslate";

type AppealProperties = RouteComponentProps<{ player_id?: string }>;

interface AppealMessage {
    id: number;
    appeal_id: number;
    banned_user_id: number;
    timestamp: number;
    text: string;
    moderator_id?: number;
    hidden?: boolean;
}

export function Appeal(props: AppealProperties): JSX.Element {
    const player_id = props.match.params.player_id;
    const user = data.get("user");
    const [messages, setMessages] = React.useState<AppealMessage[]>([]);
    const [messageText, setMessageText] = React.useState("");
    const [hidden, setHidden] = React.useState(false);

    const jwt_key: string = data.get("appeals.jwt");
    const ban_reason: string = data.get("appeals.ban-reason");

    React.useEffect(refresh, []);

    if (!user.is_moderator && !jwt_key) {
        window.location.pathname = "/sign-in";
        return;
    }

    const mod = user && user.is_moderator;
    const placeholder = pgettext(
        "This text is shown when a user needs to appeal a ban from the site.",
        "If you would like to appeal this ban, please enter your appeal here and it will be reviewed by a moderator. Second chances are sometimes offered if we can be assured the reason for the ban will not be repeated.",
    );

    return (
        <div id="Appeal">
            {mod ? (
                <h1>
                    Appeal by <Player user={parseInt(player_id)} />
                </h1>
            ) : (
                <h1>{_("You, or someone on your network, has been banned from the site. ")}</h1>
            )}
            {ban_reason && (
                <h2>
                    {interpolate(
                        pgettext("Reason the player was banned", "Reason for ban: {{reason}}"),
                        {
                            reason: ban_reason,
                        },
                    )}
                </h2>
            )}
            <Card className="input-card">
                <textarea
                    value={messageText}
                    onChange={(ev) => setMessageText(ev.target.value)}
                    placeholder={placeholder}
                />
                <div>
                    {(mod || null) && (
                        <span>
                            <label htmlFor="hidden">Hidden</label>
                            <input
                                type="checkbox"
                                checked={hidden}
                                onChange={(ev) => setHidden(ev.target.checked)}
                            />
                        </span>
                    )}
                    <button className="primary" onClick={submit} disabled={messageText.length < 2}>
                        {_("Submit")}
                    </button>
                </div>
            </Card>
            {messages.map((message) => (
                <Message key={message.id} message={message} />
            ))}
        </div>
    );

    function submit() {
        post("appeal/messages", {
            player_id,
            jwt: jwt_key,
            text: messageText,
            hidden: hidden,
        })
            .then((response) => {
                setMessages(response);
            })
            .catch(errorAlerter);
        setMessageText("");
    }

    function refresh() {
        get("appeal/messages", { player_id, jwt: jwt_key })
            .then((response) => {
                setMessages(response);
            })
            .catch(errorAlerter);
    }
}

function Message({ message }: { message: AppealMessage }) {
    return (
        <Card className="Message">
            <div className="header">
                <span className="timestamp">{moment(message.timestamp).format("llll")}</span>
                {message.moderator_id && <Player user={message.moderator_id} />}
            </div>
            <AutoTranslate source={message.text} />
        </Card>
    );
}
