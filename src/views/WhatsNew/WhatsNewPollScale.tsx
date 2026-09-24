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
import { interpolate, pgettext } from "@/lib/translate";
import "./WhatsNewPollScale.css";

const SCALE_MIN = 1;
const SCALE_MAX = 5;
const SCALE_MIDDLE = 3;
const VALUE_KEYS = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "PageUp",
    "PageDown",
]);

interface WhatsNewPollScaleProps {
    name: string;
    /** The saved answer, or null when the question is unanswered. */
    value: number | null;
    disabled: boolean;
    lowLabel?: string;
    highLabel?: string;
    onChange: (value: number | null) => void;
}

/**
 * A 1-5 dislike/like slider. An unanswered slider shows no thumb. The value is
 * reported when the pointer or key is released, not on every step of a drag,
 * and releasing on an unanswered slider answers it even at the middle value.
 */
export function WhatsNewPollScale({
    name,
    value,
    disabled,
    lowLabel,
    highLabel,
    onChange,
}: WhatsNewPollScaleProps): React.ReactElement {
    const [draft, setDraft] = React.useState<number | null>(null);
    const shown = draft ?? value;

    function commit(input: HTMLInputElement): void {
        const next = Number(input.value);
        setDraft(null);
        if (next !== value) {
            onChange(next);
        }
    }

    const low = lowLabel || pgettext("Low end of a 1 to 5 poll slider", "Dislike");
    const high = highLabel || pgettext("High end of a 1 to 5 poll slider", "Like");

    return (
        <div className={"WhatsNewPollScale" + (shown === null ? " unanswered" : "")}>
            <input
                type="range"
                name={name}
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={1}
                value={shown ?? SCALE_MIDDLE}
                disabled={disabled}
                aria-valuetext={
                    shown === null
                        ? pgettext(
                              "Screen reader text for an unanswered poll slider",
                              "Not answered",
                          )
                        : interpolate(
                              pgettext(
                                  "Screen reader text for a poll slider value",
                                  "{{value}} of 5",
                              ),
                              { value: shown },
                          )
                }
                onChange={(ev) => setDraft(Number(ev.target.value))}
                onPointerUp={(ev) => commit(ev.currentTarget)}
                onKeyUp={(ev) => {
                    if (VALUE_KEYS.has(ev.key)) {
                        commit(ev.currentTarget);
                    }
                }}
                onBlur={(ev) => {
                    if (draft !== null) {
                        commit(ev.currentTarget);
                    }
                }}
            />
            <div className="scale-labels">
                <span>{low}</span>
                <span>{high}</span>
            </div>
            {value !== null && !disabled && (
                <button type="button" className="scale-clear" onClick={() => onChange(null)}>
                    {pgettext("Button that removes the answer to a poll slider", "Clear")}
                </button>
            )}
        </div>
    );
}
