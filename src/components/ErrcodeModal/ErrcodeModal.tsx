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
import { Modal, openModal } from "@/components/Modal";
import { Errcode } from "@/components/Errcode";
import { MessageId } from "@/lib/messages";

interface Events {}

interface ErrcodeModalProperties {
    message_id: MessageId;
}

export class ErrcodeModal extends Modal<Events, ErrcodeModalProperties, any> {
    constructor(props: ErrcodeModalProperties) {
        super(props);
    }

    render() {
        let header: React.ReactElement | null = null;
        let body: React.ReactElement | null = null;

        switch (this.props.message_id) {
            case "ai_review_queue_full":
                header = <i className="fa fa-clock-o" />;
                break;
        }

        body = <Errcode message_id={this.props.message_id} />;

        return (
            <div className="Modal ErrcodeModal">
                {header && <div className="header">{header}</div>}
                <div className="body">{body}</div>
                <div className="buttons">
                    <button className="primary" onClick={this.close}>
                        {_("OK")}
                    </button>
                </div>
            </div>
        );
    }
}

export function errcodeAlerter(err_obj: { errcode: MessageId }): void {
    openModal(<ErrcodeModal message_id={err_obj.errcode} />);
}
