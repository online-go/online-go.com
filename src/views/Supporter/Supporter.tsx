/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {del, put, post, get} from "requests";
import {errorAlerter} from "misc";
import * as data from "data";
import {LineText} from "misc-ui";
import {PrettyTransactionInfo} from './PrettyTransactionInfo';
import * as ReactNumberFormat from 'react-number-format';
import { SupporterGoals } from 'SupporterGoals';


declare var Braintree;
declare var swal;
declare var ogs_release;

interface SupporterProperties {
}

let amount_steps = [
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
    0,
];

let braintree_js_promise = null;
let braintree = null;

function getDecimalSeparator() {
    return (1.1).toLocaleString().substring(1, 2);
}

function toFixedWithLocale(n:number, decimals:number = 2) {
    return n.toFixed(decimals).replace('.', getDecimalSeparator());
}

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
                loading: false
            };
        } else {
            this.state = {
                loading: true,
                processing: false,
                show_update_cc: false,
                amount: 5.0,
                custom_amount: 50.0,
                amount_step: 4,

                card_number_spaced: "",
                card_exp_spaced: "",
                cvc: "",
                fname: "",
                lname: "",
                email: "",
                last_transaction: null,
            };
        }

        if (ogs_release === "") {
            /* debug mode */
            this.state.card_number_spaced = "4111 1111 1111 1111";
            this.state.card_exp_spaced = "12 / 20";
            this.state.cvc = "123";
            this.state.fname = "John";
            this.state.lname = "Gough";
            this.state.email = "anoek@online-go.com";
        }
    }

    componentDidMount() {{{
        if (!braintree_js_promise) {
            braintree_js_promise = new Promise((resolve, reject) => {
                let script = document.createElement("script");
                script.src = "https://js.braintreegateway.com/v1/braintree.js";
                script.async = true;
                script.charset = "utf-8";
                script.onload = () => {
                    braintree = Braintree.create(data.get("config.braintree_cse"));
                    resolve();
                };
                script.onerror = () => {
                    reject("Unable to load braintree.js");
                };
                document.head.appendChild(script); //or something of the likes
            });
        }

        if (!data.get('user').anonymous) {
            braintree_js_promise.then(() => {
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

    setAmount = (ev) => {{{
        this.setState({
            amount_step: parseInt(ev.target.value),
            amount: amount_steps[parseInt(ev.target.value)]
        });
    }}}
    updateCustomAmount = (ev, values) => {{{
        this.setState({
            custom_amount: values.floatValue
        });
    }}}
    getAmount() {{{
        return this.state.amount || this.state.custom_amount;
    }}}

    updateCardNumber = (ev) => {{{
        let groomed = ev.target.value;
        if (this.state.card_number_spaced.length > 0) {
            /* backspace should skip over spaces we've added */
            if (this.state.card_number_spaced.length - 1 === groomed.length
                && groomed === this.state.card_number_spaced.substr(0, groomed.length)
                && this.state.card_number_spaced[groomed.length] === " "
            ) {
                groomed = groomed.substr(0, groomed.length - 1);
            }
        }

        groomed = groomed.replace(/[^0-9]/g, "");
        if (groomed.length >= 12) {
            groomed = groomed.substr(0, 12) + " " + groomed.substr(12);
        }
        if (groomed.length >= 8) {
            groomed = groomed.substr(0, 8) + " " + groomed.substr(8);
        }
        if (groomed.length >= 4) {
            groomed = groomed.substr(0, 4) + " " + groomed.substr(4);
        }

        this.setState({ card_number_spaced: groomed });
    }}}
    updateExp = (ev) => {{{
        let groomed = ev.target.value;

        if (this.state.card_exp_spaced.length > 0) {
            if (this.state.card_exp_spaced.length - 1 === groomed.length
                && groomed.replace(/[^0-9]/g, "") === this.state.card_exp_spaced.replace(/[^0-9]/g, "")
            ) {
                groomed = groomed.replace(/[^0-9]/g, "");
                groomed = groomed.substr(0, groomed.length - 1);
            }

            else if (
                (
                    groomed[groomed.length - 1] === "/"
                    || groomed[groomed.length - 1] === "-"
                    || groomed[groomed.length - 1] === " "
                )
                && groomed.replace(/[^\/ -]/g, "").length === 1
            ) {
                groomed = "" + parseInt(groomed.replace(/[^0-9]/g, "") || 0);
                if (groomed.length === 1) {
                    if (groomed !== "0") {
                        groomed = "0" + groomed;
                    }
                }
            }
        }

        groomed = groomed.replace(/[^0-9]/g, "");

        if (groomed.length >= 2) {
            groomed = groomed.substr(0, 2) + " / " + groomed.substr(2, 2);
        }
        this.setState({ card_exp_spaced: groomed });
    }}}
    updateCvc = (ev) => {{{
        let groomed = ev.target.value;
        groomed = groomed.replace(/[^0-9]/g, "").substr(0, 4);
        this.setState({ cvc: groomed });
    }}}
    updateFname = (ev) => {{{
        let groomed = ev.target.value;
        this.setState({ fname: groomed });
    }}}
    updateLname = (ev) => {{{
        let groomed = ev.target.value;
        this.setState({ lname: groomed });
    }}}
    updateEmail = (ev) => {{{
        let groomed = ev.target.value;
        this.setState({ email: groomed });
    }}}

    cancelBraintree = () => {{{
        swal({
            text: _("Are you sure you want to cancel your support for OGS?"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => {
            this.setState({processing: true});
            del("me/supporter")
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
    validateCC = () => {{{
        let ccnum = this.state.card_number_spaced.replace(/[^0-9]/g, "");

        if (ccnum.length < 12 || ccnum.length > 19 || !luhnChk(ccnum)) {
            this.refs.ccnum.focus();
            return false;
        }

        let m = this.state.card_exp_spaced.match(/^([0-9]+)\s+[\/]\s+([0-9]+)$/);
        let exp_month;
        let exp_year;
        if (!m || parseInt(m[1]) < 1 || parseInt(m[1]) > 12
            || parseInt("20" + m[2]) < (new Date().getFullYear())
            || (parseInt("20" + m[2]) === (new Date().getFullYear()) && parseInt(m[1]) - 1 < (new Date().getMonth()))
        ) {
            this.refs.ccexp.focus();
            return false;
        }
        exp_month = parseInt(m[1]);
        exp_year = parseInt("20" + m[2]);

        if (this.state.cvc.length < 3) {
            this.refs.cccvc.focus();
            return false;
        }

        if (this.state.fname.trim().length < 1) {
            this.refs.fname.focus();
            return false;
        }
        if (this.state.lname.trim().length < 1) {
            this.refs.lname.focus();
            return false;
        }

        if (this.state.email.trim().length < 1) {
            this.refs.email.focus();
            return false;
        }

        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(this.state.email)) {
            this.refs.email.focus();
            return false;
        }

        return true;
    }}}
    processCC = () => {{{
        let amount = this.getAmount();

        if (amount < 1.0) {
            return;
        }

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

        this.createPaymentAccountAndMethod("braintree", {
            "fname": this.state.fname.trim(),
            "lname": this.state.lname.trim(),
            "email": this.state.email,
            "ccnum": ccnum,
            "exp_month": exp_month,
            "exp_year": exp_year,
            "cccvc": this.state.cvc,
        })
        .then((obj) => {
            let payment_account = obj.payment_account;
            let payment_method = obj.payment_method;
            this.processSupporterSignup(payment_method, amount)
            .then(() => {
                window.location.reload();
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    }}}
    updateCC = () => {{{
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

    processPaypal = () => {{{
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
            this.processSupporterSignup(payment_method, amount)
            .then(() => {
                console.log("Navigating to paypal purchase page");
            });
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
    processSupporterSignup(payment_method, amount) {{{
        let promise = post("me/supporter", {
            "payment_method": payment_method,
            "price": amount,
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


    render() {
        if (this.state.loading) {
            return null;
        }

        let user = data.get("user");
        let processing = this.state.processing;
        let cdn_release = data.get("config.cdn_release");

        let supporter_text = (
            <div className='main-paragraph'>

                <div className='p'>
                    {interpolate("Hello! As you may or may not know, Online-Go.com is an ever evolving community project driven by countless Go enthusiasts. First established in 2005, Online-Go.com has grown to be the first place almost all beginners find themselves at when they're first learning about the game, and is home to an ever growing community of veteran players as well. Bringing in on average {{number_of_new_players}} new players to the game per week, Online-Go.com is the fastest growing western Go server and is one of the most important facets, if not the most important facet, to the now-revitalizing western Go community.", {'number_of_new_players': 1200})}
                </div>

                <div className='p'>
                {_("This project is entirely supported by donations from players like you. By choosing to help support OGS financially, you are directly helping us keep this service online as well as enabling us to continually improve the service.")}
                </div>

                <div className='p'>
                    {_("When you become a supporter you also get a few perks!")}

                    <div className='perk'><i className='fa fa-circle'/><span>{_("No more ads! All ads on OGS are removed for you while you're logged in.")}</span></div>
                    <div className='perk'><i className='fa fa-circle'/><span>{_("Golden name! Your username will show up in gold (You can turn this off in settings if you want.)")}</span></div>
                    <div className='perk'><i className='fa fa-circle'/><span>{_("Golden orb next to your name in chat! (You can turn this off in settings if you want.)")}</span></div>
                    <div className='perk'><i className='fa fa-circle'/><span>{_('Access to the special "Site Supporters" chat channel where you can hang out with other site supporters along with the developers of the site!')}</span></div>
                    <div className='perk'><i className='fa fa-circle'/><span>{_("More vacation time! If you play a lot of correspondence games this is a great benefit, your vacation time limit will be raised to 60 days (up from 30)")}</span></div>
                    <div className='perk'><i className='fa fa-circle'/><span>{_("Faster vacation recharge time! Vacation will accrue at 1 day per 5 days, up from 1 day per 8 days.")}</span></div>
                </div>
            </div>
        );

        if (user.anonymous) {
            return (
                <div className="Supporter">
                    {supporter_text}
                    <p>
                        <i>To donate, you'll first need to log in.</i>
                    </p>
                </div>
            );
        }

        return (
        <div className="Supporter">
            <SupporterGoals alwaysShow={true} />

            {supporter_text}
            {processing
                ? <h1 style={{textAlign: "center", marginTop: "5em"}}>{_("Processing")}</h1>
                : !this.state.is_supporter
                    ? <div className="main-paragraph">
                        <p style={{fontSize: "1.4em", textAlign: "center", fontWeight: "bold"}}>
                            {_("How much would you like to donate?")}
                        </p>

                        <div className="details">
                            <div>
                                <input type="range" value={this.state.amount_step} onChange={this.setAmount} min={0} max={amount_steps.length - 1} step={1}/>
                            </div>
                            <div>
                                {this.state.amount === 0
                                    ? <h3><ReactNumberFormat
                                            prefix='$ '
                                            suffix={' / ' + _("month")}
                                            decimalSeparator={getDecimalSeparator()}
                                            value={this.state.custom_amount}
                                            decimalPrecision={2}
                                            onChange={this.updateCustomAmount}
                                            allowNegative={false}
                                          />
                                      </h3>
                                    : <h3>{`$ ${toFixedWithLocale(this.getAmount(), 2)} / ` + _("month")}</h3>
                                }
                            </div>

                            {this.cc_form()}


                            <LineText>{_("or")}</LineText>

                            <div className="paypal">
                                <img className="paypal-button" src={`${cdn_release}/img/paypal.png`} onClick={this.processPaypal} />

                                <form id="paypal-form" action={data.get("config.paypal_server")} method="post" target="_top">
                                    <input type="hidden" name="cmd" value="_xclick-subscriptions" />
                                    <input type="hidden" name="business" value={data.get("config.paypal_email")} />
                                    <input type="hidden" name="item_name" value="Supporter Account" />
                                    <input type="hidden" name="a3" value={this.getAmount().toFixed(2)} />
                                    <input type="hidden" name="p3" value="1" />
                                    <input type="hidden" name="t3" value="M" />
                                    <input type="hidden" name="src" value="1" />
                                    <input type="hidden" name="no_note" value="1" />
                                    <input type="hidden" name="custom" value={data.get("user").id} />
                                    <input id="paypal-purchase-id" type="hidden" name="invoice" value="" />
                                    <input type="hidden" name="modify" value="1" />
                                    <input type="hidden" name="notify_url" value={`https://${data.get("config.server_name")}/merchant/paypal_postback`} />
                                </form>
                            </div>
                        </div>
                      </div>
                    : <div className='main-paragraph support-thanks'>
                        <h3>{_("Thank you for your support!")}</h3>

                        {(this.state.payment_account.payment_vendor === "braintree" || null) &&
                            <div>
                                <p>
                                    {interpolate(_("You are currently supporting us with ${{amount}} per month from your {{card_type}} card ending in {{last_four}} and expiring on {{month}}/{{year}}, thanks!"),
                                        {
                                            "amount": toFixedWithLocale(parseFloat(this.state.purchase.price)),
                                            "card_type": this.state.payment_method.card_type,
                                            "last_four": this.state.payment_method.card_number,
                                            "month": this.state.payment_method.expiration_month,
                                            "year": this.state.payment_method.expiration_year,
                                        })
                                    }
                                </p>

                                <div style={{margin: '1rem'}}>
                                    <PrettyTransactionInfo transaction={this.state.last_transaction}/>
                                </div>


                                {(this.state.show_update_cc || null) &&
                                    this.cc_form(true)
                                }

                                {(!this.state.show_update_cc || null) &&
                                    <button className="btn primary" style={{marginTop: "3em"}} onClick={() => this.setState({show_update_cc: true})}  disabled={this.state.processing}>
                                        {_("Update card information")}
                                    </button>
                                }

                                {(!this.state.show_update_cc || null) &&
                                    <button className="btn" style={{marginTop: "3em"}} onClick={this.cancelBraintree}  disabled={this.state.processing}>
                                        {_("Cancel this support")}
                                    </button>
                                }
                            </div>
                        }

                        {(this.state.payment_account.payment_vendor === "paypal" || null) &&
                            <div>
                                <p>
                                    {interpolate(_("You are currently supporting us with ${{amount}} per month from your paypal account, thanks!"),
                                        {
                                            "amount": toFixedWithLocale(parseFloat(this.state.purchase.price), 2),
                                        })
                                    }
                                </p>

                                <div style={{margin: '1rem'}}>
                                    <PrettyTransactionInfo transaction={this.state.last_transaction}/>
                                </div>

                                <button className="btn" style={{marginTop: "3em"}} onClick={this.cancelPaypal}  disabled={this.state.processing}>
                                    {_("Cancel this support")}
                                </button>
                            </div>
                        }

                      </div>
            }
        </div>
        );
    }

    cc_form(update?:boolean) {
        return (
            <div className="cc-form">
                <form acceptCharset="UTF-8" action="/payment" className="cardInfo" role="form" method="post" autoComplete="on">
                    <div className="cc-number">
                        <input ref="ccnum" name="cc-number" type="tel" className="cc-number" placeholder="•••• •••• •••• ••••"
                            autoComplete="cc-number" required={true}
                            value={this.state.card_number_spaced} onChange={this.updateCardNumber}/>
                    </div>

                    <div className="exp-cvc">
                        <input ref="ccexp" name="cc-exp" type="tel" className="cc-exp" placeholder="MM / YY" autoComplete="cc-exp" required={true}
                            value={this.state.card_exp_spaced} onChange={this.updateExp}/>
                        <input ref="cccvc" name="cvc" type="tel" className="cc-cvc" placeholder={_("CVC")} autoComplete="cc-csc" required={true}
                            value={this.state.cvc} onChange={this.updateCvc}/>
                    </div>

                    <div className="name">
                        <input ref="fname" name="fname" type="text" className="fname" placeholder={_("First Name")} autoComplete="fname" required={true}
                            value={this.state.fname} onChange={this.updateFname}/>
                        <input ref="lname" name="lname" type="text" className="lname" placeholder={_("Last Name")} autoComplete="lname" required={true}
                            value={this.state.lname} onChange={this.updateLname}/>
                    </div>
                    <div className="email">
                        <input ref="email" name="email" type="email" className="fname" placeholder={_("Email")} autoComplete="email" required={true}
                            value={this.state.email} onChange={this.updateEmail}/>
                    </div>
                </form>

                {update
                    ? <button className="primary" onClick={this.updateCC} disabled={this.state.processing}>
                        {_(`Save new card information`)}
                      </button>
                    : <button className="primary" onClick={this.processCC} disabled={this.state.processing}>
                        {interpolate(_(`Donate {{amount}}/month`), {"amount": `$${toFixedWithLocale(this.getAmount(), 2)}`})}
                      </button>
                }
            </div>
        );
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
