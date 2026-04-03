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
import { pgettext } from "@/lib/translate";
import type { KibitzProposal } from "@/models/kibitz";
import "./KibitzProposalQueue.css";

interface KibitzProposalQueueProps {
    proposals: KibitzProposal[];
}

export function KibitzProposalQueue({
    proposals,
}: KibitzProposalQueueProps): React.ReactElement | null {
    if (proposals.length === 0) {
        return null;
    }

    return (
        <div className="KibitzProposalQueue">
            <div className="queue-title">
                {pgettext("Heading for the proposal queue in kibitz", "Proposal queue")}
            </div>
            <div className="queue-items">
                {proposals.map((proposal) => (
                    <div key={proposal.id} className={"queue-item " + proposal.status}>
                        <span className="queue-game">{proposal.proposed_game.title}</span>
                        <span className="queue-status">{proposal.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
