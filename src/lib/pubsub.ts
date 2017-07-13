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
    public readonly Subscription: new <K extends keyof T> (callback: Callback<T, K>) => PublisherSubscription<T, K>;

    constructor() {
        let callback_table: CallbackTable<T> = {};

        class Subscription<K extends keyof T> extends PublisherSubscription<T, K> {
            constructor(callback: Callback<T, K>) {
                super(callback_table, callback);
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
// wish to narrow the type down, then you can specify K = keyof T or just
// allow the compiler to infer the type.
let next_serial = 0;
class PublisherSubscription<T, K extends keyof T> {
    private serial: number;

    private channels: Array<K>;
    private callback_table: CallbackTable<T>;
    protected readonly callback: Callback<T, K>;

    constructor(callback_table: CallbackTable<T>, callback: Callback<T, K>
    ) {
        this.serial = next_serial++;
        this.channels = [];
        this.callback_table = callback_table;
        this.callback = callback;
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
    to(channels: Array<K> = []): this {
        let table = this.callback_table;

        // Check that a callback table exists on every channel.
        channels.forEach((channel) => table[channel] = table[channel] || {});

        // Update the suscriptions.
        this.channels.forEach((channel) => delete table[channel][this.serial]);
        let old_channels = this.channels;
        this.channels = channels.slice();
        let new_channels = this.channels;
        this.channels.forEach((channel) => table[channel][this.serial] = this.callback);

        // Detect any first-time subscriptions.
        let first_timers: {[channel in K]?: boolean} = {};
        new_channels.forEach((channel) => first_timers[channel] = true);
        old_channels.forEach((channel) => delete first_timers[channel]);
        for (let channel in first_timers) {
            this.new_subscriber(channel);
        }

        return this;
    }

    protected new_subscriber(channel: K): void { }
}
