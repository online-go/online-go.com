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
import {_, pgettext, interpolate} from 'translate';
import {Modal, openModal} from "Modal";

declare let swal;

interface Events {
}

interface ErrcodeModalProperties {
    errcode: string;
    errobj?: any;
}

export class ErrcodeModal extends Modal<Events, ErrcodeModalProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        let header = null;
        let body = null;

        switch (this.props.errcode) {
            case 'ai_review_must_be_site_supporter':
                body = <div>{_("To begin an AI review, you must be a site supporter.")}</div>;
                break;

            case 'ai_review_must_be_player':
                body = <div>{_("To begin an AI review, you must be a player in the game.")}</div>;
                break;

            case 'ai_review_queue_full':
                header = <i className='fa fa-clock-o' />;
                body = <div>{_("Please wait until your current reviews are completed before requesting more.")}</div>;
                break;


            case 'test':
                body = <div>This is a test</div>;
                break;
        }

        return (
          <div className="Modal ErrcodeModal" ref="modal">
              {header &&
                  <div className="header">
                      {header}
                  </div>
              }
              <div className="body">
                  {body}
              </div>
              <div className="buttons">
                  <button className='primary' onClick={this.close}>{_("OK")}</button>
              </div>
          </div>
        );
    }
}


export function errcodeAlerter(errobj:{errcode:string}):void {
    openModal(<ErrcodeModal errcode={errobj.errcode} errobj={errobj} />);
}
