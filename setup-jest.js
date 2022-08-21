global.window = window
global.$ = require('jquery');
global.jQuery = require("jquery");

// Goban stuff
HTMLCanvasElement.prototype.getContext = () => {
    return {};
};
global.CLIENT = true;