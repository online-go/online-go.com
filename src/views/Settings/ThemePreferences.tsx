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
import { PreferenceDropdown, PreferenceLine } from "SettingsCommon";
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
            "gbgchcic" + // cspell: disable-line
            "de",
        white:
            "hahbib" + // cspell: disable-line
            "acbccccbca", // cspell: disable-line
    },
    initial_player: "white",
    moves: [{ x: 5, y: 4 }],
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
    const [board_labeling, setBoardLabeling] = usePreference("board-labeling");
    const [label_positioning, setLabelPositioning] = usePreference("label-positioning");
    const [visual_undo_request_indicator, setVisualUndoRequestIndicator] = usePreference(
        "visual-undo-request-indicator",
    );
    const [last_move_opacity, _setLastMoveOpacity] = usePreference("last-move-opacity");
    const [variation_stone_opacity, _setVariationStoneOpacity] =
        usePreference("variation-stone-opacity");

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

    function setLastMoveOpacity(ev: React.ChangeEvent<HTMLInputElement>) {
        const value = parseFloat(ev.target.value);

        if (value >= 0.0 && value <= 1.0) {
            _setLastMoveOpacity(value);
        }
    }

    function setVariationStoneOpacity(ev: React.ChangeEvent<HTMLInputElement>) {
        const value = parseFloat(ev.target.value);

        if (value >= 0.0 && value <= 1.0) {
            _setVariationStoneOpacity(value);
        }
    }

    const [svg_enabled, setSvgEnabled] = useData("experiments.svg", "enabled");
    const enable_svg = svg_enabled === "enabled";

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

            <PreferenceLine title={_("Board label positioning")}>
                <PreferenceDropdown
                    value={label_positioning}
                    options={[
                        { value: "none", label: _("None") },
                        { value: "all", label: _("All") },
                        { value: "top-left", label: pgettext("Board label position", "Top left") },
                        {
                            value: "top-right",
                            label: pgettext("Board label position", "Top right"),
                        },
                        {
                            value: "bottom-left",
                            label: pgettext("Board label position", "Bottom left"),
                        },
                        {
                            value: "bottom-right",
                            label: pgettext("Board label position", "Bottom right"),
                        },
                    ]}
                    onChange={setLabelPositioning}
                />
            </PreferenceLine>
            <PreferenceLine title={_("Board label lettering")}>
                <PreferenceDropdown
                    value={board_labeling}
                    options={[
                        { value: "automatic", label: _("Automatic") },
                        { value: "A1", label: "A1" },
                        { value: "1-1", label: "1-1" },
                    ]}
                    onChange={setBoardLabeling}
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Last move opacity")}
                description={_(
                    "Choose the level of opacity for the 'last move' mark on stones. 0.0 is transparent and 1.0 is opaque.",
                )}
            >
                <input
                    type="range"
                    step="0.1"
                    min="0.0"
                    max="1.0"
                    onChange={setLastMoveOpacity}
                    value={last_move_opacity}
                />
                <span>
                    &nbsp;
                    {last_move_opacity}
                </span>
            </PreferenceLine>

            <PreferenceLine
                title={_("Variation stone opacity")}
                description={_(
                    "Choose the level of opacity for stones shown in variations. 0.0 is transparent and 1.0 is opaque.",
                )}
            >
                <input
                    type="range"
                    step="0.1"
                    min="0.0"
                    max="1.0"
                    onChange={setVariationStoneOpacity}
                    value={variation_stone_opacity}
                />
                <span>
                    &nbsp;
                    {variation_stone_opacity}
                </span>
            </PreferenceLine>

            <PreferenceLine
                title={_("Visual undo request indicator")}
                description={_(
                    "This will cause an undo request to be indicated by a mark on your opponent's last move.",
                )}
            >
                <Toggle
                    checked={visual_undo_request_indicator}
                    onChange={setVisualUndoRequestIndicator}
                />
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
                {[{}].map(() => (
                    <MiniGoban
                        key={(enable_svg ? "svg" : "canvas") + board_labeling + label_positioning}
                        json={sample_board_data}
                        noLink={true}
                        width={9}
                        height={9}
                        labels_positioning={label_positioning}
                    />
                ))}
            </PreferenceLine>

            <PreferenceLine title={"Enable SVG goban renderer"}>
                <Toggle
                    checked={enable_svg}
                    onChange={(tf) => {
                        //data.set("experiments.svg", tf ? "enabled" : undefined);
                        setSvgEnabled(tf ? "enabled" : undefined);
                    }}
                />
            </PreferenceLine>
        </div>
    );
}
