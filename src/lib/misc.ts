/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import {_, interpolate, pgettext} from "translate";
import {post} from "requests";
import {errcodeAlerter} from 'ErrcodeModal';
import {browserHistory} from "ogsHistory";
import * as preferences from "preferences";

declare var swal;

export function updateDup(obj: any, field: string, value: any) {{{
    let ret = dup(obj);
    let arr =  field.split(".");
    let cur = ret;
    for (let i = 0; i < arr.length - 1; ++i) {
        cur = cur[arr[i]];
    }
    cur[arr[arr.length - 1]] = value;
    return ret;
}}}

export function timeControlSystemText(system) { /* {{{ */
    if (!system) {
        return "[unknown]";
    }

    switch (system.toLowerCase()) {
        case "fischer": return _("Fischer");
        case "simple": return _("Simple");
        case "byoyomi": return _("Byo-Yomi");
        case "canadian": return _("Canadian");
        case "absolute": return _("Absolute");
        case "none": return _("None");
    }
    return "[unknown]";
} /* }}} */
export function rulesText(rules) { /* {{{ */
    if (!rules) {
        return "[unknown]";
    }

    switch (rules.toLowerCase()) {
        case "aga": return _("AGA");
        case "japanese": return _("Japanese");
        case "korean": return _("Korean");
        case "chinese": return _("Chinese");
        case "ing": return _("Ing");
        case "nz": return _("New Zealand");
    }
    return "[unknown]";
} /* }}} */
export function dup(obj: any): any { /* {{{ */

    let ret;
    if (typeof(obj) === "object") {
        if (Array.isArray(obj)) {
            ret = [];
            for (let i = 0; i < obj.length; ++i) {
                ret.push(dup(obj[i]));
            }
        } else {
            ret = {};
            for (let i in obj) {
                ret[i] = dup(obj[i]);
            }
        }
    } else {
        return obj;
    }
    return ret;
} /* }}} */
export function deepEqual(a: any, b: any) { /* {{{ */
    if (typeof(a) !== typeof(b)) { return false; }

    if (typeof(a) === "object") {
        if (Array.isArray(a)) {
            if (Array.isArray(b)) {
                if (a.length !== b.length) {
                    return false;
                }
                for (let i = 0; i < a.length; ++i) {
                    if (!deepEqual(a[i], b[i])) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        } else {
            for (let i in a) {
                if (!(i in b)) {
                    return false;
                }
                if (!deepEqual(a[i], b[i])) {
                    return false;
                }
            }
            for (let i in b) {
                if (!(i in a)) {
                    return false;
                }
            }
        }
        return true;
    } else {
        return a === b;
    }
} /* }}} */
export function getRandomInt(min, max) { /* {{{ */
  return Math.floor(Math.random() * (max - min)) + min;
} /* }}} */
export function getRelativeEventPosition(event) { /* {{{ */
    let x;
    let y;
    let offset = $(event.target).offset();

    if (event.originalEvent.touches && event.originalEvent.touches.length) {
        x = event.originalEvent.touches[0].pageX - offset.left;
        y = event.originalEvent.touches[0].pageY - offset.top;
    } else if (event.touches && event.touches.length) {
        x = event.touches[0].pageX - offset.left;
        y = event.touches[0].pageY - offset.top;
    } else if (event.pageX) {
        x = event.pageX - offset.left;
        y = event.pageY - offset.top;
    } else {
        console.log("Missing event tap/click location:", event);
        return;
    }

    return {"x": x, "y": y};
} /* }}} */

export function uuid(): string { /* {{{ */
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = Math.random() * 16 | 0;
        let v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
} /* }}} */
export function getOutcomeTranslation(outcome:string) { /* {{{ */
    /* Note: for the case statements, don't simply do `pgettext("Game outcome", outcome)`,
     * the system to parse out strings to translate needs the text. */
    switch (outcome) {
        case 'resign':
        case 'r':
        case 'Resignation':
            return pgettext("Game outcome", 'Resignation');

        case 'Stone Removal Timeout':
            return pgettext("Game outcome", 'Stone Removal Timeout');
        case 'Timeout':
            return pgettext("Game outcome", 'Timeout');
        case 'Cancellation':
            return pgettext("Game outcome", 'Cancellation');
        case 'Disqualification':
            return pgettext("Game outcome", 'Disqualification');
        case 'Moderator Decision':
            return pgettext("Game outcome", 'Moderator Decision');
        case 'Abandonment':
            return pgettext("Game outcome", 'Abandonment');
    }

    if (/[0-9.]+/.test(outcome)) {
        let num = outcome.match(/([0-9.]+)/)[1];
        return interpolate(pgettext("Game outcome", "{{number}} points"), {"number": num});
    }

    return outcome;
} /* }}} */
export function getGameResultText(game) { /* {{{ */
    /* SGFs will encode the full result in the outcome */
    if (/[+]/.test(game.outcome)) {
        return game.outcome;
    }

    let winner = "";
    let result = "";
    if (game.white_lost && game.black_lost) {
        winner = _("Tie");
    } else if (game.white_lost) {
        winner = _("B");
    } else if (game.black_lost) {
        winner = _("W");
    } else {
        winner = _("Tie");
    }

    game.outcome = game.outcome.replace(" points", "");
    result += winner + "+"  + getOutcomeTranslation(game.outcome);

    if (game.ranked) {
        result += ", ";
        result += _("ranked");
    }
    if (game.annulled) {
        result += ", ";
        result += _("annulled");
    }
    return result;
} /* }}} */
export function acceptGroupInvite(invite_id) { /* {{{ */
    return post("me/groups/invitations", { request_id: invite_id }).catch(errorAlerter);
} /* }}} */
export function rejectGroupInvite(invite_id) { /* {{{ */
    return post("me/groups/invitations", { "delete": true, request_id: invite_id }).catch(errorAlerter);
} /* }}} */
export function acceptFriendRequest(id) { /* {{{ */
    return post("me/friends/invitations", { "from_user": id }).catch(errorAlerter);
} /* }}} */
export function rejectFriendRequest(id) { /* {{{ */
    return post("me/friends/invitations", { "delete": true, "from_user": id }).catch(errorAlerter);
} /* }}} */
export function acceptTournamentInvite(id) { /* {{{ */
    return post("me/tournaments/invitations", { "request_id": id }).catch(errorAlerter);
} /* }}} */
export function rejectTournamentInvite(id) { /* {{{ */
    return post("me/tournaments/invitations", { "delete": true, "request_id": id }).catch(errorAlerter);
} /* }}} */

function lengthInUtf8Bytes(str) { /* {{{ */
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  let m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
} /* }}} */
export function splitOnBytes(message, bytes) { /* {{{ */
    let offs = 0;

    while (lengthInUtf8Bytes(message.substr(0, bytes - offs)) > bytes) {
        ++offs;
    }

    return [
        message.substr(0, bytes - offs),
        message.substr(bytes - offs)
    ];
} /* }}} */
export function getPrintableError(err) {{{
    if (err === "esc" || err === "cancel" || err === "overlay" || err === "timer") {
        /* We get these from swal (sweetalert) modals when the scape key is pressed, not really errors */
        return;
    }

    if (!err) {
        return;
    }


    if (err instanceof Error) {
        console.error(err.stack);
        return err.toString();
    }

    if (typeof(err) === "string") {
        return err;
    }

    let obj = typeof(err) === "object" ? err : null;
    if (!obj) {
        console.error(obj);
        try { obj = JSON.parse(err.responseText); } catch (e) { }
        if (!obj) {
            console.log(err);
            console.warn("Unable to process error message to a printable error string (1): ", err.responseText);
            try {
                console.error(new Error().stack);
            } catch (e) {
            }
            return "An unknown error has occurred!";
        }
    }

    if (obj.status === 0 && obj.statusText === "abort") {
        /* ignore aborted requests' */
        return;
    }


    /*
    if (typeof(obj) === "object") {
        if (obj.game) obj = obj.game;
        if (obj.game_error) obj = obj.game_error;
    */
    let failsafe = 100;
    while (typeof(obj) === "object" && failsafe--) {
        if (obj instanceof Array) {
            obj = obj[0];
        } else {
            if ("responseText" in obj) {
                try {
                    obj = JSON.parse(obj.responseText);
                } catch (e) {
                    obj = obj.responseText;
                }
            }
            else if ("errcode" in obj) {
                obj = "errcode";
            }
            else if ("error" in obj) {
                obj = obj.error;
            }
            else if ("detail" in obj) {
                obj = obj.detail;
            }
            else if ("game_error" in obj) {
                obj = obj.game_error;
            }
            else {
                for (let k in obj) {
                    if (obj[k] === "This field is required.") {
                        obj = "This field is required: " + k;
                        break;
                    } else if (obj[k] === "This field cannot be blank.") {
                        obj = "This field cannot be blank: " + k;
                        break;
                    }
                }
            }
        }
    }

    if (typeof(obj) === "string") {
        return obj;
    } else {
        //console.warn("Unable to process error message to a printable error string (2): ", JSON.parse(err.responseText));
        console.error(obj);
        console.error("Unable to process error message to a printable error string (2): ", (err.responseText ? JSON.parse(err.responseText) : err));
        return _("An error has occurred");
    }
}}}
export function errorAlerter(...args) {{{
    let err = getPrintableError(args[0]);
    if (!err) {
        return;
    }
    if (err === "errcode") {
        errcodeAlerter(args[0]);
    } else {
        swal({
            title: _(err.substring(0, 128)),
            type: "error"
        });
    }
    console.error(err);
}}}
export function errorLogger(...args) {{{
    let err = getPrintableError(args[0]);
    if (!err) {
        return;
    }
    console.error(err);
}}}
export function string_splitter(str: string, max_length: number= 200): Array<string> {{{
    let re = new RegExp(`.{1,${max_length}}`, "g");

    let arr = str.split(/\s+/).map((s) => s.match(re));
    let ret: Array<string> = [];
    let cur = "";
    for (let pieces of arr) {
        if (!pieces) {
            continue;
        }
        for (let s of pieces) {
            if (cur.length + s.length + (cur.length === 0 ? 0 : 1) < max_length) {
                cur += (cur.length ? " " : "") + s;
            } else {
                ret.push(cur);
                cur = s;
            }
        }
    }
    ret.push(cur);
    return ret;
}}}
export function ignore() {{{
    /* do nothing */
}}}
export function unicodeFilter(str:string):string {{{
    if (preferences.get('unicode-filter')) {
        return (str
            .replace(/(?:[\uD800-\uDBFF][\uDC00-\uDFFF])/g, "") /* 4 byte unicode */
            .replace(/[\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u2070-\u209F\u20A0-\u20CF\u20D0-\u20FF\u2200-\u22FF\u2400-\u243F\u2440-\u245F\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u27F0-\u27FF\u2800-\u28FF\u2900-\u297F\u2980-\u29FF\u2A00-\u2AFF\u2B00-\u2BFF\uD800-\uDB7F\uDB80-\uDBFF\uDC00-\uDFFF\uE000-\uF8FF\uFE00-\uFE0F\uFE10-\uFE1F\uFE50-\uFE6F\uFF00-\uFFEF\uFFF0-\uFFFF]/g, "") /* bunch of stuff that people might find annoying in usernames, care of http://kourge.net/projects/regexp-unicode-block */
        );
    }
    return str;
}}}


const n2s_alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const n2s_alphalen = n2s_alphabet.length;
export function n2s(n?: number) {{{
    if (n < 0) {
        return "-" + n2s(-n);
    }

    if (n === 0) {
        return n2s_alphabet[0];
    }

    n = Math.trunc(n);

    let ret = "";
    while (n) {
        let remainder = n % n2s_alphalen;
        n = Math.trunc(n / n2s_alphalen);
        ret = n2s_alphabet[remainder] + ret;
    }

    return ret;
}}}
export function alertModerator(obj) {{{
    swal({
        text: (obj.user ? _("Report user:") + " " : "") +
            _("Please provide a brief description of the problem"),
        input: "text",
        showCancelButton: true,
    }).then((description) => {
        if (description.length < 5) {
            alertModerator(obj);
            return;
        }
        obj.note = description;
        post("moderation/incident", obj)
        .then(() => {
            swal({text: _("Thanks for the report!")});
        })
        .catch(errorAlerter)
        ;
    })
    .catch(ignore);
}}}

/* Returns true on middle clicks and command-clicks */
export function shouldOpenNewTab(event) { /* {{{ */
    if (event.nativeEvent) {
        event = event.nativeEvent;
    }

    if (event && (event.which === 2 || event.metaKey || event.ctrlKey || event.shiftKey)) {
        return true;
    }
    /*
    if (window['getLocation']().indexOf("/chat") >= 0) {
        return true;
    }
    */
    return false;
} /* }}} */

let last_navigateTo = {
    path: null,
    timestamp: null
};

export function navigateTo(path, event?) {{{
    if (last_navigateTo.path === path && Date.now() - last_navigateTo.timestamp < 100) {
        /* debounce, this is for elements that need to have both onClick and onMouseUp to
         * handle various use cases in different browsers */
        console.log('navigate debounce');
        return false;
    }

    last_navigateTo.path = path;
    last_navigateTo.timestamp = Date.now();

    if (event && shouldOpenNewTab(event)) {
        window.open(path, "_blank");
    } else {
        browserHistory.push(path);
    }
}}}

export function deepCompare(x: any, y: any) {{{
    // http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    let leftChain = [];
    let rightChain = [];

    let compare2Objects = (x, y) => {
        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === "number" && typeof y === "number") {
            return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === "function" && typeof y === "function") ||
            (x instanceof Date && y instanceof Date) ||
                (x instanceof RegExp && y instanceof RegExp) ||
                    (x instanceof String && y instanceof String) ||
                        (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (let p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (let p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case "object":
                case "function":
                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects (x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    };

    return compare2Objects(x, y);
}}}


/*** OGS Focus detection {{{ ***/
let focus_window_id = "" + Math.random();
try {
    $(window).focus(() => {
        try {
            localStorage.setItem("focused_window", focus_window_id);
        } catch (e) {
            // Ignored, safari in private mode errors out when setItem is called
        }
    });
    $(window).blur(() => {
        try {
            if (localStorage.getItem("focused_window") === focus_window_id) {
                localStorage.removeItem("focused_window");
            }
        } catch (e) {
        }
    });
    if (document.hasFocus()) {
        try {
            localStorage.setItem("focused_window", focus_window_id);
        } catch (e) {
        }
    }
} catch (e) {
    console.error(e);
}

export function ogs_has_focus() {{{
    try {
        return document.hasFocus() || (localStorage.getItem("focused_window") != null);
    } catch (e) {
        /* It's unclear if all mobile devices implement hasFocus.
         * Additionally, if local storage is disabled, we might get
         * exceptions, so in any case just default to true. */
        console.error(e);
        return true;
    }
}}}
/* }}} */
