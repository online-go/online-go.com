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
import {errorAlerter} from "misc";
import * as moment from 'moment';


interface PrettyTransactionInfoProperties {
    transaction: any;
}

export class PrettyTransactionInfo extends React.PureComponent<PrettyTransactionInfoProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        let transaction = this.props.transaction;
        if (!transaction) {
            return null;
        }

        if (transaction.method === 'wallet') {
            console.log('Last payment transaction was GoogleWallet, very old');
            return null;
        }


        let message = null;
        let date = moment(transaction.created).format('ll');

        if (transaction.method === 'braintree') {
            switch (transaction.action) {
                case 'subscription_went_active':
                    break;

                case 'subscription_charged_successfully':
                    break;

                case 'subscription_charged_unsuccessfully':
                    message = interpolate(_(`There was a problem processing your support on {{date}}`), {date: date});
                    break;

                case 'subscription_canceled':
                    message = interpolate(_(`Your subscription was successfully canceled on {{date}}`), {date: date});
                    break;

                default:
                    message = `${date} - ${transaction.action}`;
                    break;
            }
        }
        if (transaction.method === 'paypal') {
            switch (transaction.action) {
                case 'subscr_modify':
                    message = interpolate(_(`Your subscription was successfully updated on {{date}}`), {date: date});
                    break;
                case 'subscr_cancel':
                    message = interpolate(_(`Your subscription was successfully canceled on {{date}}`), {date: date});
                    break;
                case 'subscr_failed':
                    message = interpolate(_(`There was a problem processing your support on {{date}}`), {date: date});
                    break;
                case 'subscr_eot':
                    message = interpolate(_(`Your subscription expired on {{date}}`), {date: date});
                    break;
                case 'subscr_signup':
                    break;
                case 'subscr_payment':
                    break;

                default:
                    message = `${date} - ${transaction.action}`;
                    break;
            }
        }

        if (message) {
            return (<div>{message}</div>);
        }

        return null;
    }


}
