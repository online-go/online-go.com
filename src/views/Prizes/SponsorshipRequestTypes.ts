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

import { interpolate, ngettext, pgettext } from "@/lib/translate";

export interface PrizeConfig {
    level: number;
    duration: number;
    quantity: number;
}

export interface SponsorshipRequestData {
    id: string;
    requester: number;
    name: string;
    email: string;
    organization: string;
    website: string;
    location: string;
    tournament_name: string;
    tournament_start_date: string;
    tournament_end_date: string;
    expected_players: number;
    previous_year_players: number | null;
    custom_prize_code: string;
    prizes: PrizeConfig[];
    status: string;
    created_at: string;
    approved_at: string | null;
    approved_by: number | null;
    batch: string | null;
}

export interface SupporterPricing {
    hane: { monthly_price_usd: number };
    tenuki: { monthly_price_usd: number };
    meijin: { monthly_price_usd: number };
}

export const DURATION_OPTIONS = [
    { days: 30, months: 1 },
    { days: 60, months: 2 },
    { days: 90, months: 3 },
    { days: 120, months: 4 },
    { days: 180, months: 6 },
    { days: 365, months: 12 },
];

export function getDurationLabel(days: number): string {
    return interpolate(ngettext("%s day", "%s days", days), [days]);
}

export function getLevelName(level: number): string {
    switch (level) {
        case 2:
            return pgettext("OGS supporter level name", "Hane");
        case 3:
            return pgettext("OGS supporter level name", "Tenuki");
        case 4:
            return pgettext("OGS supporter level name", "Meijin");
        default:
            return "Level " + level;
    }
}

export function getMonthlyPrice(pricing: SupporterPricing, level: number): number {
    switch (level) {
        case 2:
            return pricing.hane.monthly_price_usd / 100;
        case 3:
            return pricing.tenuki.monthly_price_usd / 100;
        case 4:
            return pricing.meijin.monthly_price_usd / 100;
        default:
            return 0;
    }
}

export function getDurationMonths(days: number): number {
    const option = DURATION_OPTIONS.find((o) => o.days === days);
    return option ? option.months : days / 30;
}

export function calculateRowCost(pricing: SupporterPricing, row: PrizeConfig): number {
    return getMonthlyPrice(pricing, row.level) * getDurationMonths(row.duration) * row.quantity;
}
