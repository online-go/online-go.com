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
import { _ } from "@/lib/translate";

type SocialLoginButtonsProps = {
    next_url?: string;
};

export function SocialLoginButtons(props: SocialLoginButtonsProps): React.ReactElement {
    const next = props.next_url ? `?next=${props.next_url}` : "";

    return (
        <div className="social-buttons">
            <a href={`/login/google-oauth2/${next}`} className="s btn md-icon" target="_self">
                <span className="google google-oauth2-icon" /> {_("Sign in with Google")}
            </a>
            <a href={`/login/facebook/${next}`} className="s btn md-icon" target="_self">
                <span className="facebook facebook-icon" /> {_("Sign in with Facebook")}
            </a>
            <a href={`/login/twitter/${next}`} className="s btn md-icon" target="_self">
                <i className="twitter twitter-icon fa fa-twitter" />
                {_("Sign in with Twitter")}
            </a>
            <a href={`/login/apple-id/${next}`} className="s btn md-icon" target="_self">
                <i className="apple apple-id-icon fa fa-apple" />
                {_("Sign in with Apple")}
            </a>
            <a href={`/login/github/${next}`} className="s btn md-icon" target="_self">
                <i className="github github-icon fa fa-github" />
                {_("Sign in with GitHub")}
            </a>
        </div>
    );
}
