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

/// <reference path="../typings_manual/index.d.ts" />
import "whatwg-fetch"; /* polyfills window.fetch */
import * as Sentry from "@sentry/browser";
import { configure_goban } from "configure-goban";
import {
    GoMath,
    init_score_estimator,
    set_remote_scorer,
    ScoreEstimateRequest,
    ScoreEstimateResponse,
} from "goban";

import { sfx } from "sfx";
import { post } from "requests";
import { ai_host } from "sockets";
import { get_bid } from "SignIn";
sfx.sync();

declare let ogs_current_language;
declare let ogs_language_version;
declare let ogs_version;

let sentry_env = "production";

if (
    /online-(go|baduk|weiqi|covay|igo).(com|net)$/.test(document.location.host) &&
    !/dev/.test(document.location.host)
) {
    sentry_env = "production";
    if (/beta/.test(document.location.host)) {
        sentry_env = "beta";
    }
} else {
    sentry_env = "development";
}

try {
    Sentry.init({
        dsn: "https://f8e3b8de571e412b98ff8f98e12c7f58@o589780.ingest.sentry.io/5750726",
        autoSessionTracking: false,
        release: ogs_version || "dev",
        whitelistUrls: [
            "online-go.com",
            "online-baduk.com",
            "online-weiqi.com",
            "online-covay.com",
            "online-igo.com",
            "cdn.online-go.com",
            "beta.online-go.com",
            "dev.beta.online-go.com",
        ],
        environment: sentry_env,
        integrations: [
            new Sentry.Integrations.GlobalHandlers({
                onerror: true,
                onunhandledrejection: false,
            }),
            new Sentry.Integrations.Breadcrumbs({
                console: false,
            }),
        ],
    });

    Sentry.setTag("version", ogs_version || "dev");
    Sentry.setExtra("language", ogs_current_language || "unknown");
    Sentry.setExtra("version", ogs_version || "dev");
} catch (e) {
    console.error(e);
}

try {
    window.onunhandledrejection = (e) => {
        console.error(e);
        console.error(e.reason);
        console.error(e.stack);
    };
} catch (e) {
    console.log(e);
}

import * as data from "data";
import * as preferences from "preferences";

try {
    // default_theme is set in index.html based on looking at the OS theme
    data.setDefault("theme", window["default_theme"]);
} catch (e) {
    data.setDefault("theme", "light");
}
data.setDefault("config", {
    user: {
        anonymous: true,
        id: 0,
        username: "Guest",
        ranking: -100,
        country: "un",
        pro: 0,
    },
});
data.setDefault("config.user", {
    anonymous: true,
    id: 0,
    username: "Guest",
    ranking: -100,
    country: "un",
    pro: 0,
});

data.setDefault("config.cdn", window["cdn_service"]);
data.setDefault(
    "config.cdn_host",
    window["cdn_service"].replace("https://", "").replace("http://", "").replace("//", ""),
);
data.setDefault("config.cdn_release", window["cdn_service"] + "/" + window["ogs_release"]);
data.setDefault("config.release", window["ogs_release"]);

configure_goban();

import * as React from "react";
import * as ReactDOM from "react-dom";
import { browserHistory } from "./ogsHistory";
import { routes } from "./routes";

//import {Promise} from "es6-promise";
import { errorAlerter, uuid } from "misc";
import { close_all_popovers } from "popover";
import * as sockets from "sockets";
import { _ } from "translate";
import { init_tabcomplete } from "tabcomplete";
import * as player_cache from "player_cache";
import { toast } from "toast";
import cached from "cached";
import * as moment from "moment";
import swal from "sweetalert2";
import { ConfigSchema } from "data_schema";

import "debug";

/*** Initialize moment in our current language ***/
declare function getPreferredLanguage();
moment.locale(getPreferredLanguage());

/*** Load our config ***/
data.watch(cached.config, (config) => {
    /* We do a pass where we set everything, and then we 'set' everything
     * again to do the emits that we are expecting. Otherwise triggers
     * that are depending on other parts of the config will fire without
     * having up to date information (in particular user / auth stuff) */
    for (const key in config) {
        data.setWithoutEmit(`config.${key as keyof ConfigSchema}`, config[key]);
    }
    for (const key in config) {
        data.set(`config.${key as keyof ConfigSchema}`, config[key]);
    }
});

let last_username: string | null = null;
data.watch("config.user", (user) => {
    try {
        Sentry.setUser({
            id: user.id,
            username: user.username,
        });
    } catch (e) {
        console.error(e);
    }

    player_cache.update(user);
    data.set("user", user);
    window["user"] = user;

    if (last_username && last_username !== user.username) {
        last_username = user.username;
        forceReactUpdate();
    }
    last_username = user.username;
});

/***
 * Setup a device UUID so we can logout other *devices* and not all other
 * tabs with our new logout-other-devices button
 */
data.set("device.uuid", data.get("device.uuid", uuid()));

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
    localStorage.setItem("localstorage-test", "true");
} catch (e) {
    toast(
        <div>
            {_(
                "It looks like localStorage is disabled on your browser. Unfortunately you won't be able to sign in without enabling it first.",
            )}
        </div>,
    );
}

/** Connect to the chat service */
let auth_connect_fn = () => {
    return;
};
data.watch("config.user", (user) => {
    if (!user.anonymous) {
        auth_connect_fn = (): void => {
            sockets.socket.send("authenticate", {
                auth: data.get("config.chat_auth"),
                player_id: user.id,
                username: user.username,
                jwt: data.get("config.user_jwt"),
                bid: get_bid(),
                useragent: navigator.userAgent,
                language: ogs_current_language,
                language_version: ogs_language_version,
                client_version: ogs_version,
            });
            sockets.socket.send("chat/connect", {
                auth: data.get("config.chat_auth"),
                player_id: user.id,
                ranking: user.ranking,
                username: user.username,
                ui_class: user.ui_class,
            });
        };
    } else if (user.id < 0) {
        auth_connect_fn = (): void => {
            sockets.socket.send("chat/connect", {
                player_id: user.id,
                ranking: user.ranking,
                username: user.username,
                ui_class: user.ui_class,
            });
        };
    }
    if (sockets.socket.connected) {
        auth_connect_fn();
    }
});
sockets.socket.on("connect", () => {
    auth_connect_fn();
});

/*** Setup remote score estimation */
set_remote_scorer(remote_score_estimator);
function remote_score_estimator(req: ScoreEstimateRequest): Promise<ScoreEstimateResponse> {
    return new Promise<ScoreEstimateResponse>((resolve) => {
        req.jwt = data.get("config.user_jwt");
        resolve(post(`${ai_host}/api/score`, req));
    });
}
init_score_estimator()
    .then(() => {
        // console.log('SE Initialized');
    })
    .catch((err) => console.error(err));

/*** Generic error handling from the server ***/
sockets.socket.on("ERROR", errorAlerter);

browserHistory.listen((/* location */) => {
    try {
        // old google analytics history hook
        /*
        const cleaned_path = location.pathname.replace(/\/[0-9]+(\/.*)?/, "/ID");
        let user_type = "error";
        const user = data.get("user");

        if (!user || user.anonymous) {
            user_type = "anonymous";
        } else if (user.supporter) {
            user_type = "supporter";
        } else {
            user_type = "non-supporter";
        }

        if (gtag) {
            window["gtag"]("config", "UA-37743954-2", {
                page_path: cleaned_path,
                custom_map: {
                    dimension1: user_type,
                },
            });
        }
        */

        window.document.title = "OGS";
        close_all_popovers();
    } catch (e) {
        console.log(e);
    }
});

/*** Some finial initializations ***/
init_tabcomplete();

/* Initialization done, render!! */
const svg_loader = document.getElementById("loading-svg-container");
svg_loader.parentNode.removeChild(svg_loader);

let forceReactUpdate: () => void = () => {};

function ForceReactUpdateWrapper(props): JSX.Element {
    const [update, setUpdate] = React.useState(1);
    forceReactUpdate = () => {
        setUpdate(update + 1);
    };
    return <React.Fragment key={update}>{props.children}</React.Fragment>;
}
ReactDOM.render(
    <ForceReactUpdateWrapper>{routes}</ForceReactUpdateWrapper>,
    document.getElementById("main-content"),
);

window["data"] = data;
window["preferences"] = preferences;
window["player_cache"] = player_cache;
window["GoMath"] = GoMath;

console.log("Finished rendering from main, rengo casual mode 1.0");
