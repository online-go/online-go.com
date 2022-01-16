/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as preferences from "preferences";

let binding_id = 0;

class Binding {
    id;
    shortcut;
    fn;
    priority;

    constructor(shortcut, fn, priority) {
        this.id = ++binding_id;
        this.shortcut = shortcut;
        this.fn = fn;
        this.priority = priority;
    }
}

interface KBProps {
    shortcut: string;
    action: () => void;
    priority?: number;
}

export class KBShortcut extends React.Component<KBProps> {
    binding: Binding;

    constructor(props) {
        super(props);
    }
    shouldComponentUpdate() {
        return false;
    }
    componentDidUpdate() {
        kb_unbind(this.binding);
        this.binding = kb_bind(this.props.shortcut, this.props.action, this.props.priority || 0);
    }
    componentDidMount() {
        this.binding = kb_bind(this.props.shortcut, this.props.action, this.props.priority || 0);
    }
    componentWillUnmount() {
        kb_unbind(this.binding);
    }
    render() {
        return null;
    }
}

const keymap = {
    27: "esc",
    9: "tab",
    8: "del",
    46: "del",
    13: "enter",
    32: "space",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    33: "page-up",
    34: "page-down",
    35: "end",
    36: "home",
    67: "c",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    192: "`", // for console
    191: "/",
    220: "§", // swedish ` key
    163: "german-pound", // german pound key, the ` key is a "dead key"
};

const input_enabled_keys = {
    27: "esc",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
};

const modifiers = {
    shift: "shift",
    alt: "alt",
    meta: "meta",
    ctrl: "ctrl",
};

// It looks like this should be something like
//    `let bound_shortcuts: {[x: string]: Binding} = {};
// but I won't touch this for now -BPJ
// eslint-disable-next-line id-denylist
const bound_shortcuts = { string: Binding };

function sanitize_shortcut(shortcut) {
    const shift = shortcut.indexOf("shift-") >= 0;
    const ctrl = shortcut.indexOf("ctrl-") >= 0;
    const alt = shortcut.indexOf("alt-") >= 0;
    const meta = shortcut.indexOf("meta-") >= 0;

    shortcut = shortcut.toLowerCase();
    shortcut = shortcut.replace(/([^+-])[+]/g, "$1-");
    shortcut = shortcut.replace(/escape/, "esc");
    shortcut = shortcut.replace(/pg-up/, "page-up");
    shortcut = shortcut.replace(/pg-down/, "page-down");
    shortcut = shortcut.replace(/delete/, "del");
    shortcut = shortcut.replace(/return/, "enter");
    shortcut = shortcut.replace(/ctl/, "ctrl");
    shortcut = shortcut.replace(/s-/, "shift-");
    shortcut = shortcut.replace(/c-/, "ctrl-");
    shortcut = shortcut.replace(/a-/, "alt-");
    shortcut = shortcut.replace(/m-/, "meta-");
    shortcut = shortcut.replace("meta-", "");
    shortcut = shortcut.replace("shift-", "");
    shortcut = shortcut.replace("ctrl-", "");
    shortcut = shortcut.replace("alt-", "");
    shortcut =
        (shift ? "shift-" : "") +
        (alt ? "alt-" : "") +
        (ctrl ? "ctrl-" : "") +
        (meta ? "meta-" : "") +
        shortcut;

    return shortcut;
}

$(() => {
    $(document).on("keydown", (e) => {
        try {
            if (
                document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA" ||
                document.activeElement.tagName === "SELECT" ||
                document.activeElement.className === "qc-option"
            ) {
                if (!(e.keyCode in input_enabled_keys)) {
                    return true;
                }
            }
        } catch (e) {
            /* ie 11 throws this */
            console.warn(e);
        }

        let shortcut = "";
        if (e.shiftKey) {
            shortcut += "shift-";
        }
        if (e.ctrlKey) {
            shortcut += "ctrl-";
        }
        if (e.altKey) {
            shortcut += "alt-";
        }
        if (e.metaKey) {
            shortcut += "meta-";
        }

        if (e.keyCode in keymap) {
            shortcut += keymap[e.keyCode];
        } else {
            shortcut += String.fromCharCode(e.keyCode);
        }
        shortcut = sanitize_shortcut(shortcut);

        if (!preferences.get("function-keys-enabled")) {
            if (/f[0-9]/.test(shortcut)) {
                return true;
            }
        }

        if (shortcut in bound_shortcuts && bound_shortcuts[shortcut].length > 0) {
            const binding = bound_shortcuts[shortcut][bound_shortcuts[shortcut].length - 1];

            binding.fn(e);

            if (shortcut === "esc") {
                /* Allow escape through to other handlers, such as SWAL to close modals */
                return true;
            }

            if (shortcut === "ctrl-c" || shortcut === "meta-c") {
                /* Allow copy text on Ctrl+C in modal */
                return true;
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        }
        return true;
    });
});

export function kb_bind(shortcut, fn, priority) {
    if (!priority) {
        priority = 0;
    }
    shortcut = sanitize_shortcut(shortcut);
    //console.log("KB Binding", shortcut);
    const b = new Binding(shortcut, fn, priority);
    if (!(shortcut in bound_shortcuts)) {
        bound_shortcuts[shortcut] = [];
    }

    bound_shortcuts[shortcut].push(b);
    bound_shortcuts[shortcut].sort((a, b) => {
        if (a.priority === b.priority) {
            return a.id - b.id;
        }
        return a.priority - b.priority;
    });
    return b;
}

export function kb_unbind(b) {
    //console.log("KB Unbinding", b.shortcut);
    for (let i = 0; i < bound_shortcuts[b.shortcut].length; ++i) {
        if (bound_shortcuts[b.shortcut][i].id === b.id) {
            bound_shortcuts[b.shortcut].splice(i, 1);
            break;
        }
    }
}
