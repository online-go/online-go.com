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
import "./LayoutChoicePicker.css";

export interface LayoutChoice<T> {
    value: T;
    label: string;
    /** Decorative drawing of the choice. The label names the choice, so the
     *  drawing must be hidden from assistive technology. */
    illustration: React.ReactNode;
}

interface LayoutChoicePickerProps<T> {
    title: string;
    value: T;
    /** Two or more choices, in display order. */
    options: readonly [LayoutChoice<T>, LayoutChoice<T>, ...LayoutChoice<T>[]];
    onChange: (value: T) => void;
    /** `compact` fits the cards side by side in the in-game Settings
     *  popover; `large` is for the Settings page. */
    size?: "compact" | "large";
    /** Hide the title visually, for callers that show it themselves (for
     *  example, a `PreferenceLine` title next to the cards). The title
     *  stays in the document and keeps naming the radio group for
     *  assistive technology. */
    hideTitle?: boolean;
    /** Grey out the picker and ignore clicks and keys, without changing
     *  the stored selection. Use this when another setting overrides the
     *  choice, so the current selection stays visible but inert. */
    disabled?: boolean;
    /** Id of an element (for example, a note explaining why the picker is
     *  disabled) to wire to the radio group's `aria-describedby`. */
    describedBy?: string;
}

/**
 * A titled radio group of two or more illustrated cards.
 *
 * Keyboard use follows the ARIA radio group pattern: only the checked card
 * is in the tab order, the arrow keys move to the next or previous card
 * (wrapping at the ends) and select it, and Space or Enter selects the
 * focused card.
 */
export function LayoutChoicePicker<T>({
    title,
    value,
    options,
    onChange,
    size = "compact",
    hideTitle = false,
    disabled = false,
    describedBy,
}: LayoutChoicePickerProps<T>): React.ReactElement {
    const card_refs = React.useRef<(HTMLButtonElement | null)[]>([]);
    const title_id = React.useId();
    const checked_index = options.findIndex((option) => option.value === value);

    const select = (index: number) => {
        if (disabled) {
            return;
        }
        if (options[index].value !== value) {
            onChange(options[index].value);
        }
    };

    const onKeyDown = (ev: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (disabled) {
            return;
        }
        let target: number | null = null;
        switch (ev.key) {
            case "ArrowRight":
            case "ArrowDown":
                target = (index + 1) % options.length;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                target = (index - 1 + options.length) % options.length;
                break;
            case " ":
            case "Enter":
                ev.preventDefault();
                select(index);
                return;
            default:
                return;
        }
        ev.preventDefault();
        card_refs.current[target]?.focus();
        select(target);
    };

    return (
        <div
            className={
                `LayoutChoicePicker ${size} choices-${options.length}` +
                (disabled ? " disabled" : "")
            }
        >
            <div
                className={"LayoutChoicePicker-title" + (hideTitle ? " sr-only" : "")}
                id={title_id}
            >
                {title}
            </div>
            <div
                className="LayoutChoicePicker-cards"
                role="radiogroup"
                aria-labelledby={title_id}
                aria-disabled={disabled || undefined}
                aria-describedby={describedBy}
            >
                {options.map((option, index) => {
                    const checked = index === checked_index;
                    const tabbable =
                        !disabled && (checked || (checked_index === -1 && index === 0));
                    return (
                        <button
                            key={String(option.value)}
                            ref={(el) => {
                                card_refs.current[index] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-disabled={disabled || undefined}
                            tabIndex={tabbable ? 0 : -1}
                            className={"LayoutChoicePicker-card" + (checked ? " checked" : "")}
                            onClick={() => select(index)}
                            onKeyDown={(ev) => onKeyDown(ev, index)}
                        >
                            {checked && (
                                <span className="LayoutChoicePicker-check" aria-hidden="true">
                                    <i className="fa fa-check" />
                                </span>
                            )}
                            <span className="LayoutChoicePicker-illustration">
                                {option.illustration}
                            </span>
                            <span className="LayoutChoicePicker-label">{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
