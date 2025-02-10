global.window = window

// Goban stuff
HTMLCanvasElement.prototype.getContext = () => {
    return {};
};
global.CLIENT = true;