/*
 * Copyright (C) 2012-2021  Online-Go.com
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
import {_} from 'translate';
import {Modal, openModal} from "Modal";
import * as data from "data";

interface Events {
}

interface MergeReportLine {
    info?: string;
    warn?: string;
    error?: string;
}

interface MergeReportModalProperties {
    report: Array<MergeReportLine>;
}

export class MergeReportModal extends Modal<Events, MergeReportModalProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
          <div className="Modal MergeReportModal" ref="modal">
              <div className="body">
                <div className='lines'>
                    {this.props.report.map((e, idx) => {
                        let cls = 'error' in e ? 'error' : ('warn' in e ? 'warn' : 'info');
                        let msg = e[cls];

                        return (<div key={idx} className={`line merge-${cls}`}><span className='fixed'>{idx + 1}</span>{msg}</div>);
                    })}
                </div>
              </div>
              <div className="buttons">
                <button onClick={this.close}>{_("Close")}</button>
              </div>
          </div>
        );
    }
}

export function openMergeReportModal(report: Array<MergeReportLine>) {
    return openModal(<MergeReportModal report={report} />);
}
