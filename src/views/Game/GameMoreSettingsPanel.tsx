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
import { GamePreferences } from "@/views/Settings/GamePreferences";
import { ThemePreferences } from "@/views/Settings/ThemePreferences";
import "./GameMoreSettingsPanel.css";

interface GameMoreSettingsPanelProps {
    /** Fired by the Done button at the bottom of the panel. */
    onClose?: () => void;
}

/**
 * Sidebar takeover hosting the full "Themes & Visuals" and "Game
 * Preferences" settings components from the Settings page. Opened from
 * the game Settings popover's "More options" item; closed by the Done
 * button, or by clicking the settings gear again (wired in Game.tsx).
 *
 * The inner wrapper carries the `.Settings` class so the PreferenceLine
 * styles from Settings.css (scoped under `.Settings`) apply here; the
 * panel's own CSS compacts them to sidebar width.
 */
export function GameMoreSettingsPanel({ onClose }: GameMoreSettingsPanelProps): React.ReactElement {
    return (
        <div className="GameSidebarPanel GameMoreSettingsPanel">
            <div className="Settings GameMoreSettingsPanel-content">
                <h4 className="GameSidebarPanel-section-header">{_("Themes & Visuals")}</h4>
                <ThemePreferences />
                <h4 className="GameSidebarPanel-section-header">{_("Game Preferences")}</h4>
                <GamePreferences />
            </div>
            <div className="GameMoreSettingsPanel-buttons">
                <button className="primary" onClick={onClose}>
                    {_("Done")}
                </button>
            </div>
        </div>
    );
}
