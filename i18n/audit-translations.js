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
    let promises = [];
    let progress = {};

    for (let lang in languages) {
        let conv = lang.replace(/([a-z]+)-([a-zA-Z]+)/, (_, a, b)=>`${a}_${b.toUpperCase()}`);
        promises.push(new Promise((resolve, reject) => {
            PO.load(`./locale/${conv}.po`, (err, po) => {
                if (err) {
                    console.log(`${err}`);
                    return;
                }

                let result = {};
                let missing = 0;
                let errors = 0;
                for (let item of po.items) {
                    for (let str of [item.msgid, item.msgid_plural]) {
                        if (!str) {
                            continue;
                        }

                        let label_replacements = str.match(/([{][{][a-zA-Z_]+[}][}])/g)
                        let num_percent_s = str.match(/%[sd]/g) ? str.match(/%[sd]/g).length : 0

                        for (let msg of item.msgstr) {
                            if (msg.trim() === "") {
                                missing++;
                                break;
                            }

                            let m = msg.match(/%[sd]/g);
                            if (num_percent_s != (m ? m.length : 0)) {
                                console.log(`${conv}.po: %s mismatch: ${str} -> ${msg}`);
                                errors++;
                            }

                            if (label_replacements) {
                                for (let replacement of label_replacements) {
                                    if (msg.indexOf(replacement) < 0) {
                                        console.log(`${conv}.po: label replacement for ${replacement} missing: ${str} -> ${msg}`);
                                        errors++;
                                    }
                                }
                            }


                        }
                    }
                }

                if (errors > 0) {
                    console.log(`** BAD ** ${lang}: ${missing} missing ${errors} errors`);
                    exit_code = 1;
                } else if (missing > 0) {
                    console.log(`MISSING ${lang}: ${missing} missing`);
                } else {
                    console.log(`GOOD ${lang}`);
                }

                progress[lang] = missing; 

                resolve();
            });
        }));
    }

    Promise.all(promises).then(() => {
        fs.writeFile('./locale/translation_progress.json', JSON.stringify(progress), () => {
            process.exit(exit_code);
        });
    })
    
    });
    });
    });


}
