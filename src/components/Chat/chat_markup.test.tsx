import { chat_markup } from './chat_markup'
import * as React from 'react'

// Workaround for error "TypeError: goban_1.setGobanTranslations is not a function"
jest.mock('translate', () => ({
    _: jest.fn(x => x),
}));

jest.mock('Player', () => ({
    Player: jest.fn(),
}));

function expect_singular_markup(input: string, output: JSX.Element) {
    expect(chat_markup(input)).toEqual([output]);
}

test('tsumegododo', () => {
    expect_singular_markup("tsumegodojo", <span key={0}>{"tsumegododo"}</span>);
    expect_singular_markup("https://www.tsumegodojo.com",
    <a key={0} target="_blank" href={"https://www.tsumegododo.com"}>{"https://www.tsumegododo.com"}</a>);
});

// Uncomment when bug #1251 has been fixed
// test('Google Maps link not parsed as e-mail', () => 
//     expect_singular_markup("https://www.google.com/maps/@50.7006874,-3.0915427,13.75z",
//     <a key={0} target="_blank" href={"https://www.google.com/maps/@50.7006874,-3.0915427,13.75z"}>{"https://www.google.com/maps/@50.7006874,-3.0915427,13.75z"}</a>)
// )