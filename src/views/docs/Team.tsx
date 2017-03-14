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
import {_, getLanguageFlag} from "translate";
import {get} from "requests";
import {Flag} from "Flag";
import {Player} from "Player";
import data from "data";

function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export class Team extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            contributors: []
        };
    }

    componentWillMount() {
        get('https://api.github.com/repos/online-go/online-go.com/contributors')
        .then((list) => {
            this.setState({contributors: list})
        })
        .catch((err) => {
            console.error(err);
        });
    }

    render() {
        let user = data.get("user");


        let country = user ? user.country : "gb";

        let fr = getLanguageFlag("french", country, "fr");
        let en = getLanguageFlag("english", country, "us");
        let es = getLanguageFlag("spanish", country, "es");
        let de = getLanguageFlag("german", country, "de");
        let cn = getLanguageFlag("chinese", country, "cn");
        let hi = getLanguageFlag("hindi", country, "in");
        let gb = getLanguageFlag("gb", country, "gb");
        let se = getLanguageFlag("swedish", country, "se");

        let moderators = [
            //{'id': 57612, 'username': 'Franzisa', 'country': ['de', 'fr'], 'languages': [ de,fr,en ]},
            //{'id': 914, 'username': 'pathogenix', 'country': ['gb'], 'languages': [en]},
            {"id": 784, "username": "mlopezviedma", "country": ["ar"], "languages": [es, en]},
            {"id": 781, "username": "crodgers", "country": ["us"], "languages": [en]},
            //{'id': 963, 'username': 'thouis', 'country': ['us'], 'languages': [fr, en]},
            {"id": 69627, "username": "xhu98", "country": ["us"], "languages": [cn, en]},
            {"id": 4, "username": "matburt", "country": ["us"], "languages": [en]},
            {"id": 1, "username": "anoek", "country": ["us"], "languages": [en]},

            //{'id': 444, 'username': 'calantir', 'country': ['us'], 'languages': [en]},
            {"id": 52, "username": "trohde", "country": ["de"], "languages": [de, en]},
            //{'id': 94496, 'username': 'tinuviel', 'country': ['us'], 'languages': [en]},
            //{'id': 1367, 'username': 'Fairgo', 'country': ['us'], 'languages': [hi, en]},
            {"id": 64817, "username": "mark5000", "country": ["us"], "languages": [en]},
            {"id": 66091, "username": "Revar Isavé", "country": ["de"], "languages": [de, gb]},
            {"id": 441, "username": "VincentCB", "country": ["ca"], "languages": [en, fr]},
            {"id": 55415, "username": "sousys", "country": ["se"], "languages": [se, en]},
        ];
        let developers = [
            {"id": 4, "username": "matburt", "country": ["us"], "languages": [en]},
            {"id": 1, "username": "anoek", "country": ["us"], "languages": [en]},
        ];

        shuffleArray(moderators);
        shuffleArray(developers);


        return (
            <div className="container" style={{paddingTop: "2em", textAlign: "center"}}>
                <div style={{display: "inline-block", textAlign: "left"}}>
                    <div style={{display: "inline-block", width: "20em", textAlign: "justify"}}>
                        {_('Online-Go.com is maintained by a small handful of dedicated volunteers, drop them a "Thank You!" message sometime!')}
                    </div>

                    <h3>{_("Moderators")}</h3>
                    {moderators.map((u, idx) => (
                        <div key={idx} >
                            <span style={{display: "inline-block", width: "3em"}}>
                                {u.country.map((c, idx) => (<Flag key={idx} country={c}/>))}
                            </span>
                            <span style={{display: "inline-block", width: "8em"}}>
                                <Player user={u} />
                            </span>
                            {_("Languages")}: {u.languages.map((c, idx) => (<span key={idx} ><Flag country={c}/></span>) )}
                        </div>
                    ))}
                    <h3>{_("Lead Developers")}</h3>
                    {developers.map((u, idx) => (
                        <div key={idx}>
                            <span style={{display: "inline-block", width: "3em"}}>
                                {u.country.map((c, idx) => (<span key={idx} ><Flag country={c}/></span>) )}
                            </span>
                            <span style={{display: "inline-block", width: "8em"}}>
                                <Player user={u} />
                            </span>
                            {_("Languages")}: {u.languages.map((c, idx) => (<span key={idx} ><Flag country={c}/></span>))}
                        </div>
                    ))}
                    <h3>{_("Github Contributors")}</h3>
                    {this.state.contributors.map((u, idx) => (
                        <div key={idx}>
                            <span style={{display: "inline-block", width: "3em"}}>
                                <img src={u.avatar_url} width={15} height={15}/>
                            </span>
                            <span style={{display: "inline-block", width: "8em"}}>
                                <a href={u.html_url}>{u.login}</a>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
