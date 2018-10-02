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
type CallbackTable<T> = {[K in Extract<keyof T, string>]?: {[serial: number]: Callback<T, K>}};
type Callback<T, K extends Extract<keyof T, string>> = (channel: K, item: T[K]) => void;

export interface Subscriber<T, K extends Extract<keyof T, string>> {
    on: (channels: K | Array<K>) => this;
    off: (channels: K | Array<K>) => this;
    channels: () => Array<K>;
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
    public readonly Subscriber: new <K extends Extract<keyof T, string>>(callback: Callback<T, K>) => Subscriber<T, K>;

    constructor() {
        let serial: number = 0;
        let callback_table: CallbackTable<T> = {};

        this.callback_table = callback_table;
        this.Subscriber = class Subscriber<K extends Extract<keyof T, string>> extends AbstractSubscriber<T, K> {
            constructor(callback: Callback<T, K>) {
                super(serial++, callback_table, callback);
            }
        };
    }

    // Publish a piece of information to anyone who is listening.
    publish<K extends Extract<keyof T, string>>(channel: K, item: T[K]): T[K] {
        let callbacks = this.callback_table[channel] || {};
        for (let serial in callbacks) {
            callbacks[serial](channel, item);
        }
        return item;
    }
}



// A Subscriber to a Publisher. This class connects the callback functions to
// the publisher that will call them.
//
// If we wish to, we can use the Subscriber's type parameters to narrow down
// the channels that the publisher can subscribe to. This enables us to use
// the type-checker to prevent accidental subscription to the wrong channel.
//
// As always, the type parameter T is the type whose keys are the channel names
// and whose values are the data published on the channel. K is the type of
// publication that this Subscriber can be subscribed to. If you don't wish
// to narrow the type down, then you can specify K = keyof T or just allow
// the compiler to infer the type.
abstract class AbstractSubscriber<T, K extends Extract<keyof T, string>> implements Subscriber<T, K> {
    private subscribed_channels: {[channel in K]?: boolean};

    constructor(private serial: number, private callback_table: CallbackTable<T>, private callback: Callback<T, K>) {
        this.subscribed_channels = {};
    }

    // Subscribe to some extra channels. If we already subscribe to a channel,
    // then adding it again has no further effect. Mentioning a channel more
    // than once has the same effect as mentioning it exactly once.
    on(channels: K | Array<K>): this {
        let table = this.callback_table;

        let ch:Array<string> = typeof channels === "string" ? [channels] : channels;
        for (let channel of ch) {
            (table[channel] || (table[channel] = {}))[this.serial] = this.callback;
            this.subscribed_channels[channel] = true;
        }
        return this;
    }

    // Unsubscribe from some channels. Once again, removal is an idempotent
    // operation.
    off(channels: K | Array<K>): this {
        let table = this.callback_table;

        channels = typeof channels === "string" ? [channels] : channels;
        for (let channel of channels) {
            delete (table[channel] || {})[this.serial];
            delete this.subscribed_channels[channel];
        }
        return this;
    }

    // List the channels that we're subscribed to, in no particular order.
    channels(): Array<K> {
        let channels: Array<K> = [];
        for (let channel in this.subscribed_channels) {
            channels.push(channel);
        }
        return channels;
    }
}
