"use strict";

const fs                = require('fs');
const PO                = require('pofile');

main();


function main() {
    fs.readFile('./build/countries.json', "utf-8", (err,countries) => {
    fs.readFile('./build/ogs-ui-keys.json', "utf-8", (err,ui_keys) => {
    fs.readFile('./languages.json', "utf-8", (err,languages) => { 

    countries = JSON.parse(countries);
    ui_keys = JSON.parse(ui_keys);
    languages = JSON.parse(languages);
    let exit_code = 0;
    let audit_promises = [];
    let write_promises = [];
    let progress = {};
    let vandalized_languages = {};

    for (let lang in languages) {
        let conv = lang.replace(/([a-z]+)-([a-zA-Z]+)/, (_, a, b)=>`${a}_${b.toUpperCase()}`);
        audit_promises.push(new Promise((resolve, reject) => {
            PO.load(`./locale/${conv}.po`, (err, po) => {
                if (err) {
                    console.log(`${err}`);
                    return;
                }

                let result = {};
                let missing = 0;
                let missing_strings = [];
                let errors = 0;
                let vandalizations = 0;
                for (let item of po.items) {
                    if (item.obsolete) {
                        continue;
                    }

                    for (let str of [item.msgid, item.msgid_plural]) {
                        if (!str) {
                            continue;
                        }

                        let label_replacements = str.match(/([{][{][a-zA-Z_]+[}][}])/g)
                        let num_percent_s = str.match(/%[sd]/g) ? str.match(/%[sd]/g).length : 0

                        for (let msg of item.msgstr) {
                            if (msg.trim() === "") {
                                missing++;
                                missing_strings.push(str);
                                break;
                            }

                            if (looks_vandalized(lang, msg)) {
                                console.log(`${conv}.po: vandalization: ${str} -> ${msg}`);
                                vandalized_languages[lang] = ++vandalizations;
                            }

                            let m = msg.match(/%[sd]/g);
                            if (num_percent_s != (m ? m.length : 0)) {
                                console.log(`${conv}.po: %s mismatch: ${str} -> ${msg}`);
                                errors++;
                            }

                            if (label_replacements) {
                                for (let replacement of label_replacements) {
                                    if (replacement === "{{num}}" && msg.indexOf('{{') < 0) {
                                        // {{num}} point often goes to "1" in the case where num == 1, this is a fine translation
                                        // so allow this, but if we see any {{ in the string then it's probably likely that the
                                        // translator actually translated "num", which is a problem.
                                        continue;
                                    }
                                    if (msg.indexOf(replacement) < 0) {
                                        console.log(`${conv}.po: label replacement for ${replacement} missing: ${str} -> ${msg}`);
                                        errors++;
                                    }
                                }
                            }


                        }
                    }
                }

                if (vandalizations > 0) {
                    console.log(`*** VANDALIZED *** ${vandalizations} vandalizations`);
                } else if (errors > 0) {
                    console.log(`** BAD ** ${lang}: ${missing} missing ${errors} errors`);
                    //exit_code = 1;
                } else if (missing > 0) {
                    console.log(`MISSING ${lang}: ${missing} missing`);
                    if (missing < 10) {
                        for (let str of missing_strings) {
                            console.log(`    ${str}`);
                        }
                    }
                } else {
                    console.log(`GOOD ${lang}`);
                }


                progress[lang] = missing; 

                if (vandalizations === 0) {

                    write_promises.push(new Promise((resolve, reject) => {
                        fs.readFile(`./locale/${lang}.js`, 'utf8', (err, data) => {
                            if (/ogs_missing_translation_count/.test(data)) {
                                data.replace(/ogs_missing_translation_count = [0-9]+/, `ogs_missing_translation_count = ${missing}`);
                            } else {
                                data += `window.ogs_missing_translation_count = ${missing};`;
                            }
                            fs.writeFile(`./locale/${lang}.js`, data, resolve);
                        })
                    }));
                }

                resolve();
            });
        }));
    }





    Promise.all(audit_promises).then(() => {
        Promise.all(write_promises).then(() => {
            fs.writeFile('./locale/translation_progress.json', JSON.stringify(progress), () => {

                if (Object.keys(vandalized_languages).length > 0) {
                    console.error(`Critical error: ${Object.keys(vandalized_languages).length} languages have been vandalized`);
                    console.error(JSON.stringify(vandalized_languages, undefined, 4));
                    process.exit(1);
                }

                process.exit(exit_code);
            });
        }).catch((err) => console.error(err));
    }).catch((err) => console.error(err));
    
    });
    });
    });
}

function encode(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/.{76}(?=.)/g,'$&');
}

function decode(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

let bad_symbols = decode(
    'WyLljZAiLCLikrYiLCLimK0iLCLinK8iLCLimK4iLCLinKEiLCLljY0iLCLgv5UiLCLgv5YiLCLi' +
    'nJkiLCLgv5ciLCLgv5giLCLqlqYiLCLwn4+0Iiwi4ZuL4ZuLIl0='
);

let profanity_regex = {};

let profanity_dictionary = decode(
    'eyJlbiI6WyJuaWdnZXIiLCJjdWNrIiwiZnVjayIsInNoaXQiLCJuYXppIiwiMTQ4OCIsImhpdGxl' +
    'ciIsInN0cmFpZ2h0IHByaWRlIiwiZ2F5IHByaWRlIiwiZ2F5IiwiZ2F5cyJdfQ=='
);


for (let lang in profanity_dictionary) {
console.log("(" + profanity_dictionary[lang].map(s => "\\b" + s + "\\b").join("|") + ")");
    profanity_regex[lang] = new RegExp(
        "(" + profanity_dictionary[lang].map(s => "\\b" + s + "\\b").join("|") + ")"
        , "gui"
    );
}

function looks_vandalized(lang, msg) {
    if (detect_profanity("en", msg)) {
        console.error("en Profanity detected");
        return true;
    }
    if (detect_profanity(lang, msg)) {
        console.error(lang, " Profanity detected");
        return true;
    }

    let lower = msg.toLowerCase();

    for (let entry of bad_symbols) {
        if (lower.indexOf(entry) >= 0) {
            return true;
        }
    }

    return false
}

function detect_profanity(lang, msg) {
    if (lang in profanity_regex) {
        return profanity_regex[lang].test(msg);
    }

    return false;
}
