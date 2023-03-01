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

import { _, interpolate } from "translate";

import * as preferences from "preferences";
import { usePreference, ValidPreference } from "preferences";

import { Toggle } from "Toggle";

import { PreferenceLine, PreferenceDropdown, MAX_DOCK_DELAY } from "SettingsCommon";

export function GamePreferences(): JSX.Element {
    const [dock_delay, _setDockDelay]: [number, (x: number) => void] = React.useState(
        preferences.get("dock-delay"),
    );
    const [ai_review_enabled, _setAiReviewEnabled] = usePreference("ai-review-enabled");
    const [variations_in_chat, _setVariationsInChat] = usePreference("variations-in-chat-enabled");
    const [_live_submit_mode, _setLiveSubmitMode]: [string, (x: string) => void] = React.useState(
        getSubmitMode("live"),
    );
    const [_corr_submit_mode, _setCorrSubmitMode]: [string, (x: string) => void] = React.useState(
        getSubmitMode("correspondence"),
    );
    const [board_labeling, setBoardLabeling] = usePreference("board-labeling");

    const [autoadvance, setAutoAdvance] = usePreference("auto-advance-after-submit");
    const [always_disable_analysis, setAlwaysDisableAnalysis] =
        usePreference("always-disable-analysis");
    const [dynamic_title, setDynamicTitle] = usePreference("dynamic-title");
    const [function_keys_enabled, setFunctionKeysEnabled] = usePreference("function-keys-enabled");
    const [autoplay_delay, _setAutoplayDelay]: [number, (x: number) => void] = React.useState(
        preferences.get("autoplay-delay") / 1000,
    );
    const [variation_stone_transparency, _setVariationStoneTransparency] = usePreference(
        "variation-stone-transparency",
    );
    const [visual_undo_request_indicator, setVisualUndoRequestIndicator] = usePreference(
        "visual-undo-request-indicator",
    );
    const [zen_mode_by_default, _setZenModeByDefault] = usePreference("zen-mode");

    function setDockDelay(ev) {
        const new_delay = parseFloat(ev.target.value);
        preferences.set("dock-delay", new_delay);
        _setDockDelay(new_delay);
    }
    function toggleAIReview(checked) {
        _setAiReviewEnabled(!checked);
    }
    function toggleVariationsInChat(checked) {
        _setVariationsInChat(!checked);
    }
    function toggleZenMode(checked) {
        _setZenModeByDefault(checked);
    }

    function getSubmitMode(speed) {
        const single = preferences.get(`one-click-submit-${speed}` as ValidPreference);
        const dbl = preferences.get(`double-click-submit-${speed}` as ValidPreference);
        return single ? "single" : dbl ? "double" : "button";
    }
    function setSubmitMode(speed, mode) {
        switch (mode) {
            case "single":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, false);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, true);
                break;
            case "double":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, true);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, false);
                break;
            case "button":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, false);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, false);
                break;
        }
        if (speed === "live") {
            _setLiveSubmitMode(getSubmitMode(speed));
        }
        if (speed === "correspondence") {
            _setCorrSubmitMode(getSubmitMode(speed));
        }
    }
    function setLiveSubmitMode(value) {
        setSubmitMode("live", value);
    }
    function setCorrSubmitMode(value) {
        setSubmitMode("correspondence", value);
    }
    function setVariationStoneTransparency(ev) {
        const value = parseFloat(ev.target.value);

        if (value >= 0.0 && value <= 1.0) {
            _setVariationStoneTransparency(value);
        }
    }
    function updateAutoplayDelay(ev) {
        const delay = parseFloat(ev.target.value);

        if (delay >= 0.1) {
            _setAutoplayDelay(delay);
            preferences.set("autoplay-delay", Math.round(1000 * delay));
        }
    }

    return (
        <div>
            <PreferenceLine
                title={
                    _("Game-control-dock pop-out delay") // translators: This is the text under settings for controling the slide out delay of the list of game buttons in the game (pause, review, sgf link, etc...)
                }
            >
                <input
                    type="range"
                    onChange={setDockDelay}
                    value={dock_delay}
                    min={0}
                    max={MAX_DOCK_DELAY}
                    step={0.1}
                />
                <span>
                    &nbsp;
                    {
                        dock_delay === MAX_DOCK_DELAY
                            ? _("Off") // translators: Indicates the dock slide out has been turned off
                            : interpolate(_("{{number_of}} seconds"), { number_of: dock_delay }) // translators: Indicates the number of seconds to delay the slide out of the panel of game buttons on the right side of the game page
                    }
                </span>
            </PreferenceLine>

            <PreferenceLine title={_("Board labeling")}>
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

            <PreferenceLine title={_("Live game submit mode")}>
                <PreferenceDropdown
                    value={getSubmitMode("live")}
                    options={[
                        { value: "single", label: _("One-click to move") },
                        { value: "double", label: _("Double-click to move") },
                        { value: "button", label: _("Submit-move button") },
                    ]}
                    onChange={setLiveSubmitMode}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Correspondence submit mode")}>
                <PreferenceDropdown
                    value={getSubmitMode("correspondence")}
                    options={[
                        { value: "single", label: _("One-click to move") },
                        { value: "double", label: _("Double-click to move") },
                        { value: "button", label: _("Submit-move button") },
                    ]}
                    onChange={setCorrSubmitMode}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Auto-advance to next game after making a move")}>
                <Toggle checked={autoadvance} onChange={setAutoAdvance} />
            </PreferenceLine>

            <PreferenceLine title={_("Autoplay delay (in seconds)")}>
                <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    onChange={updateAutoplayDelay}
                    value={autoplay_delay}
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Disable AI review")}
                description={_(
                    "This will enable or disable the artificial intelligence reviews at the end of a game.",
                )}
            >
                <Toggle checked={!ai_review_enabled} onChange={toggleAIReview} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Always disable analysis")}
                description={_(
                    "This will disable the analysis mode and conditional moves for you in all games, even if it is not disabled in the game's settings. (If allowed in game settings, your opponent will still have access to analysis.)",
                )}
            >
                <Toggle checked={always_disable_analysis} onChange={setAlwaysDisableAnalysis} />
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

            <PreferenceLine
                title={_("Dynamic title")}
                description={_(
                    "Choose whether to show in the web page title whose turn it is (dynamic) or who the users are (not dynamic)",
                )}
            >
                <Toggle checked={dynamic_title} onChange={setDynamicTitle} />
            </PreferenceLine>

            <PreferenceLine title={_("Enable function keys for game analysis shortcuts")}>
                <Toggle checked={function_keys_enabled} onChange={setFunctionKeysEnabled} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Disable clickable variations in chat")}
                description={_(
                    "This will enable or disable the hoverable and clickable variations displayed in a game or review chat.",
                )}
            >
                <Toggle checked={!variations_in_chat} onChange={toggleVariationsInChat} />
            </PreferenceLine>

            <PreferenceLine title={_("Always enter game(s) in Zen mode")}>
                <Toggle checked={zen_mode_by_default} onChange={toggleZenMode} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Variation stone transparency")}
                description={_(
                    "Choose the level of transparency for stones shown in variations. 0.0 is transparent and 1.0 is opaque.",
                )}
            >
                <input
                    type="number"
                    step="0.1"
                    min="0.0"
                    max="1.0"
                    onChange={setVariationStoneTransparency}
                    value={variation_stone_transparency}
                />
            </PreferenceLine>
        </div>
    );
}
