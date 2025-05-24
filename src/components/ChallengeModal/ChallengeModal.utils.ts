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

import * as data from "@/lib/data";
import { _, pgettext, interpolate } from "@/lib/translate";

import { rulesText } from "@/lib/misc";
import { shortShortTimeControl, timeControlSystemText } from "@/components/TimeControl";
import {
    ChallengeDetails,
    DemoSettings,
    RejectionDetails,
} from "@/components/ChallengeModal/ChallengeModal.types";
import { rankSelectorIndexToText } from "@/lib/rank_utils";
import { RuleSet } from "@/lib/types";

export function challenge_text_description(challenge: ChallengeDetails) {
    const c = challenge;
    const g = "game" in challenge ? challenge.game : challenge;
    let challenge_description = g.ranked ? _("Ranked") : _("Unranked");

    if (g.rengo) {
        challenge_description +=
            " " + (g.rengo_casual_mode ? _("casual rengo") : _("strict rengo"));
        if (c.rengo_auto_start > 0) {
            challenge_description +=
                ", " +
                interpolate(_("auto-starting at {{auto_start}} players"), {
                    auto_start: c.rengo_auto_start,
                });
        }
    }

    challenge_description +=
        ", " + g.width + "x" + g.height + ", " + interpolate(_("%s rules"), [rulesText(g.rules)]);

    const time_control =
        typeof g.time_control !== "object" && "time_control_parameters" in g
            ? g.time_control_parameters
            : g.time_control;

    if (typeof time_control === "object") {
        if (time_control.system !== "none") {
            // This is gross and still needs refactoring, but preserves the old behavior
            const time_control_system = time_control.system;
            challenge_description +=
                ", " +
                interpolate(_("%s clock: %s"), [
                    timeControlSystemText(time_control_system).toLocaleLowerCase(),
                    shortShortTimeControl(time_control),
                ]);
        } else {
            challenge_description += ", " + _("no time limits");
        }

        if (time_control.pause_on_weekends) {
            challenge_description += ", " + _("pause on weekends");
        }
    }

    challenge_description +=
        ", " +
        interpolate(_("%s handicap"), [g.handicap < 0 ? _("auto") : g.handicap]) +
        (g?.komi_auto !== "custom" || g.komi == null || typeof g.komi === "object"
            ? ""
            : ", " + interpolate(_("{{komi}} komi"), { komi: g.komi })) +
        (g.disable_analysis ? ", " + _("analysis disabled") : "");

    // (In some places we use +/-1000 to represent "no rank limit)"

    if (
        c.min_ranking !== undefined &&
        c.min_ranking > 0 &&
        c.max_ranking !== undefined &&
        c.max_ranking < 1000
    ) {
        challenge_description +=
            ", " +
            interpolate(_("ranks {{min}} to {{max}}"), {
                min: rankSelectorIndexToText(c.min_ranking),
                max: rankSelectorIndexToText(c.max_ranking),
            });
    }

    if (c.challenger_color !== "automatic") {
        let your_color = "";

        const challenger_id = (c as any)?.challenger?.id || (c as any)?.user?.id;
        if (challenger_id && challenger_id !== data.get("user")?.id) {
            if (c.challenger_color === "black") {
                your_color = _("white");
            } else if (c.challenger_color === "white") {
                your_color = _("black");
            } else {
                your_color = _(c.challenger_color);
            }
        } else {
            your_color = _(c.challenger_color);
        }

        challenge_description +=
            ", " + interpolate(pgettext("color", "you play as %s"), [your_color]);
    }

    return challenge_description;
}

/* This function provides translations for rejection reasons coming gtp2ogs bot interface scripts. */
export function rejectionDetailsToMessage(details: RejectionDetails): string | undefined {
    switch (details.rejection_code) {
        case "blacklisted":
            return pgettext(
                "The user has been blocked by the operator of the bot from playing against the bot.",
                "The operator of this bot will not let you play against it.",
            );

        case "board_size_not_square":
            return _("This bot only plays on square boards");

        case "board_size_not_allowed":
            return _("The selected board size is not supported by this bot");

        case "handicap_not_allowed":
            return _("Handicap games are not allowed against this bot");

        case "unranked_not_allowed":
            return _("Unranked games are not allowed against this bot");

        case "ranked_not_allowed":
            return _("Ranked games are not allowed against this bot");

        case "blitz_not_allowed":
            return _("Blitz games are not allowed against this bot");

        case "too_many_blitz_games":
            return _(
                "Too many blitz games are being played by this bot right now, please try again later.",
            );

        case "live_not_allowed":
            return _("Live games are not allowed against this bot");

        case "too_many_live_games":
            return _(
                "Too many live games are being played by this bot right now, please try again later.",
            );

        case "correspondence_not_allowed":
            return _("Correspondence games are not allowed against this bot");

        case "too_many_correspondence_games":
            return _(
                "Too many correspondence games are being played by this bot right now, please try again later.",
            );

        case "time_control_system_not_allowed":
            return _("The provided time control system is not supported by this bot");

        case "time_increment_out_of_range":
            return _("The time increment is out of the acceptable range allowed by this bot");

        case "period_time_out_of_range":
            return _("The period time is out of the acceptable range allowed by this bot");

        case "periods_out_of_range":
            return _("The number of periods is out of the acceptable range allowed by this bot");

        case "main_time_out_of_range":
            return _("The main time is out of the acceptable range allowed by this bot");

        case "max_time_out_of_range":
            return _("The max time is out of the acceptable range allowed by this bot");

        case "per_move_time_out_of_range":
            return _("The per move time is out the acceptable range allowed by this bot");

        case "player_rank_out_of_range":
            return _("Your rank is too high or low to play against this bot");

        case "not_accepting_new_challenges":
            return _("This bot is not accepting new games at this time");

        case "too_many_games_for_player":
            return _(
                "You are already playing against this bot, please end your other game before starting a new one",
            );

        case "komi_out_of_range":
            return _("Komi is out of the acceptable range allowed by this bot");

        default:
            return undefined;
    }
}

// For legacy reasons, handicap and komi can have a string value
// when these challenge details come from local storage.
export function sanitizeChallengeDetails<T extends ChallengeDetails>(challengeDetails: T): T {
    return {
        ...challengeDetails,
        game: {
            ...challengeDetails.game,
            handicap: Number(challengeDetails.game.handicap),
            ...(challengeDetails.game.komi !== undefined && {
                komi: Number(challengeDetails.game.komi),
            }),
        },
    };
}

// For legacy reasons, komi can have a string value
// when these challenge details come from local storage.
export function sanitizeDemoSettings(
    settings: ReturnType<typeof data.get<"demo.settings">>,
): DemoSettings {
    return { ...settings, ...(settings.komi !== undefined && { komi: Number(settings.komi) }) };
}

export function getPreferredSettings(): ChallengeDetails[] {
    return data.get("preferred-game-settings", []).map(sanitizeChallengeDetails);
}

export function getDefaultKomi(rules: RuleSet, has_handicap: boolean): number {
    switch (rules) {
        case "japanese":
        case "korean":
            return has_handicap ? 0.5 : 6.5;
        case "chinese":
        case "aga":
        case "ing":
            return has_handicap ? 0.5 : 7.5;
        case "nz":
            return has_handicap ? 0 : 7;
        default:
            return 0;
    }
}

export function isKomiOption(v: string): v is rest_api.KomiOption {
    return v === "custom" || v === "automatic";
}

export function parseNumberInput(input: string): number | null {
    const num = Number(input);
    return input === "" || !Number.isFinite(num) ? null : num;
}

export function isRuleSet(v: string): v is RuleSet {
    return ["japanese", "chinese", "aga", "korean", "nz", "ing"].includes(v);
}

export function isColorSelectionOption(v: string): v is rest_api.ColorSelectionOptions {
    return ["black", "white", "automatic", "random"].includes(v);
}
