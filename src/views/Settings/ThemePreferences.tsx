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
import * as data from "@/lib/data";
import { _, pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import * as preferences from "@/lib/preferences";
import { PreferenceDropdown, PreferenceLine } from "@/lib/SettingsCommon";
//import { ReportsCenterSettings } from "@/views/ReportsCenter";
//import * as preferences from "@/lib/preferences";
import {
    GobanBlackThemePicker,
    GobanWhiteThemePicker,
    GobanBoardThemePicker,
    GobanCustomBoardPicker,
    GobanCustomWhitePicker,
    GobanCustomBlackPicker,
} from "@/components/GobanThemePicker";
import { useData } from "@/lib/hooks";
import { MiniGoban } from "@/components/MiniGoban";
import { GobanEngineConfig, setGobanRenderer } from "goban";
import { Toggle } from "@/components/Toggle";

const sample_board_data: GobanEngineConfig = {
    width: 3,
    height: 3,

    initial_state: {
        black: "abbbbaga", // cspell: disable-line
        white: "acbccccbca", // cspell: disable-line
    },
    removed:
        "aa" + // cspell: disable-line
        "abbbba" + // cspell: disable-line
        "aa", // cspell: disable-line
    marks: {
        "score-white": "aaabbabb", // cspell: disable-line
    },
};

export function ThemePreferences(): React.ReactElement | null {
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
    const setStoneRemovalGraphic = React.useCallback((graphic: "square" | "x") => {
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
    const [stone_font_scale, _setStoneFontScale] = usePreference("stone-font-scale");

    const [variation_stone_opacity, _setVariationStoneOpacity] =
        usePreference("variation-stone-opacity");

    //const [show_move_numbers, _setShowMoveNumbers] = usePreference("show-move-numbers");
    const [show_variation_move_numbers, _setShowVariationMoveNumbers] = usePreference(
        "show-variation-move-numbers",
    );
    const [_refresh, refresh] = React.useState(0);

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

    /*
    const toggleShowMoveNumbers = React.useCallback((tf: boolean) => {
        _setShowMoveNumbers(tf);
    }, []);
    */

    const toggleShowVariationMoveNumbers = React.useCallback((tf: boolean) => {
        _setShowVariationMoveNumbers(tf);
    }, []);

    function setStoneFontScale(ev: React.ChangeEvent<HTMLInputElement>) {
        const value = parseFloat(ev.target.value);

        if (value >= 0.3 && value <= 1.3) {
            _setStoneFontScale(value);
        }
    }

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

    const [canvas_enabled, setCanvasEnabled] = useData("experiments.canvas");
    //const canvas_enabled = data.get("experiments.canvas");
    const enable_svg = canvas_enabled !== "enabled";

    const sample_goban_key =
        (enable_svg ? "svg" : "canvas") +
        board_labeling +
        label_positioning +
        stone_font_scale +
        //stone_removal_graphic +
        //removal_scale +
        visual_undo_request_indicator +
        last_move_opacity +
        _refresh;

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
                        {
                            value: "top-left",
                            label: pgettext("Board label position", "Top left"),
                        },
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
                <div className="with-sample-goban">
                    <div className="left">
                        <PreferenceDropdown
                            value={board_labeling}
                            options={[
                                { value: "automatic", label: _("Automatic") },
                                { value: "A1", label: "A1" },
                                { value: "1-1", label: "1-1" },
                            ]}
                            onChange={setBoardLabeling}
                        />
                    </div>

                    <MiniGoban
                        className="inline"
                        key={sample_goban_key}
                        json={sample_board_data}
                        noLink={true}
                        width={2}
                        height={2}
                        displayWidth={140}
                        labels_positioning={label_positioning}
                    />
                </div>
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
                title={_("Stone font scale")}
                description={_("Adjust the size of the font used to display symbols on stones.")}
            >
                <div className="with-sample-goban">
                    <div className="left">
                        <input
                            type="range"
                            step="0.05"
                            min="0.3"
                            max="1.3"
                            onChange={setStoneFontScale}
                            value={stone_font_scale}
                        />
                        <span>{stone_font_scale}</span>
                    </div>

                    <MiniGoban
                        className="inline"
                        key={stone_font_scale + "" + _refresh}
                        json={{
                            width: 3,
                            height: 1,
                            moves: [
                                { x: 0, y: 0 },
                                { x: 2, y: 0 },
                            ],
                            marks: {
                                "1": "aa",
                            },
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                        sampleOptions={{}}
                    />
                </div>
            </PreferenceLine>

            <PreferenceLine
                title={_("Last move opacity")}
                description={_(
                    "Choose the level of opacity for the 'last move' mark on stones. 0.0 is transparent and 1.0 is opaque.",
                )}
            >
                <div className="with-sample-goban">
                    <div className="left">
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
                    </div>

                    <MiniGoban
                        className="inline"
                        key={last_move_opacity + "" + _refresh}
                        json={{
                            moves: [{ x: 1, y: 0 }],
                            width: 3,
                            height: 1,
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                    />
                </div>
            </PreferenceLine>

            {/*
            <PreferenceLine title={_("Show analysis numbers")}>
                <div className="with-sample-goban">
                    <div className="left">
                        <Toggle checked={show_move_numbers} onChange={toggleShowMoveNumbers} />
                    </div>

                    <MiniGoban
                        className="inline"
                        key={show_move_numbers + ""}
                        json={{
                            moves: [
                                { x: 0, y: 0 },
                                { x: 2, y: 0 },
                            ],
                            width: 3,
                            height: 1,
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                        sampleOptions={{}}
                    />
                </div>
            </PreferenceLine>
            */}

            <PreferenceLine title={_("Show variation move numbers")}>
                <div className="with-sample-goban">
                    <div className="left">
                        <Toggle
                            checked={show_variation_move_numbers}
                            onChange={toggleShowVariationMoveNumbers}
                        />
                    </div>

                    <MiniGoban
                        className="inline"
                        key={show_variation_move_numbers + "" + _refresh}
                        json={{
                            width: 3,
                            height: 1,
                            marks: show_variation_move_numbers
                                ? {
                                      "1": "aa",
                                      "2": "ca",
                                  }
                                : {},
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                        sampleOptions={{
                            variation: [
                                { x: 0, y: 0 },
                                { x: 2, y: 0 },
                            ],
                        }}
                    />
                </div>
            </PreferenceLine>

            <PreferenceLine
                title={_("Variation stone opacity")}
                description={_(
                    "Choose the level of opacity for stones shown in variations. 0.0 is transparent and 1.0 is opaque.",
                )}
            >
                <div className="with-sample-goban">
                    <div className="left">
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
                    </div>

                    <MiniGoban
                        className="inline"
                        key={variation_stone_opacity + "" + _refresh}
                        json={{
                            width: 3,
                            height: 1,
                            marks: {
                                "1": "aa",
                                black: "aa",
                                "2": "ca",
                                white: "ca",
                            },
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                        sampleOptions={{}}
                    />
                </div>
            </PreferenceLine>

            <PreferenceLine
                title={_("Visual undo request indicator")}
                description={_(
                    "This will cause an undo request to be indicated by a mark on your opponent's last move.",
                )}
            >
                <div className="with-sample-goban">
                    <div className="left">
                        <Toggle
                            checked={visual_undo_request_indicator}
                            onChange={setVisualUndoRequestIndicator}
                        />
                    </div>

                    <MiniGoban
                        className="inline"
                        key={visual_undo_request_indicator + "" + _refresh}
                        json={{
                            moves: [{ x: 1, y: 0 }],
                            width: 3,
                            height: 1,
                        }}
                        noLink={true}
                        width={2}
                        height={1}
                        displayWidth={80}
                        labels_positioning={"none"}
                        sampleOptions={{ undo: true }}
                    />
                </div>
            </PreferenceLine>

            <PreferenceLine title={"Use old canvas goban renderer"}>
                <Toggle
                    checked={canvas_enabled === "enabled"}
                    onChange={(tf) => {
                        if (tf) {
                            setGobanRenderer("canvas");
                        } else {
                            setGobanRenderer("svg");
                        }

                        setCanvasEnabled(tf ? "enabled" : undefined);
                        setTimeout(() => refresh((x) => x + 1), 50);
                    }}
                />
            </PreferenceLine>
        </div>
    );
}
