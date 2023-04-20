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
import { _, pgettext } from "translate";
import { get, patch } from "requests";
import { useUser } from "hooks";
import { AutoTranslate } from "AutoTranslate";

const BUTTON_COUNTDOWN_TIME = 10000; // ms;

export function AccountWarning() {
    const user = useUser();
    const [warning, setWarning] = React.useState(null);
    const [acceptTimer, setAcceptTimer] = React.useState(null);
    const [boxChecked, setBoxChecked] = React.useState(false);

    React.useEffect(() => {
        if (user && !user.anonymous && user.has_active_warning_flag) {
            get("me/warning")
                .then((warning) => {
                    console.log(warning);
                    if (Object.keys(warning).length > 0) {
                        setWarning(warning);

                        const now = Date.now();
                        const interval = setInterval(() => {
                            setAcceptTimer(BUTTON_COUNTDOWN_TIME - (Date.now() - now));
                            if (Date.now() - now > BUTTON_COUNTDOWN_TIME) {
                                clearInterval(interval);
                            }
                        }, 100);
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
    }, [user, user?.has_active_warning_flag]);

    if (!user || user.anonymous || !user.has_active_warning_flag) {
        return null;
    }

    if (!warning) {
        return null;
    }

    const ok = () => {
        setWarning(null);
        void patch(`me/warning/${warning.id}`, { accept: true });
    };

    return (
        <>
            <div className="AccountWarning-backdrop" />
            <div className="AccountWarning">
                <AutoTranslate source={warning.text.trim()} source_language={"en"} />
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
                        disabled={acceptTimer > 0 || !boxChecked}
                        onClick={ok}
                    >
                        {_("OK") +
                            (acceptTimer > 0 ? " (" + Math.ceil(acceptTimer / 1000) + ")" : "")}
                    </button>
                </div>
            </div>
        </>
    );
}
