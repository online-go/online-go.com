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

type VoteUserLike = {
    id?: number | string;
    username?: string;
    user?: {
        id?: number | string;
        username?: string;
    };
};

function getVoteUsername(user: VoteUserLike | string | null | undefined): string {
    if (!user) {
        return "";
    }

    if (typeof user === "string") {
        return user;
    }

    return user.username ?? user.user?.username ?? "";
}

function getVoteKey(user: VoteUserLike | string | null | undefined, index: number): string {
    if (!user) {
        return `vote-${index}`;
    }

    if (typeof user === "string") {
        return `${user}-${index}`;
    }

    return String(user.id ?? user.user?.id ?? user.username ?? user.user?.username ?? index);
}

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

function VoteAvatarStack({
    users,
    emptyLabel,
}: {
    users: Array<VoteUserLike | string>;
    emptyLabel: string;
}): React.ReactElement {
    if (users.length === 0) {
        return <div className="proposal-vote-empty">{emptyLabel}</div>;
    }

    const visibleUsers = users.slice(0, 4);
    const overflow = users.length - visibleUsers.length;

    return (
        <div className="proposal-vote-avatars">
            {visibleUsers.map((user, index) => {
                const username = getVoteUsername(user);

                return (
                    <span
                        key={getVoteKey(user, index)}
                        className="proposal-voter-avatar"
                        title={
                            username ||
                            pgettext("Fallback tooltip label for a vote avatar in kibitz", "Voter")
                        }
                        aria-label={
                            username ||
                            pgettext("Fallback aria label for a vote avatar in kibitz", "Voter")
                        }
                    >
                        {getInitials(username)}
                    </span>
                );
            })}
            {overflow > 0 ? (
                <span
                    className="proposal-voter-avatar proposal-voter-avatar-overflow"
                    title={interpolate(
                        pgettext(
                            "Tooltip for additional hidden vote avatars in kibitz",
                            "+{{count}} more voters",
                        ),
                        { count: overflow },
                    )}
                >
                    +{overflow}
                </span>
            ) : null}
        </div>
    );
}

export function KibitzProposalBar({
    proposal,
    onVote,
}: KibitzProposalBarProps): React.ReactElement | null {
    if (!proposal || !proposal.vote_state) {
        return null;
    }

    const changeVotes = proposal.vote_state.change_votes ?? [];
    const keepVotes = proposal.vote_state.keep_votes ?? [];
    const totalVotes = changeVotes.length + keepVotes.length;
    const changeLeading = changeVotes.length > keepVotes.length;
    const keepLeading = keepVotes.length > changeVotes.length;

    return (
        <div className="KibitzProposalBar">
            <div className="proposal-announcement">
                <div className="proposal-announcement-main">
                    <span
                        className="proposal-proposer-avatar"
                        title={proposal.proposer.username}
                        aria-hidden="true"
                    >
                        {getInitials(proposal.proposer.username)}
                    </span>
                    <div className="proposal-announcement-copy">
                        <div className="proposal-summary-line">
                            <span className="proposal-summary-prefix">
                                {interpolate(
                                    pgettext(
                                        "Compact proposal summary prefix shown above the kibitz board area",
                                        "{{username}} proposes to watch",
                                    ),
                                    { username: proposal.proposer.username },
                                )}
                            </span>
                            <span className="proposal-title">{proposal.proposed_game.title}</span>
                        </div>
                        <div className="proposal-game-meta">
                            {interpolate(
                                pgettext(
                                    "Proposed game metadata shown in the kibitz proposal bar",
                                    "{{black}} vs {{white}} | {{size}} | Move {{move_number}}",
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
                </div>
                <div className="proposal-live-status">
                    {interpolate(
                        pgettext(
                            "Live vote status shown in the kibitz proposal bar",
                            "Live vote | {{count}} total votes",
                        ),
                        { count: totalVotes },
                    )}
                </div>
            </div>

            <div className="proposal-vote-rail">
                <div className={"proposal-choice change" + (changeLeading ? " leading" : "")}>
                    <div className="proposal-choice-main">
                        <div className="proposal-choice-label-row">
                            <span className="proposal-choice-label">
                                {pgettext(
                                    "Label for the change-board vote lane in kibitz",
                                    "Change board",
                                )}
                            </span>
                            <span className="proposal-vote-count">{changeVotes.length}</span>
                        </div>
                        <VoteAvatarStack
                            users={changeVotes as Array<VoteUserLike | string>}
                            emptyLabel={pgettext(
                                "Empty state for the change vote lane in kibitz",
                                "No votes yet",
                            )}
                        />
                    </div>
                    <button
                        type="button"
                        className="proposal-action primary"
                        onClick={() => onVote(proposal.id, "change")}
                    >
                        {pgettext("Vote button in kibitz proposal bar", "Vote")}
                    </button>
                </div>

                <div className={"proposal-choice keep" + (keepLeading ? " leading" : "")}>
                    <div className="proposal-choice-main">
                        <div className="proposal-choice-label-row">
                            <span className="proposal-choice-label">
                                {pgettext(
                                    "Label for the keep-current vote lane in kibitz",
                                    "Keep current",
                                )}
                            </span>
                            <span className="proposal-vote-count">{keepVotes.length}</span>
                        </div>
                        <VoteAvatarStack
                            users={keepVotes as Array<VoteUserLike | string>}
                            emptyLabel={pgettext(
                                "Empty state for the keep vote lane in kibitz",
                                "No votes yet",
                            )}
                        />
                    </div>
                    <button
                        type="button"
                        className="proposal-action secondary"
                        onClick={() => onVote(proposal.id, "keep")}
                    >
                        {pgettext("Vote button in kibitz proposal bar", "Vote")}
                    </button>
                </div>
            </div>
        </div>
    );
}
