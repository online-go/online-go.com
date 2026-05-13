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
import "./KibitzProposalQueue.css";

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function KibitzProposalQueue({
    proposals,
}: {
    proposals: KibitzProposal[];
}): React.ReactElement | null {
    if (proposals.length === 0) {
        return null;
    }

    return (
        <div className="KibitzProposalQueue">
            <div className="queue-title">
                {pgettext("Heading for the proposal queue in kibitz", "Proposal queue")}
            </div>
            <div className="queue-items">
                {proposals.map((proposal) => {
                    const voteState = proposal.vote_state;
                    const totalVotes =
                        (voteState?.change_votes.length ?? 0) + (voteState?.keep_votes.length ?? 0);

                    return (
                        <div key={proposal.id} className={"queue-item " + proposal.status}>
                            <div className="queue-item-primary">
                                <div className="queue-item-top">
                                    <span className={"queue-status-pill " + proposal.status}>
                                        {proposal.status === "active"
                                            ? pgettext(
                                                  "Status pill for an active board proposal in kibitz",
                                                  "Live vote",
                                              )
                                            : pgettext(
                                                  "Status pill for a queued board proposal in kibitz",
                                                  "Queued",
                                              )}
                                    </span>
                                    <div className="queue-proposer">
                                        <span className="queue-proposer-avatar" aria-hidden="true">
                                            {getInitials(proposal.proposer.username)}
                                        </span>
                                        <span className="queue-proposer-name">
                                            {proposal.proposer.username}
                                        </span>
                                    </div>
                                </div>
                                <div className="queue-game">{proposal.proposed_game.title}</div>
                                <div className="queue-meta">
                                    {interpolate(
                                        pgettext(
                                            "Metadata line for a queued kibitz proposal",
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
                            <div className="queue-item-side">
                                {proposal.status === "active" ? (
                                    <span className="queue-vote-summary">
                                        {interpolate(
                                            pgettext(
                                                "Vote summary shown for an active proposal in the kibitz queue",
                                                "{{count}} votes",
                                            ),
                                            { count: totalVotes },
                                        )}
                                    </span>
                                ) : (
                                    <span className="queue-vote-summary queued-label">
                                        {pgettext(
                                            "Label shown for queued proposals in the kibitz queue",
                                            "Waiting",
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
