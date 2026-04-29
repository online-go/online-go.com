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
import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";
import { _, pgettext } from "@/lib/translate";
import { Toggle } from "@/components/Toggle";
import { PuzzleCollectionAcl } from "./PuzzleCollectionAcl";
import "./PuzzleSettings.css";

interface PuzzleSettingsProps {
    transform_x: boolean;
    transform_h: boolean;
    transform_v: boolean;
    transform_color: boolean;
    zoom: boolean;
    zoomable: boolean;
    position_transform_enabled: boolean;
    color_transform_enabled: boolean;
    label_positioning: string;
    owner_id?: number;
    /** Collection info — optional because the new-puzzle flow has none. */
    collection_id?: number;
    collection_private?: boolean;
    onToggleTransformX: () => void;
    onToggleTransformH: () => void;
    onToggleTransformV: () => void;
    onToggleTransformColor: () => void;
    onToggleZoom: () => void;
    onToggleCoordinates: () => void;
    onRandomizeChange: () => void;
    /** Updates a single collection flag server-side; parent re-fetches. */
    onToggleCollectionFlag: (
        flag: "private" | "position_transform_enabled" | "color_transform_enabled",
        value: boolean,
    ) => void;
}

interface ToggleRow {
    key: string;
    icon: string;
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export function PuzzleSettings({
    transform_x,
    transform_h,
    transform_v,
    transform_color,
    zoom,
    zoomable,
    position_transform_enabled,
    color_transform_enabled,
    label_positioning,
    owner_id,
    collection_id,
    collection_private,
    onToggleTransformX,
    onToggleTransformH,
    onToggleTransformV,
    onToggleTransformColor,
    onToggleZoom,
    onToggleCoordinates,
    onRandomizeChange,
    onToggleCollectionFlag,
}: PuzzleSettingsProps): React.ReactElement {
    const [randomize_transform, setRandomizeTransform] = React.useState(
        preferences.get("puzzle.randomize.transform"),
    );
    const [randomize_color, setRandomizeColor] = React.useState(
        preferences.get("puzzle.randomize.color"),
    );
    const [sound, setSound] = React.useState(preferences.get("puzzle.sound"));
    const [debug, setDebug] = React.useState(false);

    const user = data.get("user");
    const is_owner = !!user && user.id === owner_id;
    const is_owner_or_mod = !!user && (user.is_moderator || user.id === owner_id);
    const show_debug_toggle = is_owner_or_mod;
    const show_collection_settings = is_owner_or_mod && collection_id !== undefined;
    const show_acl = is_owner && collection_id !== undefined;

    const handleRandomizeTransform = (checked: boolean) => {
        preferences.set("puzzle.randomize.transform", checked);
        setRandomizeTransform(checked);
        onRandomizeChange();
    };

    const handleRandomizeColor = (checked: boolean) => {
        preferences.set("puzzle.randomize.color", checked);
        setRandomizeColor(checked);
        onRandomizeChange();
    };

    const handleSound = (checked: boolean) => {
        preferences.set("puzzle.sound", checked);
        setSound(checked);
    };

    const settings: ToggleRow[] = [
        ...(zoomable
            ? [
                  {
                      key: "zoom",
                      icon: "fa fa-arrows-alt",
                      label: pgettext(
                          "Toggle zoom when viewing a puzzle (whole board or only some stones)",
                          "Zoom",
                      ),
                      checked: zoom,
                      onChange: onToggleZoom,
                  },
              ]
            : []),
        {
            key: "coordinates",
            icon: "ogs-coordinates",
            label: pgettext("Show or hide coordinates when viewing a puzzle", "Show coordinates"),
            checked: label_positioning === "all",
            onChange: onToggleCoordinates,
        },
        {
            key: "randomize_transform",
            icon: "fa fa-random",
            label: _("Randomly transform puzzles"),
            checked: randomize_transform,
            onChange: handleRandomizeTransform,
        },
        {
            key: "randomize_color",
            icon: "fa fa-adjust",
            label: _("Randomize colors"),
            checked: randomize_color,
            onChange: handleRandomizeColor,
        },
        {
            key: "sound",
            icon: sound ? "fa fa-volume-up" : "fa fa-volume-off",
            label: _("Sound"),
            checked: sound,
            onChange: handleSound,
        },
        ...(show_debug_toggle
            ? [
                  {
                      key: "debug",
                      icon: "fa fa-bug",
                      label: _("Debug"),
                      checked: debug,
                      onChange: (v: boolean) => setDebug(v),
                  },
              ]
            : []),
    ];

    const collection_rows: ToggleRow[] = [
        {
            key: "collection_position_transform",
            icon: "fa fa-random",
            label: _("Allow position transforms"),
            checked: position_transform_enabled,
            onChange: (v) => onToggleCollectionFlag("position_transform_enabled", v),
        },
        {
            key: "collection_color_transform",
            icon: "fa fa-adjust",
            label: _("Allow color transforms"),
            checked: color_transform_enabled,
            onChange: (v) => onToggleCollectionFlag("color_transform_enabled", v),
        },
        {
            key: "collection_private",
            icon: "fa fa-lock",
            label: _("Private"),
            checked: !!collection_private,
            onChange: (v) => onToggleCollectionFlag("private", v),
        },
    ];

    const debug_rows: ToggleRow[] = [
        {
            key: "transform_x",
            icon: "fa fa-expand",
            label: pgettext("Transform the stone positions in a puzzle", "Flip diagonally"),
            checked: transform_x,
            disabled: !position_transform_enabled,
            onChange: onToggleTransformX,
        },
        {
            key: "transform_h",
            icon: "fa fa-arrows-h",
            label: pgettext("Transform the stone positions in a puzzle", "Flip horizontally"),
            checked: transform_h,
            disabled: !position_transform_enabled,
            onChange: onToggleTransformH,
        },
        {
            key: "transform_v",
            icon: "fa fa-arrows-v",
            label: pgettext("Transform the stone positions in a puzzle", "Flip vertically"),
            checked: transform_v,
            disabled: !position_transform_enabled,
            onChange: onToggleTransformV,
        },
        {
            key: "transform_color",
            icon: "fa fa-adjust",
            label: pgettext("Transform the colors of the stones in a puzzle", "Reverse colors"),
            checked: transform_color,
            disabled: !color_transform_enabled,
            onChange: onToggleTransformColor,
        },
    ];

    const renderToggleRow = (row: ToggleRow) => {
        const id = `puzzle-settings-${row.key}`;
        return (
            <li key={row.key} className={row.disabled ? "disabled" : undefined}>
                <label className="PuzzleSettings-row" htmlFor={id}>
                    <i className={`PuzzleSettings-row-icon ${row.icon}`} />
                    <span className="PuzzleSettings-row-label">{row.label}</span>
                    <Toggle
                        id={id}
                        checked={row.checked}
                        disabled={row.disabled}
                        onChange={row.onChange}
                    />
                </label>
            </li>
        );
    };

    return (
        <div className="PuzzleSettings">
            <h3 className="PuzzleSettings-heading">{_("Settings")}</h3>
            <ul className="PuzzleSettings-list">{settings.map(renderToggleRow)}</ul>

            {show_collection_settings && (
                <>
                    <h3 className="PuzzleSettings-heading">{_("Puzzle Collection Settings")}</h3>
                    <ul className="PuzzleSettings-list">{collection_rows.map(renderToggleRow)}</ul>
                    {collection_private && show_acl && (
                        <div className="PuzzleSettings-subsection">
                            <h4 className="PuzzleSettings-subheading">{_("Access control")}</h4>
                            <PuzzleCollectionAcl collection_id={collection_id} />
                        </div>
                    )}
                </>
            )}

            {show_debug_toggle && debug && (
                <>
                    <h3 className="PuzzleSettings-heading">{_("Debug")}</h3>
                    <ul className="PuzzleSettings-list">{debug_rows.map(renderToggleRow)}</ul>
                </>
            )}
        </div>
    );
}
