/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import { setGobanTranslations } from 'goban';

export let current_language = window["ogs_current_language"] || 'en';
export let languages = window["ogs_languages"] || {'en': 'English'};
export let countries = window["ogs_countries"] || {'en': {'us': 'United States'}};
export let locales = window["ogs_locales"] || {'en': {}};
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
        if (catalog[key].length === 1) {
            /* If we don't have a plural translation in a multi-message-id
             * translation but we do happen to have the plural translation as a
             * stand alone translation, use that. */
            if (count !== 1) {
                if (plural in catalog) {
                    return catalog[plural][0];
                }
            }

            count = 1;
        }

        return catalog[key][count === 1 ? 0 : 1];
    }

    /* If we don't have a ngettext translation entry at all, but
     * we do have some stand alone translations, use those */
    if ((count !== 1 || !(singular in catalog)) && plural in catalog) {
        return catalog[plural][0];
    }
    if (singular in catalog) {
        return catalog[singular][0];
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
    let skey = context + "" + singular;
    let pkey = context + "" + plural;
    if (key in catalog) {
        if (catalog[key].length === 1) {
            /* If we don't have a plural translation in a multi-message-id
             * translation but we do happen to have the plural translation as a
             * stand alone translation, use that. */
            if (count !== 1) {
                if (pkey in catalog) {
                    return catalog[pkey][0];
                }

                if (plural in catalog) {
                    return catalog[plural][0];
                }
            }

            count = 1;
        }
        return catalog[key][count === 1 ? 0 : 1];
    }

    /* If we don't have a npgettext translation entry at all, but
     * we do have some stand alone translations, use those */
    if (count !== 1 || !(singular in catalog || skey in catalog)) {
        if (pkey in catalog) {
            return catalog[pkey][0];
        }
        if (plural in catalog) {
            return catalog[plural][0];
        }
    }
    if (skey in catalog) {
        return catalog[skey][0];
    }
    if (singular in catalog) {
        return catalog[singular][0];
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

//let original_countries=dup(countries);

let extended_countries = [];
extended_countries.push(["_African_Union", gettext("African Union")]);
extended_countries.push(["_Arab_League", gettext("Arab League")]);
extended_countries.push(["_ASEAN", gettext("ASEAN")]);
extended_countries.push(["_CARICOM", gettext("CARICOM")]);
extended_countries.push(["_CIS",  gettext("CIS")]);
extended_countries.push(["_Commonwealth",  gettext("Commonwealth")]);
extended_countries.push(["_England",  gettext("England")]);
extended_countries.push(["_Islamic_Conference", gettext("Islamic Conference")]);
extended_countries.push(["_Kosovo", gettext("Kosovo")]);
extended_countries.push(["_Lord_Howe_Island", gettext("Lord Howe Island")]);
extended_countries.push(["_NATO", gettext("NATO")]);
extended_countries.push(["_Northern_Cyprus", gettext("Northern Cyprus")]);
extended_countries.push(["_Northern_Ireland", gettext("Northern Ireland")]);
extended_countries.push(["_Olimpic_Movement", gettext("Olympic Movement")]);
extended_countries.push(["_OPEC", gettext("OPEC")]);
extended_countries.push(["_Red_Cross", gettext("Red Cross")]);
extended_countries.push(["_Scotland", gettext("Scotland")]);
extended_countries.push(["_Somaliland", gettext("Somaliland")]);
extended_countries.push(["_Tibet", gettext("Tibet")]);
extended_countries.push(["_United_Nations", gettext("United Nations")]);
extended_countries.push(["_Wales", gettext("Wales")]);
extended_countries.push(["_cat", gettext("Catalonia")]);

let fantasy_countries = [];
let fantasy_countries_cc = {};
fantasy_countries.push(["_Klingon", gettext("Klingon")]);
fantasy_countries.push(["_United_Federation_of_Planets", gettext("United Federation of Planets")]);
fantasy_countries.push(["_Pirate", gettext("Pirate")]);
fantasy_countries.push(["_Starfleet", gettext("Starfleet")]);
fantasy_countries.push(["_DOOP", gettext("DOOP")]);
fantasy_countries.push(["_Esperanto", gettext("Esperantujo")]);  // Esperanto speakers pretend they come from Esperantujo!  Who knew!
fantasy_countries.push(["_GoT_Arryn", gettext("House Arryn")]);
fantasy_countries.push(["_GoT_Baratheon", gettext("House Baratheon")]);
fantasy_countries.push(["_GoT_Greyjoy", gettext("House Greyjoy")]);
fantasy_countries.push(["_GoT_Lannister", gettext("House Lannister")]);
fantasy_countries.push(["_GoT_Martell", gettext("House Martell")]);
fantasy_countries.push(["_GoT_Stark", gettext("House Stark")]);
fantasy_countries.push(["_GoT_Targaryen", gettext("House Targaryen")]);
fantasy_countries.push(["_GoT_Tully", gettext("House Tully")]);
fantasy_countries.push(["_GoT_Tyrell", gettext("House Tyrell")]);

try {
    for (let e of fantasy_countries) {
        fantasy_countries_cc[e[0]] = true;
        countries[current_language][e[0]] = e[1];
    }
    for (let e of extended_countries) {
        countries[current_language][e[0]] = e[1];
    }
} catch (e) {
    console.error((e as Error).message);
}



export function interpolate(str: string, params: any): string {
    if (Array.isArray(params)) {
        let idx = 0;
        return str.replace(/%[sd]/g, (_, __, position) => {
            if (idx >= params.length) {
                //throw new Error(`Missing array index ${idx} for string: ${str}`);
                console.warn(`Missing array index ${idx} for string: ${str}`);
            }
            return params[idx++];
        });
    }
    if (typeof(params) === "object") {
        return str.replace(/{{([^}]+)}}/g,  (_, key, position) => {
            if (!(key in params)) {
                //throw new Error(`Missing interpolation key: ${key} for string: ${str}`);
                console.warn(`Missing interpolation key: ${key} for string: ${str}`);
            }
            return params[key];
        });
    }
    return str.replace(/%[sd]/g, (_, __, position) => params);
}
export function _(str): string {
    return gettext(str);
}

export function cc_to_country_name(country_code) {
    if (current_language in countries) {
        return countries[current_language][country_code];
    }
    else {
        return country_code;
    }
}



languages["auto"] = gettext("Automatic");
let current_countries = countries[current_language];
for (let cc in current_countries) {
    sorted_locale_countries.push({
        cc: cc,
        name: current_countries[cc],
    });
}
sorted_locale_countries.sort((a, b) => {
    if ((a.cc in fantasy_countries_cc) && !(b.cc in fantasy_countries_cc)) {
        return 1;
    }
    if (!(a.cc in fantasy_countries_cc) && (b.cc in fantasy_countries_cc)) {
        return -1;
    }

    return a.name.localeCompare(b.name);
});


function sanitize(language_or_country:string):string {
    return language_or_country.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function getLanguageFlag(language, user_country, default_flag) {
    if (language === "english" && ["ca", "gb", "au", "nz", "pk", "ng", "ph", "za", "sg", "ie", "us"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "spanish" && ["mx", "co", "cl", "ar"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "french" && ["ca", "be", "cd", "ci", "ch"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "german" && ["at", "de", "be", "ch"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "italian" && ["it", "ch", "va", "sm"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "portuguese" && ["pt", "br", "mz", "ao"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }
    if (language === "dutch" && ["nl", "be"].indexOf(user_country) >= 0) {
        return sanitize(user_country);
    }

    return getCountryFlagClass(default_flag);
}


export function getCountryFlagClass(country_code) {
    if (!country_code)               { return "un"; }
    if (country_code === "eu")       { return "_European_Union"; }
    if (country_code === "un")       { return "_United_Nations"; }
    if (parseInt(country_code) > 0 ) { return "_United_Nations"; }
    if (country_code.length > 2)     { return sanitize(country_code); }
    return sanitize(country_code);
}

export function setCurrentLanguage(language_code) {
    current_language = language_code;

    setGobanTranslations({
        'Your move': _('Your move'),
        'White': _('White'),
        'Black': _('Black'),
        'Illegal Ko Move': _('Illegal Ko Move'),
        'Move is suicidal': _('Move is suicidal'),
        'Loading...': _('Loading...'),
        'Processing...': _('Processing...'),
        'Submitting...': _('Submitting...'),
        'A stone has already been placed here': _('A stone has already been placed here'),
        'Illegal board repetition': _('Illegal board repetition'),
        'Error submitting move': _('Error submitting move'),
        'Game Finished': _('Game Finished'),
        'Black to move': _('Black to move'),
        'White to move': _('White to move'),
        'Your move - opponent passed': _('Your move - opponent passed'),
        'Review': _('Review'),
        'Control passed to %s': _('Control passed to %s'),
        'Synchronization error, reloading': _('Synchronization error, reloading'),
        'Stone Removal': _('Stone Removal'),
        'Stone Removal Phase': _('Stone Removal Phase'),
        'Enter the label you want to add to the board': _('Enter the label you want to add to the board'),

        'Black Walnut': _('Black Walnut'),
        'Book': _('Book'),
        'Glass': _('Glass'),
        'Granite': _('Granite'),
        'HNG Night': _('HNG Night'),
        'HNG': _('HNG'),
        'Kaya': _('Kaya'),
        'Night Play': _('Night Play'),
        'Night': _('Night'),
        'Persimmon': _('Persimmon'),
        'Plain': _('Plain'),
        'Red Oak': _('Red Oak'),
        'Shell': _('Shell'),
        'Slate': _('Slate'),
        'Worn Glass': _('Worn Glass'),

        '%swk': pgettext("Short time (weeks)", "%swk"),
        '%sd': pgettext("Short time (days)", "%sd"),
        '%sh': pgettext("Short time (hours)", "%sh"),
        '%sm': pgettext("Short time (minutes)", "%sm"),
        '%ss': pgettext("Short time (seconds)", "%ss"),
    });
}
setCurrentLanguage(current_language);


export default {
    gettext: gettext,
    pgettext: pgettext,
    ngettext: ngettext,
    npgettext: npgettext,
    get_format: get_format,
    interpolate: interpolate,
    cc_to_country_name: cc_to_country_name,
    current_language: current_language,
    languages: languages,
    countries: countries,
    getCountryFlagClass: getCountryFlagClass,
    getLanguageFlag: getLanguageFlag,
    _: _,
};


/* Extra translation strings */
_("Not allowed to access this game");
_("Not allowed to access this review");

window['gettext'] = gettext;
window['pgettext'] = pgettext;
window['ngettext'] = ngettext;
window['npgettext'] = npgettext;
window['get_format'] = get_format;
window['interpolate'] = interpolate;
