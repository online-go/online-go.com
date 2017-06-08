/*
 * FuckAdBlock 3.2.1
 * Copyright (c) 2015 ValentinAllaire <valentin.allaire@sitexw.fr>
 * ReleasedundertheMITlicense
 * https://github.com/sitexw/FuckAdBlock
 */

export class FAdBlock {
    _options = null;
    _var = null;
    _bait = null;

    constructor(options) {
        this._options = {
            checkOnLoad:        false,
            resetOnEnd:            false,
            loopCheckTime:        50,
            loopMaxNumber:        5,
            baitClass:            'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links',
            baitStyle:            'width: 1px !important; height: 2px !important; position: absolute !important; left: -1000px !important; top: -1000px !important;',
            debug:                false
        };
        this._var = {
            version:            '3.2.1',
            bait:                null,
            checking:            false,
            loop:                null,
            loopNumber:            0,
            event:                { detected: [], notDetected: [] }
        };
        if (options !== undefined) {
            this.setOption(options);
        }
        setTimeout(() => {
            if (this._options.checkOnLoad === true) {
                if (this._options.debug === true) {
                    this._log('onload->eventCallback', 'A check loading is launched');
                }
                if (this._var.bait === null) {
                    this._creatBait();
                }
                setTimeout(() => {
                    this.check();
                }, 1);
            }
        }, 1);
    }

    _log(method, message) {
        console.log('[FAB][' + method + '] ' + message);
    }

    setOption(options, value?) {
        if (value !== undefined) {
            let key = options;
            options = {};
            options[key] = value;
        }
        for (let option in options) {
            this._options[option] = options[option];
            if (this._options.debug === true) {
                this._log('setOption', 'The option "' + option + '" he was assigned to "' + options[option] + '"');
            }
        }
        return this;
    }

    _creatBait() {
        let bait = document.createElement('div');
            bait.setAttribute('class', this._options.baitClass);
            bait.setAttribute('style', this._options.baitStyle);
        this._var.bait = window.document.body.appendChild(bait);

        this._var.bait.offsetParent;
        this._var.bait.offsetHeight;
        this._var.bait.offsetLeft;
        this._var.bait.offsetTop;
        this._var.bait.offsetWidth;
        this._var.bait.clientHeight;
        this._var.bait.clientWidth;

        if (this._options.debug === true) {
            this._log('_creatBait', 'Bait has been created');
        }
    }
    _destroyBait() {
        window.document.body.removeChild(this._var.bait);
        this._var.bait = null;

        if (this._options.debug === true) {
            this._log('_destroyBait', 'Bait has been removed');
        }
    }

    check(loop?) {
        if (loop === undefined) {
            loop = true;
        }

        if (this._options.debug === true) {
            this._log('check', 'An audit was requested ' + (loop === true ? 'with a' : 'without') + ' loop');
        }

        if (this._var.checking === true) {
            if (this._options.debug === true) {
                this._log('check', 'A check was canceled because there is already an ongoing');
            }
            return false;
        }
        this._var.checking = true;

        if (this._var.bait === null) {
            this._creatBait();
        }

        this._var.loopNumber = 0;
        if (loop === true) {
            this._var.loop = setInterval(() => {
                this._checkBait(loop);
            }, this._options.loopCheckTime);
        }
        setTimeout(() => {
            this._checkBait(loop);
        }, 1);
        if (this._options.debug === true) {
            this._log('check', 'A check is in progress ...');
        }

        return true;
    }
    _checkBait(loop) {
        let detected = false;

        if (this._var.bait === null) {
            this._creatBait();
        }

        if (window.document.body.getAttribute('abp') !== null
        || this._var.bait.offsetParent === null
        || this._var.bait.offsetHeight === 0
        || this._var.bait.offsetLeft === 0
        || this._var.bait.offsetTop === 0
        || this._var.bait.offsetWidth === 0
        || this._var.bait.clientHeight === 0
        || this._var.bait.clientWidth === 0) {
            detected = true;
        }
        if (window.getComputedStyle !== undefined) {
            let baitTemp = window.getComputedStyle(this._var.bait, null);
            if (baitTemp && (baitTemp.getPropertyValue('display') === 'none' || baitTemp.getPropertyValue('visibility') === 'hidden')) {
                detected = true;
            }
        }

        if (this._options.debug === true) {
            this._log('_checkBait', 'A check (' + (this._var.loopNumber + 1) + '/' + this._options.loopMaxNumber + ' ~' + (1 + this._var.loopNumber * this._options.loopCheckTime) + 'ms) was conducted and detection is ' + (detected === true ? 'positive' : 'negative'));
        }

        if (loop === true) {
            this._var.loopNumber++;
            if (this._var.loopNumber >= this._options.loopMaxNumber) {
                this._stopLoop();
            }
        }

        if (detected === true) {
            this._stopLoop();
            this._destroyBait();
            this.emitEvent(true);
            if (loop === true) {
                this._var.checking = false;
            }
        } else if (this._var.loop === null || loop === false) {
            this._destroyBait();
            this.emitEvent(false);
            if (loop === true) {
                this._var.checking = false;
            }
        }
    }
    _stopLoop() {
        clearInterval(this._var.loop);
        this._var.loop = null;
        this._var.loopNumber = 0;

        if (this._options.debug === true) {
            this._log('_stopLoop', 'A loop has been stopped');
        }
    }

    emitEvent(detected) {
        if (this._options.debug === true) {
            this._log('emitEvent', 'An event with a ' + (detected === true ? 'positive' : 'negative') + ' detection was called');
        }

        let fns = this._var.event[(detected === true ? 'detected' : 'notDetected')];
        for (let i in fns) {
            if (this._options.debug === true) {
                this._log('emitEvent', 'Call function ' + (parseInt(i) + 1) + '/' + fns.length);
            }
            if (fns.hasOwnProperty(i)) {
                fns[i]();
            }
        }
        if (this._options.resetOnEnd === true) {
            this.clearEvent();
        }
        return this;
    }
    clearEvent() {
        this._var.event.detected = [];
        this._var.event.notDetected = [];

        if (this._options.debug === true) {
            this._log('clearEvent', 'The event list has been cleared');
        }
    }

    on(detected, fn) {
        this._var.event[(detected === true ? 'detected' : 'notDetected')].push(fn);
        if (this._options.debug === true) {
            this._log('on', 'A type of event "' + (detected === true ? 'detected' : 'notDetected') + '" was added');
        }

        return this;
    }
    onDetected(fn) {
        return this.on(true, fn);
    }
    onNotDetected(fn) {
        return this.on(false, fn);
    }

}
