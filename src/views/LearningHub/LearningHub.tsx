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
import * as data from "data";
import {Link} from "react-router-dom";
import {Card, CardLink} from "material";
import {_, pgettext, interpolate} from "translate";
import {LearningHubSection} from './LearningHubSection';
import {sections, allsections} from './sections';
import {Ribbon} from 'misc-ui';
import {getSectionCompletion} from './util';
import {ignore, errorAlerter, getPrintableError} from "misc";
import {browserHistory} from "ogsHistory";

declare var swal;

interface LearningHubProperties {
    match: {
        params: {
            section: string;
            page: number;
        }
    };
}

export class LearningHub extends React.PureComponent<LearningHubProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        let section = this._render();

        if (section) {
            return (
                <div id='LearningHub'>
                    <SectionNav />
                    {section}
                </div>
            );
        } else {
            return <div id='LearningHub'> <Index /> </div>;
        }
    }
    _render() {
        let section_name = (this.props.match.params.section || "index").toLowerCase();
        let section;
        let next_section_name = '';

        for (let i = 0; i < allsections.length; ++i) {
            if (allsections[i].section() === section_name) {
                section = allsections[i];
                if (i + 1 < allsections.length) {
                    next_section_name = allsections[i + 1].section();
                }
            }
        }

        if (section) {
            let S = section;
            return <S
                page={this.props.match.params.page}
                nextSection={next_section_name}
                section={S.section()}
                title={S.title()}
                pages={S.pages()}
            />;
        }

        return null;
    }
}

class Index extends React.PureComponent<{}, any>  {
    constructor(props) {
        super(props);
    }

    render() {
        const progress = 9;
        return (
            <div id='LearningHub-Index'>

            <div id='LearningHub-list'>
                {sections.map((arr) =>
                    <div key={arr[0]} className='section'>
                        <h2>{arr[0]}</h2>
                        {arr[1].map((S) => {
                            let className = getSectionClassName(S.section());
                            return (
                                <CardLink key={S.section()}
                                    className={className + ' Ribboned'} to={`/learning-hub/${S.section()}`}>
                                    <img src='' />
                                    <div>
                                        <h1>{S.title()}</h1>
                                        <h3>{S.subtext()}</h3>
                                    </div>
                                    {className !== 'todo' ? <Ribbon>{this.ribbonText(S.section())}</Ribbon> : null}
                                </CardLink>
                            );
                        })}
                    </div>
                )}

                <div className='section'>
                    <h2>{pgettext("Tutorial - what's next after learning the game?", "What's next?")}</h2>
                    <CardLink className={'done'} to={`/register`}>
                        <img src='' />
                        <div>
                            <h1>{pgettext("Sign up for an account", "Register")}</h1>
                            <h3>{_("Get a free Online-Go account")}</h3>
                        </div>
                    </CardLink>

                    <CardLink className={'done'} to={`/puzzles`}>
                        <img src='' />
                        <div>
                            <h1>{pgettext("Practice go by playing puzzles", "Puzzles")}</h1>
                            <h3>{_("Practice by solving Go puzzles")}</h3>
                        </div>
                    </CardLink>

                    <CardLink className={'done'} to={`/play`}>
                        <img src='' />
                        <div>
                            <h1>{_("Play people")}</h1>
                            <h3>{_("Play people from around the world")}</h3>
                        </div>
                    </CardLink>

                    <CardLink className={'done'} to={`/play`}>
                        <img src='' />
                        <div>
                            <h1>{_("Play machine")}</h1>
                            <h3>{_("Play against the computer")}</h3>
                        </div>
                    </CardLink>
                </div>
            </div>

            </div>
        );
    }

    ribbonText(section_name:string) {
        let sc = getSectionCompletion(section_name);
        if (sc.completed) {
            return (
                <span>
                    <i className='fa fa-star' />
                    <i className='fa fa-star' />
                    <i className='fa fa-star' />
                </span>
            );
        }
        if (sc.started) {
            return (
                <span>
                    {sc.finished} / {sc.total}
                </span>
            );
        }

        return <span>{pgettext("Play a tutorial section", "play!")}</span>;
    }
}


class SectionNav extends React.Component<{}, any>  {
    constructor(props) {
        super(props);
    }

    render() {
        let pathname = window.location.pathname;
        let m = window.location.pathname.match(/\/learning-hub(\/([^\/]+))?(\/([0-9]+))?/);
        let section_name = (m && m[2]) || "";
        let page = (m && m[4]) || 0;

        return (
            <div className='LearningHub-section-nav'>
                <Link to='/learning-hub/'><i className='fa fa-graduation-cap'/> {pgettext("Learning hub menu", "Menu")}</Link>

                {sections.map((arr) =>
                    <div key={arr[0]} className='section'>
                        <Link to={`/learning-hub/${arr[1][0].section()}`}><h2>{arr[0]}</h2></Link>
                        {arr[1].reduce((acc, v) => acc + (v.section() === section_name ? 1 : 0), 0) ? // is our active section?
                            arr[1].map((S) => {
                            return (
                                <Link key={S.section()}
                                    className={S.section() === section_name ? 'active' : ''}
                                    to={`/learning-hub/${S.section()}`}
                                >
                                    {S.title()}
                                {this.getProgressText(S.section())}
                                </Link>
                            );
                        }) : null}
                    </div>
                )}

                <span className='reset-progress' onClick={this.resetProgress}>
                    {pgettext("Reset learning hub progress", "Reset progress")}
                </span>
            </div>
        );
    }

    resetProgress = () => {
        swal({text: _("Are you sure you wish to reset your tutorial progress?"), showCancelButton: true})
        .then(() => {
            console.log("Removing");
            data.removePrefix("learning-hub.");
            browserHistory.push('/learning-hub');
        })
        .catch(ignore);

    }

    getProgressText(section_name:string) {
        let sc = getSectionCompletion(section_name);

        if (sc.completed) {
            return (
                <span className='progress-text'><i className='fa fa-star' /></span>
            );
        }
        if (sc.started) {
            return (
                <span className='progress-text'>{sc.finished} / {sc.total}</span>
            );
        }

        return null;
    }
}

function getSectionClassName(section_name:string):string {
    let sc = getSectionCompletion(section_name);
    if (sc.completed) {
        return 'done';
    }
    if (sc.started) {
        return 'next';
    }
    if (sc.first) {
        return 'next';
    }
    return 'todo';
}
