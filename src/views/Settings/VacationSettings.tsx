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

import { _, interpolate } from "@/lib/translate";
import { put, del } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";

import { durationString } from "@/components/TimeControl";

import { SettingGroupPageProps } from "@/lib/SettingsCommon";

export function VacationSettings(props: SettingGroupPageProps): React.ReactElement {
    const [vacation_left, set_vacation_left]: [number, (x: number) => void] = React.useState(
        props.state.profile.vacation_left - (Date.now() - props.vacation_base_time) / 1000,
    );

    React.useEffect(() => {
        const vacation_interval = setInterval(() => {
            if (props.state.profile.on_vacation) {
                set_vacation_left(
                    props.state.profile.vacation_left -
                        (Date.now() - props.vacation_base_time) / 1000,
                );
            }
        }, 1000);

        return function cleanup() {
            clearInterval(vacation_interval);
        };
    });

    function endVacation() {
        del("me/vacation")
            .then(() => props.refresh())
            .catch(errorAlerter);
    }
    function startVacation() {
        put("me/vacation")
            .then(() => props.refresh())
            .catch(errorAlerter);
    }

    const vacation_string =
        vacation_left > 0 ? durationString(vacation_left) : "0 " + _("Seconds").toLowerCase();

    return (
        <div>
            <h3>
                {props.state.profile.on_vacation ? (
                    <span className="vacation-status">
                        <i className="fa fa-smile-o"></i>
                        &nbsp; {_("You are on vacation")} &nbsp;
                        <i className="fa fa-smile-o"></i>
                    </span>
                ) : (
                    <span>{_("Vacation Control")}</span>
                )}
            </h3>
            <div className="vacation-container">
                <div>
                    {props.state.profile.on_vacation ? (
                        <button onClick={endVacation} className="primary">
                            {_("End vacation")}
                        </button>
                    ) : (
                        <button onClick={startVacation} className="primary">
                            {_("Go on vacation")}
                        </button>
                    )}
                </div>

                <div>
                    {(!props.state.profile.on_vacation || null) && (
                        <i>
                            {_(
                                "This will pause any correspondence games you are in until you end your vacation",
                            )}
                        </i>
                    )}
                </div>

                <div>
                    {interpolate(_("You have {{vacation_left}} of vacation available"), {
                        vacation_left: vacation_string,
                    })}
                </div>
            </div>
        </div>
    );
}
