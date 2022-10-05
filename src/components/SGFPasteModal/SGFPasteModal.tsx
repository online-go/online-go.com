/*
 * Copyright (C) 2012-2021  Online-Go.com
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
import { _ } from "translate";
import { Modal, openModal } from "Modal";

interface Events {}

interface SGFPasteModalProperties {
    onUpload: (rawSGF: string, filename: string) => void;
}

export class SGFPasteModal extends Modal<Events, SGFPasteModalProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            defaultFilename: _("pasted.sgf"),
            filenameOverride: undefined,
            rawSGF: undefined,
        };
    }

    updateFilename = (ev) => {
        this.setState({ filenameOverride: ev.target.value });
    };

    updateData = (ev) => {
        const data = ev.target.value;
        const gameNameRegex = /GN\[([\w\s]+)\]/;
        const matches = gameNameRegex.exec(data);
        if (matches) {
            const name = matches[1] + ".sgf";
            this.setState({ defaultFilename: name });
        } else {
            this.setState({ defaultFilename: _("pasted.sgf") });
        }
        this.setState({ rawSGF: data });
    };

    uploadSGF = () => {
        let filename = this.state.defaultFilename;
        if (this.state.filenameOverride) {
            filename = this.state.filenameOverride;
            if (!filename.endsWith(".sgf")) {
                filename += ".sgf";
            }
        }
        this.props.onUpload(this.state.rawSGF, filename);
        this.close();
    };

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
