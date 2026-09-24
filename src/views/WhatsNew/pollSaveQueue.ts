/*
 * Copyright (C)  Online-Go.com
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

import type { WhatsNewPollAnswers } from "./types";

export const POLL_TEXT_SAVE_DELAY_MS = 800;

interface PollSaveQueueOptions {
    save: (answers: WhatsNewPollAnswers) => Promise<unknown>;
    onError: (err: unknown) => void;
    debounceMs?: number;
}

/**
 * Serializes poll answer saves.
 *
 * Only one save is in flight at a time. Changes made while a save is in
 * flight replace each other, and only the newest answers are sent when the
 * save finishes. A failed save is reported through `onError` and is not
 * retried; the next change sends the complete answers again.
 */
export class PollSaveQueue {
    private readonly save: (answers: WhatsNewPollAnswers) => Promise<unknown>;
    private readonly onError: (err: unknown) => void;
    private readonly debounceMs: number;
    private pending: WhatsNewPollAnswers | null = null;
    private ready = false;
    private inFlight = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private disposed = false;

    constructor(options: PollSaveQueueOptions) {
        this.save = options.save;
        this.onError = options.onError;
        this.debounceMs = options.debounceMs ?? POLL_TEXT_SAVE_DELAY_MS;
    }

    /** Sends the answers as soon as no other save is in flight. */
    saveNow(answers: WhatsNewPollAnswers): void {
        if (this.disposed) {
            return;
        }
        this.pending = answers;
        this.markReady();
    }

    /** Sends the answers after `debounceMs` with no further changes. */
    saveDebounced(answers: WhatsNewPollAnswers): void {
        if (this.disposed) {
            return;
        }
        this.pending = answers;
        this.ready = false;
        this.clearTimer();
        this.timer = setTimeout(() => {
            this.timer = null;
            this.markReady();
        }, this.debounceMs);
    }

    /** Sends any answers that are waiting for the debounce delay. */
    flush(): void {
        if (this.disposed || this.pending === null) {
            return;
        }
        this.markReady();
    }

    /** Sends any waiting answers, then stops accepting changes. */
    dispose(): void {
        this.flush();
        this.clearTimer();
        this.disposed = true;
    }

    private markReady(): void {
        this.clearTimer();
        this.ready = true;
        this.send();
    }

    private clearTimer(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private send(): void {
        if (this.inFlight || !this.ready || this.pending === null) {
            return;
        }
        const answers = this.pending;
        this.pending = null;
        this.ready = false;
        this.inFlight = true;

        let request: Promise<unknown>;
        try {
            request = this.save(answers);
        } catch (err) {
            request = Promise.reject(err);
        }
        request
            .catch((err: unknown) => this.onError(err))
            .finally(() => {
                this.inFlight = false;
                this.send();
            });
    }
}
