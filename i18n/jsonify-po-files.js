"use strict";

// cspell: words autotranslations conv

import fs from "fs";
import PO from "pofile";

async function main() {
    const countries = JSON.parse(await fs.promises.readFile("./build/countries.json", "utf-8"));
    const ui_keys = JSON.parse(await fs.promises.readFile("./build/ogs-ui-keys.json", "utf-8"));
    const languages = JSON.parse(await fs.promises.readFile("./languages.json", "utf-8"));
    const missing = fs.existsSync("./locale/translations_missing.json")
        ? JSON.parse(await fs.promises.readFile("./locale/translations_missing.json", "utf-8"))
        : {};
    const autotranslations = fs.existsSync("./autotranslations.json")
        ? JSON.parse(await fs.promises.readFile("./autotranslations.json", "utf-8"))
        : {};
    const llm_cache = fs.existsSync("./llm-keys-cache.json")
        ? JSON.parse(await fs.promises.readFile("./llm-keys-cache.json", "utf-8"))
        : {};
    const llm_needed = fs.existsSync("./build/llm-keys.json")
        ? JSON.parse(await fs.promises.readFile("./build/llm-keys.json", "utf-8"))
        : {};

    for (let lang in languages) {
        console.log(`Processing ${lang}`);
        let conv = lang.replace(/([a-z]+)-([a-zA-Z]+)/, (_, a, b) => `${a}_${b.toUpperCase()}`);
        const po = await asyncLoadPoFile(`./locale/${conv}.po`);

        let result = {};
        for (let item of po.items) {
            let key = item.msgctxt ? item.msgctxt + "\x04" : "";
            key += item.msgid;
            if (item.msgid_plural) {
                key += "\x05" + item.msgid_plural;
            }
            if (!(key in ui_keys)) {
                continue;
            }

            let missing = false;
            for (let msg of item.msgstr) {
                if (msg.trim() === "") {
                    missing = true;
                    break;
                }
            }

            if (missing) {
                if (!(lang in autotranslations)) {
                    autotranslations[lang] = {};
                    console.error("Missing autotranslations for " + lang);
                }
                if (item.msgid in autotranslations[lang]) {
                    result[key] = [autotranslations[lang][item.msgid]];
                } else {
                    console.log(`Missing translation for ${key}`);
                }
            }

            if (!missing) {
                result[key] = item.msgstr;
            }
        }

        if (lang in llm_cache) {
            for (let key in llm_needed) {
                if (key in llm_cache[lang]) {
                    result[key] = [llm_cache[lang][key]];
                } else {
                    console.error(`Missing LLM translation for ${key}`);
                }
            }
        }

        let json = JSON.stringify(result, undefined, 1);

        let country_map = {};
        for (let cc in countries["en"]) {
            country_map[cc] = countries["en"][cc];
        }
        let lang_countries = countries[lang] || {};
        for (var cc in lang_countries) {
            country_map[cc] = lang_countries[cc];
        }
        let country_json = JSON.stringify(country_map);

        await fs.promises.writeFile(
            `./locale/${lang}.js`,
            `window.ogs_languages = ${JSON.stringify(languages, undefined, 4)};\n` +
                `(window.ogs_locales = window.ogs_locales || {})['${lang}'] = ${json};\n` +
                `(window.ogs_countries = window.ogs_countries || {})['${lang}'] = ${country_json};\n` +
                `window.ogs_missing_translation_count = ${missing?.[lang] || 0};\n`,
        );
    }
}

async function asyncLoadPoFile(filename) {
    return new Promise((resolve, reject) => {
        PO.load(filename, (err, po) => {
            if (err) {
                reject(err);
            } else {
                resolve(po);
            }
        });
    });
}

main()
    .then(() => console.log("Done"))
    .catch((err) => console.log(err));
