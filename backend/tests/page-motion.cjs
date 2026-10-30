const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '../public/js/keenko.js'), 'utf8');

function setup(reduce, supported = true) {
    let observer;
    let change;
    let calls = 0;
    let cancelled = 0;
    const section = { animate: () => { calls++; }, getAnimations: () => [{ cancel: () => { cancelled++; } }] };
    const media = { matches: reduce, addEventListener: (_, callback) => { change = callback; } };
    class Observer {
        constructor(callback) { this.callback = callback; this.observed = []; observer = this; }
        observe(element) { this.observed.push(element); }
        unobserve(element) { this.observed = this.observed.filter(item => item !== element); }
        disconnect() { this.observed = []; }
    }
    const window = { matchMedia: () => media };
    if (supported) window.IntersectionObserver = Observer;
    const document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [section] };
    vm.runInNewContext(script, { window, document, IntersectionObserver: Observer });
    return { observer: () => observer, section, change: value => { media.matches = value; change({ matches: value }); }, calls: () => calls, cancelled: () => cancelled };
}

const normal = setup(false);
assert.equal(normal.observer().observed.length, 1);
normal.observer().callback([{ isIntersecting: true, target: normal.section }], normal.observer());
assert.equal(normal.calls(), 1);
assert.equal(normal.observer().observed.length, 0);
normal.change(true);
assert.equal(normal.cancelled(), 1);
assert.equal(setup(true).observer(), undefined);
assert.equal(setup(false, false).observer(), undefined);
console.log('Page motion checks passed');
