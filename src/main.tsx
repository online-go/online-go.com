/*
 * Copyright (C) 2012-2017  Online-Go.com
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

/// <reference path="../typings_manual/index.d.ts" />

import "debug"; // Must go first due to circular imports.

import * as data from "data";

data.setDefault("theme", "light");
data.setDefault("config", {
    "user": {
        "anonymous": true,
        "id": 0,
        "username": "Guest",
        "ranking": -100,
        "country": "un",
        "pro": 0,
    }
});

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, IndexRoute, browserHistory } from "react-router";
//import {Promise} from "es6-promise";
import {get} from "requests";
import {errorAlerter} from "misc";
import {close_all_popovers} from "popover";
import * as sockets from "sockets";
import {_} from "translate";
import {init_tabcomplete} from "tabcomplete";
import * as player_cache from "player_cache";
import {toast} from 'toast';

import {NavBar} from "NavBar";
import {Announcements} from "Announcements";
import {SignIn} from "SignIn";
import {Register} from "Register";
import {Overview} from "Overview";
import {Admin} from "Admin";
import {ChatView} from "ChatView";
import {Developer} from "Developer";
import {Game} from "Game";
import {Group} from "Group";
import {GroupCreate} from "GroupCreate";
import {GroupList} from "GroupList";
import {Ladder} from "Ladder";
import {LadderList} from "LadderList";
import {LeaderBoard} from "LeaderBoard";
import {LibraryPlayer} from "LibraryPlayer";
import {Play} from "Play";
import {Moderator} from "Moderator";
import {ObserveGames} from "ObserveGames";
import {Puzzle} from "Puzzle";
import {PuzzleList} from "PuzzleList";
import {Supporter} from "Supporter";
import {Tournament} from "Tournament";
import {TournamentListMainView} from "TournamentList";
import {Tutorial} from "Tutorial";
import {User, UserByName} from "User";
import {Settings} from "Settings";
import {Styling} from "Styling";
import {AnnouncementCenter} from "AnnouncementCenter";
import {VerifyEmail} from "VerifyEmail";
import * as docs from "docs";
import {RegisteredPlayer, player_attributes, is_registered} from "data/Player";
import {from_server_player} from "compatibility/Player";

declare const swal;


/*** Load our config ***/
data.watch("config", (config) => {
    for (let key in config) {
        data.set(`config.${key}`, config[key]);
    }
});
get("ui/config").then((config) => data.set("config", config));
data.watch("config.user", player_data => {
    let player = from_server_player(player_data);
    player_cache.update(player);
    (player as any).anonymous = !is_registered(player);
    data.set("user", player);
    window["user"] = player;
});


/*** SweetAlert setup ***/
swal.setDefaults({
    confirmButtonClass: "primary",
    cancelButtonClass: "reject",
    buttonsStyling: false,
    reverseButtons: true,
    confirmButtonText: _("OK"),
    cancelButtonText: _("Cancel"),
    allowEscapeKey: true,
    //focusCancel: true,
});


/***
 * Test if local storage is disabled for some reason (Either because the user
 * turned it off, the browser doesn't support it, or because the user is using
 * Safari in private browsing mode which implicitly disables the feature.)
 */
try {
    localStorage.setItem('localstorage-test', "true");
} catch (e) {
    toast(
        <div>
            {_("It looks like localStorage is disabled on your browser. Unfortunately you won't be able to login without enabling it first.")}
        </div>
    );
}


/*** Layout our main view and routes ***/
const Main = props => (<div><NavBar/><Announcements/>{props.children}</div>);
const PageNotFound = () => (<div style={{display: "flex", flex: "1", alignItems: "center", justifyContent: "center"}}>{_("Page not found")}</div>);
const Default = () => (
    !(data.get("user") instanceof RegisteredPlayer)
        ?  <ObserveGames/>
        :  <Overview/>
);

/** Connect to the chat service */
let auth_connect_fn = () => {return; };
data.watch("user", (user) => {
    if (user instanceof RegisteredPlayer) {
        auth_connect_fn = (): void => {
            sockets.comm_socket.send("authenticate", {
                auth: data.get("config.chat_auth"),
                player_id: user.id,
                username: user.username,
            });
            sockets.comm_socket.send("chat/connect", {
                auth: data.get("config.chat_auth"),
                player_id: user.id,
                ranking: user.ranking,
                username: user.username,
                ui_class: player_attributes(user).join(" "),
            });
        };
    }
    else {
        auth_connect_fn = (): void => {
            sockets.comm_socket.send("chat/connect", {
                player_id: user.id,
                username: user.username,
            });
        };
    }
    if (sockets.comm_socket.connected) {
        auth_connect_fn();
    }
});
sockets.comm_socket.on("connect", () => {auth_connect_fn(); });


/*** Generic error handling from the server ***/
sockets.termination_socket.on("ERROR", errorAlerter);


/*** Google analytics ***/
declare var ga;
browserHistory.listen(location => {
    try {
        let cleaned_path = location.pathname.replace(/\/[0-9]+(\/.*)?/, "/ID");

        let user_type = 'error';
        let user = data.get('user');

        if (!(user instanceof RegisteredPlayer)) {
            user_type = 'anonymous';
        } else if (user.is.supporter) {
            user_type = 'supporter';
        } else {
            user_type = 'non-supporter';
        }

        /*
        console.log("send", "pageview", cleaned_path, {
            dimension1: user_type
        });
        */
        if (ga) {
            window["ga"]("send", "pageview", cleaned_path, {
                dimension1: user_type
            });
        }

        close_all_popovers();
    } catch (e) {
        console.log(e);
    }

});


/*** Some finial initializations ***/
init_tabcomplete();


const routes = (
<Router history={browserHistory}>
    <Route path="/" component={Main}>
        <IndexRoute component={Default}/>
        <Route path="/sign-in" component={SignIn}/>
        <Route path="/register" component={Register}/>
        <Route path="/overview" component={Overview}/>

        <Route path="/play" component={Play}/>
        <Route path="/chat" component={ChatView}/>
        <Route path="/observe-games" component={ObserveGames}/>
        <Route path="/game/:game_id" component={Game}/>
        <Route path="/game/view/:game_id" component={Game}/>
        <Route path="/review/:review_id" component={Game}/>
        <Route path="/review/view/:review_id" component={Game}/>
        <Route path="/demo/:review_id" component={Game}/>
        <Route path="/demo/view/:review_id" component={Game}/>

        <Route path="/player/:user_id" component={User}/>
        <Route path="/player/:user_id/*" component={User}/>
        <Route path="/player/:user_id/**/*" component={User}/>
        <Route path="/player/settings" component={Settings}/>
        <Route path="/player/supporter" component={Supporter}/>

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
        <Route path="/ladders" component={LadderList}/>
        <Route path="/ladder/:ladder_id" component={Ladder}/>
        <Route path="/puzzles" component={PuzzleList}/>
        <Route path="/puzzle/:puzzle_id" component={Puzzle}/>
        <Route path="/leaderboards" component={LeaderBoard}/>
        <Route path="/leaderboard" component={LeaderBoard}/>
        <Route path="/developer" component={Developer}/>
        <Route path="/admin" component={Admin}/>
        <Route path="/announcement-center" component={AnnouncementCenter}/>
        {/*
        <Route path="/admin/tournament-scheduler/:schedule_id" component={TournamentModify}/>
        <Route path="/admin/tournament-schedule-list" component={AdminTournamentScheduleList}/>
        */}
        <Route path="/moderator" component={Moderator}/>
        <Route path="/learn-to-play-go/:step" component={Tutorial}/>
        <Route path="/learn-to-play-go" component={Tutorial}/>
        <Route path="/docs/learn-to-play-go/:step" component={Tutorial}/>
        <Route path="/docs/learn-to-play-go" component={Tutorial}/>

        <Route path="/styling" component={Styling}/>


        <Route path="/docs/about" component={docs.About}/>
        <Route path="/docs/privacy-policy" component={docs.PrivacyPolicy}/>
        <Route path="/docs/terms-of-service" component={docs.TermsOfService}/>
        <Route path="/docs/contact-information" component={docs.ContactInformation}/>
        <Route path="/docs/refund-policy" component={docs.RefundPolicy}/>

        <Route path="/docs/go-rules-comparison-matrix" component={docs.RulesMatrix}/>
        <Route path="/docs/changelog" component={docs.ChangeLog}/>
        <Route path="/docs/team" component={docs.Team}/>
        <Route path="/docs/other-go-resources" component={docs.GoResources}/>

        <Route path="/*" component={PageNotFound}/>
    </Route>
</Router>);

ReactDOM.render(routes, document.getElementById("main-content"));

