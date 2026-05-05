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
import { openACLModal } from "@/components/ACLModal";
import { useGobanController } from "./goban_context";
import "./GameSidebarPanels.css";

export function GameSettingsPanel(): React.ReactElement {
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
    const volume_sound_debounce = React.useRef<any | null>(null);

    const _setVolume = (new_volume: number) => {
        sfx.setVolume("master", new_volume);
        set_volume(new_volume);
        if (volume_sound_debounce.current) {
            clearTimeout(volume_sound_debounce.current);
        }
        volume_sound_debounce.current = setTimeout(
            () => sfx.playStonePlacementSound(5, 5, 9, 9, "white"),
            250,
        );
    };
    const toggleVolume = () => _setVolume(volume > 0 ? 0 : 0.5);
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

            <button
                className="GameSidebarPanel-item"
                onClick={goban_controller.toggleZenMode}
                title={_("Full screen zen mode")}
            >
                <i className="fa fa-expand" />
                <span>{_("Full screen zen mode")}</span>
            </button>

            <button
                className="GameSidebarPanel-item"
                onClick={goban_controller.toggleCoordinates}
                title={_("Toggle coordinates")}
            >
                <i className="ogs-coordinates" />
                <span>{_("Toggle coordinates")}</span>
            </button>

            <button
                className={"GameSidebarPanel-item" + (ai_review_enabled ? " active" : "")}
                onClick={goban_controller.toggleAIReview}
                title={ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}
            >
                <i className="fa fa-desktop" />
                <span>{ai_review_enabled ? _("Disable AI review") : _("Enable AI review")}</span>
            </button>

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
        </div>
    );
}
