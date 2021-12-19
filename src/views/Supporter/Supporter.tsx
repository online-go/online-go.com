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

import * as React from "react";
import {Link} from "react-router-dom";
import {_, pgettext, interpolate, current_language} from "translate";
import {del, put, post, get} from "requests";
import {ignore, errorAlerter} from "misc";
import * as data from "data";
import {LineText} from "misc-ui";
import {openBecomeASiteSupporterModal} from "./BecomeASiteSupporter";
import {PrettyTransactionInfo} from './PrettyTransactionInfo';
import {PersistentElement} from 'PersistentElement';
import * as NumberFormat from 'react-number-format';
import { SupporterGoals } from 'SupporterGoals';
import { SiteSupporterText } from './SiteSupporterText';
import {Flag} from "Flag";
import Select from 'react-select';
import * as preferences from "preferences";
import swal from 'sweetalert2';

declare let ogs_release;
declare let StripeCheckout;
declare let MODE;
const ReactNumberFormat: any = NumberFormat;

interface SupporterProperties {
}

const amount_steps = {
    'month': [
        3.0,
        5.0,
        10.0,
        15.0,
        20.0,
        25.0,
        30.0,
        50.0,
        0,
    ],
    'year': [ ],
    'one time': [ ],
};

function getIntervalScale(interval: string): number {
    return interval === 'month' ? 1 : 10;
}

for (let i = 0; i < amount_steps.month.length; ++i) {
    amount_steps['year'][i] = getIntervalScale('year') * amount_steps.month[i];
    amount_steps['one time'][i] = getIntervalScale('one time') * amount_steps.month[i];
}


// alipay list
// aud, cad, eur, gbp, hkd, jpy, nzd, sgd, or usd

/* Decimal information from: http://apps.cybersource.com/library/documentation/sbc/quickref/currencies.pdf */
const currency_list = [
    {'name': 'United States Dollar'        , 'iso': 'USD' ,  'flag': 'us', 'scale': 1.0  , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': [/*default*/]},
    {'name': 'Euro'                        , 'iso': 'EUR' ,  'flag': 'eu', 'scale': 1.0  , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 1, 'locales':
        ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LU', 'MT', 'NL', 'PT', 'SK', 'SL', 'ES']} ,
    {'name': 'Russian Ruble'               , 'iso': 'RUB' ,  'flag': 'ru', 'scale': 50   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['RU']} ,
    {'name': 'British Pound'               , 'iso': 'GBP' ,  'flag': 'gb', 'scale': 1.0  , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['GB']} ,
    {'name': 'Canadian Dollar'             , 'iso': 'CAD' ,  'flag': 'ca', 'scale': 1    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['CA']} ,
    {'name': 'Japanese Yen'                , 'iso': 'JPY' ,  'flag': 'jp', 'scale': 100  , 'decimals': 0, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['JP']} ,
    {'name': 'South Korean Won'            , 'iso': 'KRW' ,  'flag': 'kr', 'scale': 1000 , 'decimals': 0, 'cc': 1, 'paypal': 0, 'alipay': 1, 'sepa': 0, 'locales': ['KR']} ,
    {'name': 'Hong Kong Dollar'            , 'iso': 'HKD' ,  'flag': 'hk', 'scale': 10   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['HK']} ,
    {'name': 'Chinese Yuan'                , 'iso': 'CNY' ,  'flag': 'cn', 'scale': 5    , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 1, 'sepa': 0, 'locales': ['CN']} ,

    {'name': 'Argentine Peso'              , 'iso': 'ARS' ,  'flag': 'ar', 'scale': 10   , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['AR']} ,
    {'name': 'Australian Dollar'           , 'iso': 'AUD' ,  'flag': 'au', 'scale': 1.0  , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['AU']} ,
    {'name': 'Brazilian Real'              , 'iso': 'BRL' ,  'flag': 'br', 'scale': 3.0  , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['BR']} ,
    {'name': 'Bulgarian Lev'               , 'iso': 'BGN' ,  'flag': 'bg', 'scale': 1    , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['BG']} ,
    {'name': 'Czech Koruna'                , 'iso': 'CZK' ,  'flag': 'cz', 'scale': 20   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 0, 'sepa': 0, 'locales': ['CZ']} ,
    {'name': 'Danish Krone'                , 'iso': 'DKK' ,  'flag': 'dk', 'scale': 5    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['DK']} ,
    {'name': 'Hungarian Forint'            , 'iso': 'HUF' ,  'flag': 'hu', 'scale': 250  , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 0, 'sepa': 0, 'locales': ['HU']} ,
    {'name': 'Icelandic Krona'             , 'iso': 'ISK' ,  'flag': 'is', 'scale': 100  , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['IS']} ,
    {'name': 'Indian Rupee'                , 'iso': 'INR' ,  'flag': 'in', 'scale': 50   , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['IN']} ,
    {'name': 'Mexican Peso'                , 'iso': 'MXN' ,  'flag': 'mx', 'scale': 10   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 0, 'sepa': 0, 'locales': ['MX']} ,
    {'name': 'New Zealand Dollar'          , 'iso': 'NZD' ,  'flag': 'nz', 'scale': 1    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['NZ']} ,
    {'name': 'Norwegian Krone'             , 'iso': 'NOK' ,  'flag': 'no', 'scale': 10   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['NO']} ,
    {'name': 'Polish Zloty'                , 'iso': 'PLN' ,  'flag': 'pl', 'scale': 5    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 0, 'sepa': 0, 'locales': ['PL']} ,
    {'name': 'Romanian Leu'                , 'iso': 'RON' ,  'flag': 'ro', 'scale': 5    , 'decimals': 2, 'cc': 1, 'paypal': 0, 'alipay': 0, 'sepa': 0, 'locales': ['RO']} ,
    {'name': 'Singapore Dollar'            , 'iso': 'SGD' ,  'flag': 'sg', 'scale': 1    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['SG']} ,
    {'name': 'Swedish Krona'               , 'iso': 'SEK' ,  'flag': 'se', 'scale': 10   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['SE']} ,
    {'name': 'Swiss Franc'                 , 'iso': 'CHF' ,  'flag': 'ch', 'scale': 1    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['CH']} ,
    {'name': 'Thai Baht'                   , 'iso': 'THB' ,  'flag': 'th', 'scale': 30   , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 1, 'sepa': 0, 'locales': ['TH']} ,
    {'name': 'United Arab Emirates Dirham' , 'iso': 'AED' ,  'flag': 'ae', 'scale': 5    , 'decimals': 2, 'cc': 1, 'paypal': 1, 'alipay': 0, 'sepa': 0, 'locales': ['AE']} ,
];

// put here locales for that we should show images/text/etc from right to left
const locale_details = [
    { 'name': 'ja', rtl: 1 },
];

const currency_map = {};
for (const x of currency_list) {
    currency_map[x.iso] = x;
}

const active_currency_list = currency_list.filter(currency => currency.iso !== 'ARS' && currency.iso !== 'INR');

data.watch('config.supporter_currency_scale', (scales) => {
    for (let i = 0; i < currency_list.length; ++i) {
        const iso = currency_list[i].iso;
        if (iso in scales) {
            currency_list[i].scale = scales[iso];
        } else {
            console.error("Missing currency scale: ", iso);
        }
    }
});


const interval_list = [
    {'name': _('month'),    'interval': 'month'},
    {'name': _('year'),     'interval': 'year'},
    {'name': _('one time'), 'interval': 'one time'},
];
const interval_map = {};
for (const x of interval_list) {
    interval_map[x.interval] = x;
}

const interval_description = {
    'month': _('Monthly donation'),
    'year': _('Yearly donation'),
    'one time': _('One time donation'),
};



function getDecimalSeparator() {
    return (1.1).toLocaleString().substring(1, 2);
}

function getThousandSeparator() {
    return (1000).toLocaleString().substring(1, 2);
}

function toFixedWithLocale(n: number, decimals: number = 2) {
    return n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatMoney(currency: string, n: number, no_fraction_digits: boolean = false): string {
    const ret = Intl.NumberFormat(navigator.language, { style: 'currency', currency: currency}).format(n);

    if (no_fraction_digits) {
        return ret.replace(/[.,].{2}$/, "");
    }
    return ret;
}

function filterCurrencyOption({label, value, data}, text: string): boolean {
    if (!text) {
        text = "";
    }
    text = text.toLowerCase();
    const currency = data;

    if (currency.iso.toLowerCase().indexOf(text) >= 0) {
        return true;
    }
    if (currency.name.toLowerCase().indexOf(text) >= 0) {
        return true;
    }
    return false;
}

function isPaypalEnabled(iso: string): boolean {
    return currency_list.filter(x => x.iso === iso)[0].paypal !== 0;
}

// gets direction of items withing contener by current_language
function getDirection(lang: string): string {
    const defaultValue = "ltr";
    for (let i = 0; i < locale_details.length; ++i) {
        if (locale_details[i].name === lang) {
            return locale_details[i].rtl === 1 ? "rtl" : defaultValue;
        }
    }

    return defaultValue;
}

function getCurrencyScale(iso: string) {
    return currency_list.filter(x => x.iso === iso)[0].scale;
}

function getCurrencyDecimals(iso: string) {
    return currency_list.filter(x => x.iso === iso)[0].decimals;
}

function scaledAmountToFloat(amount: number, currency: string) {
    return amount / Math.pow(10, getCurrencyDecimals(currency));
}

function guessCurrency(): string {
    const currency = preferences.get('supporter.currency');
    if (currency !== 'auto') {
        return currency;
    }

    const lang = navigator.language;

    for (const currency of currency_list) {
        for (const locale of currency.locales) {
            if (navigator.language.toUpperCase().indexOf(locale) > 0) {
                return currency.iso;
            }
        }
    }

    return 'USD';
}



let DEPRECATED_stripe_checkout_js_promise;
let stripe_checkout_js_promise;
const checkout = null;

declare let Stripe;
let stripe;

/* TODO: Delete this code after we're sure we don't need it anymore. This allows anoek
 * to do some easy testing with the deprecated braintree system though, so we're keeping
 * it for awhile. (Honestly probably until the last braintree credit card expires) */
/**** DEPRECATED BRAINTREE CODE ****/
let braintree_js_promise;
let braintree;
declare let Braintree;


try {

    if (data.get('user').id === 1) {
        braintree_js_promise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://js.braintreegateway.com/v1/braintree.js";
            script.async = true;
            script.charset = "utf-8";
            script.onload = () => {
                braintree = Braintree.create(data.get("config.braintree_cse"));
            };
            script.onerror = () => {
                console.error('Failed to load braintree');
            };
            document.head.appendChild(script); //or something of the likes
        });
    }

} catch (e) {

}
/**** END DEPRECATED BRAINTREE CODE ****/

// "card_type": method.card_type,
// "interval": interval,
// "last_four": method.card_number,
// "month": method.expiration_month,
// "year": method.expiration_year,
interface RecurringDonation {
    price: number|string;  // TODO: figure out which one it is!
    currency: string;
    interval: string;
    vendor: string;
    account: { payment_vendor: string };
    method: {
        card_type: string;
        card_number: string;
        expiration_month: string;
        expiration_year: string;
    };
    id?: number;
    order_id?: string;
}
interface SupporterState {
    loading: boolean;
    processing?: boolean;
    disable_payment_buttons?: boolean;
    show_update_cc?: boolean;
    amount: number;
    custom_amount: number;
    currency: string;
    interval: string;
    last_transaction?: any;
    recurring_donations?: RecurringDonation[];
    amount_step?: number;
}

export class Supporter extends React.PureComponent<SupporterProperties, SupporterState> {
    refs: {
        ccnum;
        cccvc;
        ccexp;
        fname;
        lname;
        email;
    };

    constructor(props) {
        super(props);
        if (data.get('user').anonymous) {
            this.state = {
                loading: false,
                currency: guessCurrency(),
                amount: 0,
                custom_amount: 50.0,
                interval: preferences.get('supporter.interval'),
            };
        } else {
            this.state = {
                loading: true,
                processing: false,
                disable_payment_buttons: false,
                show_update_cc: false,
                //amount_step: 2,
                amount: amount_steps[preferences.get('supporter.interval')][1],
                custom_amount: 50.0,
                currency: guessCurrency(),
                interval: preferences.get('supporter.interval'),
                last_transaction: null,
                recurring_donations: [],
            };
        }
    }

    componentWillUnmount() {
    }

    componentDidMount() {
        window.document.title = _("Support OGS");

        if (!DEPRECATED_stripe_checkout_js_promise) {
            DEPRECATED_stripe_checkout_js_promise = new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://checkout.stripe.com/checkout.js";
                script.async = true;
                script.charset = "utf-8";
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject("Unable to load old stripe checkout");
                };
                document.head.appendChild(script);
            });

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


        if (!data.get('user').anonymous) {
            DEPRECATED_stripe_checkout_js_promise.then(() => {
                get("me/supporter")
                .then((supporter) => {
                    this.setState(Object.assign({loading: false}, supporter));
                })
                .catch(errorAlerter);

                get("me/purchase_transactions", {order_by: "-created", page_size:1})
                .then((res) => {
                    this.setState({
                        last_transaction: res.results.length ? res.results[0] : null
                    });
                })
                .catch(errorAlerter);
            })
            .catch(errorAlerter);
        }

    }

    /*
    setAmountByStep = (ev) => {
        let step = parseInt(ev.target.value);
        let amount = amount_steps[this.state.interval][parseInt(ev.target.value)];

        this.setState({
            amount_step: step,
            amount: amount,
            custom_amount: amount ? this.state.custom_amount : amount_steps[this.state.interval][amount_steps[this.state.interval].length - 2] * 2 * getCurrencyScale(this.state.currency)
        });
    }
    */
    setCurrency = (currency_option) => {
        console.log(currency_option);
        const currency = currency_option.iso;
        const custom_amount_scale = (1.0 / getCurrencyScale(this.state.currency)) * getCurrencyScale(currency);

        if (currency) {
            this.setState({
                currency: currency,
                custom_amount: Math.round(this.state.custom_amount * custom_amount_scale),
            });
            preferences.set("supporter.currency", currency);
        }
    };
    setInterval = (interval_option) => {
        if (interval_option) {
            const interval = interval_option.interval;
            const step = this.state.amount_step;

            this.setState({
                interval: interval,
                amount: amount_steps[interval][step],
            });

            preferences.set("supporter.interval", interval);
        }
    };
    updateCustomAmount = (values) => {
        console.log(values);
        this.setState({
            custom_amount: values.floatValue || 0.0
        });
    };
    isValueAllowed = (values) => {
        return (values.floatValue || 0) >= 0;
    };
    getAmount() {
        if (this.state.amount) {
            return this.state.amount * getCurrencyScale(this.state.currency);
        }
        return this.state.custom_amount;
    }
    getStripeAmount() {
        /* Stripe wants amount values in whole number units of the smallest currency fraction, which
         * is to say, $5.00 => 500 */
        return this.getAmount() * Math.pow(10, getCurrencyDecimals(this.state.currency));
    }


    cancelRecurringDonation(id) {
        swal({
            text: _("Are you sure you want to cancel your support for OGS?"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => {
            this.setState({processing: true});
            del(`me/purchases/${id}`)
            .then(() => {
                window.location.reload();
            })
            .catch((err) => {
                this.setState({processing: false});
                console.error(err);
                swal("Error canceling subscription, please contact billing@online-go.com").catch(swal.noop);
            });
        })
        .catch(errorAlerter);
    }

    /**** DEPRECATED BRAINTREE CODE ****/
    DEPRECATEDprocessBraintreeCC = () => {
        const amount = this.getAmount();

        if (amount < 1.0) {
            return;
        }


        if (this.state.processing) {
            console.log("Already clicked");
            return;
        }
        this.setState({processing: true});

        this.createPaymentAccountAndMethod("braintree", {
            "fname": 'john',
            "lname": 'dough',
            "email": 'anoek@online-go.com',
            "ccnum": '4111111111111111',
            "exp_month": 12,
            "exp_year": 2020,
            "cccvc": 123,
        })
        .then((obj) => {
            const payment_account = obj.payment_account;
            const payment_method = obj.payment_method;
            //this.processSupporterSignup(payment_method, amount)
            const currency = this.state.currency;
            const interval = this.state.interval;
            this.processSupporterSignup('braintree', payment_method, amount, currency, interval)
            .then(() => {
                window.location.reload();
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    };

    processPaypal = () => {
        if (this.state.disable_payment_buttons) {
            return;
        }

        const amount = this.getAmount();

        if (amount < 1.0) {
            return;
        }

        //<input id='paypal-purchase-id' type="hidden" name="invoice" value="" />
        this.createPaymentAccountAndMethod("paypal", null)
        .then((obj) => {
            console.log("Preparing paypal purchase", obj);
            const payment_account = obj.payment_account;
            const payment_method = obj.payment_method;
            const currency = this.state.currency;
            const interval = this.state.interval;
            this.processSupporterSignup('paypal', payment_method, amount, currency, interval)
            .then(() => {
                console.log("Navigating to paypal purchase page");
            })
            .catch(ignore); /* we already alert in this case */
        })
        .catch(errorAlerter);
    };
    cancelPaypal = () => {
        swal({
            html: "PayPal requires that you cancel PayPal subscriptions from within their interface. Please sign in to <a href='https://paypal.com/'>paypal.com</a> to cancel the support. Sorry for the inconvenience, and thank you for the support you've given us!"
        }).catch(swal.noop);
    };

    createPaymentAccountAndMethod(vendor, details) {
        const obj = {
            "payment_vendor": vendor,
        };
        if (details) {
            obj["first_name"] = details.fname;
            obj["last_name"] = details.lname;
            obj["email"] =  details.email;
            obj["number"] = braintree.encrypt(details.ccnum);
            obj["expiration_month"] = braintree.encrypt(details.exp_month);
            obj["expiration_year"] = braintree.encrypt(details.exp_year);
            obj["cvv"] = braintree.encrypt(details.cccvc);
        }

        console.log("Creating payment account for vendor ", vendor, details);
        return post("me/payment_accounts", obj);
    }
    processSupporterSignup(vendor, payment_method, amount, currency, interval) {
        const promise = post("me/supporter", {
            "vendor": vendor,
            "payment_method": payment_method,
            "price": amount,
            "currency": currency,
            "interval": interval,
        });

        promise
        .then((purchase) => {
            console.log("Purchase settlement:", purchase);
            if (purchase.type === "braintree") {
                console.log(purchase);
                console.log("BT payment successful, order id ", purchase.order_id);
            }
            if (purchase.type === "paypal") {
                console.log("Paypal payment initiated", purchase);
                $("#paypal-amount").val(amount);
                $("#paypal-player-id").val(data.get("user").id);
                $("#paypal-purchase-id").val(purchase.purchase_id);
                $("#paypal-form").submit();
            }
        })
        .catch(errorAlerter);

        return promise;
    }

    /* Returns the aggregate descaled support amount per month */
    getSupportLevel(): number {
        return Math.round(this.getAmount() / (getIntervalScale(this.state.interval) * getCurrencyScale(this.state.currency))) ;
    }

    /* Sets support level based on scaled support amount */
    setSupportLevel(amount: number) {
        if (data.get('user').anonymous) {
            return;
        }

        amount *= getIntervalScale(this.state.interval);
        let step = 0;
        for (; step < amount_steps[this.state.interval].length; ++step) {
            const e = 0.0001;
            if (amount > amount_steps[this.state.interval][step] - e && amount < amount_steps[this.state.interval][step] + e) {
                break;
            }
        }
        const amt = amount_steps[this.state.interval][step];

        this.setState({
            amount_step: step,
            amount: amt,
            custom_amount: amt ? amount : amt
        });
    }

    learnMore = (ev) => {
        ev.stopPropagation();
        openBecomeASiteSupporterModal();
    };


    render() {
        if (this.state.loading) {
            return null;
        }

        const user = data.get("user");
        const processing = this.state.processing;
        const cdn_release = data.get("config.cdn_release");

        const supporter_level = (
            <div className='supporter-text-container'>

                <div className='SiteSupporterText'>
                    <div className='supporter-header'>
                        {_("Becoming a supporter gives you the benefit of having your games automatically analysed by a very strong artificial intelligence engine at the end of your game to help discover better moves that could have been made. The engine has professional strength intuition for all supporter levels, the difference between the plans is in how many times the servers \"play out\" your game, which gives you deeper readings and will sometimes discover less obvious but really great moves.")}
                    </div>
                </div>
                <div id='supporter-ai-perks' >
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() === 3 ? 'active' : '')} onClick={() => this.setSupportLevel(3)}>
                        <div className='title'>
                            <span>{_("Kyu Supporter")}</span>
                        </div>
                        <div className='text'>
                            <div>{_("AI reviews are already quite strong, reads a few moves deep")}</div>
                        </div>
                        <div className='price'>
                            <span>
                                {formatMoney(this.state.currency, 3 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)} / {this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                            </span>
                        </div>
                    </div>
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() === 5 ? 'active' : '')} onClick={() => this.setSupportLevel(5)}>
                        <div className='title'>
                            <span>{_("Dan Supporter")}</span>
                        </div>
                        <div className='text'>
                            <div>{_("Moderately deep reading in your AI reviews")}</div>
                        </div>
                        <div className='price'>
                            <span>
                                {formatMoney(this.state.currency, 5 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)} / {this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                            </span>
                        </div>
                    </div>
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() === 10 ? 'active' : '')} onClick={() => this.setSupportLevel(10)}>
                        <div className='title'>
                            <span>{_("Pro Supporter")}</span>
                        </div>
                        <div className='text'>
                            <div>{_("Deep reading, very good analysis in most situations")}</div>
                        </div>
                        <div className='price'>
                            <span>
                                {formatMoney(this.state.currency, 10 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)} / {this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                            </span>
                        </div>
                    </div>
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() === 25 ? 'active' : '')} onClick={() => this.setSupportLevel(25)}>
                        <div className='title'>
                            <span>{pgettext("Meijin is a Japanese word meaning master, expert, or virtuoso. It was reserved for the single strongest go player.", "Meijin Supporter")}</span>
                        </div>
                        <div className='text'>
                            <div>{_("Very deep reading, intended for the most serious students")}</div>
                        </div>
                        <div className='price'>
                            <span>
                                {formatMoney(this.state.currency, 25 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)} / {this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );

        const supporter_text = (
            <div className='supporter-text-container'>
                <div className='supporter-text'>
                    <SiteSupporterText />
                </div>
            </div>
        );

        if (user.anonymous) {
            return (
                <div id="Supporter">
                    <h2><span><i className="fa fa-star"></i> {_("Support OGS")}</span></h2>

                    <h1 style={{"textAlign": "center"}}>
                        <i>Please <Link to='/sign-in#/user/supporter' className='btn primary'>{_("Sign In")}</Link> to donate</i>
                    </h1>

                    {supporter_level}

                    {supporter_text}
                </div>
            );
        }

        return (
            <div id="Supporter">
                <h2><span><i className="fa fa-star"></i> {_("Support OGS")}</span>
                    {this.state.recurring_donations.length > 0 && <span> {_("Thank you for your support!")}</span>}
                </h2>

                <div id="supporter-payment-block-container">
                    {supporter_level}

                    <div id="supporter-payment-block">
                        <div id='supporter-input-amount'>
                            {/*
                        <div>
                            <input type="range" value={this.state.amount_step} onChange={this.setAmountByStep} min={0} max={amount_steps[this.state.interval].length - 1} step={1}/>
                        </div>
                        */}
                            <div>
                                {this.state.amount === 0
                                ? <div className='donation-summary'>
                                    {this.renderCurrencySelect()}
                                    <ReactNumberFormat
                                        type='text'
                                        className='supporter-amount'
                                        decimalSeparator={getDecimalSeparator()}
                                        thousandSeparator={getThousandSeparator()}
                                        value={this.state.custom_amount}
                                        decimalScale={2}
                                        onValueChange={this.updateCustomAmount}
                                        isAllowed={this.isValueAllowed}
                                        allowNegative={false}
                                    />
                                          / {this.renderIntervalSelect()}
                                </div>
                                : <div className='donation-summary'>
                                    {this.renderCurrencySelect()}
                                    <span className='supporter-amount'>{formatMoney(this.state.currency, this.getAmount())}
                                    </span>
                                    / {this.renderIntervalSelect()}
                                </div>
                                }
                            </div>
                            <div className='supporter-payment-buttons'>
                                <div className='stripe'>

                                    <button className="stripe-button" onClick={this.processStripe} disabled={this.state.disable_payment_buttons || this.state.processing}>
                                        {_("Donate with Card")}
                                    </button>

                                    <div className='powered-by-stripe'>
                                        <a href='https://stripe.com/'>
                                            <img src={`${cdn_release}/img/powered_by_stripe.svg`} />
                                        </a>
                                    </div>
                                </div>

                                <div className="paypal">
                                    <form id="paypal-form" action={data.get("config.paypal_server")} method="post" target="_top">
                                        <input type="hidden" name="cmd" value={this.state.interval === 'one time' ? "_donations" : "_xclick-subscriptions"} />
                                        <input type="hidden" name="business" value={data.get("config.paypal_email")} />
                                        <input type="hidden" name="item_name" value="Supporter Account" />
                                        {this.state.interval !== "one time" && <input type="hidden" name="a3" value={this.getAmount().toFixed(2)} />}
                                        {this.state.interval !== "one time" && <input type="hidden" name="p3" value="1" />}
                                        {this.state.interval !== "one time" && <input type="hidden" name="t3" value={this.state.interval === "month" ? "M" : "Y"} />}

                                        {this.state.interval === "one time" && <input type="hidden" name="amount" value={this.getAmount().toFixed(2)} />}
                                        <input type="hidden" name="src" value="1" />
                                        <input type="hidden" name="no_note" value="1" />
                                        <input type="hidden" name="currency_code" value={this.state.currency} />
                                        <input type="hidden" name="custom" value={data.get("user").id} />
                                        <input id="paypal-purchase-id" type="hidden" name="invoice" value="" />
                                        <input type="hidden" name="modify" value="0" />
                                        <input type="hidden" name="notify_url" value={`https://${data.get("config.server_name")}/merchant/paypal_postback`} />
                                    </form>
                                    <button className='paypal-button' disabled={!isPaypalEnabled(this.state.currency)} dir={getDirection(current_language)}
                                        onClick={isPaypalEnabled(this.state.currency) ? this.processPaypal : null} >
                                        {_("Donate with")} <img src={`${cdn_release}/img/new_paypal.png`} />
                                    </button>
                                </div>
                            </div>

                            {false && data.get('user').id === 1 &&
                            <button className="danger" onClick={this.DEPRECATEDprocessBraintreeCC}>
                                {interpolate((`Braintree {{amount}}/month`), {"amount": `$${toFixedWithLocale(this.getAmount(), 2)}`})}
                            </button>
                            }
                        </div>
                    </div>
                </div>

                <div className='supporter-text'>
                    {supporter_text}
                </div>

                <div id="supporter-current-methods">

                    {this.state.recurring_donations.map((recurring_donation, idx) => {
                        const price = recurring_donation.price;
                        const currency = recurring_donation.currency;
                        const interval = recurring_donation.interval;
                        const vendor = recurring_donation.account.payment_vendor;
                        const account = recurring_donation.account;
                        const method = recurring_donation.method;

                        return (
                            <div key={recurring_donation.id}>

                                {(vendor === "stripe" || null) &&
                                <div className='recurring-donation'>
                                    <p>
                                        {interpolate(
                                            interval === 'month'
                                            ?  _("You are currently supporting us with {{amount}} per month from your {{card_type}} card ending in {{last_four}} and expiring on {{month}}/{{year}}, thanks!")
                                            : (interval === 'year'
                                                ?  _("You are currently supporting us with {{amount}} per year from your {{card_type}} card ending in {{last_four}} and expiring on {{month}}/{{year}}, thanks!")
                                                : "<ERROR: amount = {{amount}} interval = {{interval}}>"
                                            ),
                                            {
                                                "amount": formatMoney(currency, price as number),
                                                "card_type": method.card_type,
                                                "interval": interval,
                                                "last_four": method.card_number,
                                                "month": method.expiration_month,
                                                "year": method.expiration_year,
                                            })
                                        }
                                    </p>

                                    {
                                        <React.Fragment>
                                            {recurring_donation.order_id &&
                                                <button className="btn" style={{marginTop: "3em"}} onClick={() => this.updateStripePaymentMethod(recurring_donation.order_id)} disabled={this.state.processing}>
                                                    {_("Update payment method")}
                                                </button>
                                            }
                                            <button className="btn" style={{marginTop: "3em"}} onClick={() => this.cancelRecurringDonation(recurring_donation.id)} disabled={this.state.processing}>
                                                {_("Cancel this support")}
                                            </button>
                                        </React.Fragment>
                                    }
                                </div>
                                }

                                {(vendor === "paypal" || null) &&
                                <div className='recurring-donation'>
                                    <p>
                                        {interpolate(
                                            interval === 'month'
                                            ?  _("You are currently supporting us with {{amount}} per month from your paypal account, thanks!")
                                            : (interval === 'year'
                                                ?  _("You are currently supporting us with {{amount}} per year from your paypal account, thanks!")
                                                : "<ERROR: amount = {{amount}} interval = {{interval}}>"
                                            ),
                                            {
                                                "amount": formatMoney(currency, price as number),
                                            })
                                        }
                                    </p>

                                    <button className="btn" style={{marginTop: "3em"}} onClick={this.cancelPaypal}  disabled={this.state.processing}>
                                        {_("Cancel this support")}
                                    </button>
                                </div>
                                }

                                {(vendor === "braintree" || null) &&
                                <div className='recurring-donation'>
                                    <p>
                                        {interpolate(_("You are currently supporting us with ${{amount}} per month from your {{card_type}} card ending in {{last_four}} and expiring on {{month}}/{{year}}, thanks!"),
                                            {
                                                "amount": toFixedWithLocale(parseFloat(price as string)),
                                                "card_type": method.card_type,
                                                "last_four": method.card_number,
                                                "month": method.expiration_month,
                                                "year": method.expiration_year,
                                            })
                                        }
                                    </p>

                                    {
                                        <button className="btn" style={{marginTop: "3em"}} onClick={() => this.cancelRecurringDonation(recurring_donation.id)}  disabled={this.state.processing}>
                                            {_("Cancel this support")}
                                        </button>
                                    }
                                </div>
                                }

                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    renderCurrencySelect() {
        return (
            <Select
                className='currency-select'
                classNamePrefix='ogs-react-select'
                value={currency_map[this.state.currency]}
                onChange={this.setCurrency}
                options={active_currency_list}
                isClearable={false}
                isSearchable={true}
                blurInputOnSelect={true}
                noResultsText={_("No results found")}
                filterOption={filterCurrencyOption}
                getOptionLabel={C => C.iso}
                getOptionValue={C => C.iso}
                components={{
                    Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                        <div ref={innerRef} {...innerProps}
                            className={'currency-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                            <span className='iso'>{data.iso}</span><Flag country={data.flag} />
                        </div>
                    ),
                    SingleValue: ({innerProps, data}) => (
                        <span {...innerProps} className='currency-option'>
                            <span className='iso'>{data.iso}</span><Flag country={data.flag} />
                        </span>
                    ),
                    ValueContainer: ({children}) => (
                        <div className='currency-option-container'>
                            {children}
                        </div>
                    ),
                }}
            />
        );
    }

    renderIntervalSelect() {
        return (
            <Select
                className='interval-select'
                classNamePrefix='ogs-react-select'
                value={interval_map[this.state.interval]}
                onChange={this.setInterval}
                options={interval_list}
                blurInputOnSelect={true}
                isClearable={false}
                isSearchable={false}
                getOptionLabel={C => C.name}
                getOptionValue={C => C.interval}
                components={{
                    Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                        <div ref={innerRef} {...innerProps}
                            className={(isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                            {data.name}
                        </div>
                    ),
                }}
            />
        );
    }


    updateStripePaymentMethod = (order_id: string) => {
        this.setState({disable_payment_buttons: true});

        post("me/update_stripe_session", {
            //'interval': this.state.interval,
            //'currency': this.state.currency,
            //'amount': this.getAmount(),
            //'stripe_amount': this.getStripeAmount(),
            'order_id': order_id,
            'redirect_url': window.location.href,
            'name': _("Supporter"),
            'description': _("Supporter")
        })
        .then((session) => {
            stripe.redirectToCheckout({
                sessionId: session.session_id
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
    };
    processStripe = () => {
        this.setState({disable_payment_buttons: true});

        post("me/stripe_session", {
            'interval': this.state.interval,
            'currency': this.state.currency,
            'amount': this.getAmount(),
            'stripe_amount': this.getStripeAmount(),
            'redirect_url': window.location.href,
            'name': _("Supporter"),
            'description': _("Supporter")
        })
        .then((session) => {
            stripe.redirectToCheckout({
                sessionId: session.session_id
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
    };
}
