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
import Slider from 'react-rangeslider';
import {Card} from 'material';
import * as moment from 'moment';


interface VerticalSliderProps {
    value: number|Date;
    min: number|Date;
    max: number|Date;
    onChange?: (value) => void;
    onChangeComplete?: (value) => void;
    valueFormat?: (value) => any;
    handleFormat?: (value) => any;
    reverse?: boolean;
}


export class VerticalSlider extends React.PureComponent<VerticalSliderProps, any> {
    constructor(props) {
        super(props);
    }

    _numOrDate(value:number|Date):number|Date {
        if (typeof(this.props.value) === "object") {
            return moment(value).toDate();
        }
        return value;
    }

    _onChange = (value) => {
        if (this.props.onChange) {
            this.props.onChange(this._numOrDate(value));
        }
    }

    _onChangeComplete = (ev) => {
        if (this.props.onChangeComplete) {
            this.props.onChangeComplete(ev);
        }
    }

    _format = (value) => {
        if (this.props.valueFormat) {
            return this.props.valueFormat(this._numOrDate(value));
        }
        if (typeof(this.props.value) === "object") {
            return moment(value).format('L');
        }
        return value + "";
    }

    _handleLabel():string {
        if (this.props.handleFormat) {
            return this.props.handleFormat(this.props.value);
        }
        if (typeof(this.props.value) === "object") {
            return moment(this.props.value).format('L');
        }
        return this.props.value + "";
    }


    render() {
        let value = this.props.value;
        let min = this.props.min;
        let max = this.props.max;
        if (typeof(value) === "object") {
            value = Math.floor(value.getTime());
        }
        if (typeof(min) === "object") {
            min = Math.floor(min.getTime());
        }
        if (typeof(max) === "object") {
            max = Math.floor(max.getTime());
        }

        return (
            <div className='VerticalSlider'>
                <Slider
                    value={value}
                    min={min}
                    max={max}
                    onChange={this._onChange}
                    onChangeComplete={this._onChangeComplete}
                    tooltip={false}
                    reverse={!this.props.reverse}
                    format={this._format}
                    handleLabel={this._handleLabel()}
                    orientation='vertical'
                    />
            </div>
        );
    }

}
