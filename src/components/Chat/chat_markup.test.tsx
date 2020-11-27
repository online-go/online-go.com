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

test('tsumegododo', async () => {
    expect_singular_markup("https://www.tsumegodojo.com",
        <a key={0} target="_blank" href={"https://www.tsumegododo.com"}>{"https://www.tsumegododo.com"}</a>);
    expect_singular_markup("tsumegodojo", <span key={0}>{"tsumegododo"}</span>);
});

