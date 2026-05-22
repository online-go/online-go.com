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
import type { LabelPosition } from "goban";
import { Toggle } from "@/components/Toggle";
import { GobanThemePicker } from "@/components/GobanThemePicker/GobanThemePicker";
import { openACLModal } from "@/components/ACLModal";
import { useGobanController } from "./goban_context";
import "./GameSidebarPanels.css";

interface GameSettingsPanelProps {
    /** Called by actions that commit to a final state the user wants to see
     *  applied (layout switch, zen mode). Toggles that the user is likely to
     *  flip multiple times (coordinates, AI review, volume) don't fire this. */
    onClose?: () => void;
}

export function GameSettingsPanel({ onClose }: GameSettingsPanelProps = {}): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;

    const [ai_review_enabled, set_ai_review_enabled] = React.useState(
        goban_controller.ai_review_enabled,
    );

    React.useEffect(() => {
        set_ai_review_enabled(goban_controller.ai_review_enabled);
        goban_controller.on("ai_review_enabled", set_ai_review_enabled);
        return () => {
            goban_controller.off("ai_review_enabled", set_ai_review_enabled);
        };
    }, [goban_controller]);

    const [volume, set_volume] = React.useState(sfx.getVolume("master"));
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
        set_volume(new_volume);
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

    const isPrivate = !!(engine.config as any)["private"];

    const [layout, setLayout] = usePreference("game.layout");

    const [label_position, setLabelPositionPref] = usePreference("label-positioning");
    // The preference is the source of truth; the goban needs an explicit
    // sync call since it doesn't subscribe to this specific preference.
    const setCoordinates = (pos: LabelPosition) => {
        setLabelPositionPref(pos);
        goban.setLabelPosition(pos);
    };

    return (
        <div className="GameSidebarPanel GameSettingsPanel">
            <h3 className="GameSidebarPanel-title">{_("Settings")}</h3>

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

            <div className="GameSidebarPanel-section-header">{_("Layout")}</div>
            <button
                className={"GameSidebarPanel-item" + (layout === "standard" ? " active" : "")}
                onClick={() => {
                    setLayout("standard");
                    onClose?.();
                }}
                title={pgettext("Game layout option", "Standard")}
            >
                <i className="fa fa-columns" />
                <span>{pgettext("Game layout option", "Standard")}</span>
            </button>
            <button
                className={"GameSidebarPanel-item" + (layout === "stacked" ? " active" : "")}
                onClick={() => {
                    setLayout("stacked");
                    onClose?.();
                }}
                title={pgettext("Game layout option: players above and below the board", "Stacked")}
            >
                <i className="fa fa-th-list" />
                <span>
                    {pgettext("Game layout option: players above and below the board", "Stacked")}
                </span>
            </button>
            <button
                className="GameSidebarPanel-item"
                onClick={() => {
                    goban_controller.toggleZenMode();
                    onClose?.();
                }}
                title={_("Full screen zen mode")}
            >
                <i className="fa fa-expand" />
                <span>{_("Full screen zen mode")}</span>
            </button>

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
                    <option value="none">{pgettext("Coordinate label position", "None")}</option>
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
                <label htmlFor="game-settings-ai-review">
                    <i className="fa fa-desktop" />
                    <span>{_("AI Review")}</span>
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
                    title={pgettext("Control who can access the game or review", "Access settings")}
                >
                    <i className="fa fa-lock" />
                    <span>
                        {pgettext("Control who can access the game or review", "Access settings")}
                    </span>
                </button>
            )}

            <div className="GameSidebarPanel-section-header">
                {pgettext("Goban theme section in the Game settings panel", "Theme")}
            </div>
            <div className="GameSettingsPanel-theme-picker">
                <GobanThemePicker size={32} />
            </div>
        </div>
    );
}
