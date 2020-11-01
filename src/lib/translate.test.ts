// Set the window variables before importing the module
window["ogs_current_language"] = "test_language";
window["ogs_locales"] = {
    "test_language": {
        "msgid_1": ["translation_1"],
        "msgid_2": ["translation_2"],
        "singular\u0005plural": ["tr_singular", "tr_plural"],  // Why is enquiry character used?
        "singular2\u0005plural2": ["tr_one_form"],  // Why is enquiry character used?
    }
};

import { gettext, pluralidx, ngettext } from './translate'

jest.mock('goban', () => ({
    setGobanTranslations: jest.fn(),
}));


test('pluralidx zero', () => {
    expect(pluralidx(0)).toBe(1);
});

test('pluralidx one', () => {
    expect(pluralidx(1)).toBe(0);
});

test('pluralidx many', () => {
    expect(pluralidx(2)).toBe(1);
    expect(pluralidx(42)).toBe(1);
});

test('gettext', () => {
    expect(gettext('msgid_1')).toBe('translation_1');
    expect(gettext('msgid_2')).toBe('translation_2');
});

test('ngettext', () => {
    expect(ngettext('singular', 'plural', 0)).toBe('tr_plural');
    expect(ngettext('singular', 'plural', 1)).toBe('tr_singular');
    expect(ngettext('singular2', 'plural2', 1)).toBe('tr_one_form');
    expect(ngettext('msgid_1', 'plural', 0)).toBe('translation_1');
    expect(ngettext('singular', 'msgid_2', 0)).toBe('translation_2');
});
