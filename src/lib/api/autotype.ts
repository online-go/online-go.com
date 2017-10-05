/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
    USAGE:

    This code is designed to *assist* in the creation of some interface specifications
    for our backend API. This system works by inspecting request and responses rest calls
    and generating rough typescript interface code based on the data sent and received

    This is obviously far from foolproof and complete, it's meant help provide the bulk
    of the type definitions for some easy copy pasting with the assumption that they'll
    be cleaned up by the developer before being used in a serious way.

    To use this, simply change the ENABLE_AUTOTYPING to true, set a prefix you wish to
    work with, and use the UI in a way that the requests desired are made. The generated
    code will be logged to the console once per url/method type.
*/

const ENABLE_AUTOTYPING = false;
const AUTOTYPING_PREFIX = 'ui';



function isPlayerObject(obj) {
    if ('username' in obj) {
        return true;
    }
    return false;
}

function obj_to_typescript_interface(obj) {
    if (obj === undefined) {
        return 'never';
    }

    if (obj === null) {
        return 'any';
    }

    switch (typeof(obj)) {
        case 'string':
        case 'number':
        case 'boolean':
            return typeof(obj);

        case 'object':
            if (Array.isArray(obj)) {
                if (obj.length === 0) {
                    return 'Array<any>';
                } else {
                    return 'Array<' + obj_to_typescript_interface(obj[0]) + '>';
                }
            } else {
                if (isPlayerObject(obj)) {
                    return 'Player';
                }

                let all_numeric_keys = null;
                let first_k = null;
                for (let k in obj) {
                    if (!(/^[0-9]+$/.test(k))) {
                        all_numeric_keys = false;
                    } else {
                        if (all_numeric_keys === null) {
                            first_k = k;
                            all_numeric_keys = true;
                        }
                    }
                }

                let ret = '{\n';
                if (all_numeric_keys) {
                    ret += '[id:number]: ' + obj_to_typescript_interface(obj[first_k]) + ';\n';
                } else {
                    for (let k in obj) {
                        if (/^[a-zA-Z_0-9]+$/.test(k)) {
                            ret += k;
                        } else {
                            ret += `'${k}'`;
                        }

                        ret += ': ' + obj_to_typescript_interface(obj[k]) + ';\n';
                    }
                }
                ret += '}';

                return ret;
            }

        case 'undefined':
        case 'symbol':
        case 'function':
            throw new Error(`Unexpected object type in auto-typer: ${typeof(obj)}`);
    }


}

function camelize(str) {
    str = str.replace(/%%$/g, 'Detail');
    str = str.replace(/[^a-zA-Z0-9]/g, ' ');
    str = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase()).replace(/\s+/g, '');
    return str;
}

let complete = {
    'MeBlocks_GET': true,
    'MeSupporter_GET': true,
    'MePurchaseTransactions_GET': true,
    'MeChallenges_GET': true,
    'MeTournaments_GET': true,
    'MeLadders_GET': true,
    'MeGroups_GET': true,
    'MeGroupsInvitations_GET': true,
};
let done = { };


export function autotype(method:string, url:string, what: 'request'|'response'|'event'|'error', obj:any) {
    if (!ENABLE_AUTOTYPING) {
        return;
    }

    if (!url.startsWith(AUTOTYPING_PREFIX)) {
        return;
    }

    if (what === 'request') {
        let reqres_name = camelize(url) + '_' +  method.toUpperCase();
        if (reqres_name in complete) {
            return;
        }
    }

    let interface_name = camelize(url) + '_' +  method.toUpperCase() + '_' + camelize(what);

    if (interface_name in done) {
        return;
    }
    done[interface_name] = true;

    console.log(`export interface ${interface_name} ${obj_to_typescript_interface(obj)}`);

    if (what === 'request') {
        let reqres_name = camelize(url) + '_' +  method.toUpperCase();

        if (reqres_name in done) {
            return;
        }

        console.log(`export interface ${reqres_name} {\n request: ${reqres_name}_Request;\n response: ${reqres_name}_Response;\n }`);
    }
}
