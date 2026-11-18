'use strict';
/**
 * scene.js - for the tools and tests: a stand-in for the cluster render client for the app's engine.js, that a stand-in for the cluster render
 * client that records what would be sent (layers, uniforms, binds, asset pixels, bytes), so the scene can
 * be checked and drawn (preview.js) without a car.
 */
const path = require('path');
const EventEmitter = require('events');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'apps', 'cluster_tiles');
/** The kit's runtime (canvas, fonts): KIT_DIR, else this repo's kit/runtime. */
const KIT = process.env.KIT_DIR || path.join(ROOT, 'kit', 'runtime');
const load = Module._load;
Module._load = function (req, parent, isMain) {
    if (req.startsWith('./kit/')) return load.call(this, path.join(KIT, req.slice(6)), parent, isMain);
    return load.call(this, req, parent, isMain);
};

class FakeClient extends EventEmitter {
    constructor() { super(); this.layers = new Map(); this.next = 1; this.bytes = 0; this.messages = 0; this.log = []; }
    _count(obj, extra) { this.messages++; this.bytes += JSON.stringify(obj).length + 5 + (extra || 0); this.log.push(obj); }
    connect() { this.connected = true; }
    close() { this.connected = false; }
    _add(kind, o) { const ref = this.next++; this.layers.set(ref, { ref, kind, opts: Object.assign({}, o), uniforms: {}, binds: {} }); this._count(Object.assign({ op: kind === 'asset' ? 'asset' : 'layer', kind }, o)); return ref; }
    effect(o) { return this._add('effect', o); }
    image(o) { return this._add('image', o); }
    asset(o) { return this._add('asset', o); }
    pixels(ref, rects, px) { const l = this.layers.get(ref); l.pixels = Buffer.from(px); this._count({ op: 'pixels', ref }, px.length); }
    uniform(ref, name, v, o) { const l = this.layers.get(ref); l.uniforms[name] = { v: v.slice(), type: o && o.type }; this._count({ op: 'uniform', ref, name, v: v.join(' ') }); }
    bind(ref, sampler, asset) { this.layers.get(ref).binds[sampler] = asset; this._count({ op: 'bind', ref, sampler, asset }); }
    set(ref, o) { Object.assign(this.layers.get(ref).opts, o); this._count(Object.assign({ op: 'set', ref }, o)); }
    drop(ref) { this.layers.delete(ref); this._count({ op: 'drop', ref }); }
    animate(ref, o) { const l = this.layers.get(ref); l.anims = l.anims || {}; const n = (l.nextAnim = (l.nextAnim || 0) + 1); l.anims[n] = o; this._count(Object.assign({ op: 'animate', ref, anim: n }, o)); return n; }
    stop(ref, anim) { const l = this.layers.get(ref); if (l && l.anims) delete l.anims[anim]; this._count({ op: 'stop', ref, anim }); }
    reset() { this.bytes = 0; this.messages = 0; this.log = []; }
}

const nullLog = { info() {}, warn() {}, error() {} };

module.exports = { FakeClient, APP, KIT };
