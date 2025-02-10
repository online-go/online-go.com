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
import { useNavigate } from "react-router-dom";
import { _ } from "@/lib/translate";
import { Card } from "@/components/material";
import { useUser, useData } from "@/lib/hooks";
import { PaymentProblem } from "@/lib/data_schema";

export function PaymentProblemBanner(): React.ReactElement | null {
    const user = useUser();
    const [config, _setConfig] = useData("config");
    const [dismissed, _setDismissed] = useData("payment-problem-banner-dismissed-timestamp", 0);
    const navigate = useNavigate();

    if (
        !user ||
        !user.supporter ||
        !config ||
        !config.payment_problems ||
        dismissed > Date.now() - 1000 * 60 * 60 * 24 * 5
    ) {
        return null;
    }

    const dismiss = () => {
        _setDismissed(Date.now());
    };
    const goToPaymentSettings = () => {
        navigate("/settings/supporter");
    };

    return (
        <div className="PaymentProblemBanner-container">
            <Card className="PaymentProblemBanner">
                {config.payment_problems.map((problem, i) => (
                    <PaymentProblemDescription key={i} problem={problem} />
                ))}

                <div className="buttons">
                    <button className="default" onClick={dismiss}>
                        {_("Dismiss")}
                    </button>
                    <button className="primary" onClick={goToPaymentSettings}>
                        {_("Go to supporter settings")} &rarr;
                    </button>
                </div>
            </Card>
        </div>
    );
}

function PaymentProblemDescription({ problem }: { problem: PaymentProblem }): React.ReactElement {
    switch (
        problem.type as string // as string so our fallback doesn't complain as being unreachable
    ) {
        case "payment_failed":
            return (
                <span>
                    {_(
                        `There was a problem processing your most recent supporter payment, you can learn more and update your payment information on the settings page.`,
                    )}
                </span>
            );
        case "expiring_card":
            return (
                <span>
                    {_(
                        `Your supporter payment information is expiring soon, if you would like to update it you can do so on the settings page`,
                    )}
                </span>
            );
    }

    return (
        <span>
            {_(
                "There is a problem processing your supporter payments, please check the supporter payment page for more details.",
            )}
        </span>
    );
}
