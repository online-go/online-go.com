// Set the window variables before importing the module
window["ogs_current_language"] = "test_language";
window["ogs_locales"] = {
    "en": {},
    "test_language": {
        "msgid_1": ["translation_1"],
        "msgid_2": ["translation_2"],
        "singular\u0005plural": ["tr_singular", "tr_plural"],  // Why is enquiry character used?
        "singular2\u0005plural2": ["tr_one_form"],  // Why is enquiry character used?
        "context\u0004msgid": ["translation_3"],
        "context\u0004singular\u0005plural": ["tr_singular_2", "tr_plural_2"],
    }
};
window["ogs_countries"] = {'en': {'us': 'United States'}, 'test_language': {'test_cc': 'test_country'}};

import { gettext, pluralidx, ngettext, pgettext, npgettext, interpolate, cc_to_country_name, setCurrentLanguage } from './translate'

jest.mock('goban', () => ({
    setGobanTranslations: jest.fn(),
}));

test('pluralidx en', () => {
    setCurrentLanguage('en');
    // singular
    expect(pluralidx(0)).toBe(1);

    // zero
    expect(pluralidx(1)).toBe(0);

    // many
    expect(pluralidx(2)).toBe(1);
    expect(pluralidx(42)).toBe(1);
});

test('pluralidx ru', () => {
    setCurrentLanguage('ru');
    expect(pluralidx(1)).toBe(0);
    expect(pluralidx(91)).toBe(0);
    expect(pluralidx(2)).toBe(1);
    expect(pluralidx(42)).toBe(1);
    expect(pluralidx(6)).toBe(2);
    expect(pluralidx(0)).toBe(2);
});

test('gettext', () => {
    expect(gettext('msgid_1')).toBe('translation_1');
    expect(gettext('msgid_2')).toBe('translation_2');
});

test('ngettext', () => {
    expect(ngettext('singular', 'plural', 0)).toBe('tr_plural');
    expect(ngettext('singular', 'plural', 1)).toBe('tr_singular');
    expect(ngettext('singular2', 'plural2', 1)).toBe('tr_one_form');
    expect(ngettext('msgid_1', 'plural', 1)).toBe('translation_1');
    expect(ngettext('singular', 'msgid_2', 0)).toBe('translation_2');
});

test('pgettext', () => {
    expect(pgettext('context', 'msgid')).toBe('translation_3');
});

test('npgettext', () => {
    expect(npgettext('context', 'singular', 'plural', 1)).toBe('tr_singular_2');
    expect(npgettext('context', 'singular', 'plural', 2)).toBe('tr_plural_2');
});

test('interpolate array', () => {
    expect(interpolate('%s %s %s', ['One', 'Two', 'Three'])).toBe('One Two Three');
    expect(interpolate('%s %s %s', [1, 2, 3])).toBe('1 2 3');
    expect(interpolate('%s %s %s', [1, 'Two', 3.14])).toBe('1 Two 3.14'); // Mix and match

    expect(interpolate('%d %d %d', ['One', 'Two', 'Three'])).toBe('One Two Three');
    expect(interpolate('%d %d %d', [1, 2, 3])).toBe('1 2 3');
    expect(interpolate('%d %d %d', [1, 'Two', 3.14])).toBe('1 Two 3.14'); // Mix and match
})

test('interpolate object', () => {
    expect(interpolate('{{key_1}} {{key_2}} {{key_3}}', {key_1: 'One', key_2: 'Two', key_3: 'Three'})).toBe('One Two Three');
    expect(interpolate('{{key_3}} {{key_2}} {{key_3}}', {key_1: 'One', key_2: 'Two', key_3: 'Three'})).toBe('Three Two Three');
})

test('cc_to_country_name', () => {
    // Setting the current language may not be necessary in the future. See TODO above cc_to_country_name
    setCurrentLanguage('test_language');
    expect(cc_to_country_name('test_cc')).toBe('test_country');
})