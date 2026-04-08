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
import { Link } from "react-router-dom";

import { _ } from "@/lib/translate";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import cached from "@/lib/cached";

import { Card } from "@/components/material";
import { post, get, abort_requests_in_flight } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { DismissableNotification } from "@/components/DismissableNotification";
import { FriendList } from "@/components/FriendList";
import { PlayButtons } from "./PlayButtons";
import { ProfileCard } from "@/components/ProfileCard";
import { InviteList } from "./InviteList";
import { ChallengesList } from "./ChallengesList";
import { notification_manager } from "@/components/Notifications";
import { ActiveAnnouncements } from "@/components/Announcements";
import { FabX } from "@/components/material";
import { ActiveTournamentList, Group } from "@/lib/types";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { DismissableMessages } from "@/components/DismissableMessages";
import { user_uploads_url } from "@/lib/cdn";
import { EmailBanner } from "@/components/EmailBanner";
import { PaymentProblemBanner } from "@/components/PaymentProblemBanner";
import { ActiveDroppedGameList } from "@/components/ActiveDroppedGameList";
import { ModerationOffer } from "@/components/ModerationOffer";
import { NewUserRankChooser } from "@/components/NewUserRankChooser";
import { FreeTrialBanner } from "@/components/FreeTrialBanner";
import { SupporterProblems } from "@/components/SupporterProblems";
import { FreeTrialSurvey } from "@/components/FreeTrialSurvey";
import { PriceIncreaseMessage } from "@/components/PriceIncreaseMessage";
import { HomeDebug, useHomeDebugState, shouldRender, isForced } from "./HomeDebug";
import { WhatsNewBanner } from "./WhatsNewBanner";
import "./Home.css";

declare let ogs_missing_translation_count: number;

type UserType = rest_api.UserConfig;
type ActiveGameType = rest_api.players.full.Game;

const DEFAULT_TITLE = "OGS";

export function Home(): React.ReactElement {
    const [forceShowSet, setForceShowSet] = useHomeDebugState();
    const [user, setUser] = React.useState<UserType | undefined>(data.get("config.user"));
    const [overview, setOverview] = React.useState<{ active_games: Array<ActiveGameType> }>({
        active_games: [],
    });
    const [resolved, setResolved] = React.useState(false);
    const [boardsToMoveOn, setBoardsToMoveOn] = React.useState(
        Object.keys(notification_manager.boards_to_move_on).length,
    );
    const [showTranslationDialog, setShowTranslationDialog] = React.useState(() => {
        try {
            if (
                ogs_missing_translation_count > 0 &&
                !preferences.get("translation-dialog-never-show") &&
                Date.now() - preferences.get("translation-dialog-dismissed") > 14 * 86400 * 1000
            ) {
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    });

    const refresh = React.useCallback(() => {
        abort_requests_in_flight("ui/overview");
        get("ui/overview")
            .then((result: { active_games: Array<ActiveGameType> }) => {
                setOverview(result);
                setResolved(true);
            })
            .catch((err) => {
                setResolved(true);
                errorAlerter(err);
            });
    }, []);

    // Set document title based on boards to move on
    React.useEffect(() => {
        const count = boardsToMoveOn ? `(${boardsToMoveOn}) ` : "";
        window.document.title = `${count}${DEFAULT_TITLE}`;
    }, [boardsToMoveOn]);

    // Subscribe to data and events on mount
    React.useEffect(() => {
        const updateUser = (u: UserType) => setUser(u);
        const onTurnCount = (count?: number) => setBoardsToMoveOn(count ?? 0);

        notification_manager.event_emitter.on("turn-count", onTurnCount);
        data.watch("config.user", updateUser);
        refresh();

        return () => {
            abort_requests_in_flight("ui/overview");
            notification_manager.event_emitter.off("turn-count", onTurnCount);
            window.document.title = DEFAULT_TITLE;
            data.unwatch("config.user", updateUser);
        };
    }, [refresh]);

    const dismissTranslationDialog = React.useCallback(() => {
        preferences.set("translation-dialog-dismissed", Date.now());
        setShowTranslationDialog(false);
    }, []);

    const neverShowTranslationDialog = React.useCallback(() => {
        preferences.set("translation-dialog-never-show", true);
        setShowTranslationDialog(false);
    }, []);

    return (
        <div id="Home-Container">
            <HomeDebug forceShowSet={forceShowSet} setForceShowSet={setForceShowSet} />
            {!!user && user.need_rank && user.starting_rank_hint === "not provided" ? (
                <>
                    <div className="welcome">{_("Welcome!")}</div>
                    <NewUserRankChooser />
                </>
            ) : (
                <div id="Home">
                    {shouldRender("PlayButtons") && (
                        <div className="play-buttons-column">
                            <PlayButtons />
                        </div>
                    )}
                    <div className="left">
                        <div className="top-bar-container">
                            {shouldRender("ChallengesList") && (
                                <ChallengesList onAccept={refresh} />
                            )}
                            {shouldRender("SupporterProblems") && (
                                <SupporterProblems
                                    forceShow={isForced(forceShowSet, "SupporterProblems")}
                                />
                            )}
                            {shouldRender("PriceIncreaseMessage") && (
                                <PriceIncreaseMessage
                                    forceShow={isForced(forceShowSet, "PriceIncreaseMessage")}
                                />
                            )}
                            {shouldRender("FreeTrialBanner") && (
                                <FreeTrialBanner
                                    forceShow={isForced(forceShowSet, "FreeTrialBanner")}
                                />
                            )}
                            {shouldRender("FreeTrialSurvey") && (
                                <FreeTrialSurvey
                                    forceShow={isForced(forceShowSet, "FreeTrialSurvey")}
                                />
                            )}
                            {shouldRender("DismissableMessages") && (
                                <DismissableMessages
                                    forceShow={isForced(forceShowSet, "DismissableMessages")}
                                />
                            )}
                            {shouldRender("EmailBanner") && (
                                <EmailBanner forceShow={isForced(forceShowSet, "EmailBanner")} />
                            )}
                            {shouldRender("PaymentProblemBanner") && (
                                <PaymentProblemBanner
                                    forceShow={isForced(forceShowSet, "PaymentProblemBanner")}
                                />
                            )}
                            {shouldRender("ModerationOffer") &&
                                (isForced(forceShowSet, "ModerationOffer") ||
                                    (user && !!user.offered_moderator_powers)) && (
                                    <ModerationOffer
                                        player_id={user?.id ?? 0}
                                        current_moderator_powers={user?.moderator_powers ?? 0}
                                        offered_moderator_powers={
                                            user?.offered_moderator_powers ?? 0
                                        }
                                    />
                                )}
                            {shouldRender("InviteList") && <InviteList />}

                            {((user && user.provisional) || null) && (
                                <DismissableNotification
                                    className="learn-how-to-play"
                                    dismissedKey="learn-how-to-play"
                                >
                                    <Link to="/learn-to-play-go">
                                        {_("New to Go? Click here to learn how to play!")}
                                    </Link>
                                </DismissableNotification>
                            )}
                        </div>

                        {shouldRender("ActiveDroppedGameList") && resolved && user && (
                            <ActiveDroppedGameList
                                games={overview.active_games}
                                user={user}
                                showCount={shouldRender("GameCount")}
                            ></ActiveDroppedGameList>
                        )}
                    </div>
                    <div className="right">
                        {shouldRender("ProfileCard") && <ProfileCard user={user} />}

                        <div className="home-categories">
                            {shouldRender("ActiveAnnouncements") && (
                                <ActiveAnnouncements
                                    forceShow={isForced(forceShowSet, "ActiveAnnouncements")}
                                />
                            )}
                            {shouldRender("WhatsNewBanner") && (
                                <WhatsNewBanner
                                    forceShow={isForced(forceShowSet, "WhatsNewBanner")}
                                />
                            )}

                            {showTranslationDialog && (
                                <Card className="translation-dialog">
                                    <FabX onClick={dismissTranslationDialog} />

                                    <div>
                                        {_(
                                            "Hello! Did you know that online-go.com is translated entirely volunteers in the Go community? Because of that, sometimes our translations get behind, like right now. In this language there are some missing translation strings. If you would like to help fix this, click the green button below, and thanks in advance!",
                                        )}
                                    </div>

                                    <a
                                        className="btn success"
                                        href="https://translate.online-go.com/"
                                    >
                                        {_("I'll help translate!")}
                                    </a>

                                    <button
                                        className="btn xs never-show-this-message-button"
                                        onClick={neverShowTranslationDialog}
                                    >
                                        {_("Never show this message")}
                                    </button>
                                </Card>
                            )}

                            {shouldRender("TournamentList") && (
                                <TournamentList
                                    forceShow={isForced(forceShowSet, "TournamentList")}
                                />
                            )}
                            {shouldRender("LadderList") && (
                                <LadderList forceShow={isForced(forceShowSet, "LadderList")} />
                            )}
                            {shouldRender("GroupList") && (
                                <GroupList forceShow={isForced(forceShowSet, "GroupList")} />
                            )}
                            {shouldRender("HomeFriendList") && (
                                <HomeFriendList
                                    forceShow={isForced(forceShowSet, "HomeFriendList")}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type InvitationType = rest_api.me.Invitation;

function GroupList({ forceShow }: { forceShow?: boolean }): React.ReactElement | null {
    const [groups, setGroups] = React.useState<Group[]>([]);
    const [invitations, setInvitations] = React.useState<InvitationType[]>([]);

    React.useEffect(() => {
        const updateGroups = (g?: Group[]) => {
            if (g) {
                setGroups(g);
            }
        };
        const updateInvitations = (inv?: InvitationType[]) => {
            if (inv) {
                setInvitations(inv);
            }
        };

        data.watch(cached.groups, updateGroups);
        data.watch(cached.group_invitations, updateInvitations);

        return () => {
            data.unwatch(cached.groups, updateGroups);
            data.unwatch(cached.group_invitations, updateInvitations);
        };
    }, []);

    const acceptInvite = (invite: { id: number }) => {
        post("me/groups/invitations", { request_id: invite.id })
            .then(() => 0)
            .catch(() => 0);
    };

    const rejectInvite = (invite: { id: number }) => {
        post("me/groups/invitations", { request_id: invite.id, delete: true })
            .then(() => 0)
            .catch(() => 0);
    };

    if (!forceShow && groups.length === 0 && invitations.length === 0) {
        return null;
    }

    return (
        <>
            <h3>
                <Link to="/groups">
                    <i className="fa fa-users"></i> {_("Groups")}
                </Link>
            </h3>
            <div className="Home-GroupList">
                {invitations.map((invite) => (
                    <div className="invite" key={invite.id}>
                        <i className="fa fa-times" onClick={() => rejectInvite(invite)} />
                        <i className="fa fa-check" onClick={() => acceptInvite(invite)} />
                        <Link key={invite.group.id} to={`/group/${invite.group.id}`}>
                            <img src={user_uploads_url(invite.group.icon, 32)} />{" "}
                            {invite.group.name}
                        </Link>
                    </div>
                ))}
                {groups.map((group) => (
                    <Link key={group.id} to={`/group/${group.id}`}>
                        <img src={user_uploads_url(group.icon, 32)} /> {group.name}
                    </Link>
                ))}
            </div>
        </>
    );
}

function TournamentList({ forceShow }: { forceShow?: boolean }): React.ReactElement | null {
    const [tournaments, setTournaments] = React.useState<ActiveTournamentList>([]);
    const [tournamentInvitations, setTournamentInvitations] = React.useState<
        rest_api.me.TournamentInvitation[]
    >([]);

    React.useEffect(() => {
        const update = (t?: ActiveTournamentList) => {
            if (t) {
                setTournaments(t);
            }
        };
        const updateInvitations = (inv?: rest_api.me.TournamentInvitation[]) => {
            if (inv) {
                setTournamentInvitations(inv);
            }
        };

        data.watch(cached.active_tournaments, update);
        data.watch(cached.tournament_invitations, updateInvitations);

        return () => {
            data.unwatch(cached.active_tournaments, update);
            data.unwatch(cached.tournament_invitations, updateInvitations);
        };
    }, []);

    const acceptInvite = (invite: rest_api.me.TournamentInvitation) => {
        post("me/tournaments/invitations", { request_id: invite.id })
            .then(() => 0)
            .catch(() => 0);
    };

    const rejectInvite = (invite: rest_api.me.TournamentInvitation) => {
        post("me/tournaments/invitations", { request_id: invite.id, delete: true })
            .then(() => 0)
            .catch(() => 0);
    };

    if (!forceShow && tournaments.length === 0 && tournamentInvitations.length === 0) {
        return null;
    }

    return (
        <>
            <h3>
                <Link to="/tournaments">
                    <i className="fa fa-trophy"></i> {_("Tournaments")}
                </Link>
            </h3>
            <div className="Home-TournamentList">
                {tournamentInvitations.map((invite) => (
                    <div className="invite" key={invite.id}>
                        <i className="fa fa-times" onClick={() => rejectInvite(invite)} />
                        <i className="fa fa-check" onClick={() => acceptInvite(invite)} />
                        <Link to={`/tournament/${invite.tournament.id}`}>
                            <img src={user_uploads_url(invite.tournament.icon, 32)} />{" "}
                            {invite.tournament.name}
                        </Link>
                    </div>
                ))}
                {tournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
                        <img src={user_uploads_url(tournament.icon, 32)} /> {tournament.name}
                    </Link>
                ))}
            </div>
        </>
    );
}

function HomeFriendList({ forceShow }: { forceShow?: boolean }): React.ReactElement | null {
    const [friends, setFriends] = React.useState<PlayerCacheEntry[]>([]);
    const [friendInvitations, setFriendInvitations] = React.useState<rest_api.FriendInvitations>(
        [],
    );

    React.useEffect(() => {
        const update = (f?: PlayerCacheEntry[]) => {
            if (f) {
                setFriends(f);
            }
        };
        const updateInvitations = (inv?: rest_api.FriendInvitations) => {
            if (inv) {
                setFriendInvitations(inv);
            }
        };

        data.watch(cached.friends, update);
        data.watch(cached.friend_invitations, updateInvitations);

        return () => {
            data.unwatch(cached.friends, update);
            data.unwatch(cached.friend_invitations, updateInvitations);
        };
    }, []);

    if (!forceShow && friends.length === 0 && friendInvitations.length === 0) {
        return null;
    }

    return (
        <>
            <h3>
                <Link to="/chat">
                    <i className="fa fa-comment-o"></i> {_("Chat with friends")}
                </Link>
            </h3>
            <FriendList />
        </>
    );
}

type LadderType = rest_api.me.Ladder;

function LadderList({ forceShow }: { forceShow?: boolean }): React.ReactElement | null {
    const [ladders, setLadders] = React.useState<LadderType[]>([]);

    React.useEffect(() => {
        const update = (l?: LadderType[]) => {
            if (l) {
                setLadders(l);
            }
        };

        data.watch(cached.ladders, update);

        return () => {
            data.unwatch(cached.ladders, update);
        };
    }, []);

    if (!forceShow && ladders.length === 0) {
        return null;
    }

    return (
        <>
            <h3>
                <Link to="/ladders">
                    <i className="fa fa-list-ol"></i> {_("Ladders")}
                </Link>
            </h3>
            <div className="Home-LadderList">
                {ladders.map((ladder) => (
                    <Link key={ladder.id} to={`/ladder/${ladder.id}`}>
                        <span className="ladder-rank">#{ladder.player_rank}</span> {ladder.name}
                    </Link>
                ))}
            </div>
        </>
    );
}
