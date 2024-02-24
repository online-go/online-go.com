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

import * as React from "react";

interface TabCompleteInputProperties extends React.HTMLProps<HTMLInputElement> {
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    className?: string;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
    enterKeyHint?: "search" | "enter" | "done" | "go" | "next" | "previous" | "send" | undefined;
}

export const TabCompleteInput = React.forwardRef<HTMLInputElement, TabCompleteInputProperties>(
    (props, ref): JSX.Element => {
        React.useEffect(() => {
            ($((ref as any).current) as any).nicknameTabComplete();
        }, [(ref as any).current]);

        // The input is wrapped in a form so that it presents a send button
        // properly on mobile, avoiding Smart Go Next kind of problems:
        // https://www.androidpolice.com/2017/10/10/samsung-internet-browser-will-get-smart-go-next-better-form-navigation-also-coming-chrome/.
        return (
            <form className="TabCompleteInput" onSubmit={(e) => e.preventDefault()}>
                <input ref={ref} enterKeyHint="send" {...props} />
            </form>
        );
    },
);
