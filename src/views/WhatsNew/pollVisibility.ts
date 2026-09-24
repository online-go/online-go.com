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

import type { WhatsNewPollAnswers, WhatsNewPollQuestion } from "./types";

/**
 * Returns the questions a respondent can see, in display order.
 *
 * A question is visible when it has no `show_if`, or when the question that
 * `show_if` refers to is visible and its answer contains at least one of the
 * listed choices. Conditions can refer only to earlier questions, so one pass
 * in list order is enough.
 */
export function visiblePollQuestions(
    questions: WhatsNewPollQuestion[],
    answers: WhatsNewPollAnswers,
): WhatsNewPollQuestion[] {
    const visibleIds = new Set<string>();
    const result: WhatsNewPollQuestion[] = [];

    for (const question of questions) {
        const condition = question.show_if;
        let visible = true;
        if (condition) {
            const answer = answers[condition.question];
            visible =
                visibleIds.has(condition.question) &&
                Array.isArray(answer) &&
                answer.some((choice) => condition.choices.includes(choice));
        }
        if (visible) {
            visibleIds.add(question.id);
            result.push(question);
        }
    }

    return result;
}
