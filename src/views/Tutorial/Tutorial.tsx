/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {OGSComponent, Resolver} from "components";

interface TutorialProperties {
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

// TODO: Implement Tutorial

export class Tutorial extends Resolver<TutorialProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    resolve() {
        return get("/hello").then((stuff) => {
            //this.setState({'overview': overview});
        }).catch((err) => {
            console.info("Caught", err);
        });
    }

    //render() {
    resolvedRender() {
        return (
        <div className="Tutorial">
            Hello World [Tutorial]
        </div>
        );
    }
}
