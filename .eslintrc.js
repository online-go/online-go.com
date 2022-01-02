module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-jsdoc",
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
        // Recommended rules with errors
        // TODO: Fix these and re-enable them

        "@typescript-eslint/ban-types": "off", // 35 errors
        "@typescript-eslint/explicit-module-boundary-types": "off", // 2074 warnings
        "@typescript-eslint/no-empty-function": "off", // 14 errors
        "@typescript-eslint/no-empty-interface": "off", // 45 errors
        "@typescript-eslint/no-explicit-any": "off", // 535 warnings
        "@typescript-eslint/no-namespace": "off", // 1 error
        "@typescript-eslint/no-this-alias": "off", // 4 errors
        "@typescript-eslint/no-unused-vars": "off", // 675 warnings
        "@typescript-eslint/triple-slash-reference": "off", // 1 error

        "no-case-declarations": "off", // 3 errors
        "no-constant-condition": "off", // 1 error
        "no-empty": "off", // 30 errors
        "no-empty-pattern": "off", // 1 error
        "no-fallthrough": "off", // 3 errors
        "no-misleading-character-class": "off", // 2 errors
        "no-prototype-builtins": "off", // 8 errors
        "no-self-assign": "off", // 2 errors
        "no-useless-escape": "off", // 24 errors
        "prefer-spread": "off", // 7 errors

        //==============================================================


        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/member-delimiter-style": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-inferrable-types": [
            "error",
            {
                "ignoreParameters": true,
                "ignoreProperties": true
            }
        ],
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/semi": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "computed-property-spacing": ["error", "never"],
        "curly": "error",
        "eol-last": "error",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "id-denylist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/require-asterisk-prefix": "error",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-debugger": "error",
        "no-eval": "error",
        // Using the typescript-eslint version of this rule because of class
        // properties, which are not yet supported in ESLint.  For more info,
        // see: https://github.com/typescript-eslint/typescript-eslint/issues/491
        "@typescript-eslint/no-invalid-this": "error",
        "no-multiple-empty-lines": [
            "error",
            {
                "max": 3
            }
        ],
        "no-new-wrappers": "error",
        "no-tabs": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-unsafe-finally": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "one-var": [
            "error",
            "never"
        ],
        "prefer-arrow-callback": [
            "error",
            { "allowNamedFunctions": true }
        ],
        "use-isnan": "error",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "file-header": [
                        true,
                        "[Cc]opyright ([(][Cc][)])?\\s*\\d{4}"
                    ],
                    "import-spacing": true,
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-operator",
                        "check-separator"
                    ]
                }
            }
        ]
    },
    "overrides": [
        {
            "files": ["*.test.ts", "*.test.tsx"],
            // since test files are not part of tsconfig.json,
            // parserOptions.project must be unset
            "parserOptions": {
                "project": null,
            },
            "rules": {
                // rules that depend on type information (and therefore
                // parserOptions.project)
                "@typescript-eslint/no-floating-promises": "off",
                "@typescript-eslint/tslint/config": "off",
            }
        }
    ]
};
