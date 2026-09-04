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
import { _ } from "@/lib/translate";
import { openModal, Modal } from "@/components/Modal";
import { GAME_KEYBOARD_SHORTCUT_GROUPS, shortcutKeyNames } from "./game_keyboard_shortcuts";
import "./GameKeyboardShortcutsModal.css";

interface Events {}

interface GameKeyboardShortcutsModalProperties {}

/** Lists every keyboard shortcut that the Game page binds. */
export class GameKeyboardShortcutsModal extends Modal<
    Events,
    GameKeyboardShortcutsModalProperties,
    {}
> {
    constructor(props: GameKeyboardShortcutsModalProperties) {
        super(props);
    }

    render() {
        return (
            <div className="Modal GameKeyboardShortcutsModal">
                <div className="header">
                    <h2>{_("Keyboard shortcuts")}</h2>
                </div>
                <div className="body">
                    {GAME_KEYBOARD_SHORTCUT_GROUPS.map((group) => (
                        <section key={group.title()} className="shortcut-group">
                            <h3>{group.title()}</h3>
                            {group.note && <p className="shortcut-note">{group.note()}</p>}
                            <table>
                                <tbody>
                                    {group.shortcuts.map((entry) => (
                                        <tr key={entry.shortcut}>
                                            <td className="shortcut-keys">
                                                {shortcutKeyNames(entry.shortcut).map((name, i) => (
                                                    <React.Fragment key={name}>
                                                        {i > 0 && (
                                                            <span className="shortcut-plus">+</span>
                                                        )}
                                                        <kbd>{name}</kbd>
                                                    </React.Fragment>
                                                ))}
                                            </td>
                                            <td className="shortcut-description">
                                                {entry.description()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    ))}
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

export function openGameKeyboardShortcutsModal(): void {
    openModal(<GameKeyboardShortcutsModal fastDismiss />);
}
