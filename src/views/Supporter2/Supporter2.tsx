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
import { get, post } from 'requests';
import { _, pgettext, interpolate } from "translate";
import swal from 'sweetalert2';
import { ignore, errorAlerter } from "misc";
import { currencies } from "./currencies";
import { Toggle } from 'Toggle';

declare let StripeCheckout;

interface Supporter2Properties {
    match?: {
        params?: {
            user_id?: string;
        };
    };
}

let stripe_checkout_js_promise;
const checkout = null;

declare let Stripe;
let stripe;

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

interface Plan {
    "id": number;
    "payment_processor": string;
    "ref_id": string | null;
    "created": string;
    "updated": string;
    "amount": number;
    "currency": string;
    "name"?: string;
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
    "last_payment"?: Payment;
    "plan"?: Plan;
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


interface Summary {
    payments: Array<Payment>;
    subscriptions: Array<Subscription>;
    services: Array<Service>;
    loading?: boolean;
}

interface Price {
    active: boolean;
    title: string;
    description: Array<string | JSX.Element>;
    review_level: 'kyu' | 'dan' | 'pro' | 'meijin';
    amount: number;
    currency: string;
    interval: string;
    //strength: string;
}

export function Supporter2(props: Supporter2Properties): JSX.Element {
    const user = data.get('user');
    const [user_id, setUserId]: [number, (n: number) => void] = React.useState(parseInt(props?.match?.params?.user_id || user?.id || "0"));
    const [summary, setSummary]: [Summary, (h: Summary) => void] = React.useState({
        loading: true,
        payments: [],
        subscriptions: [],
        services: [],
    } as Summary);
    const [error, setError]: [string, (e: string) => void] = React.useState("");
    const [currency, setCurrency]: [string, (e: string) => void] = React.useState("USD");
    const [annualBilling, setAnnualBilling]: [boolean, (b: boolean) => void] = React.useState(false as boolean);

    if (!stripe_checkout_js_promise) {
        stripe_checkout_js_promise = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://js.stripe.com/v3";
            script.async = true;
            script.charset = "utf-8";
            script.onload = () => {
                window['stripe'] = stripe = new Stripe(data.get('config').stripe_pk);
                resolve();
            };
            script.onerror = () => {
                reject("Unable to load stripe checkout");
            };
            document.head.appendChild(script);
        });
    }

    const max_service_level = Math.max(0, ...(summary.services.map(s => s.level)));

    React.useEffect(() => {
        get(`/billing/summary/${user_id}`)
            .then(setSummary)
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

    console.log(summary);

    const developer_options = user.id !== 1 ? null : (
        <div className='developer-options'>
            Currency:
            <select onChange={(ev) => setCurrency(ev.target.value)}>
                {Object.keys(currencies).map(c => <option key={c}>{c}</option>)}
            </select>
        </div>
    );



    const common_description = [
        _("Double the max vacation time and accural rate"),
        _("Golden name (optional)"),
        _("Access to Site Supporters channel"),
        pgettext("Easily cancel the supporter subscription plan anytime", "Easily cancel anytime"),
        pgettext("Plan prices wont change unless the plan is canceled", "Locked in price until canceled"),
        <b>{_("Automatic AI reviews for your games")}<sup>*</sup></b>,
    ];
    const prices: Array<Price> = [
        {
            "active": false,
            "title": pgettext("Kyu Supporter", "Kyu"),
            "description": [
                ...common_description,
            ],
            "review_level": 'kyu',
            "amount": 300,
            "currency": currency,
            "interval": annualBilling ? "year" : "month",
        },
        {
            "active": true,
            //"title": pgettext("Dan Supporter", "Dan"),
            "title": _("Dan Supporter"),
            "description": [
                ...common_description,
                <span>{interpolate(_("AI reviews are processed moderately deep using {{num}} playouts per move"), {"num": "1000"})}<sup>*</sup></span>,
            ],
            "review_level": 'dan',
            "amount": 500,
            "currency": currency,
            "interval": annualBilling ? "year" : "month",
        },
        {
            "active": true,
            //"title": pgettext("Pro Supporter", "Pro"),
            "title": _("Pro Supporter"),
            "description": [
                ...common_description,
                <span>{interpolate(_("AI reviews are processed deeper using {{num}} playouts per move"), {"num": "3000"})}<sup>*</sup></span>,
                <b className='green'>{_("3x more analysis done by the AI per move")}</b>,
            ],
            "review_level": 'pro',
            "amount": 1000,
            "currency": currency,
            "interval": annualBilling ? "year" : "month",
        },
        {
            "active": false,
            "title": pgettext("Meijin is a Japanese word meaning master, expert, or virtuoso. It was reserved for the single strongest go player.", "Meijin"),
            "description": [
                ...common_description,
                _("Very deep reading, intended for the most serious students"),
            ],
            "review_level": 'meijin',
            "amount": 2500,
            "currency": currency,
            "interval": annualBilling ? "year" : "month",
        },
    ];

    //Hello Supporter2 {user_id}
    return (
        <div className='Supporter2'>
            <div className='SiteSupporterText'>
                <p>
                    {_("Thanks to the generous support from players like you, Online-Go.com is able to provide the best place to play Go online for free to all players around the world. Online-Go.com introduces the game of Go to more people than any other site or organization in the West, making us an important cornerstone in the Western Go world. This is only possible with the continued support from our players, so thank you for taking the time to consider being a supporter!")}
                </p>
            </div>

            <div className='Prices'>
                {prices.map((price, idx) => <PriceBox key={idx} price={price} />)}
            </div>

            <div className='annual-billing'>
                <label htmlFor="annual-billing">{_("Save 16% with annual billing")}</label>
                <Toggle id="annual-billing" checked={annualBilling} onChange={(checked) => setAnnualBilling(checked)} />
            </div>

            {developer_options}

            <div className='SiteSupporterText'>
                <p className='fineprint'>
                    <sup>*</sup>{_("Only 19x19, 9x9, and 13x13 games are supported for AI review. Engines currently available are KataGo and Leela Zero. Playouts and engines are subject to change over time as technology and software improves, but only if the changes should provide you with better reviews.")}
                </p>
            </div>


            {summary.services.length
                ?
                    <div className='Services'>
                        {summary.services.map((s, idx) => (
                            <div key={idx} className='Service'>
                                level: {s.level}
                                active: {s.active}
                                until {s.soft_expiration}
                            </div>
                        ))}
                    </div>
                : null
            }

            {summary.subscriptions.length
                ?
                <>
                    <div className='Subscriptions'>
                        {summary.subscriptions.map((s, idx) => (
                            <Subscription key={s.id} subscription={s} />
                        ))}
                    </div>
                </>
                :
                (summary.payments.length > 0
                    ?
                    <div>
                        <h4>{_("You do not currently have an active supporter subscription")}</h4>
                    </div>
                    :
                    null
                )
            }

            {summary.payments.length
                ?
                    <>
                        <h3>{_("Recent Payments")}</h3>
                        <div className='Payments'>
                            {summary.payments.map((p, idx) => (
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
                : null
            }

        </div>
    );
}

function PriceBox({price}: {price: Price}): JSX.Element {
    const interval = price.interval;
    const paypal_amount = zero_decimal_to_paypal_amount_string(price.currency, price.amount);
    const cdn_release = data.get("config.cdn_release");

    if (!price.active) {
        return null;
    }

    function stripe_subscribe() {
        //this.setState({disable_payment_buttons: true});

        post("/billing/stripe/checkout", {
            'interval': 'month',
            'currency': price.currency,
            'amount': price.amount,
            'review_level': 'kyu',
            'redirect_url': window.location.href,
            'name': _("Supporter"),
            'description': _("Supporter")
        })
        .then((session) => {
            stripe.redirectToCheckout({
                sessionId: session.session_id,
                //successUrl: window.location.href,
                //cancelUrl: window.location.href
            });
            /*
            let item = this.state.interval === 'one time'
                ? {sku: rate_plan.plan_id, quantity: 1}
                : {plan: rate_plan.plan_id, quantity: 1};

            stripe.redirectToCheckout({
                clientReferenceId: "" + data.get('user').id,
                items: [item],
                successUrl: window.location.href,
                cancelUrl: window.location.href
            });
            */
        })
        .catch(errorAlerter);
    }

    function processPaypal() {

        //<input id='paypal-purchase-id' type="hidden" name="invoice" value="" />
        this.createPaymentAccountAndMethod("paypal", null)
        .then((obj) => {
            console.log("Preparing paypal purchase", obj);
            const payment_account = obj.payment_account;
            const payment_method = obj.payment_method;
            const currency = price.currency;
            const interval = price.interval;
            console.error("CODE TO HANDLE PAYPAL NOT PORTED YET");
            /*
            this.processSupporterSignup('paypal', payment_method, paypal_amount, currency, interval)
            .then(() => {
                console.log("Navigating to paypal purchase page");
            })
            .catch(ignore);
            */
        })
        .catch(errorAlerter);
    };



    return (
        <div className='PriceBox'>
            <h1>{price.title}</h1>

            <ul>{price.description.map(s => <li>{s}</li>)}</ul>

            <div className='price-increase-note'>
                {interpolate(
                    _("Sign up before {{date}} to lock in your price before the prices increase"),
                    {"date": moment("2022-01-31").format("ll")}
                )}
            </div>

            <h3>{formatMoney(price.currency, price.amount)} / {price.interval === 'month' ? _("month") : _("year")}</h3>
            <div className='payment-buttons'>
                <button className='sign-up'onClick={stripe_subscribe}>{_("Sign up")} <i className='fa fa-credit-card' /></button>
                <button className='paypal-button' onClick={processPaypal}>
                    <img src={`${cdn_release}/img/new_paypal.png`} />
                </button>
            </div>

            <form id="paypal-form" action={data.get("config.paypal_server")} method="post" target="_top">
                <input type="hidden" name="cmd" value={interval === 'one time' ? "_donations" : "_xclick-subscriptions"} />
                <input type="hidden" name="business" value={data.get("config.paypal_email")} />
                <input type="hidden" name="item_name" value="Supporter Account" />
                {interval !== "one time" && <input type="hidden" name="a3" value={paypal_amount} />}
                {interval !== "one time" && <input type="hidden" name="p3" value="1" />}
                {interval !== "one time" && <input type="hidden" name="t3" value={interval === "month" ? "M" : "Y"} />}

                {interval === "one time" && <input type="hidden" name="amount" value={paypal_amount} />}
                <input type="hidden" name="src" value="1" />
                <input type="hidden" name="no_note" value="1" />
                <input type="hidden" name="currency_code" value={price.currency} />
                <input type="hidden" name="custom" value={data.get("user").id} />
                <input id="paypal-purchase-id" type="hidden" name="invoice" value="" />
                <input type="hidden" name="modify" value="0" />
                <input type="hidden" name="notify_url" value={`https://${data.get("config.server_name")}/merchant/paypal_postback`} />
            </form>
        </div>
    );
}


function Subscription({subscription}: {subscription: Subscription}): JSX.Element {
    const user = data.get('user');

    let text: string;

    switch (subscription.period_duration_months) {
        case 1:
            text = _("You are currently supporting us with {{amount}} per month, thanks!");
            break;
        case 12:
            text = _("You are currently supporting us with {{amount}} per year, thanks!");
            break;
        default:
            text = "{{amount}}";
            break;
    }

    function cancel() {
        console.log("cancel");
        swal({
            text: _("Are you sure you want to cancel your support for OGS?"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => {
            //this.setState({processing: true});
            post(`/billing/stripe/cancel_subscription`, {'ref_id': subscription.ref_id})
            .then(() => {
                window.location.reload();
            })
            .catch((err) => {
                //this.setState({processing: false});
                console.error(err);
                swal("Error canceling subscription, please contact billing@online-go.com").catch(swal.noop);
            });
        })
        .catch(errorAlerter);
    }

    return (
        <div className='Subscription'>
            <h3>{interpolate(text, {amount: formatMoney(subscription.plan.currency, subscription.plan.amount)})}</h3>
            {subscription.last_payment &&
                <>
                    <button onClick={cancel}>{_("Cancel")}</button>
                    <PaymentMethod payment={subscription.last_payment} />
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
            <span className='PaymentMethod'>
                <i className="fa fa-lock"/>
                <span className='stripe'>stripe</span>
                {details}
            </span>
        );
    } else if (payment.payment_processor === "paypal") {
        ret = (
            <span className='PaymentMethod'>
                <i className="fa fa-lock"/>
                <span className='paypal'>paypal</span>
                {details}
            </span>
        );
    } else if (payment.payment_processor === "paddle") {
        ret = (
            <span className='PaymentMethod'>
                <i className="fa fa-lock"/>
                <span className='paddle'>paddle</span>
                {details}
            </span>
        );
    } else {
        ret = (
            <span className='PaymentMethod'>
                {payment.payment_processor}
            </span>
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


function zero_decimal_to_float(currency_code: string, amount: number): number {
    const currency = currencies[currency_code];
    return amount / Math.pow(10, currency.decimal_digits);
}

function zero_decimal_to_paypal_amount_string(currency_code: string, amount: number): string {
    const currency = currencies[currency_code];
    return (amount / Math.pow(10, currency.decimal_digits)).toFixed(currency.decimal_digits);
}

function formatMoney(currency_code: string, amount: number, no_fraction_digits: boolean = false): string {
    const currency = currencies[currency_code];
    const ret = Intl.NumberFormat(
        navigator.language,
        {
            style: 'currency',
            currency: currency_code
        })
        .format(zero_decimal_to_float(currency_code, amount));

    if (currency.decimal_digits === 0) {
        return ret.replace(/[.,].{2}$/, "");
    }
    return ret;
}

