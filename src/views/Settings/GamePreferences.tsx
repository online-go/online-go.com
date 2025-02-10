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

import * as preferences from "@/lib/preferences";
import { usePreference, ValidPreference } from "@/lib/preferences";

import { Toggle } from "@/components/Toggle";

import {
    PreferenceLine,
    PreferenceDropdown,
    MAX_DOCK_DELAY,
    MAX_AI_VAR_MOVES,
} from "@/lib/SettingsCommon";

export function GamePreferences(): React.ReactElement {
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
    const [chat_mode, _setChatMode] = usePreference("chat-mode");

    const [auto_advance, setAutoAdvance] = usePreference("auto-advance-after-submit");
    const [always_disable_analysis, setAlwaysDisableAnalysis] =
        usePreference("always-disable-analysis");
    const [dynamic_title, setDynamicTitle] = usePreference("dynamic-title");
    const [function_keys_enabled, setFunctionKeysEnabled] = usePreference("function-keys-enabled");
    const [autoplay_delay, _setAutoplayDelay]: [number, (x: number) => void] = React.useState(
        preferences.get("autoplay-delay") / 1000,
    );
    const [variation_move_count, _setVariationMoveCount] = usePreference("variation-move-count");
    const [zen_mode_by_default, _setZenModeByDefault] = usePreference("start-in-zen-mode");
    const [scroll_to_navigate, setScrollToNavigate] = usePreference("scroll-to-navigate");

    function setDockDelay(ev: React.ChangeEvent<HTMLInputElement>) {
        const new_delay = parseFloat(ev.target.value);
        preferences.set("dock-delay", new_delay);
        _setDockDelay(new_delay);
    }
    function toggleAIReview(checked: boolean) {
        _setAiReviewEnabled(!checked);
    }
    function toggleVariationsInChat(checked: boolean) {
        _setVariationsInChat(!checked);
    }
    function toggleZenMode(checked: boolean) {
        _setZenModeByDefault(checked);
    }

    function getSubmitMode(speed: string) {
        const single = preferences.get(`one-click-submit-${speed}` as ValidPreference);
        const dbl = preferences.get(`double-click-submit-${speed}` as ValidPreference);
        return single ? "single" : dbl ? "double" : "button";
    }

    function setChatMode(value: string) {
        _setChatMode(value);
    }

    function setSubmitMode(speed: string, mode: string) {
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
    function setLiveSubmitMode(value: string) {
        setSubmitMode("live", value);
    }
    function setCorrSubmitMode(value: string) {
        setSubmitMode("correspondence", value);
    }
    function setVariationMoveCount(ev: React.ChangeEvent<HTMLInputElement>) {
        const value = parseInt(ev.target.value);

        if (value >= 1 && value <= 10) {
            _setVariationMoveCount(value);
        }
    }
    function updateAutoplayDelay(ev: React.ChangeEvent<HTMLInputElement>) {
        const value = parseInt(ev.target.value);
        if (value >= 1 && value <= 20) {
            _setAutoplayDelay(value);
            preferences.set("autoplay-delay", 1000 * value);
        }
    }

    return (
        <div>
            <PreferenceLine
                title={
                    _("Game-control-dock pop-out delay") // translators: This is the text under settings for controlling the slide out delay of the list of game buttons in the game (pause, review, sgf link, etc...)
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
                <Toggle checked={auto_advance} onChange={setAutoAdvance} />
            </PreferenceLine>

            <PreferenceLine title={_("Autoplay delay (in seconds)")}>
                <input
                    type="range"
                    step="1"
                    min="1"
                    max="20"
                    onChange={updateAutoplayDelay}
                    value={autoplay_delay}
                />
                <span>
                    &nbsp;
                    {interpolate(_("{{delay}} secs"), {
                        delay: autoplay_delay,
                    })}
                </span>
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

            <PreferenceLine
                title={_("Set default game chat mode")}
                description={_(
                    "The chat mode that is defaulted to when a game is initiated or when the game page is refreshed.",
                )}
            >
                <PreferenceDropdown
                    value={chat_mode}
                    options={[
                        { value: "main", label: _("Chat") },
                        { value: "malkovich", label: _("Malkovich") },
                        { value: "personal", label: _("Personal") },
                    ]}
                    onChange={setChatMode}
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Activate Zen Mode by default")}
                description={_(
                    'When enabled, live games you play or view will start off in the full screen "Zen Mode". This can be toggled off in game by clicking the Z icon.',
                )}
            >
                <Toggle checked={zen_mode_by_default} onChange={toggleZenMode} />
            </PreferenceLine>

            <PreferenceLine
                title={_("AI variations shown")}
                description={_("Maximum number of moves shown in AI variations")}
            >
                <input
                    type="range"
                    step="1"
                    min="1"
                    max={MAX_AI_VAR_MOVES}
                    onChange={setVariationMoveCount}
                    value={variation_move_count}
                />
                <span>
                    &nbsp;
                    {variation_move_count === MAX_AI_VAR_MOVES
                        ? _("Max") // translators: Indicates the dock slide out has been turned off
                        : interpolate(_("{{num_moves}} moves"), {
                              num_moves: variation_move_count,
                          })}
                </span>
            </PreferenceLine>

            <PreferenceLine
                title={_("Scroll to navigate")}
                description={_("Scroll mousewheel to navigate moves on the game page")}
            >
                <Toggle checked={scroll_to_navigate} onChange={setScrollToNavigate} />
            </PreferenceLine>
        </div>
    );
}
