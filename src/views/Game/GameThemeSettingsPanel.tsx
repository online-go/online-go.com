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
import { _ } from "@/lib/translate";
import { ThemePreferences } from "@/views/Settings/ThemePreferences";
import "./GameThemeSettingsPanel.css";

interface GameThemeSettingsPanelProps {
    /** Fired by the Done button at the bottom of the panel. */
    onClose?: () => void;
}

/**
 * Sidebar takeover hosting the full "Themes & Visuals" settings component
 * from the Settings page. Opened from the game Settings popover's
 * "More options" item; closed by the Done button, or by clicking the
 * settings gear again (wired in Game.tsx).
 *
 * The inner wrapper carries the `.Settings` class so the PreferenceLine
 * styles from Settings.css (scoped under `.Settings`) apply here; the
 * panel's own CSS compacts them to sidebar width.
 */
export function GameThemeSettingsPanel({
    onClose,
}: GameThemeSettingsPanelProps): React.ReactElement {
    return (
        <div className="GameSidebarPanel GameThemeSettingsPanel">
            <h3 className="GameSidebarPanel-title">{_("Themes & Visuals")}</h3>
            <div className="Settings GameThemeSettingsPanel-content">
                <ThemePreferences />
            </div>
            <div className="GameThemeSettingsPanel-buttons">
                <button className="primary" onClick={onClose}>
                    {_("Done")}
                </button>
            </div>
        </div>
    );
}
