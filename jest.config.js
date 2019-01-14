module.exports = {
    "roots": [
        "<rootDir>/src/",
        "<rootDir>/tests/"
    ],
    "globals": {
        "CLIENT": true
    },
    modulePaths:[
        "<rootDir>/src",
        "<rootDir>/src/components",
        "<rootDir>/src/lib"
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    "testRegex": "(tests/.*|(\\.|/)(test|spec))\\.tsx?$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
}
