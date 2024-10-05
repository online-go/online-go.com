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
import { pgettext, _ } from "@/lib/translate";
import { Modal, openModal } from "@/components/Modal";

interface Events {}

interface SGFPasteModalProperties {
    onUpload: (rawSGF: string, filename: string) => void;
}

export class SGFPasteModal extends Modal<Events, SGFPasteModalProperties, any> {
    static fallbackFilename: string =
        pgettext("Fallback filename for pasted SGF data", "pasted") + ".sgf";

    constructor(props: SGFPasteModalProperties) {
        super(props);
        this.state = {
            defaultFilename: SGFPasteModal.fallbackFilename,
            filenameOverride: undefined,
            rawSGF: undefined,
        };
    }

    updateFilename = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ filenameOverride: this.sanitizeFilename(ev.target.value) });
    };

    updateData = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        const data = ev.target.value;
        const filename = this.extractFilename(data);
        this.setState({ defaultFilename: this.sanitizeFilename(filename) });
        this.setState({ rawSGF: data });
    };

    uploadSGF = () => {
        let filename = this.state.filenameOverride || this.state.defaultFilename;
        if (!filename.endsWith(".sgf")) {
            filename += ".sgf";
        }
        this.props.onUpload(this.state.rawSGF, filename);
        this.close();
    };

    extractFilename = (sgfData: string) => {
        const gameNameMatch = this.getSGFPropertyRegex("GN").exec(sgfData);
        if (gameNameMatch) {
            return `${gameNameMatch[1]}.sgf"`;
        }
        const playerBlackMatch = this.getSGFPropertyRegex("PB").exec(sgfData);
        const playerWhiteMatch = this.getSGFPropertyRegex("PW").exec(sgfData);
        if (playerBlackMatch && playerWhiteMatch) {
            return `${playerBlackMatch[1]} ${_("vs.")} ${playerWhiteMatch[1]}.sgf`;
        }
        return SGFPasteModal.fallbackFilename;
    };

    sanitizeFilename = (filename: string) => {
        return filename.replace(/[:<>\n\r\\|\\?\\*\\"\/\\]/g, "");
    };

    // Using [^\\]]+? to non-greedily match more than one of anything but the ']' character ensures
    // that an empty property like "GN[]" is *not* matched, and that something like GN[]PB[name]
    // doesn't result in "]PB[name" as a match.
    getSGFPropertyRegex = (property: string) => new RegExp(`${property}\\[([^\\]]+?)\\]`);

    render() {
        return (
            <div className="Modal SGFPasteModal">
                <div className="filename">
                    <textarea
                        rows={1}
                        placeholder={this.state.defaultFilename}
                        value={this.state.filenameOverride}
                        onChange={this.updateFilename}
                    />
                </div>
                <div className="body">
                    <textarea
                        placeholder={_("Paste SGF data here")}
                        value={this.state.rawSGF}
                        onChange={this.updateData}
                    />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button
                        className="primary bold"
                        onClick={this.uploadSGF}
                        disabled={!this.state.rawSGF}
                    >
                        {_("Upload")}
                    </button>
                </div>
            </div>
        );
    }
}

export function openSGFPasteModal(onUpload: (rawSGF: string, filename: string) => void) {
    // Note: this modal is deliberately not fastDismiss, because we don't want to accidentally dismiss while drag-selecting a large area of text.
    return openModal(<SGFPasteModal onUpload={onUpload} />);
}
