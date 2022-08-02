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

import * as DynamicHelp from "react-dynamic-help";

import { pgettext } from "translate";

import { PreferenceLine } from "SettingsCommon";

export function HelpSettings(): JSX.Element {
    const { getFlowInfo, enableFlow } = React.useContext(DynamicHelp.Api);
    const availableHelp = getFlowInfo() as DynamicHelp.FlowState[];

    // we need a state to trigger re-reander after changing a flow visibility,
    // because DynamicHelp can't trigger a re-render in that circumstance.

    const [reload, setReload] = React.useState(false);

    const show = (flow: DynamicHelp.FlowState) => {
        enableFlow(flow.id);
        setReload(true);
    };

    const hide = (flow: DynamicHelp.FlowState) => {
        enableFlow(flow.id, false);
        setReload(true);
    };

    React.useEffect(() => {
        if (reload) {
            setReload(false);
        }
    });

    return (
        <div>
            {availableHelp.map((flow, index) => (
                <PreferenceLine key={index} title={flow.description}>
                    <button onClick={() => show(flow)}>
                        {pgettext("Press this button to show all the initial items", "Reset")}
                    </button>
                    <button onClick={() => hide(flow)}>
                        {pgettext("Press this button to hide this help flow", "Hide")}
                    </button>
                    <span>
                        {pgettext(
                            "Following this label is the status of currently visible help items",
                            "Currently:",
                        )}
                    </span>
                    <span>
                        {flow.visible
                            ? pgettext("This help flow is showing its help items", "active")
                            : pgettext("This help flow is not visible", "inactive")}
                    </span>
                </PreferenceLine>
            ))}
        </div>
    );
}
