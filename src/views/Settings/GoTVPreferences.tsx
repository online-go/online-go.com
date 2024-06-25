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
import { _ } from "translate";
import { usePreference } from "preferences";
import { Toggle } from "Toggle";
import { PreferenceLine } from "SettingsCommon";

export function GoTVPreferences(): JSX.Element {
    const [showGoTVIndicator, toggleGoTVIndicator] = usePreference("gotv.show-gotv-indicator");
    const [autoSelect, toggleAutoSelect] = usePreference("gotv.auto-select-top-stream");

    return (
        <div>
            <PreferenceLine title={_("Show active streams indicator in navbar")}>
                <Toggle checked={showGoTVIndicator} onChange={toggleGoTVIndicator} />
            </PreferenceLine>

            <PreferenceLine title={_("Automatically play top stream on load")}>
                <Toggle checked={autoSelect} onChange={toggleAutoSelect} />
            </PreferenceLine>
        </div>
    );
}
