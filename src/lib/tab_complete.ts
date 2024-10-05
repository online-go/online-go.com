/*
 * Copyright (C)  Online-Go.com
 *
 * cspell:disable
 *
 * This file is heavily derived from "Nickname Tab Complete"
 * by Doug Neiner and any changes made to this file are
 * licensed under the same terms as the original.
 */

/*  */

/*!
 * Nickname Tab Complete
 * Version: 0.8
 *
 * Copyright (c) 2010, Doug Neiner
 * Dual licenses under MIT or GPL
 */

import * as player_cache from "@/lib/player_cache";

declare let $: any;

interface TabCompleteOptions {
    nick_match: RegExp;
    nicknames: string[] | (() => string[]);
    on_complete: (event: any) => void;
}

/*!
 * This function adapted from: https://github.com/localhost/jquery-fieldselection
 * jQuery plugin: fieldSelection - v0.1.1 - last change: 2006-12-16
 * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
 */
function getSelection(field: HTMLTextAreaElement) {
    const e = field;

    return (
        /* mozilla / dom 3.0 */
        (
            ("selectionStart" in e &&
                (() => {
                    const l = e.selectionEnd - e.selectionStart;
                    return {
                        start: e.selectionStart,
                        end: e.selectionEnd,
                        length: l,
                        text: e.value.substr(e.selectionStart, l),
                    };
                })) ||
            /* exploder */
            /*
        (document.selection && (() => {

            e.focus();

            let r = document.selection.createRange();
            if (r == null) {
                return { start: 0, end: e.value.length, length: 0 };
            };

            let re = e.createTextRange();
            let rc = re.duplicate();
            re.moveToBookmark(r.getBookmark());
            rc.setEndPoint('EndToStart', re);

            return { start: rc.text.length, end: rc.text.length + r.text.length, length: r.text.length, text: r.text };
        })) ||
        */

            /* browser not supported */
            (() => {
                return null;
            })
        )()
    );
}

/*!
    These two functions were taken directly from an answer
    by CMS (http://stackoverflow.com/users/5445/cms) on Stack Overflow:
    http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
*/
function setSelectionRange(input: any, selectionStart: number, selectionEnd: number) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    } else if (input.createTextRange) {
        const range = input.createTextRange();
        range.collapse(true);
        range.moveEnd("character", selectionEnd);
        range.moveStart("character", selectionStart);
        range.select();
    }
}

function setCaretToPos(input: HTMLInputElement, pos: number) {
    // Fix for difference between normalized val() and value
    // TODO: Need to fix IE test here and replace with support test
    if ($.fn.nicknameTabComplete.has_newline_bug && !$.browser.msie) {
        const adjustment = $(input).val().substr(0, pos).split("\n").length - 1;
        pos = pos + adjustment;
    }
    setSelectionRange(input, pos, pos);
}
/* End functions from CMS */

/* The rest of this code is my code */
function matchName(input: string, nicknames: string[]) {
    const match = input.toLowerCase();
    const matches: string[] = [];
    const length = input.length;
    let letters = "";
    let letter: string;
    let i = 0;

    $.each(nicknames, (_index: number, value: string) => {
        const components = value.toLowerCase().split(" ");
        for (let k = 0; k < components.length; ++k) {
            if (components[k].substr(0, length) === match) {
                matches.push(value);
                return;
            }
        }
        if (value.toLowerCase().substr(0, length) === match) {
            matches.push(value);
        }
    });

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (; i < matches[0].length - length; i = i + 1) {
            letter = matches[0].toLowerCase().substr(length + i, 1);

            $.each(matches, (_index: number, value: string) => {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                    letter = "";
                    return false;
                }
                return;
            });
            if (letter) {
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
    let i = 0;
    let letter: string;
    let letters = "";
    $.each(nicknames, (index: number, value: string) => {
        const idx = input.lastIndexOf(value);
        if (idx >= 0 && idx === input.length - value.length) {
            matches.push(value);
        }
    });

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (; i < matches[0].length - length; i = i + 1) {
            letter = matches[0].toLowerCase().substr(length + i, 1);

            $.each(matches, (_index: number, value: string) => {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                    letter = "";
                    return false;
                }
                return;
            });
            if (letter) {
                letters += letter;
            } else {
                break;
            }
        }
        return { value: input + letters, matches: matches };
    }
    return { value: "", matches: matches };
}

/* eslint-disable @typescript-eslint/no-invalid-this */
function onKeyPress(e: React.KeyboardEvent, options: TabCompleteOptions) {
    if (e.which === 9) {
        const $this = $(this);
        const val = $this.val();
        const sel = getSelection($this[0]);
        let text = "";
        let match: any = "";
        let first;
        let last;
        let completed_event;

        if (sel !== null && !sel.length && sel.start) {
            if ($.fn.nicknameTabComplete.has_newline_bug) {
                // Carriage return fix
                text = this.value.substr(0, sel.start);
                sel.start = sel.start - (text.split("\n").length - 1);
            }

            text = val.substr(0, sel.start);
            if (options.nick_match.test(text)) {
                text = (text.match(options.nick_match) as string[])[1];

                if (typeof options.nicknames === "function") {
                    match = matchName(text, options.nicknames());
                } else {
                    match = matchName(text, options.nicknames);
                }

                completed_event = $.Event("nickname-complete");
                $.extend(completed_event, match);
                completed_event.caret = sel.start;
                $this.trigger(completed_event);

                if (match.value && !completed_event.isDefaultPrevented()) {
                    first = val.substr(0, sel.start - text.length);
                    last = val.substr(sel.start);
                    /* Space should not be added when there is only 1 match
                            or if there is already a space following the caret position */
                    const space =
                        match.matches.length > 1 || (last.length && last.substr(0, 1) === " ")
                            ? ""
                            : first.trim().length === 0
                              ? ": "
                              : " ";
                    $this.val(first + match.value + space + last);
                    setCaretToPos(
                        this,
                        sel.start - text.length + match.value.length + space.length,
                    );
                }

                e.preventDefault();

                // Part of a crazy hack for Opera
                this.lastKey = 9;
            } else if (/( |: )$/.test(text)) {
                const space = (text.match(/( |: )$/) as string[])[1];
                text = text.substring(0, text.length - space.length);
                if (typeof options.nicknames === "function") {
                    match = matchFullName(text, options.nicknames());
                } else {
                    match = matchFullName(text, options.nicknames);
                }

                completed_event = $.Event("nickname-complete");
                $.extend(completed_event, match);
                completed_event.caret = sel.start;
                $this.trigger(completed_event);

                if (match.value && !completed_event.isDefaultPrevented()) {
                    first = val.substr(0, sel.start - match.value.length - space.length);
                    last = val.substr(sel.start);
                    /* Space should not be added when there is only 1 match
                           or if there is already a space following the caret position */
                    $this.val(
                        first +
                            '@"' +
                            match.value +
                            "/" +
                            (player_cache.lookup_by_username(match.value)?.id ?? 0) +
                            '"' +
                            space +
                            last,
                    );
                    setCaretToPos(
                        this,
                        sel.start - match.value + match.value.length + space.length,
                    );
                }

                e.preventDefault();

                // Part of a crazy hack for Opera
                this.lastKey = 9;
            }
        }
    }
}
/* eslint-enable @typescript-eslint/no-invalid-this */

$.fn.nicknameTabComplete = function (options: TabCompleteOptions) {
    options = $.extend({}, $.fn.nicknameTabComplete.defaults, options);
    this.bind("keydown.nickname", (e: React.KeyboardEvent) => {
        onKeyPress.call(this, e, options);
    })
        .bind("focus.nickname", () => {
            // Part of a crazy hack for Opera
            this.lastKey = 0;
        })
        .bind("blur.nickname", () => {
            // Part of a crazy hack for Opera
            if (this.lastKey === 9) {
                this.focus();
            }
        });

    if (options.on_complete != null) {
        this.bind("nickname-complete", options.on_complete);
    }
    return this;
};

$.fn.nicknameTabComplete.defaults = {
    nicknames: () => player_cache.nicknames,
    nick_match: /([-_a-z0-9]+)$/i,
    on_complete: null, // Pass in a function as an alternate way of binding to this event
};

$.fn.nicknameTabComplete.has_newline_bug = (() => {
    const textarea = $("<textarea>").val("Newline\nTest");
    return textarea[0].value === "Newline\r\nTest";
})();

export function init_tab_complete() {
    /* hack to ensure this gets imported since it binds to jquery */
}
