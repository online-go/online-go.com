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

import { _ } from "translate";
import * as React from "react";
import { test_table_1, test_example_3, test_example_4, test_example_5 } from "./test_gor";
import {
    test_glicko2,
    test_str,
    test_expansion,
    test_copy,
    test_expected_win_probability,
    test_nop,
    test_exercise,
} from "./test_glicko2";

interface RatingCalcState {}

export class RatingCalculator extends React.Component<{}, RatingCalcState> {
    constructor(props: {}) {
        super(props);
    }

    componentDidMount() {
        window.document.title = _("Rating Calculator");
    }

    //componentDidUpdate() {}

    //componentWillUnmount() {}

    run_unit_tests() {
        //test gor
        test_table_1();
        test_example_3();
        test_example_4();
        test_example_5();
        //test glicko2
        test_glicko2();
        test_str();
        test_expansion();
        test_copy();
        test_expected_win_probability();
        test_nop();
        test_exercise();
    }

    render() {
        return (
            <div id="Rating-Calculator-Container">
                <p>New page woo!</p>
                <button onClick={this.run_unit_tests}>Run Unit Tests</button>
            </div>
        );
    }
}
