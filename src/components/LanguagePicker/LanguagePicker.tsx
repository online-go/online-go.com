/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {_, setCurrentLanguage, current_language, languages} from "translate";
import {Modal, openModal} from "Modal";
import * as preferences from "preferences";

interface Events {
}

interface LanguagePickerProperties {
}

let language_modal = null;

function openLanguageModal() {
    language_modal = <LanguagePickerModal />;
    openModal(language_modal);
}

function language_sorter(a, b) {
    if (a === "auto") { return -1; }
    if (b === "auto") { return 1; }
    if (languages[a] < languages[b]) { return -1; }
    if (languages[a] > languages[b]) { return 1; }
    return 0;
}

export let LanguagePicker = (props: LanguagePickerProperties) => (
    <span className="LanguagePicker fakelink" onClick={openLanguageModal}>
        <i className="fa fa-language"/>
        {languages[current_language]}
    </span>
);

class LanguagePickerModal extends Modal<Events, LanguagePickerProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            selected_language: current_language
        };
    }

    setLanguage(language_code) {
        preferences.set("language", language_code);
        setCurrentLanguage(language_code);
        this.close();
        window.location.reload();
    }

    render() {
        let auto = preferences.get("language") === "auto";
        function computeClass(lc) {
            let ret = "";
            if (auto) {
                if (lc === "auto") {
                    ret += "selected";
                }
                else if (lc === current_language) {
                    ret += "auto";
                }
            } else {
                if (lc === current_language) {
                    ret += "selected";
                }
            }
            return ret;
        }

        return (
            <div className="Modal LanguagePickerModal">
                <div className="body">
                {
                    Object.keys(languages).sort(language_sorter).map((lc, idx) => (
                        <span key={idx} className={computeClass(lc) + " fakelink language-option"}
                              onClick={() => this.setLanguage(lc)}>{languages[lc]}</span>
                    ))
                }
                </div>
                <div className="footer">
                    <button onClick={this.close}>{_("Cancel")}</button>
                </div>
            </div>
        );
    }
}
