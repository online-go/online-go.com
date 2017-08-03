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
import {_} from "translate";
import {put, get, post, del} from "requests";
import {Player} from "Player";
import {errorAlerter, ignore} from "misc";
import {Modal, openModal} from "Modal";
import {PrettyTransactionInfo} from 'Supporter/PrettyTransactionInfo';
import * as moment from 'moment';


interface Events {
}

interface SupporterAdminProperties {
    playerId?: number;
}

declare var swal;


export class SupporterAdmin extends Modal<Events, SupporterAdminProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            username: "...",
            supporter: false,
            supporter_expiration: null,
            payment_accounts: [],
        };
    }

    componentWillMount() {
        super.componentWillMount();
        get("supporter_center/player/%%", this.props.playerId)
        .then((res) => {

            let last_transaction = null;
            let transactions = [];
            for (let account of res.payment_accounts) {
                for (let method of account.payment_methods) {
                    for (let purchase of method.purchases) {
                        for (let transaction of purchase.transactions) {
                            transactions.push(transaction);
                        }
                    }
                }
            }
            transactions.sort((a, b) => b.created.localeCompare(a.created));

            console.log(transactions);

            this.setState({
                supporter: res.supporter,
                supporter_expiration: res.supporter_expiration,
                payment_accounts: res.payment_accounts,
                last_transaction: transactions.length > 0 ? transactions[0] : null,
                loading: false,
            });
            //console.log(dets);
            //this.setState(Object.assign({loading: false}, dets.user, {bot_owner: dets.user.bot_owner ? dets.user.bot_owner.id : null}));
        })
        .catch(errorAlerter);
    }

    render() {
        let user = this.state;

        return (
            <div className="Modal SupporterAdmin" ref="modal">
                <div className="header">
                    <h3>
                        <Player user={this.props.playerId}/> - {this.state.loading
                            ? null
                            : <span >
                                {this.state.supporter ? 'Supporter' : 'Non-Supporter'}
                                {this.state.supporter_expiration ? ' until ' + moment(this.state.supporter_expiration).format('YYYY-MM-DD') : ''}
                              </span>
                        }
                    </h3>
                </div>
                {(this.state.loading === false || null) &&
                    <div className="body">
                        <PrettyTransactionInfo transaction={this.state.last_transaction} />
                        <hr/>


                        {(this.state.payment_accounts.length === 0 || null) &&
                            <h3>No payment accounts</h3>
                        }

                        {this.state.payment_accounts.map((account, idx) => (
                            <div key={account.id} className='PaymentAccount'>
                                <table className='account-info'>
                                    <thead>
                                        <tr>
                                            <th>Created</th>
                                            <th>Active</th>
                                            <th>Vendor</th>
                                            <th>Account</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{moment(account.created).format('YYYY-MM-DD')}</td>
                                            <td>{account.active ? 'active' : ' '}</td>
                                            <td>{account.payment_vendor}</td>
                                            <td>{account.account_id}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {account.payment_methods.map((method, idx) => (
                                    <div key={method.id}>
                                        <table className='method-info'>
                                            <thead>
                                                <tr>
                                                    <th>Token</th>
                                                    <th>Active</th>
                                                    <th>Name</th>
                                                    <th>Last 4</th>
                                                    <th>Exp.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr key={method.id}>
                                                    <td>{method.payment_token}</td>
                                                    <td>{method.active ? 'active' : ' '}</td>
                                                    <td>{method.name}</td>
                                                    <td>{method.card_number}</td>
                                                    <td>{method.expiration_month + '/' + method.expiration_year}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {method.purchases.map((purchase, idx) => (
                                            <div key={purchase.id}>
                                                <table className='purchase-info'>
                                                    <thead>
                                                        <tr>
                                                            <th>Created</th>
                                                            <th>Canceled</th>
                                                            <th>Active</th>
                                                            <th>Price</th>
                                                            <th>Order ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr key={purchase.id}>
                                                            <td>{moment(purchase.created).format('YYYY-MM-DD HH:MM')}</td>
                                                            <td>{purchase.cancelation ? moment(purchase.cancelation).format('YYYY-MM-DD HH:MM') : ''}</td>
                                                            <td>{purchase.active ? 'active' : ' '}</td>
                                                            <td>${parseFloat(purchase.price).toFixed(2)}</td>
                                                            <td>{purchase.order_id}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <table className='transaction-info'>
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>TXID</th>
                                                            <th>Action</th>
                                                            <th>Method</th>
                                                            <th>Account</th>
                                                            <th>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {purchase.transactions.map((transaction, idx) => (
                                                            <tr key={transaction.id}>
                                                                <td>{moment(transaction.created).format('YYYY-MM-DD HH:MM')}</td>
                                                                <td>{transaction.transaction_id}</td>
                                                                <td>{transaction.action}</td>
                                                                <td>{transaction.method}</td>
                                                                <td>{transaction.account}</td>
                                                                <td>{transaction.amount ? '$' + parseFloat(transaction.amount).toFixed(2) : '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                }
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

export function openSupporterAdminModal(user_id:number) {
    return openModal(<SupporterAdmin playerId={user_id} fastDismiss={true} />);
}
