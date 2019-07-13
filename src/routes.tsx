/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {_} from "translate";
import { browserHistory } from './ogsHistory';

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

import * as docs from "docs";


/*** Layout our main view and routes ***/
const Main = props => (
    <div>
        <ErrorBoundary>
            <NavBar/>
        </ErrorBoundary>
        <ErrorBoundary>
            <Announcements/>
        </ErrorBoundary>
        <ErrorBoundary>
            {props.children}
        </ErrorBoundary>
    </div>
);
const PageNotFound = (props, state) => (<div style={{display: "flex", flex: "1", alignItems: "center", justifyContent: "center"}}>{_("Page not found")}</div>);
const Default = () => (
    data.get("config.user").anonymous
        ?  <ObserveGames/>
        :  <Overview/>
);


export const routes = (
<Router history={browserHistory}>
    <Main>
        <Switch>
            <Route path="/sign-in" component={SignIn}/>
            <Route path="/register" component={Register}/>
            <Route path="/overview" component={Overview}/>

            <Route path="/play" component={Play}/>
            <Route path="/chat" component={ChatView}/>
            <Route path="/observe-games" component={ObserveGames}/>
            <Route path="/game/view/:game_id" component={Game}/>
            <Route path="/game/:game_id" component={Game}/>
            <Route path="/review/view/:review_id" exact component={Game}/>
            <Route path="/review/:review_id" component={Game}/>
            <Route path="/demo/view/:review_id" component={Game}/>
            <Route path="/demo/:review_id" component={Game}/>

            <Route path="/player/settings" component={Settings}/>
            <Route path="/player/supporter" component={Supporter}/>
            <Route path="/player/:user_id" component={User}/>
            <Route path="/player/:user_id/*" component={User}/>
            <Route path="/player/:user_id/**/*" component={User}/>

            <Route path="/user/view/:user_id" component={User}/>
            <Route path="/user/view/:user_id/*" component={User}/>
            <Route path="/user/view/:user_id/**/*" component={User}/>
            <Route path="/settings" component={Settings}/>
            <Route path="/user/settings" component={Settings}/>
            <Route path="/user/supporter" component={Supporter}/>
            <Route path="/user/verifyEmail" component={VerifyEmail}/>
            <Route path="/u/:username" component={UserByName}/>
            <Route path="/user/:username" component={UserByName}/>

            <Route path="/supporter" component={Supporter}/>
            <Route path="/support" component={Supporter}/>
            <Route path="/donate" component={Supporter}/>

            {/*
            <Route path="/library" component={Library}/>
            <Route path="/library/game-history" component={LibraryGameHistory}/>
            */}
            <Route path="/library/:player_id/:collection_id" component={LibraryPlayer}/>
            <Route path="/library/:player_id" component={LibraryPlayer}/>
            <Route path="/groups" component={GroupList}/>
            <Route path="/group/create" component={GroupCreate}/>
            <Route path="/group/:group_id" component={Group}/>
            <Route path="/tournament/new/:group_id" component={Tournament}/>
            <Route path="/tournament/new" component={Tournament}/>
            <Route path="/tournament/:tournament_id" component={Tournament}/>
            <Route path="/tournaments/:tournament_id" component={Tournament}/>
            <Route path="/tournaments" component={TournamentListMainView}/>
            <Route path="/tournaments/" component={TournamentListMainView}/>
            <Route path="/tournament-record/:tournament_record_id" component={TournamentRecord}/>
            <Route path="/tournament-records/:tournament_record_id" component={TournamentRecord}/>
            <Route path="/tournament-record/:tournament_record_id/*" component={TournamentRecord}/>
            <Route path="/tournament-records/:tournament_record_id/*" component={TournamentRecord}/>
            <Route path="/ladders" component={LadderList}/>
            <Route path="/ladder/:ladder_id" component={Ladder}/>
            <Route path="/puzzles" component={PuzzleList}/>
            <Route path="/puzzle/:puzzle_id" component={Puzzle}/>
            <Route path="/leaderboards" component={LeaderBoard}/>
            <Route path="/leaderboard" component={LeaderBoard}/>
            <Route path="/developer" component={Developer}/>
            <Route path="/admin/merchant_log" component={MerchantLog}/>
            <Route path="/admin" component={Admin}/>
            <Route path="/announcement-center" component={AnnouncementCenter}/>
            {/*
            <Route path="/admin/tournament-scheduler/:schedule_id" component={TournamentModify}/>
            <Route path="/admin/tournament-schedule-list" component={AdminTournamentScheduleList}/>
            */}
            <Route path="/moderator" component={Moderator}/>
            <Route path="/learning-hub/:section/:page" component={LearningHub}/>
            <Route path="/learning-hub/:section" component={LearningHub}/>
            <Route path="/learning-hub" component={LearningHub}/>

            <Route path="/learn-to-play-go/:section/:page" component={LearningHub}/>
            <Route path="/learn-to-play-go/:section" component={LearningHub}/>
            <Route path="/learn-to-play-go" component={LearningHub}/>
            <Route path="/docs/learn-to-play-go/:section/:page" component={LearningHub}/>
            <Route path="/docs/learn-to-play-go/:section" component={LearningHub}/>
            <Route path="/docs/learn-to-play-go" component={LearningHub}/>

            <Route path="/crash-course-learn-to-play-go/:step" component={Tutorial}/>
            <Route path="/crash-course-learn-to-play-go" component={Tutorial}/>
            <Route path="/docs/crash-course-learn-to-play-go/:step" component={Tutorial}/>
            <Route path="/docs/crash-course-learn-to-play-go" component={Tutorial}/>

            {/* these aren't meant to be linked anywhere, just entered by hand
                for developers looking to test and play with things */}
            <Route path="/dev/styling" component={Styling}/>
            <Route path="/dev/goban-test" component={GobanTest}/>

            <Route path="/docs/about" component={docs.About}/>
            <Route path="/docs/privacy-policy" component={docs.PrivacyPolicy}/>
            <Route path="/docs/terms-of-service" component={docs.TermsOfService}/>
            <Route path="/docs/contact-information" component={docs.ContactInformation}/>
            <Route path="/docs/refund-policy" component={docs.RefundPolicy}/>

            <Route path="/docs/go-rules-comparison-matrix" component={docs.RulesMatrix}/>
            <Route path="/docs/team" component={docs.Team}/>
            <Route path="/docs/other-go-resources" component={docs.GoResources}/>

            {/*
            <Route path="/2019usgc" render={() => <Redirect to="/group/3837"/>} />
            <Route path="/usgc2019" render={() => <Redirect to="/group/3837"/>}  />
            */}

            <Route path="/2019usgc" render={() => <Redirect to="/tournament-record/3/2019-US-Go-Congress-in-Madison-WI"/>} />
            <Route path="/usgc2019" render={() => <Redirect to="/tournament-record/3/2019-US-Go-Congress-in-Madison-WI"/>}  />

            <Route path="/" component={Default} exact />
            <Route path="/*" component={PageNotFound} />
        </Switch>
    </Main>
</Router>);


