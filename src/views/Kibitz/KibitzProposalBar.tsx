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
import * as data from "@/lib/data";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzProposal } from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import "./KibitzProposalBar.css";

// cspell:ignore cooldown

const PROPOSAL_PREVIEW_SIZE = 44;

interface KibitzProposalBarProps {
    proposal?: KibitzProposal;
    onVote: (proposalId: string, choice: "change" | "keep") => void;
}

type VoteUserLike = {
    id?: number | string;
    username?: string;
    icon?: string;
    user?: {
        id?: number | string;
        username?: string;
        icon?: string;
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

function getVoteIcon(user: VoteUserLike | string | null | undefined): string | undefined {
    if (!user || typeof user === "string") {
        return undefined;
    }

    return user.icon ?? user.user?.icon;
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

function formatCountdown(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ProposalAvatar({
    user,
    className,
}: {
    user: VoteUserLike | null | undefined;
    className: string;
}): React.ReactElement {
    const username = getVoteUsername(user);
    const icon = getVoteIcon(user);

    return (
        <span
            className={className}
            title={
                username || pgettext("Fallback tooltip label for a vote avatar in kibitz", "Voter")
            }
            aria-label={
                username || pgettext("Fallback aria label for a vote avatar in kibitz", "Voter")
            }
        >
            {icon ? (
                <img className="proposal-avatar-image" src={icon} alt="" aria-hidden="true" />
            ) : (
                getInitials(username)
            )}
        </span>
    );
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

    const visibleUsers = users.slice(0, 3);
    const overflow = users.length - visibleUsers.length;

    return (
        <div className="proposal-vote-avatars">
            {visibleUsers.map((user, index) => (
                <ProposalAvatar
                    key={getVoteKey(user, index)}
                    user={typeof user === "string" ? { username: user } : user}
                    className="proposal-voter-avatar"
                />
            ))}
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
    const endsAt = proposal?.vote_state?.ends_at ?? null;
    const [now, setNow] = React.useState(() => Date.now());
    const [isPreviewExpanded, setIsPreviewExpanded] = React.useState(false);

    React.useEffect(() => {
        if (!proposal || !proposal.vote_state || !endsAt) {
            return;
        }

        setNow(Date.now());
        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [endsAt, proposal]);

    React.useEffect(() => {
        setIsPreviewExpanded(false);
    }, [proposal?.id]);

    if (!proposal || !proposal.vote_state) {
        return null;
    }

    const changeVotes = proposal.vote_state.change_votes ?? [];
    const keepVotes = proposal.vote_state.keep_votes ?? [];
    const currentUserId = data.get("config.user")?.id ?? data.get("user")?.id ?? 0;
    const hasVotedChange = changeVotes.some((entry) => entry.id === currentUserId);
    const hasVotedKeep = keepVotes.some((entry) => entry.id === currentUserId);
    const changeLeading = changeVotes.length > keepVotes.length;
    const keepLeading = keepVotes.length > changeVotes.length;
    const tied = !changeLeading && !keepLeading;
    const remainingMs = endsAt ? Math.max(0, endsAt - now) : 0;
    const voteWindowMs = Math.max(1, (proposal.cooldown_seconds ?? 0) * 1000);
    const progressRatio = endsAt ? Math.max(0, Math.min(1, remainingMs / voteWindowMs)) : 0;
    const countdownText = endsAt
        ? formatCountdown(remainingMs)
        : pgettext("Fallback timer text in kibitz proposal bar", "--:--");

    return (
        <div className="KibitzProposalBar">
            <div className="proposal-announcement">
                <div className="proposal-announcement-main">
                    <ProposalAvatar user={proposal.proposer} className="proposal-proposer-avatar" />
                    <div className="proposal-announcement-copy">
                        <div className="proposal-summary-prefix">
                            {interpolate(
                                pgettext(
                                    "Compact proposal summary prefix shown above the kibitz board area",
                                    "{{username}} proposes to watch",
                                ),
                                { username: proposal.proposer.username },
                            )}
                        </div>
                        <div className="proposal-title">{proposal.proposed_game.title}</div>
                        <div className="proposal-game-meta">
                            {interpolate(
                                pgettext(
                                    "Proposed game metadata shown in the kibitz proposal bar",
                                    "{{black}} vs {{white}} · {{size}} · Move {{move_number}}",
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
                <div className="proposal-announcement-side">
                    <button
                        type="button"
                        className={
                            "proposal-preview-toggle" + (isPreviewExpanded ? " expanded" : "")
                        }
                        onClick={() => setIsPreviewExpanded((expanded) => !expanded)}
                        aria-expanded={isPreviewExpanded}
                        aria-label={
                            isPreviewExpanded
                                ? pgettext(
                                      "Aria label for collapsing the proposal board preview in kibitz",
                                      "Hide proposal board preview",
                                  )
                                : pgettext(
                                      "Aria label for expanding the proposal board preview in kibitz",
                                      "Show proposal board preview",
                                  )
                        }
                        title={
                            isPreviewExpanded
                                ? pgettext(
                                      "Tooltip label for collapsing the proposal board preview in kibitz",
                                      "Hide board",
                                  )
                                : pgettext(
                                      "Tooltip label for expanding the proposal board preview in kibitz",
                                      "Preview board",
                                  )
                        }
                    >
                        <span className="proposal-preview-thumb">
                            <KibitzBoard
                                gameId={
                                    proposal.proposed_game.mock_game_data
                                        ? undefined
                                        : proposal.proposed_game.game_id
                                }
                                json={proposal.proposed_game.mock_game_data}
                                className="proposal-preview-board-surface"
                                size={PROPOSAL_PREVIEW_SIZE}
                                showLabels={false}
                                fitMode="contain"
                            />
                        </span>
                    </button>
                </div>
            </div>

            <div className="proposal-vote-rail">
                <div className="proposal-choice change">
                    <div className="proposal-choice-main">
                        <div className="proposal-choice-label-row">
                            <span
                                className={
                                    "proposal-choice-label" +
                                    (changeLeading ? " leading" : tied ? " tied" : "")
                                }
                            >
                                {pgettext(
                                    "Label for the change-board vote lane in kibitz",
                                    "Change board",
                                )}
                            </span>
                            <span
                                className={
                                    "proposal-vote-count" +
                                    (changeLeading ? " leading" : tied ? " tied" : "")
                                }
                            >
                                {changeVotes.length}
                            </span>
                        </div>
                        <VoteAvatarStack
                            users={changeVotes as Array<VoteUserLike | string>}
                            emptyLabel={pgettext(
                                "Empty state for the change vote lane in kibitz",
                                "No votes yet",
                            )}
                        />
                        <button
                            type="button"
                            className={
                                "proposal-action " +
                                (hasVotedChange || changeLeading ? "primary" : "secondary")
                            }
                            onClick={() => onVote(proposal.id, "change")}
                        >
                            {hasVotedChange
                                ? pgettext("Vote button in kibitz proposal bar", "Voted")
                                : pgettext("Vote button in kibitz proposal bar", "Vote")}
                        </button>
                    </div>
                </div>

                <div className="proposal-timer-spine">
                    <div className="proposal-timer-value">{countdownText}</div>
                    <div className="proposal-timer-label">
                        {pgettext("Compact remaining-time label in kibitz proposal bar", "left")}
                    </div>
                    <div className="proposal-timer-track" aria-hidden="true">
                        <div
                            className="proposal-timer-fill"
                            style={{ transform: `scaleY(${progressRatio})` }}
                        />
                    </div>
                </div>

                <div className="proposal-choice keep">
                    <div className="proposal-choice-main">
                        <div className="proposal-choice-label-row">
                            <span
                                className={
                                    "proposal-choice-label" +
                                    (keepLeading ? " leading" : tied ? " tied" : "")
                                }
                            >
                                {pgettext(
                                    "Label for the keep-current vote lane in kibitz",
                                    "Keep current",
                                )}
                            </span>
                            <span
                                className={
                                    "proposal-vote-count" +
                                    (keepLeading ? " leading" : tied ? " tied" : "")
                                }
                            >
                                {keepVotes.length}
                            </span>
                        </div>
                        <VoteAvatarStack
                            users={keepVotes as Array<VoteUserLike | string>}
                            emptyLabel={pgettext(
                                "Empty state for the keep vote lane in kibitz",
                                "No votes yet",
                            )}
                        />
                        <button
                            type="button"
                            className={
                                "proposal-action " +
                                (hasVotedKeep || keepLeading ? "primary" : "secondary")
                            }
                            onClick={() => onVote(proposal.id, "keep")}
                        >
                            {hasVotedKeep
                                ? pgettext("Vote button in kibitz proposal bar", "Voted")
                                : pgettext("Vote button in kibitz proposal bar", "Vote")}
                        </button>
                    </div>
                </div>
            </div>

            {isPreviewExpanded ? (
                <div className="proposal-expanded-preview">
                    <div className="proposal-expanded-preview-header">
                        <div className="proposal-expanded-preview-copy">
                            <div className="proposal-expanded-preview-title">
                                {pgettext(
                                    "Heading shown above the expanded proposal board preview in kibitz",
                                    "Proposal board",
                                )}
                            </div>
                            <div className="proposal-expanded-preview-meta">
                                {interpolate(
                                    pgettext(
                                        "Expanded proposal board metadata shown in kibitz",
                                        "{{black}} vs {{white}} · {{size}} · Move {{move_number}}",
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
                        <button
                            type="button"
                            className="proposal-expanded-preview-close"
                            onClick={() => setIsPreviewExpanded(false)}
                        >
                            {pgettext(
                                "Button for collapsing the expanded proposal board preview in kibitz",
                                "Hide",
                            )}
                        </button>
                    </div>
                    <div className="proposal-expanded-board-wrap">
                        <KibitzBoard
                            gameId={
                                proposal.proposed_game.mock_game_data
                                    ? undefined
                                    : proposal.proposed_game.game_id
                            }
                            json={proposal.proposed_game.mock_game_data}
                            className="proposal-expanded-board-surface"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
