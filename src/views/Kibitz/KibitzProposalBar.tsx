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
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzProposal } from "@/models/kibitz";
import "./KibitzProposalBar.css";

interface KibitzProposalBarProps {
    proposal?: KibitzProposal;
    onVote: (proposalId: string, choice: "change" | "keep") => void;
}

export function KibitzProposalBar({
    proposal,
    onVote,
}: KibitzProposalBarProps): React.ReactElement | null {
    if (!proposal || !proposal.vote_state) {
        return null;
    }

    return (
        <div className="KibitzProposalBar">
            <div className="proposal-copy">
                <div className="proposal-summary">
                    {interpolate(
                        pgettext(
                            "Proposal summary shown above the kibitz board area",
                            "{{username}} proposed switching main game to {{title}}",
                        ),
                        {
                            username: proposal.proposer.username,
                            title: proposal.proposed_game.title,
                        },
                    )}
                </div>
                <div className="proposal-game-meta">
                    {interpolate(
                        pgettext(
                            "Proposed game metadata shown in the kibitz proposal bar",
                            "{{black}} vs {{white}} | Board {{size}} | Move {{move_number}}",
                        ),
                        {
                            black: proposal.proposed_game.black.username,
                            white: proposal.proposed_game.white.username,
                            size: proposal.proposed_game.board_size,
                            move_number: proposal.proposed_game.move_number ?? 0,
                        },
                    )}
                </div>
            </div>
            <div className="proposal-controls">
                <div className="proposal-votes">
                    <span>
                        {interpolate(pgettext("Change board vote count", "Change {{count}}"), {
                            count: proposal.vote_state.change_votes.length,
                        })}
                    </span>
                    <span>
                        {interpolate(pgettext("Keep board vote count", "Keep {{count}}"), {
                            count: proposal.vote_state.keep_votes.length,
                        })}
                    </span>
                </div>
                <div className="proposal-actions">
                    <button type="button" onClick={() => onVote(proposal.id, "change")}>
                        {pgettext("Vote button in kibitz proposal bar", "Change board")}
                    </button>
                    <button type="button" onClick={() => onVote(proposal.id, "keep")}>
                        {pgettext("Vote button in kibitz proposal bar", "Keep current")}
                    </button>
                </div>
            </div>
        </div>
    );
}
