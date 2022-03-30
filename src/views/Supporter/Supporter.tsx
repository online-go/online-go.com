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

import * as React from "react";
import * as data from "data";
import * as moment from "moment";
import { get, post, put } from "requests";
import { _, pgettext, interpolate, sorted_locale_countries } from "translate";
import swal from "sweetalert2";
import { ignore, errorAlerter } from "misc";
import { currencies } from "./currencies";
import { Toggle } from "Toggle";
import { LoadingPage } from "Loading";

interface SupporterProperties {
    match?: {
        params?: {
            account_id?: string;
        };
    };
    inline?: boolean;
}

let stripe_checkout_js_promise: Promise<void>;
let paddle_js_promise: Promise<void>;
//const checkout = null;

declare let Stripe: any;
declare let Paddle: any;
let stripe: any;

interface Payment {
    id: number;
    payment_processor: string;
    ref_id: string | null;
    created: string;
    updated: string;
    amount: number;
    currency: string;
    status: string;
    payment_method_details: any;
}

interface Plan {
    id: number;
    payment_processor: string;
    ref_id: string | null;
    created: string;
    updated: string;
    amount: number;
    currency: string;
    name?: string;
}
interface Subscription {
    id: number;
    payment_processor: string;
    ref_id: string | null;
    created: string;
    updated: string;
    type: string | null;
    last_four: string | null;
    period_duration_months: number;
    canceled: string | null;
    paddle_cancel_url: string | null;
    paddle_update_url: string | null;
    last_payment?: Payment;
    plan?: Plan;
}

interface Service {
    id: number;
    created: string;
    updated: string;
    key: string;
    hard_expiration: string | null;
    soft_expiration: string;
    in_grace_period: boolean;
    active: boolean;
    level: number;
    slug: string | null;
    notes: string | null;
    parameters: string | null;
}

interface SupporterOverrides {
    currency?: string;
    country?: string;
    paddle_promo_code?: string;
    plan?: {
        [slug: string]: {
            month?: number;
            year?: number;
        };
    };
    payment_methods?: "stripe_and_paypal" | "paddle";
}

/* This is really more than just a config, it's the billing configuration +
 * config of subscriptions and whatnot. */
interface Config {
    sandbox: boolean;
    payments: Array<Payment>;
    subscriptions: Array<Subscription>;
    country_currency_list: {
        [country: string]: string;
    };
    services: Array<Service>;
    loading?: boolean;
    paddle_vendor_id?: number;
    country_code: string;
    email?: string;
    plans: Array<Price>;
}

interface Price {
    active: boolean;
    title?: string;
    description?: Array<string | JSX.Element>;
    //review_level: 'kyu' | 'dan' | 'pro' | 'meijin';
    //amount: number;
    //currency: string;
    //interval: string;

    slug: "hane" | "tenuki" | "meijin";
    monthly_paddle_plan_id: string;
    annual_paddle_plan_id: string;
    price: {
        [currency: string]: {
            month: number;
            year: number;
        };
    };
}

function load_checkout_libraries(): void {
    if (!stripe_checkout_js_promise) {
        stripe_checkout_js_promise = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://js.stripe.com/v3";
            script.async = true;
            //script.charset = "utf-8";
            script.onload = () => {
                window["stripe"] = stripe = new Stripe(data.get("config").stripe_pk);
                resolve();
            };
            script.onerror = () => {
                reject("Unable to load stripe checkout");
            };
            document.head.appendChild(script);
        });
    }

    if (!paddle_js_promise) {
        paddle_js_promise = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.paddle.com/paddle/paddle.js";
            script.async = true;
            //script.charset = "utf-8";
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject("Unable to load paddle.com library");
            };
            document.head.appendChild(script);
        });

        paddle_js_promise.then(() => {}).catch(ignore);
    }
}

function guessCurrency(config: Config, country: string): string {
    if (config && config.country_currency_list) {
        if (country in config.country_currency_list) {
            return config.country_currency_list[country];
        }
    }
    return "USD";
}

export function Supporter(props: SupporterProperties): JSX.Element {
    const user = data.get("user");
    const inline = props?.inline;
    const account_id = parseInt((props?.match?.params?.account_id || user?.id || "0") as string);
    const [loading, setLoading] = React.useState(true);
    const [config, setConfig]: [Config, (h: Config) => void] = React.useState({
        loading: true,
        country_code: "US",
        payments: [],
        subscriptions: [],
        services: [],
        plans: [],
    } as Config);
    const [error, setError]: [string, (e: string) => void] = React.useState("");
    const [overrides, setOverrides]: [SupporterOverrides, (e: SupporterOverrides) => void] =
        React.useState({});
    const [annualBilling, setAnnualBilling]: [boolean, (b: boolean) => void] = React.useState(
        false as boolean,
    );

    load_checkout_libraries();

    const prices = config.plans;
    const currency =
        overrides.currency || guessCurrency(config, overrides.country || config.country_code);
    const interval = annualBilling ? "year" : "month";

    React.useEffect(() => {
        Promise.all([
            get(`/billing/summary/${Math.max(0, account_id)}`)
                .then((config: Config) => {
                    paddle_js_promise
                        .then(() => {
                            if (config.sandbox) {
                                Paddle.Environment.set("sandbox");
                            }
                            Paddle.Setup({
                                vendor: config.paddle_vendor_id,
                                eventCallback: (obj: any) => {
                                    //console.log("Paddle event callback",  p1, p2, p3);
                                    console.log("Paddle event callback", obj);

                                    if (
                                        obj.event === "Checkout.Complete" ||
                                        obj.event === "Checkout.Close"
                                    ) {
                                        //console.log("Reloading config");
                                    }
                                },
                            });
                        })
                        .catch(ignore);

                    setConfig(config);
                })
                .catch((err) => {
                    console.error(err);
                    setError("Failed to get billing configuration");
                }),
            get(`players/${Math.max(0, account_id)}/supporter_overrides`)
                .then((overrides: SupporterOverrides) => {
                    setOverrides(overrides);
                    /*
                    if (Object.keys(overrides).length > 0) {
                        console.log("Supplementary supporter config: ", overrides);
                    }
                    */
                })
                .catch((err) => {
                    console.error(err);
                    setError("Failed to get supplementary supporter config");
                }),
        ])
            .then(ignore)
            .catch(ignore)
            .finally(() => setLoading(false));
    }, [account_id]);

    if (error) {
        return (
            <div className="Supporter">
                Error loading page
                <pre>{JSON.stringify(error)}</pre>
            </div>
        );
    }

    if (loading) {
        return <LoadingPage />;
    }

    const common_description = [
        _("Double the max vacation time and accural rate"),
        _("Golden name (optional)"),
        _("Access to Site Supporters channel"),
        pgettext("Easily cancel the supporter subscription plan anytime", "Easily cancel anytime"),
        pgettext(
            "Plan prices wont change unless the plan is canceled",
            "Locked in price until canceled",
        ),
    ];

    const hane = prices.filter((x) => x.slug === "hane")[0];
    if (hane) {
        hane.title = pgettext("Hane supporter plan", "Hane Supporter");
        hane.description = [
            <b>
                {_("Automatic AI reviews for your games")}
                <sup>*</sup>
            </b>,
            <span>
                {interpolate(
                    _("AI reviews are processed moderately deep using {{num}} playouts per move"),
                    {
                        num: "1000",
                    },
                )}
                <sup>*</sup>
            </span>,
            ...common_description,
        ];
    }

    const tenuki = prices.filter((x) => x.slug === "tenuki")[0];
    if (tenuki) {
        tenuki.title = pgettext("Tenuki supporter plan", "Tenuki Supporter");
        tenuki.description = [
            <b>
                {_("Automatic AI reviews for your games")}
                <sup>*</sup>
            </b>,
            <span>
                {interpolate(_("AI reviews are processed deeper using {{num}} playouts per move"), {
                    num: "3000",
                })}
                <sup>*</sup>
            </span>,
            <b className="green">{_("3x the analysis done by the AI per move")}</b>,
            ...common_description,
        ];
    }

    const meijin = prices.filter((x) => x.slug === "meijin")[0];
    if (meijin) {
        meijin.title = pgettext("Meijin supporter plan", "Meijin Supporter");
        meijin.description = [
            <b>
                {_("Automatic AI reviews for your games")}
                <sup>*</sup>
            </b>,
            <span>
                {interpolate(_("AI reviews are processed deeper using {{num}} playouts per move"), {
                    num: "12000",
                })}
                <sup>*</sup>
            </span>,
            //<b className='green'>{_("3x the analysis done by the AI per move")}</b>,
            ...common_description,
        ];
    }

    const current_plan_slug = getCurentPlanSlug(config);

    return (
        <div className="Supporter">
            <SiteSupporterText />

            <div className="Prices">
                {prices.map((price, idx) => (
                    <PriceBox
                        key={idx}
                        price={price}
                        currency={currency}
                        interval={interval}
                        config={config}
                        overrides={overrides}
                        account_id={account_id}
                    />
                ))}
            </div>

            <div className="annual-billing">
                <label htmlFor="annual-billing">{_("Save 16% with annual billing")}</label>
                <Toggle
                    id="annual-billing"
                    checked={annualBilling}
                    onChange={(checked) => setAnnualBilling(checked)}
                />
            </div>

            {(!inline || null) && (
                <>
                    <DeprecatedPlanNote slug={current_plan_slug} />

                    <SupporterOverridesEditor
                        account_id={account_id}
                        overrides={overrides}
                        config={config}
                        onChange={setOverrides}
                    />
                </>
            )}

            <div className="SiteSupporterText">
                <p className="fineprint">
                    <sup>*</sup>
                    {_(
                        "Only 19x19, 9x9, and 13x13 games are supported for AI review. Engines currently available are KataGo and Leela Zero. Playouts and engines are subject to change over time as technology and software improves, but only if the changes should provide you with better reviews.",
                    )}
                </p>
            </div>

            {(!inline || null) && (
                <>
                    {config.subscriptions.length ? (
                        <>
                            <div className="Subscriptions">
                                {config.subscriptions.map((s) => (
                                    <Subscription key={s.id} subscription={s} prices={prices} />
                                ))}
                            </div>
                        </>
                    ) : config.payments.length > 0 ? (
                        <div style={{ textAlign: "center" }}>
                            <h4>
                                {_("You do not currently have an active supporter subscription")}
                            </h4>
                            <h5>
                                {_(
                                    "(Note: if you recently signed up, it may take a few minutes for your subscription to appear here)",
                                )}
                            </h5>
                        </div>
                    ) : null}

                    {config.payments.length ? (
                        <>
                            <h3>{_("Recent Payments")}</h3>
                            <div className="Payments">
                                {config.payments.map((p, idx) => (
                                    <div key={idx} className="Payment">
                                        <span className="date">
                                            {p.updated
                                                ? moment(p.updated).format("lll")
                                                : _("Pending")}
                                        </span>
                                        <span className="amount">
                                            {p.currency && p.amount
                                                ? formatMoney(p.currency, p.amount)
                                                : ""}
                                        </span>
                                        <PaymentMethod payment={p} />
                                        <span className="status">
                                            {p.currency ? (
                                                p.status === "succeeded" ? (
                                                    <i className="fa fa-check" />
                                                ) : (
                                                    <i className="fa fa-times" />
                                                )
                                            ) : (
                                                <i
                                                    className="fa fa-question-circle"
                                                    title={p.status}
                                                />
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}

                    <ManualServiceCreator account_id={account_id} config={config} />

                    {config.services.length && user.is_superuser ? (
                        <div className="Services">
                            {config.services.map((s) => (
                                <ServiceLine key={s.id} service={s} />
                            ))}
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}

export function SiteSupporterText(): JSX.Element {
    return (
        <div className="SiteSupporterText">
            <p>
                {_(
                    "Thanks to the generous support from players like you, Online-Go.com is able to provide the best place to play Go online for free to all players around the world. Online-Go.com introduces the game of Go to more people than any other site or organization in the West, making us an important cornerstone in the Western Go world. This is only possible with the continued support from our players, so thank you for taking the time to consider being a supporter!",
                )}
            </p>
        </div>
    );
}

interface PriceBoxProperties {
    price: Price;
    account_id: number;
    currency: string;
    config: Config;
    overrides: SupporterOverrides;
    interval: "month" | "year";
}

export function PriceBox({
    price,
    currency,
    interval,
    config,
    account_id,
    overrides,
}: PriceBoxProperties): JSX.Element {
    const user = data.get("user");
    const [mor_locations, setMorLocations] = React.useState<string[]>(
        data.get("config.billing_mor_locations") || [],
    );
    let [disabled, setDisabled]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] =
        React.useState(user.id !== account_id);
    const amount = overrides.plan?.[price.slug]?.[interval] || price.price[currency][interval];
    const paypal_amount = zero_decimal_to_paypal_amount_string(currency, amount);
    const cdn_release = data.get("config.cdn_release");

    if (!config) {
        return <div>{_("Loading")}</div>;
    }

    if (!price.active) {
        return null;
    }

    React.useEffect(() => {
        function updateMoreLocations() {
            setMorLocations(data.get("config.billing_mor_locations") || []);
        }
        data.watch("config.billing_mor_locations", updateMoreLocations);
        return () => data.unwatch("config.billing_mor_locations", updateMoreLocations);
    }, []);

    function stripe_subscribe() {
        //this.setState({disable_payment_buttons: true});
        if (!stripe) {
            swal("Error", "Stripe is not configured", "error").catch(swal.noop);
            return;
        }

        setDisabled(true);

        post("/billing/stripe/checkout", {
            interval: interval,
            currency: currency,
            amount: amount,
            review_level: "kyu",
            redirect_url: window.location.href,
            name: _("Supporter"),
            description: _("Supporter"),
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
            .catch(errorAlerter)
            .finally(() => setDisabled(false));
    }

    function paddle_subscribe() {
        setDisabled(true);
        if (!Paddle) {
            swal("Error", "Paddle is not loaded. Please try again later.", "error").catch(
                swal.noop,
            );
            return;
        }

        const paddle_config: any = {
            product:
                interval === "month" ? price.monthly_paddle_plan_id : price.annual_paddle_plan_id,
            passthrough: account_id,
            country: config.country_code,
            email: config.email,
        };

        if (overrides.paddle_promo_code) {
            paddle_config.coupon = overrides.paddle_promo_code;
        }

        if (!paddle_config.email) {
            delete paddle_config.email;
        }

        Paddle.Checkout.open(paddle_config);
    }

    const country = overrides.country || config.country_code;
    const mor_only = mor_locations.includes(country);

    const show_paypal =
        overrides.payment_methods === "stripe_and_paypal" ||
        (!overrides.payment_methods && !mor_only);
    const show_stripe =
        overrides.payment_methods === "stripe_and_paypal" ||
        (!overrides.payment_methods && !mor_only);
    const show_paddle =
        overrides.payment_methods === "paddle" || (!overrides.payment_methods && mor_only);

    const has_subscription = config.subscriptions.length > 0;
    const current_plan_slug = getCurentPlanSlug(config);

    const show_sign_up_before_box = null;

    if (user.id !== account_id || user.id < 0) {
        disabled = true;
        setDisabled = setDisabled; // make eslint happy about this not being a const
    }

    return (
        <div className="PriceBox">
            <h1>{price.title}</h1>

            <ul>
                {price.description.map((s, idx) => (
                    <li key={idx}>{s}</li>
                ))}
            </ul>

            {
                /* don't remove this. We want the translations to stick around
                 * since we'll probably need to do this every few years or
                 * whatever as our costs go up as that's the way of things. */
                show_sign_up_before_box && (
                    <div className="price-increase-note">
                        {interpolate(
                            _(
                                "Sign up before {{date}} to lock in your price before the prices increase",
                            ),
                            {
                                date: moment("2022-01-31").format("ll"),
                            },
                        )}
                    </div>
                )
            }

            <h3>
                {formatMoneyWithTrimmedZeros(currency, amount)} /{" "}
                {interval === "month" ? _("month") : _("year")}
            </h3>

            {has_subscription ? (
                <div className="already-supporter">
                    {current_plan_slug === price.slug ? (
                        <>
                            <h4>{_("Thank you for your support!")}</h4>
                            <p>{_("You are on this plan.")}</p>
                        </>
                    ) : (
                        <p>{_("To change plans, please cancel your support below first")}</p>
                    )}
                </div>
            ) : (
                <div className="payment-buttons">
                    {(show_stripe || null) && (
                        <>
                            <button
                                className="sign-up"
                                onClick={stripe_subscribe}
                                disabled={disabled}
                            >
                                {_("Become a supporter")}
                            </button>
                            <div className="payment-methods">
                                <i className="payment-method card" />
                                <i className="payment-method apple" />
                                <i className="payment-method google" />
                                <i className="payment-method bank" />
                                <i className="payment-method sepa" />
                            </div>
                        </>
                    )}

                    {((show_stripe && show_paypal) || null) && <div className="ruler" />}

                    {(show_paypal || null) && (
                        <form
                            id="paypal-form"
                            action={data.get("config.paypal_server")}
                            method="post"
                            target="_top"
                        >
                            <input type="hidden" name="cmd" value={"_xclick-subscriptions"} />
                            <input
                                type="hidden"
                                name="business"
                                value={data.get("config.paypal_email")}
                            />
                            <input type="hidden" name="item_name" value="Supporter Account" />
                            <input type="hidden" name="a3" value={paypal_amount} />
                            <input type="hidden" name="p3" value="1" />
                            <input
                                type="hidden"
                                name="t3"
                                value={interval === "month" ? "M" : "Y"}
                            />

                            <input type="hidden" name="src" value="1" />
                            <input type="hidden" name="no_note" value="1" />
                            <input type="hidden" name="currency_code" value={currency} />
                            <input type="hidden" name="custom" value={data.get("user").id} />
                            <input type="hidden" name="modify" value="0" />
                            <input
                                type="hidden"
                                name="notify_url"
                                value={`https://${data.get(
                                    "config.paypal_this_server",
                                )}/billing/paypal/ipn`}
                            />

                            {pgettext("Or support with <paypal button>", "Or support with")}
                            <button type="submit" className="paypal-button" disabled={disabled}>
                                <img src={`${cdn_release}/img/new_paypal.png`} />
                            </button>
                        </form>
                    )}

                    {(show_paddle || null) && (
                        <button
                            className="paddle-sign-up"
                            onClick={paddle_subscribe}
                            disabled={disabled}
                        >
                            {_("Become a supporter")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
/*
                {prices.map((price, idx) => (
                                        <PriceBox
                                            key={idx}
                                            price={price}
                                            currency={currency}
                                            interval={interval}
                                            config={config}
                                            overrides={overrides}
                                            account_id={account_id}
                                        />
                                    ))}

*/

function Subscription({
    subscription,
    prices,
}: {
    subscription: Subscription;
    prices: Price[];
}): JSX.Element {
    const user = data.get("user");

    let text: string;
    const period_duration_months = subscription.period_duration_months;

    switch (period_duration_months) {
        case 1:
            text = _("You are currently supporting us with {{amount}} per month, thank you!");
            break;
        case 12:
            text = _("You are currently supporting us with {{amount}} per year, thank you!");
            break;
        default:
            text = _("You're currently on the {{amount}} plan, thank you!");
            break;
    }

    const grandfathered_plan = !prices.find(
        (price) =>
            price.price[subscription.plan?.currency || ""]?.month === subscription.plan?.amount ||
            price.price[subscription.plan?.currency || ""]?.year === subscription.plan?.amount,
    );

    function cancel() {
        swal({
            text: grandfathered_plan
                ? pgettext(
                      'A "grandfathered plan" means the supporter signed up before prices increased, so is paying at a reduced rate. Signing up again in the future will be more expensive.',
                      "Are you sure you want to cancel your support for OGS? Please note that you are on a grandfathered plan at a reduced rate.",
                  )
                : _("Are you sure you want to cancel your support for OGS?"),

            showCancelButton: true,
            focusCancel: true,
        })
            .then(() => {
                let promise;

                switch (subscription.payment_processor) {
                    case "stripe":
                        promise = post(`/billing/stripe/cancel_subscription`, {
                            ref_id: subscription.ref_id,
                        });
                        break;

                    case "paypal":
                        promise = post(`/billing/paypal/cancel_subscription`, {
                            ref_id: subscription.ref_id,
                        });
                        break;

                    case "paddle":
                        window.location.assign(subscription.paddle_cancel_url);
                        //promise = post(`/billing/paddle/cancel_subscription`, {'ref_id': subscription.ref_id});
                        break;

                    case "braintree":
                        //promise = post(`/billing/braintree/cancel_subscription`, {'ref_id': subscription.ref_id});
                        swal(
                            "Please contact anoek@online-go.com to cancel your subscription",
                        ).catch(swal.noop);
                        break;

                    default:
                        swal(
                            "Error canceling subscription, please contact billing@online-go.com",
                        ).catch(swal.noop);
                        break;
                }

                //this.setState({processing: true});
                if (promise) {
                    promise
                        .then(() => {
                            window.location.reload();
                        })
                        .catch((err: any) => {
                            //this.setState({processing: false});
                            console.error(err);
                            swal(
                                "Error canceling subscription [2], please contact billing@online-go.com",
                            ).catch(swal.noop);
                        });
                }
            })
            .catch(errorAlerter);
    }

    function updatePaymentMethod() {
        let promise;

        switch (subscription.payment_processor) {
            case "stripe":
                promise = post("/billing/stripe/update_payment_method", {
                    ref_id: subscription.ref_id,
                    redirect_url: window.location.href,
                });

                promise
                    .then((session: any) => {
                        stripe.redirectToCheckout({
                            sessionId: session.session_id,
                        });
                    })
                    .catch(errorAlerter);
                break;

            case "paypal":
                //promise = post(`/billing/paypal/cancel_subscription`, {'ref_id': subscription.ref_id});
                break;

            case "paddle":
                window.location.assign(subscription.paddle_update_url);
                //promise = post(`/billing/paddle/cancel_subscription`, {'ref_id': subscription.ref_id});
                break;

            case "braintree":
                //promise = post(`/billing/braintree/cancel_subscription`, {'ref_id': subscription.ref_id});
                break;

            default:
                swal("Error canceling subscription, please contact billing@online-go.com").catch(
                    swal.noop,
                );
                break;
        }
    }

    let amount: string;

    if (subscription?.plan?.amount) {
        amount = formatMoney(subscription.plan.currency, subscription.plan.amount);
    } else if (subscription?.last_payment?.amount) {
        amount = formatMoney(subscription.last_payment.currency, subscription.last_payment.amount);
    }

    if (!amount) {
        console.log("No amount determined", subscription);
        if (user.is_superuser) {
            return (
                <div className="Subscription">
                    <div className="developer-options">
                        <h3>error loading subscription information</h3>
                        <pre>{JSON.stringify(subscription, null, 2)}</pre>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    return (
        <div className="Subscription">
            <h3>
                {interpolate(text, {
                    amount: amount,
                    period_in_months: subscription.period_duration_months,
                })}
            </h3>
            {(grandfathered_plan || null) && (
                <h4>
                    {_(
                        "Thanks for being a long time supporter! You have your original reduced rate until canceled.",
                    )}
                </h4>
            )}

            {(subscription.payment_processor !== "paypal" || null) && (
                <button onClick={updatePaymentMethod}>{_("Update Payment Method")}</button>
            )}

            <button onClick={cancel}>{_("Cancel Support")}</button>
        </div>
    );
}

function PaymentMethod({ payment }: { payment: Payment }): JSX.Element {
    const user = data.get("user");
    let details: JSX.Element | null;
    let ret: JSX.Element | null;

    if (payment.payment_method_details?.card) {
        const card = payment.payment_method_details?.card;
        if (card.exp_month && card.exp_year && card.last4) {
            details = (
                <>
                    <span className="last4">&#183;&#183;&#183;{card.last4}</span>
                    <span className="expiration">
                        {card.exp_month}/{card.exp_year}
                    </span>
                </>
            );
        }
    }

    if (payment.payment_processor === "stripe") {
        ret = (
            <span className="PaymentMethod">
                <i className="fa fa-lock" />
                <span className="stripe">via Stripe</span>
                {details}
            </span>
        );
    } else if (payment.payment_processor === "paypal") {
        ret = (
            <span className="PaymentMethod">
                <i className="fa fa-lock" />
                <span className="paypal">via PayPal</span>
                {details}
            </span>
        );
    } else if (payment.payment_processor === "braintree") {
        ret = (
            <span className="PaymentMethod">
                <i className="fa fa-lock" />
                <span>BrainTree</span>
                {details}
            </span>
        );
    } else if (payment.payment_processor === "paddle") {
        ret = (
            <span className="PaymentMethod">
                <i className="fa fa-lock" />
                <span className="paddle">via Paddle.com</span>
                {details}
            </span>
        );
    } else {
        ret = <span className="PaymentMethod">{payment.payment_processor}</span>;
    }

    if (payment.ref_id && user.is_superuser) {
        if (payment.payment_processor === "stripe") {
            return (
                <a href={`https://dashboard.stripe.com/payments/${payment.ref_id}`} target="_blank">
                    {ret}
                </a>
            );
        }
        if (payment.payment_processor === "paypal") {
            return (
                <a
                    href={`https://www.paypal.com/activity/payment/${payment.ref_id}`}
                    target="_blank"
                >
                    {ret}
                </a>
            );
        }
        if (payment.payment_processor === "paddle") {
            return (
                <a href={`https://paddle.com/orders/detail/${payment.ref_id}`} target="_blank">
                    {ret}
                </a>
            );
        }
    }

    return ret;
}

interface ManualServiceCreatorProperties {
    account_id: number;
    config: Config;
}

function ManualServiceCreator({ account_id }: ManualServiceCreatorProperties): JSX.Element {
    const user = data.get("user");
    const [level, setLevel]: [string, React.Dispatch<string>] = React.useState("");
    const [months, setMonths]: [string, React.Dispatch<string>] = React.useState("");

    if (!user.is_superuser) {
        return null;
    }

    function create() {
        console.log("create", parseInt(level), parseInt(months));
        post(`/billing/service`, {
            account_id: account_id,
            level: parseInt(level),
            months: parseInt(months),
        })
            .then((res: any) => console.log(res))
            .catch((err: any) => console.error(err));
    }

    return (
        <div className="developer-options">
            <h3>Manual Service Creation</h3>
            <dl>
                <dt>Level</dt>
                <dd>
                    <input
                        placeholder="level"
                        value={level}
                        onChange={(ev) => setLevel(ev.target.value)}
                    />
                </dd>
                <dt>Months</dt>
                <dd>
                    <input
                        placeholder="months"
                        value={months}
                        onChange={(ev) => setMonths(ev.target.value)}
                    />
                </dd>
            </dl>
            <button onClick={create}>Create</button>
        </div>
    );
}

function ServiceLine({ service }: { service: Service }): JSX.Element {
    const user = data.get("user");
    const [active, setActive] = React.useState(service.active);

    if (!user.is_superuser) {
        return null;
    }

    function toggleActive() {
        put(`/billing/service/${service.id}`, { active: !active })
            .then((res: any) => console.log(res))
            .catch((err: any) => console.error(err));
        setActive(!active);
    }

    return (
        <div className="Service developer-options">
            <span>Level: {service.level}</span>
            <span>Soft Expiration: {service.soft_expiration}</span>
            <span>Hard Expiration: {service.hard_expiration}</span>
            <span>In Grace Period : {service.in_grace_period.toString()}</span>
            <span>Notes: {service.notes}</span>
            <button className={active ? "success" : "reject"} onClick={toggleActive}>
                {active ? _("Active") : _("Inactive")}
            </button>
        </div>
    );
}

interface SupporterOverridesProperties {
    account_id: number;
    overrides: SupporterOverrides;
    config: Config;
    onChange: (overrides: SupporterOverrides) => void;
}

function SupporterOverridesEditor({
    account_id,
    overrides,
    onChange,
    config,
}: SupporterOverridesProperties): JSX.Element {
    const user = data.get("user");
    const prices = config.plans;
    const currency = overrides.currency;

    if (!user.is_superuser) {
        return null;
    }

    function save() {
        console.log("save", overrides);
        put(`players/${account_id}/supporter_overrides`, overrides)
            .then(() => console.log("saved"))
            .catch(console.error);
    }

    function up(key: string, value: any): void {
        overrides[key] = value;
        onChange({ ...overrides }); // copy to force re-render
    }

    function upprice(slug: string, interval: string, value: any): void {
        if (!value) {
            delete overrides.plan[slug][interval];
        } else {
            value = parseInt(value);
            if (!overrides.plan) {
                overrides.plan = {
                    hane: {},
                    tenuki: {},
                };
            }
            overrides.plan[slug][interval] = value;
        }
        let found = false;
        for (const _slug of ["hane", "tenuki"]) {
            for (const _interval of ["month", "year"]) {
                if (overrides?.plan?.[_slug]?.[_interval]) {
                    found = true;
                }
            }
        }
        if (!found) {
            delete overrides.plan;
        }
        onChange({ ...overrides }); // copy to force re-render
    }

    return (
        <div className="developer-options">
            <dl>
                <dt>
                    <label htmlFor="payment_methods">Payment Methods</label>
                </dt>
                <dd>
                    <label htmlFor="auto">Auto</label>
                    <input
                        type="radio"
                        name="payment_methods"
                        id="auto"
                        value={""}
                        checked={!overrides.payment_methods}
                        onChange={(ev) => up("payment_methods", ev.target.value || undefined)}
                    />
                    <label htmlFor="stripe">Stripe + Paypal</label>
                    <input
                        type="radio"
                        name="payment_methods"
                        id="stripe"
                        value={"stripe_and_paypal"}
                        checked={overrides.payment_methods === "stripe_and_paypal"}
                        onChange={(ev) => up("payment_methods", ev.target.value || undefined)}
                    />
                    <label htmlFor="paddle">Paddle</label>
                    <input
                        type="radio"
                        name="payment_methods"
                        id="paddle"
                        value={"paddle"}
                        checked={overrides.payment_methods === "paddle"}
                        onChange={(ev) => up("payment_methods", ev.target.value || undefined)}
                    />
                </dd>

                <dt>
                    <label htmlFor="country">Country</label>
                </dt>
                <dd>
                    <select
                        id="country"
                        value={overrides.country}
                        onChange={(ev) => up("country", ev.target.value || undefined)}
                    >
                        <option value="">Auto</option>
                        {sorted_locale_countries.filter(is_country).map((e) => (
                            <option key={e.cc} value={e.cc.toUpperCase()}>
                                {e.name}
                            </option>
                        ))}
                    </select>
                </dd>

                <dt>
                    <label htmlFor="currency">Currency</label>
                </dt>
                <dd>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(ev) => up("currency", ev.target.value || undefined)}
                    >
                        <option value="">Default</option>
                        {Object.keys(currencies)
                            .filter((currency) => prices[0]?.price[currency])
                            .map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                    </select>
                </dd>

                <dt>
                    <label>Price</label>
                </dt>
                <dd>
                    <label htmlFor="hane">Hane</label>
                    <input
                        id="hane"
                        type="text"
                        placeholder="Monthly"
                        value={overrides.plan?.hane?.month}
                        onChange={(ev) => upprice("hane", "month", ev.target.value || undefined)}
                    />
                    <input
                        placeholder="Yearly"
                        type="text"
                        value={overrides.plan?.hane?.year}
                        onChange={(ev) => upprice("hane", "year", ev.target.value || undefined)}
                    />
                </dd>
                <dd>
                    <label htmlFor="tenuki">Tenuki</label>
                    <input
                        id="tenuki"
                        type="text"
                        placeholder="Monthly"
                        value={overrides.plan?.tenuki?.month}
                        onChange={(ev) => upprice("tenuki", "month", ev.target.value || undefined)}
                    />
                    <input
                        type="text"
                        placeholder="Yearly"
                        value={overrides.plan?.tenuki?.year}
                        onChange={(ev) => upprice("tenuki", "year", ev.target.value || undefined)}
                    />
                </dd>

                <dt>
                    <label htmlFor="paddle_promo_code">Paddle Promo Code</label>
                </dt>
                <dd>
                    <input
                        type="text"
                        id="paddle_promo_code"
                        placeholder="Promo Code"
                        value={overrides.paddle_promo_code}
                        onChange={(ev) => up("paddle_promo_code", ev.target.value || undefined)}
                    />
                </dd>
            </dl>

            <button className="success" onClick={save}>
                Save
            </button>
        </div>
    );
}

function DeprecatedPlanNote({ slug }: { slug: string }): JSX.Element {
    if (slug === "hane" || slug === "tenuki" || slug === "meijin") {
        return null;
    }

    if (slug === null) {
        return null;
    }

    let name = "unknown";
    let playouts = 125;

    switch (slug) {
        case "meijin":
            name = "Meijin";
            playouts = 12000;
            break;

        case "kyu":
            name = "Kyu";
            playouts = 400;
            break;

        case "basic":
            name = "Basic";
            playouts = 125;
            break;

        case "hane":
            name = "Hane";
            playouts = 1000;
            break;

        case "tenuki":
            name = "Tenuki";
            playouts = 3000;
            break;
    }

    return (
        <div className="DeprecatedPlanNote">
            <p>
                {interpolate(
                    pgettext(
                        "Supporters using old plans will see this message",
                        _(
                            "Note: You are currently on the {{name}} plan ({{playouts}} playouts), which we no longer support signing up for, however remains fully functional for you. If you cancel your plan, you will have to sign up to one of the currently offered plans if you want to become a supporter again.",
                        ),
                    ),
                    { name, playouts },
                )}
            </p>
        </div>
    );
}

function is_country({ cc }: { cc: string }): boolean {
    cc = cc.toLowerCase();
    return cc.length === 2 && !/[0-9]/.test(cc) && cc !== "eu";
}

function zero_decimal_to_float(currency_code: string, amount: number): number {
    const currency = currencies[currency_code];
    return amount / Math.pow(10, currency.decimal_digits);
}

function zero_decimal_to_paypal_amount_string(currency_code: string, amount: number): string {
    const currency = currencies[currency_code];
    return (amount / Math.pow(10, currency.decimal_digits)).toFixed(currency.decimal_digits);
}

function formatMoney(currency_code: string, amount: number): string {
    if (!currency_code) {
        return "?";
    }
    const currency = currencies[currency_code];
    const ret = Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: currency_code,
    }).format(zero_decimal_to_float(currency_code, amount));

    // huf is effectively zero decimal, but still need to send with decimal
    if (currency.decimal_digits === 0 || currency_code === "HUF") {
        return ret.replace(/[.,].{2}$/, "");
    }
    return ret;
}

function formatMoneyWithTrimmedZeros(currency_code: string, amount: number): string {
    if (!currency_code) {
        return "?";
    }
    const currency = currencies[currency_code];
    const ret = Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: currency_code,
    }).format(zero_decimal_to_float(currency_code, amount));

    // huf is effectively zero decimal, but still need to send with decimal
    if (currency.decimal_digits === 0 || currency_code === "HUF") {
        return ret.replace(/[.,].{2}$/, "");
    }
    return ret.replace(".00", "");
}

function getCurentPlanSlug(config: Config): string {
    const max_service_level = Math.max(0, ...config.services.map((s) => s.level));
    if (max_service_level >= 20) {
        return "meijin";
    }
    if (max_service_level >= 10) {
        return "tenuki";
    }
    if (max_service_level >= 5) {
        return "hane";
    }
    if (max_service_level >= 3) {
        return "kyu";
    }
    if (max_service_level >= 1) {
        return "basic";
    }
    return null;
}

/*
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
            <b className='green'>{_("3x the analysis done by the AI per move")}</b>,
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
*/
