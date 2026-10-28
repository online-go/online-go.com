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

/* Shapes returned by the /api/v1/me/api_clients/<id>/push endpoints. */

export type PushProvider = "apns" | "fcm" | "webhook";

export interface ApiClient {
    id: number;
    client_id: string;
    name: string;
}

/** One provider's settings for an application, without the secret. */
export interface PushCredentials {
    updated_at: string;
    /** Set while delivery is paused after repeated authentication failures */
    paused_at: string | null;
    pause_reason: string;
    key_id?: string;
    team_id?: string;
    bundle_id?: string;
    /** The APNs environments Apple accepted the key in */
    environments?: string[];
    project_id?: string;
    client_email?: string;
    url?: string;
}

export interface PushStatus {
    apns: PushCredentials | null;
    fcm: PushCredentials | null;
    webhook: PushCredentials | null;
    /** For webhooks, the players subscribed to it */
    devices: Record<PushProvider, number>;
    /** Over the last 7 days */
    stats: Record<PushProvider, { sent: number; failed: number }>;
    recent_errors: Array<{ time: string; provider: PushProvider; outcome: string; detail: string }>;
    /** Only in the response that generated a new webhook signing secret */
    signing_secret?: string;
}
