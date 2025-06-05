const structuredClone = require("@ungap/structured-clone");
const { TextEncoder, TextDecoder } = require("util");

// Initialize the polyfill
global.structuredClone = structuredClone.default || structuredClone;

// Add TextEncoder and TextDecoder for React Router DOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
