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
    // AttestationItem,
    ChecklistItem,
    SyncDataCheckItem,
} from "@/lib/report_checklist";

const gameIdentifiedItem: SyncDataCheckItem = {
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
                  message: _("Please report the user on the game page so we know where to look."),
              },
};

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

const escapingNotWinner: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.not_winner",
    label: pgettext("A report checklist item", "This player did not win the game"),
    blocking: true,
    evaluate: async (ctx) => {
        // ctx.reported_user_id is optional. Without it we cannot tell who won,
        // so this check cannot be determined at all — "unavailable" says that
        // honestly, rather than reporting a pass we never actually established.
        if (ctx.reported_user_id === undefined) {
            return "unavailable";
        }
        const gamedata = await ctx.fetchGamedata();
        // As above: the payload is an untyped fetch cast to Gamedata, so `winner`
        // and `outcome` may genuinely be missing. Guard the fields this check
        // reads rather than trusting the declared type.
        if (typeof gamedata.winner !== "number" || typeof gamedata.outcome !== "string") {
            return "unavailable";
        }
        // A resignation is judged by who resigned, not who won — that is
        // escaping.not_resigned's job. A reporter whose opponent has stopped
        // playing may reasonably resign to end the game rather than wait out the
        // clock; if that resignation makes the *accused* the winner, this check
        // must not treat it as evidence the accused played on. Only a win by
        // score — the board, or the reporter timing out — means "stopped
        // playing" plainly does not apply.
        const accused_won_without_resignation =
            gamedata.winner === ctx.reported_user_id && !gamedata.outcome.includes("Resignation");
        return accused_won_without_resignation
            ? {
                  met: false,
                  message: pgettext(
                      "A message when trying to create a report that doesn't make sense",
                      `That player won this game on score, so 'stopped playing' does not apply.

Please choose a different type of report, if there is a different problem.`,
                  ),
              }
            : { met: true };
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

/*  We might want a check like this but it needs more thought.
    It's here as an example of an attestation item.

const escapingWaitedReasonableTime: AttestationItem = {
    kind: "attestation",
    id: "escaping.waited_reasonable_time",
    label: pgettext(
        "A report checklist item the reporter confirms",
        "I waited a reasonable time for this player to play",
    ),
};

*/

const stallingEnoughMoves: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "stalling.enough_moves",
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

const stallingKindSelected: SyncDataCheckItem = {
    kind: "data_check",
    sync: true,
    id: "stalling.kind_selected",
    label: pgettext("A report checklist item", "Select how the other player stalled"),
    blocking: false,
    evaluate: (ctx) =>
        ctx.stalling_kind
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "Asks the reporter to pick an option in the stalling report form",
                      "Please select one of the options above.",
                  ),
              },
};

/**
 * The stalling counterpart of descriptionLengthItem: a written explanation is
 * required only when the reporter selected "something else" — every named stall
 * kind already says what happened, so free text is optional there.
 */
const stallingExplanationItem: SyncDataCheckItem = {
    kind: "data_check",
    sync: true,
    id: "stalling.explanation_length",
    label: pgettext("A report checklist item", "Describe what happened"),
    blocking: false,
    evaluate: (ctx) => {
        if (ctx.stalling_kind !== "other") {
            return { met: true };
        }
        const minimum = 20;
        return ctx.note.length >= minimum
            ? { met: true }
            : {
                  met: false,
                  message: interpolate(
                      pgettext("Context of message", "{{required}} more characters needed"),
                      { required: minimum - ctx.note.length },
                  ),
              };
    },
};

/**
 * Per-report-type checklists. Mirrors REPORT_TYPE_VOTABLE_ACTIONS in the backend's
 * moderation.py: the report type is the key, and everything a type requires is
 * readable in one place, in evaluation order.
 *
 * Ordering matters in two ways:
 *
 * - When several blocking checks fail, the earliest is the one the reporter is shown.
 * - `report.game_identified` must be first wherever a type has any async data check.
 *   It is the synchronous blocker that `evaluateAsyncChecks` (report_checklist.ts)
 *   checks before running anything async, so a failing game-identified check stops
 *   the game-data fetch from firing at all. Out of order, an async check would run
 *   against a game that does not exist.
 *
 * `thrown_game`, `sandbagging_assessment` and `assess_ai_play` are `not_reportable` in
 * `report_categories` (Report.tsx) — they are produced by server-side conversion or by
 * the AI detector, never chosen from the report dropdown, so these lists are never
 * evaluated today. They are listed anyway so this table stays a complete statement of
 * what each type requires, and so that making one reportable in the future does not
 * silently leave it with no gate.
 *
 * `warning` and `troll` are moderator-only paths with no report-type requirements of
 * their own — `warning` has its own note-length gate in Report.tsx's `canWarn`, and
 * `troll` has none — so neither has an entry; `getChecklist` returns `[]` for both.
 */
export const REPORT_CHECKLISTS: Record<string, ChecklistItem[]> = {
    escaping: [
        gameIdentifiedItem,
        escapingGameEnded,
        escapingNotWinner,
        escapingNotResigned,
        escapingEnoughMoves,
        // escapingWaitedReasonableTime,
    ],
    stalling: [
        gameIdentifiedItem,
        stallingEnoughMoves,
        stallingKindSelected,
        stallingExplanationItem,
    ],
    score_cheating: [gameIdentifiedItem],
    sandbagging: [gameIdentifiedItem],
    ai_use: [gameIdentifiedItem, descriptionLengthItem(20)],
    inappropriate_content: [descriptionLengthItem(20)],
    harassment: [descriptionLengthItem(20)],
    other: [descriptionLengthItem(20)],
    malicious_report: [descriptionLengthItem(1)],
    thrown_game: [gameIdentifiedItem],
    sandbagging_assessment: [gameIdentifiedItem],
    assess_ai_play: [gameIdentifiedItem],
};

/**
 * The single point of access for a report type's checklist. A future source of items
 * — an administrative form, a rule engine — is merged in here and nowhere else.
 */
export function getChecklist(report_type: string): ChecklistItem[] {
    return REPORT_CHECKLISTS[report_type] ?? [];
}
