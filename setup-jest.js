import structuredClone from "@ungap/structured-clone";

global.window = window;
global.structuredClone = structuredClone;

// Goban stuff
HTMLCanvasElement.prototype.getContext = () => {
    return {};
};
global.CLIENT = true;
