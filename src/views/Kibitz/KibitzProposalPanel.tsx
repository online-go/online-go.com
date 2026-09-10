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
import type { KibitzProposal } from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import "./KibitzProposalPanel.css";

export interface KibitzProposalPanelProps {
    activeProposal: KibitzProposal | undefined;
    queuedProposals: KibitzProposal[];
    onVote: (proposalId: string, choice: "change" | "keep") => void;
}

export function KibitzProposalPanel({
    activeProposal,
    queuedProposals,
    onVote,
}: KibitzProposalPanelProps): React.ReactElement | null {
    if (!activeProposal && queuedProposals.length === 0) {
        return null;
    }
    return (
        <div className="KibitzProposalPanel">
            <KibitzProposalBar proposal={activeProposal} onVote={onVote} />
            <KibitzProposalQueue proposals={queuedProposals} />
        </div>
    );
}
