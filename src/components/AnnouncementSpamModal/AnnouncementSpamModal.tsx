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
import { Modal } from "@/components/Modal";
import { Markdown } from "@/components/Markdown";

interface Events {}

interface AnnouncementSpamModalProperties {
    onProceed: () => void;
}

const MODAL_CONTENT = `## 📢 Rule: One Announcement Per Event

To keep the community clear and avoid disruption:

- **Post only one announcement per event.**  
  Do not create multiple announcements for individual games, streams, or related items.  

- **Consolidate all details and links** into a single, well-organized hub.  
  Acceptable places include:  
  - a **forum post** (recommended)  
  - an **external event website** (if you maintain one)  

- **Use your hub post to direct users** to all related content.  

This policy reduces pop-ups, prevents redundant alerts, and keeps the community space accessible for everyone.`;

export class AnnouncementSpamModal extends Modal<Events, AnnouncementSpamModalProperties, any> {
    constructor(props: AnnouncementSpamModalProperties) {
        super(props);
    }

    proceedAnyway = () => {
        this.props.onProceed();
        this.close();
    };

    render() {
        return (
            <div className="Modal AnnouncementSpamModal">
                <div className="header">
                    <h2>{_("Multiple Announcements Detected")}</h2>
                </div>
                <div className="body">
                    <Markdown source={MODAL_CONTENT} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button className="primary" onClick={this.proceedAnyway}>
                        {_("Proceed Anyway")}
                    </button>
                </div>
            </div>
        );
    }
}
