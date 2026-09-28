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
import { _, pgettext } from "@/lib/translate";
import { sfx } from "@/lib/sfx";
import { usePreference } from "@/lib/preferences";
import { useData, useIsTouchOnlyDevice } from "@/lib/hooks";
import type { LabelPosition } from "goban";
import { Toggle } from "@/components/Toggle";
import { GobanThemePicker } from "@/components/GobanThemePicker/GobanThemePicker";
import { openACLModal } from "@/components/ACLModal";
import { BoardAlignmentPicker } from "@/components/LayoutSettings/pickers/BoardAlignmentPicker";
import { ActionButtonsPicker } from "@/components/LayoutSettings/pickers/ActionButtonsPicker";
import { ChatColumnPicker } from "@/components/LayoutSettings/pickers/ChatColumnPicker";
import { MoveControlsPicker } from "@/components/LayoutSettings/pickers/MoveControlsPicker";
import { ScrollingLayoutPicker } from "@/components/LayoutSettings/pickers/ScrollingLayoutPicker";
import { useAIReviewEnabled, useZenMode } from "./GameHooks";
import { useGobanController } from "./goban_context";
import { openGameKeyboardShortcutsModal } from "./GameKeyboardShortcutsModal";
import "./GameSidebarPanels.css";

interface GameSettingsPanelProps {
    /** Called by actions that commit to a final state the user wants to see
     *  applied (zen mode). Toggles that the user is likely to flip
     *  multiple times (coordinates, AI review, volume) don't fire this. */
    onClose?: () => void;
    /** Mobile (portrait) layout: leave out the landscape-only options. */
    compact?: boolean;
    /** When provided, a "More options" item renders in a footer under the
     *  scrolling body; clicking it fires this (the Game view opens the full
     *  Themes & Visuals takeover) and then onClose. */
    onShowThemeSettings?: () => void;
}

export function GameSettingsPanel({
    onClose,
    compact = false,
    onShowThemeSettings,
}: GameSettingsPanelProps = {}): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;

    // Phones and tablets have no keyboard to speak of, so the shortcut
    // list is only offered where a mouse or trackpad suggests one is
    // present. Touch-only devices get a close button in its place, because
    // the Settings popover there can cover the button that opened it. The
    // Game view uses the same hook to choose the popover placement.
    const touch_only_device = useIsTouchOnlyDevice();
    const showKeyboardShortcuts = () => {
        openGameKeyboardShortcutsModal();
        onClose?.();
    };

    const ai_review_enabled = useAIReviewEnabled(goban_controller);

    // Subscribed, so the slider follows volume changes made elsewhere.
    const [volume] = useData("sound.volume.master", sfx.getVolume("master"));
    const volume_slider_ref = React.useRef<HTMLInputElement>(null);

    // Stone-placement sample for volume feedback. Fires on commit (pointer or
    // keyboard release) rather than every intermediate slider value, so the
    // sample plays exactly once per adjustment instead of spamming.
    const playVolumeSample = () => sfx.playStonePlacementSound(5, 5, 9, 9, "white");

    // Native `change` event on `<input type="range">` fires exactly on
    // commit (release pointer, blur after keyboard nav) — distinct from
    // React's `onChange`, which is wired to the `input` event and fires
    // on every intermediate value. Use a ref + addEventListener so the
    // sample plays once per adjustment without spamming during the drag.
    React.useEffect(() => {
        const slider = volume_slider_ref.current;
        if (!slider) {
            return;
        }
        slider.addEventListener("change", playVolumeSample);
        return () => slider.removeEventListener("change", playVolumeSample);
    }, []);

    const _setVolume = (new_volume: number) => {
        sfx.setVolume("master", new_volume);
    };
    const toggleVolume = () => {
        _setVolume(volume > 0 ? 0 : 0.5);
        playVolumeSample();
    };
    const setVolume = (ev: React.ChangeEvent<HTMLInputElement>) =>
        _setVolume(parseFloat(ev.target.value));

    const review_id: number | undefined = goban.config.review_id;
    const game_id: number | undefined = Number(goban.config.game_id);
    const openACL = () => {
        if (game_id) {
            openACLModal({ game_id });
        } else if (review_id) {
            openACLModal({ review_id });
        }
    };

    const isPrivate = !!engine.config.private;

    const [chat_enabled, set_chat_enabled] = usePreference("game.chat-enabled");

    const zen_mode = useZenMode(goban_controller);

    const [mobile_scroll] = usePreference("goban-view-mobile-scroll");
    const move_controls_note_id = React.useId();

    const [label_position, setLabelPositionPref] = usePreference("label-positioning");
    // The preference is the source of truth; the goban needs an explicit
    // sync call since it doesn't subscribe to this specific preference.
    const setCoordinates = (pos: LabelPosition) => {
        setLabelPositionPref(pos);
        goban.setLabelPosition(pos);
    };

    return (
        <div className="GameSidebarPanel GameSettingsPanel">
            <div className="GameSettingsPanel-body">
                <div className="GameSettingsPanel-title-row">
                    <h3 className="GameSidebarPanel-title">{_("Settings")}</h3>
                    {touch_only_device ? (
                        <button
                            type="button"
                            className="GameSettingsPanel-close"
                            onClick={() => onClose?.()}
                            title={_("Close")}
                            aria-label={_("Close")}
                        >
                            <i className="fa fa-times" aria-hidden="true" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="GameSettingsPanel-shortcuts-link"
                            onClick={showKeyboardShortcuts}
                            title={_("Keyboard shortcuts")}
                            aria-label={_("Keyboard shortcuts")}
                        >
                            <i className="fa fa-keyboard-o" />
                        </button>
                    )}
                </div>

                <div className="GameSidebarPanel-row">
                    <i
                        className={
                            "fa volume-icon " +
                            (volume === 0
                                ? "fa-volume-off"
                                : volume > 0.5
                                  ? "fa-volume-up"
                                  : "fa-volume-down")
                        }
                        onClick={toggleVolume}
                        role="button"
                        title={_("Toggle volume")}
                    />
                    <input
                        ref={volume_slider_ref}
                        type="range"
                        className="volume-slider"
                        onChange={setVolume}
                        value={volume}
                        min={0}
                        max={1.0}
                        step={0.01}
                        aria-label={_("Volume")}
                    />
                </div>

                <div className="GameSidebarPanel-labeled-row">
                    <label htmlFor="game-settings-zen-mode">
                        <i className="fa fa-expand" />
                        <span>{_("Zen Mode")}</span>
                    </label>
                    <Toggle
                        id="game-settings-zen-mode"
                        checked={zen_mode}
                        onChange={() => {
                            goban_controller.toggleZenMode();
                            onClose?.();
                        }}
                    />
                </div>

                <div className="GameSidebarPanel-labeled-row">
                    <label htmlFor="game-settings-coords">
                        <i className="ogs-coordinates" />
                        <span>{_("Coordinates")}</span>
                    </label>
                    <select
                        id="game-settings-coords"
                        value={label_position}
                        onChange={(e) => setCoordinates(e.target.value as LabelPosition)}
                    >
                        <option value="all">{pgettext("Coordinate label position", "All")}</option>
                        <option value="none">
                            {pgettext("Coordinate label position", "None")}
                        </option>
                        <option value="top-left">
                            {pgettext("Coordinate label position", "Top Left")}
                        </option>
                        <option value="top-right">
                            {pgettext("Coordinate label position", "Top Right")}
                        </option>
                        <option value="bottom-left">
                            {pgettext("Coordinate label position", "Bottom Left")}
                        </option>
                        <option value="bottom-right">
                            {pgettext("Coordinate label position", "Bottom Right")}
                        </option>
                    </select>
                </div>

                <div className="GameSidebarPanel-labeled-row">
                    <label htmlFor="game-settings-chat-enabled">
                        <i className="fa fa-comment" />
                        <span>{_("Enable chat")}</span>
                    </label>
                    <Toggle
                        id="game-settings-chat-enabled"
                        checked={chat_enabled}
                        onChange={(checked) => set_chat_enabled(checked)}
                    />
                </div>

                <div className="GameSidebarPanel-labeled-row">
                    <label htmlFor="game-settings-ai-review">
                        <i className="fa fa-desktop" />
                        <span>{_("Enable AI review")}</span>
                    </label>
                    <Toggle
                        id="game-settings-ai-review"
                        checked={ai_review_enabled}
                        onChange={() => goban_controller.toggleAIReview()}
                    />
                </div>

                {isPrivate && (
                    <button
                        className="GameSidebarPanel-item"
                        onClick={openACL}
                        title={pgettext(
                            "Control who can access the game or review",
                            "Access settings",
                        )}
                    >
                        <i className="fa fa-lock" />
                        <span>
                            {pgettext(
                                "Control who can access the game or review",
                                "Access settings",
                            )}
                        </span>
                    </button>
                )}

                <div className="GameSidebarPanel-section-header">
                    {pgettext("Goban theme section in the Game settings panel", "Theme")}
                </div>
                <div className="GameSettingsPanel-theme-picker">
                    <GobanThemePicker size={32} />
                </div>

                <div className="GameSidebarPanel-section-header">
                    {pgettext("Layout section in the Game settings panel", "Layout")}
                </div>

                <div className="GameSettingsPanel-layout-pickers">
                    {!compact && <ActionButtonsPicker size="compact" />}
                    {compact && <ScrollingLayoutPicker size="compact" />}
                    <MoveControlsPicker
                        size="compact"
                        device={compact ? "phone" : "desktop"}
                        disabled={compact && mobile_scroll}
                        describedBy={compact && mobile_scroll ? move_controls_note_id : undefined}
                    />
                    {compact && mobile_scroll && (
                        <p
                            className="GameSettingsPanel-move-controls-note"
                            id={move_controls_note_id}
                        >
                            {pgettext(
                                "Why the move controls setting is disabled",
                                "The scrolling layout always puts the move controls under the board.",
                            )}
                        </p>
                    )}
                    {!compact && <ChatColumnPicker size="compact" />}
                    {/* Board alignment only applies to the landscape layout. */}
                    {!compact && <BoardAlignmentPicker size="compact" />}
                </div>
            </div>
            {onShowThemeSettings && (
                <div className="GameSettingsPanel-footer">
                    <button
                        className="GameSidebarPanel-item"
                        onClick={() => {
                            onShowThemeSettings();
                            onClose?.();
                        }}
                        title={pgettext("Open the full theme settings", "More options")}
                    >
                        <i className="fa fa-sliders" />
                        <span>{pgettext("Open the full theme settings", "More options")}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
