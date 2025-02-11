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

/**
 * This is the schema for the data functions (e.g. get(), set()).  It defines
 * all the possible keys as well as the associated value types.
 */

import { GroupList, ActiveTournamentList, RuleSet } from "./types";
import { Announcement } from "@/components/Announcements";
import { ValidSound, ValidSoundGroup } from "./sfx";
import { defaults as defaultPreferences, ValidPreference } from "./preferences";
import { TimeControl, TimeControlTypes } from "@/components/TimeControl";
import TimeControlSpeed = TimeControlTypes.TimeControlSpeed;
import TimeControlSystem = TimeControlTypes.TimeControlSystem;
import { JosekiFilter } from "@/components/JosekiVariationFilter";
import { Challenge } from "@/lib/challenge_utils";

interface CachedSchema {
    groups: GroupList;
    active_tournaments: ActiveTournamentList;

    // TODO: examine these endpoints and write interfaces for these.
    config: ConfigSchema /* /login */;
    ladders: rest_api.me.Ladder[];
    challenge_list: any /* /me/challenges */;
    blocks: any /* /me/blocks */;
    friends: any /* ui/friends */;
    group_invitations: any /* me/groups/invitations */;
}

export interface DismissableMessagesSchema {
    [key: string]: {
        language: string;
        message: string;
        timestamp: number;
    };
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
    dismissable_messages: DismissableMessagesSchema;
    payment_problems?: PaymentProblems;
}

interface PaymentMethodDetails {
    type: string; // card, sepa, etc...
    card?: {
        brand: string; // visa, mastercard, etc...
        last4: string; // last 4 digits of card number
        exp_month: number;
        exp_year: number;
    };
}

export type PaymentProblem =
    | {
          type: "payment_failed";
          payment_method?: PaymentMethodDetails;
          failure_code: string;
          created: string;
      }
    | {
          type: "expiring_card";
          payment_method?: PaymentMethodDetails;
          expiration_date: {
              year: number;
              month: number;
          };
      };
type PaymentProblems = PaymentProblem[];

interface ChatSchema {
    active_channel: string;
    joined: { [channel: string]: true | 1 };
    parted: { [channel: string]: 1 };
    "show-games": boolean;
    "split-sizes": number[];
}

/*
export interface CustomGobanThemeSchema {
    black: string;
    white: string;
    board: string;
    line: string;
    url: string; // this is a board image url
    black_stone_url: string;
    white_stone_url: string;
}
*/

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

type TimeControlSchema = {
    speed: TimeControlSpeed;
    system: TimeControlSystem;
} & {
    [speed_system_key in `${TimeControlSpeed}.${TimeControlSystem}`]: TimeControl;
};

interface ChatIndicatorSchema {
    "chat-subscriptions": { [channel: string]: { [option: string]: boolean } };
    "collapse-chat-group": boolean;
}

interface PMSchema {
    [read_key: `read-${number}`]: string;
    [close_key: `close-${number}`]: string;
}

type ObservedGamesSchema = {
    [namespace_preference_key in `${string}.${ValidPreference}`]: string;
};

interface AnnouncementsSchema {
    cleared: { [id: number]: number };
    hard_cleared: { [id: number]: number };
}

type ChallengeSchema = {
    bot: number;
    speed: TimeControlSpeed;
    restrict_rank: boolean;
} & {
    [speed in `challenge.${TimeControlSpeed}`]: rest_api.ChallengeDetails;
};

interface DemoSettings {
    name: string;
    rules: RuleSet;
    width: number;
    height: number;
    black_name: string;
    black_ranking: number;
    white_name: string;
    white_ranking: number;
    private: boolean;
    komi_auto: rest_api.KomiOption;
    komi?: number;
}

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

/**
 * The keys and corresponding types for the functions in data.ts
 *
 * ADDING NEW KEYS: There are a couple ways to add new keys.  One way is to add
 * keys directly to this interface.  The other is to add or modify a sub-schema
 * and prefix it using the Prefixed type.  If typing is not desired (for instance,
 * during prototyping), one can use a key that starts with an underscore.
 */
export interface DataSchema
    extends Prefixed<CachedSchema, "cached">,
        Prefixed<ConfigSchema, "config">,
        Prefixed<ChatSchema, "chat">,
        Prefixed<SoundSchema, "sound">,
        Prefixed<PreferencesSchema, "preferences">,
        //Prefixed<CustomGobanThemeSchema, "custom">,
        Prefixed<ChatIndicatorSchema, "chat-indicator">,
        Prefixed<TimeControlSchema, "time_control">,
        Prefixed<PMSchema, "pm">,
        Prefixed<ObservedGamesSchema, "observed-games">,
        Prefixed<AnnouncementsSchema, "announcements">,
        Prefixed<ChallengeSchema, "challenge"> {
    user: rest_api.UserConfig;
    bid: string; // deprecated in favor of device_id
    device_id: string;
    theme: string;
    debug: boolean;

    config: Partial<ConfigSchema>;

    "appeals.jwt": string;
    "appeals.banned_user_id": number;
    "appeals.ban-reason": string;
    "quick-chat.phrases": string[];
    "last-visited-since-goals-shown": string;
    "hours-visited-since-goals-shown": number;
    "table-color-default-on": boolean;
    "oje-url": string;
    "oje-variation-filter": JosekiFilter;
    "ad-override": boolean;
    "email-banner-dismissed": boolean;
    "payment-problem-banner-dismissed-timestamp": number;
    "active-tournament": Announcement;
    "free-trial-saved-for-later-timestamp": number;
    "free-trial-survey-submitted-timestamp": number;
    "price-increase-message-dismissed-timestamp": number;

    "chat-manager.last-seen": { [channel: string]: number };
    "device.uuid": string;
    "settings.page-selected": string;
    "announcement.last-type": string;
    "announcement.last-duration": number;
    "demo.settings": DemoSettings;

    "preferred-game-settings": rest_api.ChallengeDetails[];

    "debug-dynamic-help": boolean;
    "help-system-enabled": boolean;
    "rdh-system-state": string;
    "ignored-reports": { [report_id: number]: number /* id -> expiration */ };
    "reported-games": number[];
    "ui-state.show_incident_list": boolean;

    // A challenge that the user accepted, but we didn't tell the server yet, because
    // we are busy getting them logged in first.
    pending_accepted_challenge: Challenge;

    // State tracking if we are processing a registration during challenge-link acceptance
    // We need the Challenge info in this case, separately from pending_accepted_challenge.
    challenge_link_registration: Challenge;

    // An online-league match that the user wants to start, but we need to get them logged in first
    pending_league_match: rest_api.online_league.MatchStatus & { side?: string; key?: string };

    [player_notes_key: `player-notes.${number}.${number}`]: string;
    [learning_hub_key: `learning-hub.${string}`]: { [page_number: number]: true };
    [moderator_join_game_publicly_key: `moderator.join-game-publicly.${string}`]: boolean;
    [puzzle_last_visited_key: `puzzle.collection.${number}.last-visited`]: number;
    [paginated_table_page_size_key: `paginated-table.${string}.page_size`]: number;
    [dismissed_key: `dismissed.${string}`]: boolean;
    [experiments_key: `experiments.${string}`]: string;

    // Using underscore prefixed keys suppresses type errors. This may be
    // be desired when prototyping a new feature and the structure of the data
    // is not known.
    [untyped_key: `_${string}`]: any;
}
