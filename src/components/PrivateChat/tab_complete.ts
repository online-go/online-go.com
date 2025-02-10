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

import * as player_cache from "@/lib/player_cache";

interface TabCompleteOptions {
    nick_match: RegExp;
    nicknames: string[] | (() => string[]);
    onComplete?: (event: TabCompleteEvent) => void;
}

interface TabCompleteEvent {
    value: string;
    matches: string[];
    caret: number;
    defaultPrevented: boolean;
    preventDefault: () => void;
}

interface TabCompleteResult {
    value: string;
    matches: string[];
}

function getSelection(field: HTMLTextAreaElement | HTMLInputElement) {
    const start = field.selectionStart ?? 0;
    const end = field.selectionEnd ?? 0;
    return {
        start,
        end,
        length: end - start,
        text: field.value.substring(start, end),
    };
}

function setSelectionRange(
    input: HTMLTextAreaElement | HTMLInputElement,
    selectionStart: number,
    selectionEnd: number,
) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
}

function setCaretToPos(input: HTMLTextAreaElement | HTMLInputElement, pos: number) {
    setSelectionRange(input, pos, pos);
}

function matchName(input: string, nicknames: string[]): TabCompleteResult {
    const match = input.toLowerCase();
    const matches: string[] = [];
    const length = input.length;
    let letters = "";

    for (const value of nicknames) {
        const components = value.toLowerCase().split(" ");
        for (const component of components) {
            if (component.substring(0, length) === match) {
                matches.push(value);
                break;
            }
        }
        if (value.toLowerCase().substring(0, length) === match) {
            matches.push(value);
        }
    }

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (let i = 0; i < matches[0].length - length; i++) {
            const letter = matches[0].toLowerCase().substring(length + i, length + i + 1);
            const allMatch = matches.every(
                (value) => value.toLowerCase().substring(length + i, length + i + 1) === letter,
            );
            if (allMatch) {
                letters += letter;
            } else {
                break;
            }
        }
        return { value: input + letters, matches: matches };
    }
    return { value: "", matches: matches };
}

function matchFullName(input: string, nicknames: string[]): TabCompleteResult {
    const matches: string[] = [];
    let letters = "";

    for (const value of nicknames) {
        const idx = input.lastIndexOf(value);
        if (idx >= 0 && idx === input.length - value.length) {
            matches.push(value);
        }
    }

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (let i = 0; i < matches[0].length - input.length; i++) {
            const letter = matches[0]
                .toLowerCase()
                .substring(input.length + i, input.length + i + 1);
            const allMatch = matches.every(
                (value) =>
                    value.toLowerCase().substring(input.length + i, input.length + i + 1) ===
                    letter,
            );
            if (allMatch) {
                letters += letter;
            } else {
                break;
            }
        }
        return { value: input + letters, matches: matches };
    }
    return { value: "", matches: matches };
}

export function nicknameTabComplete(
    element: HTMLTextAreaElement | HTMLInputElement,
    options: TabCompleteOptions,
) {
    const defaultOptions: TabCompleteOptions = {
        nicknames: () => player_cache.nicknames,
        nick_match: /([-_a-z0-9]+)$/i,
    };

    options = { ...defaultOptions, ...options };

    const handleKeyDown = (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Tab") {
            ke.preventDefault();

            const val = element.value;
            const sel = getSelection(element);
            let text = "";
            let match: TabCompleteResult | null = null;

            if (sel !== null && !sel.length && sel.start !== null) {
                text = val.substring(0, sel.start);
                if (options.nick_match.test(text)) {
                    text = text.match(options.nick_match)![1];

                    match = matchName(
                        text,
                        typeof options.nicknames === "function"
                            ? options.nicknames()
                            : options.nicknames,
                    );

                    const completeEvent: TabCompleteEvent = {
                        ...match,
                        caret: sel.start,
                        defaultPrevented: false,
                        preventDefault: function () {
                            this.defaultPrevented = true;
                        },
                    };

                    options.onComplete?.(completeEvent);

                    if (match.value && !completeEvent.defaultPrevented) {
                        const first = val.substring(0, sel.start - text.length);
                        const last = val.substring(sel.start);
                        const space =
                            match.matches.length > 1 ||
                            (last.length && last.substring(0, 1) === " ")
                                ? ""
                                : first.trim().length === 0
                                  ? ": "
                                  : " ";
                        element.value = first + match.value + space + last;
                        setCaretToPos(
                            element,
                            sel.start - text.length + match.value.length + space.length,
                        );
                    }
                } else if (/( |: )$/.test(text)) {
                    const space = text.match(/( |: )$/)![1];
                    text = text.substring(0, text.length - space.length);
                    match = matchFullName(
                        text,
                        typeof options.nicknames === "function"
                            ? options.nicknames()
                            : options.nicknames,
                    );

                    const completeEvent: TabCompleteEvent = {
                        ...match,
                        caret: sel.start,
                        defaultPrevented: false,
                        preventDefault: function () {
                            this.defaultPrevented = true;
                        },
                    };

                    options.onComplete?.(completeEvent);

                    if (match.value && !completeEvent.defaultPrevented) {
                        const first = val.substring(
                            0,
                            sel.start - match.value.length - space.length,
                        );
                        const last = val.substring(sel.start);
                        element.value =
                            first +
                            '@"' +
                            match.value +
                            "/" +
                            (player_cache.lookup_by_username(match.value)?.id ?? 0) +
                            '"' +
                            space +
                            last;
                        setCaretToPos(
                            element,
                            sel.start - match.value.length + match.value.length + space.length,
                        );
                    }
                }
            }
        }
    };

    element.addEventListener("keydown", handleKeyDown);

    return {
        destroy: () => {
            element.removeEventListener("keydown", handleKeyDown);
        },
    };
}
