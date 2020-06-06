/*!
 * Nickname Tab Complete
 * Version: 0.8
 *
 * Copyright (c) 2010, Doug Neiner
 * Dual licenses under MIT or GPL
 *
 */

import * as player_cache from "player_cache";

declare var $;


/*!
 * This function adapted from: https://github.com/localhost/jquery-fieldselection
 * jQuery plugin: fieldSelection - v0.1.1 - last change: 2006-12-16
 * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
 */
function getSelection(field) {
    let e = field;

    return (

        /* mozilla / dom 3.0 */
        ("selectionStart" in e && (() => {
            let l = e.selectionEnd - e.selectionStart;
            return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
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
        (() => { return null; })
    )();

}

/*!
    These two functions were taken directly from an answer
    by CMS (http://stackoverflow.com/users/5445/cms) on Stack Overflow:
    http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
*/
function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
        let range = input.createTextRange();
        range.collapse(true);
        range.moveEnd("character", selectionEnd);
        range.moveStart("character", selectionStart);
        range.select();
    }
}

function setCaretToPos(input, pos) {
    // Fix for difference between normalized val() and value
    // TODO: Need to fix IE test here and replace with support test
    if ($.fn.nicknameTabComplete.has_newline_bug && !$.browser.msie) {
        let adjustment = $(input).val().substr(0, pos).split("\n").length - 1;
        pos = pos + adjustment;
    }
    setSelectionRange(input, pos, pos);
}
/* End functions from CMS */

/* The rest of this code is my code */
function matchName(input, nicknames) {
    let match = input.toLowerCase();
    let matches = [];
    let length = input.length;
    let letters = "";
    let letter;
    let i = 0;

    $.each(nicknames, (index, value) => {
        let components = value.toLowerCase().split(" ");
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

            $.each(matches, (index, value) => {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                     letter = "";
                     return false;
                }
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

function matchFullName(input, nicknames) {
    let matches = [];
    let i = 0;
    let letter;
    let letters = "";
    $.each(nicknames, (index, value) => {
        let idx = input.lastIndexOf(value);
        if (idx >= 0 && idx === input.length - value.length) {
            matches.push(value);
        }
    });

    if (matches.length === 1) {
        return { value: matches[0], matches: matches };
    } else if (matches.length > 1) {
        for (; i < matches[0].length - length; i = i + 1) {
            letter = matches[0].toLowerCase().substr(length + i, 1);

            $.each(matches, (index, value) => {
                if (value.toLowerCase().substr(length + i, 1) !== letter) {
                     letter = "";
                     return false;
                }
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

/* tslint:disable */
function onKeyPress(e, options) {
    if (e.which === 9) {
        let $this = $(this);
        let val = $this.val();
        let sel = getSelection($this[0]);
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
                 text = text.match(options.nick_match)[1];

                 if (typeof(options.nicknames) === "function") {
                     match = matchName(text, options.nicknames());
                 } else {
                     match = matchName(text, options.nicknames);
                 }


                 completed_event = $.Event("nickname-complete");
                 $.extend(completed_event, match);
                 completed_event.caret = sel.start;
                 $this.trigger(completed_event);

                 if (match.value && !completed_event.isDefaultPrevented()) {
                     first = val.substr(0, sel.start - text.length );
                     last    = val.substr(sel.start);
                     /* Space should not be added when there is only 1 match
                            or if there is already a space following the caret position */
                     let space = (match.matches.length > 1 || last.length && last.substr(0, 1) === " ") ? "" : (first.trim().length === 0 ? ": " : " ");
                     $this.val(first + match.value + space + last);
                     setCaretToPos(this, sel.start - text.length + match.value.length + space.length);
                 }

                 e.preventDefault();

                 // Part of a crazy hack for Opera
                 this.lastKey = 9;
            }
            else if (/( |: )$/.test(text)) {
                let space = text.match(/( |: )$/)[1];
                text = text.substring(0, text.length - space.length);
                if (typeof(options.nicknames) === "function") {
                    match = matchFullName(text, options.nicknames());
                } else {
                    match = matchFullName(text, options.nicknames);
                }

                completed_event = $.Event("nickname-complete");
                $.extend(completed_event, match);
                completed_event.caret = sel.start;
                $this.trigger(completed_event);

                if ((match.value && !completed_event.isDefaultPrevented())) {
                    first = val.substr(0, sel.start - match.value.length - space.length);
                    last    = val.substr(sel.start);
                    /* Space should not be added when there is only 1 match
                           or if there is already a space following the caret position */
                    $this.val(first + '@"' + match.value + '/' + (player_cache.lookup_by_username(match.value)?.id ?? 0) + '"' + space + last);
                    setCaretToPos(this, sel.start - match.value + match.value.length + space.length);
                }

                e.preventDefault();

                // Part of a crazy hack for Opera
                this.lastKey = 9;
            }
        }
    }
};
/* tslint:enable */


/* tslint:disable */
$.fn.nicknameTabComplete = function(options) {
  options = $.extend({}, $.fn.nicknameTabComplete.defaults, options);
  this.bind("keydown.nickname", (e) => {
    onKeyPress.call(this, e, options);
  }).bind("focus.nickname", () => {
    // Part of a crazy hack for Opera
    this.lastKey = 0;
  }).bind("blur.nickname", () => {
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
/* tslint:enable */

$.fn.nicknameTabComplete.defaults = {
  nicknames: () => player_cache.nicknames,
  nick_match: /([-_a-z0-9]+)$/i,
  on_complete: null // Pass in a function as an alternate way of binding to this event
};

$.fn.nicknameTabComplete.has_newline_bug = (() => {
  let textarea = $("<textarea>").val("Newline\nTest");
  return textarea[0].value === "Newline\r\nTest";
})();


export function init_tabcomplete() {
    /* hack to ensure this gets imported since it binds to jquery */
}
