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

/* cspell: words groupadmin cotsen */

import * as React from "react";
import {
    unstable_HistoryRouter as Router,
    Route,
    Routes,
    Navigate,
    useNavigate,
} from "react-router-dom";

import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { browserHistory } from "@/lib/ogsHistory";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavBar } from "@/components/NavBar";
import { Announcements } from "@/components/Announcements";
import { SignIn } from "@/views/SignIn";
import { Register } from "@/views/Register";
import { ChallengeLinkLanding } from "@/views/ChallengeLinkLanding";
import { Overview } from "@/views/Overview";
import { Admin, MerchantLog, FlaggedGames, OnlineLeaguesAdmin } from "@/views/Admin";
import { ChatView } from "@/views/ChatView";
import { Developer } from "@/views/Developer";
import { Game } from "@/views/Game";
import { GameEmbed } from "@/views/GameEmbed";
import { Joseki } from "@/views/Joseki";
import { Group } from "@/views/Group";
import { GroupCreate } from "@/views/GroupCreate";
import { GroupList } from "@/views/GroupList";
import { Ladder } from "@/views/Ladder";
import { LadderList } from "@/views/LadderList";
import { LibraryPlayer } from "@/views/LibraryPlayer";
import { Play } from "@/views/Play";
import { Moderator } from "@/views/Moderator";
import { ObserveGames } from "@/views/ObserveGames";
import { Puzzle } from "@/views/Puzzle";
import { PuzzleList } from "@/views/PuzzleList";
import { PuzzleCollectionList, PuzzleCollection } from "@/views/PuzzleCollection";
import { Supporter } from "@/views/Supporter";
import { Tournament } from "@/views/Tournament";
import { TournamentRecord } from "@/views/TournamentRecord";
import { TournamentListMainView } from "@/views/TournamentList";
import { LearningHub } from "@/views/LearningHub";
import { User, UserByName } from "@/views/User";
import { Settings } from "@/views/Settings";
import { Styling } from "@/views/Styling";
import { OnlineLeaguePlayerLanding } from "@/views/OnlineLeaguePlayerLanding";
import { OnlineLeagueSpectatorLanding } from "@/views/OnlineLeagueSpectatorLanding";
import { AnnouncementCenter } from "@/views/AnnouncementCenter";
import { VerifyEmail } from "@/views/VerifyEmail";
import { global_channels } from "@/lib/chat_manager";
import { ForceUsernameChange } from "@/views/ForceUsernameChange";
import { BlockedVPN } from "@/views/BlockedVPN";
import { Firewall } from "@/views/Firewall";
import { Appeal } from "@/views/Appeal";
import { AppealsCenter } from "@/views/AppealsCenter";
import { ReportsCenter } from "@/views/ReportsCenter";
import { Experiment, Variant, Default as ExDefault } from "@/components/Experiment";
import { RatingCalculator } from "@/views/RatingCalculator";
import { AccountWarning } from "@/components/AccountWarning";
import { NetworkStatus } from "@/components/NetworkStatus";
import { PrizeBatchList, PrizeBatch, PrizeRedemption } from "@/views/Prizes";
import { GoTV } from "@/views/GoTV";

import * as docs from "@/views/docs";
import { useData } from "./lib/hooks";

/*** Layout our main view and routes ***/
function Main(props: { children: any }): React.ReactElement {
    const [user] = useData("config.user");
    let username_needs_to_be_updated = false;

    if (user.anonymous) {
        username_needs_to_be_updated = false;
    }

    // ends in a long random hex number? Change that please.
    else if (/.*[a-fA-F0-9.]{16,}$/.test(user.username)) {
        username_needs_to_be_updated = true;
    } else {
        username_needs_to_be_updated = false;
    }

    if (username_needs_to_be_updated) {
        return (
            <div>
                <ErrorBoundary>
                    <ForceUsernameChange />;
                </ErrorBoundary>
            </div>
        );
    }

    return (
        <Experiment name="v6">
            <Variant value="enabled" bodyClass="v6">
                <div id="variant-container">
                    <ErrorBoundary>
                        <NavBar />
                    </ErrorBoundary>
                    <ErrorBoundary>{props.children}</ErrorBoundary>
                    <ErrorBoundary>
                        <Announcements />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <NetworkStatus />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <AccountWarning />
                    </ErrorBoundary>
                </div>
            </Variant>
            <ExDefault>
                <div id="default-variant-container">
                    <ErrorBoundary>
                        <NavBar />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <Announcements />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <NetworkStatus />
                    </ErrorBoundary>
                    <ErrorBoundary>{props.children}</ErrorBoundary>
                    <ErrorBoundary>
                        <AccountWarning />
                    </ErrorBoundary>
                </div>
            </ExDefault>
        </Experiment>
    );
}
const PageNotFound = () => (
    <div style={{ display: "flex", flex: "1", alignItems: "center", justifyContent: "center" }}>
        {_("Page not found")}
    </div>
);

function Default(): React.ReactElement {
    const user = data.get("config.user");

    if (user.anonymous) {
        return <ObserveGames />;
    }

    return <Overview />;
}

function ChatRedirect(): React.ReactElement {
    let channel = data.get("chat.active_channel");
    const joined = data.get("chat.joined") || {};

    if (!channel) {
        if (Object.keys(joined).length) {
            for (const key of Object.keys(joined)) {
                channel = key;
                break;
            }
            if (!channel) {
                channel = "global-english";
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

function SettingsRedirect(): React.ReactElement {
    const last_settings_page = data.get("settings.page-selected", "general");
    return <Navigate to={`/settings/${last_settings_page}`} replace />;
}

function WaitForUser(): React.ReactElement | null {
    const navigate = useNavigate();
    data.watch("config.user", (user) => {
        if (user.anonymous) {
            return;
        }
        if (window.location.hash && window.location.hash[1] === "/") {
            navigate(window.location.hash.substring(1), { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    });
    return null;
}

export const routes = (
    <Router history={browserHistory}>
        <Main>
            <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/wait-for-user" element={<WaitForUser />} />
                <Route path="/welcome/*" element={<ChallengeLinkLanding />} />
                <Route path="/appeal/:player_id" element={<Appeal />} />
                <Route path="/appeal" element={<Appeal />} />
                <Route path="/appeals-center" element={<AppealsCenter />} />
                <Route path="/reports-center/:category/:report_id" element={<ReportsCenter />} />
                <Route path="/reports-center/:category" element={<ReportsCenter />} />
                <Route path="/reports-center" element={<ReportsCenter />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/play/*" element={<Play />} />
                <Route path="/chat/:channel" element={<ChatView />} />
                <Route path="/chat/:channel/*" element={<ChatView />} />
                <Route path="/chat/:channel/**/*" element={<ChatView />} />
                <Route path="/chat" element={<ChatRedirect />} />
                <Route path="/observe-games" element={<ObserveGames />} />
                <Route path="/game/view/:game_id" element={<Game />} />
                <Route path="/game/:game_id/:move_number" element={<Game />} />
                <Route path="/game/:game_id" element={<Game />} />
                <Route path="/review/view/:review_id" element={<Game />} />
                <Route path="/review/:review_id/:move_number" element={<Game />} />
                <Route path="/review/:review_id" element={<Game />} />
                <Route path="/demo/view/:review_id" element={<Game />} />
                <Route path="/demo/:review_id/:move_number" element={<Game />} />
                <Route path="/demo/:review_id" element={<Game />} />
                <Route path="/game/:game_id/embed" element={<GameEmbed />} />
                <Route path="/review/:review_id/embed" element={<GameEmbed />} />
                <Route path="/joseki/" element={<Joseki />} />{" "}
                {/* ^^ this is equivalent to specifying pos = "root" */}
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
                <Route path="/supporter/:account_id/*" element={<Supporter />} />
                <Route path="/supporter" element={<Supporter />} />
                <Route path="/support" element={<Supporter />} />
                <Route path="/donate" element={<Supporter />} />
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
                <Route
                    path="/online-league/league-player"
                    element={<OnlineLeaguePlayerLanding />}
                />
                <Route
                    path="/online-league/league-game/:match_id"
                    element={<OnlineLeagueSpectatorLanding />}
                />
                <Route path="/developer" element={<Developer />} />
                <Route path="/admin/merchant_log" element={<MerchantLog />} />
                <Route path="/admin/firewall" element={<Firewall />} />
                <Route path="/admin/flagged_games" element={<FlaggedGames />} />
                <Route path="/admin/online_leagues" element={<OnlineLeaguesAdmin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/announcement-center" element={<AnnouncementCenter />} />
                <Route path="/redeem" element={<PrizeRedemption />} />
                <Route path="/prize-batches/:id" element={<PrizeBatch />} />
                <Route path="/prize-batches" element={<PrizeBatchList />} />
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
                <Route path="/gotv" element={<GoTV />} />
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
                <Route path="/rating-calculator" element={<RatingCalculator />} />
                <Route path="/" element={<Default />} />
                <Route path="/*" element={<PageNotFound />} />
            </Routes>
        </Main>
    </Router>
);
