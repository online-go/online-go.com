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

import * as Sentry from "@sentry/browser";
import { apply_polyfills } from "polyfills";
apply_polyfills();

import { configure_goban } from "configure-goban";
import {
    GoMath,
    init_score_estimator,
    set_remote_scorer,
    ScoreEstimateRequest,
    ScoreEstimateResponse,
} from "goban";

import { OgsHelpProvider } from "OgsHelpProvider";
import { HelpFlows } from "HelpFlows";
import { sfx } from "sfx";
import { post } from "requests";
import { ai_host } from "sockets";
sfx.sync();

declare let ogs_current_language: string;
declare let ogs_language_version: string;
declare let ogs_version: string;

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
        allowUrls: ["online-go.com", "kidsgoserver.com", "beta.online-go.com", "baduk.com"],
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

        /* Several users have weird addons and extensions that cause errors
         * that have nothing to do with OGS. This code filters some of these
         * out so they don't get reported to Sentry. */
        ignoreErrors: [
            "ReferenceError",
            "coinbase",
            "hideMyLocation",
            "userAgent",
            "zaloJSV2", // cspell:disable-line
            "evaluating 'a.L'",
            "document.querySelector(\"[title='Kaya']\").style",
            "onHide is not defined",
            "outputCurrentConfiguration",
            "mvpConfig",
            "Cannot read properties of undefined (reading 'ns')",

            // Library bugs
            ").ended is not a function", // d3

            // Safari bugs
            //   broken mac app WKWebView, see
            //   https://github.com/getsentry/sentry-javascript/issues/3040
            "evaluating 'window.webkit.messageHandlers'",
            //   Audio
            "cannot call stop without calling start first",
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
        if (e.reason.stack) {
            console.error(e.reason.stack);
        }
    };
} catch (e) {
    console.log(e);
}

import * as data from "data";

import * as preferences from "preferences";

try {
    // default_theme is set in index.html based on looking at the OS theme
    data.setDefault("theme", (window as any)["default_theme"]);
} catch (e) {
    data.setDefault("theme", "light");
}

const default_user = {
    anonymous: true,
    id: 0,
    username: "Guest",
    ranking: -100,
    country: "un",
    pro: 0,
    supporter: false,
    is_moderator: false,
    is_superuser: false,
    is_tournament_moderator: false,
    can_create_tournaments: false,
    tournament_admin: false,
};

data.setDefault("config", { user: default_user });

data.setDefault("config.user", default_user);

data.setDefault("config.cdn", (window as any)["cdn_service"]);
data.setDefault(
    "config.cdn_host",
    (window as any)["cdn_service"].replace("https://", "").replace("http://", "").replace("//", ""),
);
data.setDefault(
    "config.cdn_release",
    (window as any)["cdn_service"] + "/" + (window as any)["ogs_release"],
);
data.setDefault("config.release", (window as any)["ogs_release"]);

configure_goban();

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { browserHistory } from "./ogsHistory";
import { routes } from "./routes";

//import {Promise} from "es6-promise";
import { errorAlerter } from "misc";
import { close_all_popovers } from "popover";
import * as sockets from "sockets";
import { _, setCurrentLanguage } from "translate";
import { init_tab_complete } from "tab_complete";
import * as player_cache from "player_cache";
import { toast } from "toast";
import cached from "cached";
import * as moment from "moment";
import { get_device_id } from "SignIn";

import { ConfigSchema } from "data_schema";
import * as history from "history";
import "debug";

/**
 * getPreferredLanguage() is defined in index.html. It gets the user's chosen
 * language from preferences.
 */
declare function getPreferredLanguage(): string;

// Initialize moment in our current language
moment.locale(getPreferredLanguage());
setCurrentLanguage(getPreferredLanguage());

/*** Load our config ***/

/* cached.config is supplied by the server and stored with `data.set()` in response to a login action (login, register),
   after which a page-reload occurs (due to navigation to logged-in page) and that's where this is executed */

const cached_config = data.get(cached.config);

// If cached_config doesn't exist, then the user-defaults set further above (anonymous) will apply...

if (cached_config) {
    /* We do a pass where we set everything, and then we 'set' everything
     * again to do the emits that we are expecting. Otherwise triggers
     * that are depending on other parts of the config will fire without
     * having up to date information (in particular user / auth stuff) */
    for (const key in cached_config) {
        data.setWithoutEmit(`config.${key as keyof ConfigSchema}`, (cached_config as any)[key]);
    }
    for (const key in cached_config) {
        data.set(`config.${key as keyof ConfigSchema}`, (cached_config as any)[key]);
    }
}

const user = data.get("config.user"); // guaranteed to return anonymous by the defaults, unless they are logged in

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
(window as any)["user"] = user;

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
for (const socket of [sockets.socket, sockets.ai_socket]) {
    socket.authenticate({
        jwt: data.get("config.user_jwt", ""),
        device_id: get_device_id(),
        user_agent: navigator.userAgent,
        language: ogs_current_language,
        language_version: ogs_language_version,
        client_version: ogs_version,
    });
}

data.watch("config.user_jwt", (jwt?: string) => {
    if (sockets.ai_socket.connected) {
        sockets.ai_socket.authenticate({
            jwt: jwt ?? "",
            device_id: get_device_id(),
            user_agent: navigator.userAgent,
            language: ogs_current_language,
            language_version: ogs_language_version,
            client_version: ogs_version,
        });
    }
});

sockets.socket.on("user/jwt", (jwt: string) => {
    console.log("Updating JWT");
    data.set("config.user_jwt", jwt);
});

sockets.socket.on("user/update", (user: any) => {
    if (user.id === data.get("config.user")?.id) {
        console.log("Updating user", user);
        data.set("config.user", user);
        player_cache.update(user);
        data.set("user", user);
        (window as any)["user"] = user;
    } else {
        console.log("Ignoring user update for user", user);
    }
});

/*** Setup remote score estimation */
set_remote_scorer(remote_score_estimator);
function remote_score_estimator(req: ScoreEstimateRequest): Promise<ScoreEstimateResponse> {
    return new Promise<ScoreEstimateResponse>((resolve) => {
        req.jwt = data.get("config.user_jwt", "");
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

browserHistory.listen(({ action /*, location */ }) => {
    try {
        if (action !== history.Action.Replace) {
            window.document.title = "OGS";
        }
        close_all_popovers();
    } catch (e) {
        console.log(e);
    }
});

/*** Some finial initializations ***/
init_tab_complete();

//  don't inherit old rdh values
if (user.anonymous) {
    data.remove("rdh-system-state");
}

/* Initialization done, render!! */
const svg_loader = document.getElementById("loading-svg-container");
svg_loader?.parentNode?.removeChild(svg_loader);

const react_root = ReactDOM.createRoot(document.getElementById("main-content") as HTMLElement);

react_root.render(
    <React.StrictMode>
        <OgsHelpProvider>
            {routes}
            <HelpFlows />
        </OgsHelpProvider>
    </React.StrictMode>,
);

(window as any)["data"] = data;
(window as any)["preferences"] = preferences;
(window as any)["player_cache"] = player_cache;
(window as any)["GoMath"] = GoMath;

import * as requests from "requests";
(window as any)["requests"] = requests;
