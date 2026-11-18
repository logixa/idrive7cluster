'use strict';
/**
 * preview_tiles.js - draws the Cluster Tiles page as the cluster would (the centre's 1088x480 scene, its pieces
 * from pages.js through engine.js, the shaders run in WebGL 1 like tools/preview.js). Fails if a shader does not
 * compile.
 *   node tools/preview_tiles.js [--tiles oil,coolant,gearbox,consumption,iat,outside] [--engine on|off]
 *        [--look native|modern] [--fit clear|full] [--accent blue] [--style bar|arc|number] [--units metric|us] [--out tiles.png]
 */
const path = require('path');
const { FakeClient } = require('./scene');          // (also maps ./kit/ to kit/runtime)
const { render } = require('./preview');

const APP = path.join(__dirname, '..', 'apps', 'cluster_tiles');

function args(argv) {
    const a = { tiles: 'oil,coolant,gearbox,consumption,iat,outside', engine: 'on', fit: 'clear', look: 'native', accent: 'blue', style: 'bar', units: 'metric', out: 'tiles.png' };
    for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); a[k] = isNaN(Number(argv[i + 1])) ? argv[++i] : Number(argv[++i]); }
    return a;
}

/** Sample data for every reading, as a drive would have them (the engine running, or electric while it is off). */
function sample(a) {
    const on = a.engine !== 'off';
    const d = {
        speed: 97, rpm: on ? 2300 : 0, gear: 5, stage: 'D', oil: 94, coolant: 91, gearbox: 81, iat: 39, outside: 9, iatRise: 30, hpfp: 182, lpfp: 5.3,
        timing: 14.5, boostTarget: 0.92, boostActual: 0.88, torque: on ? 210 : 120, gLat: 0.14, gLong: 0.1, soc: 64, kw: on ? 6.5 : -9.2, battTemp: 27, battMin: 25, battMax: 29,
        pdDrive: 62, pdClimate: 26, pdSeats: 12, erange: 29, frange: 520, engineOn: on, fuelLevel: 31, fuelPct: 67, trange: 549,
        maf: 17.5, fuelRate: on ? 6.2 : undefined, loadActual: 44, loadTarget: 46, throttle: 21, pwrDrive: on ? 30 : 0, pwrRecup: on ? 0 : 55, steer: -12, yaw: 1.5,
        tyres: { p: { FL: 2.48, FR: 2.50, RL: 2.62, RR: 2.60 }, t: { FL: 24, FR: 25, RL: 27, RR: 26 } },
        consumptionKind: on ? 'fuel' : 'electric', fuelCons: 6.4, elecCons: on ? 14.2 : -9.8, regen: on ? 0 : 9.2, regenPct: on ? 0 : 55, drivePct: on ? 30 : 0,
    };
    d.consumption = on ? d.fuelCons : d.elecCons;
    ['FL', 'FR', 'RL', 'RR'].forEach((k) => { d['tyreP' + k] = d.tyres.p[k]; d['tyreT' + k] = d.tyres.t[k]; });
    return d;
}

if (require.main === module) {
    const a = args(process.argv.slice(2));
    const { startCluster } = require(path.join(APP, 'engine'));
    const { pieces, palette } = require(path.join(APP, 'pages'));
    const client = new FakeClient();
    const units = a.units === 'metric' ? { temp: 'c', press: 'bar', speed: 'kmh', torque: 'nm' } : { temp: 'f', press: 'psi', speed: 'mph', torque: 'lbft' };
    const o = { look: a.look, fit: a.fit, pages: ['tiles'], style: a.style, accent: a.accent, size: 'normal', units, warn: {}, slots: String(a.tiles).split(',') };
    const d = sample(a);
    const e = startCluster({ client, log: { info() {}, warn: (m) => console.error(m) }, target: 'map', contend: true,
        settleMs: 0, layout: () => ({ id: 'centre', pieces }), options: () => o,
        theme: () => palette(a.accent, a.look), font: () => (a.look === 'modern' ? 'bold' : 'light'), data: () => d, live: () => true, enabled: () => true, sweep: () => false, group: 'tiles' });
    // two minutes of driving first, on a made-up clock, so the trend lines have a past
    const now = Date.now, t0 = now(), base = Object.assign({}, d);
    let fake = t0 - 130000;
    Date.now = () => fake;
    for (let i = 0; i < 66 * 2; i++) {
        fake += 1000;
        const f = i / 132, wob = (v, b) => v + b * Math.sin(i / 7) + b * 0.5 * Math.sin(i / 2.3);
        Object.assign(d, { oil: base.oil - 14 * (1 - f) + wob(0, 1.2), coolant: base.coolant - 6 * (1 - f) + wob(0, 0.8), gearbox: base.gearbox - 10 * (1 - f) + wob(0, 1),
            iat: wob(base.iat, 4), consumption: Math.max(0, wob(base.consumption, 3)), soc: base.soc + 4 * (1 - f) });
        e._tick();
    }
    Object.assign(d, base);
    for (let i = 0; i < 40; i++) { fake += 40; e._tick(); }
    Date.now = now;
    const ls = Array.from(client.layers.values());
    const assets = {};
    ls.filter((l) => l.kind === 'asset').forEach((l) => { assets[l.ref] = { w: l.opts.w, h: l.opts.h, px: l.pixels.toString('base64') }; });
    const quads = ls.filter((l) => l.kind === 'effect' && l.opts.visible !== false).sort((x, y) => (x.opts.z - y.opts.z) || (x.ref - y.ref))
        .map((l) => ({ ref: l.ref, x: l.opts.x, y: l.opts.y, w: l.opts.w, h: l.opts.h, fs: l.opts.fs, uniforms: l.uniforms, binds: l.binds }));
    e.stop();
    render({ w: 1088, h: 480, quads, assets }, a.out, false).then((errors) => {
        if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
        console.log('wrote ' + path.resolve(a.out) + ' (' + quads.length + ' layers)');
        process.exit(0);
    }).catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { sample };
