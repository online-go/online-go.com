/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import * as data from "data";
import { pgettext } from "./translate";

export type DynamicHelpSet = "guest-password-help-set";

export type GuestPasswordHelperSetItem =
    | "right-nav-help"
    | "settings-button-help"
    | "username-change-help"
    | "profile-button-username-help"
    | "profile-page-username-help";

export type HelperSetItem = GuestPasswordHelperSetItem;

export type DynamicHelpSetItemSchema = {
    show_item: boolean;
};

export type DynamicHelpSetSchema = {
    show_set: boolean;
    set_title: string;
    items: { [item_name in HelperSetItem]?: DynamicHelpSetItemSchema };
};

export type DynamicHelpSchema = {
    [set_name in DynamicHelpSet]: DynamicHelpSetSchema;
};

// This could be used to set initial values.  Right now it isn't used for that.
// This is currently used to define what items are in a help set,
// so we can make sure we turn them all on in `showHelpSet()`
export const DEFAULT_DYNAMIC_HELP_CONFIG: DynamicHelpSchema = {
    "guest-password-help-set": {
        show_set: false,
        set_title: pgettext(
            "Label for the settings controlling guest password help",
            "Guest Password Help Set",
        ),
        items: {
            "right-nav-help": { show_item: false },
            "settings-button-help": { show_item: false },
            "username-change-help": { show_item: false },
            "profile-button-username-help": { show_item: false },
            "profile-page-username-help": { show_item: false },
        },
    },
};

export function setIsVisible(set_name: DynamicHelpSet): boolean {
    return data.get(`dynamic-help.${set_name}`, DEFAULT_DYNAMIC_HELP_CONFIG[set_name]).show_set;
}

export function allItemsVisible(set_name: DynamicHelpSet): boolean {
    const config = data.get(`dynamic-help.${set_name}`, DEFAULT_DYNAMIC_HELP_CONFIG[set_name]);

    return Object.keys(config.items).reduce(
        (prev, current) => prev && config.items[current].show_item,
        config.show_set,
    );
}

export function someItemsVisible(set_name: DynamicHelpSet): boolean {
    const config = data.get(`dynamic-help.${set_name}`, DEFAULT_DYNAMIC_HELP_CONFIG[set_name]);

    return (
        config.show_set &&
        Object.keys(config.items).reduce(
            (prev, current) => prev || config.items[current].show_item,
            false,
        )
    );
}

export function isVisible(set_name: DynamicHelpSet, item_name: string): boolean {
    const set_config = data.get(`dynamic-help.${set_name}`, {
        show_set: false,
        items: {},
        set_title: "",
    });

    const visible =
        set_config.show_set &&
        item_name in set_config.items &&
        set_config.items[item_name].show_item;

    return visible;
}

// Turn on "show item" for a help set item...
export function showHelpSetItem(set_name: DynamicHelpSet, item_name: string): void {
    setHelpSetItem(true, set_name, item_name);
}

// Turn off "show item" for a help set item...
export function hideHelpSetItem(set_name: DynamicHelpSet, item_name: string): void {
    setHelpSetItem(false, set_name, item_name);
}

// Set the value of "show_item" for a help set item
// (with optional parameter of current help set config, to avoid re-reading it a lot)
// Note: this does not control set show_set for the HelpSet, only show_item for the items

function setHelpSetItem(
    value: boolean,
    set_name: DynamicHelpSet,
    item_name: string,
    prev_config?,
): DynamicHelpSetSchema {
    const set_config =
        prev_config || data.get(`dynamic-help.${set_name}`, DEFAULT_DYNAMIC_HELP_CONFIG[set_name]);

    if (!(item_name in set_config["items"])) {
        set_config["items"][item_name] = { show_item: value };
    } else {
        set_config["items"][item_name]["show_item"] = value;
    }

    data.set(`dynamic-help.${set_name}`, set_config);

    return set_config;
}

// Turn on "show_set" for a named help set, and turn on all the items.
export function showHelpSet(set_name: DynamicHelpSet): void {
    let set_config = data.get(`dynamic-help.${set_name}`);

    set_config = { ...set_config, show_set: true };

    data.set(`dynamic-help.${set_name}`, set_config);

    for (const item in DEFAULT_DYNAMIC_HELP_CONFIG[set_name]["items"]) {
        set_config = setHelpSetItem(true, set_name, item, set_config);
    }
}

// Note: this doesn't change the visibility of the items in the set
export function hideHelpSet(set_name: DynamicHelpSet): void {
    const set_config = data.get(`dynamic-help.${set_name}`);

    data.set(`dynamic-help.${set_name}`, { ...set_config, show_set: false });
}

export function toggleHelpSet(set_name: DynamicHelpSet): boolean {
    const set_config = data.get(`dynamic-help.${set_name}`, DEFAULT_DYNAMIC_HELP_CONFIG[set_name]);
    const new_value = !set_config.show_set;

    if (new_value) {
        showHelpSet(set_name);
    } else {
        hideHelpSet(set_name);
    }

    return new_value;
}
