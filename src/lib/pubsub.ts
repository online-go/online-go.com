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
type CallbackTable<T> = {[K in keyof T]?: {[serial: number]: Callback<T, K>}};
type Callback<T, K extends keyof T> = (channel: K, item: T[K]) => void;

// A subscription to some of the publisher's channels. Every time an item is published that
// we are interested in, our callback will be called with the item as its only parameter.
// This class is used as an inner class of the Publisher.
export interface PublisherSubscription<T> {
    to(channels: Array<keyof T>): void;
}



// A Publisher<T> is an object that publishes information of type T to its subscribers.
//
// Each object that can be published has a channel assigned to it, and all the subscribers
// on that channel are informed of the publication. The channel name is a key of T, and
// the publication is the corresponding value.
export class Publisher<T> {
    private callback_table: CallbackTable<T>;
    public readonly Subscription: new (callback: Callback<T, keyof T>) => PublisherSubscription<T>;

    constructor() {
        let callback_table: CallbackTable<T> = {};
        let first_subscriber_joined = this.first_subscriber_joined.bind(this);
        let last_subscriber_left = this.last_subscriber_left.bind(this);

        class Subscription extends AbstractPublisherSubscription<T> {
            constructor(callback: Callback<T, keyof T>) {
                super(callback_table, first_subscriber_joined, last_subscriber_left, callback);
            }
        }

        this.callback_table = callback_table;
        this.Subscription = Subscription;
    }

    // Publish a piece of information to anyone who is listening.
    publish<K extends keyof T>(channel: K, item: T[K]): T[K] {
        let callbacks = this.callback_table[channel];
        for (let serial in callbacks || {}) {
            callbacks[serial](channel, item);
        }
        return item;
    }

    // The first subscriber has joined a channel. Override if required.
    protected first_subscriber_joined(channel: keyof T): void { }

    // The last subscriber has left a channel. Override if required.
    protected last_subscriber_left(channel: keyof T): void { }
}



// A subscription to a Publisher. This class is inherited by the Publisher's
// inner Subscription class.
abstract class AbstractPublisherSubscription<T> implements PublisherSubscription<T> {
    private static next_serial = 0;
    private serial: number;

    private callback_table: CallbackTable<T>;
    private first_subscriber_joined: (channel: keyof T) => void;
    private last_subscriber_left: (channel: keyof T) => void;

    private callback: Callback<T, keyof T>;
    private channels: Array<keyof T>;

    constructor(
        callback_table: CallbackTable<T>,
        first_subscriber_joined: (channel: keyof T) => void,
        last_subscriber_left: (channel: keyof T) => void,
        callback: Callback<T, keyof T>
    ) {
        this.serial = AbstractPublisherSubscription.next_serial++;

        this.callback_table = callback_table;
        this.first_subscriber_joined = first_subscriber_joined;
        this.last_subscriber_left = last_subscriber_left;

        this.callback = callback;
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
    to(channels: Array<keyof T>): void {
        let last_left: {[channel in keyof T]?: boolean} = {};
        let first_joined: {[channel in keyof T]?: boolean} = {};

        // Check that a callback table exists on every channel.
        for (let channel of channels) {
            this.callback_table[channel] = this.callback_table[channel] || {};
        }

        // Delete the old subscriptions, checking whether we're the last one.
        for (let channel of this.channels) {
            delete this.callback_table[channel][this.serial];
            last_left[channel] = true;
            for (let serial in this.callback_table[channel]) {
                delete last_left[channel];
                break;
            }
        }

        // Record the new subscriptions. Make a defensive copy of the array.
        this.channels = channels.slice();

        // Create the new subscriptions, checking whether we're the first one.
        for (let channel of this.channels) {
            first_joined[channel] = true;
            for (let serial in this.callback_table[channel]) {
                delete first_joined[channel];
                break;
            }
            this.callback_table[channel][this.serial] = this.callback;
        }

        // Inform the publisher of any channels that are now in use for the first
        // time, or have fallen out of use for the first time.
        for (let channel in first_joined) {
            if (!(channel in last_left)) {
                this.first_subscriber_joined(channel);
            }
        }
        for (let channel in last_left) {
            if (!(channel in first_joined)) {
                this.last_subscriber_left(channel);
            }
        }
    }
}
