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

// An "AccountWarning" was initially "warn them not to do bad things" and ensure they acknowledge
// Now it is extended to "notify them about something (maybe just information)" and record that they saw it
// So the word "warning" kind of means "message" now.

import * as React from "react";
import { _, pgettext } from "@/lib/translate";
import { get, patch } from "@/lib/requests";
import { useMainGoban, useUser } from "@/lib/hooks";
import { AutoTranslate } from "@/components/AutoTranslate";
import { useLocation } from "react-router-dom";
import { CANNED_MESSAGES } from "./CannedMessages";

const BUTTON_COUNTDOWN_TIME = 10000; // ms;

// This is now better called  "Report System Messages", because it has acks as well as warnings.
export function AccountWarning() {
    const user = useUser();
    const location = useLocation();
    const [warning, setWarning] = React.useState<rest_api.warnings.Warning | null>(null);
    const [displayPending, setDisplayPending] = React.useState<boolean>(false);
    const mainGoban = useMainGoban();

    const liveGameInProgress =
        mainGoban &&
        mainGoban.engine.game_id &&
        mainGoban.engine.phase !== "finished" &&
        mainGoban.engine.time_control.speed !== "correspondence";

    React.useEffect(() => {
        if (user && !user.anonymous && user.has_pending_warnings_system_message) {
            get("me/warning")
                .then((warning) => {
                    console.log(warning);
                    if (Object.keys(warning).length > 0) {
                        setWarning(warning);
                    } else {
                        setWarning(null);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        } else {
            setWarning(null);
        }
    }, [user, user?.has_pending_warnings_system_message]);

    // If a live game is in progress, we'll need to check back later to see if it has
    // finished so we can display the warning...

    React.useEffect(() => {
        let pending: NodeJS.Timeout | undefined;
        if (location.pathname.indexOf("game/") > 0) {
            if (liveGameInProgress) {
                setDisplayPending(true);
                pending = setInterval(() => {
                    if (mainGoban?.engine.phase !== "play") {
                        setDisplayPending(false);
                        clearInterval(pending);
                    }
                }, 1000);
            }
        }
        return () => {
            clearInterval(pending);
        };
    }, [mainGoban, location.pathname, displayPending, liveGameInProgress]);

    if (location.pathname.indexOf("game/") > 0 && liveGameInProgress) {
        return null;
    }

    if (!user || user.anonymous || !user.has_pending_warnings_system_message) {
        return null;
    }

    if (!warning) {
        return null;
    }

    if (location.pathname.indexOf("terms-of-service") > 0) {
        return null;
    }

    const ok = () => {
        setWarning(null);
    };

    return <AccountWarningMessage message={warning} onAck={ok} />;
}

export function AccountWarningMessage(props: {
    message: rest_api.warnings.Warning;
    onAck?: () => void;
}) {
    const Renderers = {
        warning: WarningModal,
        acknowledgement: AckModal,
        info: AckModal,
    };

    const ack = () => {
        void patch(`me/warning/${props.message.id}`, { accept: true });
        props.onAck?.();
    };

    const MessageRenderer = Renderers[props.message.severity];

    return <MessageRenderer warning={props.message} accept={ack} />;
}

// Support warnings that carry messages either as a reference to a a canned message, or explicit text...

interface MessageTextRenderProps {
    warning: rest_api.warnings.Warning;
}
function MessageTextRender(props: MessageTextRenderProps): React.ReactElement {
    if (props.warning.message_id) {
        return (
            <div className={`canned-message ${props.warning.message_id}`}>
                {CANNED_MESSAGES[props.warning.message_id](props.warning.interpolation_data)}
            </div>
        );
    } else {
        return (
            <AutoTranslate
                source={props.warning.text?.trim()}
                source_language={"en"}
                markdown={true}
            />
        );
    }
}

// Support "warnings" that should be displayed differently depending on severity...

interface WarningModalProps {
    warning: rest_api.warnings.Warning;
    accept: () => void;
}

function AckModal(props: WarningModalProps): React.ReactElement {
    return (
        <>
            <div className="AccountWarning-backdrop" />
            <div className="AccountWarningAck">
                <MessageTextRender warning={props.warning} />
                <div className="space" />
                <div className="buttons">
                    <button className="primary" onClick={props.accept}>
                        {_("OK")}
                    </button>
                </div>
            </div>
        </>
    );
}

function WarningModal(props: WarningModalProps): React.ReactElement {
    const [acceptTime, setAcceptTime] = React.useState<number>(0);
    const [boxChecked, setBoxChecked] = React.useState<boolean>(false);

    React.useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        // a force-them-to-read-it delay, unless they already acknowledged it
        if (props.warning && props.warning.acknowledged === null) {
            const now = Date.now();
            interval = setInterval(() => {
                setAcceptTime(BUTTON_COUNTDOWN_TIME - (Date.now() - now));
                if (Date.now() - now > BUTTON_COUNTDOWN_TIME && interval) {
                    clearInterval(interval);
                }
            }, 1000);
        }
        return () => {
            clearInterval(interval);
        };
    }, [props.warning]);

    return (
        <>
            <div className="AccountWarning-backdrop" />
            <div className="AccountWarning">
                <MessageTextRender warning={props.warning} />
                <div className="space" />
                <div className="buttons">
                    <input
                        type="checkbox"
                        id="AccountWarning-accept"
                        checked={boxChecked}
                        onChange={(ev) => setBoxChecked(ev.target.checked)}
                    />
                    <label htmlFor="AccountWarning-accept">
                        {pgettext(
                            "Checkbox label displayed to user when they are warned for bad behavior",
                            "I understand",
                        )}
                    </label>

                    <button
                        className="primary"
                        disabled={acceptTime > 0 || !boxChecked}
                        onClick={props.accept}
                    >
                        {_("OK") +
                            (acceptTime > 0 ? " (" + Math.ceil(acceptTime / 1000) + ")" : "")}
                    </button>
                </div>
            </div>
        </>
    );
}
