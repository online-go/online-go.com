/* 
This script is executed in two places.

The first is on our translation server in a cron job to recompute translation
strings and insert them into the pootle server for translation.

The second is during the deployment process prior to audit-translations, which
performs the automatic translation of strings.
*/

"use strict";

import fs from "fs";
import XGettext from "xgettext-js";
import { SourceMapConsumer } from "source-map";
import PO from "pofile";

const MODE = process.argv[2] || "full";

if (MODE !== "full" && MODE !== "llm-translation-extraction") {
    console.error('Invalid mode, expecting "full" or "llm-translation-extraction"');
    process.exit(1);
}

console.log("Running in mode:", MODE);

main();

function pseudo_translate(str) {
    return `[${str}]`;
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
    fs.readFile("./build/ogs.strings.js.map", "utf-8", (err, sourcemap_text) => {
        let sourcemap = new SourceMapConsumer(JSON.parse(sourcemap_text));

        fs.readFile("./build/ogs.strings.cleaned-for-xgettext.js", "utf-8", (err, data) => {
            if (err) {
                console.err(err);
                return;
            }

            function prep(match) {
                let ret = {
                    llm: false,
                    line: match.line,
                    column: match.column,
                    source: sourcemap.originalPositionFor({
                        line: match.line,
                        column: match.column,
                    }),
                };
                if (match.comment) {
                    ret.comment = match.comment;
                }
                return ret;
            }

            function noctxt(match) {
                let ret = prep(match);
                ret.msgid = match.arguments[0].value;
                if (match.arguments.length > 1) {
                    ret.msgid_plural = match.arguments[1].value;
                }
                return ret;
            }

            function ctxt(match) {
                let ret = prep(match);
                ret.msgctxt = match.arguments[0].value;
                ret.msgid = match.arguments[1].value;
                if (match.arguments.length > 2) {
                    ret.msgid_plural = match.arguments[2].value;
                }
                return ret;
            }

            function llm_ctxt(match) {
                let ret = prep(match);
                ret.llm = true;
                ret.msgctxt = match.arguments[0].value;
                ret.msgid = match.arguments[1].value;
                if (match.arguments.length > 2) {
                    ret.msgid_plural = match.arguments[2].value;
                }
                return ret;
            }

            let source = data;
            let parser = new XGettext({
                keywords: {
                    _: noctxt,
                    gettext: noctxt,
                    ngettext: noctxt,
                    pgettext: ctxt,
                    npgettext: ctxt,
                    llm_pgettext: llm_ctxt,
                },
            });

            PO.load("../../ogs/ogs/go_app/locale/django.pot", (err, po) => {
                if (err) {
                    console.error(err);
                    return;
                }
                let po_items = {};
                let ui_only_keys = {};
                let llm_keys = {};
                for (let item of po.items) {
                    let key = item.msgctxt ? item.msgctxt + "\x04" : "";
                    key += item.msgid;
                    if (item.msgid_plural) {
                        key += "\x05" + item.msgid_plural;
                    }
                    item.extractedCommentsHash = {};
                    po_items[key] = item;
                }

                for (let m of parser.getMatches(source)) {
                    //console.log(m);
                    if (m.msgid == "") {
                        console.log("Skipping blank translation");
                        console.log(m);
                        continue;
                    }
                    if (!m.msgid) {
                        /* this happens when a translation function is called with a non-string parameter */
                        continue;
                    }

                    let key = m.msgctxt ? m.msgctxt + "\x04" : "";
                    key += m.msgid;
                    if (m.msgid_plural) {
                        key += "\x05" + m.msgid_plural;
                    }

                    ui_only_keys[key] = 1;
                    if (m.llm) {
                        llm_keys[key] = {
                            msgctxt: m.msgctxt,
                            msgid: m.msgid,
                            msgid_plural: m.msgid_plural,
                        };
                        continue;
                    }

                    if (!(key in po_items)) {
                        po_items[key] = new PO.Item();
                        po_items[key].extractedCommentsHash = {};
                        po.items.push(po_items[key]);
                    }
                    let item = po_items[key];

                    item.msgctxt = m.msgctxt || null;
                    item.msgid = m.msgid;
                    item.msgid_plural = m.msgid_plural || null;
                    item.references.push(
                        m.source.source.replace(/^.*\/src\/(.*)$/, "$1") + ":" + m.source.line,
                    );

                    if (m.comment && !(m.comment in item.extractedCommentsHash)) {
                        item.extractedCommentsHash[m.comment] = m.comment;
                        item.extractedComments.push(m.comment);
                    }
                }

                fs.writeFileSync("build/llm-keys.json", JSON.stringify(llm_keys, undefined, 4));
                console.log("build/llm-keys.json written");

                if (MODE === "llm-translation-extraction") {
                    console.log("llm-translation-extraction mode complete, exiting");
                    process.exit(0);
                }

                fs.writeFile("build/ogs-ui-keys.json", JSON.stringify(ui_only_keys), () =>
                    console.log("build/ogs-ui-keys.json written"),
                );
                po.save("build/ogs.pot", () => {
                    console.info("Wrote ogs.pot!");
                });

                for (let item of po.items) {
                    if (!item.msgid) {
                        console.error("");
                        console.error("");
                        console.error("SOURCE ERROR");
                        console.error(item);
                        console.error("");
                        console.error("");
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

                po.save("locale/en.po", () => {
                    console.info("Wrote locale_en.po!");
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

                po.save("locale/debug.po", () => {
                    console.info("Wrote locale_debug.po!");
                });
            });
        });
    });
}
