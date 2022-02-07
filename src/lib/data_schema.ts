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

/**
 * This is the schema for the data functions (e.g. get(), set()).  It defines
 * all the possible keys as well as the associated value types.
 */

import { GroupList, ActiveTournamentList } from "./types";
import { Announcement } from "src/components/Announcements";
import { ValidSound, ValidSoundGroup } from "./sfx";
import { defaults as defaultPreferences } from "./preferences";

interface CachedSchema {
    groups: GroupList;
    active_tournaments: ActiveTournamentList;

    // TODO: examine these endpoints and write interfaces for these.
    config: ConfigSchema /* /login */;
    ladders: any /* /me/ladders */;
    challenge_list: any /* /me/challenges */;
    blocks: any /* /me/blocks */;
    friends: any /* ui/friends */;
    group_invitations: any /* me/groups/invitations */;
}

export interface ConfigSchema {
    user: any;
    cdn: string;
    cdn_release: string;
    cdn_host: string;
    release: string;
    version: string;
    paypal_server: string;
    paypal_this_server: string;
    paypal_email: string;
    billing_mor_locations: string[];
    user_jwt: string;
    stripe_pk: string;
    chat_auth: string;
    superchat_auth: string;
    notification_auth: string;
    incident_auth: string;
    aga_rankings_enabled: boolean;
}

interface ChatSchema {
    active_channel: string;
    joined: { [channel: string]: true | 1 };
    parted: { [channel: string]: 1 };
    "show-games": boolean;
    "split-sizes": number[];
}

export interface CustomGobanThemeSchema {
    black: string;
    white: string;
    board: string;
    line: string;
    url: string;
}

type SoundSchema = {
    "enabled.disconnected": boolean;
    "enabled.reconnected": boolean;
    "enabled.player_disconnected": boolean;
    "enabled.player_reconnected": boolean;
    "enabled.your_opponent_has_disconnected": boolean;
    "enabled.your_opponent_has_reconnected": boolean;
} & {
    [voice_enabled_key in `voice-enabled.${ValidSound}`]: boolean;
} & {
    [enabled_key in `enabled.${ValidSound}`]: boolean;
} & {
    [pack_key in `pack.${ValidSoundGroup}`]: string;
} & {
    [volume_key in `volume.${ValidSoundGroup}`]: number;
};

type PreferencesSchema = typeof defaultPreferences & {
    [theme_preference: `goban-theme-${string}`]: string;
};

/**
 * Prefixes every member of a type.
 *
 * Example:
 *
 * type fooType = Prefixed<{ bar: string; qux: number }, "foo">;
 *
 * is equivalent to
 *
 * type fooType = { "foo.bar": string; "foo.qux": number };
 */
type Prefixed<T, P extends string> = {
    [K in keyof T as K extends string ? `${P}.${K}` : never]: T[K];
};

/** The keys and corresponding types for the functions in data.ts */
export interface DataSchema
    extends Prefixed<CachedSchema, "cached">,
        Prefixed<ConfigSchema, "config">,
        Prefixed<ChatSchema, "chat">,
        Prefixed<SoundSchema, "sound">,
        Prefixed<PreferencesSchema, "preferences">,
        Prefixed<CustomGobanThemeSchema, "custom"> {
    user: any;
    bid: string;
    theme: string;
    debug: boolean;

    config: Partial<ConfigSchema>;

    // TODO: make a types for each of these that list the keys explicitly
    // See commits e12715b and 43c5993 for examples of how to do this.
    [chat_indicator_key: `chat-indicator.${string}`]: any;
    [time_control_key: `time_control.${string}`]: any;
    [pm_key: `pm.${string}`]: any;
    [player_notes_key: `player-notes.${string}`]: any;
    [learning_hub_key: `learning-hub.${string}`]: any;
    [moderator_key: `moderator.${string}`]: any;
    [automatch_key: `automatch.${string}`]: any;
    [puzzle_key: `puzzle.${string}`]: any;
    [device_key: `device${string}`]: any;
    [settings_key: `settings.${string}`]: any;
    [paginated_table_key: `paginated-table.${string}`]: any;
    [observed_games_key: `observed-games.${string}`]: any;
    [announcements_key: `announcements.${string}`]: any; // probably should figure out why these are different
    [announcement_key: `announcement.${string}`]: any;
    [challenge_key: `challenge.${string}`]: any;
    [dismissed_key: `dismissed.${string}`]: any;
    [demo: `demo.${string}`]: any;

    "last-visited-since-goals-shown": string;
    "hours-visited-since-goals-shown": number;
    "table-color-default-on": boolean;
    "joseki-url": string;
    "ad-override": boolean;
    "email-banner-dismissed": boolean;
    "active-tournament": Announcement;
    "chat-manager.last-seen": { [channel: string]: number };
}
