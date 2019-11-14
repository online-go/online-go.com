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
import {Card, FabX, FabCheck, FabAdd } from "material";
import {Link} from "react-router-dom";
import {Ribbon} from "misc-ui";
import {Player} from "Player";
import {PlayerIcon} from "PlayerIcon";
import {toast} from "toast";
import {VoiceChat} from "VoiceChat";
import * as Datetime from "react-datetime";
import {StarRating} from "StarRating";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import {GroupAutocomplete} from "GroupAutocomplete";
import {Markdown} from "Markdown";
import {PersistentElement} from "PersistentElement";
import {Steps} from "Steps";
import {errcodeAlerter} from "ErrcodeModal";
import * as moment from "moment";

declare var swal;

export class Styling extends React.PureComponent<{}, any> {
    ccinput = null;

    constructor(props) {
        super(props);
        this.state = {
            star_ratings: [ 0, 0.1, 0.5, 1.0, 1.1,  1.6, 2.0, 2.7, 3.0, 3.8, 4.1, 4.7, 5, 6 ],
            autocompleted_player: null,
            autocompleted_group: null,
            markdown_source: "## hello\n* world\n* from\n\nhere",
            selected_step: 0,

            slider_num_value: 50,
            slider_num_min: 0,
            slider_num_max: 200,
            slider_date_value: moment("20180601", "YYYYMMDD").toDate(),
            slider_date_min: moment("20180101", "YYYYMMDD").toDate(),
            slider_date_max: moment("20190101", "YYYYMMDD").toDate(),
        };
    }

    setStarRating(idx, v) {
        let cpy = this.state.star_ratings.slice();
        cpy[idx] = v;
        this.setState({star_ratings: cpy});
    }

    updateAutocompletedPlayer = (user) => {
        this.setState({autocompleted_player: user});
    }
    updateAutocompletedGroup = (group) => {
        this.setState({autocompleted_group: group});
    }

    setMarkdown = (ev) => {
        this.setState({markdown_source: ev.target.value});
    }

    render() { return (
    <div className="Styling container">
        <div className="row">
            <div className="col-xs-5">
                <Steps completed={3} selected={2} total={6}/>

                <Steps completed={1} selected={1} total={1}>
                    <span title="single"/>
                </Steps>

                <Steps completed={this.state.selected_step} selected={this.state.selected_step} onChange={(idx) => this.setState({selected_step: idx})}>
                    <span title="first"/>
                    <span/>
                    <span/>
                </Steps>

                <Steps selected={1} completed={1} minWidth="10rem">
                    <span title="first">Hello</span>
                    <span title="second">World</span>
                    <div title="third">
                        <div>And the world was bright and shiny</div>
                        <button onClick={() => errcodeAlerter({"errcode": "test"})}>Errcode test</button>
                    </div>
                </Steps>
            </div>
            <div className="col-xs-3">
                <Card>
                    <PlayerAutocomplete onComplete={this.updateAutocompletedPlayer} />
                    <div>
                    {this.state.autocompleted_player && <Player icon user={this.state.autocompleted_player} />}
                    </div>

                    <GroupAutocomplete onComplete={this.updateAutocompletedGroup} />
                    <div>
                    {this.state.autocompleted_group && <div>{this.state.autocompleted_group.name}</div>}
                    </div>
                </Card>
            </div>
        </div>
        <div className="row">
            <div className="col-xs-6">
                <Card>
                    <textarea rows={10} style={{width: "100%"}} value={this.state.markdown_source} onChange={this.setMarkdown} />
                </Card>
            </div>
            <div className="col-xs-6">
                <Card>
                    <Markdown source={this.state.markdown_source} />
                </Card>
            </div>
        </div>
        <div className="row">
            <div className="col-xs-6">
                <Card>
                    <dl className="horizontal">
                        <dt>Hello</dt>
                        <dd>World</dd>
                        <dt>Checkbox</dt>
                        <dd><input type="checkbox"/></dd>
                        <dt>Input</dt>
                        <dd><input type="text"/></dd>
                        <dt>Input</dt>
                        <dd><input type="text"/></dd>
                        <dt>Hello two and three four</dt>
                        <dd>World 2</dd>
                        <dt>Checkbox</dt>
                        <dd><input type="checkbox"/></dd>
                    </dl>
                </Card>
            </div>
            <div className="col-xs-3">
                <Card>
                    <div className="bg-shade0">Shade 0</div>
                    <div className="bg-shade1">Shade 1</div>
                    <div className="bg-shade2">Shade 2</div>
                    <div className="bg-shade3">Shade 3</div>
                    <div className="bg-shade4">Shade 4</div>
                    <div className="bg-shade5">Shade 5</div>

                    <div className="fg-shade0">Shade 0</div>
                    <div className="fg-shade1">Shade 1</div>
                    <div className="fg-shade2">Shade 2</div>
                    <div className="fg-shade3">Shade 3</div>
                    <div className="fg-shade4">Shade 4</div>
                    <div className="fg-shade5">Shade 5</div>
                </Card>
            </div>
            <div className="col-xs-3">
                <div style={{paddingTop: "1em"}}/>
                <div className="bg-shade0">Shade 0</div>
                <div className="bg-shade1">Shade 1</div>
                <div className="bg-shade2">Shade 2</div>
                <div className="bg-shade3">Shade 3</div>
                <div className="bg-shade4">Shade 4</div>
                <div className="bg-shade5">Shade 5</div>

                <div className="fg-shade0">Shade 0</div>
                <div className="fg-shade1">Shade 1</div>
                <div className="fg-shade2">Shade 2</div>
                <div className="fg-shade3">Shade 3</div>
                <div className="fg-shade4">Shade 4</div>
                <div className="fg-shade5">Shade 5</div>
            </div>
        </div>
        <div className="row">
            <div className="col-xs-6">
                <div>
                    <button>Default</button>
                    <button className="primary">Primary</button>
                    <button className="danger">Danger</button>
                    <button className="success">Success</button>
                    <button className="info">Info</button>
                    <button className="reject">Reject</button>
                </div>
                <div>
                    <button disabled>Default</button>
                    <button disabled className="primary">Primary</button>
                    <button disabled className="danger">Danger</button>
                    <button disabled className="success">Success</button>
                    <button disabled className="info">Info</button>
                    <button disabled className="reject">Reject</button>
                </div>
                <div>
                    <button className="active">Active</button>
                    <button className="primary active">Active</button>
                    <button className="danger active">Active</button>
                    <button className="success active">Active</button>
                    <button className="info active">Active</button>
                    <button className="reject active">Active</button>
                </div>
                <Card>
                    <div>
                        <button>Default</button>
                        <a className="btn">Default A</a>
                        <button className="primary">Primary</button>
                        <a className="btn primary">Primary A</a>
                        <button className="danger">Danger</button>
                        <a className="btn danger">Danger A</a>
                        <button className="success">Success</button>
                        <a className="btn success">Success A</a>
                        <button className="info">Info</button>
                        <a className="btn info">Info A</a>
                        <button className="reject">Reject</button>
                    </div>

                    <div>
                        <button className="xs">Default</button>
                        <button className="xs primary">Primary</button>
                        <a className="xs btn primary">Primary A</a>
                        <button className="xs danger">Danger</button>
                        <a className="xs btn danger">Danger A</a>
                        <button className="xs success">Success</button>
                        <a className="xs btn success">Success A</a>
                        <button className="xs info">Info</button>
                        <a className="xs btn info">Info A</a>
                    </div>

                    <div className="btn-group">
                        <button className="xs">A</button>
                        <button className="xs primary active">B</button>
                        <a className="xs btn primary">C</a>
                        <button className="xs danger">D</button>
                    </div>

                    <br/>

                    <div className="btn-toolbar">
                        <div className="btn-group">
                            <button className="xs">A</button>
                        </div>
                        <div className="btn-group">
                            <button className="xs">A</button>
                            <button className="xs primary">B</button>
                        </div>
                        <div className="btn-group">
                            <button className="xs">A</button>
                            <button className="xs primary">B</button>
                            <a className="xs btn primary">C</a>
                        </div>
                    </div>

                    <div className="btn-toolbar flex">
                        <div className="btn-group">
                            <button className="xs">A</button>
                        </div>
                        <div className="btn-group">
                            <button className="xs">A</button>
                            <button className="xs primary">B</button>
                        </div>
                        <div className="btn-group">
                            <button className="xs">A</button>
                            <button className="xs primary">B</button>
                            <a className="xs btn primary">C</a>
                        </div>
                    </div>
                    <div className="btn-toolbar flex">
                        <div className="btn-group">
                            <button className="sm">A</button>
                        </div>
                        <div className="btn-group">
                            <button className="sm">A</button>
                            <button className="sm primary">B</button>
                        </div>
                        <div className="btn-group">
                            <button className="sm">A</button>
                            <button className="sm primary">B</button>
                            <a className="sm btn primary">C</a>
                        </div>
                    </div>
                    <div className="btn-toolbar flex">
                        <div className="btn-group">
                            <button className="">A</button>
                        </div>
                        <div className="btn-group">
                            <button className="">A</button>
                            <button className=" primary">B</button>
                        </div>
                        <div className="btn-group">
                            <button className="primary">A</button>
                            <button className="success">B</button>
                            <button className="info">B</button>
                            <button className="danger">B</button>
                            <button className="reject">B</button>
                            <button className="warning">B</button>
                            <button className="warning">B</button>
                        </div>
                    </div>
                </Card>
                <div className="well">
                    Well contents<br/>
                    Well contents<br/>
                    Well contents<br/>
                    Well contents<br/>
                </div>
            </div>
            <div className="col-xs-6">
                <Card>
                    <div>
                        <select>
                            <option>Option 1</option>
                            <option>Option 2</option>
                            <option>Option 3</option>
                        </select>
                    </div>
                    <div>
                        <input type="text" placeholder="text"/>
                        <input type="number" placeholder="number"/>
                        <input type="email" placeholder="email"/>

                        <input type="date" placeholder="Date"/>
                        <input type="datetime-local" placeholder="Date Time"/>
                        <Datetime onChange={(time) => console.log(time)} />
                    </div>
                </Card>
                <Card>
                    <FabX />
                    <FabAdd />
                    <FabCheck />
                </Card>
                <Card>
                    <button onClick={smalltoast}>Small toast</button>
                    <button onClick={bigtoast}>Large toast</button>
                    <button onClick={swal_popup}>Sweet alert</button>
                </Card>
                <Card>
                    <VoiceChat channel="test-voice-chat" hasVoice={true}/>
                </Card>
                <Card>
                    <div className="row">
                        <Card>
                            {this.state.star_ratings.map((v, idx) => (
                                <div key={idx}>
                                    <StarRating value={v} /> {v}
                                </div>
                            ))}
                        </Card>
                        <Card>
                            {this.state.star_ratings.map((v, idx) => (
                                <div key={idx}>
                                    <StarRating rated value={v} /> {v}
                                </div>
                            ))}
                        </Card>
                        <Card>
                            {this.state.star_ratings.map((v, idx) => (
                                <div key={idx}>
                                    <StarRating value={v} onChange={this.setStarRating.bind(this, idx)} /> {v}
                                </div>
                            ))}
                        </Card>
                    </div>
                </Card>
            </div>
        </div>

        <div className="row">
            <div className="col-xs-4">
                <Card>
                    <Player user={{"id": 1, "username": "anoek"}}/>
                    <PlayerIcon id={1}/>
                </Card>
                <Card>
                    <div style={{fontSize: "1.5em"}}>
                        <i className="ogs-coordinates"/>&nbsp;
                        <i className="ogs-goban"/>&nbsp;
                        <i className="ogs-japanese-coordinates"/>&nbsp;
                        <i className="ogs-label-circle"/>&nbsp;
                        <i className="ogs-label-number"/>&nbsp;
                        <i className="ogs-label-square"/>&nbsp;
                        <i className="ogs-label-triangle"/>&nbsp;
                        <i className="ogs-label-x"/>&nbsp;
                        <i className="ogs-move-number"/>&nbsp;
                        <i className="ogs-turtle" />
                    </div>
                </Card>
            </div>
            <div className="col-xs-8">
                <Card>
                    <h2>Progress Bars</h2>

                    <div className="progress">
                        <div className="progress-bar success" style={{width: "30%"}}>30</div>
                        <div className="progress-bar primary" style={{width: "30%"}}>30</div>
                        <div className="progress-bar info" style={{width: "40%"}}>40</div>
                    </div>

                    <div className="progress">
                        <div className="progress-bar success" style={{width: "10%"}}>10</div>
                        <div className="progress-bar primary" style={{width: "15%"}}>15</div>
                        <div className="progress-bar info" style={{width: "20%"}}>20</div>
                    </div>

                    <div className="progress">
                        <div className="progress-bar success" style={{width: "30%"}}>30</div>
                    </div>
                    <div className="progress">
                        <div className="progress-bar primary" style={{width: "50%"}}>50</div>
                    </div>
                    <div className="progress">
                        <div className="progress-bar info" style={{width: "70%"}}>70</div>
                    </div>
                </Card>
            </div>
        </div>


        <Card>
            <h1>H1 - Some big fat text</h1>
            <h2>H2 - Some big fat text</h2>
            <h3>H3 - Some big fat text</h3>
            <h4>H4 - Some big fat text</h4>
            <h5>H5 - Some big fat text</h5>
            <hr/>
            <p>Pargraph block</p>
            <div>Normal text</div>
            <div><Link to='/styling'>Link text</Link></div>
            <code>Code block</code>
            <div className='big'>Big text</div>
            <div className='mid'>Mid text</div>
            <div className='normal'>Normal text</div>
            <div className='small'>Small text</div>
            <div className='smaller'>Smaller text</div>
            <div className='extra-small'>Extra small text</div>
        </Card>

        <div className='row'>
            <div className='col-xs-4'>
                <Card className='next h4rem Ribboned'>
                    <Ribbon>Next</Ribbon>

                </Card>
            </div>
            <div className='col-xs-4'>
                <Card className='todo h4rem Ribboned'>
                    <Ribbon>Todo</Ribbon>
                </Card>
            </div>
            <div className='col-xs-4'>
                <Card className='done h4rem Ribboned'>
                    <Ribbon>Done</Ribbon>
                </Card>
            </div>
        </div>


    </div>
    ); }
}


function smalltoast() {
    toast((<div>Hello world!</div>));
}
function bigtoast() {
    toast((
        <div>
            <h1>Big stuff</h1>
             is comming to a place near you!
             <button onClick={() => swal("HI")}> Click me </button>
         </div>
    ))
    .on("close", () => {
        console.log("Toast closed");
    });

}
function swal_popup() {
    swal({
        title: "Title here",
        text: "Some text here",
        input: "text",
        showCancelButton: true,
    });
}


