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
import { _, pgettext } from "translate";
import { usePreference } from "preferences";
import * as preferences from "preferences";
import { PreferenceLine } from "SettingsCommon";
//import { ReportsCenterSettings } from "ReportsCenter";
//import * as preferences from "preferences";
import {
    GobanBlackThemePicker,
    GobanWhiteThemePicker,
    GobanBoardThemePicker,
    GobanCustomBoardPicker,
    GobanCustomWhitePicker,
    GobanCustomBlackPicker,
} from "GobanThemePicker";
import { useData } from "hooks";
import { MiniGoban } from "MiniGoban";
import { GobanEngineConfig } from "goban";
import { Toggle } from "Toggle";

const sample_board_data: GobanEngineConfig = {
    width: 9,
    height: 9,

    initial_state: {
        black:
            "abbbbaga" + // cspell: disable-line
            "gbgchcic", // cspell: disable-line
        white:
            "hahbib" + // cspell: disable-line
            "acbccccbca", // cspell: disable-line
    },
    removed:
        "aaia" + // cspell: disable-line
        "abbbba" + // cspell: disable-line
        "aahahbib", // cspell: disable-line
    marks: {
        "score-black": "haiahbib", // cspell: disable-line
        "score-white": "aaabbabb", // cspell: disable-line
    },
};

export function ThemePreferences(): JSX.Element | null {
    const [stone_removal_graphic, _setStoneRemovalGraphic] = usePreference(
        "goban-theme-removal-graphic",
    );
    const [theme] = useData("theme", "light");

    const [removal_scale] = usePreference("goban-theme-removal-scale");
    const setTheme = React.useCallback((theme: string) => {
        data.set("theme", theme, data.Replication.REMOTE_OVERWRITES_LOCAL);
    }, []);
    const setThemeLight = React.useCallback(setTheme.bind(null, "light"), [setTheme]);
    const setThemeDark = React.useCallback(setTheme.bind(null, "dark"), [setTheme]);
    const setThemeAccessible = React.useCallback(setTheme.bind(null, "accessible"), [setTheme]);
    const setStoneRemovalGraphic = React.useCallback((graphic: string) => {
        console.log("Setting with remote replication");
        preferences.set(
            "goban-theme-removal-graphic",
            graphic,
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    }, []);

    const toggleRemovalScale = React.useCallback((tf: boolean) => {
        if (tf) {
            preferences.set(
                "goban-theme-removal-scale",
                0.9,
                data.Replication.REMOTE_OVERWRITES_LOCAL,
            );
        } else {
            preferences.set(
                "goban-theme-removal-scale",
                1.0,
                data.Replication.REMOTE_OVERWRITES_LOCAL,
            );
        }
    }, []);

    return (
        <div className="ThemePreferences">
            <PreferenceLine title={_("Site theme")}>
                <div className="theme-selectors">
                    <button
                        className={`theme-button light ${theme === "light" ? "primary" : ""}`}
                        onClick={setThemeLight}
                    >
                        <i className="fa fa-sun-o" />
                    </button>
                    <button
                        className={`theme-button dark  ${theme === "dark" ? "primary" : ""}`}
                        onClick={setThemeDark}
                    >
                        <i className="fa fa-moon-o" />
                    </button>
                    <button
                        className={`theme-button accessible  ${
                            theme === "accessible" ? "primary" : ""
                        }`}
                        onClick={setThemeAccessible}
                    >
                        <i className="fa fa-eye" />
                    </button>
                </div>
            </PreferenceLine>
            <PreferenceLine className="title-on-top body-as-column" title={_("Board theme")}>
                <GobanBoardThemePicker />
                <GobanCustomBoardPicker />
            </PreferenceLine>
            <PreferenceLine className="title-on-top body-as-column" title={_("Black stone theme")}>
                <GobanBlackThemePicker />
                <GobanCustomBlackPicker />
            </PreferenceLine>
            <PreferenceLine className="title-on-top body-as-column" title={_("White stone theme")}>
                <GobanWhiteThemePicker />
                <GobanCustomWhitePicker />
            </PreferenceLine>
            <PreferenceLine title={_("Removed stones graphic")}>
                <button
                    className={`theme-button light ${
                        stone_removal_graphic === "square" ? "primary" : ""
                    }`}
                    onClick={setStoneRemovalGraphic.bind(null, "square")}
                >
                    <i className="fa fa-square" />
                </button>
                <button
                    className={`theme-button light ${
                        stone_removal_graphic === "x" ? "primary" : ""
                    }`}
                    onClick={setStoneRemovalGraphic.bind(null, "x")}
                >
                    <i className="fa fa-times" />
                </button>
            </PreferenceLine>
            <PreferenceLine title={_("Reduce removed stone size")}>
                <Toggle
                    id={"goban-theme-removal-scale"}
                    onChange={toggleRemovalScale}
                    checked={removal_scale < 1.0}
                />
            </PreferenceLine>

            <PreferenceLine
                className="title-on-top body-as-column"
                title={pgettext(
                    "Shows an example Goban to visualize theme settings",
                    "Sample board",
                )}
            >
                <MiniGoban json={sample_board_data} noLink={true} width={9} height={9} />
            </PreferenceLine>
        </div>
    );
}
