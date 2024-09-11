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
import { _, pgettext } from "@/lib/translate";
import { useUser } from "@/lib/hooks";
import { LoadingButton } from "@/components/LoadingButton";
import { post } from "@/lib/requests";
import { LearnMore } from "./LearnMore";
import { openModal } from "@/components/Modal";
//import * as data from "@/lib/data";

const DAYS_PER_YEAR = 365.2422;

interface FreeTrialBannerProperties {
    show_even_if_saved_for_later?: boolean;
}

type State = "activated" | "error" | "saved_for_later" | "closed" | null;

export function FreeTrialBanner({ show_even_if_saved_for_later }: FreeTrialBannerProperties) {
    const user = useUser();
    const [state, setState] = React.useState<State>(null);
    const [loading, setLoading] = React.useState(false);
    const saved_for_later = data.get("free-trial-saved-for-later-timestamp");
    const account_age_days =
        user && user.registration_date
            ? (Date.now() - Date.parse(user.registration_date)) / (24 * 60 * 60 * 1000)
            : null;
    const last_offered_trial_days_ago =
        user && user.last_supporter_trial
            ? (Date.now() - Date.parse(user.last_supporter_trial)) / (24 * 60 * 60 * 1000)
            : null;

    const activate_trial = React.useCallback(() => {
        setLoading(true);
        post("me/activate_trial/", {})
            .then((res) => {
                console.log(res);
                setState("activated");
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setState("error");
                setLoading(false);
            });
    }, []);

    const open_learn_more = React.useCallback(() => {
        openModal(<LearnMore />);
    }, []);

    const saveForLater = React.useCallback(() => {
        setState("saved_for_later");
        data.set(
            "free-trial-saved-for-later-timestamp",
            Date.now(),
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    }, []);

    const close = React.useCallback(() => {
        setState("closed");
    }, []);

    if (!show_even_if_saved_for_later && show_even_if_saved_for_later) {
        return null;
    }

    if (!account_age_days || account_age_days < 5 * DAYS_PER_YEAR) {
        return null;
    }

    if (last_offered_trial_days_ago !== null && last_offered_trial_days_ago < DAYS_PER_YEAR) {
        return null;
    }

    if (user.supporter) {
        return null;
    }

    if (user.is_moderator) {
        return null;
    }

    if (state === "closed") {
        return null;
    }

    if (
        !show_even_if_saved_for_later &&
        state !== "saved_for_later" &&
        saved_for_later &&
        Date.now() - saved_for_later < DAYS_PER_YEAR * 24 * 60 * 60 * 1000
    ) {
        return null;
    }

    return (
        <div className="FreeTrialBanner-container">
            <div className="FreeTrialBanner">
                <div className="free-trial-left">
                    <div className="trial-board" />
                    <div className="trial-graph" />
                </div>
                <div className="free-trial-right">
                    {state === "activated" && (
                        <h4>{_("Your free trial has been activated, enjoy!")}</h4>
                    )}

                    {state === "error" && (
                        <h4>
                            {_("There was an error activating your free trial, please try again.")}
                        </h4>
                    )}

                    {state === "saved_for_later" && (
                        <h4>
                            {_(
                                "Your free trial has been saved. You can activate it at any time by visiting the site supporter page. Enjoy!",
                            )}
                        </h4>
                    )}

                    {state === null && (
                        <>
                            <h3>{_("Thank you for playing on Online-Go.com!")}</h3>
                            <h4>
                                {_(
                                    "A free, no commitment, 7-day trial of our automated AI reviews is available to you. You should try it and see if you like it!",
                                )}
                            </h4>
                        </>
                    )}

                    {(state === null || state === "error") && (
                        <div className="buttons">
                            {!show_even_if_saved_for_later && (
                                <button className="default" onClick={saveForLater}>
                                    {pgettext(
                                        "Save the 7 day trial for a later time",
                                        "Save for later",
                                    )}
                                </button>
                            )}

                            <button className="primary" onClick={open_learn_more}>
                                {pgettext("Learn more about the free trial", "Learn more")}
                            </button>
                            <LoadingButton
                                className="primary"
                                loading={loading}
                                onClick={activate_trial}
                            >
                                {pgettext("Activate the free trial", "Activate now")}
                            </LoadingButton>
                        </div>
                    )}

                    {(state === "saved_for_later" || state === "activated") && (
                        <div className="buttons">
                            <button className="default" onClick={close}>
                                {_("Close")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
