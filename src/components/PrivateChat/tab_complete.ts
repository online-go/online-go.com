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

export interface TabCompleteOptions {
    nicknames: string[] | (() => string[]);
    nickMatch?: RegExp;
    onComplete?: (event: CustomEvent) => void;
}

const defaultOptions: TabCompleteOptions = {
    nicknames: () => player_cache.nicknames,
    nickMatch: /([-_a-z0-9]+)$/i,
};

function getSelection(field: HTMLInputElement | HTMLTextAreaElement) {
    if (field.selectionStart === null || field.selectionEnd === null) {
        return null;
    }
    return {
        start: field.selectionStart,
        end: field.selectionEnd,
        length: field.selectionEnd - field.selectionStart,
        text: field.value.substring(field.selectionStart, field.selectionEnd),
    };
}

function setSelectionRange(
    input: HTMLInputElement | HTMLTextAreaElement,
    selectionStart: number,
    selectionEnd: number,
) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
}

function setCaretToPos(input: HTMLInputElement | HTMLTextAreaElement, pos: number) {
    setSelectionRange(input, pos, pos);
}

function matchName(input: string, nicknames: string[]) {
    const match = input.toLowerCase();
    const matches: string[] = [];
    const length = input.length;
    let letters = "";

    for (const value of nicknames) {
        const components = value.toLowerCase().split(" ");
        for (const component of components) {
            if (component.substr(0, length) === match) {
                matches.push(value);
                break;
            }
        }
        if (value.toLowerCase().substr(0, length) === match) {
            matches.push(value);
        }
    }

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (let i = 0; i < matches[0].length - length; i++) {
            const letter = matches[0].toLowerCase().substr(length + i, 1);
            let allMatch = true;

            for (const value of matches) {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                    allMatch = false;
                    break;
                }
            }

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

function matchFullName(input: string, nicknames: string[]) {
    const matches: string[] = [];

    for (const value of nicknames) {
        const idx = input.lastIndexOf(value);
        if (idx >= 0 && idx === input.length - value.length) {
            matches.push(value);
        }
    }

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        let letters = "";
        const length = matches[0].length;

        for (let i = 0; i < matches[0].length - length; i++) {
            const letter = matches[0].toLowerCase().substr(length + i, 1);
            let allMatch = true;

            for (const value of matches) {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                    allMatch = false;
                    break;
                }
            }

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

export function initTabComplete(
    element: HTMLInputElement | HTMLTextAreaElement,
    options: TabCompleteOptions = defaultOptions,
) {
    const opts = { ...defaultOptions, ...options };
    let lastKey = 0;

    function onKeyDown(e: Event) {
        const ke = e as KeyboardEvent;
        if (ke.key === "Tab") {
            e.preventDefault();
            const input = e.target as HTMLInputElement;
            const val = input.value;
            const sel = getSelection(input);
            let text = "";
            let match: any = "";

            if (sel !== null && !sel.length && sel.start !== null) {
                text = val.substr(0, sel.start);
                const nickMatch = opts.nickMatch || defaultOptions.nickMatch;

                if (nickMatch?.test(text)) {
                    text = text.match(nickMatch)![1];

                    const nicknames =
                        typeof opts.nicknames === "function" ? opts.nicknames() : opts.nicknames;
                    match = matchName(text, nicknames);

                    const customEvent = new CustomEvent("nickname-complete", {
                        detail: { ...match, caret: sel.start },
                        bubbles: true,
                        cancelable: true,
                    });
                    input.dispatchEvent(customEvent);

                    if (match.value && !customEvent.defaultPrevented) {
                        const first = val.substr(0, sel.start - text.length);
                        const last = val.substr(sel.start);
                        const space =
                            match.matches.length > 1 || (last.length && last.substr(0, 1) === " ")
                                ? ""
                                : first.trim().length === 0
                                  ? ": "
                                  : " ";
                        input.value = first + match.value + space + last;
                        setCaretToPos(
                            input,
                            sel.start - text.length + match.value.length + space.length,
                        );
                    }

                    lastKey = 9;
                } else if (/( |: )$/.test(text)) {
                    const space = text.match(/( |: )$/)![1];
                    text = text.substring(0, text.length - space.length);

                    const nicknames =
                        typeof opts.nicknames === "function" ? opts.nicknames() : opts.nicknames;
                    match = matchFullName(text, nicknames);

                    const customEvent = new CustomEvent("nickname-complete", {
                        detail: { ...match, caret: sel.start },
                        bubbles: true,
                        cancelable: true,
                    });
                    input.dispatchEvent(customEvent);

                    if (match.value && !customEvent.defaultPrevented) {
                        const first = val.substr(0, sel.start - match.value.length - space.length);
                        const last = val.substr(sel.start);
                        input.value =
                            first +
                            '@"' +
                            match.value +
                            "/" +
                            (player_cache.lookup_by_username(match.value)?.id ?? 0) +
                            '"' +
                            space +
                            last;
                        setCaretToPos(
                            input,
                            sel.start - match.value.length + match.value.length + space.length,
                        );
                    }

                    lastKey = 9;
                }
            }
        }
    }

    function onFocus() {
        lastKey = 0;
    }

    function onBlur() {
        if (lastKey === 9) {
            element.focus();
        }
    }

    element.addEventListener("keydown", onKeyDown);
    element.addEventListener("focus", onFocus);
    element.addEventListener("blur", onBlur);

    if (opts.onComplete) {
        element.addEventListener("nickname-complete", opts.onComplete as EventListener);
    }

    // Return cleanup function
    return () => {
        element.removeEventListener("keydown", onKeyDown);
        element.removeEventListener("focus", onFocus);
        element.removeEventListener("blur", onBlur);
        if (opts.onComplete) {
            element.removeEventListener("nickname-complete", opts.onComplete as EventListener);
        }
    };
}
