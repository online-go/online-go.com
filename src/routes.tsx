/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Router, Route, Switch, Redirect } from "react-router-dom";

import * as data from "data";
import { _ } from "translate";
import { browserHistory } from "./ogsHistory";

import { ErrorBoundary } from "ErrorBoundary";
import { NavBar } from "NavBar";
import { Announcements } from "Announcements";
import { SignIn } from "SignIn";
import { Register } from "Register";
import { Overview } from "Overview";
import { Admin, MerchantLog } from "Admin";
import { ChatView } from "ChatView";
import { Developer } from "Developer";
import { Game } from "Game";
import { Joseki } from "Joseki";
import { Group } from "Group";
import { GroupCreate } from "GroupCreate";
import { GroupList } from "GroupList";
import { Ladder } from "Ladder";
import { LadderList } from "LadderList";
import { LeaderBoard } from "LeaderBoard";
import { LibraryPlayer } from "LibraryPlayer";
import { Play } from "Play";
import { Moderator } from "Moderator";
import { ObserveGames } from "ObserveGames";
import { Puzzle } from "Puzzle";
import { PuzzleList } from "PuzzleList";
import { PuzzleCollectionList, PuzzleCollection } from "PuzzleCollection";
import { Supporter } from "Supporter";
import { Tournament } from "Tournament";
import { TournamentRecord } from "TournamentRecord";
import { TournamentListMainView } from "TournamentList";
import { Tutorial } from "Tutorial";
import { LearningHub } from "LearningHub";
import { User, UserByName } from "User";
import { Settings } from "Settings";
import { Styling } from "Styling";
import { AnnouncementCenter } from "AnnouncementCenter";
import { VerifyEmail } from "VerifyEmail";
import { GobanTest } from "GobanTest";
import { global_channels } from "chat_manager";
import { ForceUsernameChange } from "ForceUsernameChange";
import { BlockedVPN } from "BlockedVPN";
import { Firewall } from "Firewall";
import { Appeal } from "Appeal";
import { AppealsCenter } from "AppealsCenter";

import * as docs from "docs";

/*** Layout our main view and routes ***/
function Main(props): JSX.Element {
    if (username_needs_to_be_updated()) {
        return (
            <div>
                <ErrorBoundary>
                    <ForceUsernameChange />;
                </ErrorBoundary>
            </div>
        );
    }

    return (
        <div>
            <ErrorBoundary>
                <NavBar />
            </ErrorBoundary>
            <ErrorBoundary>
                <Announcements />
            </ErrorBoundary>
            <ErrorBoundary>{props.children}</ErrorBoundary>
        </div>
    );
}
const PageNotFound = () => (
    <div style={{ display: "flex", flex: "1", alignItems: "center", justifyContent: "center" }}>
        {_("Page not found")}
    </div>
);

function Default(): JSX.Element {
    const user = data.get("config.user");

    if (user.anonymous) {
        return <ObserveGames />;
    }

    return <Overview />;
}

function username_needs_to_be_updated(): boolean {
    const user = data.get("config.user");
    if (user.anonymous) {
        return false;
    }

    // ends in a long random hex number? Change that please.
    if (/.*[a-fA-F0-9.]{16,}$/.test(user.username)) {
        return true;
    }

    return false;
}

export const routes = (
    <Router history={browserHistory}>
        <React.StrictMode>
            <Main>
                <Switch>
                    <Route path="/sign-in" component={SignIn} />
                    <Route path="/register" component={Register} />
                    <Route path="/appeal/:player_id" component={Appeal} />
                    <Route path="/appeal" component={Appeal} />
                    <Route path="/appeals-center" component={AppealsCenter} />
                    <Route path="/overview" component={Overview} />
                    <Route path="/play" component={Play} />
                    <Route path="/chat/:channel" component={ChatView} />
                    <Route path="/chat/:channel/*" component={ChatView} />
                    <Route path="/chat/:channel/**/*" component={ChatView} />
                    <Route
                        path="/chat"
                        render={() => {
                            let channel = data.get("chat.active_channel");
                            const joined = data.get("chat.joined") || {};

                            if (!channel) {
                                if (Object.keys(joined).length) {
                                    for (const key of Object.keys(joined)) {
                                        channel = key;
                                        break;
                                    }
                                } else {
                                    channel = "global-english";
                                    for (const chan of global_channels) {
                                        if (chan.primary_language) {
                                            channel = chan.id;
                                        }
                                    }
                                }
                            }

                            // Make sure it shows up in the left panel
                            joined[channel] = 1;
                            data.set("chat.joined", joined);

                            return <Redirect to={`/chat/${channel}`} />;
                        }}
                    />
                    <Route path="/observe-games" component={ObserveGames} />
                    <Route path="/game/view/:game_id" component={Game} />
                    <Route path="/game/:game_id/:move_number" component={Game} />
                    <Route path="/game/:game_id" component={Game} />
                    <Route path="/review/view/:review_id" exact component={Game} />
                    <Route path="/review/:review_id" component={Game} />
                    <Route path="/demo/view/:review_id" component={Game} />
                    <Route path="/demo/:review_id" component={Game} />
                    <Route path="/joseki/" exact component={Joseki} />{" "}
                    {/* this is equivalent to specifying pos = "root" */}
                    <Route path="/joseki/:pos" component={Joseki} />
                    <Route path="/settings/:category" component={Settings} />
                    <Route path="/settings/:category/*" component={Settings} />
                    <Route path="/settings/:category/**/*" component={Settings} />
                    <Route path="/settings" render={SettingsRedirect} />
                    <Route path="/user/settings" render={SettingsRedirect} />
                    <Route path="/player/settings" render={SettingsRedirect} />
                    <Route path="/player/supporter/:account_id" component={Supporter} />
                    <Route path="/player/supporter" component={Supporter} />
                    <Route path="/player/:user_id" component={User} />
                    <Route path="/player/:user_id/*" component={User} />
                    <Route path="/player/:user_id/**/*" component={User} />
                    <Route path="/user/view/:user_id" component={User} />
                    <Route path="/user/view/:user_id/*" component={User} />
                    <Route path="/user/view/:user_id/**/*" component={User} />
                    <Route path="/user/supporter/:account_id" component={Supporter} />
                    <Route path="/user/supporter" component={Supporter} />
                    <Route path="/user/verifyEmail" component={VerifyEmail} />
                    <Route path="/u/:username" component={UserByName} />
                    <Route path="/user/:username" component={UserByName} />
                    <Route path="/supporter/:account_id" component={Supporter} />
                    <Route path="/supporter" component={Supporter} />
                    <Route path="/support" component={Supporter} />
                    <Route path="/donate" component={Supporter} />
                    {/*
            <Route path="/library" component={Library}/>
            <Route path="/library/game-history" component={LibraryGameHistory}/>
            */}
                    <Route path="/library/:player_id/:collection_id" component={LibraryPlayer} />
                    <Route path="/library/:player_id" component={LibraryPlayer} />
                    <Route path="/groups" component={GroupList} />
                    <Route path="/group/create" component={GroupCreate} />
                    <Route path="/group/:group_id" component={Group} />
                    <Route path="/group/:group_id/*" component={Group} />
                    <Route path="/groupadmin/:group_id" component={Group} />
                    <Route path="/groupadmin/:group_id/*" component={Group} />
                    <Route path="/tournament/new/:group_id" component={Tournament} />
                    <Route path="/tournament/new" component={Tournament} />
                    <Route path="/tournament/:tournament_id" component={Tournament} />
                    <Route path="/tournaments/:tournament_id" component={Tournament} />
                    <Route path="/tournaments" component={TournamentListMainView} />
                    <Route path="/tournaments/" component={TournamentListMainView} />
                    <Route
                        path="/tournament-record/:tournament_record_id"
                        component={TournamentRecord}
                    />
                    <Route
                        path="/tournament-records/:tournament_record_id"
                        component={TournamentRecord}
                    />
                    <Route
                        path="/tournament-record/:tournament_record_id/*"
                        component={TournamentRecord}
                    />
                    <Route
                        path="/tournament-records/:tournament_record_id/*"
                        component={TournamentRecord}
                    />
                    <Route path="/ladders" component={LadderList} />
                    <Route path="/ladder/:ladder_id" component={Ladder} />
                    <Route path="/puzzles" component={PuzzleList} />
                    <Route path="/puzzle/:puzzle_id" component={Puzzle} />
                    <Route path="/puzzle-collections/:player_id" component={PuzzleCollectionList} />
                    <Route path="/puzzle-collection/:collection_id" component={PuzzleCollection} />
                    <Route path="/leaderboards" component={LeaderBoard} />
                    <Route path="/leaderboard" component={LeaderBoard} />
                    <Route path="/developer" component={Developer} />
                    <Route path="/admin/merchant_log" component={MerchantLog} />
                    <Route path="/admin/firewall" component={Firewall} />
                    <Route path="/admin" component={Admin} />
                    <Route path="/announcement-center" component={AnnouncementCenter} />
                    {/*
            <Route path="/admin/tournament-scheduler/:schedule_id" component={TournamentModify}/>
            <Route path="/admin/tournament-schedule-list" component={AdminTournamentScheduleList}/>
            */}
                    <Route path="/moderator" component={Moderator} />
                    <Route path="/learning-hub/:section/:page" component={LearningHub} />
                    <Route path="/learning-hub/:section" component={LearningHub} />
                    <Route path="/learning-hub" component={LearningHub} />
                    <Route path="/learn-to-play-go/:section/:page" component={LearningHub} />
                    <Route path="/learn-to-play-go/:section" component={LearningHub} />
                    <Route path="/learn-to-play-go" component={LearningHub} />
                    <Route path="/docs/learn-to-play-go/:section/:page" component={LearningHub} />
                    <Route path="/docs/learn-to-play-go/:section" component={LearningHub} />
                    <Route path="/docs/learn-to-play-go" component={LearningHub} />
                    <Route path="/crash-course-learn-to-play-go/:step" component={Tutorial} />
                    <Route path="/crash-course-learn-to-play-go" component={Tutorial} />
                    <Route path="/docs/crash-course-learn-to-play-go/:step" component={Tutorial} />
                    <Route path="/docs/crash-course-learn-to-play-go" component={Tutorial} />
                    {/* these aren't meant to be linked anywhere, just entered by hand
                for developers looking to test and play with things */}
                    <Route path="/dev/styling" component={Styling} />
                    <Route path="/dev/goban-test" component={GobanTest} />
                    <Route path="/docs/about" component={docs.About} />
                    <Route path="/docs/privacy-policy" component={docs.PrivacyPolicy} />
                    <Route path="/docs/terms-of-service" component={docs.TermsOfService} />
                    <Route path="/docs/contact-information" component={docs.ContactInformation} />
                    <Route path="/docs/refund-policy" component={docs.RefundPolicy} />
                    <Route path="/docs/go-rules-comparison-matrix" component={docs.RulesMatrix} />
                    <Route path="/docs/team" component={docs.Team} />
                    <Route path="/docs/other-go-resources" component={docs.GoResources} />
                    <Route path="/blocked-vpn" component={BlockedVPN} />
                    {/* These are short hand slugs we've created for the bigger AGA tournaments */}
                    <Route
                        path="/2019usgc"
                        render={() => (
                            <Redirect to="/group/3837/2019-us-go-congress-in-madison-wi" />
                        )}
                    />
                    <Route
                        path="/usgc2019"
                        render={() => (
                            <Redirect to="/group/3837/2019-us-go-congress-in-madison-wi" />
                        )}
                    />
                    <Route
                        path="/cotsen2019"
                        render={() => <Redirect to="/tournament-record/45/" />}
                    />
                    <Route path="/" component={Default} exact />
                    <Route path="/*" component={PageNotFound} />
                </Switch>
            </Main>
        </React.StrictMode>
    </Router>
);

function SettingsRedirect() {
    const last_settings_page = data.get("settings.page-selected", "general");
    return <Redirect to={`/settings/${last_settings_page}`} />;
}
