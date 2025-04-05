const structuredClone = require("@ungap/structured-clone");

// Initialize the polyfill
global.structuredClone = structuredClone.default || structuredClone;

// Mock window and other globals
global.window = {
    ...global.window,
    structuredClone: global.structuredClone,
};

// Goban stuff
HTMLCanvasElement.prototype.getContext = () => {
    return {};
};
global.CLIENT = true;
