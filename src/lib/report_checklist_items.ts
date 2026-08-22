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

import { _, interpolate, pgettext } from "@/lib/translate";

import type {
    AsyncDataCheckItem,
    AttestationItem,
    ChecklistItem,
    SyncDataCheckItem,
} from "@/lib/report_checklist";

/**
 * The parts of a ReportDescription that produce synthesised checks. Declared
 * structurally rather than imported, so this module has no dependency on the
 * Report component that consumes it.
 */
export interface ChecklistCategory {
    game_id_required?: boolean;
    min_description_length?: number;
}

function gameIdentifiedItem(): SyncDataCheckItem {
    return {
        kind: "data_check",
        sync: true,
        id: "report.game_identified",
        label: pgettext("A report checklist item", "The reported game is identified"),
        blocking: true,
        evaluate: (ctx) =>
            ctx.game_id
                ? { met: true }
                : {
                      met: false,
                      // Kept as _() rather than pgettext(context, ...): a msgctxt makes this
                      // a new gettext entry, orphaning the translations of the identical
                      // string Report.tsx used before this checklist existed.
                      message: _(
                          "Please report the user on the game page so we know where to look.",
                      ),
                  },
    };
}

function descriptionLengthItem(minimum: number): SyncDataCheckItem {
    return {
        kind: "data_check",
        sync: true,
        id: "report.description_length",
        label: pgettext("A report checklist item", "Describe what happened"),
        blocking: false,
        evaluate: (ctx) =>
            ctx.note.length >= minimum
                ? { met: true }
                : {
                      met: false,
                      message: interpolate(
                          pgettext("Context of message", "{{required}} more characters needed"),
                          { required: minimum - ctx.note.length },
                      ),
                  },
    };
}

const escapingGameEnded: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.game_ended",
    label: pgettext("A report checklist item", "The game has ended"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        // The response is fetched as an untyped payload and cast to Gamedata, so a
        // missing field here is a real possibility, not just a type-system fiction.
        // A missing `phase` means we cannot tell whether the game ended, so this must
        // report "unavailable" rather than falling through to "not finished", which
        // would wrongly block the report.
        if (typeof gamedata.phase !== "string") {
            return "unavailable";
        }
        return gamedata.phase === "finished"
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "Shown when someone reports stopped-playing on a game still in progress",
                      `This game has not ended yet, so 'stopped playing' does not apply: the other player might still be thinking.

Please choose a different type of report, if there is a different problem.`,
                  ),
              };
    },
};

const escapingNotResigned: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.not_resigned",
    label: pgettext("A report checklist item", "This player did not resign the game"),
    blocking: true,
    evaluate: async (ctx) => {
        // ctx.reported_user_id is optional. Without it we cannot tell who resigned,
        // so this check cannot be determined at all — "unavailable" says that
        // honestly, rather than reporting a pass we never actually established.
        if (ctx.reported_user_id === undefined) {
            return "unavailable";
        }
        const gamedata = await ctx.fetchGamedata();
        // As above: the payload is an untyped fetch cast to Gamedata, so `outcome`
        // and `winner` may genuinely be missing. Guard each field this check reads
        // rather than trusting the declared type.
        if (typeof gamedata.outcome !== "string" || typeof gamedata.winner !== "number") {
            return "unavailable";
        }
        const accused_resigned =
            gamedata.outcome.includes("Resignation") && gamedata.winner !== ctx.reported_user_id;
        return accused_resigned
            ? {
                  met: false,
                  message: pgettext(
                      "A message when trying to create a report that doesn't make sense",
                      `That player resigned, so 'stopped playing' is not applicable: resigning is normally an acceptable way to finish the game.

Please choose a different type of report, if there is a different problem.`,
                  ),
              }
            : { met: true };
    },
};

const escapingEnoughMoves: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.enough_moves",
    label: pgettext("A report checklist item", "Enough moves were played to judge this"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        // As above: guard the specific field this check reads, rather than relying on
        // a missing `moves` array to throw its way to "unavailable".
        if (!Array.isArray(gamedata.moves)) {
            return "unavailable";
        }
        return gamedata.moves.length >= 2
            ? { met: true }
            : {
                  met: false,
                  message: `${pgettext(
                      "Explains why a stopped-playing report cannot be filed on a game with almost no moves",
                      "There aren't enough moves played in this game to decide whether this player stopped playing.",
                  )}\n\n${pgettext(
                      "A message when the user is trying to report something that we don't want them to report yet",
                      `If the other player leaves the game without playing the first move we will automatically warn them about this.

Please choose a different type of report, if there is a different problem.`,
                  )}`,
              };
    },
};

const escapingWaitedReasonableTime: AttestationItem = {
    kind: "attestation",
    id: "escaping.waited_reasonable_time",
    label: pgettext(
        "A report checklist item the reporter confirms",
        "I waited a reasonable time for this player to play",
    ),
};

const stallingEnoughMoves: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "stalling.enough_moves",
    label: pgettext("A report checklist item", "Enough moves were played to judge this"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        return gamedata.moves.length >= 2
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "A message when the user is trying to report something that we don't want them to report yet",
                      // The blank line below carries 16 trailing spaces that are part of this
                      // gettext msgid — the existing .po translations only match with them
                      // present. Expressing them as `${"                "}` keeps the string
                      // bytes intact while giving the editor nothing to trim on save
                      // (.editorconfig strips real trailing whitespace from *.ts on save).
                      // Do not "simplify" this back to a literal blank line.
                      `There aren't enough moves played in this game to decide if someone is playing stalling moves.
${"                "}
If the other player leaves the game without playing, we will automatically warn them about that.

Please choose a different type of report, if there is a different problem.`,
                  ),
              };
    },
};

/**
 * Per-report-type checklist items. Mirrors REPORT_TYPE_VOTABLE_ACTIONS in the
 * backend's moderation.py: the report type is the key, and everything a type
 * requires is readable in one place.
 *
 * Ordering matters. When several blocking checks fail, the earliest is the one the
 * reporter is shown.
 */
export const REPORT_CHECKLISTS: Record<string, ChecklistItem[]> = {
    escaping: [
        escapingGameEnded,
        escapingNotResigned,
        escapingEnoughMoves,
        escapingWaitedReasonableTime,
    ],
    stalling: [stallingEnoughMoves],
};

/**
 * The single point of access for a report type's checklist. A future source of items
 * — an administrative form, a rule engine — is merged in here and nowhere else.
 */
export function getChecklist(
    report_type: string,
    category: ChecklistCategory | undefined,
): ChecklistItem[] {
    if (!category) {
        return [];
    }

    const items: ChecklistItem[] = [];

    if (category.game_id_required) {
        items.push(gameIdentifiedItem());
    }

    items.push(...(REPORT_CHECKLISTS[report_type] ?? []));

    if (category.min_description_length) {
        items.push(descriptionLengthItem(category.min_description_length));
    }

    return items;
}
