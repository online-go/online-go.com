/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let win = typeof(window) === "undefined" ? {} : window;

export let current_language = win["ogs_current_language"] || 'en';
export let languages = win["ogs_languages"] || {'en': 'English'};
export let countries = win["ogs_countries"] || {'en': {'us': 'United States'}};
export let locales = win["ogs_locales"] || {'en': {}};
export let sorted_locale_countries = [];


let catalog;
try {
    catalog = locales[current_language] || {};
} catch (e) {
    catalog = {};
}

export function pluralidx(count) { return (count === 1) ? 0 : 1; }

const debug_wrap = current_language === "debug" ? (s) => `[${s}]` : (s) => s;

export function gettext(msgid) {
    if (msgid in catalog) {
        return catalog[msgid][0];
    }
    return debug_wrap(msgid);
}

export function ngettext(singular, plural, count) {
    let key = singular + "" + plural;
    if (key in catalog) {
        return catalog[key][count === 1 ? 0 : 1];
    }
    return debug_wrap(count === 1 ? singular : plural);
}


export function pgettext(context, msgid) {
    let key = context + "" + msgid;
    if (key in catalog) {
        return catalog[key][0];
    }
    return debug_wrap(msgid);
}

export function npgettext(context, singular, plural, count) {
    let key = context + "" + singular + "" + plural;
    if (key in catalog) {
        return catalog[key][count === 1 ? 0 : 1];
    }
    return debug_wrap(count === 1 ? singular : plural);
}

let gettext_formats = {};

gettext_formats["DATETIME_FORMAT"] = "N j, Y, P";
gettext_formats["DATE_FORMAT"] = "N j, Y";
gettext_formats["DECIMAL_SEPARATOR"] = ".";
gettext_formats["MONTH_DAY_FORMAT"] = "F j";
gettext_formats["NUMBER_GROUPING"] = "3";
gettext_formats["TIME_FORMAT"] = "P";
gettext_formats["FIRST_DAY_OF_WEEK"] = "0";
gettext_formats["TIME_INPUT_FORMATS"] = ["%H:%M:%S", "%H:%M"];
gettext_formats["THOUSAND_SEPARATOR"] = ",";
gettext_formats["DATE_INPUT_FORMATS"] = ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"];
gettext_formats["YEAR_MONTH_FORMAT"] = "F Y";
gettext_formats["SHORT_DATE_FORMAT"] = "m/d/Y";
gettext_formats["SHORT_DATETIME_FORMAT"] = "m/d/Y P";
gettext_formats["DATETIME_INPUT_FORMATS"] = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y", "%m/%d/%y %H:%M:%S", "%m/%d/%y %H:%M", "%m/%d/%y", "%Y-%m-%d %H:%M:%S.%f"];

export function get_format(format_type) {
    let value = gettext_formats[format_type];
    if (typeof(value) === "undefined") {
      return format_type;
    } else {
      return value;
    }
}


export function interpolate(str: string, params: any): string {
    if (Array.isArray(params)) {
        let idx = 0;
        return str.replace(/%[sd]/g, (_, __, position) => {
            if (idx >= params.length) {
                throw new Error(`Missing array index ${idx} for string: ${str}`);
            }
            return params[idx++];
        });
    }
    if (typeof(params) === "object") {
        return str.replace(/{{([^}]+)}}/g,  (_, key, position) => {
            if (!(key in params)) {
                throw new Error(`Missing interpolation key: ${key} for string: ${str}`);
            }
            return params[key];
        });
    }
    return str.replace(/%[sd]/g, (_, __, position) => params);
}
export function _(str): string {
    return gettext(str);
}


export default {
    gettext: gettext,
    pgettext: pgettext,
    ngettext: ngettext,
    npgettext: npgettext,
    get_format: get_format,
    interpolate: interpolate,
    current_language: current_language,
    languages: languages,
    _: _,
};
