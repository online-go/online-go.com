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
import * as data from "data";
import * as moment from "moment";
import { Card } from "material";
import { post, get, patch } from "requests";
import { _, pgettext, interpolate } from "translate";
import { errorAlerter } from "misc";
import { useParams } from "react-router";
import { Player } from "Player";
import { AutoTranslate } from "AutoTranslate";
import { UIPush } from "UIPush";

interface AppealMessage {
    id: number;
    appeal_id: number;
    banned_user_id: number;
    timestamp: number;
    text: string;
    moderator_id?: number;
    moderator_message?: boolean;
    hidden?: boolean;
}

export function Appeal(props: { player_id?: number }): JSX.Element | null {
    // we are either a full blow appeals page, or we are embedded within the ReportsCenter
    // For the embedded version we use props, for the routed version we use useParams
    const _params = useParams();
    const params = props?.player_id ? props : _params;

    const banned_user_id: number = data.get("appeals.banned_user_id", 0);
    const jwt_key: string = data.get("appeals.jwt", "");

    const player_id = params.player_id || banned_user_id;
    const user = data.get("user");
    const [messages, setMessages] = React.useState<AppealMessage[]>([]);
    const [messageText, setMessageText] = React.useState("");
    const [hidden, setHidden] = React.useState(false);
    const [state, setState] = React.useState("");
    const [reason_for_ban, setReasonForBan] = React.useState(null);
    const [ban_expiration, setBanExpiration] = React.useState(null);
    const [still_banned, setStillBanned] = React.useState(true);
    const [allow_further_appeals, setAllowFurtherAppeals] = React.useState(true);

    const ban_reason: string = reason_for_ban || data.get("appeals.ban-reason", "");
    React.useEffect(refresh, [props.player_id]);

    if (!user.is_moderator && !jwt_key) {
        window.location.pathname = "/sign-in";
        return null;
    }

    const mod = user && user.is_moderator;
    const placeholder = mod
        ? "You can respond to the user's appeal here. Click 'hidden' for the response to only be visible to other moderators."
        : pgettext(
              "This text is shown when a user needs to appeal the suspension of their account.",
              "If you would like to appeal this suspension, please enter your appeal here and it will be reviewed by a moderator. Second chances are sometimes offered if we can be assured the reason for the suspension will not be repeated.",
          );

    return (
        <div id="Appeal">
            <UIPush channel={`appeal-${player_id}`} event="refresh" action={refresh} />

            {mod ? (
                <h1>
                    Appeal by <Player user={parseInt(`${player_id}`)} />
                    {(!still_banned || null) && (
                        <span className="text-danger"> (Ban has been lifted)</span>
                    )}
                </h1>
            ) : still_banned ? (
                <h1>{_("Your account has been suspended. ")}</h1>
            ) : (
                <h1>{_("Your account has been re-activated, welcome back.")}</h1>
            )}
            {ban_reason && still_banned && (
                <h2>
                    {interpolate(
                        pgettext(
                            "Reason the player's account was suspended",
                            "Reason for suspension: {{reason}}",
                        ),
                        {
                            reason: ban_reason,
                        },
                    )}
                </h2>
            )}
            {ban_expiration && still_banned && (
                <h2>
                    {interpolate(
                        pgettext(
                            "When their account will be restored",
                            "Suspension expires: {{expiration}}",
                        ),
                        {
                            expiration: moment(ban_expiration).format("LLL"),
                        },
                    )}
                </h2>
            )}
            {state && (
                <>
                    {mod ? (
                        <div>
                            <select value={state} onChange={updateState}>
                                <option value="awaiting_moderator_response">
                                    {_("Awaiting moderator response")}
                                </option>
                                <option value="awaiting_player_response">
                                    {_("Awaiting player response")}
                                </option>
                                <option value="resolved">{_("Resolved")}</option>
                            </select>
                            <input
                                name="allow_further_appeals"
                                id="allow_further_appeals"
                                type="checkbox"
                                checked={allow_further_appeals}
                                onChange={updateAllowFurtherAppeals}
                            />{" "}
                            <label htmlFor="allow_further_appeals">Allow further appeals</label>
                        </div>
                    ) : (
                        <h3>{getStateString(state)}</h3>
                    )}
                </>
            )}
            <Card className="input-card">
                <textarea
                    value={messageText}
                    onChange={(ev) => setMessageText(ev.target.value)}
                    placeholder={placeholder}
                />
                <div className="submit-and-hidden">
                    <button
                        className="primary"
                        onClick={submit}
                        disabled={messageText.length < (mod ? 2 : 20)}
                    >
                        {_("Submit")}
                    </button>
                    {(mod || null) && (
                        <span>
                            <label htmlFor="hidden">Hidden</label>
                            <input
                                id="hidden"
                                type="checkbox"
                                checked={hidden}
                                onChange={(ev) => setHidden(ev.target.checked)}
                            />
                        </span>
                    )}
                </div>
            </Card>
            {messages.map((message) => (
                <Message key={message.id} message={message} mod={mod} />
            ))}
        </div>
    );

    function updateState(ev: React.ChangeEvent<HTMLSelectElement>) {
        setState(ev.target.value);
        patch(`appeal/${player_id}`, { state: ev.target.value })
            .then(() => 0)
            .catch(errorAlerter);
    }

    function updateAllowFurtherAppeals(ev: React.ChangeEvent<HTMLInputElement>) {
        setAllowFurtherAppeals(ev.target.checked);
        patch(`appeal/${player_id}`, { allow_further_appeals: ev.target.checked })
            .then(() => 0)
            .catch(errorAlerter);
    }

    function submit() {
        post("appeal/messages", {
            player_id,
            jwt: jwt_key,
            text: messageText,
            hidden: hidden,
        })
            .then((response) => {
                console.log(response);
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

        get(`appeal/${player_id}`, { player_id, jwt: jwt_key })
            .then((response) => {
                console.log(response);
                setState(response.state);
                setReasonForBan(response.reason_for_ban);
                setBanExpiration(response.ban_expiration);
                setStillBanned(response.still_banned);
                setAllowFurtherAppeals(response.allow_further_appeals);
                //setAppeal(response);
            })
            .catch(errorAlerter);
    }
}

function Message({ message, mod }: { message: AppealMessage; mod: boolean }) {
    const [hidden, setHidden] = React.useState(message.hidden);

    function toggleHidden() {
        patch(`appeal/messages/${message.id}`, { hidden: !hidden })
            .then(() => 0)
            .catch(errorAlerter);
        setHidden(!hidden);
    }

    return (
        <Card
            className={`Message ${message.moderator_message ? "moderator" : "player"} ${
                hidden ? "hidden" : ""
            }`}
        >
            <div className="header">
                <span className="timestamp">{moment(message.timestamp).format("llll")}</span>
                {message.moderator_id && <Player user={message.moderator_id} />}
                {((!message.moderator_id && message.moderator_message) || null) && _("Moderator")}
            </div>
            <AutoTranslate source={message.text} markdown />

            {((mod && message.moderator_id) || null) && (
                <div style={{ textAlign: "right" }}>
                    <label htmlFor={`hidden-${message.id}`}>Hidden</label>
                    <input
                        id={`hidden-${message.id}`}
                        type="checkbox"
                        checked={hidden}
                        onChange={() => toggleHidden()}
                    />
                </div>
            )}
        </Card>
    );
}

function getStateString(state: string) {
    switch (state) {
        case "awaiting_moderator_response":
            return _("Awaiting moderator response");
        case "awaiting_player_response":
            return _("Awaiting player response");
        case "resolved":
            return _("Resolved");
    }

    return state;
}
