"use strict";

const fs                = require('fs');
const XGettext          = require('xgettext-js');
const SourceMapConsumer = require('source-map').SourceMapConsumer;
const PO                = require('pofile');

main();


function pseudo_translate(str) {
    return `[${str}]`
    /*
    let AZ = "ȦƁƇḒḖƑƓĦĪĴĶĿḾȠǾƤɊŘŞŦŬṼẆẊẎẐ";
    let az = "ȧƀƈḓḗƒɠħīĵķŀḿƞǿƥɋřşŧŭṽẇẋẏẑ";

    let a = "a".charCodeAt(0);
    let z = "z".charCodeAt(0);
    let A = "A".charCodeAt(0);
    let Z = "Z".charCodeAt(0);

    let ret = "";
    for (let i=0; i < str.length; ++i) {
        let char_code = str.charCodeAt(i);
        if (char_code >= a && char_code <= z) {
            ret += az[char_code-a];
        } else if (char_code >= a && char_code <= z) {
            ret += AZ[char_code-A];
        } else {
            ret += str[i];
        }
    }

    return ret;
    */
}


function main() {
    fs.readFile('./build/ogs.strings.js.map', "utf-8", (err,sourcemap_text) => {
        let sourcemap = new SourceMapConsumer(JSON.parse(sourcemap_text));

        fs.readFile('./build/ogs.strings.js', "utf-8", (err,data) => {
            if (err) {
                console.err(err);
                return;
            }

            function prep(match) {
                let ret = {
                    line: match.line,
                    column: match.column,
                    source: sourcemap.originalPositionFor({
                        line: match.line,
                        column: match.column,
                    })
                }
                if (match.comment) {
                    ret.comment = match.comment
                }
                return ret;
            }

            function noctxt(match) {
                let ret = prep(match);
                ret.msgid = match.arguments[0].value;
                if ( match.arguments.length > 1) {
                    ret.msgid_plural = match.arguments[1].value
                }
                return ret;
            }

            function ctxt(match) {
                let ret = prep(match);
                ret.msgctxt = match.arguments[0].value;
                ret.msgid = match.arguments[1].value;
                if ( match.arguments.length > 2) {
                    ret.msgid_plural = match.arguments[2].value
                }
                return ret;
            }


            let source = data;
            let parser = new XGettext({
                keywords: {
                    '_': noctxt,
                    'gettext': noctxt,
                    'ngettext': noctxt,
                    'pgettext': ctxt,
                    'npgettext': ctxt,
                },
            });

            PO.load('../../ogs/ogs/go_app/locale/django.pot', (err, po) => {
                if (err) {
                    console.error(err);
                    return;
                }
                let po_items = {};
                let ui_only_keys = {};
                for (let item of po.items) {
                    let key = item.msgctxt ? item.msgctxt + '\x04' : '';
                    key += item.msgid;
                    if (item.msgid_plural) {
                        key += '\x05' + item.msgid_plural;
                    }
                    item.extractedCommentsHash = {};
                    po_items[key] = item;
                }


                for (let m of parser.getMatches( source )) {
                    if (m.msgid == "") {
                        console.log(m);
                        continue;
                    }
                    if (!m.msgid) {
                        /* this happens when a translation function is called with a non-string parameter */
                        continue;
                    }

                    let key = m.msgctxt ? m.msgctxt + '\x04' : '';
                    key += m.msgid;
                    if (m.msgid_plural) {
                        key += '\x05' + m.msgid_plural;
                    }

                    ui_only_keys[key] = 1;

                    if (!(key in po_items)) {
                        po_items[key] = new PO.Item();
                        po_items[key].extractedCommentsHash = {};
                        po.items.push(po_items[key]);
                    }
                    let item = po_items[key];

                    item.msgctxt = m.msgctxt || null;
                    item.msgid = m.msgid;
                    item.msgid_plural = m.msgid_plural || null;
                    item.references.push(m.source.source.replace(/^.*\/src\/(.*)$/, '$1') + ':' + m.source.line);

                    if (m.comment && !(m.comment in item.extractedCommentsHash)) {
                        item.extractedCommentsHash[m.comment] = m.comment;
                        item.extractedComments.push(m.comment);
                    }
                }

                fs.writeFile('build/ogs-ui-keys.json', JSON.stringify(ui_only_keys), ()=>console.log('build/ogs-ui-keys.json written'));
                po.save('build/ogs.pot', () => { console.info('Wrote ogs.pot!')} );

                for (let item of po.items) {
                    if (!item.msgid) {
                        console.error('')
                        console.error('')
                        console.error('SOURCE ERROR')
                        console.error(item);
                        console.error('')
                        console.error('')
                        continue;
                    }
                }

                for (let item of po.items) {
                    if (!item.msgid) {
                        continue;
                    }
                    item.msgstr[0] = item.msgid;
                    if (item.msgid_plural) {
                        item.msgstr[1] = item.msgid_plural;
                    }
                }

                po.save('locale/en.po', () => {
                    console.info('Wrote locale_en.po!');
                });


                for (let item of po.items) {
                    if (!item.msgid) {
                        continue;
                    }
                    item.msgstr[0] = pseudo_translate(item.msgid);
                    if (item.msgid_plural) {
                        item.msgstr[1] = pseudo_translate(item.msgid_plural);
                    }
                }

                po.save('locale/debug.po', () => {
                    console.info('Wrote locale_debug.po!');
                });
            });
        });
    });
}

