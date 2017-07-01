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

let subscription_next_serial = 0;

export interface Subscription {
    subscribe: () => Subscription;
    unsubscribe: () => void;
}

// A Publisher<T> is an object that publishes information of type T to its subscribers.
// Each object can be published on one or more channels.
export class Publisher<T> {
    private channels: (item: T) => string;
    private callbacks: {[channel: string]: {[serial: number]: (item: T) => void}};

    constructor(channels: (item: T) => string) {
        this.channels = channels;
        this.callbacks = {};
    }

    channel_name(item: T): string {
        return this.channels(item);
    }

    // Publish a piece of information to anyone who is listening.
    publish(item: T): void {
        let channel = this.channels(item);
        let item_callbacks = this.callbacks[channel];
        for (let serial in item_callbacks || {}) {
            item_callbacks[serial](item);
        }
    }

    // Find out how to subscribe and unsubscribe to information from this publisher.
    subscription(channel: string, callback: (item: T) => void): Subscription {
        let serial = subscription_next_serial++;
        let callbacks = this.callbacks;

        callbacks[channel] = callbacks[channel] || {};

        let actions: Subscription = {
            subscribe: () => { callbacks[channel][serial] = callback; return actions; },
            unsubscribe: () => { delete callbacks[channel][serial]; }
        };
        return actions;
    }
}

// A MultiSub enables us to subscribe to many different channels from a single publisher
// using a single callback.
export class MultiSub<T> {
    private publisher: Publisher<T>;
    private callback: (item: T) => void;

    private ids: Array<string>;
    private subscriptions: {[id: string]: Subscription};

    constructor(publisher: Publisher<T>, callback: (item: T) => void) {
        this.publisher = publisher;
        this.callback = callback;
    }

    channel_names(items: Array<T>): Array<string> {
        return items.map(this.publisher.channel_name.bind(this.publisher));
    }

    subscribe(channels: Array<string>) {
        // Calculate the new set of subscriptions.
        let new_subscriptions: {[channel: string]: Subscription} = {};
        let old_subscriptions: {[channel: string]: Subscription} = this.subscriptions;
        for (let channel of channels) {
            new_subscriptions[channel] =
                this.subscriptions[channel] ||
                this.publisher.subscription(channel, this.callback).subscribe();
        }

        // Update the subscription object
        this.subscriptions = new_subscriptions;

        // Remove subscriptions that are no longer required.
        for (let channel of channels) {
            delete old_subscriptions[channel];
        }
        for (let channel in old_subscriptions) {
            old_subscriptions[channel].unsubscribe();
        }
    }
}
