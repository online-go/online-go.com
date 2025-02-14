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
import { _, setCurrentLanguage, current_language, languages } from "@/lib/translate";
import * as preferences from "@/lib/preferences";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";

function language_sorter(a: string, b: string) {
    if (a === "auto") {
        return -1;
    }
    if (b === "auto") {
        return 1;
    }
    if (languages[a] < languages[b]) {
        return -1;
    }
    if (languages[a] > languages[b]) {
        return 1;
    }
    return 0;
}

export function LanguagePicker(): React.ReactElement {
    const { showModal } = React.useContext(ModalContext);

    return (
        <span
            className="LanguagePicker fakelink"
            onClick={() => showModal(ModalTypes.LanguagePicker)}
        >
            <i className="fa fa-language" />
            {languages[current_language]}
        </span>
    );
}

export function LanguagePickerModal(): React.ReactElement {
    const { hideModal } = React.useContext(ModalContext);

    const setLanguage = (language_code: string) => {
        preferences.set("language", language_code);
        setCurrentLanguage(language_code);
        window.location.reload();
    };

    const auto = preferences.get("language") === "auto";
    function computeClass(lc: string) {
        let ret = "";
        if (auto) {
            if (lc === "auto") {
                ret += "selected";
            } else if (lc === current_language) {
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
                {Object.keys(languages)
                    .sort(language_sorter)
                    .map((lc, idx) => (
                        <span
                            key={idx}
                            className={computeClass(lc) + " fakelink language-option"}
                            onClick={() => setLanguage(lc)}
                        >
                            {languages[lc]}
                        </span>
                    ))}
            </div>
            <div className="footer">
                <button onClick={hideModal}>{_("Cancel")}</button>
            </div>
        </div>
    );
}
