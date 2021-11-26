/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import * as React from 'react';
import * as data from 'data';
import * as moment from "moment";
import { get } from 'requests';
import { _ } from "translate";


interface Supporter2Properties {
    match?: {
        params?: {
            user_id?: string;
        };
    };
}


interface Payment {
    "id": number;
    "payment_processor": string;
    "ref_id": string | null;
    "created": string;
    "updated": string;
    "amount": number;
    "currency": string;
    "status": string;
    "payment_method_details": any;
}

interface Subscription {
    "id": number;
    "payment_processor": string;
    "ref_id": string | null;
    "created": string;
    "updated": string;
    "type": string | null;
    "last_four": string | null;
    "period_duration_months": number;
    "canceled": string | null;
}


interface Service {
    "id": number;
    "created": string;
    "updated": string;
    "key": string;
    "hard_expiration": string | null;
    "soft_expiration": string;
    "active": boolean;
    "level": number;
    "slug": string | null;
    "notes": string | null;
    "parameters": string | null;
}


interface History {
    payments: Array<Payment>;
    subscriptions: Array<Subscription>;
    services: Array<Service>;
    loading?: boolean;
}

export function Supporter2(props: Supporter2Properties): JSX.Element {
    const user = data.get('user');
    const [user_id, setUserId]: [number, (n: number) => void] = React.useState(parseInt(props?.match?.params?.user_id || user?.id || "0"));
    const [history, setHistory]: [History, (h: History) => void] = React.useState({
        loading: true,
        payments: [],
        subscriptions: [],
        services: [],
    } as History);
    const [error, setError]: [string, (e: string) => void] = React.useState("");

    const max_service_level = Math.max(0, ...(history.services.map(s => s.level)));

    React.useEffect(() => {
        get(`/billing/history/${user_id}`)
            .then(setHistory)
            .catch((err) => {
                console.error(err);
                setError("" + err);
            });
    }, [user_id]);

    if (error) {
        return (
            <div className='Supporter2'>
                Error loading page
            </div>
        );
    }

    console.log(history);

    return (
        <div className='Supporter2'>
            Hello Supporter2 {user_id}

            {history.services.length &&
                <div className='Services'>
                    {history.services.map((s, idx) => (
                        <div key={idx} className='Service'>
                            level: {s.level} active: {s.active} until {s.soft_expiration}
                        </div>
                    ))}
                </div>
            }

            {history.subscriptions.length
                ?
                <>
                    <h3>{_("Supporter Subscription")}</h3>
                    <div className='Subscriptions'>
                        {history.subscriptions.map((s, idx) => (
                            <div key={idx} className='Service'>
                                TODO: Allow cancelation and change of payment method {s.updated}
                            </div>
                        ))}
                    </div>
                </>
                :
                (history.payments.length > 0
                    ?
                    <div>
                        <h4>{_("You do not have an active supporter subscription")}</h4>
                    </div>
                    :
                    null
                )
            }

            {history.payments.length &&
                <>
                    <h3>{_("Recent Payments")}</h3>
                    <div className='Payments'>
                        {history.payments.map((p, idx) => (
                            <div key={idx} className='Payment'>
                                <span className='date'>{moment(p.updated).format('lll')}</span>
                                <span className='amount'>{formatMoney(p.currency, p.amount)}</span>
                                <PaymentMethod payment={p} />
                                <span className='status'>
                                    {p.status === "succeeded"
                                        ? <i className='fa fa-check' />
                                        : <i className='fa fa-times' />
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            }
        </div>
    );
}
function PaymentMethod({payment}: {payment: Payment}): JSX.Element {
    const user = data.get('user');
    let details: JSX.Element | null;
    let ret: JSX.Element | null;

    if (payment.payment_method_details?.card) {
        const card = payment.payment_method_details?.card;
        if (card.exp_month && card.exp_year && card.last4) {
            details = (<>
                <span className='last4'>&#183;&#183;&#183;{card.last4}</span>
                <span className='expiration'>{card.exp_month}/{card.exp_year}</span>
            </>);
        }
    }


    if (payment.payment_processor === "stripe") {
        ret = (
            <>
                <i className="fa fa-lock"/>
                <span className='stripe'>stripe</span>
                {details}
            </>
        );
    } else if (payment.payment_processor === "paypal") {
        ret = (
            <>
                <i className="fa fa-lock"/>
                <span className='paypal'>paypal</span>
                {details}
            </>
        );
    } else if (payment.payment_processor === "paddle") {
        ret = (
            <>
                <i className="fa fa-lock"/>
                <span className='paddle'>paddle</span>
                {details}
            </>
        );
    } else {
        ret = (
            <>{payment.payment_processor}</>
        );
    }

    if (payment.ref_id && user.is_superuser) {
        if (payment.payment_processor === "stripe") {
            return <a href={`https://dashboard.stripe.com/payments/${payment.ref_id}`} target='_blank'>{ret}</a>;
        }
        if (payment.payment_processor === "paypal") {
            return <a href={`https://www.paypal.com/activity/payment/${payment.ref_id}`} target='_blank'>{ret}</a>;
        }
        if (payment.payment_processor === "paddle") {
            return <a href={`https://paddle.com/orders/detail/${payment.ref_id}`} target='_blank'>{ret}</a>;
        }
    }

    return ret;
}


function formatMoney(currency: string, n: number, no_fraction_digits: boolean = false): string {
    const ret = Intl.NumberFormat(navigator.language, { style: 'currency', currency: currency}).format(n);

    if (no_fraction_digits) {
        return ret.replace(/[.,].{2}$/, "");
    }
    return ret;
}
