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

import { useUser } from "@/lib/hooks";

import { pgettext } from "@/lib/translate";

type TemplateComponentProps = {
    render_twice?: boolean;
};

export function TemplateComponent(props: TemplateComponentProps): React.ReactElement {
    const [username, setUsername] = React.useState("");

    const hangs_around = React.useRef("forever");

    const user = useUser(); // user.anonymous will be set if they aren't logged in

    const anAction = () => {
        console.log("A visitor clicked the question mark!");
    };

    React.useEffect(() => {
        // Don't forget that side-effects go here, executed after rendering the return value
        console.log("Rendered!");
        hangs_around.current = "rendered";
    });

    if (username === "" && props.render_twice) {
        setUsername("Mr ReRender :)");
    }

    /* render */
    return (
        <div className="TemplateComponent">
            {(!user.anonymous || null) &&
                pgettext(
                    "This text is just in a template, it's not used in the site",
                    "Consider using pgettext instead of '_', to make translators' life easier",
                )}
            {(user.anonymous || null) && <i className="fa fa-question" onClick={anAction} />}

            {<span className="hangs-around">{hangs_around.current}</span>}
        </div>
    );
}
