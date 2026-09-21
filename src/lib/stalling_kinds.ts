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

import { pgettext } from "@/lib/translate";

/**
 * The ways a player can stall a game, as offered to the reporter filing a
 * stalling report. "other" is special-cased in the stalling checklist
 * (report_checklist_items.ts): it is the one kind that requires a written
 * explanation.
 */
export type StallingKind =
    | "pointless_moves"
    | "self_filling"
    | "rejecting_score"
    | "autoscore_spam"
    | "undo_spam"
    | "other";

export interface StallingKindOption {
    kind: StallingKind;
    /** Shown to the reporter in their own language. */
    label: string;
    /**
     * Written into reporter_note in English regardless of the reporter's locale,
     * so moderators and CMs always see consistent text.
     */
    canonical: string;
}

export const STALLING_KIND_OPTIONS: StallingKindOption[] = [
    {
        kind: "pointless_moves",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Repeatedly played moves that serve no purpose",
        ),
        canonical: "repeatedly played moves that serve no purpose",
    },
    {
        kind: "self_filling",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Infilling their own territory for no reason",
        ),
        canonical: "infilling their own territory for no reason",
    },
    {
        kind: "rejecting_score",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Repeatedly rejecting correct score",
        ),
        canonical: "repeatedly rejecting correct score",
    },
    {
        kind: "autoscore_spam",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Clicking autoscore repeatedly",
        ),
        canonical: "clicking autoscore repeatedly",
    },
    {
        kind: "undo_spam",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Spamming undo",
        ),
        canonical: "spamming undo",
    },
    {
        kind: "other",
        label: pgettext(
            "A way of stalling a game, offered when filing a stalling report",
            "Something else (please explain)",
        ),
        canonical: "something else",
    },
];

/**
 * Builds the reporter_note text for a stalling report: the selected kind's
 * canonical English line, followed by the reporter's free text when there is any.
 */
export function composeStallingNote(kind: StallingKind, note: string): string {
    const canonical = STALLING_KIND_OPTIONS.find((o) => o.kind === kind)?.canonical ?? kind;
    const line = `Stalling: ${canonical}`;
    const trimmed = note.trim();
    return trimmed ? `${line}\n\n${trimmed}` : line;
}
