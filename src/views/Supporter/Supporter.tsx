/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {del, put, post, get} from "requests";
import {ignore, errorAlerter} from "misc";
import * as data from "data";
import {LineText} from "misc-ui";
import {openBecomeASiteSupporterModal} from "./BecomeASiteSupporter";
import {PrettyTransactionInfo} from './PrettyTransactionInfo';
import {PersistentElement} from 'PersistentElement';
//import { default as ReactNumberFormat } from 'react-number-format';
//import NumberFormat from 'react-number-format';
import * as NumberFormat from 'react-number-format';
import { SupporterGoals } from 'SupporterGoals';
import { SiteSupporterText } from './SiteSupporterText';
import {Flag} from "Flag";
import Select from 'react-select';
import * as preferences from "preferences";

declare var swal;
declare var ogs_release;
declare var StripeCheckout;
declare var amex_express_checkout_callback;
declare var MODE;
const ReactNumberFormat:any = NumberFormat;

interface SupporterProperties {
}

let amex_express_checkout_button = document.getElementById('amex-express-checkout');

let amount_steps = {
    'month': [
        1.0,
        2.0,
        3.0,
        4.0,
        5.0,
        7.5,
        10.0,
        15.0,
        20.0,
        25.0,
        50.0,
        0,
    ],
    'year': [ ],
    'one time': [ ],
};

function getIntervalScale(interval:string):number {
    return interval === 'month' ? 1 : 10;
}

for (let i = 0; i < amount_steps.month.length; ++i) {
    amount_steps['year'][i] = getIntervalScale('year') * amount_steps.month[i];
    amount_steps['one time'][i] = getIntervalScale('one time') * amount_steps.month[i];
}


// alipay list
// aud, cad, eur, gbp, hkd, jpy, nzd, sgd, or usd

/* Decimal information from: http://apps.cybersource.com/library/documentation/sbc/quickref/currencies.pdf */
let currency_list = [
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

data.watch('config.supporter_currency_scale', (scales) => {
    for (let i = 0; i < currency_list.length; ++i) {
        let iso = currency_list[i].iso;
        if (iso in scales) {
            currency_list[i].scale = scales[iso];
        } else {
            console.error("Missing currency scale: ", iso);
        }
    }
});


let interval_list = [
    {'name': _('month'),    'interval': 'month'},
    {'name': _('year'),     'interval': 'year'},
    {'name': _('one time'), 'interval': 'one time'},
];

let interval_description = {
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

function toFixedWithLocale(n:number, decimals:number = 2) {
    return n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatMoney(currency: string, n:number, no_fraction_digits:boolean = false):string {
    let ret = Intl.NumberFormat(navigator.language, { style: 'currency', currency: currency}).format(n);

    if (no_fraction_digits) {
        return ret.replace(/[.,].*/, "");
    }
    return ret;
}

function filterCurrencyOption(currency:any, text:string):boolean {
    text = text.toLowerCase();
    if (currency.iso.toLowerCase().indexOf(text) >= 0) {
        return true;
    }
    if (currency.name.toLowerCase().indexOf(text) >= 0) {
        return true;
    }
    return false;
}

function isPaypalEnabled(iso:string) {
    return currency_list.filter(x => x.iso === iso)[0].paypal;
}

function getCurrencyScale(iso:string) {
    return currency_list.filter(x => x.iso === iso)[0].scale;
}

function getCurrencyDecimals(iso:string) {
    return currency_list.filter(x => x.iso === iso)[0].decimals;
}

function scaledAmountToFloat(amount:number, currency:string) {
    return amount / Math.pow(10, getCurrencyDecimals(currency));
}

function guessCurrency() {
    let currency = preferences.get('supporter.currency');
    if (currency !== 'auto') {
        return currency;
    }

    let lang = navigator.language;

    for (let currency of currency_list) {
        for (let locale of currency.locales) {
            if (navigator.language.toUpperCase().indexOf(locale) > 0) {
                return currency.iso;
            }
        }
    }

    return 'USD';
}



let amex_express_js_promise;
let stripe_checkout_js_promise;
let stripe_js_promise;
let checkout = null;

/* TODO: Delete this code after we're sure we don't need it anymore. This allows anoek
 * to do some easy testing with the deprecated braintree system though, so we're keeping
 * it for awhile. Should be safe to remove by 2018-06-01 if not before. */
/**** DEPRECATED BRAINTREE CODE ****/
let braintree_js_promise;
let braintree;
declare var Braintree;

try {

    if (data.get('user').id === 1) {
        braintree_js_promise = new Promise((resolve, reject) => {
            let script = document.createElement("script");
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


export class Supporter extends React.PureComponent<SupporterProperties, any> {
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
                amount: amount_steps[preferences.get('supporter.interval')][4],
                custom_amount: 50.0,
                amount_step: 4,
                currency: guessCurrency(),
                interval: preferences.get('supporter.interval'),
                last_transaction: null,
                recurring_donations: [],
            };
        }
    }

    componentWillUnmount() {{{
        $("body").append(amex_express_checkout_button);
    }}}

    componentDidMount() {{{
        amex_express_checkout_callback = (response) => {
                post("me/process_stripe", {
                    'interval': this.state.interval,
                    'currency': this.state.currency,
                    'amount': this.getAmount(),
                    'stripe_amount': this.getStripeAmount(),
                    'payment_method_token': {"id": response.token}
                })
                .then(() => {
                    this.setState({processing: false});
                    window.location.reload();
                })
                .catch(errorAlerter);
        };

        if (!amex_express_js_promise) {
            amex_express_js_promise = new Promise((resolve, reject) => {
                let script = document.createElement("script");
                script.src = "https://icm.aexp-static.com/Internet/IMDC/US_en/RegisteredCard/AmexExpressCheckout/js/AmexExpressCheckout.js";
                script.async = true;
                script.charset = "utf-8";
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject("Unable to load stripe checkout");
                };
                document.head.appendChild(script);
            });
        }



        if (!stripe_checkout_js_promise) {
            stripe_checkout_js_promise = new Promise((resolve, reject) => {
                let script = document.createElement("script");
                script.src = "https://checkout.stripe.com/checkout.js";
                script.async = true;
                script.charset = "utf-8";
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject("Unable to load stripe checkout");
                };
                document.head.appendChild(script);
            });
        }



        if (!data.get('user').anonymous) {
            stripe_checkout_js_promise.then(() => {
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

    }}}

    setAmountByStep = (ev) => {{{
        let step = parseInt(ev.target.value);
        let amount = amount_steps[this.state.interval][parseInt(ev.target.value)];

        this.setState({
            amount_step: step,
            amount: amount,
            custom_amount: amount ? this.state.custom_amount : amount_steps[this.state.interval][amount_steps[this.state.interval].length - 2] * 2 * getCurrencyScale(this.state.currency)
        });
    }}}
    setCurrency = (currency) => {{{
        let custom_amount_scale = (1.0 / getCurrencyScale(this.state.currency)) * getCurrencyScale(currency);

        if (currency) {
            this.setState({
                currency: currency,
                custom_amount: Math.round(this.state.custom_amount * custom_amount_scale),
            });
            preferences.set("supporter.currency", currency);
        }
    }}}
    setInterval = (interval) => {{{
        if (interval) {
            let step = this.state.amount_step;

            this.setState({
                interval: interval,
                amount: amount_steps[interval][step],
            });

            preferences.set("supporter.interval", interval);
        }
    }}}
    updateCustomAmount = (values) => {{{
        console.log(values);
        this.setState({
            custom_amount: values.floatValue || 0.0
        });
    }}}
    isValueAllowed = (values) => {{{
        return (values.floatValue || 0) >= 0;
    }}}
    getAmount() {{{
        if (this.state.amount) {
            return this.state.amount * getCurrencyScale(this.state.currency);
        }
        return this.state.custom_amount;
    }}}
    getStripeAmount() {{{
        /* Stripe wants amount values in whole number units of the smallest currency fraction, which
         * is to say, $5.00 => 500 */
        return this.getAmount() * Math.pow(10, getCurrencyDecimals(this.state.currency));
    }}}


    cancelRecurringDonation(id) {{{
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
                swal("Error canceling subscription, please contact billing@online-go.com");
            });
        })
        .catch(errorAlerter);
    }}}

    /**** DEPRECATED BRAINTREE CODE ****/
    DEPRECATEDprocessCC = () => {{{
        let amount = this.getAmount();

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
            let payment_account = obj.payment_account;
            let payment_method = obj.payment_method;
            //this.processSupporterSignup(payment_method, amount)
            let currency = this.state.currency;
            let interval = this.state.interval;
            this.processSupporterSignup('braintree', payment_method, amount, currency, interval)
            .then(() => {
                window.location.reload();
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    }}}

    /*
    DEPRECATEDupdateCC = () => {{{
        if (!this.validateCC()) {
            return;
        }

        if (this.state.processing) {
            console.log("Already clicked");
            return;
        }
        this.setState({processing: true});

        let ccnum = this.state.card_number_spaced.replace(/[^0-9]/g, "");
        let m = this.state.card_exp_spaced.match(/^([0-9]+)\s+[\/]\s+([0-9]+)$/);
        let exp_month = parseInt(m[1]);
        let exp_year = parseInt("20" + m[2]);

        return put("me/payment_methods/%%", this.state.payment_method.id, {
            "first_name": this.state.fname.trim(),
            "last_name": this.state.lname.trim(),
            "email": this.state.email,
            "number": braintree.encrypt(ccnum),
            "expiration_month": braintree.encrypt(exp_month),
            "expiration_year": braintree.encrypt(exp_year),
            "cvv": braintree.encrypt(this.state.cvc),
        })
        .then((res) => {
            //console.log(res);
            //this.setState({processing: false});
            window.location.reload();
        })
        .catch(errorAlerter);
    }}}
    */
    /**** END DEPRECATED BRAINTREE CODE ****/

    processPaypal = () => {{{
        if (this.state.disable_payment_buttons) {
            return;
        }

        let amount = this.getAmount();

        if (amount < 1.0) {
            return;
        }

        //<input id='paypal-purchase-id' type="hidden" name="invoice" value="" />
        this.createPaymentAccountAndMethod("paypal", null)
        .then((obj) => {
            console.log("Preparing paypal purchase", obj);
            let payment_account = obj.payment_account;
            let payment_method = obj.payment_method;
            let currency = this.state.currency;
            let interval = this.state.interval;
            this.processSupporterSignup('paypal', payment_method, amount, currency, interval)
            .then(() => {
                console.log("Navigating to paypal purchase page");
            })
            .catch(ignore); /* we already alert in this case */
        })
        .catch(errorAlerter);
    }}}
    cancelPaypal = () => {{{
        swal({
            html: "PayPal requires that you cancel PayPal subscriptions from within their interface. Please log in to <a href='https://paypal.com/'>paypal.com</a> to cancel the support. Sorry for the inconvenience, and thank you for the support you've given us!"
        });
    }}}

    createPaymentAccountAndMethod(vendor, details) {{{
        let obj = {
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
    }}}
    processSupporterSignup(vendor, payment_method, amount, currency, interval) {{{
        let promise = post("me/supporter", {
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
    }}}

    /* Returns the aggregate descaled support amount per month */
    getSupportLevel():number {
        return Math.round(this.getAmount() / (getIntervalScale(this.state.interval) * getCurrencyScale(this.state.currency))) ;
    }

    /* Sets support level based on scaled support amount */
    setSupportLevel(amount:number) {
        if (data.get('user').anonymous) {
            return;
        }

        amount *= getIntervalScale(this.state.interval);
        let step = 0;
        for (; step < amount_steps[this.state.interval].length; ++step) {
            let e = 0.0001;
            if (amount > amount_steps[this.state.interval][step] - e && amount < amount_steps[this.state.interval][step] + e) {
                break;
            }
        }
        let amt = amount_steps[this.state.interval][step];

        this.setState({
            amount_step: step,
            amount: amt,
            custom_amount: amt ? amount : amt
        });
    }

    learnMore = (ev) => {
        ev.stopPropagation();
        openBecomeASiteSupporterModal();
    }


    render() {
        if (this.state.loading) {
            return null;
        }

        let user = data.get("user");
        let processing = this.state.processing;
        let cdn_release = data.get("config.cdn_release");

        let supporter_text = (
            <div id='supporter-text-container'>
                <div id='supporter-ai-perks' >
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() >= 3 ? 'active' : '')} onClick={() => this.setSupportLevel(3)}>
                        <div className='title'><span>{_("Kyu Supporter")}</span><span>
                            {formatMoney(this.state.currency, 3 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)}
                            /{this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                        </span></div>
                        <div className='text'>
                            <div>{_("Professional level AI reviews for all of your games")}<sup>*</sup></div>
                        </div>
                    </div>
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() >= 5 ? 'active' : '')} onClick={() => this.setSupportLevel(5)}>
                        <div className='title'><span>{_("Dan Supporter")}</span><span>
                            {formatMoney(this.state.currency, 5 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)}
                            /{this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                        </span></div>
                        <div className='text'>
                            <div>{_("Strong professional level AI reviews for all of your games")}<sup>*</sup></div>
                        </div>
                    </div>
                    <div className={'supporter-perk-box clickable ' + (this.getSupportLevel() >= 10 ? 'active' : '')} onClick={() => this.setSupportLevel(10)}>
                        <div className='title'><span>{_("Pro Supporter")}</span><span>
                            {formatMoney(this.state.currency, 10 * getCurrencyScale(this.state.currency) * getIntervalScale(this.state.interval), true)}
                            /{this.state.interval === 'one time' ? _("year") : _(this.state.interval)}
                        </span></div>
                        <div className='text'>
                            <div>{_("Even stronger cutting edge AI reviews for all of your games")}<sup>*</sup></div>
                        </div>
                    </div>
                </div>

                <div id='supporter-text'>
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
                {this.state.recurring_donations.length > 0
                  ? <p style={{fontSize: "1.4em", textAlign: "center", fontWeight: "bold"}}>
                        {_("Make an additional donation")}
                    </p>
                  : <p style={{fontSize: "1.4em", textAlign: "center", fontWeight: "bold"}}>
                        {_("How much would you like to donate?")}
                    </p>
                }
                <div id="supporter-payment-block">
                    <div id='supporter-input-amount'>
                        <div>
                            <input type="range" value={this.state.amount_step} onChange={this.setAmountByStep} min={0} max={amount_steps[this.state.interval].length - 1} step={1}/>
                        </div>
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
                            <button className="primary" onClick={this.processStripe} disabled={this.state.disable_payment_buttons || this.state.processing}>
                                {_("Donate with Card")}
                            </button>

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
                                <img className={"paypal-button " + (isPaypalEnabled(this.state.currency) ? "" : "grayed-out-image")} src={`${cdn_release}/img/paypal.png`}
                                  onClick={isPaypalEnabled(this.state.currency) ? this.processPaypal : null} />
                            </div>
                        </div>

                        {false && data.get('user').id === 1 &&
                            <button className="danger" onClick={this.DEPRECATEDprocessCC}>
                              {interpolate((`Braintree {{amount}}/month`), {"amount": `$${toFixedWithLocale(this.getAmount(), 2)}`})}
                            </button>
                        }
                        {/*
                        <div className='other-payment-options'>
                            <PersistentElement elt={amex_express_checkout_button} />
                        </div>
                        */}
                    </div>
                </div>
            </div>

            <div id='supporter-text'>
                {supporter_text}
            </div>

            <div id="supporter-current-methods">

                {this.state.recurring_donations.map((recurring_donation, idx) => {
                    let price = recurring_donation.price;
                    let currency = recurring_donation.currency;
                    let interval = recurring_donation.interval;
                    let vendor = recurring_donation.account.payment_vendor;
                    let account = recurring_donation.account;
                    let method = recurring_donation.method;

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
                                                "amount": formatMoney(currency, price),
                                                "card_type": method.card_type,
                                                "interval": interval,
                                                "last_four": method.card_number,
                                                "month": method.expiration_month,
                                                "year": method.expiration_year,
                                            })
                                        }
                                    </p>

                                    {
                                        <button className="btn" style={{marginTop: "3em"}} onClick={() => this.cancelRecurringDonation(recurring_donation.id)} disabled={this.state.processing}>
                                            {_("Cancel this support")}
                                        </button>
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
                                                "amount": formatMoney(currency, price),
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
                                                "amount": toFixedWithLocale(parseFloat(price)),
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
                value={this.state.currency}
                onChange={this.setCurrency}
                options={currency_list}
                simpleValue={true}
                valueKey='iso'
                clearable={false}
                searchable={true}
                autoBlur={true}
                noResultsText={_("No results found")}
                filterOption={filterCurrencyOption}
                optionRenderer={(C) => <span className='currency-option'><span className='iso'>{C.iso}</span><Flag country={C.flag} /> </span>}
                valueRenderer={(C) => <span className='currency-option'><span className='iso'>{C.iso}</span><Flag country={C.flag} /> </span>}
            />
        );
    }

    renderIntervalSelect() {
        return (
            <Select
                className='interval-select'
                value={this.state.interval}
                onChange={this.setInterval}
                options={interval_list}
                simpleValue={true}
                valueKey='interval'
                clearable={false}
                searchable={false}
                optionRenderer={(C) => <span>{C.name}</span>}
                valueRenderer={(C) => <span>{C.name}</span>}
            />
        );
    }


    processStripe = () => {
        this.setState({disable_payment_buttons: true});


        checkout = StripeCheckout.configure({
            key: data.get('config').stripe_pk,
            image: 'https://cdn.online-go.com/icons/android-chrome-192x192.png',
            locale: 'auto',
            token: (token) => {
                this.setState({processing: true});
                console.log(token);

                post("me/process_stripe", {
                    'interval': this.state.interval,
                    'currency': this.state.currency,
                    'amount': this.getAmount(),
                    'stripe_amount': this.getStripeAmount(),
                    'payment_method_token': token
                })
                .then(() => {
                    this.setState({processing: false});
                    window.location.reload();
                })
                .catch(errorAlerter);
            },
            closed: () => {
                console.log("Closed");
                this.setState({disable_payment_buttons: false});
            }
        });
        window['checkout'] = checkout;

        checkout.open({
            name: 'Online-Go.com',
            description: interval_description[this.state.interval],
            currency: this.state.currency,
            amount: this.getStripeAmount(),
        });


        // Close Checkout on page navigation:
        window.addEventListener('popstate', () => {
            checkout.close();
        });
    }


}



// https://gist.github.com/2134376
// Phil Green (ShirtlessKirk)
function luhnChk(luhn: string): boolean {
    let len = luhn.length;
    let mul = 0;
    let prodArr = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]];
    let sum = 0;

    while (len--) {
        sum += prodArr[mul][parseInt(luhn.charAt(len), 10)];
        mul ^= 1;
    }

    return sum % 10 === 0 && sum > 0;
}
