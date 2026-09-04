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

import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";

/**
 * One keyboard shortcut on the Game page.
 *
 * The same entry drives both the live `KBShortcut` binding and the row in the
 * "Keyboard shortcuts" modal, so the two cannot drift apart.
 */
export interface GameKeyboardShortcut {
    /** Key combination in `KBShortcut` syntax, e.g. "shift-z" or "page-up". */
    shortcut: string;
    /** Translated, human readable description of what the shortcut does. */
    description: () => string;
    /** What the shortcut does when pressed. */
    action: (controller: GobanController) => void;
    /** When given, the shortcut is only bound while this returns true. */
    when?: (controller: GobanController) => boolean;
}

export interface GameKeyboardShortcutGroup {
    /** Translated group heading shown in the modal. */
    title: () => string;
    /** Optional translated note shown under the group heading. */
    note?: () => string;
    shortcuts: GameKeyboardShortcut[];
}

export const GAME_KEYBOARD_SHORTCUT_GROUPS: GameKeyboardShortcutGroup[] = [
    {
        title: () => pgettext("Keyboard shortcut group", "Navigation"),
        shortcuts: [
            {
                shortcut: "left",
                description: () => pgettext("Keyboard shortcut description", "Previous move"),
                action: (c) => c.previousMove(),
            },
            {
                shortcut: "right",
                description: () => pgettext("Keyboard shortcut description", "Next move"),
                action: (c) => c.nextMove(),
            },
            {
                shortcut: "page-up",
                description: () => pgettext("Keyboard shortcut description", "Back 10 moves"),
                action: (c) => c.previous10Moves(),
            },
            {
                shortcut: "page-down",
                description: () => pgettext("Keyboard shortcut description", "Forward 10 moves"),
                action: (c) => c.forwardTenMoves(),
            },
            {
                shortcut: "home",
                description: () => pgettext("Keyboard shortcut description", "Go to first move"),
                action: (c) => c.gotoFirstMove(),
            },
            {
                shortcut: "end",
                description: () => pgettext("Keyboard shortcut description", "Go to last move"),
                action: (c) => c.gotoLastMove(),
            },
            {
                shortcut: "up",
                description: () =>
                    pgettext("Keyboard shortcut description", "Previous variation branch"),
                action: (c) => c.nextBranchUp(),
            },
            {
                shortcut: "down",
                description: () =>
                    pgettext("Keyboard shortcut description", "Next variation branch"),
                action: (c) => c.nextBranchDown(),
            },
            {
                shortcut: "space",
                description: () =>
                    pgettext("Keyboard shortcut description", "Play or pause move autoplay"),
                action: (c) => c.togglePlayPause(),
            },
        ],
    },
    {
        title: () => pgettext("Keyboard shortcut group", "Modes and display"),
        shortcuts: [
            {
                shortcut: "shift-a",
                description: () => pgettext("Keyboard shortcut description", "Analyze game"),
                action: (c) => c.gameAnalyze(),
            },
            {
                shortcut: "shift-p",
                description: () => pgettext("Keyboard shortcut description", "Return to play mode"),
                action: (c) => c.goban.setModeDeferred("play"),
            },
            {
                shortcut: "shift-r",
                description: () => pgettext("Keyboard shortcut description", "Start a review"),
                action: (c) => c.startReview(),
            },
            {
                shortcut: "shift-e",
                description: () => pgettext("Keyboard shortcut description", "Estimate score"),
                action: (c) => c.estimateScore(),
            },
            {
                shortcut: "shift-i",
                description: () =>
                    pgettext("Keyboard shortcut description", "Show or hide the AI review"),
                action: (c) => c.toggleAIReview(),
            },
            {
                shortcut: "shift-c",
                description: () =>
                    pgettext("Keyboard shortcut description", "Show or hide board coordinates"),
                action: (c) => c.toggleCoordinates(),
            },
            {
                shortcut: "shift-z",
                description: () => pgettext("Keyboard shortcut description", "Toggle zen mode"),
                action: (c) => c.toggleZenMode(),
            },
            {
                shortcut: "escape",
                description: () =>
                    pgettext(
                        "Keyboard shortcut description",
                        "Cancel a staged move, stop score estimation, leave analysis, or exit zen mode",
                    ),
                action: (c) => c.handleEscapeKey(),
            },
        ],
    },
    {
        title: () => pgettext("Keyboard shortcut group", "Variations"),
        shortcuts: [
            {
                shortcut: "ctrl-c",
                description: () =>
                    pgettext("Keyboard shortcut description", "Copy the current branch"),
                action: (c) => c.copyBranch(),
            },
            {
                shortcut: "ctrl-v",
                description: () =>
                    pgettext("Keyboard shortcut description", "Paste the copied branch"),
                action: (c) => c.pasteBranch(),
            },
            {
                shortcut: "del",
                description: () =>
                    pgettext("Keyboard shortcut description", "Delete the current branch"),
                action: (c) => c.deleteBranch(),
            },
        ],
    },
    {
        title: () => pgettext("Keyboard shortcut group", "Analysis tools"),
        note: () =>
            pgettext(
                "Note shown in the keyboard shortcuts list",
                "Function keys must be enabled in Settings, under Game Preferences.",
            ),
        shortcuts: [
            {
                shortcut: "f1",
                description: () =>
                    pgettext("Keyboard shortcut description", "Place alternating stones"),
                action: (c) => c.setAnalyzeTool("stone", "alternate"),
            },
            {
                shortcut: "f2",
                description: () => pgettext("Keyboard shortcut description", "Place black stones"),
                action: (c) => c.setAnalyzeTool("stone", "black"),
            },
            {
                shortcut: "f4",
                description: () => pgettext("Keyboard shortcut description", "Triangle labels"),
                action: (c) => c.setAnalyzeTool("label", "triangle"),
            },
            {
                shortcut: "f5",
                description: () => pgettext("Keyboard shortcut description", "Square labels"),
                action: (c) => c.setAnalyzeTool("label", "square"),
            },
            {
                shortcut: "f6",
                description: () => pgettext("Keyboard shortcut description", "Circle labels"),
                action: (c) => c.setAnalyzeTool("label", "circle"),
            },
            {
                shortcut: "f7",
                description: () => pgettext("Keyboard shortcut description", "Letter labels"),
                action: (c) => c.setAnalyzeTool("label", "letters"),
            },
            {
                shortcut: "f8",
                description: () => pgettext("Keyboard shortcut description", "Number labels"),
                action: (c) => c.setAnalyzeTool("label", "numbers"),
            },
            {
                shortcut: "f9",
                description: () => pgettext("Keyboard shortcut description", "Pencil"),
                action: (c) => c.setAnalyzeTool("draw", c.analyze_pencil_color),
            },
            {
                shortcut: "f10",
                description: () =>
                    pgettext(
                        "Keyboard shortcut description",
                        "Clear the analysis and sync with the game",
                    ),
                action: (c) => c.clearAndSync(),
                when: (c) => c.goban?.mode === "analyze",
            },
        ],
    },
];

/**
 * Human readable key names for the modal.
 *
 * Keys are the tokens produced by splitting a `KBShortcut` string on "-".
 * Anything not listed is shown upper-cased, which covers letters.
 */
const KEY_NAMES: { [token: string]: () => string } = {
    left: () => pgettext("Keyboard key name", "Left arrow"),
    right: () => pgettext("Keyboard key name", "Right arrow"),
    up: () => pgettext("Keyboard key name", "Up arrow"),
    down: () => pgettext("Keyboard key name", "Down arrow"),
    "page-up": () => pgettext("Keyboard key name", "Page Up"),
    "page-down": () => pgettext("Keyboard key name", "Page Down"),
    home: () => pgettext("Keyboard key name", "Home"),
    end: () => pgettext("Keyboard key name", "End"),
    space: () => pgettext("Keyboard key name", "Space"),
    escape: () => pgettext("Keyboard key name", "Esc"),
    del: () => pgettext("Keyboard key name", "Delete"),
    shift: () => pgettext("Keyboard key name", "Shift"),
    ctrl: () => pgettext("Keyboard key name", "Ctrl"),
    alt: () => pgettext("Keyboard key name", "Alt"),
};

/** Splits a `KBShortcut` string into display names, one per key cap. */
export function shortcutKeyNames(shortcut: string): string[] {
    if (shortcut in KEY_NAMES) {
        return [KEY_NAMES[shortcut]()];
    }
    return shortcut.split("-").map((token) => {
        if (token in KEY_NAMES) {
            return KEY_NAMES[token]();
        }
        return token.toUpperCase();
    });
}
