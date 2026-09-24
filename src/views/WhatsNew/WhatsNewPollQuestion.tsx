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
import type { WhatsNewPollQuestion as WhatsNewPollQuestionData } from "./types";
import "./WhatsNewPollQuestion.css";

export const POLL_TEXT_MAX_LENGTH = 2000;

interface WhatsNewPollQuestionProps {
    question: WhatsNewPollQuestionData;
    value: string[] | string | undefined;
    disabled: boolean;
    onChoicesChange: (questionId: string, choices: string[]) => void;
    onTextChange: (questionId: string, text: string) => void;
    onTextBlur: () => void;
}

export function WhatsNewPollQuestion({
    question,
    value,
    disabled,
    onChoicesChange,
    onTextChange,
    onTextBlur,
}: WhatsNewPollQuestionProps): React.ReactElement {
    const inputName = `whats-new-poll-${question.id}`;
    const selected = Array.isArray(value) ? value : [];

    return (
        <fieldset className="WhatsNewPollQuestion" disabled={disabled}>
            <legend className="question-text">{question.text}</legend>

            {question.type === "text" ? (
                <textarea
                    className="question-textarea"
                    name={inputName}
                    value={typeof value === "string" ? value : ""}
                    maxLength={POLL_TEXT_MAX_LENGTH}
                    rows={3}
                    onChange={(ev) =>
                        onTextChange(question.id, ev.target.value.slice(0, POLL_TEXT_MAX_LENGTH))
                    }
                    onBlur={onTextBlur}
                />
            ) : (
                <div className="question-choices">
                    {(question.choices ?? []).map((choice) => {
                        const checked = selected.includes(choice.id);
                        return (
                            <label key={choice.id} className="question-choice">
                                {question.type === "single" ? (
                                    <input
                                        type="radio"
                                        name={inputName}
                                        checked={checked}
                                        onChange={() => onChoicesChange(question.id, [choice.id])}
                                        onClick={() => {
                                            // A radio does not fire change when clicked again, so
                                            // clearing the selected choice is handled here.
                                            if (checked) {
                                                onChoicesChange(question.id, []);
                                            }
                                        }}
                                    />
                                ) : (
                                    <input
                                        type="checkbox"
                                        name={inputName}
                                        checked={checked}
                                        onChange={() =>
                                            onChoicesChange(
                                                question.id,
                                                checked
                                                    ? selected.filter((id) => id !== choice.id)
                                                    : [...selected, choice.id],
                                            )
                                        }
                                    />
                                )}
                                <span className="question-choice-label">{choice.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </fieldset>
    );
}
