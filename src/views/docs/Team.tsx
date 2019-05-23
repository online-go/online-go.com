/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import * as data from "data";

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
        get('https://api.github.com/repos/online-go/online-go.com/contributors?anon=1')
        .then((list) => {
            this.setState({contributors: list});
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
        let cz = getLanguageFlag("czech", country, "cz");

        let moderators = [
            {"id": 784   , "username": "mlopezviedma" , "country": ["ar"] , "languages": [es, en]} ,
            {"id": 781   , "username": "crodgers"     , "country": ["us"] , "languages": [en]} ,
            {"id": 69627 , "username": "xhu98"        , "country": ["us"] , "languages": [cn, en]} ,
            {"id": 4     , "username": "matburt"      , "country": ["us"] , "languages": [en]} ,
            {"id": 1     , "username": "anoek"        , "country": ["us"] , "languages": [en]} ,
            {"id": 52    , "username": "trohde"       , "country": ["de"] , "languages": [de, en]} ,
            {"id": 64817 , "username": "mark5000"     , "country": ["us"] , "languages": [en]} ,
            {"id": 66091 , "username": "Revar Isavé"  , "country": ["de"] , "languages": [de, gb]} ,
            {"id": 441   , "username": "VincentCB"    , "country": ["ca"] , "languages": [en, fr]} ,
            {"id": 55415 , "username": "sousys"       , "country": ["se"] , "languages": [se, en]} ,
            {"id": 360861 , "username": "AdamR"       , "country": ["cz"] , "languages": [cz, en]} ,
            {"id": 299041 , "username": "Razza99"     , "country": ["gb"] , "languages": [en]} ,
            {"id": 412892 , "username": "Eugene" , "country": ["au"] , "languages": [en]} ,
            {"id": 445315 , "username": "BHydden"     , "country": ["au"] , "languages": [en]} ,
            {"id": 391401 , "username": "Conrad Melville", "country": ["us"] , "languages": [en]} ,
        ];
        let developers = [
            {"id": 4, "username": "matburt", "country": ["us"], "languages": [en]},
            {"id": 1, "username": "anoek", "country": ["us"], "languages": [en]},
        ];

        shuffleArray(moderators);
        shuffleArray(developers);


        return (
            <div className="container page-width">
                <h2>{_("Team")}</h2>
                <div style={{display: "inline-block", textAlign: "justify"}}>
                    {_('Online-Go.com is maintained by a small handful of dedicated volunteers, drop them a "Thank You!" message sometime!')}
                </div>
                <div className="row" style={{paddingLeft: "2em"}}>
                    <div className="col-sm-6">
                        <h3>{_("Moderators")}</h3>
                        {moderators.map((u, idx) => (
                            <div key={u.id} >
                                <span style={{display: "inline-block", width: "3em"}}>
                                    {u.country.map((c, idx) => (<Flag key={c} country={c}/>))}
                                </span>
                                <span style={{display: "inline-block", width: "8em"}}>
                                    <Player user={u} />
                                </span>
                                {_("Languages")}: {u.languages.map((c, idx) => (<span key={c} ><Flag country={c}/></span>) )}
                            </div>
                        ))}
                    </div>
                    <div className="col-sm-6">
                        <h3>{_("Lead Developers")}</h3>
                        {developers.map((u, idx) => (
                            <div key={u.id}>
                                <span style={{display: "inline-block", width: "3em"}}>
                                    {u.country.map((c, idx) => (<span key={c} ><Flag country={c}/></span>) )}
                                </span>
                                <span style={{display: "inline-block", width: "8em"}}>
                                    <Player user={u} />
                                </span>
                                {_("Languages")}: {u.languages.map((c, idx) => (<span key={c} ><Flag country={c}/></span>))}
                            </div>
                        ))}
                        <h3>{_("Github Contributors")}</h3>
                        {this.state.contributors.map((u, idx) => (
                            <div key={u.id}>
                                <span style={{display: "inline-block", width: "3em"}}>
                                    <img src={u.avatar_url} width={15} height={15}/>
                                </span>
                                <span style={{display: "inline-block", width: "8em"}}>
                                    <a href={u.html_url || ('https://github.com/' + u.name)}>{u.login || u.name}</a>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}
