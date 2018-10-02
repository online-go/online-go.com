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
import { browserHistory } from './ogsHistory';
import { routes } from "./routes";

//import {Promise} from "es6-promise";
import {get} from "requests";
import {errorAlerter} from "misc";
import {close_all_popovers} from "popover";
import * as sockets from "sockets";
import {_} from "translate";
import {init_tabcomplete} from "tabcomplete";
import * as player_cache from "player_cache";
import {toast} from 'toast';
import cached from 'cached';

import "debug";

declare const swal;
declare const Raven;


/*** Load our config ***/
data.watch(cached.config, (config) => {
    for (let key in config) {
        data.set(`config.${key}`, config[key]);
    }
});

data.watch("config.user", (user) => {
    try {
        Raven.setUserContext({
            'id': user.id,
            'username': user.username,
        });
    } catch (e) {
        console.error(e);
    }

    player_cache.update(user);
    data.set("user", user);
    window["user"] = user;
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


/** Connect to the chat service */
let auth_connect_fn = () => {return; };
data.watch("config.user", (user) => {
    if (!user.anonymous) {
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
                ui_class: user.ui_class,
            });
        };
    } else if (user.id < 0) {
        auth_connect_fn = (): void => {
            sockets.comm_socket.send("chat/connect", {
                player_id: user.id,
                ranking: user.ranking,
                username: user.username,
                ui_class: user.ui_class,
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
declare var gtag;


/* ga history hook  */
browserHistory.listen(location => {
    try {
        let cleaned_path = location.pathname.replace(/\/[0-9]+(\/.*)?/, "/ID");

        let user_type = 'error';
        let user = data.get('user');

        if (!user || user.anonymous) {
            user_type = 'anonymous';
        } else if (user.supporter) {
            user_type = 'supporter';
        } else {
            user_type = 'non-supporter';
        }

        if (gtag) {
            window["gtag"]("config", 'UA-37743954-2', {
                'page_path': cleaned_path,
                'custom_map': {
                    'dimension1': user_type
                }
            });
        }

        close_all_popovers();
    } catch (e) {
        console.log(e);
    }

});


/*** Some finial initializations ***/
init_tabcomplete();

/* Initialization done, render!! */
ReactDOM.render(routes, document.getElementById("main-content"));
