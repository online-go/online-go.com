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
import { _, pgettext } from "translate";
import { useUser } from "hooks";
import { LoadingButton } from "LoadingButton";
import { post } from "requests";
import { LearnMore } from "./LearnMore";
import { openModal } from "Modal";
//import * as data from "data";

const DAYS_PER_YEAR = 365.2422;

export function FreeTrialBanner() {
    const user = useUser();
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const [loading, setLoading] = React.useState(false);
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
                setSuccess(true);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setSuccess(false);
                setLoading(false);
            });
    }, []);

    const open_learn_more = React.useCallback(() => {
        openModal(<LearnMore />);
    }, []);

    if (!account_age_days || account_age_days < 5 * DAYS_PER_YEAR) {
        return null;
    }

    if (last_offered_trial_days_ago && last_offered_trial_days_ago < DAYS_PER_YEAR) {
        return null;
    }

    if (user.supporter) {
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
                    {success === true && <h4>{_("Your free trial has been activated, enjoy!")}</h4>}

                    {success === false && (
                        <h4>
                            {_("There was an error activating your free trial, please try again.")}
                        </h4>
                    )}

                    {success === null && (
                        <>
                            <h3>{_("Thank you for playing on Online-Go.com!")}</h3>
                            <h4>
                                {_(
                                    "A free, no commitment, 7-day trial of our automated AI reviews is available to you. You should try it and see if you like it!",
                                )}
                            </h4>
                        </>
                    )}

                    {(success === null || success === false) && (
                        <div className="buttons">
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
                </div>
            </div>
        </div>
    );
}
