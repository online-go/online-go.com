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

import { current_language } from "@/lib/translate";
import * as dateFnsLocales from "date-fns/locale";

// Map OGS language codes to date-fns locale names
const localeMap: { [key: string]: string } = {
    en: "enUS",
    "en-US": "enUS",
    "en-GB": "enGB",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    ja: "ja",
    ko: "ko",
    pt: "pt",
    ru: "ru",
    "zh-cn": "zhCN",
    "zh-tw": "zhTW",
    cs: "cs",
    pl: "pl",
    uk: "uk",
    hr: "hr",
    sr: "sr",
    ro: "ro",
    da: "da",
    he: "he",
    vi: "vi",
};

export function getLocale(): Locale {
    const localeName = localeMap[current_language] || "enUS";
    return dateFnsLocales[localeName];
}
