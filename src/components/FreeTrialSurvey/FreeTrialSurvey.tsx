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

/*
import * as React from "react";
import * as data from "@/lib/data";
import { _, current_language } from "@/lib/translate";
import { AutoTranslate, auto_translate } from "@/components/AutoTranslate";
import { useUser, useData } from "@/lib/hooks";
import { post } from "@/lib/requests";
import { LoadingButton } from "@/components/LoadingButton";
import { errorAlerter } from "@/lib/misc";
import { toast } from "@/lib/toast";

const letter = `
#### Thank you for trying out the AI reviews and site supporter features!

I hope you enjoyed your trial. As you may or may not know,
Online-Go.com is a very very small company, but we'd love to
grow so we can continue making the site better for go players
all around the world. As such, I, Akita Noek (anoek), lead
developer, president of Online-Go.com, Inc., and general
doer of things that need doing would love to hear how we can
make things better, in particular as it relates to AI reviews
and site supporter features that might entice you to
sign up for a supporter membership.

I will personally be reading every one of these responses,
so please be honest, candid, and preferably constructive.

Thank you!

    - anoek
`;
*/

export function FreeTrialSurvey(): React.ReactElement | null {
    return null;

    /*
    const user = useUser();
    const [surveySubmitted] = useData("free-trial-survey-submitted-timestamp", 0);

    const [sendText, setSendText] = React.useState<string | null>(null);
    const [placeholder, setPlaceholder] = React.useState<string | null>(null);
    const [feedback, _setFeedback] = React.useState<string>("");
    const [submitting, setSubmitting] = React.useState<boolean>(false);

    // If they've had a trial, are still not a supporter, and haven't submitted or dismissed the survey
    const should_show =
        user &&
        user.last_supporter_trial &&
        !surveySubmitted &&
        !user.supporter &&
        Date.now() - new Date(user.last_supporter_trial).getTime() > 1000 * 60 * 60 * 24 * 10; // 10 days

    React.useEffect(() => {
        if (should_show) {
            auto_translate("Send to the president!")
                .then((res) => {
                    setSendText(res.target_text);
                })
                .catch(console.error);
            auto_translate("Enter your feedback, comments, or ideas here")
                .then((res) => {
                    setPlaceholder(res.target_text);
                })
                .catch(console.error);
        }
    }, [should_show]);

    const setFeedback = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            _setFeedback(e.target.value);
        },
        [_setFeedback],
    );

    const close = React.useCallback(() => {
        data.set(
            "free-trial-survey-submitted-timestamp",
            -Date.now(),
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    }, []);

    const sendFeedback = React.useCallback(() => {
        setSubmitting(true);
        post("polls/supporter_improvement_ideas", {
            feedback,
            current_language,
        })
            .then(() => {
                setSubmitting(false);
                toast(<AutoTranslate source={"Thank you for your feedback!"} />);
                data.set(
                    "free-trial-survey-submitted-timestamp",
                    Date.now(),
                    data.Replication.REMOTE_OVERWRITES_LOCAL,
                );
            })
            .catch((err) => {
                setSubmitting(false);
                errorAlerter(err);
            });
    }, [feedback]);

    if (!should_show) {
        return null;
    }

    return (
        <div className="FreeTrialSurvey-container">
            <div className="FreeTrialSurvey">
                <AutoTranslate source={letter} markdown={true} />

                <hr />

                <h3>
                    <AutoTranslate
                        source={
                            "What might entice you to sign up as a site supporter and/or user of AI reviews?"
                        }
                    />
                </h3>
                <textarea placeholder={placeholder || ""} value={feedback} onChange={setFeedback} />

                <hr />

                <div className="buttons">
                    <button onClick={close}>{_("Close")}</button>
                    <LoadingButton
                        className="primary"
                        disabled={feedback.trim().length === 0}
                        loading={submitting}
                        onClick={sendFeedback}
                    >
                        {sendText}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
    */
}
