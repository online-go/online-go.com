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

// Basic types used the the pubsub module. Saves typing and allows for easy modification.
type WhichChannel<S, T> = (item: S | T) => string;
type CallbackTable<T> = { [channel: string]: { [serial: number]: Callback<T> } };
type Callback<T> = (item: T) => void;



// A Publisher<S, T> is an object that publishes information of type T to its subscribers.
//
// Each object that can be published has a channel assigned to it, and all the subscribers
// on that channel are informed of the publication. The channel name is a string that is
// calculated by the which_channel function.
//
// It is often the case that the channel name can be calculated using only partial
// information about the item to be published. The type S represents this partial
// information. If the full item is required to calculate its channel, then S can
// be assigned the type never.
//
// The first example of this we came across is the Player type, where a Player is the
// published information, but the channel name can be calculated from the Player itself
// or the player's unique id. Hence, the publisher for this type has type
// Publisher<number, Player>.
export class Publisher<S, T> {
    private which_channel: WhichChannel<S, T>;
    private callback_table: CallbackTable<T>;
    public readonly Subscription: new (callback: Callback<T>) => PublisherSubscription<S, T>;

    constructor(which_channel: WhichChannel<S, T>) {
        let callback_table: CallbackTable<T> = {};
        class Subscription extends AbstractPublisherSubscription<S, T> {
            constructor(callback: Callback<T>) {
                super(which_channel, callback_table, callback);
            }
        }

        this.which_channel = which_channel;
        this.callback_table = callback_table;
        this.Subscription = Subscription;
    }

    // Publish a piece of information to anyone who is listening.
    publish(item: T): T {
        let channel = this.which_channel(item);
        let callbacks = this.callback_table[channel];
        for (let serial in callbacks || {}) {
            callbacks[serial](item);
        }
        return item;
    }
}

// A subscription to some of the publisher's channels. Every time an item is published that
// we are interested in, our callback will be called with the item as its only parameter.
// This class is used as an inner class of the Publisher.
export interface PublisherSubscription<S, T> {
    to(items: Array<S | T>);
}

abstract class AbstractPublisherSubscription<S, T> implements PublisherSubscription<S, T> {
    private which_channel: WhichChannel<S, T>;
    private callback_table: CallbackTable<T>;

    private static next_serial = 0;
    private serial: number;

    private callback: Callback<T>;
    private channels: Array<string>;

    constructor(which_channel: WhichChannel<S, T>, callback_table: CallbackTable<T>, callback: Callback<T>) {
        this.which_channel = which_channel;
        this.callback_table = callback_table;
        this.callback = callback;
        this.serial = AbstractPublisherSubscription.next_serial++;
        this.channels = [];
    }

    // Specify which items we wish to have a subscription to. When a new list of items
    // is given, any previous subscriptions that are no longer in the list will be revoked.
    // It is OK to mention an item more than once in the list.
    //
    // Because subscribing and unsubscribing are lightweight operations, we optimise this
    // method for clarity and obvious correctness rather than speed. We unsubscribe from all the
    // old publications and then subscribe to all the new ones. If a subscription is still
    // required then the subscription will be dropped and re-created. This is guaranteed not
    // to lose any publications.
    to(items: Array<S | T>) {
        this.channels.forEach((channel) => delete this.callback_table[channel][this.serial]);
        this.channels = items.map((item) => this.which_channel(item));
        this.channels.forEach((channel) => this.callback_table[channel] = this.callback_table[channel] || {});
        this.channels.forEach((channel) => this.callback_table[channel][this.serial] = this.callback);
    }
}
