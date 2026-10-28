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

export type PushProvider = "apns" | "fcm";

export interface ApiClient {
    id: number;
    client_id: string;
    name: string;
}

interface PushProviderState {
    updated_at: string;
    paused_at: string | null;
    pause_reason: string | null;
    consecutive_auth_failures: number;
}

export interface ApnsCredentialsStatus extends PushProviderState {
    key_id: string;
    team_id: string;
    bundle_id: string;
    /** The environments Apple accepted the key in when it was uploaded. */
    environments: Array<"production" | "sandbox">;
}

export interface FcmCredentialsStatus extends PushProviderState {
    project_id: string;
    client_email: string;
}

export interface PushDayStats {
    date: string;
    sent: number;
    failed: number;
}

export interface PushStatus {
    apns: ApnsCredentialsStatus | null;
    fcm: FcmCredentialsStatus | null;
    devices: { apns: { production: number; sandbox: number }; fcm: number };
    stats: { apns: PushDayStats[]; fcm: PushDayStats[] };
    recent_errors: Array<{ time: string; provider: PushProvider; outcome: string; detail: string }>;
}

export interface PushTestResult {
    device_id: number;
    provider: PushProvider;
    apns_environment: "production" | "sandbox" | null;
    outcome: string;
    detail: string;
}
