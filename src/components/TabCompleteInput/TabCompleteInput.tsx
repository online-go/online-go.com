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
import * as player_cache from "@/lib/player_cache";

interface TabCompleteInputProperties extends React.HTMLProps<HTMLInputElement> {
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    className?: string;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface MatchResult {
    value: string;
    matches: string[];
}

function matchName(input: string, nicknames: string[]): MatchResult {
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
        return { value: matches[0], matches };
    } else if (matches.length > 1) {
        for (let i = 0; i < matches[0].length - length; i++) {
            const letter = matches[0].toLowerCase().substr(length + i, 1);
            const allMatch = matches.every(
                (value) => value.toLowerCase().substr(length + i, 1) === letter,
            );
            if (allMatch) {
                letters += letter;
            } else {
                break;
            }
        }
        return { value: input + letters, matches };
    }
    return { value: "", matches };
}

function matchFullName(input: string, nicknames: string[]): MatchResult {
    const matches: string[] = [];
    let letters = "";

    for (const value of nicknames) {
        const idx = input.lastIndexOf(value);
        if (idx >= 0 && idx === input.length - value.length) {
            matches.push(value);
        }
    }

    if (matches.length === 1) {
        return { value: matches[0], matches };
    } else if (matches.length > 1) {
        const length = matches[0].length;
        for (let i = 0; i < matches[0].length - length; i++) {
            const letter = matches[0].toLowerCase().substr(length + i, 1);
            const allMatch = matches.every(
                (value) => value.toLowerCase().substr(length + i, 1) === letter,
            );
            if (allMatch) {
                letters += letter;
            } else {
                break;
            }
        }
        return { value: input + letters, matches };
    }
    return { value: "", matches };
}

function setCaretPosition(input: HTMLInputElement, position: number) {
    input.setSelectionRange(position, position);
}

export const TabCompleteInput = React.forwardRef<HTMLInputElement, TabCompleteInputProperties>(
    (props: TabCompleteInputProperties, ref): React.ReactElement => {
        const defaultRef = React.useRef<HTMLInputElement>(null);
        const inputRef = (ref as React.RefObject<HTMLInputElement>) || defaultRef;
        const [lastKey, setLastKey] = React.useState<number>(0);

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
                e.preventDefault();
                const input = inputRef.current;
                if (!input) {
                    return;
                }

                const value = input.value;
                const start = input.selectionStart || 0;
                const text = value.substr(0, start);
                const nickMatch = /([-_a-z0-9]+)$/i;

                if (nickMatch.test(text)) {
                    const match = text.match(nickMatch);
                    if (!match) {
                        return;
                    }

                    const matchResult = matchName(match[1], player_cache.nicknames);
                    if (matchResult.value) {
                        const first = value.substr(0, start - match[1].length);
                        const last = value.substr(start);
                        const space =
                            matchResult.matches.length > 1 || (last.length && last[0] === " ")
                                ? ""
                                : first.trim().length === 0
                                  ? ": "
                                  : " ";

                        const newValue = first + matchResult.value + space + last;
                        const newPosition =
                            start - match[1].length + matchResult.value.length + space.length;

                        input.value = newValue;
                        setCaretPosition(input, newPosition);
                        props.onChange?.({ target: input } as React.ChangeEvent<HTMLInputElement>);
                    }
                } else if (/( |: )$/.test(text)) {
                    const spaceMatch = text.match(/( |: )$/);
                    if (!spaceMatch) {
                        return;
                    }

                    const space = spaceMatch[1];
                    const textWithoutSpace = text.substring(0, text.length - space.length);
                    const matchResult = matchFullName(textWithoutSpace, player_cache.nicknames);

                    if (matchResult.value) {
                        const first = value.substr(
                            0,
                            start - matchResult.value.length - space.length,
                        );
                        const last = value.substr(start);
                        const playerId =
                            player_cache.lookup_by_username(matchResult.value)?.id ?? 0;

                        const newValue =
                            first + '@"' + matchResult.value + "/" + playerId + '"' + space + last;
                        const newPosition =
                            start -
                            matchResult.value.length +
                            matchResult.value.length +
                            space.length;

                        input.value = newValue;
                        setCaretPosition(input, newPosition);
                        props.onChange?.({ target: input } as React.ChangeEvent<HTMLInputElement>);
                    }
                }

                setLastKey(9);
            }
            props.onKeyPress?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setLastKey(0);
            props.onFocus?.(e);
        };

        const handleBlur = () => {
            if (lastKey === 9) {
                inputRef.current?.focus();
            }
        };

        return (
            <input
                ref={inputRef}
                enterKeyHint="send"
                {...props}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        );
    },
);
