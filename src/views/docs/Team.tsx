/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _, pgettext, getLanguageFlag } from "translate";
import { get } from "requests";
import { Flag } from "Flag";
import { Player } from "Player";
import * as data from "data";

function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export class Team extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            contributors: [],
        };
    }

    UNSAFE_componentWillMount() {
        get("https://api.github.com/repos/online-go/online-go.com/contributors?per_page=100")
            .then((list) => {
                this.setState({ contributors: list });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    render() {
        const user = data.get("user");

        const country = user ? user.country : "gb";

        const fr = getLanguageFlag("french", country, "fr");
        const en = getLanguageFlag("english", country, "us");
        const es = getLanguageFlag("spanish", country, "es");
        const de = getLanguageFlag("german", country, "de");
        const cn = getLanguageFlag("chinese", country, "cn");
        const gb = getLanguageFlag("gb", country, "gb");
        const se = getLanguageFlag("swedish", country, "se");
        const cz = getLanguageFlag("czech", country, "cz");
        const nl = getLanguageFlag("netherlands", country, "nl");
        const jp = getLanguageFlag("japan", country, "jp");
        const fi = getLanguageFlag("finnish", country, "fi");
        const it = getLanguageFlag("italian", country, "it");
        const eng = "_England";

        const moderators = [
            { id: 784, country: ["ar"], languages: [es, en] }, //mlopezviedma
            { id: 781, country: ["us"], languages: [en] }, //crocrobot
            { id: 69627, country: ["us"], languages: [cn, en] }, //xhu98
            { id: 4, country: ["us"], languages: [en] }, //matburt
            { id: 1, country: ["us"], languages: [en] }, //anoek
            { id: 52, country: ["de"], languages: [de, en] }, //trohde
            { id: 64817, country: ["us"], languages: [en] }, //mark5000
            { id: 66091, country: ["de"], languages: [de, gb] }, //Revar Isavé
            { id: 441, country: ["ca"], languages: [en, fr] }, //VincentCB
            { id: 55415, country: ["se"], languages: [se, en] }, //entrpy
            { id: 360861, country: ["cz"], languages: [cz, en] }, //AdamR
            { id: 299041, country: ["gb"], languages: [en] }, //Razza99
            { id: 412892, country: ["au"], languages: [en] }, //Eugene
            { id: 445315, country: ["au"], languages: [en] }, //BHydden
            { id: 449941, country: ["eu"], languages: [de, en] }, //flovo
            { id: 209826, country: ["nl"], languages: [nl, gb, jp] }, //Vsotvep
            { id: 683917, country: ["us"], languages: [en, cn] }, //RubyMineshaft
            { id: 497519, country: ["au"], languages: [eng] }, //Kosh
            { id: 427361, country: ["ie"], languages: [en] }, //shinuito
            { id: 85719, country: ["fi"], languages: [fi, gb] }, //KoBa
            { id: 695886, country: ["de"], languages: [de, en] }, //KAOSkonfused
            { id: 483146, country: ["gb"], languages: [en, fr] }, //teapoweredrobot
            { id: 76618, country: ["us"], languages: [en] }, //yebellz
            { id: 193671, country: ["nl"], languages: [nl, gb, de] }, //gennan
            { id: 52288, country: ["se"], languages: [se, en] }, //le_4tc
            { id: 126739, country: ["it"], languages: [it, fr, en, es] }, //Sofiam
        ];
        const developers = [
            { id: 4, username: "matburt", country: ["us"], languages: [en] },
            { id: 1, username: "anoek", country: ["us"], languages: [en] },
        ];

        shuffleArray(moderators);
        shuffleArray(developers);

        return (
            <div id="Team" className="container page-width">
                <h2>{_("Team")}</h2>
                <div style={{ display: "inline-block", textAlign: "justify" }}>
                    {_(
                        'Online-Go.com is maintained by a small handful of dedicated volunteers, drop them a "Thank You!" message sometime!',
                    )}
                </div>
                <div className="row" style={{ paddingLeft: "2em" }}>
                    <div className="col-sm-6">
                        <h3>{_("Moderators")}</h3>
                        {moderators.map((u) => (
                            <div key={u.id}>
                                <span className="flags">
                                    {u.country.map((c) => (
                                        <Flag key={c} country={c} />
                                    ))}
                                </span>
                                <span style={{ display: "inline-block", width: "10em" }}>
                                    <Player user={u} />
                                </span>
                                {_("Languages")}:{" "}
                                {u.languages.map((c) => (
                                    <span key={c}>
                                        <Flag country={c} />
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="col-sm-6">
                        <h3>{_("Lead Developers")}</h3>
                        {developers.map((u) => (
                            <div key={u.id}>
                                <span className="flags">
                                    {u.country.map((c) => (
                                        <span key={c}>
                                            <Flag country={c} />
                                        </span>
                                    ))}
                                </span>
                                <span style={{ display: "inline-block", width: "9em" }}>
                                    <Player user={u} />
                                </span>
                                {_("Languages")}:{" "}
                                {u.languages.map((c) => (
                                    <span key={c}>
                                        <Flag country={c} />
                                    </span>
                                ))}
                            </div>
                        ))}

                        <h3>{_("Github Contributors")}</h3>
                        {this.state.contributors.map((u, idx) => (
                            <div key={idx}>
                                <span className="flags">
                                    <img src={u.avatar_url} width={15} height={15} />
                                </span>
                                <span className="name">
                                    <a href={u.html_url || "https://github.com/" + u.name}>
                                        {u.login || u.name}
                                    </a>
                                </span>
                            </div>
                        ))}

                        <h3>{_("Security Vulnerability Reporting")}</h3>
                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://online-go.com/user/view/740904/A-i">Aiden</a>
                            </span>
                        </div>

                        <h3>{pgettext("Sound and graphics files", "Assets")}</h3>
                        <div>
                            <span className="flags">
                                <Flag country="gb" />
                            </span>
                            <span className="name">
                                <a href="https://voicebunny.com/voice-actor/claire-natalie-TK5C1B8">
                                    Claire Natalie
                                </a>
                            </span>
                            <span className="description">- GB English voiceover</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://freesound.org/people/rhodesmas/">Andy Rhode</a>
                            </span>
                            <span className="description">- Effects</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://freesound.org/people/tim.kahn/">Amy Gedgaudas</a>
                            </span>
                            <span className="description">- 2013 English 10 second count down</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://freesound.org/people/acclivity/">acclivity</a>
                            </span>
                            <span className="description">- Effects</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://freesound.org/people/JonnyRuss01/">JonnyRuss01</a>
                            </span>
                            <span className="description">- Effects</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://freesound.org/people/leviclaassen/">
                                    leviclaassen
                                </a>
                            </span>
                            <span className="description">- Effects</span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="http://seamless-pixels.blogspot.com/">
                                    Seamless Texture Library
                                </a>
                            </span>
                            <span className="description">
                                - Marble, Granite, and Rust Goban Textures
                            </span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="fr" />
                            </span>
                            <span className="name">
                                <a href="https://github.com/ornicar/lila/tree/master/public/sound">
                                    Lichess - Effects
                                </a>
                            </span>
                        </div>

                        <div>
                            <span className="flags">
                                <Flag country="ar" />
                            </span>
                            <span className="name">
                                <a href="https://online-go.com/player/784/mlopezviedma">
                                    Mariano López Minnucci
                                </a>
                            </span>
                        </div>
                        <div>
                            <span className="flags">
                                <Flag country="us" />
                            </span>
                            <span className="name">
                                <a href="https://online-go.com/player/1/anoek">Akita Noek</a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
