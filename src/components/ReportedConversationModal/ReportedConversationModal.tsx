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
import { Player } from "Player";
import { _ } from "translate";
import { Modal, openModal } from "Modal";
import { ReportedConversation } from "Report";

interface ReportedConversationModalProps {
    player_id: number;
    conversation: string | ReportedConversation;
}

interface Events {}

export class ReportedConversationModal extends Modal<Events, ReportedConversationModalProps, any> {
    constructor(props: ReportedConversationModalProps) {
        super(props);
    }

    render() {
        const conversation: string[] =
            typeof this.props.conversation === "object"
                ? typeof this.props.conversation.content === "string"
                    ? (this.props.conversation.content as string).split("\n")
                    : this.props.conversation.content
                : this.props.conversation.split("\n");

        return (
            <div className="Modal ReportedConversationModal">
                <div className="header">
                    <h2>
                        {_("Reported Conversation with")} <Player user={this.props.player_id} />
                    </h2>
                </div>
                <div className="body">
                    {conversation.map((line, index) => (
                        <div className="chatline" key={index}>
                            {line}
                        </div>
                    ))}
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

export function openReportedConversationModal(
    player_id: number,
    conversation: string | ReportedConversation,
) {
    console.log("openReportedConversationModal", player_id, conversation);
    return openModal(
        <ReportedConversationModal player_id={player_id} conversation={conversation} />,
    );
}
