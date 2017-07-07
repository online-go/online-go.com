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
type ConcreteSubscription<T> = new <K extends keyof T> (callback: Callback<T, K>) => PublisherSubscription<T, K>;

// A subscription to some of the publisher's channels. Every time an item is published that
// we are interested in, our callback will be called with the item as its only parameter.
// This class is used as an inner class of the Publisher.
export interface PublisherSubscription<T, K extends keyof T> {
    to(channels: Array<K>): void;
}



// A Publisher<T> is an object that publishes information of type T to its subscribers.
//
// Each object that can be published has a channel assigned to it, and all the subscribers
// on that channel are informed of the publication. The channel name is a key of T, and
// the publication is the corresponding value.
//
// To subscribe to a publisher's channel, create a new publisher.Subscription whose
// callback is the function to be called when data is published on the channel. Then
// tell the publisher.Subscription which channels you're interested in hearing about.
export class Publisher<T> {
    private callback_table: CallbackTable<T>;
    public readonly Subscription: ConcreteSubscription<T>;

    constructor() {
        let callback_table: CallbackTable<T> = {};
        let first_subscriber_joined = this.first_subscriber_joined.bind(this);
        let last_subscriber_left = this.last_subscriber_left.bind(this);

        class Subscription<K extends keyof T> extends AbstractSubscription<T, K> {
            constructor(callback: Callback<T, K>) {
                super(callback_table, first_subscriber_joined, last_subscriber_left, callback);
            }
        }

        this.callback_table = callback_table;
        this.Subscription = Subscription;
    }

    // Publish a piece of information to anyone who is listening.
    publish<K extends keyof T>(channel: K, item: T[K]): T[K] {
        let callbacks = this.callback_table[channel] || {};
        for (let serial in callbacks) {
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
//
// If we wish to, we can use the AbstractSubscription's type parameters to narrow
// down the channels that the publisher can subscribe to. This enables us to use
// the type-checker to prevent accidental subscription to the wrong channel.
//
// As always, the type parameter T is the type whose keys are the channel names
// and whose values are the data published on the channel. K is the type of
// publication that this AbstractSubscription can be subscribed to. If you don't
// wish to narrow the type down, then you can just specify K = keyof T.
abstract class AbstractSubscription<T, K extends keyof T> implements PublisherSubscription<T, K> {
    private static next_serial = 0;
    private serial: number;

    private callback_table: CallbackTable<T>;
    private first_subscriber_joined: (channel: K) => void;
    private last_subscriber_left: (channel: K) => void;

    private callback: Callback<T, K>;
    private channels: Array<K>;

    constructor(
        callback_table: CallbackTable<T>,
        first_subscriber_joined: (channel: K) => void,
        last_subscriber_left: (channel: K) => void,
        callback: Callback<T, K>
    ) {
        this.serial = AbstractSubscription.next_serial++;

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
    to(channels: Array<K>): void {
        let last_left: {[channel in K]?: boolean} = {};
        let first_joined: {[channel in K]?: boolean} = {};

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
