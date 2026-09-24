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

export interface WhatsNewNavLink {
    id: number;
    title: string;
}

export interface WhatsNewPollChoice {
    id: string;
    label: string;
}

export type WhatsNewPollQuestionType = "single" | "multiple" | "text" | "scale";

export interface WhatsNewPollQuestion {
    id: string;
    type: WhatsNewPollQuestionType;
    text: string;
    choices?: WhatsNewPollChoice[];
    /** Overridden end labels of a `scale` question; the defaults are "Dislike" and "Like". */
    low_label?: string;
    high_label?: string;
    show_if?: {
        question: string;
        choices: string[];
    };
}

export type WhatsNewPollAnswer = string[] | string | number;

/** Maps a question id to the selected choice ids, the free-text answer, or a 1-5 scale value. */
export type WhatsNewPollAnswers = Record<string, WhatsNewPollAnswer>;

export interface WhatsNewPoll {
    is_open: boolean;
    questions: WhatsNewPollQuestion[];
    /** null for logged-out users. */
    my_answers: WhatsNewPollAnswers | null;
}

export interface WhatsNewPost {
    id: number;
    created_at: string;
    updated_at: string;
    title: string;
    content: string | null;
    reaction_counts: Record<string, number>;
    previous: WhatsNewNavLink | null;
    next: WhatsNewNavLink | null;
    user_reactions: string[];
    poll: WhatsNewPoll | null;
}
