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
import { unstable_HistoryRouter as Router, Route, Routes, Navigate } from "react-router-dom";

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

function ChatRedirect(): JSX.Element {
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

    return <Navigate to={`/chat/${channel}`} replace />;
}

function SettingsRedirect(): JSX.Element {
    const last_settings_page = data.get("settings.page-selected", "general");
    return <Navigate to={`/settings/${last_settings_page}`} replace />;
}

export const routes = (
    <Router history={browserHistory}>
        <Main>
            <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/appeal/:player_id" element={<Appeal />} />
                <Route path="/appeal" element={<Appeal />} />
                <Route path="/appeals-center" element={<AppealsCenter />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/play" element={<Play />} />
                <Route path="/chat/:channel" element={<ChatView />} />
                <Route path="/chat/:channel/*" element={<ChatView />} />
                <Route path="/chat/:channel/**/*" element={<ChatView />} />
                <Route path="/chat" element={<ChatRedirect />} />
                <Route path="/observe-games" element={<ObserveGames />} />
                <Route path="/game/view/:game_id" element={<Game />} />
                <Route path="/game/:game_id/:move_number" element={<Game />} />
                <Route path="/game/:game_id" element={<Game />} />
                <Route path="/review/view/:review_id" element={<Game />} />
                <Route path="/review/:review_id" element={<Game />} />
                <Route path="/demo/view/:review_id" element={<Game />} />
                <Route path="/demo/:review_id" element={<Game />} />
                <Route path="/joseki/" element={<Joseki />} />{" "}
                {/* this is equivalent to specifying pos = "root" */}
                <Route path="/joseki/:pos" element={<Joseki />} />
                <Route path="/settings/:category" element={<Settings />} />
                <Route path="/settings/:category/*" element={<Settings />} />
                <Route path="/settings/:category/**/*" element={<Settings />} />
                <Route path="/settings" element={<SettingsRedirect />} />
                <Route path="/user/settings" element={<SettingsRedirect />} />
                <Route path="/player/settings" element={<SettingsRedirect />} />
                <Route path="/player/supporter/:account_id" element={<Supporter />} />
                <Route path="/player/supporter" element={<Supporter />} />
                <Route path="/player/:user_id" element={<User />} />
                <Route path="/player/:user_id/*" element={<User />} />
                <Route path="/player/:user_id/**/*" element={<User />} />
                <Route path="/user/view/:user_id" element={<User />} />
                <Route path="/user/view/:user_id/*" element={<User />} />
                <Route path="/user/view/:user_id/**/*" element={<User />} />
                <Route path="/user/supporter/:account_id" element={<Supporter />} />
                <Route path="/user/supporter" element={<Supporter />} />
                <Route path="/user/verifyEmail" element={<VerifyEmail />} />
                <Route path="/u/:username" element={<UserByName />} />
                <Route path="/user/:username" element={<UserByName />} />
                <Route path="/supporter/:account_id" element={<Supporter />} />
                <Route path="/supporter" element={<Supporter />} />
                <Route path="/support" element={<Supporter />} />
                <Route path="/donate" element={<Supporter />} />
                {/*
            <Route path="/library" component={Library}/>
            <Route path="/library/game-history" component={LibraryGameHistory}/>
            */}
                <Route path="/library/:player_id/:collection_id" element={<LibraryPlayer />} />
                <Route path="/library/:player_id" element={<LibraryPlayer />} />
                <Route path="/groups" element={<GroupList />} />
                <Route path="/group/create" element={<GroupCreate />} />
                <Route path="/group/:group_id" element={<Group />} />
                <Route path="/group/:group_id/*" element={<Group />} />
                <Route path="/groupadmin/:group_id" element={<Group />} />
                <Route path="/groupadmin/:group_id/*" element={<Group />} />
                <Route path="/tournament/new/:group_id" element={<Tournament />} />
                <Route path="/tournament/new" element={<Tournament />} />
                <Route path="/tournament/:tournament_id" element={<Tournament />} />
                <Route path="/tournaments/:tournament_id" element={<Tournament />} />
                <Route path="/tournaments" element={<TournamentListMainView />} />
                <Route path="/tournaments/" element={<TournamentListMainView />} />
                <Route
                    path="/tournament-record/:tournament_record_id"
                    element={<TournamentRecord />}
                />
                <Route
                    path="/tournament-records/:tournament_record_id"
                    element={<TournamentRecord />}
                />
                <Route
                    path="/tournament-record/:tournament_record_id/*"
                    element={<TournamentRecord />}
                />
                <Route
                    path="/tournament-records/:tournament_record_id/*"
                    element={<TournamentRecord />}
                />
                <Route path="/ladders" element={<LadderList />} />
                <Route path="/ladder/:ladder_id" element={<Ladder />} />
                <Route path="/puzzles" element={<PuzzleList />} />
                <Route path="/puzzle/:puzzle_id" element={<Puzzle />} />
                <Route path="/puzzle-collections/:player_id" element={<PuzzleCollectionList />} />
                <Route path="/puzzle-collection/:collection_id" element={<PuzzleCollection />} />
                <Route path="/leaderboards" element={<LeaderBoard />} />
                <Route path="/leaderboard" element={<LeaderBoard />} />
                <Route path="/developer" element={<Developer />} />
                <Route path="/admin/merchant_log" element={<MerchantLog />} />
                <Route path="/admin/firewall" element={<Firewall />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/announcement-center" element={<AnnouncementCenter />} />
                {/*
            <Route path="/admin/tournament-scheduler/:schedule_id" element={<TournamentModify />}/>
            <Route path="/admin/tournament-schedule-list" element={<AdminTournamentScheduleList />}/>
            */}
                <Route path="/moderator" element={<Moderator />} />
                <Route path="/learning-hub/:section/:page" element={<LearningHub />} />
                <Route path="/learning-hub/:section" element={<LearningHub />} />
                <Route path="/learning-hub" element={<LearningHub />} />
                <Route path="/learn-to-play-go/:section/:page" element={<LearningHub />} />
                <Route path="/learn-to-play-go/:section" element={<LearningHub />} />
                <Route path="/learn-to-play-go" element={<LearningHub />} />
                <Route path="/docs/learn-to-play-go/:section/:page" element={<LearningHub />} />
                <Route path="/docs/learn-to-play-go/:section" element={<LearningHub />} />
                <Route path="/docs/learn-to-play-go" element={<LearningHub />} />
                <Route path="/crash-course-learn-to-play-go/:step" element={<Tutorial />} />
                <Route path="/crash-course-learn-to-play-go" element={<Tutorial />} />
                <Route path="/docs/crash-course-learn-to-play-go/:step" element={<Tutorial />} />
                <Route path="/docs/crash-course-learn-to-play-go" element={<Tutorial />} />
                {/* these aren't meant to be linked anywhere, just entered by hand
                for developers looking to test and play with things */}
                <Route path="/dev/styling" element={<Styling />} />
                <Route path="/docs/about" element={<docs.About />} />
                <Route path="/docs/privacy-policy" element={<docs.PrivacyPolicy />} />
                <Route path="/docs/terms-of-service" element={<docs.TermsOfService />} />
                <Route path="/docs/contact-information" element={<docs.ContactInformation />} />
                <Route path="/docs/refund-policy" element={<docs.RefundPolicy />} />
                <Route path="/docs/go-rules-comparison-matrix" element={<docs.RulesMatrix />} />
                <Route path="/docs/team" element={<docs.Team />} />
                <Route path="/docs/other-go-resources" element={<docs.GoResources />} />
                <Route path="/blocked-vpn" element={<BlockedVPN />} />
                {/* These are short hand slugs we've created for the bigger AGA tournaments */}
                <Route
                    path="/2019usgc"
                    element={
                        <Navigate to="/group/3837/2019-us-go-congress-in-madison-wi" replace />
                    }
                />
                <Route
                    path="/usgc2019"
                    element={
                        <Navigate to="/group/3837/2019-us-go-congress-in-madison-wi" replace />
                    }
                />
                <Route
                    path="/cotsen2019"
                    element={<Navigate to="/tournament-record/45/" replace />}
                />
                <Route path="/" element={<Default />} />
                <Route path="/*" element={<PageNotFound />} />
            </Routes>
        </Main>
    </Router>
);
